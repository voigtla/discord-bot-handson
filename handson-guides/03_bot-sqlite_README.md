# 第3回：Discord Bot 初導入 + SQLite 基礎

メンタル系サーバーで使うチャットボットを、最小構成から始めます。

---

## 📌 この回の目標

- Discord Bot を実際にサーバーに導入する
- `/hello` コマンドで Bot が反応することを確認する
- SQLite でデータを1つだけ記録・読み出しできる

**💡 ポイント：**
- 複雑な機能は作りません
- 「Bot が動く」「データが残る」この2つだけを体験します

---

## 🎯 完成イメージ

```
ユーザー: /hello
Bot: こんにちは！今日も頑張りましょう 😊

ユーザー: /save おはよう
Bot: メッセージを記録しました

ユーザー: /read
Bot: 記録されたメッセージ: おはよう
```

**👉 たったこれだけですが、これが全ての基礎です**

---

## 📚 事前準備

### 必要なもの

- ✅ Node.js インストール済み
- ✅ Git インストール済み
- ✅ VS Code インストール済み
- ✅ Discord アカウント
- ✅ 第2回で作成した `git_practice` フォルダ

---

## 第1章：Discord Bot の準備（10分）

### 1-1. Discord Developer Portal でアプリを作成

1. [Discord Developer Portal](https://discord.com/developers/applications) にアクセス
2. **New Application** をクリック
3. 名前を入力（例: `mental-support-bot`）
4. **Create** をクリック

---

### 1-2. Bot を作成してトークンを取得

1. 左メニューの **Bot** をクリック
2. **Reset Token** をクリック
3. **Yes, do it!** で確認
4. 表示されたトークンを **コピーして保存**

**⚠️ 超重要：**
- このトークンは **絶対に他人に見せない**
- GitHub に **絶対にアップロードしない**
- 紛失したら再発行が必要

---

### 1-3. Bot に権限を設定

1. 左メニューの **OAuth2 → URL Generator**
2. **SCOPES** で `bot` と `applications.commands` にチェック
3. **BOT PERMISSIONS** で以下にチェック:
   - Send Messages
   - Read Message History
   - Use Slash Commands

4. 生成された URL をコピー

---

### 1-4. Bot をサーバーに招待

1. コピーした URL をブラウザで開く
2. サーバーを選択
3. **認証** をクリック

**✅ Bot がサーバーに参加すれば成功です**

---

## 第2章：プロジェクトのセットアップ（10分）

### 2-1. 作業フォルダに移動

```bash
cd git_practice
```

---

### 2-2. 必要なパッケージをインストール

```bash
npm install discord.js better-sqlite3
```

**インストールされるもの：**
- `discord.js` → Discord Bot を作るライブラリ
- `better-sqlite3` → データベース（SQLite）を使うライブラリ

---

### 2-3. .env ファイルにトークンを保存

```bash
echo DISCORD_TOKEN=あなたのトークン > .env
```

**⚠️ 注意：**
- `あなたのトークン` の部分を実際のトークンに置き換えてください
- `.env` ファイルは `.gitignore` に既に含まれているはずです

**確認方法：**
```bash
cat .gitignore
```

次の内容が含まれていればOK：
```
node_modules
.env
```

---

## 第3章：最初の Bot コード（15分）

### 3-1. index.js を作成

VS Code で `git_practice/index.js` を新規作成し、以下のコードを記述します：

```javascript
// .env ファイルから環境変数を読み込む
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

// Bot クライアントを作成
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// Bot が起動したときに実行される
client.once('ready', () => {
  console.log(`${client.user.tag} でログインしました！`);
});

// Discord にログイン
client.login(process.env.DISCORD_TOKEN);
```

**保存（Ctrl + S）してください**

---

### 3-2. Bot を起動してみる

```bash
node index.js
```

**成功すると次のように表示されます：**
```
YourBot#1234 でログインしました！
```

**✅ これで Bot がオンラインになりました！**

Discord サーバーを見ると、Bot がオンライン状態になっているはずです。

**停止方法：**
- ターミナルで `Ctrl + C`

---

## 第4章：/hello コマンドを実装（15分）

### 4-1. コマンド登録用スクリプトを作成

VS Code で `register-commands.js` を新規作成：

```javascript
require('dotenv').config();
const { REST, Routes } = require('discord.js');

const commands = [
  {
    name: 'hello',
    description: '挨拶します'
  }
];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('コマンドを登録中...');
    
    await rest.put(
      Routes.applicationCommands(process.env.CLIENT_ID),
      { body: commands }
    );
    
    console.log('コマンド登録完了！');
  } catch (error) {
    console.error(error);
  }
})();
```

---

### 4-2. CLIENT_ID を .env に追加

1. [Discord Developer Portal](https://discord.com/developers/applications) に戻る
2. 作成したアプリケーションをクリック
3. **General Information** → **APPLICATION ID** をコピー
4. `.env` ファイルに追加：

```bash
DISCORD_TOKEN=あなたのトークン
CLIENT_ID=あなたのアプリケーションID
```

---

### 4-3. コマンドを登録

```bash
node register-commands.js
```

**成功すると：**
```
コマンドを登録中...
コマンド登録完了！
```

---

### 4-4. index.js にコマンド処理を追加

`index.js` を次のように修正：

```javascript
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

client.once('ready', () => {
  console.log(`${client.user.tag} でログインしました！`);
});

// コマンドが実行されたときの処理
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'hello') {
    await interaction.reply('こんにちは！今日も頑張りましょう 😊');
  }
});

client.login(process.env.DISCORD_TOKEN);
```

---

### 4-5. Bot を再起動して確認

```bash
node index.js
```

Discord サーバーで `/hello` と入力してください。

**✅ Bot が返信すれば成功です！**

---

## 第5章：SQLite でデータを保存（20分）

### 5-1. データベースを初期化するコードを追加

`index.js` の先頭に以下を追加：

```javascript
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const Database = require('better-sqlite3');

// データベース接続
const db = new Database('bot.db');

// テーブルがなければ作成
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('データベース準備完了');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// 以下、既存のコード...
```

---

### 5-2. /save コマンドを追加

`register-commands.js` に `/save` コマンドを追加：

```javascript
const commands = [
  {
    name: 'hello',
    description: '挨拶します'
  },
  {
    name: 'save',
    description: 'メッセージを保存します',
    options: [
      {
        name: 'message',
        description: '保存するメッセージ',
        type: 3, // STRING型
        required: true
      }
    ]
  },
  {
    name: 'read',
    description: '最後に保存したメッセージを読み出します'
  }
];
```

**コマンドを再登録：**
```bash
node register-commands.js
```

---

### 5-3. index.js に保存・読み出し処理を追加

`client.on('interactionCreate', ...)` の部分を次のように修正：

```javascript
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'hello') {
    await interaction.reply('こんにちは！今日も頑張りましょう 😊');
  }

  if (interaction.commandName === 'save') {
    const message = interaction.options.getString('message');
    const userId = interaction.user.id;

    // データを保存
    const stmt = db.prepare('INSERT INTO messages (user_id, content) VALUES (?, ?)');
    stmt.run(userId, message);

    await interaction.reply('メッセージを記録しました 📝');
  }

  if (interaction.commandName === 'read') {
    const userId = interaction.user.id;

    // 最新のメッセージを取得
    const stmt = db.prepare('SELECT content FROM messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 1');
    const row = stmt.get(userId);

    if (row) {
      await interaction.reply(`記録されたメッセージ: ${row.content}`);
    } else {
      await interaction.reply('まだメッセージが記録されていません');
    }
  }
});
```

---

### 5-4. 動作確認

```bash
node index.js
```

Discord サーバーで試してください：

```
/save message:おはよう
→ Bot: メッセージを記録しました 📝

/read
→ Bot: 記録されたメッセージ: おはよう
```

**✅ データが保存・読み出しできれば成功です！**

---

## 第6章：Git で記録（5分）

### 6-1. .gitignore を確認

`bot.db` も Git に含めないようにします：

```bash
echo bot.db >> .gitignore
echo "*.db" >> .gitignore
```

---

### 6-2. コミット

```bash
git add .
git commit -m "第3回: Bot初導入+SQLite基礎"
git push
```

---

## ✅ この回のチェックリスト

- [ ] Discord Bot をサーバーに招待できた
- [ ] `/hello` コマンドで Bot が反応した
- [ ] `/save` でメッセージを保存できた
- [ ] `/read` で保存したメッセージを読み出せた
- [ ] `bot.db` ファイルが作成された
- [ ] Git にコミット・プッシュできた

---

## 🔍 今日覚えること

### Discord Bot の基本

- Bot は `index.js` で起動する
- `node index.js` で動かす
- `Ctrl + C` で停止する

### SQLite の基本

- `better-sqlite3` でデータベースを使う
- `INSERT` でデータを保存
- `SELECT` でデータを読み出し

### 環境変数

- `.env` ファイルに秘密情報を保存
- `.gitignore` で Git から除外

---

## ⚠️ よくあるトラブル

### Bot がオンラインにならない

**原因：** トークンが間違っている

**対処法：**
1. `.env` ファイルの `DISCORD_TOKEN` を確認
2. Developer Portal で新しいトークンを発行
3. `.env` を更新して再起動

---

### /hello が表示されない

**原因：** コマンドが登録されていない

**対処法：**
```bash
node register-commands.js
```

---

### データが保存されない

**原因：** データベースの初期化コードが実行されていない

**対処法：**
1. `index.js` の先頭に `db.exec(...)` があるか確認
2. Bot を再起動

---

## 📖 参考資料

- [discord.js 公式ドキュメント](https://discord.js.org/)
- [better-sqlite3 公式ドキュメント](https://github.com/WiseLibs/better-sqlite3)

---

## 次回予告

### 第4回：SQLite保存＋データを読む(/count)

今回は「1つだけ保存・読み出し」でしたが、次回は：
- 複数のデータを扱う
- カウント機能を実装
- データの集計を学ぶ

**👉 メンタル系 Bot らしい機能を作り始めます！**
