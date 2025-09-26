// src/utils/firebaseServices.ts
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';

// ✅ React Native Firebase automatically uses native config files:
// - google-services.json (Android)
// - GoogleService-Info.plist (iOS)
// No manual initializeApp needed like on Web!

export const authService = auth();        // for authentication
export const db = firestore();            // for Firestore database
export const storageService = storage();  // for file uploads
