# 第3回：Bot導入＋SQLiteで「1つだけ覚える」

⭐ **実質スタート回**

---

## この回でやること

1. Discord Bot Portal でアプリを作成
2. Bot用のリポジトリを準備
3. `/hello` コマンドで返答するBotを作る
4. SQLite を導入
5. **「1回だけ」DBに保存する処理**

---

## やらないこと

- DB設計論
- 複雑なSQL
- 複数テーブル

---

## 👉 ゴール

**「Botが初めて"記憶"を持つ」**

---

## 所要時間

約60分

---

## 事前準備

### 必要なもの

- Node.js（インストール済み想定）
- VS Code
- GitHubアカウント
- 第2回で学んだGit/GitHubの基礎知識
- Discordアカウント

---

## パート1：Discord Application の作成（10分）

### 手順①：Developer Portal にアクセス

https://discord.com/developers/applications にアクセスします。

**New Application** をクリックします。

---

### 手順②：Bot名を入力

**NAME** に Bot の名前を入力します。

**例：** `yamichan-bot`

利用規約に同意して、**Create** をクリックします。

---

### 手順③：Client ID を取得

Application ページで、**Client ID** をコピーします。

**👉 メモ帳などに保存しておいてください**

---

### 手順④：Bot Token を取得

左メニューから **Bot** をクリックします。

**Reset Token** をクリックし、**Yes, do it!** を選択します。

**👉 Token が表示されるので、コピーしてメモ帳に保存してください**

**⚠️ 重要：Token は機密情報です。絶対に他人に見せないでください**

---

## パート2：GitHub リポジトリの作成（5分）

### 手順①：リポジトリを作成

https://github.com/ にアクセスします。

右上の **+** → **New repository** をクリックします。

---

### 手順②：設定

- **Repository name**: `yamichan-bot`（または任意の名前）
- **Description**: Discord Bot with SQLite
- **Private** を選択（推奨）
- **❌ Initialize this repository with a README はチェックしない**

**Create repository** をクリックします。

---

### 手順③：Quick setup 画面を確認

表示されたコマンドを **後で使うので、このページは閉じないでください**

---

## パート3：ローカルフォルダの作成（10分）

### 手順①：作業フォルダを作成

ターミナルで以下のコマンドを実行：

```bash
mkdir yamichan-bot
cd yamichan-bot
```

---

### 手順②：GitHubと紐づける

GitHub の Quick setup 画面に表示されていたコマンドを実行：

```bash
echo "# yamichan-bot" >> README.md
git init
git add README.md
git commit -m "first commit"
git branch -M main
git remote add origin https://github.com/あなたのユーザー名/yamichan-bot.git
git push -u origin main
```

**👉 GitHubとの認証画面が出たら、指示に従ってログインしてください**

---

### 手順③：VS Codeでフォルダを開く

VS Codeを起動して：
1. **File** → **Open Folder**
2. `yamichan-bot` フォルダを選択
3. **フォルダーの選択** をクリック

---

### 手順④：ターミナルを開く

VS Code内で **Ctrl + @** を押してターミナルを開きます。

---

## パート4：Node.jsプロジェクトの初期化（5分）

### 手順①：package.json を作成

ターミナルで以下のコマンドを実行：

```bash
npm init -y
```

**👉 `package.json` が作成されます**

---

### 手順②：必要なライブラリをインストール

```bash
npm install discord.js dotenv better-sqlite3
```

**インストールされるもの：**
- **discord.js** → Discord Bot を作るためのライブラリ
- **dotenv** → 環境変数（Token など）を管理
- **better-sqlite3** → SQLite を使うためのライブラリ

---

### 手順③：.gitignore を作成

ターミナルで以下のコマンドを実行：

```bash
echo node_modules > .gitignore
echo .env >> .gitignore
echo bot.db >> .gitignore
```

**👉 これで秘密情報やDBファイルをGitHubにアップロードしないようになります**

---

### 手順④：.env を作成

ターミナルで以下のコマンドを実行：

```bash
echo DISCORD_TOKEN= > .env
echo CLIENT_ID= >> .env
```

VS Codeで `.env` ファイルを開き、先ほど取得した値を入力：

```
DISCORD_TOKEN=あなたのBotトークン
CLIENT_ID=あなたのClientID
```

**保存（Ctrl + S）** してください。

