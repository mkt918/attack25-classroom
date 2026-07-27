import { signInAnonymously, onAuthStateChanged, type User } from "firebase/auth";
import { getAuthInstance } from "./config";

export function ensureSignedIn(): Promise<User> {
  const auth = getAuthInstance();
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
