import { useEffect, useState } from "react";
import { ensureSignedIn } from "../../firebase/auth";
import * as actions from "../../firebase/roomActions";
import { useRoomState } from "../../hooks/useRoomState";
import { useHostGameLoop } from "../../hooks/useHostGameLoop";
import { sampleQuestionSet } from "../../data/sampleQuestions";
import { BoardView } from "../../components/BoardView";
import { DEFAULT_RULE_CONFIG } from "../../types/game";

const SESSION_ID = "demo";
const ROOM_ID = "demo-room";

/**
 * M2 動作確認用のホストページ。教室での複数部屋一括管理(M3)は未実装。
 * 1部屋・固定問題・固定ルールで対戦ループが動くことを確認する。
 */
export function HostDemo() {
  const [hostUid, setHostUid] = useState<string | null>(null);
  const room = useRoomState(SESSION_ID, ROOM_ID);
  const { startGame, isRunning, log } = useHostGameLoop(
    SESSION_ID,
    ROOM_ID,
    sampleQuestionSet,
    DEFAULT_RULE_CONFIG
  );

  useEffect(() => {
    ensureSignedIn().then((user) => setHostUid(user.uid));
  }, []);

  async function handleInitRoom() {
    if (!hostUid) return;
    await actions.initRoom(SESSION_ID, ROOM_ID, hostUid, DEFAULT_RULE_CONFIG);
  }

  const players = room?.players ?? {};
  const playerList = Object.values(players);

  return (
    <div style={{ maxWidth: 720, margin: "0 auto", padding: 24, textAlign: "left" }}>
      <h1>先生用ホスト画面(デモ)</h1>
      <p>
        部屋コード: <code>{ROOM_ID}</code>(生徒は「参加する」ページでこのコードを入力)
      </p>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <button onClick={handleInitRoom} disabled={!hostUid || isRunning}>
          部屋を初期化
        </button>
        <button onClick={startGame} disabled={!room || playerList.length === 0 || isRunning}>
          {isRunning ? "進行中..." : "ゲーム開始"}
        </button>
      </div>

      <h2>参加者({playerList.length}人)</h2>
      <ul>
        {playerList.map((p) => (
          <li key={p.uid}>
            {p.name}({p.color}) 正解数:{p.correctCount} / アタック権:{p.attackStock}
          </li>
        ))}
      </ul>

      {room && (
        <>
          <h2>盤面</h2>
          <BoardView board={room.board} players={players} />

          <h2>進行状況</h2>
          <p>
            フェーズ: <strong>{room.meta.phase}</strong> / 出題:
            {room.meta.questionIndex + 1} / {sampleQuestionSet.questions.length}
          </p>
          {room.question && <p>問題: {room.question.text}</p>}
        </>
      )}

      <h2>ログ</h2>
      <pre
        style={{
          background: "#111",
          color: "#0f0",
          padding: 8,
          maxHeight: 200,
          overflowY: "auto",
          fontSize: 12,
        }}
      >
        {log.join("\n")}
      </pre>
    </div>
  );
}
