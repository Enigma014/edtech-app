// chat.ts (React Native ✅)
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

export type ChatItemType = {
  id: string;
  name: string;
  lastMessage: string;
  updatedAt: string; // ISO string
  isGroup?: boolean;
  isCommunity?: boolean;
  otherUserId?: string;
};

/**
 * Subscribe to users collection and return unsubscribe.
 * Calls onUpdate with ChatItemType[] whenever snapshot changes.
 */
export async function fetchChatsForUser(
  currentUid: string,
  onUpdate: (items: ChatItemType[]) => void,
) {
  if (!currentUid) return;

  try {
    // 1️⃣ Get all chatSummaries where chatType is "chat" and currentUid is part of it
    const snapshot = await firestore()
      .collection('chatSummaries')
      .where('chatType', '==', 'chat')
      .get();

    const chatPromises: Promise<ChatItemType | null>[] = snapshot.docs.map(
      async doc => {
        const data: any = doc.data();

        const lastSender: string = data.lastSender;
        const lastReceiver: string = data.lastReceiver;

        // Skip chats where the other participant is yourself only
        const otherUserId =
          lastSender === currentUid ? lastReceiver : lastSender;
        if (!otherUserId || otherUserId === currentUid) return null;

        // Fetch full user profile
        const userDoc = await firestore()
          .collection('users')
          .doc(otherUserId)
          .get();
        if (!userDoc.exists) return null;
        const userData = userDoc.data();
        return {
          id: doc.id, // chatSummary ID
          name: userData?.name || 'Unknown',
          lastMessage: data.lastMessage || '',
          updatedAt:
            data.lastTimestamp?.toDate().toISOString() ||
            new Date().toISOString(),
          otherUserId: otherUserId,
          isGroup: false,
        } as ChatItemType;
      },
    );

    const chatItems = (await Promise.all(chatPromises)).filter(
      Boolean,
    ) as ChatItemType[];

    // Return merged chat list
    onUpdate(chatItems);
  } catch (err) {
    console.error('Error fetching chats:', err);
    onUpdate([]);
  }
}

/**
 * Subscribe to groups for current user and return unsubscribe.
 */
export function subscribeToGroups(
  currentUid: string,
  onUpdate: (items: ChatItemType[]) => void,
  excludeIds: string[] = [], // 👈 new optional param
) {
  if (!currentUid) return () => {};

  const unsub = firestore()
    .collection('groups')
    .where('members', 'array-contains', currentUid)
    .onSnapshot(
      snapshot => {
        const groups: ChatItemType[] = snapshot.docs
          .map(doc => {
            const data: any = doc.data() || {};
            if (excludeIds.includes(doc.id)) return null; // 👈 skip groups already in summaries
            if (data.isCommunityGroup) return null;

            if (data.communityId) {
              return null; // Skip community groups
            }
            return {
              id: doc.id,
              name: data.name || 'Unnamed Group',
              lastMessage: data.lastMessage || '',
              updatedAt: data.lastMessageTime
                ? data.lastMessageTime.toDate().toISOString()
                : data.createdAt
                ? data.createdAt.toDate().toISOString()
                : new Date().toISOString(),
              isGroup: true,
              isCommunity: !!data.isCommunityGroup,
            } as ChatItemType;
          })
          .filter(Boolean) as ChatItemType[];

        onUpdate(groups);
      },
      err => {
        console.error('subscribeToGroups error:', err);
        onUpdate([]);
      },
    );

  return unsub;
}

/**
 * Subscribe to chatSummaries and resolve display names for 1:1 / group chats.
 * Calls onUpdate with ChatItemType[].
 * NOTE: This function will perform additional lightweight doc reads for user/group names.
 */
