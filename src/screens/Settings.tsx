// src/screens/Settings.tsx
import React from "react";
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image } from "react-native";
import Ionicons from "react-native-vector-icons/Ionicons";
import Navbar from "../components/Navbar";
const Settings = ({navigation}: { navigation: any }) => {
  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        {/* <TouchableOpacity>
          <Ionicons name="arrow-back" size={22} color="#000" style={{marginTop:40,marginBottom:15}}/>
        </TouchableOpacity> */}
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView contentContainerStyle={{ paddingBottom: 30 }}>
        

        {/* Profile Section */}
        <View style={styles.profileSection}>
          <Image
            source={{ uri: "https://i.pravatar.cc/150?img=3" }} // Placeholder avatar
            style={styles.avatar}
          />
          <View style={{ flex: 1, marginLeft: 12 }}>
            <Text style={styles.profileName}>Jack</Text>
            <Text style={styles.profileStatus}>⚽️</Text>
          </View>
          {/* <Ionicons name="qr-code-outline" size={22} color="#1c1c1c" style={{ marginRight: 15 }} />
          <Ionicons name="add-circle-outline" size={22} color="#1c1c1c" /> */}
        </View>

        {/* Settings Options */}
        <View style={styles.optionList}>
          {settingsOptions.map((item, index) => (
            <TouchableOpacity key={index} style={styles.optionItem}>
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
  { icon: "key-outline", title: "Account", subtitle: "Security notifications, change number" },
  { icon: "lock-closed-outline", title: "Privacy", subtitle: "Block contacts, disappearing messages" },
  { icon: "person-circle-outline", title: "Avatar", subtitle: "Create, edit, profile photo" },
  { icon: "people-outline", title: "Lists", subtitle: "Manage people and groups" },
  { icon: "chatbubble-ellipses-outline", title: "Chats", subtitle: "Theme, wallpapers, chat history" },
  { icon: "notifications-outline", title: "Notifications", subtitle: "Message, group & call tones" },
  // { icon: "cloud-outline", title: "Storage and data", subtitle: "Network usage, auto-download" },
  // { icon: "accessibility-outline", title: "Accessibility", subtitle: "Increase contrast, animation" },
];

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#fff" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  headerTitle: { fontSize: 24, fontWeight: "600", marginLeft: 4,marginTop:28,marginBottom:15, color: "#000" },

  infoCard: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d9fdd3",
    margin: 15,
    padding: 12,
    borderRadius: 8,
  },
  infoTitle: { fontWeight: "600", color: "#000", fontSize: 14 },
  infoSubtitle: { color: "#333", fontSize: 12 },
  infoAction: { color: "#007b00", fontWeight: "600", fontSize: 13 },

  profileSection: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  avatar: { width: 55, height: 55, borderRadius: 30 },
  profileName: { fontSize: 16, fontWeight: "600", color: "#000" },
  profileStatus: { fontSize: 13, color: "#777" },

  optionList: { marginTop: 10 },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 15,
    paddingHorizontal: 20,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  optionTitle: { fontSize: 15, fontWeight: "500", color: "#000" },
  optionSubtitle: { fontSize: 12, color: "#777", marginTop: 2 },
});

export default Settings;
