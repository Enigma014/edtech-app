import React, { useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import Logo from "../components/Logo";
import RazorpayCheckout from "react-native-razorpay";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore"; // ADD THIS

type PlanType = "trial" | "yearly";

const BASE_URL = "https://us-central1-<PROJECT_ID>.cloudfunctions.net/api";
const CREATE_ORDER_URL = `${BASE_URL}/createOrder`;
const VERIFY_PAYMENT_URL = `${BASE_URL}/verifyPayment`;

const Subscription = ({ navigation }: { navigation: any }) => {
  const [selectedPlan, setSelectedPlan] = useState<PlanType | null>(null);
  const [loading, setLoading] = useState(false);

  // Function to calculate subscription end date
  const calculateEndDate = (planType: PlanType) => {
    const endDate = new Date();
    if (planType === "trial") {
      endDate.setDate(endDate.getDate() + 10); // 10-day trial
    } else if (planType === "yearly") {
      endDate.setFullYear(endDate.getFullYear() + 1); // 1 year
    }
    return endDate;
  };

  // Update Firestore after successful payment
  const updateUserSubscription = async (userId: string, planType: PlanType) => {
    try {
      const subscriptionEnd = calculateEndDate(planType);
      
      await firestore()
        .collection("users")
        .doc(userId)
        .update({
          isSubscribed: true,
          subscriptionPlan: planType,
          subscriptionStart: new Date(),
          subscriptionEnd: subscriptionEnd,
          lastPaymentDate: new Date(),
          paymentStatus: "active",
          // If you want to store Razorpay payment details:
          razorpay: {
            lastPaymentId: "", // Will be filled in the payment flow
            planType: planType,
          }
        });
      
      console.log("Firestore updated successfully for user:", userId);
      return true;
    } catch (error) {
      console.error("Error updating Firestore:", error);
      throw error;
    }
  };
  const DEVELOPMENT_MODE = true;
  const startSubscriptionPayment = async () => {
    if(DEVELOPMENT_MODE){
      Alert.alert(
        "Development Mode",
        "Skipping payment process in development mode.",
        [
          {
            text: "Continue to App",
            onPress: () => {
              navigation.replace("ChatScreen");
            },
          },
        ]
      );
      return;
    }
    if (!selectedPlan) {
      Alert.alert("Select a plan", "Please select a plan to continue.");
      return;
    }

    const user = auth().currentUser;
    if (!user) {
      Alert.alert("Error", "User not authenticated.");
      return;
    }

    const planConfig = {
      trial: {
        amount: 9900, // ₹99 in paise
        label: "10-Day Trial Subscription",
      },
      yearly: {
        amount: 149900, // ₹1499 in paise
        label: "1 Year Subscription",
      },
    };
    
    const plan = planConfig[selectedPlan];

    try {
      setLoading(true);

      // 1️⃣ Create Razorpay order
      const res = await fetch(CREATE_ORDER_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          amount: plan.amount,
          planType: selectedPlan,
          uid: user.uid,
        }),
      });

      const { order } = await res.json();

      // 2️⃣ Open Razorpay checkout
      const options = {
        key: "rzp_test_S27w8EM5VKZGdg", // PUBLIC KEY ONLY
        order_id: order.id,
        amount: order.amount,
        currency: "INR",
        name: "Your App Name",
        description: plan.label,
        prefill: {
          email: user.email || "",
          contact: "", // Add if you collect phone number
        },
        theme: { color: "#25d366" },
      };

      RazorpayCheckout.open(options)
        .then(async (data) => {
          console.log("Razorpay payment data:", data);
          
          // 3️⃣ Verify payment on backend
          const verifyRes = await fetch(VERIFY_PAYMENT_URL, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpay_order_id: data.razorpay_order_id,
              razorpay_payment_id: data.razorpay_payment_id,
              razorpay_signature: data.razorpay_signature,
              planType: selectedPlan,
              uid: user.uid,
            }),
          });

          const result = await verifyRes.json();
          console.log("Backend verification result:", result);

          if (result.success) {
            try {
              // ✅ CRITICAL: UPDATE FIRESTORE HERE
              await updateUserSubscription(user.uid, selectedPlan);
              
              // Also update with Razorpay payment ID if needed
              await firestore()
                .collection("users")
                .doc(user.uid)
                .update({
                  "razorpay.lastPaymentId": data.razorpay_payment_id,
                });
              
              Alert.alert(
                "Success! 🎉",
                "Your subscription has been activated.",
                [
                  {
                    text: "Continue to App",
                    onPress: () => {
                      // Navigate to main app screen, NOT LoginScreen
                      navigation.replace("ChatScreen");
                    },
                  },
                ]
              );
            } catch (firestoreError) {
              console.error("Firestore update failed:", firestoreError);
              // Even if Firestore fails, the payment succeeded
              Alert.alert(
                "Payment Successful",
                "Your payment was successful, but there was an issue updating your account. Please contact support.",
                [
                  {
                     text: "OK",
                     onPress: () => navigation.replace("ChatScreen"),
                    
                  },
                ]
              );
            }
          } else {
            Alert.alert("Payment Failed", "Payment verification failed. Please try again.");
          }
        })
        .catch((error) => {
          console.error("Razorpay error:", error);
          if (error.code === 2) {
            Alert.alert("Cancelled", "Payment was cancelled.");
          } else {
            Alert.alert("Error", "Something went wrong with the payment.");
          }
        })
        .finally(() => {
          setLoading(false);
        });
    } catch (err) {
      console.error("Payment initiation error:", err);
      Alert.alert("Error", "Something went wrong");
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Logo />
      <Text style={styles.header}>Choose Your Plan</Text>

      {/* Trial */}
      <TouchableOpacity
        style={[
          styles.card,
          selectedPlan === "trial" && styles.selectedCard,
        ]}
        onPress={() => setSelectedPlan("trial")}
        disabled={loading}
      >
        <Text style={styles.planTitle}>10-Day Trial</Text>
        <View style={styles.rightSection}>
          <Text style={styles.price}>₹99</Text>
          <Text style={styles.subtext}>Get started for less</Text>
        </View>
      </TouchableOpacity>

      {/* Yearly */}
      <TouchableOpacity
        style={[
          styles.card,
          selectedPlan === "yearly" && styles.selectedCard,
        ]}
        onPress={() => setSelectedPlan("yearly")}
        disabled={loading}
      >
        <Text style={styles.planTitle}>Yearly Subscription</Text>
        <View style={styles.rightSection}>
          <Text style={styles.price}>₹1499</Text>
          <Text style={styles.subtext}>Enjoy yearly access</Text>
        </View>
      </TouchableOpacity>

      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#25d366" />
          <Text style={styles.loadingText}>Processing payment...</Text>
        </View>
      )}

      <TouchableOpacity
        style={[styles.button, loading && styles.buttonDisabled]}
        onPress={startSubscriptionPayment}
        disabled={loading}
      >
        <Text style={styles.buttonText}>
          {loading ? "Processing..." : "Continue"}
        </Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1d2732",
    alignItems: "center",
    justifyContent: "flex-end",
    paddingBottom: 20,
  },
  header: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
    marginVertical: 20,
  },
  card: {
    backgroundColor: "#fff",
    width: "90%",
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#ddd",
  },
  selectedCard: {
    borderColor: "#25d366",
    borderWidth: 2,
    backgroundColor: "#f0fff4",
  },
  planTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#25d366",
    textAlign: "left",
  },
  rightSection: {
    alignItems: "flex-end",
  },
  price: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 4,
  },
  subtext: {
    fontSize: 14,
    color: "#555",
  },
  button: {
    backgroundColor: "#25d366",
    paddingVertical: 14,
    paddingHorizontal: 100,
    borderRadius: 25,
    marginTop: 300,
    width: "90%",
    alignItems: "center",
  },
  buttonDisabled: {
    backgroundColor: "#ccc",
  },
  buttonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",
  },
  loadingContainer: {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: [{ translateX: -50 }, { translateY: -50 }],
    alignItems: "center",
  },
  loadingText: {
    marginTop: 10,
    color: "#fff",
    fontSize: 14,
  },
});

export default Subscription;