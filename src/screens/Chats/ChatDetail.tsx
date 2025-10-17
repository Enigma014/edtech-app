import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  FlatList,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  Alert,
  Modal,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  listenMessages,
  sendMessage,
  markMessagesAsRead,
  deleteMessage,
  deleteAllMessages,
  loadMoreMessages,
  generateChatId,
} from "../../utils/firebase/Chat";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

const ChatDetailScreen = ({ route, navigation }: any) => {
  const { chatId: initialChatId, name, receiverId, isGroup, contactId, isCommunity, communityId } = route.params;
  const currentUserId = auth().currentUser?.uid;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const [contactName, setContactName] = useState(name || "Unknown");
  const [contactData, setContactData] = useState<any>(null);
  const [groupData, setGroupData] = useState<any>(null);
  const flatListRef = useRef<FlatList>(null);

  const chatId = initialChatId || generateChatId(currentUserId, receiverId);

  // ✅ Fetch contact/group data
  useEffect(() => {
    const fetchData = async () => {
      if (name) return; // If name is already provided, use it

      try {
        if (isGroup) {
          // Fetch group data
          console.log("Fetching group data for:", chatId);
          const groupDoc = await firestore()
            .collection('groups')
            .doc(chatId)
            .get();

          if (groupDoc.exists) {
            const data = groupDoc.data();
            setGroupData(data);
            setContactName(data?.name || "Unknown Group");
          } else {
            console.log("Group not found in database");
            setContactName("Unknown Group");
          }
        } else {
          // Fetch contact data for individual chat
          let contactToFetch = contactId || receiverId;
          
          if (!contactToFetch) {
            console.log("No contact ID available");
            return;
          }

          console.log("Fetching contact data for:", contactToFetch);
          const contactDoc = await firestore()
            .collection('users')
            .doc(contactToFetch)
            .get();

          if (contactDoc.exists) {
            const data = contactDoc.data();
            setContactName(data?.name || "Unknown");
            setContactData(data);
          } else {
            console.log("Contact not found in database");
            setContactName("Unknown User");
          }
        }
      } catch (error) {
        console.error("Error fetching data:", error);
        setContactName("Error Loading");
      }
    };

    fetchData();
  }, [name, contactId, receiverId, isGroup, chatId]);

  // ✅ Listen to real-time chat messages
  useEffect(() => {
    if (!chatId) return;
    const unsubscribe = listenMessages(chatId, (msgs: any[], lastDoc: any) => {
      setMessages(msgs);
      setLastDoc(lastDoc);
    });
    return () => unsubscribe && unsubscribe();
  }, [chatId]);

  // ✅ Mark messages as read on entering chat
  useEffect(() => {
    if (chatId && currentUserId) {
      markMessagesAsRead(chatId, currentUserId);
    }
  }, [chatId, currentUserId]);

  // ✅ Send message
  const handleSend = async () => {
    if (!message.trim() || !currentUserId) return;
    
    // Determine the actual receiver ID
    const actualReceiverId = isGroup ? chatId : (receiverId || contactId);
    if (!actualReceiverId) {
      Alert.alert("Error", "Cannot send message: receiver not specified");
      return;
    }

    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      text: message.trim(),
      senderId: currentUserId,
      receiverId: actualReceiverId,
      createdAt: new Date(),
      isOptimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setMessage("");

    try {
      await sendMessage(chatId, currentUserId, actualReceiverId, message, null);
    } catch (error) {
      console.error("Error sending message:", error);
      // Remove optimistic message on error
      setMessages((prev) => prev.filter(m => m.id !== optimisticMsg.id));
      Alert.alert("Error", "Failed to send message");
    }
  };

  // ✅ Load more messages (pagination)
  const handleLoadMore = async () => {
    if (!chatId || !lastDoc) return;
    const { messages: newMessages, lastDoc: newLastDoc } = await loadMoreMessages(chatId, lastDoc);
    setMessages((prev) => [...newMessages, ...prev]);
    setLastDoc(newLastDoc);
  };

  // ✅ Delete single message
  const handleDeleteMessage = (messageId: string) => {
    Alert.alert("Delete Message", "Are you sure you want to delete this message?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMessage(chatId, messageId);
            setMessages((prev) => prev.filter((m) => m.id !== messageId));
          } catch (error) {
            console.error("Error deleting message:", error);
            Alert.alert("Error", "Failed to delete message");
          }
        },
      },
    ]);
  };

  // ✅ Clear all messages
  const handleClearChat = () => {
    Alert.alert("Clear Chat", "This will delete all messages in the chat.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Clear",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteAllMessages(chatId, currentUserId);
            setMessages([]);
            setMenuVisible(false);
          } catch (error) {
            console.error("Error clearing chat:", error);
            Alert.alert("Error", "Failed to clear chat");
          }
        },
      },
    ]);
  };

  // ✅ Open contact or group info
  const handleViewInfo = () => {
    setMenuVisible(false);
    
    if (isGroup) {
      console.log("Navigating to GroupInfoScreen with groupId:", chatId);
      navigation.navigate("GroupInfoScreen", { 
        groupId: chatId,
        groupName: contactName,
        isCommunity: isCommunity || false,
        communityId: communityId || null
      });
    } else {
      // Navigate to ContactProfileScreen with the correct contact ID
      const actualContactId = contactId || receiverId;
      if (actualContactId) {
        navigation.navigate("ContactProfileScreen", { 
          contactId: actualContactId,
          contactName: contactName 
        });
      } else {
        Alert.alert("Error", "Contact information not available");
      }
    }
  };

  // ✅ Navigate to contact profile when tapping the name
  const handleNamePress = () => {
    if (isGroup) {
      console.log("Tapping group name, navigating to GroupInfoScreen with groupId:", chatId);
      navigation.navigate("GroupInfoScreen", { 
        groupId: chatId,
        groupName: contactName,
        isCommunity: isCommunity || false,
        communityId: communityId || null
      });
    } else {
      // For individual chats, show contact profile
      const actualContactId = contactId || receiverId;
      if (actualContactId) {
        navigation.navigate("ContactProfileScreen", { 
          contactId: actualContactId 
        });
      } else {
        Alert.alert("Error", "Contact information not available");
      }
    }
  };

  // ✅ Render message
  const renderItem = ({ item }: any) => {
    const isMyMessage = item.senderId === currentUserId;
    return (
      <TouchableOpacity
        onLongPress={() => handleDeleteMessage(item.id)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.messageRow,
            isMyMessage ? styles.myMessageRow : styles.theirMessageRow,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isMyMessage ? styles.myMessage : styles.theirMessage,
            ]}
          >
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={styles.container}>
        {/* ✅ Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNamePress} style={styles.nameContainer}>
              <Text style={styles.contactName}>{contactName}</Text>
              <Text style={styles.statusText}>
                {isGroup ? `${messages.length} messages` : "Online"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Icon name="dots-vertical" size={22} color="#000" />
          </TouchableOpacity>
        </View>

        {/* ✅ Chat Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item.id || `msg-${index}`}
          contentContainerStyle={styles.chatContainer}
          renderItem={renderItem}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          onEndReached={handleLoadMore}
          onEndReachedThreshold={0.2}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>Start a conversation by sending a message</Text>
            </View>
          }
        />

        {/* ✅ Input Bar */}
        <View style={styles.bottomWrapper}>
          <View style={styles.inputWrapper}>
            <Icon name="emoticon-outline" size={24} color="gray" style={styles.iconLeft} />
            <TextInput
              placeholder="Message"
              placeholderTextColor="#777"
              style={styles.textInput}
              value={message}
              onChangeText={setMessage}
              multiline
            />
            <Icon name="paperclip" size={22} color="gray" style={styles.iconRight} />
            <Icon name="camera-outline" size={22} color="gray" style={styles.iconRight} />
          </View>

          <TouchableOpacity 
            style={[styles.micButton, !message.trim() && styles.micButtonDisabled]} 
            onPress={handleSend}
            disabled={!message.trim()}
          >
            <Icon name="send" size={22} color="#fff" />
          </TouchableOpacity>
        </View>

        {/* ✅ Options Menu */}
        <Modal
          transparent
          visible={menuVisible}
          animationType="fade"
          onRequestClose={() => setMenuVisible(false)}
        >
          <TouchableOpacity
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setMenuVisible(false)}
          >
            <View style={styles.menuContainer}>
              <TouchableOpacity onPress={handleViewInfo} style={styles.menuItem}>
                <Text style={styles.menuText}>
                  {isGroup ? "Group Info" : "View Info"}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClearChat} style={styles.menuItem}>
                <Text style={[styles.menuText, { color: "red" }]}>Clear Chat</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

