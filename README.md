# Discord Bot 開発ハンズオン（全10回）

メンタル系サーバー向けチャットボットを題材に、  
**「壊れず・覚えて・外とつながる」Botを段階的に育てていく**  
全10回のハンズオンシリーズです。

- 毎回やることは **1つだけ**
- DB / API / インフラは **必要になった瞬間にだけ導入**
- 理論より **「そうしないと詰む」を体験ベースで** 学びます

---

## 📚 ハンズオン一覧

> ※ 各回の README / source は順次更新されます  
> ※ リンク先は未完成でも、構造として先に用意しています

| 回 | 日付 | テーマ | 資料 | コード |
|----|------|--------|------|--------|
| 1 | **2025/01/17** | **開発環境セットアップ** | [📄](handson-guides/01_environment-setup/README.md) | - |
| 2 | **2025/01/30** | **Git / GitHub 基礎（ハンズオン）** | [📄](handson-guides/02_git-practice/README.md) | - |
| 3 | 未定 | **Bot導入＋SQLiteで「1つだけ覚える」** | [📄](handson-guides/03_bot-sqlite/README.md) | [💾](handson-guides/03_bot-sqlite/source/) |
| 4 | 未定 | **メンタル系Botとしての最小実装** | [📄](handson-guides/04_mental-bot-basic/README.md) | [💾](handson-guides/04_mental-bot-basic/source/) |
| 5 | 未定 | **DBを使うが、評価しない** | [📄](handson-guides/05_db-advanced/README.md) | [💾](handson-guides/05_db-advanced/source/) |
| 6 | 未定 | **Gemini API 導入（自由生成しない）** | [📄](handson-guides/06_gemini-api/README.md) | [💾](handson-guides/06_gemini-api/source/) |
| 7 | 未定 | **エラー処理・リトライ・フォールバック設計** | [📄](handson-guides/07_error-handling/README.md) | [💾](handson-guides/07_error-handling/source/) |
| 8 | 未定 | **安全・倫理・事故らない線引き** | [📄](handson-guides/08_ethics-safety/README.md) | - |
| 9 | 未定 | **このBotを「外に置く」としたら** | [📄](handson-guides/09_deploy-overview/README.md) | - |
| 10 | 未定 | **振り返り＋次の分岐点** | [📄](handson-guides/10_review/README.md) | - |

> ※ 第3回が、このシリーズの **実質スタート回**です  
> ※ 第4回以降の日程は決まり次第更新します

---

## 🎯 推奨参加ルート

### 🔰 完全初心者の方
**第1回からの参加を推奨**します。

- 開発環境をそろえるだけの回です
- 内容が分からなくても問題ありません
- 「動く状態」を作ることだけがゴールです

---

### 🤖 Bot開発経験がある方
**第3回から参加可能**です。

- Git の基本操作（add / commit / push）が前提になります
- Discord Bot の構造説明は最小限です

---

### 🧠 DB・API経験がある方
**第6回（Gemini API）以降からの参加も可能**です。

- SQLite を使った保存・取得の経験がある前提になります
- Bot + DB の統合経験があるとスムーズです

---

## 💡 このハンズオンの特徴

### 1. ランダム参加でも破綻しない
- 毎回 15 名程度の参加を想定しています
- 途中参加・途中離脱が前提の設計です
- 各回は「その回だけでも完結」する構成です

---

### 2. 「必要だから使う」技術導入
- 最初から DB や LLM を使いません
- **「覚えさせたくなったら DB」**
- **「文章を整えたくなったら LLM」**
- 技術は課題解決の手段として登場します

---

### 3. メンタル系サーバー特化設計
- 判断しない
- 診断しない
- アドバイスしない

**「作れる」と「やっていい」は違う**  
という前提を、実装を通して学びます。

---

### 4. GCP 未準備でも詰まらない
- 後半は「実装」ではなく「地図」を渡します
- SSH / デプロイは概念理解を重視します
- 無理に環境を用意して事故る構成にはしていません

---

## 🛠️ 使用技術

- **言語**: JavaScript（Node.js）
- **エディタ**: VS Code
- **バージョン管理**: Git / GitHub
- **Bot Framework**: discord.js
- **データベース**: SQLite
- **LLM**: Gemini API
- **デプロイ**: GCP（予定）

---

## 📖 参考資料

- [全10回ロードマップ詳細](roadmap.md)
- [Gitトラブルシューティング](references/git-troubleshooting.md)
- [Discord API 基礎](references/discord-api-basics.md)
- [Gemini API 線引きガイド](references/gemini-guidelines.md)

---

## 🔄 更新履歴

- **2025/01/31**: README.md を全体設計に合わせて更新  
- 2025/01/30: 第2回（Git / GitHub 基礎）実施  
- 2025/01/17: 第1回（開発環境セットアップ）実施
