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

## 🔧 1-3. Bot の Gateway Intents を有効化（重要）

> ⚠️ **この設定をしないと、コードが正しくても Bot は起動時にエラーになります**

1. Discord Developer Portal で、作成した **アプリ** を開く
2. 左メニューの **Bot** をクリック
3. 画面を下にスクロールして
   **Privileged Gateway Intents** を探す
4. 以下を **ON** にする：

   * ✅ **Message Content Intent**
5. 右下の **Save Changes** をクリック

📌 補足：

* この設定は **招待URL（OAuth2）とは別物**
* Bot が **Discordと接続する時点で許可されるかどうか**に関係する
* `GatewayIntentBits.MessageContent` を使うコードでは **必須**

---

### 1-4. Bot に権限を設定

1. 左メニューの **OAuth2 → URL Generator**
2. **SCOPES** で `bot` と `applications.commands` にチェック
3. **BOT PERMISSIONS** で以下にチェック:
   - Send Messages
   - Read Message History
   - Use Slash Commands

4. 生成された URL をコピー

---

## 1-5. Bot をサーバーに招待（変更なし）

1. 生成された URL をブラウザで開く
2. サーバーを選択
3. **認証** をクリック

**✅ Bot がサーバーに参加すれば成功です**

---

## なぜこの項目が必要か（短く理解用）

* **BOT PERMISSIONS**
  → サーバー内で「何ができるか」（送信・履歴・コマンド）
* **Privileged Gateway Intents**
  → Discordから「どんな情報を受け取っていいか」

---

## 第2章：プロジェクトのセットアップ（10分）

### 2-1. 作業フォルダに移動

```bash
cd git_practice
```

---

### 2-2. 必要なパッケージをインストール

```bash
npm install discord.js better-sqlite3 dotenv
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

## 4-1. コマンド登録用スクリプトを作成（重要）

> ⚠️ このファイルでは `commands` を **あとから「追加」する章があります**  
> そのため、この時点では **ひな形として作成**します。

1. VS Code で **`register-commands.js`** を新規作成します

2. 次のコードを **そのまま貼り付けて保存**してください  
   （※この `commands` は、次の章で **置き換えます**）

```js
require('dotenv').config();
const { REST, Routes } = require('discord.js');

// ※この配列は、次の章で内容を置き換えます
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
      await rest.put(
  Routes.applicationGuildCommands(
    process.env.CLIENT_ID,
    process.env.GUILD_ID
  ),
  { body: commands }
);
,
      { body: commands }
    );
    
    console.log('コマンド登録完了！');
  } catch (error) {
    console.error(error);
  }
})();
````

---

### 4-2. CLIENT_ID と GUILD_ID を .env に追加

#### 4-2-1. CLIENT_ID（Application ID）を取得して .env に追加

