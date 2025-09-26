import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";
import Logo from "../components/Logo";


const Subscription = ({ navigation }: { navigation: any }) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <Logo />
      <Text style={styles.header}>Choose Your Plan</Text>

      {/* Trial Option */}
      <View style={styles.card}>
      <View style={styles.leftSection}>
    <Text style={styles.planTitle}>10-Day Trial</Text>
  </View>

  <View style={styles.rightSection}>
    <Text style={styles.price}>₹99</Text>
    <Text style={styles.subtext}>Get started for less</Text>
  </View>
      </View>

      {/* Lifetime Option */}
      {/* Lifetime Option */}
<View style={styles.card}>
  <View style={styles.leftSection}>
    <Text style={styles.planTitle}>Lifetime Subscription</Text>
  </View>

  <View style={styles.rightSection}>
    <Text style={styles.price}>₹1499.00</Text>
    <Text style={styles.subtext}>Enjoy lifetime access</Text>
  </View>
</View>


      {/* Button */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.replace("LoginScreen")} // redirect after choosing
      >
        <Text style={styles.buttonText}>Continue</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#1d2732", // dark grey background
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
    width: "100%", // narrower card
    padding: 16,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    flexDirection: "row",   // row layout
    justifyContent: "space-between",
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#000",
    boxShadow: "0 2px 4px rgba(0,0,0,0.1)",

  },
  
  leftSection: {
    flex: 1,
    alignItems: "flex-start",
  },
  
  planTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: "#25d366",
    textAlign: "left",
  },
  
  rightSection: {
    alignItems: "flex-end", // stack to the right
  },
  
  price: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 4,
    textAlign: "right",
  },
  
  subtext: {
    fontSize: 14,
    color: "#555",
    textAlign: "right",
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
  buttonText: {
    fontSize: 16,
    color: "#fff",
    fontWeight: "600",

    
  },
});

export default Subscription;
