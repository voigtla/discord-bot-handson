# 第14回：ログによる調査の基礎体力

「Botが動かない...なんで？」

その答えは、**ログの中**にあります。

この回では、pm2 logsを使った調査方法と、適切なログの追加・削除を学びます。

---

## 📌 この回の目標

- pm2 logs を使いこなせるようになる
- ログからエラーの原因を特定できる
- 適切なログを追加・削除できる

**💡 ポイント：**
- ログは「証拠」
- エラーメッセージを恐れない
- ログは多すぎても少なすぎてもダメ

---

## 🎯 完成イメージ

```
【ログがないと】
「Botが動かない...」
→ 何が起きているか分からない
→ 手当たり次第に確認
→ 時間がかかる

【ログがあると】
「Botが動かない...」
→ pm2 logs を確認
→ エラーメッセージ発見
→ 「あ、API_KEYが間違ってる」
→ 5分で解決
```

---

## 第1章：ログとは何か（10分）

### 1-1. ログの役割

**ログ（Log）：**
- プログラムの「実行記録」
- 何が起きたかを時系列で記録する
- エラーやデバッグ情報を残す

**ログがないと：**
```
Bot起動 → 何か処理 → エラー発生 → 停止
→ 「何が起きたか」が分からない
```

**ログがあると：**
```
Bot起動 → ログ：「Botが起動しました」
       → ログ：「データベース接続中...」
       → ログ：「エラー：DATABASE_PATH が設定されていません」
       → 停止

→ 「DATABASE_PATH の設定ミス」と分かる
```

---

### 1-2. ログの種類

**一般的なログレベル：**

```
DEBUG（デバッグ）
  ↓ 詳細な情報（開発時のみ）
INFO（情報）
  ↓ 通常の動作ログ
WARN（警告）
  ↓ 注意が必要だが、動作は継続
ERROR（エラー）
  ↓ エラーが発生、機能が停止
FATAL（致命的）
  ↓ プログラム全体が停止
```

**例：**

```javascript
log('debug', 'データベースクエリ: SELECT * FROM feelings');  // 開発時のみ
log('info', 'Botがログインしました');                      // 通常の動作
log('warn', 'API制限に近づいています（残り10%）');          // 警告
log('error', 'データベース接続に失敗しました');             // エラー
```

---

## 第2章：pm2 logs の使い方（15分）

### 2-1. 基本的なログ確認

**サーバーにSSH接続：**

```bash
ssh -i ~/.ssh/gcp-discord-bot discord_bot@<サーバーのIP>
```

---

#### コマンド1：リアルタイムでログを見る

```bash
pm2 logs discord-bot
```

**出力例：**

```
0|discord  | [INFO] 環境: production
0|discord  | [INFO] データベース: ./bot.db
0|discord  | [INFO] ログレベル: info
0|discord  | [INFO] データベース準備完了
0|discord  | [INFO] 初期テンプレート準備完了
0|discord  | [INFO] discord-bot でログインしました！
```

**💡 ポイント：**
- リアルタイムで更新される
- `Ctrl + C` で終了

---

#### コマンド2：過去のログを見る

```bash
pm2 logs discord-bot --lines 100
```

**💡 ポイント：**
- 過去100行のログを表示
- `--lines 50` で50行、など調整可能

---

#### コマンド3：エラーログだけを見る

```bash
pm2 logs discord-bot --err
```

**💡 ポイント：**
- エラーログのみ表示
- トラブル調査時に便利

---

#### コマンド4：ログをクリア

```bash
pm2 flush discord-bot
```

**💡 ポイント：**
- 古いログを削除
- ディスク容量の節約

---

### 2-2. ログファイルの場所

**PM2のログファイル：**

```bash
# ログファイルの場所を確認
pm2 info discord-bot
```

**出力例：**

```
│ log path              │ /home/discord_bot/.pm2/logs/discord-bot-out.log     │
│ error log path        │ /home/discord_bot/.pm2/logs/discord-bot-error.log   │
```

**直接ファイルを見る：**

```bash
# 標準出力ログ
tail -f ~/.pm2/logs/discord-bot-out.log

# エラーログ
tail -f ~/.pm2/logs/discord-bot-error.log
```

---

## 第3章：エラーログを読む（20分）

