import { describe, it, expect } from "vitest";
import { indexToRowCol, rowColToIndex, isBoardFull, isValidIndex } from "./board";
import { createEmptyBoard } from "../types/game";

describe("indexToRowCol / rowColToIndex", () => {
  it("往復変換が一致する", () => {
    for (let i = 0; i < 25; i++) {
      const { row, col } = indexToRowCol(i);
      expect(rowColToIndex(row, col)).toBe(i);
    }
  });

  it("盤外の row/col は null を返す", () => {
    expect(rowColToIndex(-1, 0)).toBeNull();
    expect(rowColToIndex(0, 5)).toBeNull();
    expect(rowColToIndex(5, 0)).toBeNull();
  });
});

describe("isBoardFull", () => {
  it("空盤面は false", () => {
    expect(isBoardFull(createEmptyBoard())).toBe(false);
  });

  it("全マス埋まっていれば true", () => {
    expect(isBoardFull(new Array(25).fill("A"))).toBe(true);
  });
});

describe("isValidIndex", () => {
  it("0-24 は有効", () => {
    expect(isValidIndex(0)).toBe(true);
    expect(isValidIndex(24)).toBe(true);
  });

  it("範囲外・非整数は無効", () => {
    expect(isValidIndex(-1)).toBe(false);
    expect(isValidIndex(25)).toBe(false);
    expect(isValidIndex(1.5)).toBe(false);
  });
});
