import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { getDb } from "../../firebase/config";
import { ensureSignedIn } from "../../firebase/auth";
import { getActiveSession } from "../../firebase/sessionActions";
import { joinRoom } from "../../firebase/roomActions";
import { roomPath } from "../../firebase/paths";
import { navigate } from "../../hooks/useHashRoute";

export function Join() {
  const [uid, setUid] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [code, setCode] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    ensureSignedIn().then((user) => setUid(user.uid));
  }, []);

  async function handleJoin() {
    if (!uid || !name.trim() || !code.trim()) return;
    setBusy(true);
    setError(null);
    try {
      const sessionId = await getActiveSession();
      if (!sessionId) {
        setError("授業セッションが見つかりません。先生に開始してもらってください。");
        return;
      }
      const roomCode = code.trim();
      const roomSnap = await get(ref(getDb(), roomPath(sessionId, roomCode)));
      if (!roomSnap.exists()) {
        setError("その部屋コードは見つかりませんでした。もう一度確認してください。");
        return;
      }
      await joinRoom(sessionId, roomCode, uid, name.trim());
      navigate(`/play/${sessionId}/${roomCode}`);
    } finally {
      setBusy(false);
    }
  }

  const canSubmit = !!name.trim() && code.trim().length === 4 && !busy && !!uid;

  return (
    <div className="page" style={{ maxWidth: 420 }}>
      <h1>参加する</h1>
      <div className="card stack">
        <label className="field-label">
          なまえ
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="やまだ たろう"
            style={{ fontSize: 18 }}
          />
        </label>
        <label className="field-label">
          部屋コード(数字4桁)
          <input
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/[^0-9]/g, "").slice(0, 4))}
            onKeyDown={(e) => e.key === "Enter" && canSubmit && handleJoin()}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={4}
            placeholder="1234"
            style={{
              fontSize: 32,
              letterSpacing: "0.3em",
              textAlign: "center",
              fontVariantNumeric: "tabular-nums",
            }}
          />
        </label>
        <button className="btn-primary btn-large" onClick={handleJoin} disabled={!canSubmit}>
          {busy ? "参加中..." : "参加する"}
        </button>
        {error && <p className="error-text" style={{ margin: 0 }}>{error}</p>}
      </div>
    </div>
  );
}
