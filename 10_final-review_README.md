# 第10回：通し確認＋振り返り

全10回のハンズオンを総まとめします。  
作成した Bot の **最終確認** と **今後の展望** を考えます。

---

## 📌 この回の目標

- すべての機能が正常に動作することを確認する
- パフォーマンスと安定性をテストする
- セキュリティの最終チェック
- 今後の改善点と拡張アイデアを議論

**💡 ポイント：**
- 「動く」から「使える」へ
- ドキュメント整備
- 運用計画の立案

---

## 🎯 この回の流れ

1. 全機能の動作確認チェックリスト
2. パフォーマンステスト
3. セキュリティ監査
4. ドキュメント作成
5. 振り返りと今後の展望

---

## 第1章：全機能の動作確認（30分）

### 1-1. 基本コマンドのテスト

ここで追加する処理は、**スラッシュコマンドを実行した瞬間**に動くものです。  
`index.js` を開き、`client.on('interactionCreate', ...)` を探してください。  
その中の `if (!interaction.isChatInputCommand()) return;` があるブロックが対象です。  
この章のコードは、基本的にその **ブロックの中**（他の `if (interaction.commandName === ...)` と同じ並び）に入れます。


Discord で以下を順番に実行してください：

```
✅ チェックリスト

【第1回〜第3回: 基礎】
□ /hello → Bot が返信する
□ /save message:テスト → メッセージが保存される
□ /read → 保存したメッセージが読み出せる

【第4回: 気分記録】
□ /feeling mood:good → 気分が記録される
□ /count → 統計が表示される
□ 気分ごとの内訳が正しい

【第5回: 定型メッセージ】
□ /template list → テンプレート一覧が表示される
□ /template get breathe → 深呼吸ガイドが表示される
□ /sos → 緊急連絡先が表示される
□ キーワード反応（「辛い」と発言すると自動応答）

【第6回: AI 機能】
□ /ai message:こんにちは → AI が応答する
□ /ai-reset → 履歴がリセットされる
□ レート制限が機能している

【第7回: セキュリティ】
□ スパム検出（同じメッセージを連投すると警告）
□ /moderation logs → ログが表示される（管理者のみ）
□ 不適切コンテンツのフィルタリング

【第8回: エラーハンドリング】
□ エラーが発生しても Bot が停止しない
□ /error-logs → エラーログが確認できる（管理者のみ）

【第9回: デプロイ】
□ Bot が24時間稼働している
□ サーバー再起動後も自動起動する
□ PM2 でプロセス管理できている
```

---

### 1-2. 管理者コマンドのテスト

ここで追加する処理は、**スラッシュコマンドを実行した瞬間**に動くものです。  
`index.js` を開き、`client.on('interactionCreate', ...)` を探してください。  
その中の `if (!interaction.isChatInputCommand()) return;` があるブロックが対象です。  
この章のコードは、基本的にその **ブロックの中**（他の `if (interaction.commandName === ...)` と同じ並び）に入れます。


**管理者権限で実行：**

```
□ /template add → 新しいテンプレートを追加
□ /template delete → テンプレートを削除
□ /keyword add → キーワードを追加
□ /keyword list → キーワード一覧
□ /moderation logs → モデレーションログ
□ /moderation stats → スパム統計
□ /ai-stats → AI使用統計
□ /error-logs → エラーログ
```

---

## 第2章：パフォーマンステスト（20分）

### 2-1. 応答速度の確認

```bash
# サーバー上で実行
pm2 monit
```

**確認項目：**
- CPU使用率が常時50%を超えていないか
- メモリ使用量が適切か
- 応答時間が1秒以内か

---

### 2-2. 負荷テスト

**複数人で同時にコマンドを実行：**

1. 5人で同時に `/ai` コマンド
2. 10人で同時に `/feeling` コマンド
3. 連続で20回 `/count` コマンド

**確認：**
- Bot が停止しないか
- レスポンスが極端に遅くならないか
- エラーログに異常がないか

---

### 2-3. データベースサイズの確認

