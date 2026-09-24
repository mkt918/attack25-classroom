import { useMemo, useState } from "react";
import type { Auth } from "firebase/auth";
import type { Database } from "firebase/database";
import { ensureSignedIn } from "../firebase/auth";
import { getNamedInstance } from "../firebase/config";
import {
  createRooms,
  getOrCreateSessionId,
  resetSessionId,
  setActiveSession,
} from "../firebase/sessionActions";
import { joinRoom } from "../firebase/roomActions";
import { useSessionRooms } from "../hooks/useSessionRooms";
import { RoomMonitor } from "./teacher/RoomMonitor";
import { RuleConfigEditor } from "../components/RuleConfigEditor";
import { QuestionSetEditor } from "../components/QuestionSetEditor";
import { StudentPlay } from "./student/StudentPlay";
import {
  createEmptyQuestionSet,
  listQuestionSets,
  saveQuestionSet as persistQuestionSet,
} from "../data/questionStore";
import { sampleQuestionSet } from "../data/sampleQuestions";
import {
  DEFAULT_RULE_CONFIG,
  PLAYER_COLORS,
  type QuestionSet,
  type RuleConfig,
} from "../types/game";

const MIN_PLAYERS = 1;
const MAX_PLAYERS = PLAYER_COLORS.length;
const DEFAULT_PLAYER_COUNT = 4;

interface PlayerSlot {
  name: string;
  /** 1人目(操作している自分)は undefined。デフォルト接続で先生と共用する。 */
  authInstance?: Auth;
  dbInstance?: Database;
}

function defaultNames(count: number): string[] {
  return Array.from({ length: count }, (_, i) => `プレイヤー${i + 1}`);
}

