import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { getDb } from "../firebase/config";
import { roomPath } from "../firebase/paths";
import { normalizeRoomState } from "../firebase/serialize";
import type { RoomState } from "../types/game";

export function useRoomState(sessionId: string, roomId: string): RoomState | null {
  const [state, setState] = useState<RoomState | null>(null);

  useEffect(() => {
    const unsub = onValue(ref(getDb(), roomPath(sessionId, roomId)), (snap) => {
      setState(normalizeRoomState(snap.val()));
    });
    return () => unsub();
  }, [sessionId, roomId]);

  return state;
}
