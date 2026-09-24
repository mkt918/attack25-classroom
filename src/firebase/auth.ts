import { signInAnonymously, onAuthStateChanged, type Auth, type User } from "firebase/auth";
import { getAuthInstance } from "./config";

/**
 * authInstance を省略すると通常のデフォルト接続でサインインする。
 * 「1人用モード(動作確認)」では名前付きインスタンスの Auth を渡すことで、
 * 同一ブラウザタブ内でも生徒役ごとに別 uid を持たせる。
 */
export function ensureSignedIn(authInstance?: Auth): Promise<User> {
  const auth = authInstance ?? getAuthInstance();
  return new Promise((resolve, reject) => {
    const unsubscribe = onAuthStateChanged(
      auth,
      (user) => {
        if (user) {
          unsubscribe();
          resolve(user);
          return;
        }
        signInAnonymously(auth).catch((err) => {
          unsubscribe();
          reject(err);
        });
      },
      (err) => {
        unsubscribe();
        reject(err);
      }
    );
  });
}
