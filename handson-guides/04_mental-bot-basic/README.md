# 第4回：Botに「記憶」を持たせる（SQLite 超入門・段階追加）
— 第3回のBotに「保存」を1つだけ足す —

この回では、**第3回で動いたBotに、機能を1つだけ追加**します。

- 賢くしません
- 評価しません
- 便利にもしません

**「/hello を実行したら、1件だけ保存される」**  
それだけで合格です。

---

## 🎯 この回のゴール

この回のゴールは、次の1点です。

> **`/hello` を実行するたびに、  
> `data.db` に user_id と時刻が1件保存される**

- DBの中身を読めなくてもOK
- 画面が地味でもOK
- **増えていれば合格**

---

## ✅ 先に全体の流れ（迷子防止）

今日は VS Code だけで完結します。

1. SQLite 用ライブラリを入れる  
2. `/hello` したときに保存する「入れ物」を作る（data.db）  
3. 第3回の `index.js` を **保存あり版** に差し替える  
4. `/hello` を何回か実行し、保存が増えることを確認する  
5. Git に保存する（commit / push）

---

## 前提条件

- 第3回を完了している
- Bot が起動できる（`node index.js`）
- Discordで `/hello` が返事する
- `.env` に以下が設定済み（内容は共有しない）
  - `DISCORD_TOKEN`
  - `CLIENT_ID`
  - `GUILD_ID`

---

## 今回やらないこと（重要）

この回では、以下は **意図的に行いません**。

- 保存したデータを読み出す（COUNTなど）
- 複雑なDB設計（複数テーブル）
- エラー処理の作り込み
- AI / Gemini API
- 「役に立つ分析」や「励まし」

**理由：**  
まずは **「保存できる」ことだけ**を確実に成功させるためです。

---

# 1️⃣ SQLite とは何か（超かんたん）

SQLite は、

> **ファイル1個で動くデータベース**です。

- サーバー不要
- 設定不要
- `data.db` というファイルができるだけ

👉 このハンズオンでは「記録用メモ帳」くらいに思ってOKです。

---

# 2️⃣ SQLite 用ライブラリを入れる

## いま開いている画面：VS Code
下の **ターミナル** を開いて実行します。

### 2-1. sqlite3 をインストール

```bash
npm install sqlite3
````

✅ 成功の目印

* エラーが出なければOK（警告が出ても大体OK）
* `node_modules` が増える（見なくてOK）

---

# 3️⃣ 第3回の index.js を「保存あり版」に差し替える

ここからが本番です。
**第3回の index.js を丸ごと置き換えます。**

* ✅ Before：第3回（DBなし）版
* ✅ After：第4回（SQLite保存あり）版

---

## 3-1. Before（第3回の index.js：DBなし版）

**いまの index.js がこの形（または近い形）になっている前提です。**
もし違っていても大丈夫ですが、いったん「第3回の正」として置いておきます。

```js
import { Client, GatewayIntentBits, Events } from "discord.js";
import "dotenv/config";

const client = new Client({
    intents: [GatewayIntentBits.Guilds],
});

client.once(Events.ClientReady, () => {
    console.log("Bot is ready");
});

client.on(Events.InteractionCreate, async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    if (interaction.commandName === "hello") {
        await interaction.reply("こんにちは！");
    }
});

client.login(process.env.DISCORD_TOKEN);
```

---

## 3-2. After（第4回の index.js：SQLite 保存あり版）

**このブロックを、そのまま index.js に丸ごと貼り替えてください。**

```js
/**
 * 第4回：Botに「記憶」を持たせる（SQLite）
 *
 * ゴール：
 * - /hello を実行したら
 *   - user_id と時刻を SQLite に1件保存
 *   - 固定文で返信（メンション付き）
 *
 * 前提：
 * - discord.js v14
 * - sqlite3
 * - dotenv
 */

require("dotenv").config();

const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const {
  Client,
  GatewayIntentBits,
  REST,
  Routes,
  SlashCommandBuilder,
} = require("discord.js");

// ===== 1) 環境変数チェック（初学者が詰まるので最初に止める） =====
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ .env が不足しています。以下を設定してください：");
  console.error("- DISCORD_TOKEN");
  console.error("- CLIENT_ID");
  console.error("- GUILD_ID");
  process.exit(1);
}

