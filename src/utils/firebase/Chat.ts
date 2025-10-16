// chat.ts (React Native ✅)
import firestore from "@react-native-firebase/firestore";
import storage from "@react-native-firebase/storage";

/** 
 * Generate consistent chatId from two userIds 
 */
export function generateChatId(user1: string, user2: string) {
  if (!user1 || !user2) throw new Error("Both user IDs are required");
  return [user1, user2].sort().join("_");
}

/** 
 * Send a message (text or file)
 */
export async function sendMessage(
  chatId: string,
  senderId: string,
  receiverId: string,
  text: string,
  optimisticCallback?: (msg: any) => void,
  fileData: any = null
) {
  if (!chatId || !senderId || !receiverId || (!text?.trim() && !fileData)) {
    console.error("Missing required fields");
    return;
  }

  const messagePayload: any = {
    senderId,
    receiverId,
    createdAt: firestore.FieldValue.serverTimestamp(),
    isRead: false,
    readAt: null,
  };

  if (text?.trim()) {
    messagePayload.text = text.trim();
  }

  if (fileData) {
    messagePayload.fileUrl = fileData.downloadURL;
    messagePayload.fileName = fileData.fileName || null;
    messagePayload.fileType = fileData.fileType || null;
    messagePayload.fileSize = fileData.fileSize || null;
    messagePayload.messageType = "image";
  } else {
    messagePayload.messageType = "text";
  }

  // Optimistic message for UI
  if (optimisticCallback) {
    optimisticCallback({
      id: `temp-${Date.now()}-${Math.random()}`,
      ...messagePayload,
      createdAt: new Date(),
      isOptimistic: true,
    });
  }

  try {
    const messagesRef = firestore()
      .collection("chats")
      .doc(chatId)
      .collection("messages");

    const messageDoc = await messagesRef.add(messagePayload);

    const summaryRef = firestore().collection("chatSummaries").doc(chatId);
    const lastMessageText = fileData ? "📷 Image" : text.trim();

    await summaryRef.set(
      {
        users: [senderId, receiverId],
        lastMessage: lastMessageText,
        lastSender: senderId,
        lastReceiver: receiverId,
        lastMessageId: messageDoc.id,
        lastTimestamp: firestore.FieldValue.serverTimestamp(),
        [`unread_${receiverId}`]: firestore.FieldValue.increment(1),
      },
      { merge: true }
    );

    return messageDoc.id;
  } catch (error) {
    console.error("Error sending message:", error);
    throw error;
  }
}

/** 
 * Listen to messages in real-time
 */
export function listenMessages(chatId: string, callback: any, limitCount = 30) {
  if (!chatId) return;

  const q = firestore()
    .collection("chats")
    .doc(chatId)
    .collection("messages")
    .orderBy("createdAt", "desc")
    .limit(limitCount);

  return q.onSnapshot(snapshot => {
    const msgs = snapshot.docs.map(doc => {
      const data = doc.data();
      return {
        id: doc.id,
        text: data.text,
        senderId: data.senderId,
        receiverId: data.receiverId,
        createdAt: data.createdAt?.toDate() || new Date(),
        isRead: data.isRead || false,
        readAt: data.readAt?.toDate() || null,
        messageType: data.messageType || "text",
        fileUrl: data.fileUrl || null,
        fileName: data.fileName || null,
        fileType: data.fileType || null,
        fileSize: data.fileSize || null,
      };
    });
    callback(msgs.reverse(), snapshot.docs[snapshot.docs.length - 1] || null);
  });
}

/** 
 * Load more messages (pagination)
 */
