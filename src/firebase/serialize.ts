import { createEmptyBoard, type Board } from "../types/game";

/**
 * RTDB は配列内の null 要素を「キーの削除」として扱うため、
 * 空きマスだらけの盤面(特に初期盤面=全マスnull)を素の配列としてそのまま
 * set() すると、ノード全体が消えてしまう(全要素が消えるとノード自体がnullになる)。
 * 書き込み時は null を空文字列に、読み込み時は空文字列を null に変換して往復させる。
 */
export function boardToRtdb(board: Board): string[] {
  return board.map((cell) => cell ?? "");
}

export function boardFromRtdb(raw: unknown): Board {
  if (!Array.isArray(raw)) return createEmptyBoard();
  return raw.map((cell) => (cell === "" || cell == null ? null : (cell as string)));
}
