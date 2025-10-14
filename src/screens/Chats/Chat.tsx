import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,TouchableWithoutFeedback,
  Alert,
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Navbar from "../../components/Navbar";
import SearchBox from "../../components/SearchBox";
import { theme } from "../../core/theme";
import auth from "@react-native-firebase/auth";

interface ChatItem {
  id: string;
  name: string;
  lastMessage: string;
  updatedAt: string;
  isGroup?: boolean;
}

interface UserItem {
  id: string;
  name: string;
  email: string;
}

const ChatScreen = ({ navigation }: { navigation: any }) => {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }
  
    const currentUid = currentUser.uid;
  
    // ✅ Users listener
    const unsubscribeUsers = firestore()
      .collection("users")
      .onSnapshot((snapshot) => {
        const userList = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            return data.uid !== currentUid
              ? {
                  id: data.uid,
                  name: data.name || "Unnamed",
                  lastMessage: data.lastMessage || "",
                  updatedAt: data.lastMessageTime
                    ? data.lastMessageTime.toDate().toLocaleTimeString()
                    : "",
                  isGroup: false,
                }
              : null;
          })
          .filter(Boolean);
        setChats((prev) => mergeChats(prev, userList)); // ✅ merge users
      });
  
    // ✅ Groups listener
    const unsubscribeGroups = firestore()
      .collection("groups")
      .where("members", "array-contains", currentUid)
      .onSnapshot((snapshot) => {
        const groupData = snapshot.docs.map((doc) => {
          const data = doc.data() || {};
          return {
            id: doc.id,
            name: data.name || "Unnamed Group",
            lastMessage: data.lastMessage || "",
            updatedAt: data.lastMessageTime
              ? data.lastMessageTime.toDate().toLocaleTimeString()
              : data.createdAt
              ? data.createdAt.toDate().toLocaleTimeString()
              : "",
            isGroup: true,
          };
        });
        setChats((prev) => mergeChats(prev, groupData)); // ✅ merge groups
      });
  
    // ✅ Chats listener (DMs)
    const unsubscribeChats = firestore()
      .collection("chats")
      .where("participants", "array-contains", currentUid)
      .orderBy("updatedAt", "desc")
      .onSnapshot(async (snapshot) => {
        if (!snapshot) return;
  
        const chatData = await Promise.all(
          snapshot.docs.map(async (doc) => {
            const data = doc.data() || {};
            const participants = Array.isArray(data.participants)
              ? data.participants
              : [];
            const otherUserId = participants.find((uid) => uid !== currentUid);
            let chatName = "Unknown";
  
            if (otherUserId) {
              try {
                const userDoc = await firestore()
                  .collection("users")
                  .doc(otherUserId)
                  .get();
                const userInfo = userDoc.data();
                chatName =
                  userInfo?.displayName ||
                  userInfo?.name ||
                  userInfo?.email ||
                  "Unknown";
              } catch (err) {
                chatName = "Error Loading";
              }
            } else {
              chatName = "Me";
            }
  
            return {
              id: doc.id,
              name: chatName,
              lastMessage: data.lastMessage || "",
              updatedAt: data.updatedAt
                ? data.updatedAt.toDate().toLocaleTimeString()
                : "",
              isGroup: false,
            };
          })
        );
  
        setChats((prev) => mergeChats(prev, chatData)); // ✅ merge DMs safely
      });
  
    // ✅ Cleanup (no memory leaks!)
    return () => {
      unsubscribeChats();
      unsubscribeGroups();
      unsubscribeUsers();
    };
  }, []); // ⚠️ Fix: remove [currentUid] dependency
  
  
  // ✅ Merges chats (groups + DMs) and keeps only one entry per id, sorted by latest time
  function mergeChats(prevChats, newChats) {
    const map = new Map();
  
    [...prevChats, ...newChats].forEach((chat) => {
      map.set(chat.id, chat);
    });
  
    const merged = Array.from(map.values());
  
    return merged.sort((a, b) => {
      const aTime = new Date(a.updatedAt).getTime() || 0;
      const bTime = new Date(b.updatedAt).getTime() || 0;
      return bTime - aTime; // newest on top
    });
  }

  // ✅ Fixed: Proper chat creation function
  const startChatWithUser = async (user: UserItem) => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      Alert.alert("Error", "Please log in again");
      return;
    }
    
    setShowUsersModal(false);
    
    try {
      // Check if chat already exists between these two users
      const existingChatQuery = await firestore()
        .collection("chats")
        .where("participants", "array-contains", currentUser.uid)
        .get();

      let existingChatId = null;
      
      // Look for a chat that has exactly these two participants
      existingChatQuery.docs.forEach(doc => {
        const data = doc.data();
        const participants = data.participants || [];
        if (participants.includes(user.id) && participants.length === 2) {
          existingChatId = doc.id;
        }
      });

      if (existingChatId) {
        // Chat exists, navigate to it
        navigation.navigate("ChatDetailScreen", {
          chatId: existingChatId,
          name: user.name,
          contactId: user.id,     // ✅ ADD THIS
          isGroup: false,         // ✅ ADD THIS
        });
      } else {
        // Create new chat
        const newChatRef = await firestore().collection("chats").add({
          participants: [currentUser.uid, user.id],
          lastMessage: "",
          updatedAt: firestore.FieldValue.serverTimestamp(),
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

        navigation.navigate("ChatDetailScreen", {
          chatId: newChatRef.id,
          name: user.name,
          contactId: user.id,     // ✅ ADD THIS
          isGroup: false,         // ✅ ADD THIS
        });
      }
    } catch (error) {
      console.error("Error starting chat:", error);
      Alert.alert("Error", "Failed to start chat: " + error.message);
    }
  };

  const renderChatItem = ({ item }: { item: ChatItem }) => (
    <TouchableOpacity
      onPress={() =>
        navigation.navigate("ChatDetailScreen", {
          chatId: item.id,
          name: item.name,
          isGroup: item.isGroup || false,  // ✅ ADD THIS - use the isGroup property from your data
        contactId: item.isGroup ? undefined : item.id, // ✅ ADD THIS - for individual chats
          
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

  const renderUserItem = ({ item }: { item: UserItem }) => (
    <TouchableOpacity
      style={styles.userRow}
      onPress={() => startChatWithUser(item)}
    >
      
      <View style={styles.avatar}>
        <Text style={styles.avatarText}>
          {item.name?.charAt(0).toUpperCase() || "U"}
        </Text>
      </View>
  
      <View style={styles.chatContent}>
        <Text style={styles.chatName}>{item.name}</Text>
        <Text style={styles.chatMessage}>Tap to chat</Text>
      </View>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator size="large" color={theme.colors.primary} />
        <Text style={styles.loadingText}>Loading chats...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: "#fff" }}>
      {/* Header with section title + menu */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={styles.sectionTitle}>Chats</Text>
        <TouchableOpacity
          style={{ padding: 10, marginRight: 10 ,marginTop: 8}}
          onPress={() => setShowMenu(!showMenu)}
        >
          <Icon name="dots-vertical" size={28} color="gray" />
        </TouchableOpacity>
      </View>

      {/* Menu popover with outside click handling */}
      {showMenu && (
        <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
          <View style={styles.menuOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuPopover}>
              <TouchableOpacity
  style={styles.menuItem}
  onPress={() => {
    setShowMenu(false); // hide the menu
    navigation.navigate("SelectMembersScreen", {
      groupName: "",  // optionally pre-fill or leave empty for now
      groupPic: null, // optionally pre-fill or leave null

    });
  }}
>
  <Text>Create Group</Text>
</TouchableOpacity>

                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => console.log("Create Community")}
                >
                  <Text>Create Community</Text>
                </TouchableOpacity>
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}

      <SearchBox />

      <FlatList
        data={chats}
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No chats yet</Text>
            <Text style={styles.emptySubtext}>Tap the + button to start a conversation</Text>
          </View>
        }
      />

      {/* Floating + Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowUsersModal(true)}
      >
        <Icon name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      {/* Users Modal */}
      <Modal
        visible={showUsersModal}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowUsersModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Start New Chat</Text>
            <FlatList
              data={users}
              keyExtractor={(item) => item.id}
              renderItem={renderUserItem}
              showsVerticalScrollIndicator={false}
              ListEmptyComponent={
                <Text style={styles.emptyText}>No other users found</Text>
              }
            />
            <TouchableOpacity 
              onPress={() => setShowUsersModal(false)} 
              style={styles.modalCloseButton}
            >
              <Text style={styles.modalCloseText}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Navbar navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    maxHeight: "75%",
    elevation: 10,
  },
  modalTitle: {
    fontSize: 22,
    fontWeight: "600",
    color: "#25D366",
    marginBottom: 15,
    textAlign: "center",
  },
  userRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: "#eee",
  },
  modalCloseButton: {
    marginTop: 15,
    padding: 12,
    alignItems: "center",
    backgroundColor: "#f0f0f0",
    borderRadius: 8,
  },
  modalCloseText: {
    color: "#25D366",
    fontWeight: "600",
  },
  avatar: {
    width: 45,
    height: 45,
    borderRadius: 25,
    backgroundColor: "#25D366",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarText: {
    fontWeight: "bold",
    color: "#fff",
    fontSize: 18,
  },
  chatContent: {
    flex: 1,
    marginLeft: 12,
  },
  chatName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
  },
  chatMessage: {
    fontSize: 14,
    color: "#555",
  },
  loader: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center" 
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  sectionTitle: { 
    fontSize: 24, 
    fontWeight: "600", 
    marginLeft: 20, 
    marginTop: 40, 
    marginBottom: 15, 
    color: "#25d366" 
  },
  chatRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 15, 
    paddingVertical: 12, 
    borderBottomWidth: 0.5, 
    borderBottomColor: "#ddd" 
  },
  chatTime: { 
    fontSize: 12, 
    color: "#999" 
  },
  fab: {
    position: "absolute",
    bottom: 88,
    right: 20,
    backgroundColor: "#25D366",
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: "center",
    alignItems: "center",
    elevation: 5,
  },
  menuOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: "transparent",
    zIndex: 10,
  },
  menuPopover: {
    position: "absolute",
    top: 50,
    right: 15,
    backgroundColor: "#fff",
    borderRadius: 8,
    elevation: 5,
    paddingVertical: 5,
    width: 160,
    zIndex: 11,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  menuItem: { 
    padding: 12 
  },
  emptyContainer: {
    alignItems: "center",
    justifyContent: "center",
    padding: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
    marginTop: 8,
  },
});

export default ChatScreen;