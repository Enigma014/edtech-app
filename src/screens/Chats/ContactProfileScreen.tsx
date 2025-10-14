// ContactProfileScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert, ActivityIndicator } from 'react-native';
import { authService, db } from '../../utils/firebaseConfig'; // Import from your services file
import firestore from "@react-native-firebase/firestore";
export default function ContactProfileScreen({ route }) {
  const { contactId } = route.params;
  const [contact, setContact] = useState(null);
  const [isBlocked, setIsBlocked] = useState(false);
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    console.log("ContactProfileScreen mounted with contactId:", contactId);
    
    // Use the authService from your firebaseServices
    const unsubscribe = authService.onAuthStateChanged((user) => {
      console.log("Auth state changed:", user ? "User logged in" : "No user");
      if (user) {
        setCurrentUser(user);
      } else {
        console.log("No user authenticated");
        Alert.alert("Error", "Please log in to view profiles");
        setLoading(false);
      }
    });

    return unsubscribe;
  }, []);

  useEffect(() => {
    if (!currentUser || !contactId) return;

    console.log("Fetching contact data for:", contactId);
    
    const fetchContact = async () => {
      try {
        setLoading(true);
        
        // Use the db from your firebaseServices
        const contactDoc = await db.collection('users').doc(contactId).get();
        console.log("Contact document exists:", contactDoc.exists);
        
        if (contactDoc.exists) {
          const contactData = contactDoc.data();
          console.log("Contact data:", contactData);
          setContact(contactData);
        } else {
          console.log("Contact not found in database");
          Alert.alert("Error", "Contact not found");
        }

        // Fetch block status
        const blockDoc = await db.collection('blocks').doc(`${currentUser.uid}_${contactId}`).get();
        console.log("Block status exists:", blockDoc.exists);
        setIsBlocked(blockDoc.exists);
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
      const blockRef = db.collection('blocks').doc(`${currentUser.uid}_${contactId}`);

      if (isBlocked) {
        await blockRef.delete();
        setIsBlocked(false);
        Alert.alert('Unblocked', 'You have unblocked this contact.');
      } else {
        await blockRef.set({
          blocker: currentUser.uid,
          blocked: contactId,
          timestamp: firestore.FieldValue.serverTimestamp(),
        });
        setIsBlocked(true);
        Alert.alert('Blocked', 'You have blocked this contact.');
      }
    } catch (error) {
      console.error("Error toggling block:", error);
      Alert.alert("Error", "Failed to update block status");
    }
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

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionText}>Audio</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionText}>Video</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionText}>Pay</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}>
          <Text style={styles.actionText}>Search</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Status:</Text>
        <Text style={styles.status}>
          {contact.status || 'Hey there! I am using WhatsApp.'}
        </Text>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Media, Links, and Docs</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {contact.media && contact.media.length > 0 ? (
            contact.media.map((item, i) => (
              <Image key={i} source={{ uri: item.url }} style={styles.thumbnail} />
            ))
          ) : (
            <Text style={styles.noMedia}>No media shared</Text>
          )}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <TouchableOpacity onPress={toggleBlock} style={styles.blockButton}>
          <Text style={[styles.blockText, { color: isBlocked ? 'red' : 'green' }]}>
            {isBlocked ? 'Unblock Contact' : 'Block Contact'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Media visibility: Off</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Encryption: End-to-end</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Disappearing messages: Off</Text>
      </View>
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Chat lock: Disabled</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { 
    padding: 15, 
    flex: 1,
    backgroundColor: '#fff'
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
    paddingVertical: 20
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
  buttonRow: { 
    flexDirection: 'row', 
    justifyContent: 'space-around', 
    marginVertical: 15 
  },
  actionBtn: { 
    padding: 12, 
    backgroundColor: '#f0f0f0', 
    borderRadius: 10,
    minWidth: 60,
    alignItems: 'center'
  },
  actionText: {
    fontSize: 14,
    color: '#000'
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
    marginBottom: 5
  },
  status: { 
    fontStyle: 'italic', 
    marginTop: 5,
    color: '#666'
  },
  thumbnail: { 
    width: 80, 
    height: 80, 
    marginRight: 10, 
    borderRadius: 5 
  },
  noMedia: {
    fontStyle: 'italic',
    color: 'gray',
    marginTop: 10
  },
  blockButton: {
    padding: 10,
    alignItems: 'center'
  },
  blockText: {
    fontWeight: 'bold',
    fontSize: 16
  }
});