ここはデータベース（SQLite）の準備をする場所です。  
`index.js` の上のほうにある `const db = new Database(...)` と `db.exec(` が並んでいるあたりを探してください。  
テーブル作成や初期化のコードは、基本的にこの **DB準備のかたまりの中**に置きます。


```bash
# サーバー上で実行
ls -lh ~/git_practice/bot.db

# SQLiteで確認
sqlite3 ~/git_practice/bot.db "SELECT COUNT(*) FROM feelings"
sqlite3 ~/git_practice/bot.db "SELECT COUNT(*) FROM ai_conversations"
```

**目安：**
- 1000件のレコードで約1MB
- 10,000件で約10MB
- 定期的なクリーンアップ計画を立てる

---

## 第3章：セキュリティ監査（20分）

### 3-1. 環境変数のチェック

```bash
# サーバー上で確認
cat .env
```

**✅ 確認事項：**
- [ ] `.env` が `.gitignore` に含まれている
- [ ] トークンやAPIキーが漏れていない
- [ ] 権限が適切（600）

```bash
chmod 600 .env
```

---

### 3-2. GitHub リポジトリのチェック

GitHub で確認：

**✅ 確認事項：**
- [ ] `.env` ファイルが含まれていない
- [ ] `bot.db` が含まれていない
- [ ] トークンやAPIキーがコミット履歴にもない

**万が一含まれていた場合：**

```bash
# リポジトリから完全削除
git filter-branch --force --index-filter \
  "git rm --cached --ignore-unmatch .env" \
  --prune-empty --tag-name-filter cat -- --all

git push origin --force --all
```

---

### 3-3. サーバーのセキュリティチェック

```bash
# ファイアウォール状態
sudo ufw status

# SSH設定
cat /etc/ssh/sshd_config | grep -E "PasswordAuthentication|PermitRootLogin"

# 不要なポートが開いていないか
sudo netstat -tuln
```

---

## 第4章：ドキュメント作成（30分）

### 4-1. README.md の作成

プロジェクトルートに `README.md` を作成：

```markdown
# Discord Bot - メンタルサポート

メンタル系サーバー向けのチャットボット

## 機能

- 気分の記録と統計
- AI による会話サポート
- 定型メッセージ機能
- キーワード自動応答
- 緊急時の連絡先表示

## コマンド一覧

### ユーザー向け

- `/hello` - 挨拶
- `/feeling mood:[気分]` - 気分を記録
- `/count` - 統計を表示
- `/template get [キー]` - テンプレート表示
- `/sos` - 緊急連絡先
- `/ai message:[メッセージ]` - AIと会話

### 管理者向け

- `/template add` - テンプレート追加
- `/keyword add` - キーワード追加
- `/moderation logs` - モデレーションログ
- `/ai-stats` - AI使用統計

## セットアップ

### 必要な環境

- Node.js 20.x以上
- npm
- Discord Bot トークン
- Gemini API キー

### インストール

```bash
git clone <リポジトリURL>
cd git_practice
npm install
```

### 環境変数

`.env` ファイルを作成：

```
DISCORD_TOKEN=あなたのトークン
CLIENT_ID=あなたのクライアントID
GEMINI_API_KEY=あなたのGemini APIキー
```

### コマンド登録

```bash
node register-commands.js
```

### 起動

```bash
node index.js
```

## 本番環境へのデプロイ

PM2 を使用：

```bash
pm2 start index.js --name discord-bot
pm2 startup
pm2 save
```

## ライセンス

MIT License

## 連絡先

問題があれば Issue を作成してください。


---

### 4-2. コマンドリファレンスの作成

ここで追加する処理は、**スラッシュコマンドを実行した瞬間**に動くものです。  
`index.js` を開き、`client.on('interactionCreate', ...)` を探してください。  
その中の `if (!interaction.isChatInputCommand()) return;` があるブロックが対象です。  
この章のコードは、基本的にその **ブロックの中**（他の `if (interaction.commandName === ...)` と同じ並び）に入れます。


`COMMANDS.md` を作成：

# コマンドリファレンス

## ユーザーコマンド

### /feeling

ここで追加する処理は、**スラッシュコマンドを実行した瞬間**に動くものです。  
`index.js` を開き、`client.on('interactionCreate', ...)` を探してください。  
その中の `if (!interaction.isChatInputCommand()) return;` があるブロックが対象です。  
この章のコードは、基本的にその **ブロックの中**（他の `if (interaction.commandName === ...)` と同じ並び）に入れます。

気分を記録します。

**オプション：**
- `mood` (必須): 気分を選択
- `note` (任意): メモ

**例：**
```
/feeling mood:good note:天気が良い
```

### /count

ここで追加する処理は、**スラッシュコマンドを実行した瞬間**に動くものです。  
`index.js` を開き、`client.on('interactionCreate', ...)` を探してください。  
その中の `if (!interaction.isChatInputCommand()) return;` があるブロックが対象です。  
この章のコードは、基本的にその **ブロックの中**（他の `if (interaction.commandName === ...)` と同じ並び）に入れます。

記録の統計を表示します。

**表示内容：**
- 総記録数
- 今日の記録数
- 過去7日間の記録数
- 気分の内訳

...（以下、全コマンドの詳細）
```