### 3-1. エラーログの構造

**典型的なエラーログ：**

```
2026-02-04 15:30:45 | [ERROR] データベース接続エラー
Error: ENOENT: no such file or directory, open './bot.db'
    at Object.openSync (fs.js:497:3)
    at Object.readFileSync (fs.js:393:35)
    at Database (~/git_practice/node_modules/better-sqlite3/lib/database.js:48:29)
    at Object.<anonymous> (~/git_practice/index.js:8:12)
    at Module._compile (internal/modules/cjs/loader.js:1085:14)
    at Object.Module._extensions..js (internal/modules/cjs/loader.js:1114:10)
```

**読み方：**

1. **エラーメッセージ：**
   ```
   Error: ENOENT: no such file or directory, open './bot.db'
   ```
   → 意味：`./bot.db` というファイルが見つからない

2. **スタックトレース（どこでエラーが起きたか）：**
   ```
   at Object.<anonymous> (~/git_practice/index.js:8:12)
   ```
   → 意味：`index.js` の8行目12文字目でエラー

---

### 3-2. よくあるエラーと読み方

#### エラー1：モジュールが見つからない

**ログ：**
```
Error: Cannot find module 'moment'
```

**意味：**
- `moment` というライブラリがインストールされていない

**解決方法：**
```bash
npm install moment
pm2 restart discord-bot
```

---

#### エラー2：環境変数が設定されていない

**ログ：**
```
[ERROR] GEMINI_API_KEY が設定されていません
```

**意味：**
- `.env` に `GEMINI_API_KEY` がない

**解決方法：**
```bash
# .env を確認
cat .env

# GEMINI_API_KEY を追加
nano .env
# GEMINI_API_KEY=あなたのAPIキー を追加

# 再起動
pm2 restart discord-bot
```

---

#### エラー3：構文エラー

**ログ：**
```
SyntaxError: Unexpected token ','
    at index.js:25:10
```

**意味：**
- `index.js` の25行目にカンマの書き間違いがある

**解決方法：**
1. ローカルPCで `index.js` の25行目を確認
2. 修正
3. コミット・プッシュ
4. デプロイ

---

#### エラー4：API制限

**ログ：**
```
[ERROR] Gemini API エラー: 429 Too Many Requests
```

**意味：**
- Gemini APIのリクエスト制限を超えた

**解決方法：**
- しばらく待つ
- または API制限を緩和する設定を追加

---

### 3-3. エラー調査の手順

**手順1：ログを見る**
```bash
pm2 logs discord-bot --err --lines 50
```

**手順2：エラーメッセージを特定**
- エラーメッセージの一番上を読む
- 何が起きているかを理解する

**手順3：スタックトレースから場所を特定**
- どのファイルの何行目でエラーが起きたか
- `index.js:25:10` → 25行目を見る

**手順4：原因を推測**
- 環境変数の問題？
- ライブラリの問題？
- コードの問題？

**手順5：修正・検証**
- 修正を加える
- 再起動して確認

---

## 第4章：適切なログを追加する（15分）

### 4-1. どこにログを追加すべきか

**追加すべき場所：**

1. **プログラムの開始時**
   ```javascript
   console.log('[INFO] Botを起動中...');
   ```

2. **重要な処理の前後**
   ```javascript
   console.log('[INFO] データベースに接続中...');
   const db = new Database(dbPath);
   console.log('[INFO] データベース接続完了');
   ```

3. **エラーが発生しそうな場所**
   ```javascript
   try {
     const result = await aiHelper.chat(message);
   } catch (error) {
     console.log('[ERROR] AI応答エラー:', error.message);
   }
   ```

4. **ユーザーアクション**
   ```javascript
   console.log(`[INFO] ユーザー ${interaction.user.tag} が /feeling を実行`);
   ```

---

### 4-2. ログを追加する実践

**ローカルPCで作業：**

**index.js の各コマンド実行時にログを追加：**

**現在のコード（例）：**

```javascript
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;

  if (commandName === 'feeling') {
    // 処理...
  }
});
```

**ログ追加後：**

```javascript
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

function log(level, message) {
  const levels = { debug: 0, info: 1, warn: 2, error: 3 };
  const currentLevel = levels[LOG_LEVEL] || 1;
  const messageLevel = levels[level] || 1;
  
  if (messageLevel >= currentLevel) {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} | [${level.toUpperCase()}] ${message}`);
  }
}

