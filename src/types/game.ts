/** ゲーム進行フェーズ */
export type GamePhase =
  | "lobby"
  | "countdown"
  | "q_reading"
  | "buzz_open"
  | "answering"
  | "panel_select"
  | "flip_resolve"
  | "result"
  | "closed";

/** 誤答時のペナルティ */
export type WrongPenalty = "none" | "lockout" | "minusPanel";

/** 勝敗判定方式 */
export type VictoryCondition = "mostPanels" | "firstToN";

/** 出題数の指定方法 */
export type QuestionCountMode = number | "untilBoardFull";

/**
 * ルール設定。version はスキーマの後方互換パースに使う。
 * 未知のキーは無視して読み、欠けているキーはデフォルトで補う。
 */
export interface RuleConfig {
  version: 1;
  boardSize: 5;
  flipMode: "othello" | "none";
  attackChance: {
    enabled: boolean;
    requiredCorrect: number;
  };
  answerTimeoutSec: number;
  perQuestionSec: number;
  totalCount: QuestionCountMode;
  victory: VictoryCondition;
  firstToNPanels?: number;
  wrongPenalty: WrongPenalty;
}

export const DEFAULT_RULE_CONFIG: RuleConfig = {
  version: 1,
  boardSize: 5,
  flipMode: "othello",
  attackChance: { enabled: true, requiredCorrect: 8 },
  answerTimeoutSec: 10,
  perQuestionSec: 0,
  totalCount: "untilBoardFull",
  victory: "mostPanels",
  wrongPenalty: "none",
};

/** プレイヤー識別色 */
export type PlayerColor = "red" | "blue" | "green" | "yellow" | "purple" | "orange";

export const PLAYER_COLORS: PlayerColor[] = [
  "red",
  "blue",
  "green",
  "yellow",
  "purple",
  "orange",
];

export interface Player {
  uid: string;
  name: string;
  color: PlayerColor;
  seat: number;
  connected: boolean;
  correctCount: number;
  attackStock: number;
}

/** 25マスの盤面。index 0-24 に uid または null(未確保) */
export type Board = (string | null)[];

export const BOARD_CELLS = 25;

export function createEmptyBoard(): Board {
  return new Array(BOARD_CELLS).fill(null);
}

export interface Question {
  id: string;
  text: string;
  choices: [string, string, string, string];
  answerIndex: 0 | 1 | 2 | 3;
  note?: string;
}

/** 生徒に配信する問題(正答を含まない) */
export type PublicQuestion = Omit<Question, "answerIndex" | "note">;

export function toPublicQuestion(q: Question): PublicQuestion {
  return { id: q.id, text: q.text, choices: q.choices };
}

export interface QuestionSet {
  id: string;
  title: string;
  questions: Question[];
}

export interface GameMeta {
  phase: GamePhase;
  questionIndex: number;
  phaseDeadline: number | null;
  hostUid: string;
}

export interface BuzzState {
  open: boolean;
  first: { uid: string; at: number } | null;
}

export interface AnswerState {
  uid: string;
  choiceIndex: 0 | 1 | 2 | 3;
  at: number;
}

export interface JudgeLogEntry {
  seq: number;
  event: string;
  payload: Record<string, unknown>;
  at: number;
}

export interface PanelPick {
  uid: string;
  panelIndex: number;
}

export interface RoomState {
  meta: GameMeta;
  players: Record<string, Player>;
  board: Board;
  question: PublicQuestion | null;
  buzz: BuzzState;
  answer: AnswerState | null;
  panelPick: PanelPick | null;
  ruleConfig: RuleConfig;
}
