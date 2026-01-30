# Discord Bot 開発ハンズオン（全10回）

メンタル系サーバー向けチャットボットを、「壊れず・覚えて・外とつながる」形に育てていく10回のハンズオンシリーズです。

---

## 📚 ハンズオン一覧

| 回 | 日時 | テーマ | 資料 | コード |
|----|------|--------|------|--------|
| 1 | - | （基礎的すぎるためスキップ） | - | - |
| 2 | 2025/01/XX | **Git/GitHub基礎** | [📄](handson-guides/02_git-practice/) | - |
| 3 | 2025/XX/XX | **Bot導入＋SQLiteで「1つだけ覚える」** | [📄](handson-guides/03_bot-sqlite/) | [💾](handson-guides/03_bot-sqlite/source/) |
| 4 | 2025/XX/XX | **メンタル系Botとしての最小実装** | [📄](handson-guides/04_mental-bot-basic/) | [💾](handson-guides/04_mental-bot-basic/source/) |
| 5 | 2025/XX/XX | **DBを使った"意味のある返答"** | [📄](handson-guides/05_db-advanced/) | [💾](handson-guides/05_db-advanced/source/) |
| 6 | 2025/XX/XX | **Gemini API で「優しい返答」を自動生成** | [📄](handson-guides/06_gemini-api/) | [💾](handson-guides/06_gemini-api/source/) |
| 7 | 2025/XX/XX | **エラー処理・リトライ・ログ保存** | [📄](handson-guides/07_error-handling/) | [💾](handson-guides/07_error-handling/source/) |
| 8 | 2025/XX/XX | **安全・倫理・事故らない設計** | [📄](handson-guides/08_ethics-safety/) | - |
| 9 | 2025/XX/XX | **このBotを"外に置く"としたら** | [📄](handson-guides/09_deploy-overview/) | - |
| 10 | 2025/XX/XX | **振り返り＋分岐点を渡す** | [📄](handson-guides/10_review/) | - |

---

## 🎯 推奨参加ルート

### 完全初心者の方
**第2回から参加** → Git/GitHubの基礎から学べます

### Bot開発経験がある方
**第3回から参加** → SQLiteを使ったデータ保存から始められます

### DB経験もある方
**第6回から参加** → LLM連携から参加できます

### 途中参加の方へ
各回は独立しているため、いつからでも参加可能です。ただし、以下の知識は前提となります：

- **第3回以降** → Git/GitHubの基本操作
- **第6回以降** → SQLiteの基本操作
- **第9回以降** → Bot + DB + LLM の統合経験

---

## 💡 このハンズオンの特徴

### 1. ランダム参加OK
- 毎回15名程度、固定メンバーではありません
- 途中参加・途中離脱が前提の設計

### 2. 「必要だから使う」設計
- 理論より実践
- 「そうしないと詰む」を体験ベースで学ぶ

### 3. メンタル系サーバー特化
- 技術と倫理を自然に結びつける
- 「作れるけど、やらない」を学べる

### 4. 現実的なゴール設定
- GCP環境は後半で「地図を渡す」形式
- 無理に全部やらず、分岐点を明示

---

## 📖 参考資料

### Git/GitHub
- [Gitトラブルシューティング](references/git-troubleshooting.md)
- [GitHub公式ドキュメント](https://docs.github.com/ja)

### Discord Bot開発
- [discord.js 公式ガイド](https://discordjs.guide/)
- [Bot雛形（ぺったん版）](https://github.com/impettan/basebot)

### その他
- [全10回ロードマップ詳細](roadmap.md)
- [Gemini API 線引きガイドライン](references/gemini-guidelines.md)

---

## 🛠️ 使用技術

- **言語**: JavaScript（Node.js）
- **エディタ**: VS Code
- **バージョン管理**: Git/GitHub
- **Bot Framework**: discord.js
- **データベース**: SQLite
- **LLM**: Gemini API
- **デプロイ**: GCP（予定）

---

## 💬 質問・相談

### Discord
サーバー招待リンク: （準備中）

### GitHub Issue
このリポジトリの [Issues](../../issues) タブから質問できます

### その他
各ハンズオン資料内の「困ったときは」セクションを参照してください

---

## 📝 ライセンス

このリポジトリの資料は、教育目的での利用を前提としています。

---

## 👥 貢献者

- みずはら（主催）
- ぺったん（Bot雛形提供）
- その他参加メンバー

---

## 🔄 更新履歴

- 2025/01/XX: 第2回（Git/GitHub基礎）資料公開
- 2025/01/XX: リポジトリ初期構築