---

### 4-3. 運用マニュアルの作成

`OPERATIONS.md` を作成：

```markdown
# 運用マニュアル

## 日常の運用

### Bot の状態確認

```bash
ssh server
pm2 list
pm2 logs discord-bot --lines 50
```

### エラーログの確認

ここでは「落ちにくくする」ために、既存の処理の近くへ `try/catch` などを追加します。  
まず `index.js` で該当するコマンド処理（`interaction.commandName === ...`）を見つけ、  
その **処理の内側**に書き足す形で進めます。


Discord で：
```
/error-logs limit:20
```

### モデレーションログの確認

```
/moderation logs limit:20
```

## メンテナンス

### 週次作業

- [ ] エラーログの確認
- [ ] ディスク容量の確認
- [ ] パフォーマンスの確認

### 月次作業

- [ ] データベースのバックアップ
- [ ] ログの削除
- [ ] 依存パッケージの更新

## トラブルシューティング

### Bot が応答しない

1. サーバーにSSH接続
2. `pm2 list` で状態確認
3. `pm2 logs discord-bot` でエラー確認
4. 必要なら `pm2 restart discord-bot`

...


---

## 第5章：改善点の洗い出し（20分）

### 5-1. 現状の課題リスト

**グループで議論：**

1. **機能面**
   - 足りない機能は？
   - 使いにくいコマンドは？
   - 改善したい応答は？

2. **パフォーマンス**
   - 遅いと感じる処理は？
   - メモリ使用量は適切か？

3. **セキュリティ**
   - 不安な点は？
   - 追加すべき対策は？

4. **運用**
   - 管理が大変な点は？
   - 自動化したい作業は？

---

### 5-2. 優先度付け

課題に優先度をつけます：

**高（すぐ対応）：**
- セキュリティ上の問題
- Bot停止につながるバグ
- ユーザー体験を大きく損なう問題

**中（次回更新で対応）：**
- 使いやすさの改善
- 新機能の追加
- パフォーマンス改善

**低（将来的に検討）：**
- Nice to have な機能
- 大規模な設計変更

---

## 第6章：今後の拡張アイデア（20分）

### 6-1. 短期的な拡張（1-2ヶ月）

**実装しやすい機能：**

1. **リマインダー機能**
   - 定期的に気分を記録するよう通知
   - 実装: node-cron + Discord DM

2. **週次レポート**
   - 1週間の気分の変化をグラフで表示
   - 実装: Chart.js + Canvas

3. **グループ機能**
   - 複数人での共同記録
   - 実装: group_id をテーブルに追加

4. **エクスポート機能**
   - 自分のデータをCSV出力
   - 実装: json2csv

---

### 6-2. 中期的な拡張（3-6ヶ月）

**やや複雑な機能：**

1. **音声チャンネル対応**
   - 音楽再生（リラックス音楽）
   - 実装: discord.js voice

2. **マルチサーバー対応**
   - 複数のDiscordサーバーで使用
   - 実装: サーバーIDでデータ分離

3. **Web ダッシュボード**
   - ブラウザで統計を確認
   - 実装: Express + React

4. **多言語対応**
   - 英語・中国語など
   - 実装: i18next

---

### 6-3. 長期的な拡張（6ヶ月〜）

**大規模な機能：**

1. **専門家連携**
   - カウンセラーへの相談予約
   - 実装: 外部API連携

2. **機械学習モデル**
   - 気分予測
   - リスク検出
   - 実装: TensorFlow.js

3. **モバイルアプリ**
   - iOS/Android 対応
   - 実装: React Native

---

## 第7章：振り返り（30分）

### 7-1. 個人の振り返り

**各自で考えてみましょう：**

1. **学んだこと**
   - 最も印象に残った技術は？
   - 難しかった概念は？
   - 意外と簡単だったことは？

2. **成長した点**
   - ハンズオン前と比べて何ができるようになった？
   - 自信がついた分野は？

3. **今後の目標**
   - 次に学びたい技術は？
   - 作ってみたいBotは？

---

### 7-2. グループでの振り返り

**全員で共有：**

1. **良かった点**
   - ハンズオンの進め方
   - 教材の内容
   - サポート体制

2. **改善点**
   - もっと詳しく知りたかった部分
   - 難しすぎた/簡単すぎた部分
   - 時間配分

3. **今後の活動**
   - このBotを実際に使う？
   - 継続的に改善する？
   - 次のプロジェクトは？

---

## 第8章：次のステップ（10分）

### 8-1. 推奨学習リソース

**Discord Bot 開発:**
- [discord.js 公式ガイド](https://discordjs.guide/)
- [Discord Developer Portal](https://discord.com/developers/docs)

**Node.js:**
- [Node.js 公式ドキュメント](https://nodejs.org/docs/)
- [JavaScript.info](https://javascript.info/)

**データベース:**
- [SQLite チュートリアル](https://www.sqlitetutorial.net/)
- [Database Design](https://www.udacity.com/course/database-systems-concepts-design--ud150)

**AI/LLM:**
- [Gemini API ドキュメント](https://ai.google.dev/docs)
- [プロンプトエンジニアリング](https://www.promptingguide.ai/jp)

---

### 8-2. コミュニティ

**参加推奨：**
- Discord.js 公式サーバー
- Node.js Japan User Group
- AI/LLM 勉強会

---

### 8-3. 資格・認定

**目指せる資格：**
- AWS Certified Developer
- Google Cloud Professional Cloud Developer
- JavaScript エキスパート認定

---

## ✅ 最終チェックリスト

### 機能

- [ ] 全コマンドが動作する
- [ ] エラーハンドリングが適切
- [ ] レート制限が機能している
- [ ] AI応答が適切

### セキュリティ

- [ ] 環境変数が保護されている
- [ ] GitHubにトークンが含まれていない
- [ ] ファイアウォールが設定されている
- [ ] SSH認証が強化されている

### 運用

- [ ] PM2で自動再起動
- [ ] ログローテーション設定済み
- [ ] 監視体制がある
- [ ] バックアップ計画がある

### ドキュメント

- [ ] README.md が整備されている
- [ ] コマンドリファレンスがある
- [ ] 運用マニュアルがある

---

## 🎓 修了証明

**全10回のハンズオンを完了しました！**

あなたは以下のスキルを習得しました：

✅ Discord Bot の開発
✅ Node.js / JavaScript
✅ SQLite データベース
✅ AI API 連携
✅ エラーハンドリング
✅ セキュリティ対策
✅ サーバーデプロイ
✅ プロセス管理

**おめでとうございます！ 🎉**

---

## 📝 アンケート（任意）

今後の改善のため、フィードバックをお願いします：

1. 全体の難易度は適切でしたか？
2. 各回の時間配分は適切でしたか？
3. もっと詳しく知りたかった内容は？
4. 次回のハンズオンで学びたいテーマは？

---

## 🚀 最後に

このハンズオンで作成した Bot は、あくまで **スタート地点** です。

- 実際のユーザーからフィードバックをもらう
- 継続的に改善する
- 新しい技術を取り入れる
- コミュニティに貢献する

これらを続けることで、あなたの Bot は **本当に役立つツール** になります。

**頑張ってください！ そして、楽しんでください！ 😊**

---

## 📚 参考資料・リンク集

### 公式ドキュメント
- Discord.js: https://discord.js.org/
- Node.js: https://nodejs.org/
- Gemini API: https://ai.google.dev/

### このハンズオンで使用したツール
- better-sqlite3: https://github.com/WiseLibs/better-sqlite3
- PM2: https://pm2.keymetrics.io/
- dotenv: https://github.com/motdotla/dotenv

### コミュニティ
- Discord API サーバー: https://discord.gg/discord-api
- Node.js Japan: https://nodejs.jp/

---

**全10回、お疲れさまでした！ 🎊**
---

## 📦 第10回の完成版ソースコード

### ファイル構成
```
git_practice/
├── .gitignore
├── .env
├── .env.example
├── package.json
├── package-lock.json
├── README.md（★新規推奨）
├── COMMANDS.md（★新規推奨）
├── OPERATIONS.md（★新規推奨）
├── index.js
├── register-commands.js
├── ai-helper.js
├── spam-detector.js
├── content-filter.js
├── deploy.sh
├── ecosystem.config.js（★新規推奨）
└── bot.db
```

---

### 新規ファイル（推奨）：README.md

**プロジェクトの説明文書：**

```markdown
# メンタルヘルスサポート Discord Bot