export function subscribeToChatSummaries(
  currentUid: string,
  onUpdate: (items: ChatItemType[]) => void,
) {
  if (!currentUid) return () => {};

  const q = firestore()
    .collection('chatSummaries')
    .where('users', 'array-contains', currentUid)
    .orderBy('lastTimestamp', 'desc');

  const unsub = q.onSnapshot(
    async snapshot => {
      if (!snapshot || snapshot.empty) {
        onUpdate([]);
        return;
      }

      try {
        const summaries = await Promise.all(
          snapshot.docs.map(async doc => {
            const data: any = doc.data() || {};
            const chatType: string = (data.chatType || 'chat').toLowerCase();
            const lastMessage = data.lastMessage || '';
            const lastTimestamp = data.lastTimestamp
              ? data.lastTimestamp.toDate
                ? data.lastTimestamp.toDate()
                : new Date(data.lastTimestamp)
              : new Date();
            const updatedAtISO =
              lastTimestamp instanceof Date
                ? lastTimestamp.toISOString()
                : new Date().toISOString();

            if (chatType === 'chat') {
              const usersArr = Array.isArray(data.users) ? data.users : [];
              const otherUserId =
                usersArr.find((u: string) => u !== currentUid) ||
                data.lastSender ||
                null;

              let displayName = data.contactName || 'Unknown';
              if (otherUserId) {
                try {
                  const userDoc = await firestore()
                    .collection('users')
                    .doc(otherUserId)
                    .get();
                  const userInfo: any = userDoc.exists()
                    ? userDoc.data()
                    : null;
                  displayName =
                    userInfo?.displayName ||
                    userInfo?.name ||
                    userInfo?.email ||
                    displayName;
                } catch (err) {
                  console.warn(
                    'subscribeToChatSummaries: failed to fetch user',
                    otherUserId,
                    err,
                  );
                }
              }

              return {
                id: doc.id,
                name: displayName,
                lastMessage,
                updatedAt: updatedAtISO,
                isGroup: false,
                otherUserId: otherUserId || '',
                unreadCount: data[`unread_${currentUid}`] || 0

              } as ChatItemType;
            }

            // group/community
            if (chatType === 'group' || chatType === 'community') {
              const groupId = data.groupId || doc.id;
              let groupName = data.name || 'Unnamed Group';
              let isCommunity = chatType === 'community';
              try {
                const groupDoc = await firestore()
                  .collection('groups')
                  .doc(groupId)
                  .get();
                if (groupDoc.exists()) {
                  const g = groupDoc.data() as any;
                  groupName = g?.name || groupName;
                  isCommunity = isCommunity || !!g?.isCommunityGroup;
                }
              } catch (err) {
                console.warn(
                  'subscribeToChatSummaries: failed to fetch group',
                  groupId,
                  err,
                );
              }
              if (isCommunity) return null; // Skip community groups here
              return {
                id: doc.id,
                name: groupName,
                lastMessage,
                updatedAt: updatedAtISO,
                isGroup: true,
                unreadCount: data[`unread_${currentUid}`] || 0,
                isCommunity,
              } as ChatItemType;
            }

            // fallback
            return {
              id: doc.id,
              name: data.name || 'Unknown',
              lastMessage,
              updatedAt: updatedAtISO,
              isGroup: false,
            } as ChatItemType;
          }),
        );

        onUpdate(summaries.filter(Boolean) as ChatItemType[]);
      } catch (err) {
        console.error('subscribeToChatSummaries processing error:', err);
        onUpdate([]);
      }
    },
    err => {
      console.error('subscribeToChatSummaries error:', err);
      onUpdate([]);
    },
  );

  return unsub;
}

/**
 * Merge chats: dedupe by id and sort by updatedAt desc.
 * Exported so UI can use the same merging strategy when combining multiple snapshot sources.
 */
export function mergeChats(
  prevChats: ChatItemType[],
  newChats: ChatItemType[],
) {
  const map = new Map<string, ChatItemType>();

  const validPrevChats = (prevChats || []).filter(chat => chat && chat.id);
  const validNewChats = (newChats || []).filter(chat => chat && chat.id);

  [...validPrevChats, ...validNewChats].forEach(chat => {
    if (chat && chat.id) {
      map.set(chat.id, chat);
    }
  });

  const merged = Array.from(map.values());
  return merged.sort((a, b) => {
    const aMs = Date.parse(a.updatedAt || '') || 0;
    const bMs = Date.parse(b.updatedAt || '') || 0;
    return bMs - aMs;
  });
}
/**
 * Generate consistent chatId from two userIds.
 * NOTE: this sorts IDs to make the chatId stable regardless of sender order:
 * result: "abc_def" (alphabetical). If you want sender_receiver order (no sort),
 * change to `return \`\${user1}_\${user2}\``.
 */
export function generateChatId(user1: string, user2: string) {
  if (!user1 || !user2) throw new Error('Both user IDs are required');
  return [user1, user2].sort().join('_');
}

/**
 * Send a message (text or file)
 * - chatType: "chat" | "group" | "community" (default "chat")
 * - optimisticCallback: optional UI callback to show optimistic message
 */