---

## パート5：Bot本体を作成（15分）

### 手順①：index.js を作成

VS Codeで **File** → **New File** をクリックし、`index.js` として保存します。

---

### 手順②：コードを書く

以下のコードを `index.js` にコピー＆ペーストしてください：

```javascript
// 必要なライブラリを読み込む
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

// Botを作成
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Botが起動したときに1回だけ実行される
client.once('ready', () => {
  console.log(`${client.user.tag} がログインしました！`);
});

// メッセージが送られたときに実行される
client.on('messageCreate', (message) => {
  // Bot自身のメッセージは無視
  if (message.author.bot) return;

  // /hello と送られたら返事をする
  if (message.content === '/hello') {
    message.reply('こんにちは！');
  }
});

// Botを起動
client.login(process.env.DISCORD_TOKEN);
```

**保存（Ctrl + S）** してください。

---

### コード解説（読み飛ばしてもOK）

```javascript
// 必要なライブラリを読み込む
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
```
→ `.env` ファイルと `discord.js` を使えるようにしています

---

```javascript
// Botを作成
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});
```
→ Botを作成して、「どんな情報を受け取るか」を設定しています

---

```javascript
// Botが起動したときに1回だけ実行される
client.once('ready', () => {
  console.log(`${client.user.tag} がログインしました！`);
});
```
→ Botが正常に起動したことを確認するメッセージです

---

```javascript
// メッセージが送られたときに実行される
client.on('messageCreate', (message) => {
  // Bot自身のメッセージは無視
  if (message.author.bot) return;

  // /hello と送られたら返事をする
  if (message.content === '/hello') {
    message.reply('こんにちは！');
  }
});
```
→ メッセージが送られるたびに、内容をチェックして返事をしています

---

```javascript
// Botを起動
client.login(process.env.DISCORD_TOKEN);
```
→ `.env` に書いたTokenを使ってBotを起動します

---

## パート6：Botをサーバーに追加（5分）

### 手順①：URL Generator にアクセス

Developer Portal（ https://discord.com/developers/applications ）で、作成したアプリをクリックします。

左メニューから **OAuth2** → **URL Generator** を選択します。

---

### 手順②：権限を設定

**SCOPES** で以下にチェック：
- ☑ bot

**BOT PERMISSIONS** で以下にチェック：
- ☑ Send Messages
- ☑ Read Message History

---

### 手順③：URLをコピー

一番下の **GENERATED URL** をコピーします。

ブラウザの新しいタブで開きます。

---

### 手順④：サーバーを選択

プルダウンから **Botを追加したいサーバー** を選択します。

**認証** → **はい** をクリックします。

---

## パート7：Botを起動（5分）

### 手順①：Botを起動

VS Codeのターミナルで以下のコマンドを実行：

```bash
node index.js
```

**表示例：**
```
yamichan-bot#1234 がログインしました！
```

この表示が出れば **起動成功** です！

---

### 手順②：Discordで確認

Discord のサーバーを開いて、メッセージ欄に `/hello` と入力してEnterを押します。

Botが **「こんにちは！」** と返事をすれば **成功** です！🎉

---

## パート8：SQLite を導入（15分）

### 手順①：database.js を作成

VS Codeで **File** → **New File** をクリックし、`database.js` として保存します。

---

### 手順②：DBコードを書く

以下のコードを `database.js` にコピー＆ペーストしてください：

```javascript
// SQLiteライブラリを読み込む
const Database = require('better-sqlite3');

// データベースファイルを開く（なければ作成される）
const db = new Database('bot.db');

// テーブルを作成（初回のみ実行される）
db.exec(`
  CREATE TABLE IF NOT EXISTS greetings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    username TEXT NOT NULL,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// ユーザーの挨拶を保存する関数
function saveGreeting(userId, username) {
  const insert = db.prepare(`
    INSERT INTO greetings (user_id, username)
    VALUES (?, ?)
  `);
  insert.run(userId, username);
}

// ユーザーが何回挨拶したか取得する関数
function getGreetingCount(userId) {
  const select = db.prepare(`
    SELECT COUNT(*) as count
    FROM greetings
    WHERE user_id = ?
  `);
  const result = select.get(userId);
  return result.count;
}

