import { onValue, type DatabaseReference } from "firebase/database";

export interface Waiter<T> {
  promise: Promise<T>;
  cancel: () => void;
}

/**
 * 指定した参照の値が predicate を満たすまで待つ。
 * ホストの状態機械が「生徒の入力が来るまで待機する」処理を
 * 素直な逐次コードとして書けるようにするためのヘルパー。
 */
export function waitForValue<T>(
  refObj: DatabaseReference,
  predicate: (val: T | null) => boolean
): Waiter<T> {
  let unsub: () => void = () => {};
  const promise = new Promise<T>((resolve) => {
    unsub = onValue(refObj, (snap) => {
      const val = snap.val() as T | null;
      if (predicate(val)) {
        unsub();
        resolve(val as T);
      }
    });
  });
  return { promise, cancel: unsub };
}

/** waitForValue に制限時間を設ける。タイムアウトしたら null を返し購読を解除する。 */
export function withTimeout<T>(waiter: Waiter<T>, ms: number): Promise<T | null> {
  return new Promise((resolve) => {
    const timer = setTimeout(() => {
      waiter.cancel();
      resolve(null);
    }, Math.max(0, ms));

    waiter.promise.then((value) => {
      clearTimeout(timer);
      resolve(value);
    });
  });
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}
