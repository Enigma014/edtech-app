import React, { useEffect, useState, useRef } from "react";
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
  ActivityIndicator,
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import {
  listenMessages,
  sendMessage,
  deleteMessage,
  deleteAllMessages,
  generateChatId,
  markMessagesAsRead,
} from "../../utils/firebase/Chat";
import auth from "@react-native-firebase/auth";
import firestore from "@react-native-firebase/firestore";

const ChatDetailScreen = ({ route, navigation }: any) => {
  const {
    chatId: initialChatId,
    name,
    receiverId,
    isGroup,
    contactId,
    isCommunity,
    communityId,
    otherUserId,
  } = route.params;

  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<any[]>([]);
  const [menuVisible, setMenuVisible] = useState(false);
  const [contactName, setContactName] = useState(name || "Unknown");
  const [groupData, setGroupData] = useState<any>(null);
  const [isMember, setIsMember] = useState(true);
  const [loading, setLoading] = useState(true);
  const [groupChecked, setGroupChecked] = useState(!isGroup); // if not a group, consider checked
  const flatListRef = useRef<FlatList>(null);

  const currentUserId = auth().currentUser?.uid;

  // Redirect if no user
  if (!currentUserId) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#25D366" />
        <Text style={styles.loadingText}>Please log in...</Text>
      </View>
    );
  }

  const chatId = isGroup
    ? initialChatId
    : generateChatId(currentUserId, otherUserId || receiverId || contactId);

  if (!chatId) {
    return (
      <View style={styles.centeredContainer}>
        <Text style={styles.errorText}>Cannot load chat</Text>
        <TouchableOpacity style={styles.button} onPress={() => navigation.goBack()}>
          <Text style={styles.buttonText}>Go Back</Text>
        </TouchableOpacity>
      </View>
    );
  }

  // Listen for messages
  useEffect(() => {
    if (!chatId || !currentUserId) return;

    const unsubscribe = firestore()
      .collection("chats")
      .doc(chatId)
      .collection("messages")
      .orderBy("createdAt", "asc")
      .onSnapshot((snapshot) => {
        const newMessages = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(newMessages);
        setLoading(false);

        // mark as read
        markMessagesAsRead(chatId, currentUserId);
      });

    return () => unsubscribe();
  }, [chatId, currentUserId]);

  // Check group membership and data
  useEffect(() => {
    if (!isGroup || !chatId) {
      setLoading(false);
      setGroupChecked(true);
      return;
    }

    console.log("🔍 Checking group membership for:", chatId);

    const checkGroupMembership = async () => {
      try {
        setGroupChecked(false);

        // Try main groups collection first
        const mainGroupDoc = await firestore().collection("groups").doc(chatId).get();

        if (mainGroupDoc.exists()) {
          const data = mainGroupDoc.data();
          console.log("✅ Found in main groups:", data?.name);
          setGroupData(data);
          await validateMembership(data);
          return;
        }

        // Try community subcollection
        if (isCommunity && communityId) {
          const communityGroups = await firestore()
            .collection("communities")
            .doc(communityId)
            .collection("groups")
            .where("groupId", "==", chatId)
            .get();

          if (!communityGroups.empty) {
            const communityData = communityGroups.docs[0].data();
            console.log("✅ Found in community groups:", communityData?.name);
            setGroupData(communityData);
            await validateMembership(communityData);
            return;
          }
        }

        console.log("❌ Group not found anywhere");
        setIsMember(false);
      } catch (error) {
        console.error("❌ Error checking group membership:", error);
        setIsMember(false);
      } finally {
        setLoading(false);
        setGroupChecked(true);
      }
    };

    const validateMembership = async (data: any) => {
      const members = data?.members || [];
      const isAdminLocal =
        data?.adminId === currentUserId || data?.admin === currentUserId;

      // robust membership check: members can be strings or objects
      const userIsMember =
        Array.isArray(members) &&
        members.some((m: any) => {
          if (!m) return false;
          if (typeof m === "string") return m === currentUserId;
          if (typeof m === "object") {
            return (
              m.id === currentUserId ||
              m.userId === currentUserId ||
              m.uid === currentUserId ||
              m._id === currentUserId
            );
          }
          return false;
        });

      const finalIsMember = userIsMember || !!isAdminLocal;

      console.log("👤 Membership check:", {
        members,
        isAdminLocal,
        userIsMember,
        finalIsMember,
        currentUserId,
      });

      setIsMember(finalIsMember);
    };

    checkGroupMembership();
  }, [chatId, currentUserId, isGroup, isCommunity, communityId]);

  // Send message
  const handleSend = async () => {
    if (!message.trim() || !currentUserId) return;

    // If group permissions are not validated yet, block sending to be safe
    if (isGroup && !groupChecked) {
      Alert.alert("Please wait", "Checking group permissions...");
      return;
    }

    // Check announcements restriction
    if (groupData?.isAnnouncement) {
      const isAdmin =
        groupData?.adminId === currentUserId || groupData?.admin === currentUserId;
      if (!isAdmin) {
        Alert.alert("Restricted", "Only admins can post in Announcements");
        return;
      }
    }

    console.log("🚀 Sending message to:", chatId);

    const optimisticMsg = {
      id: `temp-${Date.now()}`,
      text: message.trim(),
      senderId: currentUserId,
      receiverId: isGroup ? chatId : otherUserId || receiverId || contactId,
      createdAt: new Date(),
      isOptimistic: true,
      chatType: isGroup ? "group" : "chat",
    };

    setMessages((prev) => [...prev, optimisticMsg]);
    const messageToSend = message;
    setMessage("");

    try {
      await sendMessage(
        chatId,
        currentUserId,
        isGroup ? chatId : otherUserId || receiverId || contactId,
        messageToSend,
        undefined,
        null,
        isGroup ? "group" : "chat"
      );
      console.log("✅ Message sent successfully");
    } catch (error: any) {
      console.error("❌ Error sending message:", error);
      setMessages((prev) => prev.filter((m) => m.id !== optimisticMsg.id));
      Alert.alert("Error", "Failed to send message: " + (error?.message || error));
    }
  };

  // Delete message
  const handleDeleteMessage = (messageObj: any) => {
    if (messageObj.senderId !== currentUserId) {
      Alert.alert("Cannot delete", "You can only delete your own messages");
      return;
    }

    Alert.alert("Delete Message", "Are you sure you want to delete this message?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteMessage(chatId, messageObj.id);
            setMessages((prev) => prev.filter((m) => m.id !== messageObj.id));
          } catch (error) {
            console.error("Error deleting message:", error);
            Alert.alert("Error", "Failed to delete message");
          }
        },
      },
    ]);
  };

  // Clear all messages
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

  // View info
  const handleViewInfo = () => {
    setMenuVisible(false);
    if (isGroup) {
      navigation.navigate("GroupInfoScreen", {
        groupId: chatId,
        groupName: contactName,
        isCommunity: isCommunity || false,
        communityId: communityId || null,
      });
    } else {
      const actualContactId = contactId || receiverId;
      if (actualContactId) {
        navigation.navigate("ContactProfileScreen", {
          contactId: actualContactId,
          contactName: contactName,
        });
      } else {
        Alert.alert("Error", "Contact information not available");
      }
    }
  };

  const handleNamePress = () => {
    if (isGroup) {
      navigation.navigate("GroupInfoScreen", {
        groupId: chatId,
        groupName: contactName,
        isCommunity: isCommunity || false,
        communityId: communityId || null,
      });
    } else {
      const actualContactId = contactId || receiverId;
      if (actualContactId) {
        navigation.navigate("ContactProfileScreen", {
          contactId: actualContactId,
        });
      } else {
        Alert.alert("Error", "Contact information not available");
      }
    }
  };

  // Render message
  const renderItem = ({ item }: any) => {
    const isSentByMe = item.senderId === currentUserId;

    return (
      <TouchableOpacity
        onLongPress={() => isSentByMe && handleDeleteMessage(item)}
        activeOpacity={0.7}
      >
        <View
          style={[
            styles.messageRow,
            isSentByMe ? styles.myMessageRow : styles.theirMessageRow,
          ]}
        >
          <View
            style={[
              styles.messageBubble,
              isSentByMe ? styles.myMessageBubble : styles.theirMessageBubble,
            ]}
          >
            {isGroup && !isSentByMe && <Text style={styles.senderName}>{item.senderName || "Unknown"}</Text>}
            <Text style={styles.messageText}>{item.text}</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading && messages.length === 0) {
    return (
      <View style={styles.centeredContainer}>
        <ActivityIndicator size="large" color="#25D366" />
        <Text style={styles.loadingText}>Loading chat...</Text>
      </View>
    );
  }

  // computed perms
  const isAnnouncementOnly = !!groupData?.isAnnouncement;
  const isAdmin = !!(groupData && (groupData.adminId === currentUserId || groupData.admin === currentUserId));

  return (
    <SafeAreaView style={styles.safeContainer}>
      <KeyboardAvoidingView
        style={styles.container}
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        keyboardVerticalOffset={Platform.OS === "ios" ? 90 : 0}
      >
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color="#000" />
            </TouchableOpacity>

            <TouchableOpacity onPress={handleNamePress} style={styles.nameContainer}>
              <Text style={styles.contactName}>{contactName}</Text>
              <Text style={styles.statusText}>
                {isGroup ? `${messages.length} messages` : "Online"}
                {groupData?.isAnnouncement && " • Announcements"}
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity onPress={() => setMenuVisible(true)}>
            <Icon name="dots-vertical" size={22} color="#000" />
          </TouchableOpacity>
        </View>

        {/* Chat Messages */}
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item.id || `msg-${index}`}
          contentContainerStyle={styles.chatContainer}
          renderItem={renderItem}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No messages yet</Text>
              <Text style={styles.emptySubtext}>
                {groupData?.isAnnouncement
                  ? "Community announcements will appear here"
                  : "Start a conversation by sending a message"}
              </Text>
            </View>
          }
        />

        {/* Input Bar / Announcement-only display */}
        {isGroup ? (
          isMember ? (
            // If group checking not finished, show small loader to avoid flicker
            !groupChecked ? (
              <View style={styles.bottomWrapper}>
                <ActivityIndicator size="small" />
                <Text style={{ marginLeft: 8 }}>Checking permissions...</Text>
              </View>
            ) : // If announcement-only & user is NOT admin -> show text only (WhatsApp style)
            isAnnouncementOnly && !isAdmin ? (
              <View style={styles.announcementOnlyBar}>
                <Text style={styles.announcementOnlyText}>Announcements only - Admins can post</Text>
              </View>
            ) : (
              // Normal editable input area for admins or non-announcement groups
              <View style={styles.bottomWrapper}>
                <View style={styles.inputWrapper}>
                  <Icon name="emoticon-outline" size={24} color="gray" style={styles.iconLeft} />
                  <TextInput
                    placeholder={isAnnouncementOnly ? "Type an announcement..." : "Message"}
                    placeholderTextColor="#777"
                    style={styles.textInput}
                    value={message}
                    onChangeText={setMessage}
                    multiline
                    editable={true}
                  />
                  <Icon name="paperclip" size={22} color="gray" style={styles.iconRight} />
                  <Icon name="camera-outline" size={22} color="gray" style={styles.iconRight} />
                </View>

                <TouchableOpacity
                  style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
                  onPress={handleSend}
                  disabled={!message.trim()}
                >
                  <Icon name="send" size={22} color="#fff" />
                </TouchableOpacity>
              </View>
            )
          ) : (
            <View style={styles.nonMemberNotice}>
              <Text style={styles.nonMemberText}>You're no longer a member of this group</Text>
            </View>
          )
        ) : (
          // One-to-one chat input
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
              style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!message.trim()}
            >
              <Icon name="send" size={22} color="#fff" />
            </TouchableOpacity>
          </View>
        )}

        {/* Options Menu */}
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
                <Text style={styles.menuText}>{isGroup ? "Group Info" : "View Info"}</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={handleClearChat} style={styles.menuItem}>
                <Text style={[styles.menuText, styles.destructiveText]}>Clear Chat</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeContainer: {
    flex: 1,
    backgroundColor: "#ECE5DD",
  },
  container: {
    flex: 1,
    backgroundColor: "#ECE5DD",
  },
  centeredContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#ECE5DD",
  },
  loadingText: {
    marginTop: 10,
    fontSize: 16,
    color: "#666",
  },
  errorText: {
    fontSize: 18,
    color: "#666",
    marginBottom: 20,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    backgroundColor: "#fff",
    paddingVertical: 15,
    paddingHorizontal: 15,
    paddingTop: 40,
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
    paddingHorizontal: 8,
  },
  myMessageRow: {
    justifyContent: "flex-end",
  },
  theirMessageRow: {
    justifyContent: "flex-start",
  },
  messageBubble: {
    padding: 12,
    borderRadius: 8,
    maxWidth: "80%",
  },
  myMessageBubble: {
    backgroundColor: "#dcf8c6",
    borderTopLeftRadius: 8,
    borderTopRightRadius: 0,
  },
  theirMessageBubble: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 0,
    borderTopRightRadius: 8,
  },
  senderName: {
    fontSize: 12,
    color: "#555",
    marginBottom: 2,
    fontWeight: "500",
  },
  messageText: {
    color: "#000",
    fontSize: 16,
    lineHeight: 20,
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
  nonMemberNotice: {
    padding: 15,
    alignItems: "center",
    borderTopWidth: 1,
    borderTopColor: "#ddd",
    backgroundColor: "#f9f9f9",
  },
  nonMemberText: {
    color: "#999",
    fontSize: 14,
    fontStyle: "italic",
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    color: "#000",
    paddingVertical: 4,
    maxHeight: 80,
  },
  iconLeft: {
    marginRight: 8,
  },
  iconRight: {
    marginLeft: 8,
  },
  sendButton: {
    backgroundColor: "#25D366",
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    marginLeft: 8,
  },
  sendButtonDisabled: {
    backgroundColor: "#ccc",
  },
  // Announcement-only bottom bar (WhatsApp style): text only, centered, muted gray
  announcementOnlyBar: {
    paddingVertical: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#fff",
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  announcementOnlyText: {
    color: "#999",
    fontSize: 15,
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
    paddingHorizontal: 16,
  },
  menuText: {
    fontSize: 16,
    color: "#000",
  },
  destructiveText: {
    color: "red",
  },
  button: {
    backgroundColor: "#25D366",
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
});

export default ChatDetailScreen;
