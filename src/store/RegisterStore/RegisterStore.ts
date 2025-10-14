// src/store/RegisterStore/RegisterStore.ts
import { create } from 'zustand';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { createUserInFirestore } from '@utils/firebase/firebaseUsers';

interface RegisterState {
  user: FirebaseAuthTypes.User | null;
  register: (name: string, email: string, password: string) => Promise<void>;
  sendVerificationEmail: () => Promise<void>;
}

const useRegisterStore = create<RegisterState>((set, get) => ({
  user: null,

  register: async (name, email, password) => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(email, password);
      const user = userCredential.user;

      // Create Firestore user document
      await createUserInFirestore(user.uid, name, email, false);

      // Send verification email
      await user.sendEmailVerification();

      set({ user });
    } catch (error: any) {
      console.error('Register error:', error);
      throw error;
    }
  },

  sendVerificationEmail: async () => {
    const user = auth().currentUser;
    if (user && !user.emailVerified) {
      await user.sendEmailVerification();
    } else {
      console.log('User already verified or not logged in');
    }
  },
}));

export default useRegisterStore;
