import { initializeApp, getApps, type FirebaseOptions } from "firebase/app";
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

const namedInstances = new Map<string, { db: Database; auth: Auth }>();

/**
 * 名前付きの Firebase アプリインスタンスを取得(無ければ作成)する。
 * 同一ブラウザタブ内でも、Auth はアプリインスタンスごとに独立したセッションを持てるため、
 * 「1人用モード(動作確認)」で複数の生徒役を同時に別 uid として操作するのに使う。
 * 通常のプレイ(1人1台)では使わない。
 */
export function getNamedInstance(name: string): { db: Database; auth: Auth } {
  if (!isFirebaseConfigured) {
    throw new Error("Firebase が設定されていません(.env.local を確認してください)");
  }
  const cached = namedInstances.get(name);
  if (cached) return cached;

  const existingApp = getApps().find((a) => a.name === name);
  const app = existingApp ?? initializeApp(firebaseConfig, name);
  const instance = { db: getDatabase(app), auth: getAuth(app) };
  namedInstances.set(name, instance);
  return instance;
}