export function SoloMode() {
  const [sessionId, setSessionId] = useState<string>(() => getOrCreateSessionId());
  const [questionSet, setQuestionSet] = useState<QuestionSet>(() => {
    const saved = listQuestionSets();
    return saved[0] ?? sampleQuestionSet;
  });
  const [ruleConfig, setRuleConfig] = useState<RuleConfig>(DEFAULT_RULE_CONFIG);
  const [playerCount, setPlayerCount] = useState(DEFAULT_PLAYER_COUNT);
  const [names, setNames] = useState<string[]>(() => defaultNames(DEFAULT_PLAYER_COUNT));
  const [roomId, setRoomId] = useState<string | null>(null);
  const [setupBusy, setSetupBusy] = useState(false);
  const [setupError, setSetupError] = useState<string | null>(null);

  const rooms = useSessionRooms(sessionId);
  const room = roomId ? rooms[roomId] : undefined;

  function handlePlayerCountChange(count: number) {
    const clamped = Math.max(MIN_PLAYERS, Math.min(MAX_PLAYERS, count));
    setPlayerCount(clamped);
    setNames((prev) => {
      const next = defaultNames(clamped);
      for (let i = 0; i < Math.min(prev.length, clamped); i++) {
        if (prev[i]) next[i] = prev[i];
      }
      return next;
    });
  }

  function handleNewSession() {
    const id = resetSessionId();
    setSessionId(id);
    setRoomId(null);
  }

  function handleSaveQuestionSet() {
    persistQuestionSet(questionSet);
  }

  async function handleSetup() {
    setSetupBusy(true);
    setSetupError(null);
    try {
      const hostUser = await ensureSignedIn();
      await setActiveSession(sessionId);
      const [newRoomId] = await createRooms(sessionId, 1, hostUser.uid, ruleConfig);

      for (let i = 0; i < playerCount; i++) {
        // 1人目(自分)はデフォルト接続を共用し、2人目以降だけ名前付きインスタンスで別uidを持たせる。
        const identity: { auth?: Auth; db?: Database } =
          i === 0 ? {} : getNamedInstance(`solo-${sessionId}-${i + 1}`);
        const user = await ensureSignedIn(identity.auth);
        await joinRoom(sessionId, newRoomId, user.uid, names[i] || `プレイヤー${i + 1}`, identity.db);
      }

      setRoomId(newRoomId);
    } catch (err) {
      setSetupError(err instanceof Error ? err.message : String(err));
    } finally {
      setSetupBusy(false);
    }
  }

  const slots: PlayerSlot[] = useMemo(
    () =>
      Array.from({ length: playerCount }, (_, i) => {
        if (i === 0) return { name: names[i] ?? `プレイヤー${i + 1}` };
        const identity = getNamedInstance(`solo-${sessionId}-${i + 1}`);
        return { name: names[i] ?? `プレイヤー${i + 1}`, authInstance: identity.auth, dbInstance: identity.db };
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [playerCount, sessionId, roomId]
  );

  return (
    <div className="page page-wide">
      <h1>1人用モード（動作確認）</h1>
      <p className="muted">
        1台の端末だけで、先生役と生徒役(最大{MAX_PLAYERS}人)をまとめて操作できます。
        早押し・解答・パネル選択の一連の流れをひとりで確認したいときに使ってください。
        実際の授業では通常どおり「先生用ダッシュボード」と生徒それぞれの「参加する」画面を使います。
      </p>

      {!roomId ? (
        <div className="stack">
          <section className="card">
            <h2>1. 問題を用意する</h2>
            <QuestionSetEditor value={questionSet} onChange={setQuestionSet} />
            <div className="btn-row" style={{ marginTop: "var(--space-sm)" }}>
              <button className="btn-primary" onClick={handleSaveQuestionSet}>この問題集を保存</button>
              <button onClick={() => setQuestionSet(createEmptyQuestionSet())}>新規作成</button>
              {listQuestionSets().map((s) => (
                <button key={s.id} onClick={() => setQuestionSet(s)}>
                  読込: {s.title}
                </button>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>2. ルールを決める</h2>
            <RuleConfigEditor value={ruleConfig} onChange={setRuleConfig} />
          </section>

          <section className="card">
            <h2>3. プレイヤー人数と名前</h2>
            <p>
              セッションID: <code>{sessionId}</code>
            </p>
            <div className="btn-row" style={{ alignItems: "center", marginBottom: "var(--space-sm)" }}>
              <button onClick={handleNewSession}>新しいセッションを始める</button>
            </div>
            <label className="field-label" style={{ maxWidth: 160 }}>
              人数({MIN_PLAYERS}〜{MAX_PLAYERS}人)
              <input
                type="number"
                min={MIN_PLAYERS}
                max={MAX_PLAYERS}
                value={playerCount}
                onChange={(e) => handlePlayerCountChange(Number(e.target.value))}
              />
            </label>
            <div className="stack" style={{ marginTop: "var(--space-sm)" }}>
              {names.slice(0, playerCount).map((name, i) => (
                <label className="field-label" style={{ marginBottom: 0 }} key={i}>
                  {i === 0 ? "1人目(自分)" : `${i + 1}人目`}
                  <input
                    value={name}
                    onChange={(e) =>
                      setNames((prev) => {
                        const next = [...prev];
                        next[i] = e.target.value;
                        return next;
                      })
                    }
                  />
                </label>
              ))}
            </div>
          </section>

          <section className="card">
            <h2>4. 部屋を作って全員で参加する</h2>
            <button className="btn-primary btn-large" onClick={handleSetup} disabled={setupBusy}>
              {setupBusy ? "準備しています…" : "この設定で部屋を作って参加する"}
            </button>
            {setupError && <p className="error-text">{setupError}</p>}
          </section>
        </div>
      ) : (
        <div className="stack">
          <section className="card">
            <div className="btn-row" style={{ alignItems: "center", justifyContent: "space-between" }}>
              <p style={{ margin: 0 }}>
                部屋 <span className="nums">{roomId}</span> で{playerCount}人が参加しています。
              </p>
              <button onClick={() => setRoomId(null)}>設定に戻る(部屋を作り直す)</button>
            </div>
          </section>

          <section>
            <h2>進行操作(先生役)</h2>
            <RoomMonitor
              sessionId={sessionId}
              roomId={roomId}
              questionSet={questionSet}
              config={ruleConfig}
              room={room}
            />
          </section>

          <section>
            <h2>プレイヤー画面</h2>
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))",
                gap: "var(--space-md)",
              }}
            >
              {slots.map((slot, i) => (
                <div key={i} className="card" style={{ padding: "var(--space-sm)" }}>
                  <p className="field-note" style={{ margin: "0 0 var(--space-xs)" }}>
                    {i === 0 ? "1人目(自分)" : `${i + 1}人目`}: {slot.name}
                  </p>
                  <StudentPlay
                    sessionId={sessionId}
                    roomId={roomId}
                    authInstance={slot.authInstance}
                    dbInstance={slot.dbInstance}
                    compact
                  />
                </div>
              ))}
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
