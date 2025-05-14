
// firebase.js

import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider, 
  signInWithPopup,
  signOut, 
  onAuthStateChanged 
} from "firebase/auth";
import { 
  getFirestore, 
  collection, 
  addDoc, 
  query, 
  orderBy, 
  onSnapshot, 
  serverTimestamp 
} from "firebase/firestore";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "YOUR_API_KEY",
  authDomain: "cyberq-3bdab.firebaseapp.com",
  projectId: "cyberq-3bdab",
  storageBucket: "cyberq-3bdab.firebasestorage.app",
  messagingSenderId: "99896624712",
  appId: "1:99896624712:web:4075027ff624ce0e497a7d",
  measurementId: "G-9CBZBTCJ46"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google provider - increase security and reduce issues
googleProvider.setCustomParameters({
  prompt: "select_account"
});

export {
  auth,
  db,
  googleProvider,
  signInWithPopup,
  signOut,
  onAuthStateChanged,
  collection,
  addDoc,
  query,
  orderBy,
  onSnapshot,
  serverTimestamp
};

