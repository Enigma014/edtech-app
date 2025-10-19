// ContactProfileScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { authService, db } from '../../utils/firebaseConfig';
import firestore from "@react-native-firebase/firestore";
import auth from "@react-native-firebase/auth";
import Ionicons from "react-native-vector-icons/Ionicons";
import Icon from 'react-native-vector-icons/Ionicons';
export default function ContactProfileScreen({ route, navigation }) {
  const { contactId } = route.params;
  const [contact, setContact] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("ContactProfileScreen mounted with contactId:", contactId);
    
    const currentUser = auth().currentUser;
    if (currentUser) {
      setCurrentUser(currentUser);
      console.log("Current user:", currentUser.uid);
    } else {
      console.log("No user authenticated");
      Alert.alert("Error", "Please log in to view profiles");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!currentUser || !contactId) return;

    console.log("Fetching contact data for:", contactId);
    
    const fetchContact = async () => {
      try {
        setLoading(true);
        
        // Fetch contact data
        const contactDoc = await firestore().collection('users').doc(contactId).get();
        console.log("Contact document exists:", contactDoc.exists);
        
        if (contactDoc.exists) {
          const contactData = contactDoc.data();
          console.log("Contact data:", contactData);
          setContact(contactData);
        } else {
          console.log("Contact not found in database");
          Alert.alert("Error", "Contact not found");
        }

        // Fetch block status - check both directions
        const blockDoc1 = await firestore().collection('blocks')
          .doc(`${currentUser.uid}_${contactId}`)
          .get();
        
        const blockDoc2 = await firestore().collection('blocks')
          .doc(`${contactId}_${currentUser.uid}`)
          .get();

        console.log("User blocked contact:", blockDoc1.exists);
        console.log("Contact blocked user:", blockDoc2.exists);
        
        setIsBlocked(blockDoc1.exists); // Only show if current user blocked the contact
      } catch (error) {
        console.error("Error fetching contact:", error);
        Alert.alert("Error", "Failed to load contact information");
      } finally {
        setLoading(false);
      }
    };

    fetchContact();
  }, [currentUser, contactId]);

  const toggleBlock = async () => {
    if (!currentUser) {
      Alert.alert("Error", "Please log in to block/unblock contacts");
      return;
    }

    try {
      const blockRef = firestore().collection('blocks').doc(`${currentUser.uid}_${contactId}`);

      if (isBlocked) {
        // Unblock
        await blockRef.delete();
        setIsBlocked(false);
        Alert.alert('Unblocked', 'You have unblocked this contact.');
      } else {
        // Block
        await blockRef.set({
          blockerId: currentUser.uid,
          blockedId: contactId,
          blockerName: currentUser.displayName || currentUser.email,
          blockedName: contact?.name || 'Unknown',
          timestamp: firestore.FieldValue.serverTimestamp(),
        });
        setIsBlocked(true);
        Alert.alert('Blocked', 'You have blocked this contact. They will no longer be able to message you.');
      }
    } catch (error) {
      console.error("Error toggling block:", error);
      Alert.alert("Error", "Failed to update block status");
    }
  };

  const reportUser = () => {
    Alert.alert(
      "Report User",
      "Are you sure you want to report this user?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Report", 
          style: "destructive", 
          onPress: async () => {
            try {
              await firestore().collection('reports').add({
                reporterId: currentUser.uid,
                reportedId: contactId,
                reporterName: currentUser.displayName || currentUser.email,
                reportedName: contact?.name || 'Unknown',
                timestamp: firestore.FieldValue.serverTimestamp(),
              });
              Alert.alert("Reported", "User has been reported to administrators.");
            } catch (error) {
              console.error("Error reporting user:", error);
              Alert.alert("Error", "Failed to report user");
            }
          }
        },
      ]
    );
  };

  const deleteChat = () => {
    Alert.alert(
      "Delete Chat",
      "Are you sure you want to delete all chat history with this user?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Delete", 
          style: "destructive", 
          onPress: async () => {
            try {
              // Find and delete the chat between users
              const chatsSnapshot = await firestore()
                .collection('chats')
                .where('participants', 'array-contains', currentUser.uid)
                .get();

              let chatDeleted = false;
              
              for (const doc of chatsSnapshot.docs) {
                const chatData = doc.data();
                const participants = chatData.participants || [];
                
                if (participants.includes(contactId) && participants.length === 2) {
                  // Delete the chat document
                  await firestore().collection('chats').doc(doc.id).delete();
                  
                  // Also delete all messages in this chat
                  const messagesSnapshot = await firestore()
                    .collection('chats')
                    .doc(doc.id)
                    .collection('messages')
                    .get();
                  
                  const deletePromises = messagesSnapshot.docs.map(messageDoc => 
                    messageDoc.ref.delete()
                  );
                  
                  await Promise.all(deletePromises);
                  chatDeleted = true;
                  break;
                }
              }

              if (chatDeleted) {
                Alert.alert("Success", "Chat history has been deleted.");
                navigation.goBack(); // Go back to previous screen
              } else {
                Alert.alert("Info", "No chat history found to delete.");
              }
            } catch (error) {
              console.error("Error deleting chat:", error);
              Alert.alert("Error", "Failed to delete chat history");
            }
          }
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#25D366" />
        <Text>Loading profile...</Text>
      </View>
    );
  }

  if (!currentUser) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Please log in to view this profile</Text>
      </View>
    );
  }

  if (!contact) {
    return (
      <View style={styles.loadingContainer}>
        <Text>Contact information not available</Text>
        <Text style={styles.errorDetail}>Contact ID: {contactId}</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <TouchableOpacity 
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <Icon name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>
            {contact.name?.[0]?.toUpperCase() || '?'}
          </Text>
        </View>
        <Text style={styles.name}>{contact.name || 'Unknown User'}</Text>
        <Text style={styles.number}>{contact.phone || 'No phone number'}</Text>
        <Text style={styles.email}>{contact.email || ''}</Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status:</Text>
        <Text style={styles.status}>
          {contact.status || 'Hey there! I am using WhatsApp.'}
        </Text>
      </View>

      {/* Action Buttons */}
      <View style={styles.actionSection}>
        <TouchableOpacity 
          onPress={toggleBlock} 
          style={[styles.actionButton, isBlocked ? styles.unblockButton : styles.blockButton]}
        >
          <Text style={[styles.actionButtonText, isBlocked ? styles.unblockButtonText : styles.blockButtonText]}>
            {isBlocked ? 'Unblock Contact' : 'Block Contact'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={reportUser} 
          style={[styles.actionButton, styles.reportButton]}
        >
          <Text style={[styles.actionButtonText, styles.reportButtonText]}>
            Report User
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          onPress={deleteChat} 
          style={[styles.actionButton, styles.deleteButton]}
        >
          <Text style={[styles.actionButtonText, styles.deleteButtonText]}>
            Delete Chat History
          </Text>
        </TouchableOpacity>
      </View>

      {/* Block Status Info */}
      {isBlocked && (
        <View style={styles.infoSection}>
          <Text style={styles.infoText}>
            ⚠️ This contact is blocked. They cannot send you messages.
          </Text>
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: 15, 
    flex: 1,
    backgroundColor: '#fff'
  },
  backButton: {
    padding: 8,
    marginTop: 24,
  },
  loadingContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 20
  },
  errorDetail: {
    fontSize: 12,
    color: '#999',
    marginTop: 10
  },
  profile: { 
    alignItems: 'center', 
    marginBottom: 20,
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0'
  },
  avatar: { 
    backgroundColor: '#25D366', 
    borderRadius: 50, 
    width: 80, 
    height: 80, 
    justifyContent: 'center', 
    alignItems: 'center',
    marginBottom: 15
  },
  avatarText: { 
    fontSize: 30, 
    color: '#fff',
    fontWeight: 'bold'
  },
  name: { 
    fontSize: 22, 
    fontWeight: 'bold', 
    marginBottom: 5,
    color: '#000'
  },
  number: { 
    color: 'gray',
    fontSize: 16,
    marginBottom: 3
  },
  email: {
    color: 'gray',
    fontSize: 14
  },
  section: { 
    marginVertical: 10, 
    paddingVertical: 12,
    paddingHorizontal: 15,
    backgroundColor: '#f8f8f8',
    borderRadius: 10,
    marginHorizontal: 5
  },
  sectionTitle: {
    fontWeight: '600',
    color: '#000',
    marginBottom: 5,
    fontSize: 16
  },
  status: { 
    fontStyle: 'italic', 
    marginTop: 5,
    color: '#666',
    fontSize: 14
  },
  actionSection: {
    marginVertical: 20,
    paddingHorizontal: 5
  },
  actionButton: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 8,
    borderWidth: 1
  },
  actionButtonText: {
    fontWeight: '600',
    fontSize: 16
  },
  blockButton: {
    backgroundColor: '#fff',
    borderColor: 'red'
  },
  blockButtonText: {
    color: 'red'
  },
  unblockButton: {
    backgroundColor: '#f0f0f0',
    borderColor: '#666'
  },
  unblockButtonText: {
    color: '#666'
  },
  reportButton: {
    backgroundColor: '#fff',
    borderColor: 'orange'
  },
  reportButtonText: {
    color: 'orange'
  },
  deleteButton: {
    backgroundColor: '#fff',
    borderColor: '#666'
  },
  deleteButtonText: {
    color: '#666'
  },
  infoSection: {
    backgroundColor: '#fff3cd',
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#ffc107'
  },
  infoText: {
    color: '#856404',
    fontSize: 14
  }
});