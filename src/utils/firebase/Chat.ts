// chat.ts for React Native ✅

import { db, storage } from "../firebaseConfig"; // ✅ no .js extension in RN
import {
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp,
  limit,
  startAfter,
  getDocs,
  doc,
  setDoc,
  increment,
  writeBatch,
  where,
  getDoc,
  updateDoc,
  deleteDoc,
} from "firebase/firestore";

import { ref as storageRef, deleteObject } from "firebase/storage";

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
    createdAt: serverTimestamp(),
    isRead: false,
    readAt: null,
  };

  if (text?.trim()) {
    messagePayload.text = text.trim();
  }

  if (fileData) {
    // ✅ In RN, always upload first → pass downloadURL to fileData
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
    const messagesRef = collection(db, "chats", chatId, "messages");
    const messageDoc = await addDoc(messagesRef, messagePayload);

    const summaryRef = doc(db, "chatSummaries", chatId);
    const lastMessageText = fileData ? "📷 Image" : text.trim();

    await setDoc(
      summaryRef,
      {
        users: [senderId, receiverId],
        lastMessage: lastMessageText,
        lastSender: senderId,
        lastReceiver: receiverId,
        lastMessageId: messageDoc.id,
        lastTimestamp: serverTimestamp(),
        [`unread_${receiverId}`]: increment(1),
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

  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "desc"),
    limit(limitCount)
  );

  return onSnapshot(q, (snapshot) => {
    const msgs = snapshot.docs.map((doc) => {
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

  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "desc"),
    startAfter(lastDoc),
    limit(limitCount)
  );

  const snapshot = await getDocs(q);

  const messages = snapshot.docs.map((doc) => {
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

  const q = query(
    collection(db, "chats", chatId, "messages"),
    where("receiverId", "==", currentUserId),
    where("isRead", "==", false)
  );

  const snapshot = await getDocs(q);
  if (snapshot.empty) return;

  const batch = writeBatch(db);

  snapshot.docs.forEach((docSnap) => {
    batch.update(docSnap.ref, { isRead: true, readAt: serverTimestamp() });
  });

  const summaryRef = doc(db, "chatSummaries", chatId);
  batch.set(summaryRef, {
    [`unread_${currentUserId}`]: 0,
    [`seenAt_${currentUserId}`]: serverTimestamp(),
  }, { merge: true });

  await batch.commit();
}

/** 
 * Delete file safely (RN compatible)
 */
async function deleteFileFromUrl(fileUrl: string) {
  try {
    if (!fileUrl) return;
    // ✅ Convert Firebase download URL into storage path
    const path = fileUrl
      .replace(/^https?:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\//, "")
      .split("?")[0];
    const fileRef = storageRef(storage, decodeURIComponent(path));
    await deleteObject(fileRef);
  } catch (err) {
    console.error("Error deleting file from storage:", err);
  }
}

/** 
 * Delete one message 
 */
export async function deleteMessage(chatId: string, messageId: string) {
  const messageRef = doc(db, "chats", chatId, "messages", messageId);
  const snap = await getDoc(messageRef);

  if (snap.exists()) {
    const data = snap.data();
    if (data.fileUrl) await deleteFileFromUrl(data.fileUrl);
  }

  await deleteDoc(messageRef);

  const messagesRef = collection(db, "chats", chatId, "messages");
  const summaryRef = doc(db, "chatSummaries", chatId);
  const snapshot = await getDocs(query(messagesRef, orderBy("createdAt", "desc"), limit(1)));

  if (!snapshot.empty) {
    const lastMsg = snapshot.docs[0].data();
    await updateDoc(summaryRef, {
      lastMessage: lastMsg.text || "",
      lastSender: lastMsg.senderId || "",
      lastReceiver: lastMsg.receiverId || "",
      lastMessageId: snapshot.docs[0].id,
      lastTimestamp: lastMsg.createdAt || serverTimestamp(),
    });
  } else {
    await updateDoc(summaryRef, {
      lastMessage: "",
      lastSender: "",
      lastReceiver: "",
      lastMessageId: null,
      lastTimestamp: serverTimestamp(),
    });
  }
}

/** 
 * Delete all messages in a chat 
 */
export async function deleteAllMessages(chatId: string, currentUserId: string) {
  const messagesRef = collection(db, "chats", chatId, "messages");
  const snapshot = await getDocs(messagesRef);

  const batch = writeBatch(db);
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    if (data.fileUrl) await deleteFileFromUrl(data.fileUrl);
    batch.delete(docSnap.ref);
  }
  await batch.commit();

  const summaryRef = doc(db, "chatSummaries", chatId);
  await updateDoc(summaryRef, {
    lastMessage: "",
    lastSender: "",
    lastReceiver: "",
    lastMessageId: null,
    lastTimestamp: serverTimestamp(),
    [`unread_${currentUserId}`]: 0,
  });
}
