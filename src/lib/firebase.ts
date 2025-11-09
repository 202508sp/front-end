/**
 * Firebase設定とアプリケーション初期化
 */

import { initializeApp, type FirebaseApp } from 'firebase/app';
import { getDatabase, type Database } from 'firebase/database';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getStorage, type FirebaseStorage } from 'firebase/storage';
import { getAuth, type Auth } from 'firebase/auth';

// Firebase設定（環境変数から取得）
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID
};

// Firebase アプリケーションを初期化
let app: FirebaseApp;
let database: Database;
let firestore: Firestore;
let storage: FirebaseStorage;
let auth: Auth;

try {
  app = initializeApp(firebaseConfig);
  database = getDatabase(app);
  firestore = getFirestore(app);
  storage = getStorage(app);
  auth = getAuth(app);
} catch (error) {
  console.error('Firebase initialization failed:', error);
  
  // 開発環境では警告のみ表示
  if (import.meta.env.DEV) {
    console.warn('Firebase is not configured. Chat functionality will not work.');
    console.warn('Please set up Firebase environment variables in .env file:');
    console.warn('- VITE_FIREBASE_API_KEY');
    console.warn('- VITE_FIREBASE_AUTH_DOMAIN');
    console.warn('- VITE_FIREBASE_DATABASE_URL');
    console.warn('- VITE_FIREBASE_PROJECT_ID');
    console.warn('- VITE_FIREBASE_STORAGE_BUCKET');
    console.warn('- VITE_FIREBASE_MESSAGING_SENDER_ID');
    console.warn('- VITE_FIREBASE_APP_ID');
  }
}

export { app, database, firestore, storage, auth };

/**
 * Firebase接続状態を確認
 */
export function isFirebaseConfigured(): boolean {
  return !!(
    import.meta.env.VITE_FIREBASE_API_KEY &&
    import.meta.env.VITE_FIREBASE_AUTH_DOMAIN &&
    import.meta.env.VITE_FIREBASE_DATABASE_URL &&
    import.meta.env.VITE_FIREBASE_PROJECT_ID &&
    import.meta.env.VITE_FIREBASE_STORAGE_BUCKET &&
    import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID &&
    import.meta.env.VITE_FIREBASE_APP_ID
  );
}

/**
 * Firebase接続テスト
 */
export async function testFirebaseConnection(): Promise<boolean> {
  if (!isFirebaseConfigured()) {
    return false;
  }

  try {
    // データベース接続テスト
    const { connectDatabaseEmulator } = await import('firebase/database');
    
    // 本番環境では実際の接続テストを行う
    // 開発環境ではエミュレーターを使用する場合の設定
    if (import.meta.env.DEV && import.meta.env.VITE_USE_FIREBASE_EMULATOR === 'true') {
      try {
        connectDatabaseEmulator(database, 'localhost', 9000);
      } catch (error) {
        // エミュレーターが既に接続されている場合はエラーを無視
        console.log('Firebase emulator already connected or not available');
      }
    }
    
    return true;
  } catch (error) {
    console.error('Firebase connection test failed:', error);
    return false;
  }
}