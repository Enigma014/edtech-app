import React, { useEffect, useState, useRef } from "react"; 
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
} from "react-native"; 
import firestore from "@react-native-firebase/firestore"; 
import Icon from "react-native-vector-icons/MaterialCommunityIcons"; 
import Navbar from "../../components/Navbar"; 
import SearchBox from "../../components/SearchBox"; 
import { theme } from "../../core/theme"; 
import auth from "@react-native-firebase/auth"; 
import { Swipeable } from "react-native-gesture-handler"; // 🆕 ADD THIS IMPORT

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

const Chat = ({ navigation }: { navigation: any }) => {
  const [chats, setChats] = useState<ChatItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);
  const swipeableRefs = useRef(new Map()); // 🆕 Track swipeable refs

  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const currentUid = currentUser.uid;
    setLoading(true);
    setInitialLoadComplete(false);

    let loadedListeners = 0;
    const totalListeners = 3; // users, groups, chats

    const checkAllLoaded = () => {
      loadedListeners++;
      if (loadedListeners >= totalListeners && !initialLoadComplete) {
        setLoading(false);
        setInitialLoadComplete(true);
      }
    };

    // ✅ Users listener
    const unsubscribeUsers = firestore()
      .collection("users")
      .onSnapshot((snapshot) => {
        const userList = snapshot.docs
          .map((doc) => {
            const data = doc.data();
            return data.uid !== currentUid ? {
              id: data.uid,
              name: data.name || "Unnamed",
              lastMessage: data.lastMessage || "",
              updatedAt: data.lastMessageTime ? data.lastMessageTime.toDate().toLocaleTimeString() : "",
              isGroup: false,
            } : null;
          })
          .filter(Boolean);
        setChats((prev) => mergeChats(prev, userList));
        checkAllLoaded();
      }, (error) => {
        console.error("Users listener error:", error);
        checkAllLoaded();
      });

    // ✅ Groups listener
    const unsubscribeGroups = firestore()
      .collection("groups")
      .where("members", "array-contains", currentUid)
      .onSnapshot((snapshot) => {
        const groupData = snapshot.docs.map((doc) => {
          const data = doc.data() || {};
          if (data.isCommunityGroup === true) {
            return null; // Skip community groups
          }
          return {
            id: doc.id,
            name: data.name || "Unnamed Group",
            lastMessage: data.lastMessage || "",
            updatedAt: data.lastMessageTime ? data.lastMessageTime.toDate().toLocaleTimeString() : data.createdAt ? data.createdAt.toDate().toLocaleTimeString() : "",
            isGroup: true,
          };
        }).filter(Boolean);
        setChats((prev) => mergeChats(prev, groupData));
        checkAllLoaded();
      }, (error) => {
        console.error("Groups listener error:", error);
        checkAllLoaded();
      });

    // ✅ Chats listener (DMs)
    const unsubscribeChats = firestore()
      .collection("chats")
      .where("participants", "array-contains", currentUid)
      .orderBy("updatedAt", "desc")
      .onSnapshot(async (snapshot) => {
        if (!snapshot) {
          checkAllLoaded();
          return;
        }
        
        try {
          const chatData = await Promise.all(
            snapshot.docs.map(async (doc) => {
              const data = doc.data() || {};
              const participants = Array.isArray(data.participants) ? data.participants : [];
              const otherUserId = participants.find((uid) => uid !== currentUid);
              
              let chatName = "Unknown";
              if (otherUserId) {
                try {
                  const userDoc = await firestore()
                    .collection("users")
                    .doc(otherUserId)
                    .get();
                  const userInfo = userDoc.data();
                  chatName = userInfo?.displayName || userInfo?.name || userInfo?.email || "Unknown";
                } catch (err) {
                  chatName = "Error Loading";
                }
              } else {
                chatName = "Me";
              }

              return {
                id: doc.id,
                name: data.contactName || "Unknown Contact",
                lastMessage: data.lastMessage || "",
                updatedAt: data.lastMessageTime ? data.lastMessageTime.toDate().toLocaleTimeString() : data.createdAt ? data.createdAt.toDate().toLocaleTimeString() : "",
                isGroup: false,
              };
            })
          );

          setChats((prev) => mergeChats(prev, chatData));
        } catch (error) {
          console.error("Chats processing error:", error);
        } finally {
          checkAllLoaded();
        }
      }, (error) => {
        console.error("Chats listener error:", error);
        checkAllLoaded();
      });

    const timeoutId = setTimeout(() => {
      if (!initialLoadComplete) {
        console.log("Loading timeout reached");
        setLoading(false);
        setInitialLoadComplete(true);
      }
    }, 10000);

    return () => {
      clearTimeout(timeoutId);
      unsubscribeChats();
      unsubscribeGroups();
      unsubscribeUsers();
    };
  }, []);

  // ✅ Fixed mergeChats function
  function mergeChats(prevChats, newChats) {
    const map = new Map();
    
    const validPrevChats = prevChats.filter(chat => chat && chat.id);
    const validNewChats = newChats.filter(chat => chat && chat.id);

    [...validPrevChats, ...validNewChats].forEach((chat) => {
      if (chat && chat.id) {
        map.set(chat.id, chat);
      }
    });

    const merged = Array.from(map.values());
    return merged.sort((a, b) => {
      const aTime = new Date(a.updatedAt).getTime() || 0;
      const bTime = new Date(b.updatedAt).getTime() || 0;
      return bTime - aTime;
    });
  }

  // ✅ Delete chat function
  const deleteChat = async (chatId: string, isGroup: boolean) => {
    if (isGroup) {
      Alert.alert("Cannot Delete", "Group chats cannot be deleted");
      return;
    }

    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete this chat? This action cannot be undone.",
      [
        {
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const currentUser = auth().currentUser;
              if (!currentUser) return;

              // Close the swipeable
              const ref = swipeableRefs.current.get(chatId);
              if (ref) ref.close();

              // Delete from Firestore chats collection
              await firestore().collection("chats").doc(chatId).delete();
              
              // Also remove from local state
              setChats(prevChats => prevChats.filter(chat => chat.id !== chatId));
              
              console.log("✅ Chat deleted successfully");
            } catch (error) {
              console.error("❌ Error deleting chat:", error);
              Alert.alert("Error", "Failed to delete chat");
            }
          }
        }
      ]
    );
  };

  // ✅ Render right actions for swipe (Delete button)
  const renderRightActions = (progress: any, dragX: any, item: ChatItem) => {
    if (item.isGroup) return null; // No swipe for groups

    const trans = dragX.interpolate({
      inputRange: [0, 50, 100, 101],
      outputRange: [0, 0, 0, 1],
    });

    return (
      <TouchableOpacity 
        style={styles.deleteButton}
        onPress={() => deleteChat(item.id, false)}
      >
        <Animated.View
          style={[
            styles.deleteButtonContent,
            {
              transform: [{ translateX: trans }],
            },
          ]}
        >
          <Icon name="delete" size={24} color="#fff" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // ✅ Simple Chat Item Component
  const ChatItem = ({ item }: { item: ChatItem }) => (
    <Swipeable
      ref={(ref) => {
        if (ref) {
          swipeableRefs.current.set(item.id, ref);
        } else {
          swipeableRefs.current.delete(item.id);
        }
      }}
      renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}
      enabled={!item.isGroup} // Disable swipe for groups
      rightThreshold={40}
      onSwipeableRightOpen={() => {
        // Close other open swipeables
        swipeableRefs.current.forEach((ref, chatId) => {
          if (chatId !== item.id && ref) {
            ref.close();
          }
        });
      }}
    >
      <TouchableOpacity 
        onPress={() => {
          navigation.navigate("ChatDetailScreen", {
            chatId: item.id,
            name: item.name,
            isGroup: item.isGroup || false,
            contactId: item.isGroup ? undefined : item.id,
          });
        }}
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
        
        {/* Swipe hint for personal chats */}
        {!item.isGroup && (
          <Icon 
            name="chevron-left" 
            size={20} 
            color="#ccc" 
            style={styles.swipeHint}
          />
        )}
      </TouchableOpacity>
    </Swipeable>
  );

  // ✅ Navigate to ListUsers screen
  const navigateToUserList = () => {
    navigation.navigate("ListUsers");
  };

  const renderChatItem = ({ item }: { item: ChatItem }) => (
    <ChatItem item={item} />
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
          style={{ padding: 10, marginRight: 10, marginTop: 8 }}
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
        onPress={navigateToUserList}
      >
        <Icon name="plus" size={28} color="#fff" />
      </TouchableOpacity>

      <Navbar navigation={navigation} />
    </View>
  );
};

const styles = StyleSheet.create({
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
    borderBottomColor: "#ddd",
    backgroundColor: "#fff",
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
  // Swipe to delete styles
  deleteButton: {
    backgroundColor: "#FF3B30",
    justifyContent: "center",
    alignItems: "center",
    width: 80,
    height: '100%',
  },
  deleteButtonContent: {
    alignItems: "center",
    justifyContent: "center",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 12,
    marginTop: 4,
    fontWeight: "500",
  },
  swipeHint: {
    marginLeft: 8,
    opacity: 0.5,
  },
});

export default Chat;