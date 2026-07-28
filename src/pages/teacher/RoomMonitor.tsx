import { useHostGameLoop } from "../../hooks/useHostGameLoop";
import { BoardView } from "../../components/BoardView";
import { ResultBoard } from "../../components/ResultBoard";
import type { QuestionSet, RoomState, RuleConfig } from "../../types/game";

interface RoomMonitorProps {
  sessionId: string;
  roomId: string;
  questionSet: QuestionSet;
  config: RuleConfig;
  room: RoomState | undefined;
}

const PHASE_LABEL: Record<string, string> = {
  lobby: "参加待ち",
  q_reading: "出題中",
  buzz_open: "早押し受付中",
  answering: "解答中",
  panel_select: "パネル選択中",
  result: "終了",
};

/**
 * ダッシュボードの1部屋分のカード。ホストループはここで部屋ごとに1つ動く。
 * ルール設定は「部屋が作成された時点でRTDBに保存された値」を使う
 * (ダッシュボードで編集中の値を使うと、進行中に設定が変わる事故につながるため)。
 */
export function RoomMonitor({ sessionId, roomId, questionSet, config, room }: RoomMonitorProps) {
  const effectiveConfig = room?.ruleConfig ?? config;
  const { startGame, pause, resume, skipQuestion, stopGame, isRunning, isPaused, log } =
    useHostGameLoop(sessionId, roomId, questionSet, effectiveConfig);

  const playerList = room ? Object.values(room.players) : [];
  const phase = room?.meta.phase ?? "lobby";

  return (
    <div
      style={{
        border: "1px solid var(--border, #ccc)",
        borderRadius: 8,
        padding: 12,
        marginBottom: 12,
      }}
    >
      <h3>
        部屋 {roomId}({playerList.length}人) — {PHASE_LABEL[phase] ?? phase}
      </h3>

      <div style={{ display: "flex", gap: 8, flexWrap: "wrap", marginBottom: 8 }}>
        <button onClick={startGame} disabled={isRunning || playerList.length === 0}>
          開始
        </button>
        {isRunning && !isPaused && <button onClick={pause}>一時停止</button>}
        {isRunning && isPaused && <button onClick={resume}>再開</button>}
        {isRunning && <button onClick={skipQuestion}>この問題をスキップ</button>}
        {isRunning && <button onClick={stopGame}>終了する</button>}
      </div>

      {playerList.length > 0 && (
        <p style={{ fontSize: 13 }}>
          参加者: {playerList.map((p) => `${p.name}(${p.correctCount}問)`).join(" / ")}
        </p>
      )}

      {room && (
        <>
          <BoardView board={room.board} players={room.players} />
          {phase === "result" && <ResultBoard board={room.board} players={room.players} />}
        </>
      )}

      <details style={{ marginTop: 8 }}>
        <summary>ログ</summary>
        <pre
          style={{
            fontSize: 11,
            maxHeight: 150,
            overflowY: "auto",
            background: "#111",
            color: "#0f0",
            padding: 6,
          }}
        >
          {log.join("\n")}
        </pre>
      </details>
    </div>
  );
}
