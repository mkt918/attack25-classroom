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
    setResult({ status: "running", message: "確認しています…" });

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
    <div className="page">
      <h1>M0: Firebase 疎通確認</h1>
      <p>
        このページは開発用です。教室のネットワークからこのページを開き、下のボタンを押して
        Firebase Realtime Database への読み書きができるか確認してください。
      </p>
      <button
        onClick={runCheck}
        disabled={result.status === "running"}
        data-state={
          result.status === "running"
            ? "loading"
            : result.status === "error"
              ? "error"
              : result.status === "ok"
                ? "success"
                : undefined
        }
      >
        {result.status === "running" ? "確認しています…" : "接続を確認する"}
      </button>

      {result.status !== "idle" && (
        <div
          className="card card-tight"
          style={{
            marginTop: "var(--space-md)",
            borderLeft: "var(--rule) solid var(--color-border)",
            borderColor:
              result.status === "ok"
                ? "var(--color-success)"
                : result.status === "error"
                  ? "var(--color-accent)"
                  : "var(--color-border)",
            background:
              result.status === "ok"
                ? "var(--color-success-soft)"
                : result.status === "error"
                  ? "var(--color-accent-soft)"
                  : "var(--color-surface)",
          }}
        >
          <strong>{result.message}</strong>
          {result.detail && (
            <pre
              style={{
                whiteSpace: "pre-wrap",
                overflowWrap: "anywhere",
                fontFamily: "var(--font-mono)",
                fontSize: "var(--text-sm)",
                marginTop: "var(--space-xs)",
              }}
            >
              {result.detail}
            </pre>
          )}
        </div>
      )}
    </div>
  );
}
