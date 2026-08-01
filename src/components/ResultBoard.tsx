import { getStandings } from "../engine";
import type { Board, Player } from "../types/game";

interface ResultBoardProps {
  board: Board;
  players: Record<string, Player>;
}

const MEDAL = ["🥇", "🥈", "🥉"];

/** プロジェクター表示も想定し、文字を大きめにした結果発表コンポーネント。 */
export function ResultBoard({ board, players }: ResultBoardProps) {
  const standings = getStandings(board, Object.keys(players));

  return (
    <div>
      <h2>結果発表</h2>
      <ol
        style={{
          listStyle: "none",
          padding: 0,
          margin: 0,
          display: "grid",
          gap: "var(--space-xs)",
        }}
      >
        {standings.map((s) => (
          <li
            key={s.uid}
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              gap: "var(--space-sm)",
              padding:
                s.rank === 1
                  ? "var(--space-lg) var(--space-md)"
                  : "var(--space-sm) var(--space-md)",
              borderColor: s.rank === 1 ? "var(--color-accent)" : undefined,
              borderWidth: s.rank === 1 ? "var(--rule-thick)" : undefined,
            }}
          >
            <span
              style={{
                fontFamily: "var(--font-display)",
                fontSize: s.rank === 1 ? "var(--text-xl)" : "var(--text-lg)",
                fontWeight: s.rank === 1 ? 700 : 600,
                minWidth: 0,
                overflowWrap: "anywhere",
              }}
            >
              <span className="nums">{s.rank <= 3 ? MEDAL[s.rank - 1] : `${s.rank}位`}</span>{" "}
              {players[s.uid]?.name ?? s.uid}
            </span>
            <span className="badge">{s.count}枚</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