メンタル系サーバー向けの支援Botです。

## 機能

### 基本機能
- `/hello` - 挨拶
- `/save` - メッセージ保存
- `/read` - メッセージ読み出し

### 気分記録
- `/feeling` - 気分を記録
- `/count` - 記録の統計表示

### テンプレート機能
- `/template get [キー]` - テンプレート取得
- `/template list` - 一覧表示
- `/template add` - 追加（管理者のみ）
- `/template delete` - 削除（管理者のみ）

### キーワード反応
- 特定のキーワードに自動で反応
- 緊急キーワードには優先的に対応

### AI会話
- `/ai [メッセージ]` - AIと会話
- `/ai-reset` - 会話履歴リセット
- `/ai-stats` - 使用統計（管理者のみ）

### セキュリティ
- スパム検出
- コンテンツフィルタリング
- モデレーション機能

## セットアップ

1. 依存パッケージのインストール
```bash
npm install
```

2. 環境変数の設定
```bash
cp .env.example .env
# .env を編集して、トークンとAPIキーを設定
```

3. コマンドの登録
```bash
node register-commands.js
```

4. Botの起動
```bash
node index.js
```

## 本番環境へのデプロイ

```bash
./deploy.sh
```

詳細は `OPERATIONS.md` を参照してください。

## ライセンス

