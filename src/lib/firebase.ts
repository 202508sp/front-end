/**
 * Firebase設定とアプリケーション初期化
 */

import { initializeApp, getApps, getApp, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAuth, GoogleAuthProvider, type Auth } from 'firebase/auth';

const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

let app: FirebaseApp;
let database: Database | undefined;
let firestore: Firestore;
let storage: FirebaseStorage;
let auth: Auth;
let provider: GoogleAuthProvider;

try {
  app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
  
  // Realtime Databaseは、databaseURLが設定されている場合のみ初期化
  if (import.meta.env.VITE_FIREBASE_DATABASE_URL) {
    try {
      database = getDatabase(app);
    } catch (dbError) {
      console.warn('Firebase Realtime Database initialization failed:', dbError);
      if (import.meta.env.DEV) {
        console.warn('Realtime Database is not configured. Chat functionality will not work.');
      }
    }
  } else {
    if (import.meta.env.DEV) {
      console.warn('VITE_FIREBASE_DATABASE_URL not set. Realtime Database features disabled.');
    }
  }
  
  firestore = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);
  provider = new GoogleAuthProvider();
} catch (error) {
  console.error('Firebase initialization failed:', error);
  if (import.meta.env.DEV) {
    console.warn('Firebase is not configured properly.');
  }
}

export { app, database, firestore, storage, auth, provider };

export function isFirebaseConfigured(): boolean {
  return !!(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID
  );
}

export function isRealtimeDatabaseConfigured(): boolean {
  return !!database;
}
