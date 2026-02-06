import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY?.trim(),
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN?.trim(),
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID?.trim(),
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET?.trim(),
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID?.trim(),
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID?.trim(),
};

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;
let auth: Auth | undefined;

if (getApps().length === 0) {
  try {
    app = initializeApp(firebaseConfig);
  } catch (error) {
    console.error('Firebase app initialization failed:', error);
    throw error;
  }

  try {
    db = getFirestore(app);
  } catch (error) {
    console.error('Firestore initialization failed:', error);
    throw error;
  }

  try {
    storage = getStorage(app);
  } catch (error) {
    console.error('Firebase Storage initialization failed:', error);
    throw error;
  }

  // Auth disabled until enabled in Firebase Console
  try {
    auth = getAuth(app);
  } catch {
    auth = undefined;
  }
} else {
  app = getApps()[0];
  db = getFirestore(app);
  storage = getStorage(app);
  try {
    auth = getAuth(app);
  } catch {
    auth = undefined;
  }
}

export { app, db, storage, auth };
