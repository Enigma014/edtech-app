// src/store/RegisterStore/RegisterStore.ts
import { create } from 'zustand';
import auth, { FirebaseAuthTypes } from '@react-native-firebase/auth';
import { createUserInFirestore } from '@utils/firebase/firebaseUsers';

interface RegisterState {
  user: FirebaseAuthTypes.User | null;
  register: (name: string, email: string, password: string) => Promise<void>;
}

const useRegisterStore = create<RegisterState>((set) => ({
  user: null,
  register: async (name, email, password) => {
    try {
      const userCredential = await auth().createUserWithEmailAndPassword(
        email,
        password
      );
      const user = userCredential.user;

      await createUserInFirestore(user.uid, name, email);

      set({ user });
    } catch (error: any) {
      console.error('Register error:', error);
      throw error;
    }
  },
}));

export default useRegisterStore;
