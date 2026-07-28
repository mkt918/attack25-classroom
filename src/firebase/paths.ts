/**
 * RTDB のパスを一元管理する。文字列を直書きすると
 * セキュリティルールとの対応が崩れやすいため、必ずここを経由する。
 */

export const sessionPath = (sessionId: string) => `sessions/${sessionId}`;

/**
 * 「今アクティブな授業セッション」を指すポインタ。
 * 生徒は部屋コードだけ知っていればよく、どのセッションに属すかは
 * ここを見て解決する(1つのFirebaseプロジェクト=1クラスの前提)。
 */
export const activeSessionPath = () => "activeSession";

export const roomPath = (sessionId: string, roomId: string) =>
  `${sessionPath(sessionId)}/rooms/${roomId}`;

export const roomMetaPath = (sessionId: string, roomId: string) =>
  `${roomPath(sessionId, roomId)}/meta`;

export const roomPlayersPath = (sessionId: string, roomId: string) =>
  `${roomPath(sessionId, roomId)}/players`;

export const playerPath = (sessionId: string, roomId: string, uid: string) =>
  `${roomPlayersPath(sessionId, roomId)}/${uid}`;

export const roomBoardPath = (sessionId: string, roomId: string) =>
  `${roomPath(sessionId, roomId)}/board`;

export const roomQuestionPath = (sessionId: string, roomId: string) =>
  `${roomPath(sessionId, roomId)}/question`;

export const roomBuzzPath = (sessionId: string, roomId: string) =>
  `${roomPath(sessionId, roomId)}/buzz`;

export const roomBuzzFirstPath = (sessionId: string, roomId: string) =>
  `${roomBuzzPath(sessionId, roomId)}/first`;

export const roomBuzzOpenPath = (sessionId: string, roomId: string) =>
  `${roomBuzzPath(sessionId, roomId)}/open`;

export const roomAnswerPath = (sessionId: string, roomId: string) =>
  `${roomPath(sessionId, roomId)}/answer`;

export const roomJudgeLogPath = (sessionId: string, roomId: string) =>
  `${roomPath(sessionId, roomId)}/judgeLog`;

export const roomPanelPickPath = (sessionId: string, roomId: string) =>
  `${roomPath(sessionId, roomId)}/panelPick`;

export const roomPresencePath = (sessionId: string, roomId: string, uid: string) =>
  `${roomPath(sessionId, roomId)}/presence/${uid}`;
