import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  TouchableWithoutFeedback,
  Alert,
  Animated,
  PanResponder,
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
  name?: string;
  email?: string;
  uid?: string;
}

const Chat = ({ navigation }: { navigation: any }) => {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);

  // ✅ User fetching logic
  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser || !showUsersModal) return;
  
    const currentUserId = currentUser.uid;
  
    const unsubscribe = firestore().collection("users").onSnapshot(snapshot => {
      const allUsers = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      const filteredUsers = allUsers.filter(user => user.id !== currentUserId);
      setUsers(filteredUsers);
      console.log("Users loaded:", filteredUsers.length);
    });
  
    return unsubscribe;
  }, [showUsersModal]);
  

  // ✅ FIXED: Chat fetching with proper error handling
  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const currentUid = currentUser.uid;
    setLoading(true);

    let chatsLoaded = false;
    let groupsLoaded = false;

    const checkAllLoaded = () => {
      if (chatsLoaded && groupsLoaded) {
        setLoading(false);
      }
    };

    // ✅ Groups listener
    const unsubscribeGroups = firestore()
      .collection("groups")
      .where("members", "array-contains", currentUid)
      .onSnapshot(
        (snapshot) => {
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
          setChats((prev) => mergeChats(prev, groupData));
          groupsLoaded = true;
          checkAllLoaded();
        },
        (error) => {
          console.error("Error loading groups:", error);
          groupsLoaded = true;
          checkAllLoaded();
        }
      );

    // ✅ Chats listener (DMs)
    const unsubscribeChats = firestore()
      .collection("chats")
      .where("participants", "array-contains", currentUid)
      .orderBy("updatedAt", "desc")
      .onSnapshot(
        async (snapshot) => {
          try {
            if (!snapshot) {
              chatsLoaded = true;
              checkAllLoaded();
              return;
            }

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

            setChats((prev) => mergeChats(prev, chatData));
          } catch (error) {
            console.error("Error processing chats:", error);
          } finally {
            chatsLoaded = true;
            checkAllLoaded();
          }
        },
        (error) => {
          console.error("Error loading chats:", error);
          chatsLoaded = true;
          checkAllLoaded();
        }
      );

    // ✅ Safety timeout - if loading takes too long, force stop loading
    const timeoutId = setTimeout(() => {
      setLoading(false);
    }, 10000);

    return () => {
      clearTimeout(timeoutId);
      unsubscribeChats();
      unsubscribeGroups();
    };
  }, []);

  function mergeChats(prevChats: ChatItem[], newChats: ChatItem[]) {
    const map = new Map();
    [...prevChats, ...newChats].forEach((chat) => {
      map.set(chat.id, chat);
    });
    const merged = Array.from(map.values());
    return merged.sort((a, b) => {
      const aTime = new Date(a.updatedAt).getTime() || 0;
      const bTime = new Date(b.updatedAt).getTime() || 0;
      return bTime - aTime;
    });
  }

  const deleteChatThread = async (chatId: string, chatName: string) => {
    Alert.alert(
      "Delete Chat",
      `Are you sure you want to delete your chat with ${chatName}? This action cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              await firestore().collection("chats").doc(chatId).delete();
              setChats(prev => prev.filter(chat => chat.id !== chatId));
              Alert.alert("Success", "Chat deleted successfully");
            } catch (error) {
              console.error("Error deleting chat:", error);
              Alert.alert("Error", "Failed to delete chat");
            }
          },
        },
      ]
    );
  };

  const startChatWithUser = async (user: UserItem) => {
    console.log('Starting chat with:', user.name);
    const currentUser = auth().currentUser;
    if (!currentUser) {
      Alert.alert("Error", "Please log in again");
      return;
    }
    
    setShowUsersModal(false);
    
    try {
      const existingChatQuery = await firestore()
        .collection("chats")
        .where("participants", "array-contains", currentUser.uid)
        .get();

      let existingChatId = null;
      
      existingChatQuery.docs.forEach(doc => {
        const data = doc.data();
        const participants = data.participants || [];
        if (participants.includes(user.id) && participants.length === 2) {
          existingChatId = doc.id;
        }
      });

      if (existingChatId) {
        console.log('Existing chat found:', existingChatId);
        navigation.navigate("ChatDetailScreen", {
          chatId: existingChatId,
          name: user.name,
          contactId: user.id,
          isGroup: false,
        });
      } else {
        console.log('Creating new chat with:', user.name);
        const newChatRef = await firestore().collection("chats").add({
          participants: [currentUser.uid, user.id],
          lastMessage: "",
          updatedAt: firestore.FieldValue.serverTimestamp(),
          createdAt: firestore.FieldValue.serverTimestamp(),
        });

        navigation.navigate("ChatDetailScreen", {
          chatId: newChatRef.id,
          name: user.name,
          contactId: user.id,
          isGroup: false,
        });
      }
    } catch (error: any) {
      console.error("Error starting chat:", error);
      Alert.alert("Error", "Failed to start chat: " + error.message);
    }
  };

  // ✅ Swipeable Chat Item Component
  const SwipeableChatItem = ({ item }: { item: ChatItem }) => {
    const swipeAnim = new Animated.Value(0);

    const panResponder = PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return !item.isGroup && Math.abs(gestureState.dx) > 10;
      },
      onPanResponderMove: (_, gestureState) => {
        if (!item.isGroup && gestureState.dx < 0) {
          swipeAnim.setValue(Math.max(gestureState.dx, -80));
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (!item.isGroup && gestureState.dx < -50) {
          Animated.timing(swipeAnim, {
            toValue: -80,
            duration: 200,
            useNativeDriver: false,
          }).start();
        } else {
          Animated.timing(swipeAnim, {
            toValue: 0,
            duration: 200,
            useNativeDriver: false,
          }).start();
        }
      },
    });

    const handleDelete = () => {
      deleteChatThread(item.id, item.name);
      Animated.timing(swipeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false,
      }).start();
    };

    const handleChatPress = () => {
      if (swipeAnim._value < 0) {
        Animated.timing(swipeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: false,
        }).start();
      } else {
        navigation.navigate("ChatDetailScreen", {
          chatId: item.id,
          name: item.name,
          isGroup: item.isGroup || false,
          contactId: item.isGroup ? undefined : item.id,
        });
      }
    };

    return (
      <View style={styles.swipeableContainer}>
        {!item.isGroup && (
          <TouchableOpacity
            style={styles.deleteButton}
            onPress={handleDelete}
          >
            <Icon name="delete" size={24} color="#fff" />
          </TouchableOpacity>
        )}

        <Animated.View
          style={[
            styles.chatRowWrapper,
            {
              transform: [{ translateX: swipeAnim }],
            },
          ]}
          {...panResponder.panHandlers}
        >
          <TouchableOpacity
            onPress={handleChatPress}
            style={styles.chatRow}
            activeOpacity={0.7}
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
        </Animated.View>
      </View>
    );
  };

  // ✅ User item renderer
  const renderUserItem = ({ item }: { item: UserItem }) => (
    <TouchableOpacity
      style={styles.userItem}
      onPress={() => startChatWithUser(item)}
      activeOpacity={0.7}
    >
      <View style={styles.userAvatar}>
        <Text style={styles.userAvatarText}>
          {item.name?.charAt(0).toUpperCase() || "U"}
        </Text>
      </View>
  
      <View style={styles.userInfo}>
        <Text style={styles.userName} numberOfLines={1}>
          {item.name || "Unnamed User"}
        </Text>
        {item.email && (
          <Text style={styles.userEmail} numberOfLines={1}>
            {item.email}
          </Text>
        )}
      </View>
      
      <Icon name="message-outline" size={24} color="#25D366" />
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
      {/* Header */}
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={styles.sectionTitle}>Chats</Text>
        <TouchableOpacity
          style={{ padding: 10, marginRight: 10 ,marginTop: 8}}
          onPress={() => setShowMenu(!showMenu)}
        >
          <Icon name="dots-vertical" size={28} color="gray" />
        </TouchableOpacity>
      </View>

      {/* Menu */}
      {showMenu && (
        <TouchableWithoutFeedback onPress={() => setShowMenu(false)}>
          <View style={styles.menuOverlay}>
            <TouchableWithoutFeedback>
              <View style={styles.menuPopover}>
                <TouchableOpacity
                  style={styles.menuItem}
                  onPress={() => {
                    setShowMenu(false);
                    navigation.navigate("SelectMembersScreen", {
                      groupName: "",
                      groupPic: null,
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
        renderItem={({ item }) => <SwipeableChatItem item={item} />}
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
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Start New Chat</Text>
              <TouchableOpacity 
                onPress={() => setShowUsersModal(false)}
                style={styles.closeButton}
              >
                <Icon name="close" size={24} color="#666" />
              </TouchableOpacity>
            </View>
            
            <Text style={styles.modalSubtitle}>
              {users.length} user{users.length !== 1 ? 's' : ''} available
            </Text>
            
            <FlatList
              data={users}
              keyExtractor={(item) => item.id}
              renderItem={renderUserItem}
              showsVerticalScrollIndicator={false}
              style={styles.usersList}
              contentContainerStyle={styles.usersListContent}
              ListEmptyComponent={
                <View style={styles.emptyContainer}>
                  <Text style={styles.emptyText}>No users found</Text>
                  <Text style={styles.emptySubtext}>Try again later</Text>
                </View>
              }
            />
          </View>
        </View>
      </Modal>

      <Navbar navigation={navigation} />
    </View>
  );
};

// ✅ Keep all your existing styles (same as before)
const styles = StyleSheet.create({
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
  swipeableContainer: {
    position: 'relative',
    backgroundColor: '#fff',
  },
  chatRowWrapper: {
    backgroundColor: '#fff',
  },
  chatRow: { 
    flexDirection: "row", 
    alignItems: "center", 
    paddingHorizontal: 15, 
    paddingVertical: 12, 
    borderBottomWidth: 0.5, 
    borderBottomColor: "#ddd",
    backgroundColor: '#fff',
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
  chatTime: { 
    fontSize: 12, 
    color: "#999" 
  },
  deleteButton: {
    position: 'absolute',
    right: 0,
    top: 0,
    bottom: 0,
    width: 80,
    backgroundColor: '#ff3b30',
    justifyContent: 'center',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: "#ddd",
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
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "90%",
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 0,
    maxHeight: "80%",
    elevation: 10,
  },
  modalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: "#f0f0f0",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    color: "#25D366",
  },
  closeButton: {
    padding: 4,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#666",
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 15,
    textAlign: "center",
    backgroundColor: "#f8f8f8",
  },
  usersList: {
    flex: 1,
  },
  usersListContent: {
    paddingHorizontal: 10,
  },
  userItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: 15,
    marginHorizontal: 10,
    marginVertical: 5,
    borderRadius: 10,
    backgroundColor: "#FFFFFF",
    borderWidth: 1,
    borderColor: "#f0f0f0",
  },
  userAvatar: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: "#25D366",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 15,
  },
  userAvatarText: {
    fontWeight: "bold",
    color: "#fff",
    fontSize: 20,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 16,
    fontWeight: "500",
    color: "#000",
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: "#666",
  },
});

export default Chat;