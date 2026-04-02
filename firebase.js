import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// ─────────────────────────────────────────────────────────────────────────────
// SETUP STEPS:
//
// 1. Go to https://console.firebase.google.com
// 2. Create a new project (or use an existing one)
// 3. Go to Project Settings → Your Apps → Add app → Web (</>)
// 4. Copy the firebaseConfig object below and replace the placeholder values
//
// 5. Enable Authentication:
//    Firebase Console → Authentication → Sign-in method
//    → Enable "Email/Password"
//    → Enable "Google"
//
// 6. Enable Firestore:
//    Firebase Console → Firestore Database → Create database
//    → Start in production mode → Choose a region → Done
//
// 7. Set Firestore security rules:
//    Firebase Console → Firestore Database → Rules → paste:
//
//    rules_version = '2';
//    service cloud.firestore {
//      match /databases/{database}/documents {
//        match /users/{userId}/{document=**} {
//          allow read, write: if request.auth != null && request.auth.uid == userId;
//        }
//      }
//    }
//
// ─────────────────────────────────────────────────────────────────────────────

// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyBfFZaxQU1b0o4n1vKkPXAXVnX-SUtG06w",
  authDomain: "becoming-tommy-shelby.firebaseapp.com",
  projectId: "becoming-tommy-shelby",
  storageBucket: "becoming-tommy-shelby.firebasestorage.app",
  messagingSenderId: "284065305334",
  appId: "1:284065305334:web:1f1052c941a18f53ed52d7",
  measurementId: "G-Y9JWTTDWQF"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
