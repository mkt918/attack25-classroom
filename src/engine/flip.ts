import type { Board, RuleConfig } from "../types/game";
import { DIRECTIONS, indexToRowCol, rowColToIndex, isValidIndex } from "./board";

/**
 * パネル確保(または既存パネルからのアタック起点)を盤面に適用し、
 * オセロ式の挟み反転を計算する純粋関数。
 *
 * flipMode: "othello" の場合、placedIndex から8方向に走査し、
 * 「自分以外の色が連続 → 途切れずに自分の色で終端」する区間を
 * すべて自分の色に反転する。空きマスや盤外で終端した方向は反転しない。
 *
 * DB・UI に依存しないため、ユニットテストとリプレイ(judgeLog再生)の両方から
 * 同一ロジックを呼び出せる。
 */
export function resolveFlip(
  board: Board,
  placedIndex: number,
  uid: string,
  config: Pick<RuleConfig, "flipMode">
): Board {
  if (!isValidIndex(placedIndex)) {
    throw new Error(`invalid panel index: ${placedIndex}`);
  }

  const newBoard = [...board];
  newBoard[placedIndex] = uid;

  if (config.flipMode !== "othello") {
    return newBoard;
  }

  const { row: startRow, col: startCol } = indexToRowCol(placedIndex);

  for (const dir of DIRECTIONS) {
    const runIndices: number[] = [];
    let row = startRow + dir.row;
    let col = startCol + dir.col;

    while (true) {
      const idx = rowColToIndex(row, col);
      if (idx === null) break; // 盤外
      const owner = newBoard[idx];
      if (owner === null) break; // 空きマスで途切れる
      if (owner === uid) {
        // 自分の色で終端 → 区間を反転確定
        for (const flipIdx of runIndices) {
          newBoard[flipIdx] = uid;
        }
        break;
      }
      runIndices.push(idx);
      row += dir.row;
      col += dir.col;
    }
  }

  return newBoard;
}
