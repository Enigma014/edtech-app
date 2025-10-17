import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialIcons";
import firestore from "@react-native-firebase/firestore";
import { authService } from "../../utils/firebaseConfig";

export default function ListUsers({ navigation }) {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const currentUser = authService.currentUser;

  useEffect(() => {
    if (!currentUser?.uid) return;

    const unsubscribe = firestore()
      .collection("users")
      .onSnapshot(
        (snapshot) => {
          const usersData = snapshot.docs
            .map((doc) => ({
              id: doc.id,
              ...doc.data(),
            }))
            .filter((user) => user.id !== currentUser.uid); // exclude current user

          setUsers(usersData);
          setLoading(false);
        },
        (error) => {
          console.error("Error fetching users:", error);
          Alert.alert("Error", "Failed to load users");
          setLoading(false);
        }
      );

    return () => unsubscribe();
  }, [currentUser?.uid]);

  const openChatWithUser = async (user) => {
    try {
      // Check if chat already exists between the two users
      const chatQuery = await firestore()
        .collection("chats")
        .where("isGroupChat", "==", false)
        .where("participants", "array-contains", currentUser.uid)
        .get();

      let existingChat = null;

      chatQuery.forEach((doc) => {
        const data = doc.data();
        if (data.participants.includes(user.id)) {
          existingChat = { id: doc.id, ...data };
        }
      });

      if (existingChat) {
        // ✅ FIXED: Pass correct parameters to ChatDetailScreen
        navigation.navigate("ChatDetailScreen", {
          chatId: existingChat.id,
          name: user.name || "Unknown",
          contactId: user.id,
          isGroup: false,
          receiverId: user.id, // Add receiverId for message sending
        });
      } else {
        // Create new private chat
        const newChatRef = await firestore().collection("chats").add({
          participants: [currentUser.uid, user.id],
          isGroupChat: false,
          createdAt: firestore.FieldValue.serverTimestamp(),
          lastMessage: "",
          lastMessageTime: firestore.FieldValue.serverTimestamp(),
        });

        // ✅ FIXED: Pass correct parameters to ChatDetailScreen
        navigation.navigate("ChatDetailScreen", {
          chatId: newChatRef.id,
          name: user.name || "Unknown",
          contactId: user.id,
          isGroup: false,
          receiverId: user.id, // Add receiverId for message sending
        });
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      Alert.alert("Error", "Could not open chat");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#25D366" />
        <Text>Loading users...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Select User to Chat</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Users List */}
      <FlatList
        data={users}
        keyExtractor={(item) => item.id}
        style={styles.groupsList}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.groupItem}
            onPress={() => openChatWithUser(item)}
          >
            <View style={styles.groupInfo}>
              <View style={styles.groupAvatar}>
                <Text style={styles.groupAvatarText}>
                  {item.name?.[0]?.toUpperCase() || "U"}
                </Text>
              </View>
              <View style={styles.groupDetails}>
                <Text style={styles.groupName}>{item.name || "Unknown User"}</Text>
                <Text style={styles.groupMembers}>{item.email}</Text>
              </View>
            </View>
            <Icon name="chevron-right" size={24} color="#ccc" />
          </TouchableOpacity>
        )}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Icon name="person" size={50} color="#ccc" />
            <Text style={styles.emptyText}>No users found</Text>
            <Text style={styles.emptySubtext}>
              Try again later or check your connection.
            </Text>
          </View>
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 35,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "bold",
  },
  groupsList: {
    flex: 1,
    paddingHorizontal: 20,
  },
  groupItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  groupInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  groupAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#25D366",
    justifyContent: "center",
    alignItems: "center",
    marginRight: 15,
  },
  groupAvatarText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 18,
  },
  groupDetails: {
    flex: 1,
  },
  groupName: {
    fontSize: 16,
    fontWeight: "500",
    marginBottom: 4,
  },
  groupMembers: {
    fontSize: 14,
    color: "#666",
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginTop: 10,
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    marginTop: 5,
    textAlign: "center",
    lineHeight: 20,
  },
});