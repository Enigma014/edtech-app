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

const ChatDetailScreen = ({ route, navigation }: any) => {
  const { chatId: initialChatId, name, receiverId, isGroup, contactId } = route.params;
  const currentUserId = auth().currentUser?.uid;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [lastDoc, setLastDoc] = useState<any>(null);
  const [menuVisible, setMenuVisible] = useState(false);
  const flatListRef = useRef<FlatList>(null);

  const chatId = initialChatId || generateChatId(currentUserId, receiverId);

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
    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      text: message.trim(),
      senderId: currentUserId,
      receiverId,
      createdAt: new Date(),
      isOptimistic: true,
    };
    setMessages((prev) => [...prev, optimisticMsg]);
    setMessage("");

    try {
      await sendMessage(chatId, currentUserId, receiverId, message, null);
    } catch (error) {
      console.error("Error sending message:", error);
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
          } catch (error) {
            console.error("Error clearing chat:", error);
          }
        },
      },
    ]);
  };

  // ✅ Open contact or group info
  const handleViewInfo = () => {
    setMenuVisible(false);
    if (isGroup) navigation.navigate("GroupInfoScreen", { groupId: chatId });
    if (contactId) navigation.navigate("ContactProfileScreen", { contactId });
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

            <TouchableOpacity onPress={handleViewInfo}>
              <Text style={styles.contactName}>{name}</Text>
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
            />
            <Icon name="paperclip" size={22} color="gray" style={styles.iconRight} />
            <Icon name="camera-outline" size={22} color="gray" style={styles.iconRight} />
          </View>

          <TouchableOpacity style={styles.micButton} onPress={handleSend}>
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
                <Text style={styles.menuText}>View Info</Text>
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
    paddingVertical: 30,
    paddingHorizontal: 15,
    elevation: 2,
  },
  headerLeft: { flexDirection: "row", alignItems: "center" },
  contactName: { fontSize: 18, fontWeight: "600", marginLeft: 10 },
  chatContainer: { padding: 10, flexGrow: 1 },
  messageRow: { flexDirection: "row", marginVertical: 4, paddingHorizontal: 8 },
  myMessageRow: { justifyContent: "flex-end" },
  theirMessageRow: { justifyContent: "flex-start" },
  messageBubble: { padding: 12, borderRadius: 8, maxWidth: "80%" },
  myMessage: { backgroundColor: "#dcf8c6", borderTopRightRadius: 0 },
  theirMessage: { backgroundColor: "#fff", borderTopLeftRadius: 0 },
  messageText: { color: "#000", fontSize: 16, lineHeight: 20 },
  bottomWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fff",
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 25,
    flex: 1,
    paddingHorizontal: 10,
  },
  textInput: { flex: 1, fontSize: 15, color: "#000", paddingVertical: 6 },
  iconLeft: { marginRight: 5 },
  iconRight: { marginLeft: 10 },
  micButton: {
    backgroundColor: "#25D366",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
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
  },
  menuItem: { paddingVertical: 10, paddingHorizontal: 15 },
  menuText: { fontSize: 16, color: "#000" },
});
