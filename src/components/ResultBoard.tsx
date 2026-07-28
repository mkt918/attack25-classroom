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
      <ol style={{ listStyle: "none", padding: 0, margin: 0, display: "grid", gap: 8 }}>
        {standings.map((s) => (
          <li
            key={s.uid}
            className="card"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: s.rank === 1 ? "20px 24px" : "12px 20px",
              border: s.rank === 1 ? "2px solid var(--accent)" : undefined,
            }}
          >
            <span style={{ fontSize: s.rank === 1 ? 28 : 18, fontWeight: s.rank === 1 ? 800 : 600 }}>
              {s.rank <= 3 ? MEDAL[s.rank - 1] : `${s.rank}位`} {players[s.uid]?.name ?? s.uid}
            </span>
            <span className="badge">{s.count}枚</span>
          </li>
        ))}
      </ol>
    </div>
  );
}
