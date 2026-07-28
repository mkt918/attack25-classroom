import { describe, it, expect } from "vitest";
import { createEmptyBoard, type Board } from "../types/game";
import {
  CENTER_INDEX,
  getSelectablePanelIndices,
  isFlippingPlacement,
  getAdjacentToOwnIndices,
  getPotentialSandwichIndices,
  isAttackChanceQuestion,
  getErasablePanelIndices,
} from "./placement";

function boardFrom(entries: Record<number, string>): Board {
  const board = createEmptyBoard();
  for (const [i, uid] of Object.entries(entries)) board[Number(i)] = uid;
  return board;
}

describe("getSelectablePanelIndices", () => {
  it("盤面が空なら中央だけが選べる", () => {
    const board = createEmptyBoard();
    expect(getSelectablePanelIndices(board, "A")).toEqual([CENTER_INDEX]);
  });

  it("2枚目は中央を挟める可能性がある場所(距離2)のみ", () => {
    const board = boardFrom({ [CENTER_INDEX]: "A" });
    const result = getSelectablePanelIndices(board, "B").sort((a, b) => a - b);
    // 中央(index12, row2col2)から距離2: 上下左右+斜め8方向 = row0col2(2), row4col2(22), row2col0(10), row2col4(14),
    // row0col0(0), row0col4(4), row4col0(20), row4col4(24)
    expect(result).toEqual([0, 2, 4, 10, 14, 20, 22, 24]);
  });

  it("3枚目以降、挟んで反転できる場所があれば最優先", () => {
    // A: 0(row0col0), B: 5(row1col0) はさんで A が 10(row2col0) に置けば挟める形を作る
    const board = boardFrom({ 0: "A", 5: "B" });
    const result = getSelectablePanelIndices(board, "A");
    expect(result).toContain(10);
  });

  it("挟める場所が無ければ自分のパネルに隣接する場所", () => {
    const board = boardFrom({ [CENTER_INDEX]: "A", 0: "B" });
    const result = getSelectablePanelIndices(board, "A");
    // 中央に隣接する空きマス(8方向)が候補になる
    expect(result.length).toBeGreaterThan(0);
    result.forEach((i) => {
      expect(board[i]).toBeNull();
    });
  });

  it("自分のパネルが無いプレイヤーは盤上のパネルに隣接する場所を選べる", () => {
    const board = boardFrom({ [CENTER_INDEX]: "A", 0: "B" });
    const result = getSelectablePanelIndices(board, "C");
    expect(result.length).toBeGreaterThan(0);
  });
});

describe("isFlippingPlacement", () => {
  it("相手パネルを挟める配置は true", () => {
    const board = boardFrom({ 0: "A", 1: "B" });
    expect(isFlippingPlacement(board, 2, "A")).toBe(true);
  });

  it("挟めない配置は false", () => {
    const board = boardFrom({ 0: "A" });
    expect(isFlippingPlacement(board, 1, "A")).toBe(false);
  });
});

describe("getAdjacentToOwnIndices / getPotentialSandwichIndices", () => {
  it("隣接マスと2マス先の候補が別々に検出される", () => {
    const board = boardFrom({ [CENTER_INDEX]: "A" });
    const adjacent = getAdjacentToOwnIndices(board, "A");
    const potential = getPotentialSandwichIndices(board, "A");
    expect(adjacent).not.toContain(0); // 距離2は隣接に含まれない
    expect(potential).toContain(0); // 距離2(斜め)は将来候補に含まれる
  });
});

describe("isAttackChanceQuestion / getErasablePanelIndices", () => {
  it("残り問題数がfinalAttackQuestions以下ならアタックチャンス", () => {
    expect(isAttackChanceQuestion(15, 20, 5)).toBe(true); // 残り5問
    expect(isAttackChanceQuestion(14, 20, 5)).toBe(false); // 残り6問
  });

  it("消去可能パネルは埋まっているマスすべて", () => {
    const board = boardFrom({ 0: "A", 1: "B" });
    expect(getErasablePanelIndices(board).sort((a, b) => a - b)).toEqual([0, 1]);
  });
});
