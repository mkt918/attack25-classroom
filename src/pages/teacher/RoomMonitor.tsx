import { useHostGameLoop } from "../../hooks/useHostGameLoop";
import { BoardView } from "../../components/BoardView";
import { ResultBoard } from "../../components/ResultBoard";
import { PanelCountSummary } from "../../components/PanelCountSummary";
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
  explanation: "解説表示中",
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
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "var(--space-xs)",
        }}
      >
        <h3 style={{ margin: 0 }}>
          部屋 <span className="nums">{roomId}</span>{" "}
          <span className="muted nums">({playerList.length}人)</span>
        </h3>
        <span className={`badge ${phase === "result" ? "badge-success" : phase === "lobby" ? "badge-muted" : ""}`}>
          {PHASE_LABEL[phase] ?? phase}
        </span>
      </div>

      <div className="btn-row" style={{ margin: "var(--space-sm) 0" }}>
        <button className="btn-primary" onClick={startGame} disabled={isRunning || playerList.length === 0}>
          開始
        </button>
        {isRunning && !isPaused && <button onClick={pause}>一時停止</button>}
        {isRunning && isPaused && <button onClick={resume}>再開</button>}
        {isRunning && <button onClick={skipQuestion}>この問題をスキップ</button>}
        {isRunning && <button onClick={stopGame}>終了する</button>}
      </div>

      {playerList.length > 0 && (
        <p className="field-note">
          参加者: {playerList.map((p) => `${p.name}(${p.correctCount}問)`).join(" / ")}
        </p>
      )}

      {room && (
        <>
          <PanelCountSummary board={room.board} players={room.players} />
          <BoardView board={room.board} players={room.players} />
          {phase === "result" && (
            <div style={{ marginTop: "var(--space-sm)" }}>
              <ResultBoard board={room.board} players={room.players} />
            </div>
          )}
        </>
      )}

      <details style={{ marginTop: "var(--space-sm)" }}>
        <summary className="muted" style={{ cursor: "pointer" }}>ログ</summary>
        <pre className="log-pre">{log.join("\n")}</pre>
      </details>
    </div>
  );
}