export async function loadMoreMessages(chatId: string, lastDoc: any, limitCount = 30) {
  if (!chatId || !lastDoc) return { messages: [], lastDoc: null };

  const q = firestore()
    .collection("chats")
    .doc(chatId)
    .collection("messages")
    .orderBy("createdAt", "desc")
    .startAfter(lastDoc)
    .limit(limitCount);

  const snapshot = await q.get();

  const messages = snapshot.docs.map(doc => {
    const data = doc.data();
    return {
      id: doc.id,
      text: data.text,
      senderId: data.senderId,
      receiverId: data.receiverId,
      createdAt: data.createdAt?.toDate() || new Date(),
      isRead: data.isRead || false,
      readAt: data.readAt?.toDate() || null,
      messageType: data.messageType || "text",
      fileUrl: data.fileUrl || null,
    };
  });

  return {
    messages: messages.reverse(),
    lastDoc: snapshot.docs[snapshot.docs.length - 1] || null,
  };
}

/** 
 * Mark unread messages as read 
 */
export async function markMessagesAsRead(chatId: string, currentUserId: string) {
  if (!chatId || !currentUserId) return;

  const q = firestore()
    .collection("chats")
    .doc(chatId)
    .collection("messages")
    .where("receiverId", "==", currentUserId)
    .where("isRead", "==", false);

  const snapshot = await q.get();
  if (snapshot.empty) return;

  const batch = firestore().batch();

  snapshot.docs.forEach(docSnap => {
    batch.update(docSnap.ref, {
      isRead: true,
      readAt: firestore.FieldValue.serverTimestamp(),
    });
  });

  const summaryRef = firestore().collection("chatSummaries").doc(chatId);
  batch.set(
    summaryRef,
    {
      [`unread_${currentUserId}`]: 0,
      [`seenAt_${currentUserId}`]: firestore.FieldValue.serverTimestamp(),
    },
    { merge: true }
  );

  await batch.commit();
}

/** 
 * Delete file safely (RN compatible)
 */
async function deleteFileFromUrl(fileUrl: string) {
  try {
    if (!fileUrl) return;
    const path = fileUrl
      .replace(/^https?:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\//, "")
      .split("?")[0];
    const ref = storage().ref(decodeURIComponent(path));
    await ref.delete();
  } catch (err) {
    console.error("Error deleting file from storage:", err);
  }
}

/** 
 * Delete one message 
 */
export async function deleteMessage(chatId: string, messageId: string) {
  const messageRef = firestore()
    .collection("chats")
    .doc(chatId)
    .collection("messages")
    .doc(messageId);

  const snap = await messageRef.get();

  if (snap.exists) {
    const data = snap.data();
    if (data?.fileUrl) await deleteFileFromUrl(data.fileUrl);
  }

  await messageRef.delete();

  // Update summary
  const messagesRef = firestore()
    .collection("chats")
    .doc(chatId)
    .collection("messages");

  const summaryRef = firestore().collection("chatSummaries").doc(chatId);
  const snapshot = await messagesRef.orderBy("createdAt", "desc").limit(1).get();

  if (!snapshot.empty) {
    const lastMsg = snapshot.docs[0].data();
    await summaryRef.update({
      lastMessage: lastMsg.text || "",
      lastSender: lastMsg.senderId || "",
      lastReceiver: lastMsg.receiverId || "",
      lastMessageId: snapshot.docs[0].id,
      lastTimestamp: lastMsg.createdAt || firestore.FieldValue.serverTimestamp(),
    });
  } else {
    await summaryRef.update({
      lastMessage: "",
      lastSender: "",
      lastReceiver: "",
      lastMessageId: null,
      lastTimestamp: firestore.FieldValue.serverTimestamp(),
    });
  }
}

/** 
 * Delete all messages in a chat 
 */
export async function deleteAllMessages(chatId: string, currentUserId: string) {
  const messagesRef = firestore()
    .collection("chats")
    .doc(chatId)
    .collection("messages");

  const snapshot = await messagesRef.get();
  const batch = firestore().batch();

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.fileUrl) await deleteFileFromUrl(data.fileUrl);
    batch.delete(docSnap.ref);
  }

  await batch.commit();

  const summaryRef = firestore().collection("chatSummaries").doc(chatId);
  await summaryRef.update({
    lastMessage: "",
    lastSender: "",
    lastReceiver: "",
    lastMessageId: null,
    lastTimestamp: firestore.FieldValue.serverTimestamp(),
    [`unread_${currentUserId}`]: 0,
  });
}
