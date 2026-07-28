import { useEffect, useState } from "react";
import { ensureSignedIn } from "../../firebase/auth";
import * as actions from "../../firebase/roomActions";
import { useRoomState } from "../../hooks/useRoomState";
import { usePresence } from "../../hooks/usePresence";
import { BoardView } from "../../components/BoardView";
import { ResultBoard } from "../../components/ResultBoard";
import { canClaimPanel } from "../../engine";

interface StudentPlayProps {
  sessionId: string;
  roomId: string;
}

export function StudentPlay({ sessionId, roomId }: StudentPlayProps) {
  const [uid, setUid] = useState<string | null>(null);
  const room = useRoomState(sessionId, roomId);
  usePresence(sessionId, roomId, uid);

  useEffect(() => {
    ensureSignedIn().then((user) => setUid(user.uid));
  }, []);

  if (!uid) {
    return (
      <div className="page" style={{ textAlign: "center" }}>
        <p className="muted">接続中...</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="page">
        <p className="muted">
          部屋 {roomId} の情報を読み込んでいます。部屋コードが正しいか確認してください。
        </p>
      </div>
    );
  }

  const me = room.players[uid];
  if (!me) {
    return (
      <div className="page">
        <p className="muted">この部屋にまだ参加していません。「参加する」画面からやり直してください。</p>
      </div>
    );
  }

  const phase = room.meta.phase;
  const isMyTurn = room.buzz.first?.uid === uid;
  const activePlayerName = room.players[room.buzz.first?.uid ?? ""]?.name ?? "誰か";

  return (
    <div className="page">
      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 16,
        }}
      >
        <h1 style={{ margin: 0, fontSize: "1.3rem" }}>{me.name} さん</h1>
        <div className="btn-row" style={{ gap: 8 }}>
          <span className="badge badge-success">✓ {me.correctCount}問正解</span>
          <span className="badge">⚡ アタック権 {me.attackStock}</span>
        </div>
      </div>

      {phase === "lobby" && (
        <div className="card" style={{ textAlign: "center" }}>
          <p className="muted" style={{ margin: 0 }}>ゲーム開始をお待ちください...</p>
        </div>
      )}

      {(phase === "q_reading" || phase === "buzz_open") && room.question && (
        <div className="card stack" style={{ textAlign: "center" }}>
          <h2>{room.question.text}</h2>
          {phase === "buzz_open" ? (
            <button
              onClick={() => actions.tryBuzzIn(sessionId, roomId, uid)}
              className="btn-primary btn-large"
              style={{ fontSize: 28, padding: "28px" }}
            >
              🔔 早押し!
            </button>
          ) : (
            <p className="muted" style={{ margin: 0 }}>まもなく早押しが始まります...</p>
          )}
        </div>
      )}

      {phase === "answering" && room.question && (
        <div className="card stack">
          <h2>{room.question.text}</h2>
          {isMyTurn ? (
            <div style={{ display: "grid", gap: 8 }}>
              {room.question.choices.map((choice, i) => (
                <button
                  key={i}
                  onClick={() => actions.submitAnswer(sessionId, roomId, uid, i as 0 | 1 | 2 | 3)}
                  style={{ fontSize: 18, padding: 16, textAlign: "left" }}
                >
                  {choice}
                </button>
              ))}
            </div>
          ) : (
            <p className="muted" style={{ margin: 0 }}>{activePlayerName} が解答中...</p>
          )}
        </div>
      )}

      {phase === "panel_select" && (
        <div className="card" style={{ textAlign: "center" }}>
          {isMyTurn ? (
            <>
              <h2>🎉 正解!パネルを選んでください</h2>
              <div style={{ display: "flex", justifyContent: "center" }}>
                <BoardView
                  board={room.board}
                  players={room.players}
                  selectableIndices={
                    new Set(room.board.map((_, i) => i).filter((i) => canClaimPanel(room.board, i)))
                  }
                  onSelect={(index) => actions.submitPanelPick(sessionId, roomId, uid, index)}
                />
              </div>
            </>
          ) : (
            <p className="muted" style={{ margin: 0 }}>{activePlayerName} がパネルを選択中...</p>
          )}
        </div>
      )}

      {phase !== "panel_select" && phase !== "result" && (
        <div className="card" style={{ marginTop: 16, textAlign: "center" }}>
          <h2>盤面</h2>
          <div style={{ display: "flex", justifyContent: "center" }}>
            <BoardView board={room.board} players={room.players} />
          </div>
        </div>
      )}

      {phase === "result" && (
        <div style={{ marginTop: 16 }}>
          <ResultBoard board={room.board} players={room.players} />
        </div>
      )}
    </div>
  );
}
