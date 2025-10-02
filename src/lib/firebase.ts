import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAuth, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY,
  authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN,
  projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
  appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID,
};

// Debug Firebase config in production
console.log('🔥 Firebase Config Debug:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
  hasProjectId: !!firebaseConfig.projectId,
  hasStorageBucket: !!firebaseConfig.storageBucket,
  hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
  hasAppId: !!firebaseConfig.appId,
  projectId: firebaseConfig.projectId,
  apiKey: firebaseConfig.apiKey?.slice(0, 10) + '...',
});

// Initialize Firebase
let app: FirebaseApp;
let db: Firestore;
let storage: FirebaseStorage;
let auth: Auth | undefined;

if (getApps().length === 0) {
  console.log('🔥 Initializing Firebase with config:', {
    projectId: firebaseConfig.projectId,
    apiKey: firebaseConfig.apiKey?.slice(0, 10) + '...',
  });
  
  try {
    app = initializeApp(firebaseConfig);
    console.log('✅ Firebase app initialized');
  } catch (error) {
    console.error('❌ Firebase app initialization failed:', error);
    throw error;
  }
  
  try {
    db = getFirestore(app); // Uses (default) database
    console.log('✅ Firestore initialized');
  } catch (error) {
    console.error('❌ Firestore initialization failed:', error);
    throw error;
  }
  
  try {
    storage = getStorage(app);
    console.log('✅ Firebase Storage initialized');
  } catch (error) {
    console.error('❌ Firebase Storage initialization failed:', error);
    throw error;
  }
  
  // Auth disabled until enabled in Firebase Console
  try {
    auth = getAuth(app);
    console.log('✅ Firebase Auth initialized');
  } catch (error) {
    console.warn('⚠️ Firebase Auth not enabled - running without authentication');
    auth = undefined;
  }
} else {
  app = getApps()[0];
  db = getFirestore(app);
  storage = getStorage(app);
  try {
    auth = getAuth(app);
  } catch (error) {
    auth = undefined;
  }
}

console.log('🔥 Firebase initialized:', {
  hasApp: !!app,
  hasDb: !!db,
  hasStorage: !!storage,
  hasAuth: !!auth,
});

export { app, db, storage, auth };