client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;
  
  log('info', `コマンド実行: ${commandName} by ${interaction.user.tag}`);

  if (commandName === 'feeling') {
    try {
      // 処理...
      log('debug', `気分記録: ユーザー${interaction.user.id}, 気分: ${feeling}`);
    } catch (error) {
      log('error', `気分記録エラー: ${error.message}`);
      await interaction.reply({
        content: 'エラーが発生しました。',
        ephemeral: true
      });
    }
  }
});
```

---

### 4-3. ログの良い例・悪い例

**❌ 悪い例：ログが多すぎる**

```javascript
console.log('関数開始');
console.log('変数aを定義');
console.log('変数bを定義');
console.log('a + b を計算');
console.log('結果を返す');
console.log('関数終了');
```

**問題点：**
- ログが多すぎて重要な情報が埋もれる
- パフォーマンスに影響

---

**✅ 良い例：必要最小限のログ**

```javascript
log('debug', `計算開始: a=${a}, b=${b}`);
const result = a + b;
log('debug', `計算完了: result=${result}`);
```

**メリット：**
- 必要な情報だけが残る
- 読みやすい

---

**❌ 悪い例：ログレベルが不適切**

```javascript
console.log('[ERROR] Bot起動しました');  // ← 起動はエラーじゃない
```

**✅ 良い例：適切なログレベル**

```javascript
log('info', 'Bot起動しました');
```

---

### 4-4. センシティブ情報をログに出さない

**❌ 危険な例：**

```javascript
console.log(`APIキー: ${process.env.GEMINI_API_KEY}`);
console.log(`ユーザーのメッセージ: ${message.content}`);
```

**問題点：**
- APIキーがログに残る → セキュリティリスク
- ユーザーの個人情報がログに残る → プライバシー問題

**✅ 安全な例：**

```javascript
log('debug', `APIリクエスト送信（キー: ${process.env.GEMINI_API_KEY.substring(0, 4)}****）`);
log('debug', `メッセージ受信（長さ: ${message.content.length}文字）`);
```

---

## 第5章：ログのメンテナンス（10分）

### 5-1. ログローテーション

**PM2のログローテーション設定：**

**サーバーで実行：**

```bash
# pm2-logrotateをインストール
pm2 install pm2-logrotate

# 設定を確認
pm2 conf pm2-logrotate
```

**推奨設定：**

```bash
# 1日1回ローテーション
pm2 set pm2-logrotate:rotateInterval '0 0 * * *'

# 10MBでローテーション
pm2 set pm2-logrotate:max_size 10M

# 7日分保存
pm2 set pm2-logrotate:retain 7

# 古いログを圧縮
pm2 set pm2-logrotate:compress true
```

---

### 5-2. 不要なログの削除

**開発時のデバッグログを削除：**

**ローカルPCで作業：**

```javascript
// ❌ 削除すべきログ
console.log('デバッグ：ここを通過');
console.log('変数の値:', someVariable);
console.log('=== テスト中 ===');

