import { describe, it, expect } from "vitest";
import {
  applyCorrectAnswer,
  canClaimPanel,
  canAttackFrom,
  canUseAttack,
  consumeAttackStock,
} from "./attack";
import { createEmptyBoard, DEFAULT_RULE_CONFIG, type Board, type Player } from "../types/game";

function makePlayer(overrides: Partial<Player> = {}): Player {
  return {
    uid: "A",
    name: "Aさん",
    color: "red",
    seat: 0,
    connected: true,
    correctCount: 0,
    attackStock: 0,
    restQuestionsLeft: 0,
    ...overrides,
  };
}

function boardFrom(map: Record<number, string>): Board {
  const b = createEmptyBoard();
  for (const [idx, uid] of Object.entries(map)) {
    b[Number(idx)] = uid;
  }
  return b;
}

describe("applyCorrectAnswer", () => {
  it("requiredCorrect に満たない間は correctCount のみ増える", () => {
    const config = { ...DEFAULT_RULE_CONFIG, attackChance: { enabled: true, requiredCorrect: 8 } };
    const player = makePlayer({ correctCount: 3 });
    const result = applyCorrectAnswer(player, config);
    expect(result.correctCount).toBe(4);
    expect(result.attackStock).toBe(0);
  });

  it("requiredCorrect に到達するとアタック権が付与されカウントがリセットされる", () => {
    const config = { ...DEFAULT_RULE_CONFIG, attackChance: { enabled: true, requiredCorrect: 8 } };
    const player = makePlayer({ correctCount: 7, attackStock: 0 });
    const result = applyCorrectAnswer(player, config);
    expect(result.correctCount).toBe(0);
    expect(result.attackStock).toBe(1);
  });

  it("attackChance が無効なら何問正解してもストックは増えない", () => {
    const config = { ...DEFAULT_RULE_CONFIG, attackChance: { enabled: false, requiredCorrect: 8 } };
    const player = makePlayer({ correctCount: 7 });
    const result = applyCorrectAnswer(player, config);
    expect(result.correctCount).toBe(8);
    expect(result.attackStock).toBe(0);
  });
});

describe("canClaimPanel", () => {
  it("空きパネルは選択可能", () => {
    const board = createEmptyBoard();
    expect(canClaimPanel(board, 0)).toBe(true);
  });

  it("既に確保済みのパネルは選択不可", () => {
    const board = boardFrom({ 0: "A" });
    expect(canClaimPanel(board, 0)).toBe(false);
  });

  it("盤外は選択不可", () => {
    const board = createEmptyBoard();
    expect(canClaimPanel(board, 25)).toBe(false);
    expect(canClaimPanel(board, -1)).toBe(false);
  });
});

describe("canAttackFrom", () => {
  it("自分のパネルで隣に相手パネルがあればアタック起点にできる", () => {
    const board = boardFrom({ 0: "A", 1: "B" });
    expect(canAttackFrom(board, 0, "A")).toBe(true);
  });

  it("隣が空きマスだけならアタック起点にできない", () => {
    const board = boardFrom({ 0: "A" });
    expect(canAttackFrom(board, 0, "A")).toBe(false);
  });

  it("隣が自分の色だけならアタック起点にできない", () => {
    const board = boardFrom({ 0: "A", 1: "A" });
    expect(canAttackFrom(board, 0, "A")).toBe(false);
  });

  it("他人のパネルはそもそも起点にできない", () => {
    const board = boardFrom({ 0: "A", 1: "B" });
    expect(canAttackFrom(board, 1, "A")).toBe(false);
  });
});

describe("attackStock の消費", () => {
  it("ストックがあれば消費できる", () => {
    const player = makePlayer({ attackStock: 2 });
    expect(canUseAttack(player)).toBe(true);
    const result = consumeAttackStock(player);
    expect(result.attackStock).toBe(1);
  });

  it("ストックが無ければ消費できずエラーになる", () => {
    const player = makePlayer({ attackStock: 0 });
    expect(canUseAttack(player)).toBe(false);
    expect(() => consumeAttackStock(player)).toThrow();
  });
});