MIT License
```

---

### 新規ファイル（推奨）：COMMANDS.md

**コマンドリファレンス：**

```markdown
# コマンドリファレンス

## ユーザー向けコマンド

### /hello
挨拶します。

### /feeling [mood] [note]
今の気分を記録します。
- `mood`: 気分（great/good/okay/down/bad）
- `note`: メモ（任意）

### /count
気分記録の統計を表示します。

### /template get [key]
テンプレートを取得します。
- `key`: テンプレートのキー

### /template list
登録されているテンプレート一覧を表示します。

### /sos
緊急連絡先を表示します。

### /ai [message]
AIと会話します。
- `message`: AIに送るメッセージ
- 1時間に10回まで

### /ai-reset
AI会話履歴をリセットします。

## 管理者向けコマンド

### /template add [key] [content] [category]
テンプレートを追加します。
- 権限: メッセージ管理

### /template delete [key]
テンプレートを削除します。
- 権限: メッセージ管理

### /keyword add [keyword] [template] [priority]
キーワード反応を追加します。
- 権限: メッセージ管理

### /keyword list
キーワード一覧を表示します。
- 権限: メッセージ管理

### /keyword delete [id]
キーワードを削除します。
- 権限: メッセージ管理

### /ai-stats
AI使用統計を表示します。
- 権限: メッセージ管理

### /moderation logs [limit]
モデレーションログを表示します。
- 権限: メッセージ管理

### /moderation unban [user]
ペナルティを解除します。
- 権限: メッセージ管理

