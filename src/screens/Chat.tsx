// src/screens/Chat.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Navbar from "../components/Navbar";
import SearchBox from "../components/SearchBox";
import { theme } from "../core/theme";

interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  updatedAt: string;
}

const Chat = ({ navigation }: { navigation: any }) => {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 👇 Listen to Firebase for real-time updates
    const unsubscribe = firestore()
      .collection("chats")
      .orderBy("updatedAt", "desc")
      .onSnapshot((snapshot) => {
        const chatData: ChatItem[] = snapshot.docs.map((doc) => {
          const data = doc.data();
          return {
            id: doc.id,
            name: data.name || "Unknown",
            lastMessage: data.lastMessage || "",
            updatedAt: data.updatedAt?.toDate().toLocaleTimeString() || "",
          };
        });
        setChats(chatData);
        setLoading(false);
      });

    return () => unsubscribe();
  }, []);

  const renderItem = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("ChatDetailScreen", {
          chatId: item.id,
          name: item.name,
        })
      }
      style={styles.chatRow}
    >
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name.charAt(0).toUpperCase()}
        </Text>
      </View>

      <View style={styles.chatContent}>
        <Text style={styles.chatName}>{item.name}</Text>
        <Text style={styles.chatMessage} numberOfLines={1}>
          {item.lastMessage}
        </Text>
      </View>

      <Text style={styles.chatTime}>{item.updatedAt}</Text>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      <View style={{ flexDirection: "row" }}>
        <Text style={styles.sectionTitle}>Chats</Text>
        <Icon
          style={{ top: 45, marginLeft: 280 }}
          name="dots-vertical"
          size={28}
          color="gray"
        />
      </View>

      <SearchBox />

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
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: "600",
    marginLeft: 20,
    marginTop: 40,
    marginBottom: 15,
    color: "#25d366",
  },
  chatRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 15,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#ccc",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontWeight: "bold",
    color: "#fff",
  },
  chatContent: {
    flex: 1,
    marginLeft: 12,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "500",
  },
  chatMessage: {
    fontSize: 14,
    color: "#555",
  },
  chatTime: {
    fontSize: 12,
    color: "#999",
  },
});

export default Chat;