// ===== 2) SQLite セットアップ（ファイル1個でOK） =====
// data.db は「保存先のファイル」。
// なければ自動で作られます。
const dbPath = path.join(__dirname, "data.db");
const db = new sqlite3.Database(dbPath);

// テーブル（保存先の表）を作る：なければ作成、あればそのまま
db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
});

// ===== 3) Discord クライアント（スラッシュコマンドだけならGuildsでOK） =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

// ===== 4) /hello コマンド定義 =====
const commands = [
  new SlashCommandBuilder()
    .setName("hello")
    .setDescription("挨拶して、DBに記録します")
    .toJSON(),
];

// ===== 5) コマンド登録（ギルド登録：反映が速くて事故りにくい） =====
async function registerCommands() {
  const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

  console.log("🔄 スラッシュコマンド登録中...");
  await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
    body: commands,
  });
  console.log("✅ スラッシュコマンド登録完了");
}

client.once("ready", async () => {
  console.log(`✅ Logged in as ${client.user.tag}`);

  try {
    await registerCommands();
  } catch (err) {
    console.error("❌ コマンド登録に失敗:", err);
    process.exit(1);
  }
});

// ===== 6) /hello 受信 → DB保存 → 返信 =====
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  if (interaction.commandName !== "hello") return;

  // ここで「誰が実行したか」を取る
  const userId = interaction.user.id;

  // ここで「いつ実行したか」を取る
  const now = new Date().toISOString();

  // DBに1件保存する
  db.run(
    `INSERT INTO logs (user_id, created_at) VALUES (?, ?)`,
    [userId, now],
    async (err) => {
      if (err) {
        console.error("❌ DB保存エラー:", err);
        await interaction.reply({
          content: "DBへの保存に失敗しました（ターミナルのログを確認してください）",
          ephemeral: true,
        });
        return;
      }

      // 保存できたら返信する（メンション付き）
      await interaction.reply(`こんにちは、${interaction.user}！（記録しました）`);
    }
  );
});

// ===== 7) 起動 =====
client.login(DISCORD_TOKEN);
```

---

# 4️⃣ 動作確認（/hello を3回やる）

## 4-1. Bot を起動する

### いま操作している画面：VS Code のターミナル

```bash
node index.js
```

✅ 成功の目印

* `✅ Logged in as ...` が出る
* `✅ スラッシュコマンド登録完了` が出る

---

## 4-2. Discordで /hello を3回実行する

### いま開いている画面：Discord（テキストチャンネル）

1. `/hello` を実行
2. もう一回 `/hello`
3. さらにもう一回 `/hello`

✅ 返信に `（記録しました）` が付いていればOK

---

# 5️⃣ `data.db` ができたか確認する

SQLite は **ファイルができれば勝ち**です。

### いま開いている画面：VS Code（エクスプローラー）

* `git_practice` の中に **`data.db`** ができているか確認

✅ あれば成功
👉 中身を開く必要はありません

---

# 🔥 よくあるつまずき（先回り）

## ① `data.db` が見つからない

* Bot を起動していない
* 起動したがすぐ止めた
* 実行したフォルダが違う

✅ まず `node index.js` を実行して、`/hello` を1回叩く

---

## ② `/hello` が反応しない

* Bot が落ちている
* 違うサーバーに向けて登録している（GUILD_ID違い）

✅ ターミナルにエラーが出ていないか見る
✅ `.env` の `GUILD_ID` が「今叩いているサーバー」か確認（貼らない）

---

## ③ `sqlite3` のインストールで止まる

* 環境によってはビルドが走り、時間がかかることがあります

✅ まずはエラーメッセージをそのまま貼ればOK（.env は貼らない）

---

# 6️⃣ Git に保存する（必須）

この回の変更を **必ず commit/push** します。

### いま操作している画面：VS Code のターミナル

```bash
git add .
git commit -m "save hello logs to sqlite"
git push
```

⚠️ 今回は `data.db` もコミットしてOKです
（次回以降で「コミットしない運用」に変えていきます）

---

## ✅ この回のチェックリスト

* [ ] `npm install sqlite3` ができた
* [ ] `index.js` を After 版に差し替えた
* [ ] Bot が起動できた
* [ ] `/hello` で「記録しました」が返る
* [ ] `data.db` が作成された
* [ ] commit / push できた