import { getPanelCounts } from "../engine";
import { COLOR_MAP } from "./playerColors";
import type { Board, Player } from "../types/game";

interface PanelCountSummaryProps {
  board: Board;
  players: Record<string, Player>;
}

/** 色(チーム)ごとに何マス取得しているかを一覧表示する */
export function PanelCountSummary({ board, players }: PanelCountSummaryProps) {
  const counts = getPanelCounts(board);
  const rows = Object.values(players)
    .map((p) => ({ player: p, count: counts[p.uid] ?? 0 }))
    .sort((a, b) => b.count - a.count);

  if (rows.length === 0) return null;

  return (
    <div
      style={{
        display: "flex",
        flexWrap: "wrap",
        gap: "var(--space-xs)",
        margin: "var(--space-sm) 0",
      }}
    >
      {rows.map(({ player, count }) => (
        <span key={player.uid} className="badge badge-outline">
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: 12,
              height: 12,
              borderRadius: "var(--radius-pill)",
              background: COLOR_MAP[player.color],
              marginRight: "var(--space-2xs)",
            }}
          />
          {player.name} {count}枚
        </span>
      ))}
    </div>
  );
}
