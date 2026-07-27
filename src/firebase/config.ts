import { initializeApp, type FirebaseOptions } from "firebase/app";
import { getDatabase, type Database } from "firebase/database";
import { getAuth, type Auth } from "firebase/auth";

const firebaseConfig: FirebaseOptions = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  databaseURL: import.meta.env.VITE_FIREBASE_DATABASE_URL,
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env.VITE_FIREBASE_APP_ID,
};

export const isFirebaseConfigured = Boolean(
  firebaseConfig.apiKey && firebaseConfig.databaseURL
);

// 未設定(.env.local が無い開発初期段階)でもアプリ全体がクラッシュしないよう、
// 実際に db/auth を使うページ側で isFirebaseConfigured を確認してから使う前提で遅延初期化する。
let db: Database | null = null;
let auth: Auth | null = null;

if (isFirebaseConfigured) {
  const app = initializeApp(firebaseConfig);
  db = getDatabase(app);
  auth = getAuth(app);
}

export function getDb(): Database {
  if (!db) throw new Error("Firebase が設定されていません(.env.local を確認してください)");
  return db;
}

export function getAuthInstance(): Auth {
  if (!auth) throw new Error("Firebase が設定されていません(.env.local を確認してください)");
  return auth;
}
