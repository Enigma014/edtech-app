// src/utils/firebaseUsers.ts
import firestore from '@react-native-firebase/firestore';

export const createUserInFirestore = async (
  uid: string,
  name: string,
  email: string
) => {
  try {
    await firestore().collection('users').doc(uid).set({
      name,
      email,
      createdAt: firestore.FieldValue.serverTimestamp(),
    });
  } catch (error) {
    console.error('Firestore create user error:', error);
    throw error;
  }
};
