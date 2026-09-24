import { useEffect, useState } from "react";
import type { Auth } from "firebase/auth";
import type { Database } from "firebase/database";
import { ensureSignedIn } from "../../firebase/auth";
import * as actions from "../../firebase/roomActions";
import { useRoomState } from "../../hooks/useRoomState";
import { usePresence } from "../../hooks/usePresence";
import { useTypewriter } from "../../hooks/useTypewriter";
import { BoardView } from "../../components/BoardView";
import { COLOR_MAP, COLOR_LABEL_JA } from "../../components/playerColors";
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
  /**
   * 通常プレイでは省略する。「1人用モード」で複数の生徒役を1画面から
   * 操作するときだけ、生徒役ごとの名前付き Firebase インスタンスを渡す。
   */
  authInstance?: Auth;
  dbInstance?: Database;
  /** true にすると .page の外枠(最大幅・余白)を外し、グリッドのタイルとして敷き詰められるようにする */
  compact?: boolean;
}

export function StudentPlay({
  sessionId,
  roomId,
  authInstance,
  dbInstance,
  compact = false,
}: StudentPlayProps) {
  const [uid, setUid] = useState<string | null>(null);
  const room = useRoomState(sessionId, roomId);
  usePresence(sessionId, roomId, uid, dbInstance);
  const revealedQuestionText = useTypewriter(
    room?.question?.text ?? "",
    room?.ruleConfig.charRevealMs ?? 0
  );

  useEffect(() => {
    ensureSignedIn(authInstance).then((user) => setUid(user.uid));
  }, [authInstance]);

  const wrapClassName = compact ? undefined : "page";

  if (!uid) {
    return (
      <div className={wrapClassName}>
        <p className="muted">接続しています…</p>
      </div>
    );
  }

  if (!room) {
    return (
      <div className={wrapClassName}>
        <p className="muted">
          部屋 {roomId} の情報を読み込んでいます。部屋コードが正しいか確認してください。
        </p>
      </div>
    );
  }

  const me = room.players[uid];
  if (!me) {
    return (
      <div className={wrapClassName}>
        <p className="muted">この部屋にまだ参加していません。「参加する」画面からやり直してください。</p>
      </div>
    );
  }

  const phase = room.meta.phase;
  const isMyTurn = room.buzz.first?.uid === uid;
  const activePlayerName = room.players[room.buzz.first?.uid ?? ""]?.name ?? "だれか";
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
    <div className={wrapClassName}>
      <div
        className="card card-tight"
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "var(--space-sm)",
          marginBottom: "var(--space-md)",
          borderTop: `var(--rule-thick) solid ${COLOR_MAP[me.color]}`,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "var(--space-xs)", minWidth: 0 }}>
          <span
            aria-hidden
            style={{
              display: "inline-block",
              width: 26,
              height: 26,
              borderRadius: "var(--radius-pill)",
              background: COLOR_MAP[me.color],
              border: "var(--rule) solid var(--color-border)",
              flexShrink: 0,
            }}
          />
          <div style={{ minWidth: 0 }}>
            <h1 style={{ margin: 0, fontSize: "var(--text-lg)" }}>{me.name} さん</h1>
            <p className="field-note" style={{ margin: 0 }}>
              あなたの色: {COLOR_LABEL_JA[me.color]}
            </p>
          </div>
        </div>
        <div className="btn-row" style={{ flexShrink: 0 }}>
          <span className="badge badge-success">正解 {me.correctCount}問</span>
          <span className="badge">アタック権 {me.attackStock}</span>
        </div>
      </div>

      {phase === "lobby" && (
        <div className="card card-tight">
          <p className="muted" style={{ margin: 0 }}>ゲーム開始をお待ちください。</p>
        </div>
      )}

      {(phase === "q_reading" || phase === "buzz_open") && room.question && (
        <div className="card stack">
          <h2 style={{ minHeight: "2.6em", margin: 0 }}>
            {revealedQuestionText}
            {revealedQuestionText.length < room.question.text.length && (
              <span className="typewriter-caret">|</span>
            )}
          </h2>
          {phase === "buzz_open" ? (
            isResting ? (
              <p className="error-text" style={{ margin: 0 }}>
                お休み中（あと{me.restQuestionsLeft}問）。次の問題までお待ちください。
              </p>
            ) : (
              <button
                onClick={() => actions.tryBuzzIn(sessionId, roomId, uid, dbInstance)}
                className="btn-primary btn-large"
              >
                早押し
              </button>
            )
          ) : (
            <p className="muted" style={{ margin: 0 }}>まもなく早押しが始まります。</p>
          )}
        </div>
      )}

      {phase === "answering" && room.question && (
        <div className="card stack">
          <h2 style={{ margin: 0 }}>{room.question.text}</h2>
          {isMyTurn ? (
            <div style={{ display: "grid", gap: "var(--space-xs)" }}>
              {room.question.choices.map((choice, i) => (
                <button
                  key={i}
                  onClick={() =>
                    actions.submitAnswer(sessionId, roomId, uid, i as 0 | 1 | 2 | 3, dbInstance)
                  }
                  style={{
                    fontSize: "var(--text-lg)",
                    padding: "var(--space-md)",
                    textAlign: "left",
                    whiteSpace: "normal",
                  }}
                >
                  {choice}
                </button>
              ))}
            </div>
          ) : (
            <p className="muted" style={{ margin: 0 }}>{activePlayerName} さんが解答しています。</p>
          )}
        </div>
      )}

      {phase === "panel_select" && (
        <div className="card card-board">
          {isMyTurn ? (
            <>
              <h2>
                {attackChance
                  ? "正解。アタックチャンス、消すパネルを選んでください"
                  : "正解。パネルを選んでください"}
              </h2>
              <PanelCountSummary board={room.board} players={room.players} />
              <BoardView
                board={room.board}
                players={room.players}
                selectableIndices={selectablePanelIndices}
                onSelect={(index) =>
                  actions.submitPanelPick(sessionId, roomId, uid, index, dbInstance)
                }
                size="lg"
              />
            </>
          ) : (
            <p className="muted" style={{ margin: 0 }}>
              {activePlayerName} さんがパネルを選んでいます。
            </p>
          )}
        </div>
      )}

      {phase === "explanation" && room.question && (
        <div className="card stack">
          <h2 style={{ margin: 0 }}>{room.question.text}</h2>
          <div
            className="card-tight"
            style={{
              background: "var(--color-accent-soft)",
              borderRadius: "var(--radius)",
            }}
          >
            <p style={{ margin: 0, whiteSpace: "pre-wrap" }}>{room.explanation}</p>
          </div>
        </div>
      )}

      {phase !== "panel_select" && phase !== "result" && (
        <div className="card card-board" style={{ marginTop: "var(--space-md)" }}>
          <h2>盤面</h2>
          <PanelCountSummary board={room.board} players={room.players} />
          <BoardView board={room.board} players={room.players} size="lg" />
        </div>
      )}

      {phase === "result" && (
        <div style={{ marginTop: "var(--space-md)" }}>
          <ResultBoard board={room.board} players={room.players} />
        </div>
      )}
    </div>
  );
}
