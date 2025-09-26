// src/store/authStore.ts
import { create } from "zustand";
import auth, { FirebaseAuthTypes } from "@react-native-firebase/auth";

type AuthState = {
  user: FirebaseAuthTypes.User | null;
  loading: boolean;
  error: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
};

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  loading: false,
  error: null,

  login: async (email: string, password: string) => {
    try {
      set({ loading: true, error: null });

      const userCredential = await auth().signInWithEmailAndPassword(
        email,
        password
      );

      set({ user: userCredential.user, loading: false });
    } catch (error: any) {
      set({ error: error.message, loading: false });
    }
  },

  logout: async () => {
    try {
      await auth().signOut();
      set({ user: null });
    } catch (error: any) {
      set({ error: error.message });
    }
  },
}));
