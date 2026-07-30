import { useEffect, useRef } from "react";
import QRCode from "qrcode";

export function Home() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const joinUrl = `${window.location.origin}${window.location.pathname}#/join`;
    if (canvasRef.current) {
      QRCode.toCanvas(canvasRef.current, joinUrl, { width: 200, margin: 1 });
    }
  }, []);

  return (
    <div className="page">
      <h1>アタック25 授業版</h1>
      <p className="muted" style={{ marginBottom: 28 }}>
        パネルクイズ「アタック25」ルールを使った、教室向け同時対戦クイズです。
      </p>

      <div className="stack">
        <a href="#/teacher" className="card" style={{ textDecoration: "none", display: "block" }}>
          <h2 style={{ marginBottom: 4 }}>先生の方はこちら</h2>
          <p className="muted" style={{ margin: 0 }}>問題・ルール設定、部屋の作成</p>
        </a>
        <a href="#/join" className="card" style={{ textDecoration: "none", display: "block" }}>
          <h2 style={{ marginBottom: 4 }}>生徒の方はこちら</h2>
          <p className="muted" style={{ margin: 0 }}>部屋コードで参加</p>
        </a>
      </div>

      <div className="card" style={{ textAlign: "center", marginTop: 24 }}>
        <h2>スマホで参加</h2>
        <p className="muted">QRコードを読み取ると参加ページに移動します</p>
        <canvas ref={canvasRef} />
      </div>

      <p style={{ marginTop: 24 }}>
        <a href="#/check" className="muted">Firebase 疎通確認(開発用)</a>
      </p>
    </div>
  );
}
