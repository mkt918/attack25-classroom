import { BOARD_CELLS, type Board } from "../types/game";

export const BOARD_SIZE = 5;

export interface RowCol {
  row: number;
  col: number;
}

export function indexToRowCol(index: number): RowCol {
  return { row: Math.floor(index / BOARD_SIZE), col: index % BOARD_SIZE };
}

export function rowColToIndex(row: number, col: number): number | null {
  if (row < 0 || row >= BOARD_SIZE || col < 0 || col >= BOARD_SIZE) return null;
  return row * BOARD_SIZE + col;
}

/** 8方向(上下左右+斜め) */
export const DIRECTIONS: RowCol[] = [
  { row: -1, col: -1 },
  { row: -1, col: 0 },
  { row: -1, col: 1 },
  { row: 0, col: -1 },
  { row: 0, col: 1 },
  { row: 1, col: -1 },
  { row: 1, col: 0 },
  { row: 1, col: 1 },
];

export function isBoardFull(board: Board): boolean {
  return board.every((cell) => cell !== null);
}

export function isValidIndex(index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < BOARD_CELLS;
}
