import { useEffect, useState } from "react";
import { ensureSignedIn } from "../../firebase/auth";
import * as actions from "../../firebase/roomActions";
import { useRoomState } from "../../hooks/useRoomState";
import { usePresence } from "../../hooks/usePresence";
import { useTypewriter } from "../../hooks/useTypewriter";
import { BoardView, COLOR_MAP, COLOR_LABEL_JA } from "../../components/BoardView";
import { ResultBoard } from "../../components/ResultBoard";
import { PanelCountSummary } from "../../components/PanelCountSummary";
import {
  canClaimPanel,
  getSelectablePanelIndices,
  getErasablePanelIndices,
  isAttackChanceQuestion,
} from "../../engine";

interface StudentPlayProps {
  sessionId: string;
  roomId: string;
}

export function StudentPlay({ sessionId, roomId }: StudentPlayProps) {
  const [uid, setUid] = useState<string | null>(null);
  const room = useRoomState(sessionId, roomId);
  usePresence(sessionId, roomId, uid);
  const revealedQuestionText = useTypewriter(
    room?.question?.text ?? "",
    room?.ruleConfig.charRevealMs ?? 0
  );

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
  const isResting = (me.restQuestionsLeft ?? 0) > 0;
  const attackChance = isAttackChanceQuestion(
    room.meta.questionIndex,
    room.meta.totalQuestionCount,
    room.ruleConfig.finalAttackQuestions
  );
  const selectablePanelIndices =
    isMyTurn && phase === "panel_select"
      ? new Set(
          attackChance
            ? getErasablePanelIndices(room.board)
            : room.ruleConfig.flipMode === "othello"
              ? getSelectablePanelIndices(room.board, uid)
              : room.board.map((_, i) => i).filter((i) => canClaimPanel(room.board, i))
        )
      : undefined;

  return (
    <div className="page" style={{ paddingLeft: 10, paddingRight: 10 }}>
      <div
        className="card"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 12,
          marginBottom: 16,
          borderTop: `6px solid ${COLOR_MAP[me.color]}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, minWidth: 0 }}>
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: 28,
              height: 28,
              borderRadius: "50%",
              background: COLOR_MAP[me.color],
              border: "2px solid var(--border)",
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: "1.3rem", overflow: "hidden", textOverflow: "ellipsis" }}>
              {me.name} さん
            </h1>
            <p className="muted" style={{ margin: 0, fontSize: 13 }}>
              あなたの色: {COLOR_LABEL_JA[me.color]}
            </p>
          </div>
        </div>
        <div className="btn-row" style={{ gap: 8, flexShrink: 0 }}>
          <span className="badge badge-success">正解 {me.correctCount}問</span>
          <span className="badge">アタック権 {me.attackStock}</span>
        </div>
      </div>

      {phase === "lobby" && (
        <div className="card" style={{ textAlign: "center" }}>
          <p className="muted" style={{ margin: 0 }}>ゲーム開始をお待ちください...</p>
        </div>
      )}

      {(phase === "q_reading" || phase === "buzz_open") && room.question && (
        <div className="card stack" style={{ textAlign: "center" }}>
          <h2 style={{ minHeight: "2.6em" }}>
            {revealedQuestionText}
            {revealedQuestionText.length < room.question.text.length && (
              <span className="typewriter-caret">|</span>
            )}
          </h2>
          {phase === "buzz_open" ? (
            isResting ? (
              <p className="error-text" style={{ margin: 0 }}>
                お休み中(あと{me.restQuestionsLeft}問)。次の問題までお待ちください。
              </p>
            ) : (
              <button
                onClick={() => actions.tryBuzzIn(sessionId, roomId, uid)}
                className="btn-primary btn-large"
                style={{ fontSize: 24, padding: "24px" }}
              >
                早押し
              </button>
            )
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
        <div className="card" style={{ textAlign: "center", padding: "16px 8px" }}>
          {isMyTurn ? (
            <>
              <h2>
                {attackChance ? "正解。アタックチャンス、消すパネルを選んでください" : "正解。パネルを選んでください"}
              </h2>
              <PanelCountSummary board={room.board} players={room.players} />
              <div style={{ display: "flex", justifyContent: "center" }}>
                <BoardView
                  board={room.board}
                  players={room.players}
                  selectableIndices={selectablePanelIndices}
                  onSelect={(index) => actions.submitPanelPick(sessionId, roomId, uid, index)}
                  size="lg"
                />
              </div>
            </>
          ) : (
            <p className="muted" style={{ margin: 0 }}>{activePlayerName} がパネルを選択中...</p>
          )}
        </div>
      )}

      {phase !== "panel_select" && phase !== "result" && (
        <div className="card" style={{ marginTop: 16, textAlign: "center", padding: "16px 8px" }}>
          <h2>盤面</h2>
          <PanelCountSummary board={room.board} players={room.players} />
          <div style={{ display: "flex", justifyContent: "center" }}>
            <BoardView board={room.board} players={room.players} size="lg" />
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
