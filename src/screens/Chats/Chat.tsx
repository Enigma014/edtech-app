import React, { useEffect, useState, useMemo } from "react";
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
  TextInput, // Add this import
} from "react-native";
import firestore from "@react-native-firebase/firestore";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import Navbar from "../../components/Navbar";
import SearchBox from "../../components/SearchBox";
import { theme } from "../../core/theme";
import auth from "@react-native-firebase/auth";
import {
  subscribeToGroups,
  subscribeToChatSummaries,
} from "../../utils/firebase/Chat";

type ChatItemType = {
  id: string;
  name: string;
  lastMessage: string;
  updatedAt: string;
  isGroup?: boolean;
  isCommunity?: boolean;
  otherUserId?: string;
  unreadCount?: number;
};

type UserItem = {
  id: string;
  name: string;
  email: string;
};

const Chat = ({ navigation }: { navigation: any }) => {
  const [chats, setChats] = useState<ChatItemType[]>([]);
  const [filteredChats, setFilteredChats] = useState<ChatItemType[]>([]); // Add filtered state
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserItem[]>([]);
  const [showUsersModal, setShowUsersModal] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState(""); // Add search query state

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
        setFilteredChats(sortedMerged); // Initialize filtered chats
        setLoading(false);
      }, summaryGroupIds);
    });

    return () => {
      unsubPersonal?.();
    };
  }, []);

  // Add search functionality
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setFilteredChats(chats);
    } else {
      const query = searchQuery.toLowerCase().trim();
      const filtered = chats.filter(chat => 
        chat.name.toLowerCase().includes(query) ||
        chat.lastMessage.toLowerCase().includes(query)
      );
      setFilteredChats(filtered);
    }
  }, [searchQuery, chats]);

  // Handle chat press - improved navigation
  const handleChatPress = async (item: ChatItemType) => {
    try {
      console.log("Chat pressed:", item);
      
      if (item.isGroup) {
        // For group chats
        navigation.navigate("ChatDetailScreen", {
          chatId: item.id,
          name: item.name,
          isGroup: true,
        });
      } else {
        // For personal chats - determine the other user's ID
        const currentUser = auth().currentUser;
        if (!currentUser) return;

        const otherUserId = item.otherUserId || item.id;
        
        console.log("Navigating to personal chat with user:", otherUserId);
        
        // Fetch user data from Firestore first
        const userDoc = await firestore()
          .collection("users")
          .doc(otherUserId)
          .get();

        if (userDoc.exists) {
          const userData = userDoc.data();
          console.log("User data found:", userData);
          
          navigation.navigate("ChatDetailScreen", {
            chatId: item.id,
            name: userData?.name || item.name,
            isGroup: false,
            contactId: otherUserId,
            otherUserId: otherUserId,
            contactInfo: userData,
          });
        } else {
          console.log("User not found, using basic info");
          // Fallback if user data not found
          navigation.navigate("ChatDetailScreen", {
            chatId: item.id,
            name: item.name,
            isGroup: false,
            contactId: otherUserId,
            otherUserId: otherUserId,
          });
        }
      }
    } catch (error) {
      console.error("Error navigating to chat:", error);
      // Fallback navigation
      navigation.navigate("ChatDetailScreen", {
        chatId: item.id,
        name: item.name,
        isGroup: item.isGroup || false,
        contactId: item.isGroup ? undefined : item.id,
        otherUserId: item.otherUserId || undefined,
      });
    }
  };

  // Chat row component - simplified without swipe
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
      <TouchableOpacity
        onPress={() => handleChatPress(item)}
        style={styles.chatRow}
        activeOpacity={0.7}
      >
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {item.name?.charAt(0)?.toUpperCase() || "U"}
          </Text>
        </View>
        <View style={styles.chatContent}>
          <Text style={styles.chatName}>{item.name}</Text>
          <Text style={styles.chatMessage} numberOfLines={1}>
            {item.lastMessage || "No messages yet"}
          </Text>
        </View>

        {item.unreadCount > 0 && (
          <View style={styles.unreadBadge}>
            <Text style={styles.unreadText}>{item.unreadCount}</Text>
          </View>
        )}
        <Text style={styles.chatTime}>{displayTime}</Text>
      </TouchableOpacity>
    );
  };

  // Custom Search Component
  const CustomSearchBox = () => {
    return (
      <View style={styles.searchContainer}>
        <Icon name="magnify" size={20} color="#666" style={styles.searchIcon} />
        <TextInput
          style={styles.searchInput}
          placeholder="Search chats..."
          placeholderTextColor="#999"
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {searchQuery.length > 0 && (
          <TouchableOpacity onPress={() => setSearchQuery("")} style={styles.clearButton}>
            <Icon name="close-circle" size={18} color="#999" />
          </TouchableOpacity>
        )}
      </View>
    );
  };

  const navigateToUserList = () => {
    navigation.navigate("ListUsers");
  };

  const renderChatItem = ({ item }: { item: ChatItemType }) => (
    <ChatListItem item={item} />
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
      <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center" }}>
        <Text style={styles.sectionTitle}>Chats</Text>
        <TouchableOpacity 
          style={{ padding: 10, marginRight: 10, marginTop: 8 }} 
          onPress={() => setShowMenu(!showMenu)}
        >
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
              </View>
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      )}

      {/* Replace SearchBox with CustomSearchBox */}
      <CustomSearchBox />

      {/* Add search results info */}
      {searchQuery.length > 0 && (
        <View style={styles.searchInfo}>
          <Text style={styles.searchInfoText}>
            {filteredChats.length} {filteredChats.length === 1 ? 'result' : 'results'} for "{searchQuery}"
          </Text>
          {filteredChats.length === 0 && (
            <Text style={styles.noResultsText}>No chats found</Text>
          )}
        </View>
      )}

      <FlatList
        data={filteredChats} // Use filteredChats instead of chats
        keyExtractor={(item) => item.id}
        renderItem={renderChatItem}
        contentContainerStyle={{ paddingBottom: 80 }}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery.length > 0 ? 'No matching chats' : 'No chats yet'}
            </Text>
            <Text style={styles.emptySubtext}>
              {searchQuery.length > 0 
                ? 'Try a different search term'
                : 'Tap the + button to start a conversation'}
            </Text>
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
  // Existing styles...
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
  unreadBadge: {
    backgroundColor: '#25D366',
    borderRadius: 12,
    minWidth: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    position: 'absolute',
    right: 10,
    top: 10,
  },
  unreadText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
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
  // New search styles
  searchContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    marginHorizontal: 15,
    marginBottom: 10,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#e0e0e0",
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    paddingVertical: 0,
  },
  clearButton: {
    padding: 4,
  },
  searchInfo: {
    paddingHorizontal: 20,
    paddingVertical: 8,
    backgroundColor: "#f8f8f8",
    borderBottomWidth: 1,
    borderBottomColor: "#eee",
  },
  searchInfoText: {
    fontSize: 14,
    color: "#666",
    textAlign: "center",
  },
  noResultsText: {
    fontSize: 14,
    color: "#999",
    fontStyle: "italic",
    textAlign: "center",
    marginTop: 4,
  },
});

export default Chat;