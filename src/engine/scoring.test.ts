import { describe, it, expect } from "vitest";
import { getPanelCounts, getStandings, checkImmediateVictory } from "./scoring";
import { createEmptyBoard, type Board } from "../types/game";

function boardFrom(map: Record<number, string>): Board {
  const b = createEmptyBoard();
  for (const [idx, uid] of Object.entries(map)) {
    b[Number(idx)] = uid;
  }
  return b;
}

function fullBoard(pattern: string[]): Board {
  expect(pattern.length).toBe(25);
  return pattern;
}

describe("getPanelCounts", () => {
  it("uid ごとの所有数を数える", () => {
    const board = boardFrom({ 0: "A", 1: "A", 2: "B" });
    expect(getPanelCounts(board)).toEqual({ A: 2, B: 1 });
  });
});

describe("getStandings", () => {
  it("パネル数の多い順に順位付けする", () => {
    const board = boardFrom({ 0: "A", 1: "A", 2: "A", 3: "B" });
    const standings = getStandings(board, ["A", "B", "C"]);
    expect(standings).toEqual([
      { uid: "A", count: 3, rank: 1 },
      { uid: "B", count: 1, rank: 2 },
      { uid: "C", count: 0, rank: 3 },
    ]);
  });

  it("同数は同順位になる", () => {
    const board = boardFrom({ 0: "A", 1: "B" });
    const standings = getStandings(board, ["A", "B"]);
    expect(standings).toEqual([
      { uid: "A", count: 1, rank: 1 },
      { uid: "B", count: 1, rank: 1 },
    ]);
  });
});

describe("checkImmediateVictory", () => {
  it("firstToN: 閾値到達で勝者確定", () => {
    const board = boardFrom({ 0: "A", 1: "A", 2: "A" });
    const winners = checkImmediateVictory(board, ["A", "B"], {
      victory: "firstToN",
      firstToNPanels: 3,
    });
    expect(winners).toEqual(["A"]);
  });

  it("firstToN: 未到達なら null", () => {
    const board = boardFrom({ 0: "A" });
    const winners = checkImmediateVictory(board, ["A", "B"], {
      victory: "firstToN",
      firstToNPanels: 3,
    });
    expect(winners).toBeNull();
  });

  it("mostPanels: 盤面が埋まっていなければ null", () => {
    const board = boardFrom({ 0: "A" });
    const winners = checkImmediateVictory(board, ["A", "B"], { victory: "mostPanels" });
    expect(winners).toBeNull();
  });

  it("mostPanels: 盤面が埋まれば最多所有者が勝者", () => {
    const pattern = new Array(25).fill("B");
    pattern[0] = "A";
    pattern[1] = "A";
    pattern[2] = "A";
    const board = fullBoard(pattern);
    const winners = checkImmediateVictory(board, ["A", "B"], { victory: "mostPanels" });
    expect(winners).toEqual(["B"]);
  });

  it("mostPanels: 同数トップが複数いれば全員返す", () => {
    // A: 12枚, B: 12枚, C: 1枚 -> A/Bが同率トップ
    const pattern = [...new Array(12).fill("A"), ...new Array(12).fill("B"), "C"];
    const board = fullBoard(pattern);
    const winners = checkImmediateVictory(board, ["A", "B", "C"], { victory: "mostPanels" });
    expect(winners?.sort()).toEqual(["A", "B"]);
  });
});
