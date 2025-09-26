// src/utils/firebaseUsers.ts
import { getFirestore, doc, setDoc, serverTimestamp } from '@react-native-firebase/firestore';

export const createUserInFirestore = async (
  uid: string,
  name: string,
  email: string
) => {
  try {
    const db = getFirestore(); // modular Firestore instance
    const userRef = doc(db, 'users', uid);

    await setDoc(userRef, {
      name,
      email,
      createdAt: serverTimestamp(),
    });

    console.log('User successfully created in Firestore:', uid);
  } catch (error) {
    console.error('Firestore create user error:', error);
    throw error;
  }
};
