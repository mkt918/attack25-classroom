import { useEffect, useState } from "react";
import { ensureSignedIn } from "../../firebase/auth";
import {
  createRooms,
  getOrCreateSessionId,
  resetSessionId,
  setActiveSession,
} from "../../firebase/sessionActions";
import { useSessionRooms } from "../../hooks/useSessionRooms";
import { RoomMonitor } from "./RoomMonitor";
import { RuleConfigEditor } from "../../components/RuleConfigEditor";
import { QuestionSetEditor } from "../../components/QuestionSetEditor";
import {
  createEmptyQuestionSet,
  listQuestionSets,
  saveQuestionSet as persistQuestionSet,
} from "../../data/questionStore";
import { sampleQuestionSet } from "../../data/sampleQuestions";
import { DEFAULT_RULE_CONFIG, type QuestionSet, type RuleConfig } from "../../types/game";

export function Dashboard() {
  const [hostUid, setHostUid] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string>(() => getOrCreateSessionId());
  const [questionSet, setQuestionSet] = useState<QuestionSet>(() => {
    const saved = listQuestionSets();
    return saved[0] ?? sampleQuestionSet;
  });
  const [ruleConfig, setRuleConfig] = useState<RuleConfig>(DEFAULT_RULE_CONFIG);
  const [roomCount, setRoomCount] = useState(4);
  const [creating, setCreating] = useState(false);

  const rooms = useSessionRooms(sessionId);
  const roomIds = Object.keys(rooms).sort();

  useEffect(() => {
    ensureSignedIn().then((user) => setHostUid(user.uid));
  }, []);

  useEffect(() => {
    setActiveSession(sessionId);
  }, [sessionId]);

  async function handleCreateRooms() {
    if (!hostUid) return;
    setCreating(true);
    try {
      await createRooms(sessionId, roomCount, hostUid, ruleConfig);
    } finally {
      setCreating(false);
    }
  }

  function handleNewSession() {
    const id = resetSessionId();
    setSessionId(id);
  }

  function handleSaveQuestionSet() {
    persistQuestionSet(questionSet);
  }

  return (
    <div className="page page-wide">
      <h1>先生用ダッシュボード</h1>

      <div className="stack">
        <section className="card">
          <h2>1. 問題を用意する</h2>
          <QuestionSetEditor value={questionSet} onChange={setQuestionSet} />
          <div className="btn-row" style={{ marginTop: 12 }}>
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
          <h2>3. 部屋(班)を作る</h2>
          <p>
            セッションID: <code>{sessionId}</code>
          </p>
          <div className="btn-row" style={{ alignItems: "center", marginBottom: 12 }}>
            <button onClick={handleNewSession}>新しいセッションを始める</button>
          </div>
          <label className="field-label" style={{ maxWidth: 160 }}>
            班の数
            <input
              type="number"
              min={1}
              max={30}
              value={roomCount}
              onChange={(e) => setRoomCount(Number(e.target.value))}
            />
          </label>
          <button className="btn-primary" onClick={handleCreateRooms} disabled={!hostUid || creating}>
            部屋を一括作成
          </button>
        </section>

        <section>
          <h2>4. 進行状況({roomIds.length}部屋)</h2>
          {roomIds.length === 0 && (
            <div className="card">
              <p className="muted" style={{ margin: 0 }}>まだ部屋がありません。上で「部屋を一括作成」してください。</p>
            </div>
          )}
          <div className="stack">
            {roomIds.map((roomId) => (
              <RoomMonitor
                key={roomId}
                sessionId={sessionId}
                roomId={roomId}
                questionSet={questionSet}
                config={ruleConfig}
                room={rooms[roomId]}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}
