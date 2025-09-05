// src/screens/Chat.tsx
import React from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,

} from "react-native";
import { theme } from "../core/theme";
import Navbar from "../components/Navbar"; // Adjusted path if Navbar is in a subfolder

import Ionicons from "react-native-vector-icons/Ionicons";
import { TextInput } from "react-native";
import SearchBox from '../components/SearchBox';

interface ChatItem {
  id: string;
  name: string;
  message: string;
  time: string;
}

const chats: ChatItem[] = [
  { id: "1", name: "Jane", message: "Dear Students, The PPT h...", time: "16:18" },
  { id: "2", name: "Kim", message: "Okay 👍", time: "15:17" },
  { id: "3", name: "Lucas", message: "See you soon...", time: "14:49" },
  { id: "4", name: "Jane", message: "Dear Students, The PPT h...", time: "16:18" },
  { id: "5", name: "Kim", message: "Okay 👍", time: "15:17" },
  { id: "6", name: "Lucas", message: "See you soon...", time: "14:49" },
  { id: "7", name: "Jane", message: "Dear Students, The PPT h...", time: "16:18" },
  { id: "8", name: "Kim", message: "Okay 👍", time: "15:17" },
  { id: "9", name: "Lucas", message: "See you soon...", time: "14:49" },
  
];

const Chat = ({navigation}: { navigation: any }) => {
  const renderItem = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity
      style={{
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 15,
        paddingVertical: 12,
        borderBottomWidth: 0.5,
        borderBottomColor: "#ddd",
      }}
    >
      <View
        style={{
          width: 45,
          height: 45,
          borderRadius: 25,
          backgroundColor: "#ccc",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Text style={{ fontWeight: "bold", color: "#fff" }}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={{ flex: 1, marginLeft: 12 }}>
        <Text style={{ fontSize: 16, fontWeight: "500" }}>{item.name}</Text>
        <Text style={{ fontSize: 14, color: "#555" }} numberOfLines={1}>
          {item.message}
        </Text>
      </View>

      <Text style={{ fontSize: 12, color: "#999" }}>{item.time}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <Text style={styles.sectionTitle}>Chats</Text>
      <SearchBox />
      
      {/* Tabs row */}
      <View
        style={{
          flexDirection: "row",
          justifyContent: "space-around",
          marginBottom: 10,
        }}
      >
        {/* <Text style={{ fontWeight: "bold", color: "#000" }}>All</Text>
        <Text style={{ color: "#555" }}>Unread 12</Text>
        <Text style={{ color: "#555" }}>Favourites</Text>
        <Text style={{ color: "#555" }}>Groups 4</Text> */}
      </View>

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
      />
      <Navbar navigation={navigation} />
    </View>
  );
};



const styles = StyleSheet.create({
  container: { flex: 1},
  sectionTitle: {
    fontSize: 24, fontWeight: "600", marginLeft: 20,marginTop:40,marginBottom:15, color: "#25d366"
  },
  updateCard: {
    backgroundColor: theme.colors.primary,
    margin: 16,
    padding: 20,
    borderRadius: 12,
  },
  updateDate: { color: "#eee", fontSize: 12 },
  updateTitle: { color: "#fff", fontSize: 18, fontWeight: "700", marginTop: 4 },
  updateDesc: { color: "#fff", fontSize: 14, marginTop: 6 },
  watchButton: {
    marginTop: 10,
    backgroundColor: "#222",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignSelf: "flex-start",
  },
  watchText: { color: "#fff", fontWeight: "600" },
  // searchContainer: {
  //   flexDirection: "row",
  //   padding: 8,
  //   alignItems: "center",
  //   backgroundColor: "#222",
  //   borderRadius: 8,
  //   paddingHorizontal: 20,
  //   margin: 16,
  //   marginTop: 45,
  // },
  // searchInput: { flex: 1, padding: 8, color: "#fff" },
});

export default Chat;