export default ChatDetailScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ECE5DD" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 15,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 1,
  },
  headerLeft: { 
    flexDirection: "row", 
    alignItems: "center",
    flex: 1,
  },
  nameContainer: {
    marginLeft: 10,
  },
  contactName: { 
    fontSize: 18, 
    fontWeight: "600", 
    color: "#000",
  },
  statusText: {
    fontSize: 12,
    color: "#666",
    marginTop: 2,
  },
  chatContainer: { 
    padding: 10, 
    flexGrow: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 50,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    marginBottom: 8,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#999",
    textAlign: "center",
  },
  messageRow: { 
    flexDirection: "row", 
    marginVertical: 4, 
    paddingHorizontal: 8 
  },
  myMessageRow: { 
    justifyContent: "flex-end" 
  },
  theirMessageRow: { 
    justifyContent: "flex-start" 
  },
  messageBubble: { 
    padding: 12, 
    borderRadius: 8, 
    maxWidth: "80%" 
  },
  myMessage: { 
    backgroundColor: "#dcf8c6", 
    borderTopRightRadius: 0 
  },
  theirMessage: { 
    backgroundColor: "#fff", 
    borderTopLeftRadius: 0 
  },
  messageText: { 
    color: "#000", 
    fontSize: 16, 
    lineHeight: 20 
  },
  bottomWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 25,
    flex: 1,
    paddingHorizontal: 12,
    paddingVertical: 8,
    maxHeight: 100,
  },
  textInput: { 
    flex: 1, 
    fontSize: 16, 
    color: "#000", 
    paddingVertical: 4,
    maxHeight: 80,
  },
  iconLeft: { 
    marginRight: 8 
  },
  iconRight: { 
    marginLeft: 8 
  },
  micButton: {
    backgroundColor: "#25D366",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  micButtonDisabled: {
    backgroundColor: "#ccc",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.1)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
  },
  menuContainer: {
    backgroundColor: "#fff",
    borderRadius: 8,
    marginTop: 60,
    marginRight: 15,
    width: 150,
    paddingVertical: 8,
    elevation: 5,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
  },
  menuItem: { 
    paddingVertical: 12, 
    paddingHorizontal: 16 
  },
  menuText: { 
    fontSize: 16, 
    color: "#000" 
  },
});