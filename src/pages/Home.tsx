export function Home() {
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 24, textAlign: "left" }}>
      <h1>アタック25 授業版</h1>
      <p>パネルクイズ「アタック25」ルールを使った、教室向け同時対戦クイズです。</p>
      <ul>
        <li>
          <a href="#/teacher">先生の方はこちら(問題・ルール設定、部屋の作成)</a>
        </li>
        <li>
          <a href="#/join">生徒の方はこちら(部屋コードで参加)</a>
        </li>
        <li>
          <a href="#/check">Firebase 疎通確認(開発用)</a>
        </li>
      </ul>
    </div>
  );
}
