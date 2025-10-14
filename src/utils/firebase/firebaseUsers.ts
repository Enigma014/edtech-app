// src/utils/firebase/firebaseUsers.ts
import firestore from '@react-native-firebase/firestore';

export const createUserInFirestore = async (
  uid: string,
  name: string,
  email: string,
  isAdmin: boolean
) => {
  try {
    await firestore().collection('users').doc(uid).set({
      id: uid,
      name,
      email,
      isAdmin,         // 👈 Added field
      
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Error creating user in Firestore:', error);
    throw error;
  }
};
