// ContactProfileScreen.js
import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Alert } from 'react-native';
import { db, auth } from './firebaseConfig';
import { doc, getDoc, setDoc, deleteDoc } from 'firebase/firestore';

export default function ContactProfileScreen({ route }) {
  const { contactId } = route.params;
  const [contact, setContact] = useState({});
  const [isBlocked, setIsBlocked] = useState(false);

  const currentUser = auth.currentUser.uid;

  useEffect(() => {
    const fetchContact = async () => {
      const contactDoc = await getDoc(doc(db, 'users', contactId));
      if (contactDoc.exists()) {
        setContact(contactDoc.data());
      }

      const blockDoc = await getDoc(doc(db, 'blocks', `${currentUser}_${contactId}`));
      setIsBlocked(blockDoc.exists());
    };

    fetchContact();
  }, []);

  const toggleBlock = async () => {
    const blockRef = doc(db, 'blocks', `${currentUser}_${contactId}`);

    if (isBlocked) {
      await deleteDoc(blockRef);
      setIsBlocked(false);
      Alert.alert('Unblocked', 'You have unblocked this contact.');
    } else {
      await setDoc(blockRef, {
        blocker: currentUser,
        blocked: contactId,
        timestamp: Date.now(),
      });
      setIsBlocked(true);
      Alert.alert('Blocked', 'You have blocked this contact.');
    }
  };

  return (
    <ScrollView style={styles.container}>
      <View style={styles.profile}>
        <View style={styles.avatar}>
          <Text style={styles.avatarText}>{contact.name?.[0] || 'M'}</Text>
        </View>
        <Text style={styles.name}>{contact.name || 'Mahvash'}</Text>
        <Text style={styles.number}>{contact.phone || '+91 95414 66725'}</Text>
      </View>

      <View style={styles.buttonRow}>
        <TouchableOpacity style={styles.actionBtn}><Text>Audio</Text></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}><Text>Video</Text></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}><Text>Pay</Text></TouchableOpacity>
        <TouchableOpacity style={styles.actionBtn}><Text>Search</Text></TouchableOpacity>
      </View>

      <View style={styles.section}>
        <Text>Status:</Text>
        <Text style={styles.status}>Hey there! I am using WhatsApp.</Text>
      </View>

      <View style={styles.section}>
        <Text>Media, Links, and Docs</Text>
        {/* Placeholder thumbnails */}
        <ScrollView horizontal>
          {[...Array(4)].map((_, i) => (
            <Image key={i} source={{ uri: 'https://via.placeholder.com/80' }} style={styles.thumbnail} />
          ))}
        </ScrollView>
      </View>

      <View style={styles.section}>
        <TouchableOpacity onPress={toggleBlock}>
          <Text style={{ color: isBlocked ? 'red' : 'blue' }}>
            {isBlocked ? 'Unblock Contact' : 'Block Contact'}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Additional Sections */}
      <View style={styles.section}><Text>Media visibility: Off</Text></View>
      <View style={styles.section}><Text>Encryption: End-to-end</Text></View>
      <View style={styles.section}><Text>Disappearing messages: Off</Text></View>
      <View style={styles.section}><Text>Chat lock: Disabled</Text></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { padding: 15 },
  profile: { alignItems: 'center', marginBottom: 20 },
  avatar: { backgroundColor: '#f5c6aa', borderRadius: 50, width: 80, height: 80, justifyContent: 'center', alignItems: 'center' },
  avatarText: { fontSize: 30, color: '#663300' },
  name: { fontSize: 20, fontWeight: 'bold', marginTop: 10 },
  number: { color: 'gray' },
  buttonRow: { flexDirection: 'row', justifyContent: 'space-around', marginVertical: 15 },
  actionBtn: { padding: 10, backgroundColor: '#eee', borderRadius: 10 },
  section: { marginVertical: 10 },
  status: { fontStyle: 'italic', marginTop: 5 },
  thumbnail: { width: 80, height: 80, marginRight: 10, borderRadius: 5 },
});
