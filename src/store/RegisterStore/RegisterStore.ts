// src/store/RegisterStore/RegisterStore.ts
import { create } from 'zustand';
import { getAuth, createUserWithEmailAndPassword } from '@react-native-firebase/auth';
import { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { createUserInFirestore } from '@utils/firebase/firebaseUsers';

interface RegisterState {
  user: FirebaseAuthTypes.User | null;
  register: (name: string, email: string, password: string) => Promise<void>;
}

const useRegisterStore = create<RegisterState>((set) => ({
  user: null,
  register: async (name, email, password) => {
    try {
      const auth = getAuth();
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      await createUserInFirestore(user.uid, name, email, false); // false indicates not an admin

      set({ user });
    } catch (error: any) {
      console.error('Register error:', error);
      throw error;
    }
  },
}));

export default useRegisterStore;
