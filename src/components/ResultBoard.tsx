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
      <ol style={{ listStyle: "none", padding: 0 }}>
        {standings.map((s) => (
          <li
            key={s.uid}
            style={{
              fontSize: s.rank === 1 ? 32 : 22,
              fontWeight: s.rank === 1 ? "bold" : "normal",
              margin: "8px 0",
            }}
          >
            {s.rank <= 3 ? MEDAL[s.rank - 1] : `${s.rank}位`} {players[s.uid]?.name ?? s.uid} —{" "}
            {s.count}枚
          </li>
        ))}
      </ol>
    </div>
  );
}
