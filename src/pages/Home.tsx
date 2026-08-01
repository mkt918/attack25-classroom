import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const joinUrl = `${window.location.origin}${window.location.pathname}#/join`;
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, joinUrl, { width: 180, margin: 1 });
    }
  }, []);

  return (
    <div className="page">
      <h1>アタック25 授業版</h1>
      <p className="muted" style={{ marginBottom: "var(--space-xl)" }}>
        パネルクイズ「アタック25」のルールを使った、教室向けの同時対戦クイズです。
      </p>

      <div className="stack">
        <a href="#/teacher" className="card" style={{ textDecoration: "none", display: "block" }}>
          <h2 style={{ marginBottom: "var(--space-2xs)" }}>先生の方はこちら</h2>
          <p className="muted" style={{ margin: 0 }}>問題・ルールの設定、部屋の作成</p>
        </a>

        <a href="#/join" className="card" style={{ textDecoration: "none", display: "block" }}>
          <h2 style={{ marginBottom: "var(--space-2xs)" }}>生徒の方はこちら</h2>
          <p className="muted" style={{ margin: 0 }}>部屋コードを入れて参加</p>
        </a>

        {/* QRは左に図版、右に説明。カードを続けて中央寄せしない */}
        <div
          className="card"
          style={{
            display: "flex",
            alignItems: "center",
            gap: "var(--space-lg)",
            flexWrap: "wrap",
          }}
        >
          <canvas ref={canvasRef} style={{ flexShrink: 0 }} />
          <div style={{ minWidth: "12rem", flex: 1 }}>
            <h2 style={{ marginBottom: "var(--space-2xs)" }}>スマホで参加する</h2>
            <p className="muted" style={{ margin: 0 }}>
              このQRコードを読み取ると、参加ページが開きます。部屋コードは先生が黒板やプロジェクタで
              知らせてください。
            </p>
          </div>
        </div>
      </div>

      <p style={{ marginTop: "var(--space-lg)" }}>
        <a href="#/check" className="muted">Firebase 疎通確認（開発用）</a>
      </p>
    </div>
  );
}
