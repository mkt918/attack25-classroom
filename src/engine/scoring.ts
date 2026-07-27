import type { Board, RuleConfig } from "../types/game";
import { isBoardFull } from "./board";

export function getPanelCounts(board: Board): Record<string, number> {
  const counts: Record<string, number> = {};
  for (const owner of board) {
    if (owner === null) continue;
    counts[owner] = (counts[owner] ?? 0) + 1;
  }
  return counts;
}

export interface Standing {
  uid: string;
  count: number;
  rank: number;
}

/** パネル数の多い順に順位付け。同数は同順位。 */
export function getStandings(board: Board, uids: string[]): Standing[] {
  const counts = getPanelCounts(board);
  const withCounts = uids.map((uid) => ({ uid, count: counts[uid] ?? 0 }));
  withCounts.sort((a, b) => b.count - a.count);

  const standings: Standing[] = [];
  let rank = 0;
  let prevCount = -1;
  withCounts.forEach((entry, i) => {
    if (entry.count !== prevCount) {
      rank = i + 1;
      prevCount = entry.count;
    }
    standings.push({ ...entry, rank });
  });
  return standings;
}

/**
 * 盤面の状態だけから勝敗が確定しているか判定する。
 * - firstToN: 誰かが閾値に到達した時点で確定(同時到達はまとめて返す)
 * - mostPanels: 盤面が埋まった時点で確定。埋まっていなければ null
 *   (出題数上限による終了はゲームループ側で totalCount と questionIndex を見て判断する)
 */
export function checkImmediateVictory(
  board: Board,
  uids: string[],
  config: Pick<RuleConfig, "victory" | "firstToNPanels">
): string[] | null {
  if (config.victory === "firstToN") {
    const threshold = config.firstToNPanels ?? Infinity;
    const counts = getPanelCounts(board);
    const winners = uids.filter((uid) => (counts[uid] ?? 0) >= threshold);
    return winners.length > 0 ? winners : null;
  }

  // mostPanels
  if (!isBoardFull(board)) return null;
  const standings = getStandings(board, uids);
  const topRank = standings[0]?.rank ?? 1;
  return standings.filter((s) => s.rank === topRank).map((s) => s.uid);
}