### /error-logs [limit]
エラーログを表示します。
- 権限: メッセージ管理
```

---

### 新規ファイル（推奨）：OPERATIONS.md

**運用マニュアル：**

```markdown
# 運用マニュアル

## 日常運用

### Botの状態確認
```bash
pm2 status
```

### ログの確認
```bash
# リアルタイムでログを見る
pm2 logs discord-bot

# 最新のログを見る
pm2 logs discord-bot --lines 100
```

### 再起動
```bash
pm2 restart discord-bot
```

## デプロイ手順

1. ローカルで変更をコミット
```bash
git add .
git commit -m "説明"
git push
```

2. サーバーでデプロイスクリプトを実行
```bash
ssh user@server
cd git_practice
./deploy.sh
```

## トラブルシューティング

### Botが反応しない
1. PM2の状態を確認
```bash
pm2 status
```

2. エラーログを確認
```bash
pm2 logs discord-bot --err
```

3. 必要に応じて再起動
```bash
pm2 restart discord-bot
```

### コマンドが反映されない
1. コマンドを再登録
```bash
node register-commands.js
```

2. Botを再起動
```bash
pm2 restart discord-bot
```

### データベースエラー
1. データベースファイルの確認
```bash
ls -la bot.db
```

2. バックアップから復元
```bash
cp backups/bot.db.backup bot.db
```

## バックアップ

### 手動バックアップ
```bash
cp bot.db backups/bot.db.$(date +%Y%m%d_%H%M%S)
```

### 自動バックアップ（cron）
```bash
crontab -e
```

以下を追加：
```
0 3 * * * cd /home/user/git_practice && cp bot.db backups/bot.db.$(date +\%Y\%m\%d)
```

## モニタリング

### CPU/メモリ使用状況
```bash
pm2 monit
```

### データベースサイズ
```bash
du -h bot.db
```

## セキュリティ

### 定期的な確認事項
- [ ] ペナルティログの確認
- [ ] モデレーションログの確認
- [ ] エラーログの確認
- [ ] スパム検出状況の確認

### 緊急対応
悪質なユーザーが発生した場合：
```bash
# 該当ユーザーのIDを確認してから
# /moderation ban コマンドを使用
# または直接データベースから削除
```
```

---

### ecosystem.config.js（PM2設定）

```javascript
module.exports = {
  apps: [{
    name: 'discord-bot',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true,
    // 再起動の設定
    min_uptime: '10s',
    max_restarts: 10,
    // クラッシュ時の動作
    restart_delay: 4000,
    // ログローテーション（pm2-logrotateが必要）
    merge_logs: true,
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z'
  }]
};
```

---

## 完成おめでとうございます！🎉

全10回のハンズオンで、以下を習得しました：

✅ Node.js / Discord.js の基礎  
✅ SQLite によるデータ管理  
✅ Git / GitHub での開発フロー  
✅ AI API（Gemini）の統合  
✅ セキュリティ対策  
✅ エラーハンドリング  
✅ 本番環境へのデプロイ  

**次のステップ：**
- 機能の追加（リマインダー、統計グラフなど）
- UIの改善（ボタン、セレクトメニュー）
- 他のサーバーでの運用
- コミュニティへの貢献


---

### index.js（完全版）

**第8回のindex.jsと同じです。**

第10回では、コードの変更はありません。  
全機能を通して確認し、ドキュメントを整備します。

**最終的なファイル構成：**
- index.js（第8回で完成）
- ai-helper.js（第6回で作成）
- spam-detector.js（第7回で作成）
- content-filter.js（第7回で作成）
- register-commands.js（全10回のコマンドを含む）
- deploy.sh（第9回で作成）
- ecosystem.config.js（第9回/第10回で作成）
- README.md（第10回で作成）
- COMMANDS.md（第10回で作成）
- OPERATIONS.md（第10回で作成）

**全10回の完成おめでとうございます！** 🎉

あなたは以下を習得しました：
- Node.js / Discord.js の基礎
- SQLite によるデータ管理
- Git / GitHub での開発フロー
- AI API（Gemini）の統合
- セキュリティ対策
- エラーハンドリング
- 本番環境へのデプロイ

これで第10回は完成です！

