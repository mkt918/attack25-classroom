import type { Board, Player, RuleConfig } from "../types/game";
import { DIRECTIONS, indexToRowCol, rowColToIndex, isValidIndex } from "./board";

/** 通常の解答正解時にプレイヤーの正解数/アタック権ストックを更新する */
export function applyCorrectAnswer(player: Player, config: RuleConfig): Player {
  const correctCount = player.correctCount + 1;

  if (config.attackChance.enabled && correctCount >= config.attackChance.requiredCorrect) {
    return {
      ...player,
      correctCount: 0,
      attackStock: player.attackStock + 1,
    };
  }

  return { ...player, correctCount };
}

/** 空きパネルとして選択可能か */
export function canClaimPanel(board: Board, index: number): boolean {
  return isValidIndex(index) && board[index] === null;
}

/**
 * アタック起点として選択可能か。
 * 条件: 自分の所有パネルであり、かつ隣接8マスの少なくとも1つが
 * 「相手の色のパネル」であること(誰の色でもない空きマスに隣接しているだけでは不可)。
 */
export function canAttackFrom(board: Board, index: number, uid: string): boolean {
  if (!isValidIndex(index) || board[index] !== uid) return false;

  const { row, col } = indexToRowCol(index);
  return DIRECTIONS.some((dir) => {
    const idx = rowColToIndex(row + dir.row, col + dir.col);
    if (idx === null) return false;
    const owner = board[idx];
    return owner !== null && owner !== uid;
  });
}

/** アタック権を1回消費できるか */
export function canUseAttack(player: Player): boolean {
  return player.attackStock > 0;
}

export function consumeAttackStock(player: Player): Player {
  if (player.attackStock <= 0) {
    throw new Error(`player ${player.uid} has no attack stock`);
  }
  return { ...player, attackStock: player.attackStock - 1 };
}
