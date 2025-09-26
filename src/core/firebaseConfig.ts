// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDKKXMihiAmi6IuWCWOBILsXOnVPvaFZh8",
  authDomain: "whatsappclone-a651b.firebaseapp.com",
  projectId: "whatsappclone-a651b",
  storageBucket: "whatsappclone-a651b.firebasestorage.app",
  messagingSenderId: "806393641219",
  appId: "1:806393641219:web:d08677a08bd1a30aef1136",
  measurementId: "G-3TR2H91LYX"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);