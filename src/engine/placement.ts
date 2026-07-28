import type { Board } from "../types/game";
import { DIRECTIONS, indexToRowCol, rowColToIndex, isValidIndex } from "./board";

/** 5x5盤面の中央(表示上のパネル番号「13」)のインデックス */
export const CENTER_INDEX = 12;

export function countPlacedPanels(board: Board): number {
  return board.filter((owner) => owner !== null).length;
}

/** 空きマス index に uid を置いたとき、挟んで反転できるパネルが1枚以上あるか */
export function isFlippingPlacement(board: Board, index: number, uid: string): boolean {
  if (!isValidIndex(index) || board[index] !== null) return false;
  const { row: startRow, col: startCol } = indexToRowCol(index);

  return DIRECTIONS.some((dir) => {
    let row = startRow + dir.row;
    let col = startCol + dir.col;
    let sawOpponent = false;

    while (true) {
      const idx = rowColToIndex(row, col);
      if (idx === null) return false;
      const owner = board[idx];
      if (owner === null) return false;
      if (owner === uid) return sawOpponent;
      sawOpponent = true;
      row += dir.row;
      col += dir.col;
    }
  });
}

/** ①挟んで反転できる空きマス */
export function getFlippingIndices(board: Board, uid: string): number[] {
  return board
    .map((_, i) => i)
    .filter((i) => board[i] === null && isFlippingPlacement(board, i, uid));
}

/** ②自分のパネルに(斜めも含め)隣接している空きマス */
export function getAdjacentToOwnIndices(board: Board, uid: string): number[] {
  const result = new Set<number>();
  board.forEach((owner, i) => {
    if (owner !== uid) return;
    const { row, col } = indexToRowCol(i);
    for (const dir of DIRECTIONS) {
      const idx = rowColToIndex(row + dir.row, col + dir.col);
      if (idx !== null && board[idx] === null) result.add(idx);
    }
  });
  return [...result];
}

/**
 * ③自分のパネルと直線上(8方向)にあり、間のマスがすべて空いている空きマス。
 * 将来そこが相手のパネルで埋まれば、その区間を挟んで反転できる可能性がある場所。
 */
export function getPotentialSandwichIndices(board: Board, uid: string): number[] {
  const result = new Set<number>();
  board.forEach((owner, i) => {
    if (owner !== uid) return;
    const { row: startRow, col: startCol } = indexToRowCol(i);
    for (const dir of DIRECTIONS) {
      let row = startRow + dir.row;
      let col = startCol + dir.col;
      let steps = 0;
      while (true) {
        const idx = rowColToIndex(row, col);
        if (idx === null || board[idx] !== null) break;
        steps++;
        if (steps >= 2) result.add(idx);
        row += dir.row;
        col += dir.col;
      }
    }
  });
  return [...result];
}

/** ④(自分のパネルがまだ無いプレイヤー向けの足がかり)盤上のどれかのパネルに隣接する空きマス */
export function getAdjacentToAnyIndices(board: Board): number[] {
  const result = new Set<number>();
  board.forEach((owner, i) => {
    if (owner === null) return;
    const { row, col } = indexToRowCol(i);
    for (const dir of DIRECTIONS) {
      const idx = rowColToIndex(row + dir.row, col + dir.col);
      if (idx !== null && board[idx] === null) result.add(idx);
    }
  });
  return [...result];
}

/**
 * 本家風ルールでの、次に置けるパネルの候補を優先順位に従って求める(オセロ式反転モード用)。
 * - 1枚目(盤面が空): 中央のみ。
 * - 2枚目(盤上に1枚だけ): 中央を挟める可能性がある場所。
 * - 3枚目以降: ①挟んで反転できる場所 → ②自分のパネルに隣接する場所
 *   → ③将来挟める可能性がある場所 → (自分のパネルがまだ無ければ)④盤上のパネルに隣接する場所。
 */
export function getSelectablePanelIndices(board: Board, uid: string): number[] {
  const placedCount = countPlacedPanels(board);

  if (placedCount === 0) {
    return board[CENTER_INDEX] === null ? [CENTER_INDEX] : [];
  }

  if (placedCount === 1) {
    const centerOwner = board[CENTER_INDEX];
    if (centerOwner !== null) {
      const potential = getPotentialSandwichIndices(board, centerOwner);
      if (potential.length > 0) return potential;
    }
  }

  const flipping = getFlippingIndices(board, uid);
  if (flipping.length > 0) return flipping;

  const adjacentOwn = getAdjacentToOwnIndices(board, uid);
  if (adjacentOwn.length > 0) return adjacentOwn;

  const potentialOwn = getPotentialSandwichIndices(board, uid);
  if (potentialOwn.length > 0) return potentialOwn;

  const adjacentAny = getAdjacentToAnyIndices(board);
  if (adjacentAny.length > 0) return adjacentAny;

  // 理論上ここには到達しないはずだが、保険として空きマス全体を返す
  return board.map((owner, i) => (owner === null ? i : -1)).filter((i) => i >= 0);
}

/** 残り問題数からアタックチャンス(パネル消去)の問題かどうかを判定する */
export function isAttackChanceQuestion(
  qIndex: number,
  totalQuestionCount: number,
  finalAttackQuestions: number
): boolean {
  if (finalAttackQuestions <= 0) return false;
  return qIndex >= totalQuestionCount - finalAttackQuestions;
}

/** アタックチャンスで消去できるパネル(埋まっているマスすべて) */
export function getErasablePanelIndices(board: Board): number[] {
  return board.map((owner, i) => (owner !== null ? i : -1)).filter((i) => i >= 0);
}
