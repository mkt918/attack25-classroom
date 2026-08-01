import type { Board, Player } from "../types/game";
import { COLOR_MAP, COLOR_INK_MAP } from "./playerColors";

interface BoardViewProps {
  board: Board;
  players: Record<string, Player>;
  selectableIndices?: Set<number>;
  onSelect?: (index: number) => void;
  /** "lg" は生徒がパネルを選ぶ場面向けに、より大きく・タップしやすく表示する */
  size?: "md" | "lg";
}

const SIZE_STYLE = {
  md: { maxWidth: "min(100%, 560px)", gap: "var(--space-xs)", fontSize: "var(--text-lg)" },
  lg: { maxWidth: "min(100%, 760px)", gap: "var(--space-xs)", fontSize: "var(--text-display)" },
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
        // 画像・数字トラックは 1fr ではなく minmax(0,1fr)。狭幅で溢れさせない
        gridTemplateColumns: "repeat(5, minmax(0, 1fr))",
        gap,
        maxWidth,
        width: "100%",
        margin: "0 auto",
      }}
    >
      {board.map((owner, index) => {
        const player = owner ? players[owner] : null;
        // 空きマスは opacity で沈めない。透過は数字のコントラストを直接壊す。
        // 面の明度（paper < surface）と罫だけで「まだ誰のものでもない」を示す
        const bg = player ? COLOR_MAP[player.color] : "var(--color-paper)";
        const ink = player ? COLOR_INK_MAP[player.color] : "var(--color-ink-muted)";
        const selectable = selectableIndices?.has(index) ?? false;
        return (
          <button
            key={index}
            disabled={!selectable}
            onClick={() => onSelect?.(index)}
            title={player?.name}
            style={{
              aspectRatio: "1",
              minWidth: 0,
              padding: 0,
              background: bg,
              color: ink,
              border: selectable
                ? "var(--rule-thick) solid var(--color-accent)"
                : "var(--rule) solid var(--color-border)",
              borderRadius: "var(--radius-sm)",
              fontSize,
              fontWeight: 700,
              fontVariantNumeric: "tabular-nums",
              cursor: selectable ? "pointer" : "default",
              opacity: 1,
            }}
          >
            {index + 1}
          </button>
        );
      })}
    </div>
  );
}
