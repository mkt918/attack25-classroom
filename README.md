# アタック25 授業版

パネルクイズ「アタック25」のルールを使った、教室向け同時対戦クイズWebアプリ。
詳しい設計は [docs/設計書_授業用アタック25.md](docs/設計書_授業用アタック25.md) を参照。

- 先生画面(`#/teacher`): 問題投入(TSV貼り付け)・ルール設定(トグル/スライダー)・部屋の一括作成・全部屋モニタ/介入
- 生徒画面(`#/join` → `#/play/...`): 部屋コードで参加、早押し→4択解答→パネル選択

## セットアップ

### 1. 依存関係のインストール

```bash
npm install
```

### 2. Firebase プロジェクトの準備

1. https://console.firebase.google.com でプロジェクトを作成
2. 「Realtime Database」を作成(テストモードでOK。後で `database.rules.json` を適用)
3. 「Authentication」→「Sign-in method」で「匿名」を有効化
4. 「プロジェクトの設定」→「マイアプリ」でウェブアプリを追加し、`firebaseConfig` を取得

### 3. 環境変数の設定

`.env.example` を参考に `.env.local` を作成し、Firebase の設定値を入れる。

```bash
cp .env.example .env.local
```

### 4. 開発サーバー起動

```bash
npm run dev
```

## テスト

ルールエンジン(パネル反転・勝敗判定・アタック権)は DB/UI に依存しない純粋関数として実装され、ユニットテストで検証されている。

```bash
npm test
```

## セキュリティルールの適用

`database.rules.json` に、ホストのみが盤面/進行状態を書き込める・生徒は自分の入力しか書き込めない、という一方向データフローを強制するルールを定義している。Firebase Console の「Realtime Database」→「ルール」タブに貼り付けて公開する(初期状態のテストモードのままだと誰でも書き換えられるため、授業で本格運用する前に必ず適用すること)。

## デプロイ(GitHub Pages)

`.github/workflows/deploy.yml` が `main` ブランチへの push で自動ビルド・デプロイする。事前に以下を設定しておく。

1. リポジトリの Settings → Pages → Source を「GitHub Actions」に設定
2. Settings → Secrets and variables → Actions に `.env.local` と同じ内容を Repository secrets として登録
   (`VITE_FIREBASE_API_KEY` など、`.env.example` に載っている変数名すべて)

## ディレクトリ構成

```
src/
  engine/      パネル反転・勝敗判定などのルールエンジン(純粋関数、テストあり)
  firebase/    RTDBのパス定義・読み書き・認証・進行制御(RoomController)
  hooks/       useHostGameLoop(ホストの進行ロジック)などのReactフック
  pages/
    teacher/   先生用ダッシュボード
    student/   生徒用の参加/プレイ画面
  components/  盤面表示・ルール設定UI・結果発表などの共通コンポーネント
  data/        問題集のTSVパース/永続化、サンプル問題
docs/          設計書
```
