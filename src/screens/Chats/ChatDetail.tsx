import React, { useState, useEffect } from "react";
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
} from "react-native";
import Icon from "react-native-vector-icons/MaterialCommunityIcons";
import firestore from "@react-native-firebase/firestore";


const ChatDetailScreen = ({ route, navigation }) => {
  const { chatId, name } = route.params;
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const unsubscribe = firestore()
      .collection("chats")
      .doc(chatId)
      .collection("messages")
      .orderBy("createdAt", "asc")
      .onSnapshot((snapshot) => {
        const msgData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }));
        setMessages(msgData);
      });

    return () => unsubscribe();
  }, [chatId]);

  const handleSend = async () => {
    if (!message.trim()) return;

    const msg = {
      text: message,
      createdAt: firestore.FieldValue.serverTimestamp(),
      senderId: "user1",
    };

    await firestore()
      .collection("chats")
      .doc(chatId)
      .collection("messages")
      .add(msg);

    await firestore().collection("chats").doc(chatId).set(
      {
        lastMessage: message,
        updatedAt: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    setMessage("");
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <TouchableOpacity onPress={() => navigation.goBack()}>
              <Icon name="arrow-left" size={24} color="#000" />
            </TouchableOpacity>
            <TouchableOpacity
  onPress={() => {
    const { isGroup, contactId } = route.params || {};
    console.log("Pressed chat name → Params:", route.params);

    if (isGroup) {
      navigation.navigate("GroupInfoScreen", { groupId: chatId });
    } else if (contactId) {
      navigation.navigate("ContactProfileScreen", { contactId });
    } else {
      console.warn("No valid navigation target found.");
    }
  }}
>
  <Text style={styles.contactName}>{name}</Text>
</TouchableOpacity>



          </View>

          <View style={styles.headerIcons}>
            {/* <Icon name="phone-outline" size={22} color="#000" style={styles.headerIcon} /> */}
            <Icon name="dots-vertical" size={22} color="#000" />
          </View>
        </View>

        {/* Messages */}
        <FlatList<any>
          data={messages}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.chatContainer}
          renderItem={({ item }) => (
            <View
              style={[
                styles.messageRow,
                item.senderId === "user1"
                  ? styles.myMessageRow
                  : styles.theirMessageRow,
              ]}
            >
              <View
                style={[
                  styles.messageBubble,
                  item.senderId === "user1"
                    ? styles.myMessage
                    : styles.theirMessage,
                ]}
              >
                <Text style={styles.messageText}>{item.text}</Text>
              </View>
            </View>
          )}
        />

        {/* Bottom Input */}
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
            <Icon name="microphone" size={22} color="#fff" />
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#ECE5DD" },

  // ✅ Header styling
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
  headerIcons: { flexDirection: "row", alignItems: "center" },
  headerIcon: { marginHorizontal: 6 },

  // ✅ FIXED Chat area - Proper alignment
  chatContainer: { 
    padding: 10,
    flexGrow: 1,
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
  
  myMessage: {
    backgroundColor: "#dcf8c6",
    borderTopRightRadius: 0,
  },
  
  theirMessage: {
    backgroundColor: "#fff",
    borderTopLeftRadius: 0,
  },
  
  messageText: { 
    color: "#000", 
    fontSize: 16,
    lineHeight: 20,
  },

  // ✅ Input bar styling
  bottomWrapper: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 10,
    paddingVertical: 6,
    backgroundColor: "#fff",
    marginBottom: 0,
  },
  inputWrapper: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#f2f2f2",
    borderRadius: 25,
    flex: 1,
    paddingHorizontal: 10,
  },
  textInput: {
    flex: 1,
    fontSize: 15,
    color: "#000",
    paddingVertical: 6,
  },
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
});

export default ChatDetailScreen;