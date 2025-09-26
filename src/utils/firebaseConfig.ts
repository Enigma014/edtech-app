// src/utils/firebaseServices.ts
import auth from '@react-native-firebase/auth';
import firestore from '@react-native-firebase/firestore';
import storage from '@react-native-firebase/storage';


export const authService = auth();
export const db = firestore();
export const storageService = storage();
