// src/screens/Settings.tsx
import React, { useEffect, useState } from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Alert, ActivityIndicator } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import Navbar from "../../components/Navbar";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

const Settings = ({ navigation }: { navigation: any }) => {
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<{ name: string; bio: string; profilePic: string } | null>(null);

  const userId = auth().currentUser?.uid;

  // 🔥 Fetch user data from Firestore
  useEffect(() => {
    if (!userId) return;

    const unsubscribe = firestore()
      .collection("users")
      .doc(userId)
      .onSnapshot((doc) => {
        if (doc.exists) {
          setProfile(doc.data() as any);
        }
        setLoading(false);
      });

    return () => unsubscribe();
  }, [userId]);

  const handleOptionPress = (item: any) => {
    if (item.title === "Edit profile") {
      navigation.navigate("ProfileScreen", {
        name: profile?.name || "",
        bio: profile?.bio || "",
        profilePic: profile?.profilePic || "",
      });
    } else if (item.title === "Logout") {
      Alert.alert("Logout", "Are you sure you want to logout?", [
        { text: "Cancel", style: "cancel" },
        { text: "Logout", style: "destructive", onPress: () => auth().signOut() },
      ]);
    }
  };

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#25D366" />
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Image
            source={{ uri: profile?.profilePic || "https://i.pravatar.cc/150?img=3" }}
            style={styles.avatar}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.profileName}>{profile?.name || "Unknown"}</Text>
            <Text style={styles.profileStatus}>{profile?.bio || ""}</Text>
          </View>
        </View>

        {/* Settings Options */}
        <View style={styles.optionList}>
          {settingsOptions.map((item, index) => (
            <TouchableOpacity key={index} style={styles.optionItem} onPress={() => handleOptionPress(item)}>
              <Ionicons name={item.icon} size={22} color="#4a4a4a" />
              <View style={{ marginLeft: 15, flex: 1 }}>
                <Text style={styles.optionTitle}>{item.title}</Text>
                <Text style={styles.optionSubtitle}>{item.subtitle}</Text>
              </View>
            </TouchableOpacity>
          ))}
        </View>
      </ScrollView>
      <Navbar navigation={navigation} />
    </View>
  );
};

const settingsOptions = [
  { icon: "person-circle-outline", title: "Edit profile", subtitle: "Create, edit, profile photo" },
  { icon: "log-out-outline", title: "Logout", subtitle: "Logout" },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: { flexDirection: "row", alignItems: "center", padding: 15, borderBottomWidth: 0.5, borderBottomColor: "#ddd" },
  headerTitle: { fontSize: 24, fontWeight: "600", marginLeft: 4, marginTop: 28, marginBottom: 15, color: "#000" },
  profileSection: { flexDirection: "row", alignItems: "center", padding: 15, borderBottomWidth: 0.5, borderBottomColor: "#ddd" },
  avatar: { width: 55, height: 55, borderRadius: 30 },
  profileName: { fontSize: 16, fontWeight: "600", color: "#000" },
  profileStatus: { fontSize: 13, color: "#777" },
  optionList: { marginTop: 10 },
  optionItem: { flexDirection: "row", alignItems: "center", paddingVertical: 15, paddingHorizontal: 20, borderBottomWidth: 0.5, borderBottomColor: "#eee" },
  optionTitle: { fontSize: 15, fontWeight: "500", color: "#000" },
  optionSubtitle: { fontSize: 12, color: "#777", marginTop: 2 },
});

export default Settings;