export async function sendMessage(
  chatId: string,
  senderId: string,
  receiverId: string,
  text: string,
  optimisticCallback?: (msg: any) => void,
  fileData: any = null,
  chatType: 'chat' | 'group' | 'community' = 'chat',
) {
  if (
    !chatId ||
    !senderId ||
    (!receiverId && chatType === 'chat') ||
    (!text?.trim() && !fileData)
  ) {
    console.error('Missing required fields');
    return;
  }

  // ✅ Fetch sender info (name)
  const senderSnap = await firestore().collection('users').doc(senderId).get();
  const senderName = senderSnap.exists()
    ? senderSnap.data()?.name || 'Unknown'
    : 'Unknown';

  const messagePayload: any = {
    chatType,
    senderId,
    senderName, // 👈 include name
    receiverId,
    text: text?.trim() || '',
    createdAt: firestore.FieldValue.serverTimestamp(),
    isRead: false,
    messageType: fileData ? 'image' : 'text',
    readBy: [senderId],
  };

  if (fileData) {
    messagePayload.fileUrl = fileData.downloadURL;
    messagePayload.fileName = fileData.fileName || null;
  }

  if (optimisticCallback) {
    optimisticCallback({
      id: `temp-${Date.now()}`,
      ...messagePayload,
      createdAt: new Date(),
      isOptimistic: true,
    });
  }

  const messagesRef = firestore()
    .collection('chats')
    .doc(chatId)
    .collection('messages');

  const messageDocRef = await messagesRef.add(messagePayload);

  // ✅ Update chat summary (same logic as before)
  const summaryRef = firestore().collection('chatSummaries').doc(chatId);
  const lastMessageText = fileData ? '📷 Image' : (text || '').trim();

  if (chatType === 'group' || chatType === 'community') {
    const groupDoc = await firestore().collection('groups').doc(chatId).get();
    const members = groupDoc.exists() ? groupDoc.data()?.members || [] : [];
    const unreadUpdates: Record<string, any> = {};
    members.forEach((uid) => {
      if (uid !== senderId) {
        unreadUpdates[`unread_${uid}`] = firestore.FieldValue.increment(1);
      }
    });
    await summaryRef.set(
      {
        chatType,
        groupId: chatId,
        users: members,
        lastMessage: lastMessageText,
        senderName: senderName,
        lastSender: senderId,
        lastMessageId: messageDocRef.id,
        lastTimestamp: firestore.FieldValue.serverTimestamp(),
        ...unreadUpdates,
      },
      { merge: true },
    );
  } else {
    await summaryRef.set(
      {
        chatType,
        users: [senderId, receiverId],
        lastMessage: lastMessageText,
        lastSender: senderId,
        lastReceiver: receiverId,
        lastMessageId: messageDocRef.id,
        lastTimestamp: firestore.FieldValue.serverTimestamp(),
        [`unread_${receiverId}`]: firestore.FieldValue.increment(1),
      },
      { merge: true },
    );
  }

  return messageDocRef.id;
}

/**
 * Listen to messages in real-time (keeps previous behavior).
 * Returns messages in ascending order (old → new).
 */
export function listenMessages(chatId: string, callback: any, limitCount = 30) {
  if (!chatId) return;

  const q = firestore()
    .collection('chats')
    .doc(chatId)
    .collection('messages')
    .orderBy('createdAt', 'desc')
    .limit(limitCount);

  return q.onSnapshot(snapshot => {
    const msgs = snapshot.docs.map(doc => {
      const data = doc.data() as any;
      return {
        id: doc.id,
        chatType: data.chatType || 'chat',
        text: data.text,
        senderId: data.senderId,
        senderName: data.senderName || '',
        receiverId: data.receiverId,
        createdAt: data.createdAt?.toDate?.() || new Date(),
        isRead: data.isRead || false,
        readAt: data.readAt?.toDate?.() || null,
        messageType: data.messageType || 'text',
        fileUrl: data.fileUrl || null,
        fileName: data.fileName || null,
        fileType: data.fileType || null,
        fileSize: data.fileSize || null,
      };
    });
    // snapshot is ordered desc, reverse to ascending for UI
    callback(msgs.reverse(), snapshot.docs[snapshot.docs.length - 1] || null);
  });
}

/**
 * Load more messages (pagination)
 */
