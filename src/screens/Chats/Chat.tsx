import React, { useEffect, useState, useRef, useCallback } from "react";
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
import { Swipeable } from "react-native-gesture-handler";
// at top of Chat.tsx (or where your Chat component file is)
import {
  subscribeToGroups,
  subscribeToChatSummaries,
} from "../../utils/firebase/Chat";


type ChatItemType = {
  id: string;
  name: string;
  lastMessage: string;
  updatedAt: string; // ISO string for stable sorting
  isGroup?: boolean;
  isCommunity?: boolean;
  otherUserId?: string;
};

type UserItem = {
  id: string;
  name: string;
  email: string;
};

const Chat = ({ navigation }: { navigation: any }) => {
  const [chats, setChats] = useState<ChatItemType[]>([]);
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [initialLoadComplete, setInitialLoadComplete] = useState(false);

  // Map of chatId -> Swipeable ref
  const swipeableRefs = useRef<Map<string, any>>(new Map());

  useEffect(() => {
    const currentUser = auth().currentUser;
    if (!currentUser) {
      setLoading(false);
      return;
    }

    const currentUid = currentUser.uid;

    // Step 1️⃣: Subscribe to chat summaries
    const unsubPersonal = subscribeToChatSummaries(currentUid, (personalAndGroupSummaries) => {
      const summaryGroupIds = personalAndGroupSummaries
        .filter((c) => c.isGroup)
        .map((c) => c.id);

      // Step 2️⃣: Subscribe to groups (excluding ones already in summaries)
      const unsubGroups = subscribeToGroups(currentUid, (groupsList) => {
        const merged = [...personalAndGroupSummaries, ...groupsList];
        const sortedMerged = merged.sort(
          (a, b) => Date.parse(b.updatedAt) - Date.parse(a.updatedAt)
        );
        setChats(sortedMerged);
        setLoading(false);
      }, summaryGroupIds);
    });

    return () => {
      unsubPersonal?.();
    };
  }, []);

  // Delete chat (only for personal chats)
  const deleteChat = useCallback(
    async (chatId: string, isGroup: boolean) => {
      if (isGroup) {
        Alert.alert("Cannot Delete", "Group chats cannot be deleted");
        return;
      }

      Alert.alert("Delete Chat", "Are you sure you want to delete this chat? This action cannot be undone.", [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const currentUser = auth().currentUser;
              if (!currentUser) return;

              // Close the swipeable if open
              const ref = swipeableRefs.current.get(chatId);
              if (ref && typeof ref.close === "function") {
                ref.close();
              }

              // Delete summary and chat document(s) if needed - BE CAREFUL:
              // Here we delete the chatSummaries doc. If you have other cascade requirements, handle them server-side or add extra deletes.
              await firestore().collection("chatSummaries").doc(chatId).delete();

              // Optionally delete the chat doc (if you keep a separate chats collection)
              // await firestore().collection("chats").doc(chatId).delete().catch(()=>{});

              setChats((prevChats) => prevChats.filter((chat) => chat.id !== chatId));
              console.log("✅ Chat deleted successfully");
            } catch (error) {
              console.error("❌ Error deleting chat:", error);
              Alert.alert("Error", "Failed to delete chat");
            }
          },
        },
      ]);
    },
    []
  );

  // Render right actions for swipe
  const renderRightActions = (progress: any, dragX: any, item: ChatItemType) => {
    if (item.isGroup) return null; // don't show delete for groups

    // Defensive interpolation
    let trans: any = 0;
    try {
      if (dragX && typeof dragX.interpolate === "function") {
        trans = dragX.interpolate({
          inputRange: [0, 50, 100, 101],
          outputRange: [0, 0, 0, 1],
        });
      }
    } catch (e) {
      trans = 0;
    }

    return (
      <TouchableOpacity style={styles.deleteButton} onPress={() => deleteChat(item.id, false)}>
        <Animated.View style={[styles.deleteButtonContent, { transform: [{ translateX: trans as any }] }]}>
          <Icon name="delete" size={24} color="#fff" />
          <Text style={styles.deleteButtonText}>Delete</Text>
        </Animated.View>
      </TouchableOpacity>
    );
  };

  // Chat row component
  const ChatListItem = ({ item }: { item: ChatItemType }) => {
    const displayTime = (() => {
      try {
        const d = new Date(item.updatedAt);
        if (isNaN(d.getTime())) return item.updatedAt || "";
        return d.toLocaleString();
      } catch {
        return item.updatedAt || "";
      }
    })();

    return (
      <Swipeable
        ref={(ref) => {
          if (ref) {
            swipeableRefs.current.set(item.id, ref);
          } else {
            swipeableRefs.current.delete(item.id);
          }
        }}
        renderRightActions={(progress, dragX) => renderRightActions(progress, dragX, item)}
        enabled={!item.isGroup}
        rightThreshold={40}
        onSwipeableRightOpen={() => {
          // Close any other open swipeables
          swipeableRefs.current.forEach((ref, chatId) => {
            if (chatId !== item.id && ref && typeof ref.close === "function") {
              ref.close();
            }
          });
        }}
      >
        <TouchableOpacity
          onPress={() =>
            navigation.navigate("ChatDetailScreen", {
              chatId: item.id,
              name: item.name,
              isGroup: item.isGroup || false,
              contactId: item.isGroup ? undefined : item.id,
              otherUserId: item.otherUserId || undefined,
            })

          }
          style={styles.chatRow}
          activeOpacity={0.7}
        >
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{item.name?.charAt(0)?.toUpperCase()}</Text>
          </View>
          <View style={styles.chatContent}>
            <Text style={styles.chatName}>{item.name}</Text>
            <Text style={styles.chatMessage} numberOfLines={1}>
              {item.lastMessage}
            </Text>
          </View>
          <Text style={styles.chatTime}>{displayTime}</Text>

          {!item.isGroup && <Icon name="chevron-left" size={20} color="#ccc" style={styles.swipeHint} />}
        </TouchableOpacity>
      </Swipeable>
    );
  };

  const navigateToUserList = () => {
    navigation.navigate("ListUsers");
  };

  const renderChatItem = ({ item }: { item: ChatItemType }) => <ChatListItem item={item} />;

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
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={styles.sectionTitle}>Chats</Text>
        <TouchableOpacity style={{ padding: 10, marginRight: 10, marginTop: 8 }} onPress={() => setShowMenu(!showMenu)}>
          <Icon name="dots-vertical" size={28} color="gray" />
        </TouchableOpacity>
      </View>

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
                <TouchableOpacity style={styles.menuItem} onPress={() => console.log("Create Community")}>
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

      <TouchableOpacity style={styles.fab} onPress={navigateToUserList}>
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
    alignItems: "center",
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
    color: "#25d366",
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
    color: "#999",
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
    padding: 12,
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
    height: "100%",
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
