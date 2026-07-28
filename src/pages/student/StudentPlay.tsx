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
    return <div style={{ padding: 24 }}>接続中...</div>;
  }

  if (!room) {
    return (
      <div style={{ padding: 24 }}>
        部屋 {roomId} の情報を読み込んでいます。部屋コードが正しいか確認してください。
      </div>
    );
  }

  const me = room.players[uid];
  if (!me) {
    return <div style={{ padding: 24 }}>この部屋にまだ参加していません。「参加する」画面からやり直してください。</div>;
  }

  const phase = room.meta.phase;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 24, textAlign: "left" }}>
      <h1>{me.name} さん</h1>
      <p>
        正解数: {me.correctCount} / アタック権: {me.attackStock}
      </p>

      {phase === "lobby" && <p>ゲーム開始をお待ちください...</p>}

      {(phase === "q_reading" || phase === "buzz_open") && room.question && (
        <>
          <h2>{room.question.text}</h2>
          {phase === "buzz_open" && (
            <button
              onClick={() => actions.tryBuzzIn(sessionId, roomId, uid)}
              style={{ fontSize: 24, padding: "16px 32px" }}
            >
              早押し!
            </button>
          )}
        </>
      )}

      {phase === "answering" && room.question && (
        <>
          <h2>{room.question.text}</h2>
          {room.buzz.first?.uid === uid ? (
            <div style={{ display: "grid", gap: 8 }}>
              {room.question.choices.map((choice, i) => (
                <button
                  key={i}
                  onClick={() =>
                    actions.submitAnswer(sessionId, roomId, uid, i as 0 | 1 | 2 | 3)
                  }
                  style={{ fontSize: 18, padding: 12 }}
                >
                  {choice}
                </button>
              ))}
            </div>
          ) : (
            <p>{room.players[room.buzz.first?.uid ?? ""]?.name ?? "誰か"} が解答中...</p>
          )}
        </>
      )}

      {phase === "panel_select" && (
        <>
          {room.buzz.first?.uid === uid ? (
            <>
              <h2>正解!パネルを選んでください</h2>
              <BoardView
                board={room.board}
                players={room.players}
                selectableIndices={
                  new Set(
                    room.board.map((_, i) => i).filter((i) => canClaimPanel(room.board, i))
                  )
                }
                onSelect={(index) => actions.submitPanelPick(sessionId, roomId, uid, index)}
              />
            </>
          ) : (
            <p>{room.players[room.buzz.first?.uid ?? ""]?.name ?? "誰か"} がパネルを選択中...</p>
          )}
        </>
      )}

      {phase !== "panel_select" && phase !== "result" && (
        <>
          <h2>盤面</h2>
          <BoardView board={room.board} players={room.players} />
        </>
      )}

      {phase === "result" && <ResultBoard board={room.board} players={room.players} />}
    </div>
  );
}
