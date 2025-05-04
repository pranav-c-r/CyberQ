// src/firebase.js
import { initializeApp } from "firebase/app";
import { 
  getAuth, 
  GoogleAuthProvider,
  signInWithPopup,
  signOut 
} from "firebase/auth";

// Your Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCRBJhBL_cNkvHLOhdDbQtJwVr1Ene9yuU",
  authDomain: "kairo-e37ab.firebaseapp.com",
  projectId: "kairo-e37ab",
  storageBucket: "kairo-e37ab.appspot.com",
  messagingSenderId: "794882422185",
  appId: "1:794882422185:web:bf1fefe9a18c13eb5b40b8",
  measurementId: "G-X6NGRL7MBW"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const googleProvider = new GoogleAuthProvider();

// Configure Google provider
googleProvider.setCustomParameters({
  prompt: 'select_account'
});

// Export auth methods and providers
export { 
  app, 
  auth,
  googleProvider,
  signInWithPopup,
  signOut
};