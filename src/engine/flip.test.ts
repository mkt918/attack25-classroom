import { describe, it, expect } from "vitest";
import { resolveFlip } from "./flip";
import { createEmptyBoard, type Board } from "../types/game";

function boardFrom(map: Record<number, string>): Board {
  const b = createEmptyBoard();
  for (const [idx, uid] of Object.entries(map)) {
    b[Number(idx)] = uid;
  }
  return b;
}

describe("resolveFlip", () => {
  it("flipMode=none のときは反転せず配置のみ行う", () => {
    const board = boardFrom({ 6: "B", 7: "B" });
    const result = resolveFlip(board, 8, "A", { flipMode: "none" });
    expect(result[8]).toBe("A");
    expect(result[6]).toBe("B");
    expect(result[7]).toBe("B");
  });

  it("横一列で相手パネルを挟むと反転する", () => {
    // 5x5 grid, row0: [A, B, B, B, ?] -> placing A at index4 should flip 1,2,3
    const board = boardFrom({ 0: "A", 1: "B", 2: "B", 3: "B" });
    const result = resolveFlip(board, 4, "A", { flipMode: "othello" });
    expect(result[4]).toBe("A");
    expect(result[1]).toBe("A");
    expect(result[2]).toBe("A");
    expect(result[3]).toBe("A");
    expect(result[0]).toBe("A");
  });

  it("途中に空きマスがあると反転しない", () => {
    // row0: [A, _, B, _, ?] placing A at 4 -> direction toward col0 hits empty(3) first? actually col3 empty breaks immediately
    const board = boardFrom({ 0: "A", 2: "B" });
    const result = resolveFlip(board, 4, "A", { flipMode: "othello" });
    expect(result[4]).toBe("A");
    expect(result[2]).toBe("B"); // 空きマス(3)で途切れるため反転しない
  });

  it("自分の色で終端しない(相手色のまま盤端に達する)場合は反転しない", () => {
    // row0: [B, B, B, B, ?] placing A at 4, scanning left never finds "A"
    const board = boardFrom({ 0: "B", 1: "B", 2: "B", 3: "B" });
    const result = resolveFlip(board, 4, "A", { flipMode: "othello" });
    expect(result[4]).toBe("A");
    expect(result[0]).toBe("B");
    expect(result[1]).toBe("B");
    expect(result[2]).toBe("B");
    expect(result[3]).toBe("B");
  });

  it("斜め方向でも反転する", () => {
    // indices: 0,6,12,18,24 is the main diagonal (row=col)
    const board = boardFrom({ 0: "A", 6: "B", 12: "B" });
    const result = resolveFlip(board, 18, "A", { flipMode: "othello" });
    expect(result[18]).toBe("A");
    expect(result[6]).toBe("A");
    expect(result[12]).toBe("A");
  });

  it("複数方向で同時に反転する(3人以上の色が混在していても挟めば反転)", () => {
    // row0 (indices 0-4): [A, C, B, B, ?]  -- placing A at 4 should flip C and B both (any non-A color flips)
    const board = boardFrom({ 0: "A", 1: "C", 2: "B", 3: "B" });
    const result = resolveFlip(board, 4, "A", { flipMode: "othello" });
    expect(result[1]).toBe("A");
    expect(result[2]).toBe("A");
    expect(result[3]).toBe("A");
  });

  it("盤外の index を渡すと例外を投げる", () => {
    const board = createEmptyBoard();
    expect(() => resolveFlip(board, 25, "A", { flipMode: "othello" })).toThrow();
    expect(() => resolveFlip(board, -1, "A", { flipMode: "othello" })).toThrow();
  });

  it("既に自分のパネルを起点にしたアタック再トリガーでも動作する(配置は冪等)", () => {
    const board = boardFrom({ 4: "A", 1: "B", 2: "B", 3: "B", 0: "A" });
    const result = resolveFlip(board, 4, "A", { flipMode: "othello" });
    expect(result[4]).toBe("A");
    expect(result[1]).toBe("A");
    expect(result[2]).toBe("A");
    expect(result[3]).toBe("A");
  });
});
