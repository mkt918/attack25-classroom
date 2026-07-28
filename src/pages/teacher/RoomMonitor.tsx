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
    <div className="card">
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 8 }}>
        <h3 style={{ margin: 0 }}>
          部屋 {roomId} <span className="muted">({playerList.length}人)</span>
        </h3>
        <span className={`badge ${phase === "result" ? "badge-success" : phase === "lobby" ? "badge-muted" : ""}`}>
          {PHASE_LABEL[phase] ?? phase}
        </span>
      </div>

      <div className="btn-row" style={{ margin: "12px 0" }}>
        <button className="btn-primary" onClick={startGame} disabled={isRunning || playerList.length === 0}>
          開始
        </button>
        {isRunning && !isPaused && <button onClick={pause}>一時停止</button>}
        {isRunning && isPaused && <button onClick={resume}>再開</button>}
        {isRunning && <button onClick={skipQuestion}>この問題をスキップ</button>}
        {isRunning && <button onClick={stopGame}>終了する</button>}
      </div>

      {playerList.length > 0 && (
        <p className="muted" style={{ fontSize: 13 }}>
          参加者: {playerList.map((p) => `${p.name}(${p.correctCount}問)`).join(" / ")}
        </p>
      )}

      {room && (
        <>
          <BoardView board={room.board} players={room.players} />
          {phase === "result" && (
            <div style={{ marginTop: 12 }}>
              <ResultBoard board={room.board} players={room.players} />
            </div>
          )}
        </>
      )}

      <details style={{ marginTop: 12 }}>
        <summary className="muted" style={{ cursor: "pointer" }}>ログ</summary>
        <pre
          style={{
            fontSize: 11,
            maxHeight: 150,
            overflowY: "auto",
            background: "#111",
            color: "#0f0",
            padding: 8,
            borderRadius: 6,
            marginTop: 8,
          }}
        >
          {log.join("\n")}
        </pre>
      </details>
    </div>
  );
}
