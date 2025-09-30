import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,TouchableWithoutFeedback,
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

interface UserItem {
  id: string;
  name: string;
}

const Chat = ({ navigation }: { navigation: any }) => {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  useEffect(() => {
    // Fetch chats in real-time
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

    // Fetch all registered users once
    firestore()
      .collection("users")
      .get()
      .then((snapshot) => {
        const userData: UserItem[] = snapshot.docs.map((doc) => ({
          id: doc.id,
          name: doc.data().name || "Unknown",
        }));
        setUsers(userData);
      });

    return () => unsubscribe();
  }, []);

  const renderChatItem = ({ item }: { item: ChatItem }) => (
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

  const renderUserItem = ({ item }: { item: UserItem }) => (
    <TouchableOpacity
      style={styles.userRow}
      onPress={() => {
        setShowUsersModal(false);
        navigation.navigate("ChatDetailScreen", { chatId: item.id, name: item.name });
      }}
    >
      <Text style={styles.userName}>{item.name}</Text>
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
            onPress={() => console.log("Create Group")}
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
      />

      {/* Floating + Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowUsersModal(true)}
      >
        <Icon  name="plus" size={28} color="#fff" />
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
            <Text style={styles.modalTitle}>All Users</Text>
            <FlatList
              data={users}
              keyExtractor={(item) => item.id}
              renderItem={renderUserItem}
            />
            <TouchableOpacity onPress={() => setShowUsersModal(false)} style={styles.modalClose}>
              <Text style={{ color: "#25D366" }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      <Navbar navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({

  loader: { flex: 1, justifyContent: "center", alignItems: "center" },
  sectionTitle: { fontSize: 24, fontWeight: "600", marginLeft: 20, marginTop: 40, marginBottom: 15, color: "#25d366" },
  chatRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 15, paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: "#ddd" },
  avatar: { width: 45, height: 45, borderRadius: 25, backgroundColor: "#ccc", alignItems: "center", justifyContent: "center" },
  avatarText: { fontWeight: "bold", color: "#fff" },
  chatContent: { flex: 1, marginLeft: 12 },
  chatName: { fontSize: 16, fontWeight: "500" },
  chatMessage: { fontSize: 14, color: "#555" },
  chatTime: { fontSize: 12, color: "#999" },
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
    top: 50, // Adjust to appear over SearchBox
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
  menuItem: { padding: 12 },
  modalContent: { width: "80%", backgroundColor: "#fff", borderRadius: 10, padding: 20, maxHeight: "70%" },
  modalTitle: { fontSize: 18, fontWeight: "600", marginBottom: 10 },
  userRow: { paddingVertical: 12, borderBottomWidth: 0.5, borderBottomColor: "#ccc" },
  userName: { fontSize: 16 },
  modalClose: { marginTop: 10, alignItems: "center" },
  
});

export default Chat;
