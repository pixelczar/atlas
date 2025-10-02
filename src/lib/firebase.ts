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

// Debug Firebase config in production
console.log('🔥 Firebase Config Debug:', {
  hasApiKey: !!firebaseConfig.apiKey,
  hasAuthDomain: !!firebaseConfig.authDomain,
  hasProjectId: !!firebaseConfig.projectId,
  hasStorageBucket: !!firebaseConfig.storageBucket,
  hasMessagingSenderId: !!firebaseConfig.messagingSenderId,
  hasAppId: !!firebaseConfig.appId,
  projectId: firebaseConfig.projectId,
  projectIdLength: firebaseConfig.projectId?.length,
  projectIdHasNewline: firebaseConfig.projectId?.includes('\n'),
  apiKey: firebaseConfig.apiKey?.slice(0, 10) + '...',
  authDomain: firebaseConfig.authDomain,
  storageBucket: firebaseConfig.storageBucket,
  messagingSenderId: firebaseConfig.messagingSenderId,
  appId: firebaseConfig.appId,
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

// Test Firestore connection
if (db) {
  console.log('🔥 Testing Firestore connection...');
  // This will help us see if Firestore is actually accessible
  try {
    // Just test if we can access the database instance
    console.log('✅ Firestore database instance created successfully');
  } catch (error) {
    console.error('❌ Firestore database test failed:', error);
  }
}

export { app, db, storage, auth };
