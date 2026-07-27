import type { Board, Player } from "../types/game";

const COLOR_MAP: Record<string, string> = {
  red: "#e53935",
  blue: "#1e88e5",
  green: "#43a047",
  yellow: "#fdd835",
  purple: "#8e24aa",
  orange: "#fb8c00",
};

interface BoardViewProps {
  board: Board;
  players: Record<string, Player>;
  selectableIndices?: Set<number>;
  onSelect?: (index: number) => void;
}

export function BoardView({ board, players, selectableIndices, onSelect }: BoardViewProps) {
  return (
    <div
      style={{
        display: "grid",
        gridTemplateColumns: "repeat(5, 1fr)",
        gap: 4,
        maxWidth: 320,
      }}
    >
      {board.map((owner, index) => {
        const player = owner ? players[owner] : null;
        const bg = player ? COLOR_MAP[player.color] : "#333";
        const selectable = selectableIndices?.has(index) ?? false;
        return (
          <button
            key={index}
            disabled={!selectable}
            onClick={() => onSelect?.(index)}
            style={{
              aspectRatio: "1",
              background: bg,
              color: "#fff",
              border: selectable ? "2px solid #fff" : "1px solid #555",
              borderRadius: 4,
              fontSize: 14,
              cursor: selectable ? "pointer" : "default",
              opacity: selectable ? 1 : owner ? 1 : 0.5,
            }}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
}
