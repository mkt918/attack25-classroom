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
      const roomCode = code.trim().toUpperCase();
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

  return (
    <div style={{ maxWidth: 400, margin: "0 auto", padding: 24, textAlign: "left" }}>
      <h1>参加する</h1>
      <label style={{ display: "block", marginBottom: 12 }}>
        なまえ
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          style={{ fontSize: 18, padding: 8, width: "100%", boxSizing: "border-box" }}
        />
      </label>
      <label style={{ display: "block", marginBottom: 12 }}>
        部屋コード
        <input
          value={code}
          onChange={(e) => setCode(e.target.value)}
          style={{
            fontSize: 24,
            padding: 8,
            width: "100%",
            boxSizing: "border-box",
            textTransform: "uppercase",
          }}
          placeholder="例: AB3D"
        />
      </label>
      <button onClick={handleJoin} disabled={!name.trim() || !code.trim() || busy}>
        {busy ? "参加中..." : "参加する"}
      </button>
      {error && <p style={{ color: "#d9291c" }}>{error}</p>}
    </div>
  );
}
