import { useEffect } from "react";
import { ref, onValue, onDisconnect, update } from "firebase/database";
import { getDb } from "../firebase/config";
import { playerPath } from "../firebase/paths";

/**
 * 切断を RTDB の onDisconnect で検知し、players/{uid}/connected を自動更新する。
 * `.info/connected` は再接続のたびに変化するため、そのたびに onDisconnect を
 * 登録し直す必要がある(Firebase 公式の作法)。
 * 再接続時は uid が端末に永続しているため、players/{uid} が既存なら
 * 自動的に元の席・パネル・得点のまま復帰する。
 */
export function usePresence(sessionId: string, roomId: string, uid: string | null): void {
  useEffect(() => {
    if (!uid) return;

    const db = getDb();
    const connectedRef = ref(db, ".info/connected");
    const myPlayerRef = ref(db, playerPath(sessionId, roomId, uid));

    const unsub = onValue(connectedRef, (snap) => {
      if (snap.val() !== true) return;
      onDisconnect(myPlayerRef)
        .update({ connected: false })
        .then(() => update(myPlayerRef, { connected: true }));
    });

    return () => unsub();
  }, [sessionId, roomId, uid]);
}