// 他のファイルから使えるようにする
module.exports = {
  saveGreeting,
  getGreetingCount,
};
```

**保存（Ctrl + S）** してください。

---

### 手順③：index.js を修正

`index.js` の **一番上** に以下を追加：

```javascript
const { saveGreeting, getGreetingCount } = require('./database');
```

---

`/hello` の部分を以下のように **書き換え**：

```javascript
// /hello と送られたら返事をする
if (message.content === '/hello') {
  // ユーザー情報を取得
  const userId = message.author.id;
  const username = message.author.username;
  
  // DBに保存
  saveGreeting(userId, username);
  
  // 今まで何回挨拶したか取得
  const count = getGreetingCount(userId);
  
  // 返事をする
  message.reply(`こんにちは！これで${count}回目の挨拶です！`);
}
```

**保存（Ctrl + S）** してください。

---

### 最終的な index.js（全体）

```javascript
// 必要なライブラリを読み込む
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const { saveGreeting, getGreetingCount } = require('./database');

// Botを作成
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Botが起動したときに1回だけ実行される
client.once('ready', () => {
  console.log(`${client.user.tag} がログインしました！`);
});

// メッセージが送られたときに実行される
client.on('messageCreate', (message) => {
  // Bot自身のメッセージは無視
  if (message.author.bot) return;

  // /hello と送られたら返事をする
  if (message.content === '/hello') {
    // ユーザー情報を取得
    const userId = message.author.id;
    const username = message.author.username;
    
    // DBに保存
    saveGreeting(userId, username);
    
    // 今まで何回挨拶したか取得
    const count = getGreetingCount(userId);
    
    // 返事をする
    message.reply(`こんにちは！これで${count}回目の挨拶です！`);
  }
});

// Botを起動
client.login(process.env.DISCORD_TOKEN);
```

---

## パート9：動作確認（5分）

### 手順①：Botを再起動

ターミナルで **Ctrl + C** を押してBotを停止します。

もう一度起動：

```bash
node index.js
```

---

### 手順②：Discordで確認

Discord のサーバーで、何度か `/hello` と送ってみてください。

**表示例：**
```
こんにちは！これで1回目の挨拶です！
こんにちは！これで2回目の挨拶です！
こんにちは！これで3回目の挨拶です！
```

回数が増えていけば **成功** です！🎉

---

## パート10：GitHubに保存（5分）

### 手順①：変更をcommit

ターミナルで以下のコマンドを実行：

```bash
git add .
git commit -m "Add bot with SQLite"
git push
```

---

### 手順②：GitHubで確認

ブラウザで GitHub のリポジトリを開き、ファイルがアップロードされていることを確認してください。

**✅ `.env` と `bot.db` は `.gitignore` で除外されているので、アップロードされません**

---

## 何が起きたのか（まとめ）

### Before（DBなし）

```
ユーザー: /hello
Bot: こんにちは！
```

毎回同じ返事だけ。**何も覚えていない**。

---

### After（DBあり）

```
ユーザー: /hello
Bot: こんにちは！これで1回目の挨拶です！

ユーザー: /hello
Bot: こんにちは！これで2回目の挨拶です！
```

**Botが「記憶」を持つようになった！**

---

## トラブルシューティング

### Botが起動しない

**確認①：** `.env` にTokenとClient IDが正しく入力されているか

**確認②：** `npm install` が完了しているか

**確認③：** ターミナルのエラーメッセージを確認

---

### `/hello` に反応しない

**確認①：** Developer Portal で **Message Content Intent** が有効になっているか

**確認②：** Botがサーバーに追加されているか

---

### `bot.db` が作成されない

**確認①：** `better-sqlite3` がインストールされているか

**確認②：** `database.js` のコードが正しいか

---

## この回で覚えること

- Discord Botの基本構造
- `.env` で秘密情報を管理
- SQLiteでデータを保存
- **Botが「記憶」を持つことの意味**

---

## 次回予告

**第4回：メンタル系Botとしての最小実装**
- `/checkin` コマンドで気分を記録
- 保存した状態を返す
- 「安全なチャットボット」の設計

---

## 参考資料

- [discord.js公式ガイド](https://discordjs.guide/)
- [better-sqlite3公式ドキュメント](https://github.com/WiseLibs/better-sqlite3)

---

## お疲れさまでした！

Botが初めて「記憶」を持ちました 🎉

次回はメンタル系サーバーに特化した機能を作っていきます。
