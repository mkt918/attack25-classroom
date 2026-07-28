import { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { getDb } from "../firebase/config";
import { sessionPath } from "../firebase/paths";
import { normalizeRoomState } from "../firebase/serialize";
import type { RoomState } from "../types/game";

export function useSessionRooms(sessionId: string): Record<string, RoomState> {
  const [rooms, setRooms] = useState<Record<string, RoomState>>({});

  useEffect(() => {
    const unsub = onValue(ref(getDb(), `${sessionPath(sessionId)}/rooms`), (snap) => {
      const val = (snap.val() ?? {}) as Record<string, unknown>;
      const converted: Record<string, RoomState> = {};
      for (const [roomId, room] of Object.entries(val)) {
        const normalized = normalizeRoomState(room);
        if (normalized) converted[roomId] = normalized;
      }
      setRooms(converted);
    });
    return () => unsub();
  }, [sessionId]);

  return rooms;
}
