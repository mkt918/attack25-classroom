import type { Board, Player } from "../types/game";

export const COLOR_MAP: Record<string, string> = {
  red: "#e53935",
  blue: "#1e88e5",
  green: "#43a047",
  yellow: "#fdd835",
  purple: "#8e24aa",
  orange: "#fb8c00",
};

export const COLOR_LABEL_JA: Record<string, string> = {
  red: "赤",
  blue: "青",
  green: "緑",
  yellow: "黄",
  purple: "紫",
  orange: "オレンジ",
};

interface BoardViewProps {
  board: Board;
  players: Record<string, Player>;
  selectableIndices?: Set<number>;
  onSelect?: (index: number) => void;
  /** "lg" は生徒がパネルを選ぶ場面向けに、より大きく・タップしやすく表示する */
  size?: "md" | "lg";
}

const SIZE_STYLE = {
  md: { maxWidth: "min(98vw, 560px)", gap: 8, fontSize: 18 },
  lg: { maxWidth: "min(99vw, 760px)", gap: 10, fontSize: 30 },
};

export function BoardView({
  board,
  players,
  selectableIndices,
  onSelect,
  size = "md",
}: BoardViewProps) {
  const { maxWidth, gap, fontSize } = SIZE_STYLE[size];

  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap,
        maxWidth,
        width: "100%",
        margin: "0 auto",
      }}
    >
      {board.map((owner, index) => {
        const player = owner ? players[owner] : null;
        const bg = player ? COLOR_MAP[player.color] : "var(--surface)";
        const selectable = selectableIndices?.has(index) ?? false;
        return (
          <button
            key={index}
            disabled={!selectable}
            onClick={() => onSelect?.(index)}
            title={player?.name}
            style={{
              aspectRatio: "1",
              padding: 0,
              background: bg,
              color: player ? "#fff" : "var(--text-muted)",
              border: selectable ? "2px solid var(--accent)" : "1px solid var(--border)",
              borderRadius: size === "lg" ? 10 : 6,
              fontSize,
              fontWeight: 700,
              cursor: selectable ? "pointer" : "default",
              opacity: !owner && !selectable ? 0.6 : 1,
              boxShadow: selectable ? "0 0 0 3px var(--accent-soft)" : undefined,
              animation: selectable ? "board-pulse 1.4s ease-in-out infinite" : undefined,
            }}
          >
            {index + 1}
          </button>
        );
      })}
      <style>{`
        @keyframes board-pulse {
          0%, 100% { box-shadow: 0 0 0 3px var(--accent-soft); }
          50% { box-shadow: 0 0 0 6px var(--accent-soft); }
        }
      `}</style>
    </div>
  );
}