export async function loadMoreMessages(
  chatId: string,
  lastDoc: any,
  limitCount = 30,
) {
  if (!chatId || !lastDoc) return { messages: [], lastDoc: null };

  const q = firestore()
    .collection('chats')
    .doc(chatId)
    .collection('messages')
    .orderBy('createdAt', 'desc')
    .startAfter(lastDoc)
    .limit(limitCount);

  const snapshot = await q.get();

  const messages = snapshot.docs.map(doc => {
    const data = doc.data() as any;
    return {
      id: doc.id,
      chatType: data.chatType || 'chat',
      text: data.text,
      senderId: data.senderId,
      senderName: data.senderName || '',
      receiverId: data.receiverId,
      createdAt: data.createdAt?.toDate?.() || new Date(),
      isRead: data.isRead || false,
      readAt: data.readAt?.toDate?.() || null,
      messageType: data.messageType || 'text',
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

  const summaryRef = firestore().collection("chatSummaries").doc(chatId);

  try {
    // ✅ Always reset badge counts
    await summaryRef.set(
      {
        [`unread_${currentUserId}`]: 0,
        [`seenAt_${currentUserId}`]: firestore.FieldValue.serverTimestamp(),
      },
      { merge: true }
    );

    // ✅ Mark 1:1 messages read (your current method)
    const messagesRef = firestore()
      .collection("chats")
      .doc(chatId)
      .collection("messages");

    const chatSummarySnap = await summaryRef.get();
    const chatType = chatSummarySnap.exists() ? chatSummarySnap.data()?.chatType : "chat";

    if (chatType === "chat") {
      // ✅ 1:1
      const unreadSnapshot = await messagesRef
        .where("receiverId", "==", currentUserId)
        .where("isRead", "==", false)
        .get();

      const batch = firestore().batch();
      unreadSnapshot.forEach((docSnap) => {
        batch.update(docSnap.ref, {
          isRead: true,
          readAt: firestore.FieldValue.serverTimestamp(),
        });
      });

      await batch.commit();
    } else {
      // ✅ group/community → use readBy
      const unreadGroupSnap = await messagesRef
        .where("senderId", "!=", currentUserId)
        .limit(200)
        .get();

      const batch = firestore().batch();

      unreadGroupSnap.forEach((docSnap) => {
        const data = docSnap.data() as any;
        const readBy: string[] = Array.isArray(data.readBy) ? data.readBy : [];

        if (!readBy.includes(currentUserId)) {
          batch.update(docSnap.ref, {
            readBy: firestore.FieldValue.arrayUnion(currentUserId),
          });
        }
      });

      await batch.commit();
    }
  } catch (error) {
    console.error("Error marking messages as read:", error);
  }
}



/**
 * Delete file safely (RN compatible)
 */
async function deleteFileFromUrl(fileUrl: string) {
  try {
    if (!fileUrl) return;
    const path = fileUrl
      .replace(
        /^https?:\/\/firebasestorage\.googleapis\.com\/v0\/b\/[^/]+\/o\//,
        '',
      )
      .split('?')[0];
    const ref = storage().ref(decodeURIComponent(path));
    await ref.delete();
  } catch (err) {
    console.error('Error deleting file from storage:', err);
  }
}

/**
 * Delete one message
 */
export async function deleteMessage(chatId: string, messageId: string) {
  const messageRef = firestore()
    .collection('chats')
    .doc(chatId)
    .collection('messages')
    .doc(messageId);

  const snap = await messageRef.get();

  if (snap.exists()) {
    const data = snap.data() as any;
    if (data?.fileUrl) await deleteFileFromUrl(data.fileUrl);
  }

  await messageRef.delete();

  // Update summary to reflect newest message (or clear if none)
  const messagesRef = firestore()
    .collection('chats')
    .doc(chatId)
    .collection('messages');

  const summaryRef = firestore().collection('chatSummaries').doc(chatId);
  const snapshot = await messagesRef
    .orderBy('createdAt', 'desc')
    .limit(1)
    .get();

  if (!snapshot.empty) {
    const lastMsg = snapshot.docs[0].data() as any;
    await summaryRef.update({
      lastMessage: lastMsg.text || '',
      lastSender: lastMsg.senderId || '',
      lastReceiver: lastMsg.receiverId || '',
      lastMessageId: snapshot.docs[0].id,
      lastTimestamp:
        lastMsg.createdAt || firestore.FieldValue.serverTimestamp(),
    });
  } else {
    await summaryRef.update({
      lastMessage: '',
      lastSender: '',
      lastReceiver: '',
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
    .collection('chats')
    .doc(chatId)
    .collection('messages');

  const snapshot = await messagesRef.get();
  const batch = firestore().batch();

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() as any;
    if (data.fileUrl) await deleteFileFromUrl(data.fileUrl);
    batch.delete(docSnap.ref);
  }

  await batch.commit();

  const summaryRef = firestore().collection('chatSummaries').doc(chatId);
  await summaryRef.update({
    lastMessage: '',
    lastSender: '',
    lastReceiver: '',
    lastMessageId: null,
    lastTimestamp: firestore.FieldValue.serverTimestamp(),
    [`unread_${currentUserId}`]: 0,
  });
}
