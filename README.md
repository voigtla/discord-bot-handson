# Discord Bot 開発ハンズオン（全10回）

メンタル系サーバー向けチャットボットを、「壊れず・覚えて・外とつながる」形に育てていく **全10回のハンズオン**です。  
各回の資料は **このリポジトリ内の Markdown（.md）** を順番に読んで進めます。

> 💻 **OSについて**  
> この資料は **Windows（PowerShell）** を基本に書いています。Macの方は「PowerShell → ターミナル」と読み替えればOKです。

---

## 📚 目次（各回の資料リンク）

| 回 | テーマ | 内容（やること） | 資料 |
|----|--------|------------------|------|
| 1 | 開発環境セットアップ | Node.js / Git / VS Code を入れて、最初の Node.js を動かす | [📄 第1回資料](01_setup_README_expand.md) |
| 2 | Git/GitHub基礎 | add / commit / push の流れを作って、GitHubへ公開する | [📄 第2回資料](02_git-practice_README_expand.md) |
| 3 | Bot初導入 + SQLite基礎 | Discord Bot を起動し、SQLiteに保存・読み出しする | [📄 第3回資料](03_bot-sqlite_README_expand.md) |
| 4 | SQLite保存 + データ集計 | 気分記録（/feeling）と、集計（/count）まで到達する | [📄 第4回資料](04_mental-bot-basic_README_expand.md) |
| 5 | 定型パターンの登録 | テンプレート管理とキーワード反応（SQLパターンの応用） | [📄 第5回資料](05_sql-patterns_README_expand.md) |
| 6 | AI機能の導入（第一回） | Gemini API登録、AI会話の導入 | [📄 第6回資料](06_gemini-api_README_expand.md) |
| 7 | AI機能の導入（第二回） | 荒らし対策・スパム検出・運用セキュリティ | [📄 第7回資料](07_bot-security_README_expand.md) |
| 8 | エラーハンドリング | 壊れにくい作り（try/catch、DBの安全策、フォールバック） | [📄 第8回資料](08_error-handling_README_expand.md) |
| 9 | 本番環境デプロイ | SSH、サーバー準備、PM2で常駐 | [📄 第9回資料](09_ssh-deployment_README_expand.md) |
| 10 | 通し確認 + 振り返り | 全機能の確認、改善案の整理、次の拡張 | [📄 第10回資料](10_final-review_README_expand.md) |

---

## 🎯 推奨参加ルート

### 初心者（プログラミング初めて）
**第1回から参加** → 環境構築からゆっくり進めます

### Git経験者（Botは初めて）
**第2回から参加** → Git操作の復習 + Bot開発へ

### Bot開発経験者
**第3回から参加** → SQLiteとメンタル系機能の実装に集中

### DB経験者
**第6回から参加** → AI機能と運用へ集中（ただし Discord.js の流れは軽く確認推奨）

---

## 🛠️ 必要な環境

### 全員共通
- Windows PC（macOS/Linuxも可）
- インターネット接続
- Discordアカウント
- GitHubアカウント

### ソフトウェア（第1回でインストール）
- Node.js 20.x以上
- Git
- VS Code（推奨）または Cursor

### 追加で必要なもの
- **第6回〜**: Google アカウント（Gemini API用）
- **第9回〜**: GCPアカウント または VPS

---

## 💡 このハンズオンの特徴

### 1. 実践（動くBotを段階的に育てる）
座学ではなく、**実際に動くBot**を作りながら進めます。

### 2. メンタル系サーバー向け
一般的なBotではなく、**メンタル系サーバーで使える機能**を実装します。
- 気分の記録と可視化
- AIによる応答（第6回以降）
- キーワード反応（第5回）
- 緊急時の導線（第5回以降の発展）

### 3. セキュリティと運用を最初から意識
- トークン管理（.env / Git）
- 例外処理・ログ
- 本番デプロイ（第9回）

---

## 📖 各回のゴール（短い一覧）

- **第1回**：開発の準備ができ、Node.jsが動く
- **第2回**：Gitで履歴を残し、GitHubへpushできる
- **第3回**：Botが起動し、SQLiteへ保存・読み出しできる
- **第4回**：気分を記録し、簡単な集計を返せる
- **第5回**：テンプレートをDBで扱い、自動応答の形を作れる
- **第6回**：Gemini APIと接続し、AI応答が返せる
- **第7回**：荒らし・スパムなど運用面のガードを追加できる
- **第8回**：落ちにくい実装に寄せ、エラー時の挙動を整える
- **第9回**：サーバーへデプロイし、常駐運用できる
- **第10回**：全体を通して確認し、次の改善点が言語化できる

---

## 💬 サポート（任意で追記）

- Discord サーバー：`（ここに招待リンクを入れる）`
- GitHub Issues：`（ここにリポジトリURLを入れる）`

---

## 📚 参考資料（任意）

- Discord.js ガイド：`https://discordjs.guide/`
- Node.js ドキュメント：`https://nodejs.org/docs/`
- SQLite チュートリアル：`https://www.sqlitetutorial.net/`
- Gemini API：`https://ai.google.dev/docs`

---

最終更新: {today}
