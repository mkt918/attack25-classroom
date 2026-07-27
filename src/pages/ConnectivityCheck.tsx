import { useState } from "react";
import { getDb, isFirebaseConfigured } from "../firebase/config";
import { ensureSignedIn } from "../firebase/auth";
import { ref, set, get, remove } from "firebase/database";

type CheckStatus = "idle" | "running" | "ok" | "error";

interface CheckResult {
  status: CheckStatus;
  message: string;
  detail?: string;
}

/**
 * M0: 学校ネットワークから Firebase RTDB に読み書きできるかを確認する最小ページ。
 * 設計書の「学校ネットワークのフィルタリングで塞がれていないか」を
 * 開発着手前に確認するためのもの。
 */
export function ConnectivityCheck() {
  const [result, setResult] = useState<CheckResult>({ status: "idle", message: "" });

  async function runCheck() {
    setResult({ status: "running", message: "確認中..." });

    if (!isFirebaseConfigured) {
      setResult({
        status: "error",
        message: "Firebase の設定が見つかりません。",
        detail:
          ".env.local に VITE_FIREBASE_* の値を設定してください(.env.example を参照)。",
      });
      return;
    }

    try {
      const user = await ensureSignedIn();
      const testPath = `_connectivityCheck/${user.uid}`;
      const testRef = ref(getDb(), testPath);
      const sentAt = Date.now();

      await set(testRef, { checkedAt: sentAt });
      const snapshot = await get(testRef);
      const value = snapshot.val();

      if (!value || value.checkedAt !== sentAt) {
        throw new Error("書き込んだ値と読み取った値が一致しません。");
      }

      await remove(testRef);

      setResult({
        status: "ok",
        message: "Firebase RTDB への読み書きに成功しました。",
        detail: `認証UID: ${user.uid}`,
      });
    } catch (err) {
      const detail = err instanceof Error ? err.message : String(err);
      setResult({
        status: "error",
        message: "Firebase への接続に失敗しました。",
        detail: `${detail}\n学校ネットワークのファイアウォール/フィルタリングで firebaseio.com への接続が塞がれていないか確認してください。`,
      });
    }
  }

  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 24, textAlign: "left" }}>
      <h1>M0: Firebase 疎通確認</h1>
      <p>
        このページは開発用です。教室のネットワークからこのページを開き、下のボタンを押して
        Firebase Realtime Database への読み書きができるか確認してください。
      </p>
      <button onClick={runCheck} disabled={result.status === "running"}>
        {result.status === "running" ? "確認中..." : "接続を確認する"}
      </button>

      {result.status !== "idle" && (
        <div
          style={{
            marginTop: 16,
            padding: 12,
            borderRadius: 8,
            background:
              result.status === "ok"
                ? "rgba(0,180,0,0.1)"
                : result.status === "error"
                ? "rgba(220,0,0,0.1)"
                : "rgba(128,128,128,0.1)",
          }}
        >
          <strong>{result.message}</strong>
          {result.detail && (
            <pre style={{ whiteSpace: "pre-wrap", fontSize: 14, marginTop: 8 }}>
              {result.detail}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
