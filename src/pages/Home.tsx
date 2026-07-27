export function Home() {
  return (
    <div style={{ maxWidth: 640, margin: "0 auto", padding: 24, textAlign: "left" }}>
      <h1>アタック25 授業版</h1>
      <p>
        パネルクイズ「アタック25」ルールを使った、教室向け同時対戦クイズです。
      </p>
      <ul>
        <li>
          <a href="#/check">M0: Firebase 疎通確認(開発用)</a>
        </li>
        <li>
          <a href="#/host-demo">M2デモ: 先生用ホスト画面</a>
        </li>
        <li>
          <a href="#/play-demo">M2デモ: 生徒用参加画面</a>
        </li>
      </ul>
    </div>
  );
}
