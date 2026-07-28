import { ref, set, update, get, push, runTransaction } from "firebase/database";
import { getDb } from "./config";
import {
  roomPath,
  roomMetaPath,
  roomPlayersPath,
  playerPath,
  roomBoardPath,
  roomQuestionPath,
  roomBuzzPath,
  roomBuzzFirstPath,
  roomAnswerPath,
  roomJudgeLogPath,
  roomPanelPickPath,
} from "./paths";
import {
  createEmptyBoard,
  PLAYER_COLORS,
  type Board,
  type BuzzState,
  type GameMeta,
  type GamePhase,
  type Player,
  type PublicQuestion,
  type RuleConfig,
} from "../types/game";
import { boardToRtdb } from "./serialize";

export async function initRoom(
  sessionId: string,
  roomId: string,
  hostUid: string,
  config: RuleConfig
): Promise<void> {
  const meta: GameMeta = {
    phase: "lobby",
    questionIndex: -1,
    phaseDeadline: null,
    hostUid,
    totalQuestionCount: 0,
  };
  await set(ref(getDb(), roomPath(sessionId, roomId)), {
    meta,
    players: {},
    board: boardToRtdb(createEmptyBoard()),
    question: null,
    buzz: { open: false, first: null } satisfies BuzzState,
    answer: null,
    panelPick: null,
    ruleConfig: config,
  });
}

export async function getPlayers(
  sessionId: string,
  roomId: string
): Promise<Record<string, Player>> {
  const snap = await get(ref(getDb(), roomPlayersPath(sessionId, roomId)));
  return (snap.val() ?? {}) as Record<string, Player>;
}

/** 生徒が部屋に参加する。既に参加済み(復席)の場合は何もしない。 */
export async function joinRoom(
  sessionId: string,
  roomId: string,
  uid: string,
  name: string
): Promise<void> {
  const existing = await get(ref(getDb(), playerPath(sessionId, roomId, uid)));
  if (existing.exists()) {
    await update(ref(getDb(), playerPath(sessionId, roomId, uid)), { connected: true });
    return;
  }

  const players = await getPlayers(sessionId, roomId);
  const seat = Object.keys(players).length;
  const color = PLAYER_COLORS[seat % PLAYER_COLORS.length];
  const player: Player = {
    uid,
    name,
    color,
    seat,
    connected: true,
    correctCount: 0,
    attackStock: 0,
    restQuestionsLeft: 0,
  };
  await set(ref(getDb(), playerPath(sessionId, roomId, uid)), player);
}

export async function setPhase(
  sessionId: string,
  roomId: string,
  phase: GamePhase,
  phaseDeadline: number | null = null
): Promise<void> {
  await update(ref(getDb(), roomMetaPath(sessionId, roomId)), { phase, phaseDeadline });
}

export async function setQuestionIndex(
  sessionId: string,
  roomId: string,
  questionIndex: number
): Promise<void> {
  await update(ref(getDb(), roomMetaPath(sessionId, roomId)), { questionIndex });
}

export async function setTotalQuestionCount(
  sessionId: string,
  roomId: string,
  totalQuestionCount: number
): Promise<void> {
  await update(ref(getDb(), roomMetaPath(sessionId, roomId)), { totalQuestionCount });
}

export async function publishQuestion(
  sessionId: string,
  roomId: string,
  question: PublicQuestion | null
): Promise<void> {
  await set(ref(getDb(), roomQuestionPath(sessionId, roomId)), question);
}

export async function openBuzz(sessionId: string, roomId: string): Promise<void> {
  await set(ref(getDb(), roomBuzzPath(sessionId, roomId)), { open: true, first: null });
}

export async function closeBuzz(sessionId: string, roomId: string): Promise<void> {
  await update(ref(getDb(), roomBuzzPath(sessionId, roomId)), { open: false });
}

export async function clearAnswer(sessionId: string, roomId: string): Promise<void> {
  await set(ref(getDb(), roomAnswerPath(sessionId, roomId)), null);
}

export async function clearPanelPick(sessionId: string, roomId: string): Promise<void> {
  await set(ref(getDb(), roomPanelPickPath(sessionId, roomId)), null);
}

/** 早押しボタン。先着1名のみがトランザクションで成功する。 */
export async function tryBuzzIn(
  sessionId: string,
  roomId: string,
  uid: string
): Promise<boolean> {
  const firstRef = ref(getDb(), roomBuzzFirstPath(sessionId, roomId));
  const result = await runTransaction(firstRef, (current) => {
    if (current === null) {
      return { uid, at: Date.now() };
    }
    return; // undefined を返すと中断(既存値を保持)
  });
  return result.committed && result.snapshot.val()?.uid === uid;
}

export async function submitAnswer(
  sessionId: string,
  roomId: string,
  uid: string,
  choiceIndex: 0 | 1 | 2 | 3
): Promise<void> {
  await set(ref(getDb(), roomAnswerPath(sessionId, roomId)), { uid, choiceIndex, at: Date.now() });
}

export async function submitPanelPick(
  sessionId: string,
  roomId: string,
  uid: string,
  panelIndex: number
): Promise<void> {
  await set(ref(getDb(), roomPanelPickPath(sessionId, roomId)), { uid, panelIndex });
}

export async function updatePlayer(
  sessionId: string,
  roomId: string,
  uid: string,
  patch: Partial<Player>
): Promise<void> {
  await update(ref(getDb(), playerPath(sessionId, roomId, uid)), patch);
}

export async function setBoard(sessionId: string, roomId: string, board: Board): Promise<void> {
  await set(ref(getDb(), roomBoardPath(sessionId, roomId)), boardToRtdb(board));
}

export async function appendJudgeLog(
  sessionId: string,
  roomId: string,
  event: string,
  payload: Record<string, unknown>
): Promise<void> {
  const logRef = push(ref(getDb(), roomJudgeLogPath(sessionId, roomId)));
  await set(logRef, { event, payload, at: Date.now() });
}
