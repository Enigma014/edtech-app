// src/core/authService.ts

import { FirebaseAuth, firestoreCollections } from './firebaseConfig';

export const authService = {
  // -------------------
  // LOGIN
  // -------------------
  login: async (email: string, password: string) => {
    try {
      console.log('Attempting login...');
      const userCredential = await FirebaseAuth.signInWithEmailAndPassword(
        email.trim(),
        password,
      );

      // Update last login in Firestore
      await firestoreCollections.users
        .doc(userCredential.user.uid)
        .set({ lastLogin: new Date() }, { merge: true });

      console.log('Login success:', userCredential.user.uid);
      return userCredential.user;
    } catch (error: any) {
      console.error('Login error:', error);
      throw error;
    }
  },

  // -------------------
  // REGISTER
  // -------------------
  register: async (name: string, email: string, password: string) => {
    try {
      console.log('Attempting registration...');
      const userCredential = await FirebaseAuth.createUserWithEmailAndPassword(
        email.trim(),
        password,
      );

      // Update display name correctly for RN Firebase
      await FirebaseAuth.currentUser?.updateProfile({
        displayName: name.trim(),
      });

      // Save user in Firestore
      await firestoreCollections.users.doc(userCredential.user.uid).set({
        uid: userCredential.user.uid,
        email: userCredential.user.email,
        displayName: name.trim(),
        photoURL: userCredential.user.photoURL || '',
        createdAt: new Date(),
        communities: [],
        groups: [],
      });

      console.log('Registration success:', userCredential.user.uid);
      return userCredential.user;
    } catch (error: any) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  // -------------------
  // LOGOUT
  // -------------------
  signOut: async () => {
    try {
      await FirebaseAuth.signOut();
      console.log('Signed out successfully');
      return true;
    } catch (error) {
      console.error('Sign out error:', error);
      return false;
    }
  },

  // -------------------
  // PASSWORD RESET
  // -------------------
  sendPasswordReset: async (email: string) => {
    try {
      await FirebaseAuth.sendPasswordResetEmail(email);
      console.log('Password reset email sent');
      return true;
    } catch (error) {
      console.error('Password reset error:', error);
      throw error;
    }
  },
};
