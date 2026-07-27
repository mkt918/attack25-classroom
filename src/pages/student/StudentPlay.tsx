import { useEffect, useState } from "react";
import { ensureSignedIn } from "../../firebase/auth";
import * as actions from "../../firebase/roomActions";
import { useRoomState } from "../../hooks/useRoomState";
import { BoardView } from "../../components/BoardView";
import { canClaimPanel } from "../../engine";

const SESSION_ID = "demo";
const ROOM_ID = "demo-room";

export function StudentPlay() {
  const [uid, setUid] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [joined, setJoined] = useState(false);
  const room = useRoomState(SESSION_ID, ROOM_ID);

  useEffect(() => {
    ensureSignedIn().then((user) => setUid(user.uid));
  }, []);

  useEffect(() => {
    if (uid && room?.players?.[uid]) {
      setJoined(true);
    }
  }, [uid, room]);

  async function handleJoin() {
    if (!uid || !name.trim()) return;
    await actions.joinRoom(SESSION_ID, ROOM_ID, uid, name.trim());
    setJoined(true);
  }

  if (!uid) {
    return <div style={{ padding: 24 }}>接続中...</div>;
  }

  if (!joined) {
    return (
      <div style={{ maxWidth: 400, margin: "0 auto", padding: 24, textAlign: "left" }}>
        <h1>参加する</h1>
        <p>部屋コード: {ROOM_ID}</p>
        <input
          placeholder="なまえ"
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ fontSize: 18, padding: 8, width: "100%", boxSizing: "border-box" }}
        />
        <button onClick={handleJoin} disabled={!name.trim()} style={{ marginTop: 12 }}>
          参加する
        </button>
      </div>
    );
  }

  if (!room) {
    return <div style={{ padding: 24 }}>部屋の情報を待っています(先生が部屋を初期化するまでお待ちください)</div>;
  }

  const me = room.players[uid];
  const phase = room.meta.phase;

  return (
    <div style={{ maxWidth: 480, margin: "0 auto", padding: 24, textAlign: "left" }}>
      <h1>{me?.name} さん</h1>
      <p>
        正解数: {me?.correctCount} / アタック権: {me?.attackStock}
      </p>

      {phase === "lobby" && <p>ゲーム開始をお待ちください...</p>}

      {(phase === "q_reading" || phase === "buzz_open") && room.question && (
        <>
          <h2>{room.question.text}</h2>
          {phase === "buzz_open" && (
            <button
              onClick={() => actions.tryBuzzIn(SESSION_ID, ROOM_ID, uid)}
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
                    actions.submitAnswer(SESSION_ID, ROOM_ID, uid, i as 0 | 1 | 2 | 3)
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
                    room.board
                      .map((_, i) => i)
                      .filter((i) => canClaimPanel(room.board, i))
                  )
                }
                onSelect={(index) => actions.submitPanelPick(SESSION_ID, ROOM_ID, uid, index)}
              />
            </>
          ) : (
            <p>{room.players[room.buzz.first?.uid ?? ""]?.name ?? "誰か"} がパネルを選択中...</p>
          )}
        </>
      )}

      {phase !== "panel_select" && (
        <>
          <h2>盤面</h2>
          <BoardView board={room.board} players={room.players} />
        </>
      )}

      {phase === "result" && <h2>ゲーム終了!</h2>}
    </div>
  );
}
