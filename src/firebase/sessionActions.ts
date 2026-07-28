import { ref, get, set } from "firebase/database";
import { getDb } from "./config";
import { sessionPath, activeSessionPath } from "./paths";
import { initRoom } from "./roomActions";
import type { RuleConfig } from "../types/game";

export async function setActiveSession(sessionId: string): Promise<void> {
  await set(ref(getDb(), activeSessionPath()), sessionId);
}

export async function getActiveSession(): Promise<string | null> {
  const snap = await get(ref(getDb(), activeSessionPath()));
  return snap.val();
}

// 部屋コード用文字集合(数字4桁)
const CODE_CHARS = "0123456789";

function generateRoomCode(length = 4): string {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)];
  }
  return code;
}

/** count 部屋分の一意な部屋コードを生成し、それぞれ初期化する。 */
export async function createRooms(
  sessionId: string,
  count: number,
  hostUid: string,
  config: RuleConfig
): Promise<string[]> {
  const existingSnap = await get(ref(getDb(), `${sessionPath(sessionId)}/rooms`));
  const existingCodes = new Set(Object.keys(existingSnap.val() ?? {}));

  const codes: string[] = [];
  while (codes.length < count) {
    const code = generateRoomCode();
    if (existingCodes.has(code) || codes.includes(code)) continue;
    codes.push(code);
  }

  await Promise.all(codes.map((code) => initRoom(sessionId, code, hostUid, config)));
  return codes;
}

export async function deleteSession(sessionId: string): Promise<void> {
  await set(ref(getDb(), sessionPath(sessionId)), null);
}

const SESSION_STORAGE_KEY = "at25.currentSessionId";

function newSessionId(): string {
  return `s${Date.now().toString(36)}${Math.random().toString(36).slice(2, 6)}`;
}

export function getOrCreateSessionId(): string {
  let id = localStorage.getItem(SESSION_STORAGE_KEY);
  if (!id) {
    id = newSessionId();
    localStorage.setItem(SESSION_STORAGE_KEY, id);
  }
  return id;
}

export function resetSessionId(): string {
  const id = newSessionId();
  localStorage.setItem(SESSION_STORAGE_KEY, id);
  return id;
}