1. [Discord Developer Portal](https://discord.com/developers/applications) に戻る
2. 作成したアプリケーションをクリック
3. **General Information** → **APPLICATION ID** をコピー
4. `.env` ファイルに追加：

```bash
DISCORD_TOKEN=あなたのトークン
CLIENT_ID=あなたのアプリケーションID
```

---

#### 4-2-2. GUILD_ID（サーバーID）を取得して .env に追加（開発者モードが必要）

> ⚠️ サーバーID（GUILD_ID）をコピーするには、Discordの **開発者モード** をONにする必要があります。

##### A) Discordで開発者モードをONにする

**Discordアプリ（PC）で：**

1. Discordを開く
2. 左下の ⚙️（ユーザー設定）をクリック
3. 左メニューから **詳細設定（Advanced）** を開く
4. **開発者モード（Developer Mode）** を **ON** にする

##### B) サーバーID（GUILD_ID）をコピーする

1. `GUILD_ID` を設定したい **サーバー（ギルド）** を開く
2. サーバー名（左上）を **右クリック**
3. 表示されたメニューの一番下付近にある **「ID をコピー（Copy ID）」** をクリック

   * これが **GUILD_ID** です（数字だけの長いID）

##### C) `.env` に GUILD_ID を追記する

`.env` を次のようにします：

```bash
DISCORD_TOKEN=あなたのトークン
CLIENT_ID=あなたのアプリケーションID
GUILD_ID=あなたのサーバーID
```

---

✅ **ポイント**

* `CLIENT_ID` は Developer Portal の **APPLICATION ID**
* `GUILD_ID` は Discordアプリでコピーする **サーバーID**
* どちらも **数字だけ**（引用符や余計な空白なし）で入れるのが安全です


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
了解です。
**改善案①（置き換えを明示する版）**として、
そのまま教材に貼れる **該当部分だけの Markdown** を作ります。

---

## 5-1. データベースを初期化するコードを追加（重要）

> ⚠️ この章では **index.js の先頭部分を「追加」ではなく「置き換え」ます**  
> `Client` を作成するコードが **2回書かれないように注意してください。

### 手順

1. `index.js` を開く

2. すでに書かれている、次のようなコードを **探して削除** します

```js
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});
````

3. 代わりに、**ファイルの先頭に** 次のコードを貼り付けます

```js
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

// Discord クライアントを作成（※ここは1回だけ）
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});
```

4. このコードの **下に**、これまで書いてきた既存の処理
   （`ready` / `interactionCreate` / `client.login` など）を
   **そのまま残してください**

---

### ✅ ポイント

* `require('discord.js')` や `new Client(...)` は **1ファイルに1回だけ**
* 「貼り足す」のではなく **先頭部分を差し替える** 作業です

---

## 5-2. `/save` と `/read` コマンドを追加

> ⚠️ この章では **`commands` の配列を「追記」ではなく「置き換え」ます**
> `const commands = ...` が **2回書かれないように注意してください。

1. `register-commands.js` を開く

2. すでにある `const commands = [...]` を **すべて削除**します

3. 代わりに、次のコードを **同じ位置に貼り付けます**

```js
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

4. ファイルを保存します

---

### ✅ ポイント

* `const commands = [...]` は **1ファイルに1回だけ**
* 新しいコマンドは **「配列を差し替える」** 形で追加します

---

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

ここはデータベース（SQLite）の準備をする場所です。  
`index.js` の上のほうにある `const db = new Database(...)` と `db.exec(` が並んでいるあたりを探してください。  
テーブル作成や初期化のコードは、基本的にこの **DB準備のかたまりの中**に置きます。


今回は「1つだけ保存・読み出し」でしたが、次回は：
- 複数のデータを扱う
- カウント機能を実装
- データの集計を学ぶ

**👉 メンタル系 Bot らしい機能を作り始めます！**
---

## 📦 この回の完成版ソースコード

### ファイル構成
```
git_practice/
├── .gitignore
├── .env
├── .env.example
├── package.json
├── index.js
└── register-commands.js
```

---

### index.js
```javascript
// .env ファイルから環境変数を読み込む
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

// コマンドが実行されたときの処理
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

// Discord にログイン
client.login(process.env.DISCORD_TOKEN);
```

---

### register-commands.js
```javascript
require('dotenv').config();
const { REST, Routes } = require('discord.js');

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

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

(async () => {
  try {
    console.log('コマンドを登録中...');
    
    await rest.put(
      Routes.applicationGuildCommands(
        process.env.CLIENT_ID,
        process.env.GUILD_ID
      ),
      { body: commands }
    );
    
    console.log('コマンド登録完了！');
  } catch (error) {
    console.error(error);
  }
})();
```

---

### .env.example
```
DISCORD_TOKEN=あなたのトークン
CLIENT_ID=あなたのアプリケーションID
GUILD_ID=あなたのサーバーID
```

**注意：** 実際に使う `.env` ファイルは `.env.example` をコピーして作成し、実際の値を入れてください。

---

### .gitignore
```
node_modules
.env
bot.db
*.db
```

---

### package.json
```json
{
  "name": "git_practice",
  "version": "1.0.0",
  "description": "Discord Bot ハンズオン",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "discord.js": "^14.14.1",
    "better-sqlite3": "^9.2.2",
    "dotenv": "^16.3.1"
  }
}
```

**インストール方法：**
```bash
npm install
```

これで第3回は完成です！