// ✅ 残すべきログ
log('info', 'Bot起動しました');
log('error', `エラー: ${error.message}`);
```

**削除の基準：**
- 開発時のデバッグ用 → 削除
- 本番で必要な情報 → 残す

---

### 5-3. ログ監視の自動化（応用）

**PM2のログ監視機能：**

```bash
# エラーが出たらメール送信（要設定）
pm2 set pm2-logrotate:workerInterval 30
```

**応用：Discordに通知**

```javascript
// エラー時にDiscordチャンネルに通知
process.on('uncaughtException', async (error) => {
  log('error', `致命的エラー: ${error.message}`);
  
  // 管理者用チャンネルに通知
  const channel = client.channels.cache.get('管理者チャンネルID');
  if (channel) {
    await channel.send(`🚨 Botでエラーが発生しました:\n\`\`\`${error.message}\`\`\``);
  }
  
  process.exit(1);
});
```

---

## ✅ この回のチェックリスト

- [ ] pm2 logs の基本コマンドを理解した
- [ ] エラーログの読み方を理解した
- [ ] スタックトレースから原因を特定できる
- [ ] 適切な場所にログを追加できる
- [ ] ログレベルの使い分けができる
- [ ] センシティブ情報をログに出さない

---

## 🎓 この回で学んだこと

**最重要ポイント：**
> **ログは「証拠」。エラーメッセージを恐れず、読んで理解する。**

**具体的に学んだこと：**
1. pm2 logs の使い方（リアルタイム・過去ログ・エラーログ）
2. エラーログの読み方（メッセージ・スタックトレース）
3. 適切なログの追加方法
4. ログレベルの使い分け
5. センシティブ情報の保護

---

## 📝 次回予告

**第15回：やらかした時に「直さない」生存戦略**

ログで原因が分かったとしても、**その場で修正するべきとは限りません。**

次回は：
- ロールバック（切り戻し）の判断
- 再起動だけで解決する場合
- 「直さない」という選択肢

を学びます。

---

## 📦 この回の完成版ソースコード

### index.js（ログ追加版）の抜粋

```javascript
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const Database = require('better-sqlite3');
const AIHelper = require('./ai-helper');
const SpamDetector = require('./spam-detector');
const ContentFilter = require('./content-filter');

// 環境変数からデータベースパスを取得
const dbPath = process.env.DATABASE_PATH || 'bot.db';
const db = new Database(dbPath);

// ログ関数
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

function log(level, message) {
  const levels = { debug: 0, info: 1, warn: 2, error: 3 };
  const currentLevel = levels[LOG_LEVEL] || 1;
  const messageLevel = levels[level] || 1;
  
  if (messageLevel >= currentLevel) {
    const timestamp = new Date().toISOString();
    console.log(`${timestamp} | [${level.toUpperCase()}] ${message}`);
  }
}

// 環境情報を表示
log('info', `環境: ${process.env.NODE_ENV || 'development'}`);
log('info', `データベース: ${dbPath}`);
log('info', `ログレベル: ${process.env.LOG_LEVEL || 'info'}`);

// データベース準備
log('debug', 'データベースの準備を開始');
db.exec(`
  CREATE TABLE IF NOT EXISTS feelings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    feeling TEXT NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
log('info', 'データベース準備完了');

// Discord Clientの作成
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ]
});

// AI Helper初期化
const aiHelper = new AIHelper();
log('debug', 'AI Helper初期化完了');

// Spam Detector初期化
const spamDetector = new SpamDetector(db);
log('debug', 'Spam Detector初期化完了');

// Content Filter初期化
const contentFilter = new ContentFilter();
log('debug', 'Content Filter初期化完了');

// Bot起動時の処理
client.once('ready', () => {
  log('info', `${client.user.tag} でログインしました！`);
});

// コマンド実行時の処理
client.on('interactionCreate', async (interaction) => {
  if (!interaction.isCommand()) return;

  const { commandName } = interaction;
  
  log('info', `コマンド実行: /${commandName} by ${interaction.user.tag}`);

  if (commandName === 'feeling') {
    try {
      const feeling = interaction.options.getString('気分');
      const note = interaction.options.getString('メモ') || '';

      log('debug', `気分記録: ユーザー${interaction.user.id}, 気分: ${feeling}`);

      const stmt = db.prepare(`
        INSERT INTO feelings (user_id, feeling, note)
        VALUES (?, ?, ?)
      `);
      stmt.run(interaction.user.id, feeling, note);

      await interaction.reply({
        content: `今日の気分「${feeling}」を記録しました！`,
        ephemeral: true
      });

      log('info', `気分記録成功: ${interaction.user.tag}`);
    } catch (error) {
      log('error', `気分記録エラー: ${error.message}`);
      await interaction.reply({
        content: 'エラーが発生しました。もう一度お試しください。',
        ephemeral: true
      });
    }
  }

  // 他のコマンドも同様にログを追加...
});

// エラーハンドリング
process.on('unhandledRejection', (error) => {
  log('error', `未処理のPromise拒否: ${error.message}`);
});

process.on('uncaughtException', (error) => {
  log('error', `致命的エラー: ${error.message}`);
  process.exit(1);
});

// Botログイン
client.login(process.env.DISCORD_TOKEN);
```

---

これで第14回は完了です！

次回（第15回）では、ロールバックの判断を学びます。
