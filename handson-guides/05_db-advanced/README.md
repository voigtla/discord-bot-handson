# 第5回：保存したデータを「読む」  
— /count で“事実だけ”を返す —

第5回では、第4回で保存した SQLite のデータを、**はじめて Bot の返事に使います**。

ただし、この回のルールはひとつです。

> **数字に意味をつけない（評価しない）**

- 多い・少ないと言わない
- すごい・えらいと言わない
- 次の行動を提案しない

**「件数」という事実だけ返せたら合格**です。

---

## 🎯 この回のゴール

この回のゴールは、次の1点です。

> **Discordで `/count` を実行すると、  
> 「自分の記録回数」が数字で返ってくる**

例（こういう感じならOK）：

```

これまでの記録回数は 3 回です。

````

---

## ✅ 先に全体の流れ（迷子防止）

今日はやることが5つあります。全部 VS Code でできます。

1. `/count` を追加する（コマンド登録が必要）
2. SQLite から「自分の件数」を数える（COUNT）
3. `index.js` を **Before/After で丸ごと差し替える**
4. `register.js` を **Before/After で丸ごと差し替える**
5. Discordで動作確認 → Gitで保存

---

## 前提条件

以下を満たしていることを前提に進めます。

- 第4回を完了している
- `/hello` が動き、（記録しました）と返る
- `data.db` が `git_practice` フォルダにある
- `.env` に以下が設定済み（内容は共有しない）
  - `DISCORD_TOKEN`
  - `CLIENT_ID`
  - `GUILD_ID`

---

## 今回やらないこと（重要）

この回では、以下は **意図的にやりません**。

- 他人の件数を見る
- 比較する（平均、ランキング等）
- 励ます／評価する（すごいね、えらい等）
- グラフ化
- AI / Gemini API
- 複雑な集計（週別、月別など）

**理由：**  
この回の目的は **「読む」ことの最小成功**だからです。  
読み出しができると、つい色々やりたくなりますが、今日は我慢します。

---

# 0️⃣ 重要な考え方：Botの返事は「事実」だけ

この回の `/count` は、こういう返事だけが正解です。

✅ OK：
- 「これまでの記録回数は 3 回です」

❌ NG：
- 「すごい！3回もやってる！」
- 「最近少ないですね」
- 「もっと頑張ろう」

理由：  
Botが“評価”を始めると、運用上の負荷が一気に上がるからです。  
（第8回でこの話をもっとはっきりやります）

---

# 1️⃣ まずはファイル構成を確認する

第5回の開始時点で、フォルダがこうなっていればOKです。

```text
git_practice/
├─ index.js
├─ register.js
├─ data.db
├─ .env
├─ .gitignore
├─ package.json
├─ package-lock.json
└─ node_modules/
````

✅ `index.js` と `register.js` があること
✅ `data.db` があること（第4回で作られたもの）

---

# 2️⃣ register.js を「/count 追加版」に差し替える

`register.js` は **Discordにコマンドを登録するだけ**のファイルです。

* `index.js`：Botを動かす（常に使う）
* `register.js`：コマンドを登録する（変更したら使う）

今回 `/count` を増やすので、**register.js を更新してから実行**します。

---

## 2-1. Before（第4回までの register.js：/hello だけ）

```js
/**
 * register.js
 *
 * Discord にスラッシュコマンドを登録するためのスクリプト
 *
 * 役割：
 * - /hello コマンドを Discord サーバーに登録する
 *
 * 注意：
 * - Botを起動するファイルではない
 * - コマンド定義を変更したときだけ実行すればOK
 */

require("dotenv").config();

const { REST, Routes, SlashCommandBuilder } = require("discord.js");

// ===== 1) 環境変数チェック =====
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

// ===== 2) 登録するコマンド定義 =====
const commands = [
  new SlashCommandBuilder().setName("hello").setDescription("挨拶する").toJSON(),
];

// ===== 3) Discord に登録 =====
const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log("🔄 スラッシュコマンド登録中...");

    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });

    console.log("✅ スラッシュコマンド登録完了");
  } catch (error) {
    console.error("❌ コマンド登録に失敗しました:", error);
  }
})();
```

---

## 2-2. After（第5回の register.js：/hello と /count）

**このブロックを、register.js に丸ごと貼り替えてください。**

```js
/**
 * register.js（第5回）
 *
 * 役割：
 * - /hello と /count を Discord サーバーに登録する
 *
 * 注意：
 * - Botを起動するファイルではない
 * - コマンド定義を変えたときだけ実行すればOK
 */

require("dotenv").config();

const { REST, Routes, SlashCommandBuilder } = require("discord.js");

// ===== 1) 環境変数チェック =====
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

// ===== 2) 登録するコマンド定義 =====
const commands = [
  new SlashCommandBuilder()
    .setName("hello")
    .setDescription("挨拶して、DBに記録します")
    .toJSON(),

  new SlashCommandBuilder()
    .setName("count")
    .setDescription("自分の記録回数を表示します（評価しません）")
    .toJSON(),
];

// ===== 3) Discord に登録 =====
const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log("🔄 スラッシュコマンド登録中...");

    await rest.put(Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID), {
      body: commands,
    });

    console.log("✅ スラッシュコマンド登録完了");
  } catch (error) {
    console.error("❌ コマンド登録に失敗しました:", error);
  }
})();
```

---

## 2-3. コマンド登録を実行する

### いま操作している画面：VS Code のターミナル

```bash
node register.js
```

✅ 成功の目印

* `✅ スラッシュコマンド登録完了` が出る

---

# 3️⃣ index.js を「/count 対応版」に差し替える

ここで Bot の中身（index.js）を更新します。

追加するのは1つだけ：

* `/count` を受け取ったら
* SQLite で **自分の件数を数えて**
* 事実として返す

---

## 3-1. Before（第4回の index.js：/hello 保存まで）

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
 *
 * .env に以下を設定：
 * - DISCORD_TOKEN=xxxxx
 * - CLIENT_ID=xxxxx
 * - GUILD_ID=xxxxx  (テストに使うDiscordサーバーID)
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

// テーブル（保存先）を作成：あればそのまま
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

  const userId = interaction.user.id;
  const now = new Date().toISOString();

  db.run(
    `INSERT INTO logs (user_id, created_at) VALUES (?, ?)`,
    [userId, now],
    async (err) => {
      if (err) {
        console.error("❌ DB保存エラー:", err);
        await interaction.reply({
          content:
            "DBへの保存に失敗しました（ターミナルのログを確認してください）",
          ephemeral: true,
        });
        return;
      }

      await interaction.reply(
        `こんにちは、${interaction.user}！（記録しました）`
      );
    }
  );
});

// ===== 7) 起動 =====
client.login(DISCORD_TOKEN);
```

---

## 3-2. After（第5回の index.js：/hello 保存 + /count 読み出し）

**このブロックを、index.js に丸ごと貼り替えてください。**

```js
/**
 * 第5回：保存したデータを「読む」
 *
 * ゴール：
 * - /hello → user_id と時刻を SQLite に1件保存
 * - /count → 自分の記録回数（件数）を事実として返す（評価しない）
 *
 * 前提：
 * - discord.js v14
 * - sqlite3
 * - dotenv
 *
 * .env に以下を設定：
 * - DISCORD_TOKEN=xxxxx
 * - CLIENT_ID=xxxxx
 * - GUILD_ID=xxxxx
 */

require("dotenv").config();

const path = require("path");
const sqlite3 = require("sqlite3").verbose();

const { Client, GatewayIntentBits } = require("discord.js");

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
const dbPath = path.join(__dirname, "data.db");
const db = new sqlite3.Database(dbPath);

db.serialize(() => {
  db.run(`
    CREATE TABLE IF NOT EXISTS logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id TEXT NOT NULL,
      created_at TEXT NOT NULL
    );
  `);
});

// ===== 3) Discord クライアント =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
  console.log("✅ Bot is ready（コマンド登録は register.js で行います）");
});

// ===== 4) /hello と /count を処理 =====
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // ---- /hello：保存して返信 ----
  if (interaction.commandName === "hello") {
    const userId = interaction.user.id;
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO logs (user_id, created_at) VALUES (?, ?)`,
      [userId, now],
      async (err) => {
        if (err) {
          console.error("❌ DB保存エラー:", err);
          await interaction.reply({
            content:
              "DBへの保存に失敗しました（ターミナルのログを確認してください）",
            ephemeral: true,
          });
          return;
        }

        await interaction.reply(`こんにちは、${interaction.user}！（記録しました）`);
      }
    );
    return;
  }

  // ---- /count：自分の件数だけ返す（評価しない） ----
  if (interaction.commandName === "count") {
    const userId = interaction.user.id;

    db.get(
      `SELECT COUNT(*) as cnt FROM logs WHERE user_id = ?`,
      [userId],
      async (err, row) => {
        if (err) {
          console.error("❌ DB取得エラー:", err);
          await interaction.reply({
            content:
              "件数の取得に失敗しました（ターミナルのログを確認してください）",
            ephemeral: true,
          });
          return;
        }

        const count = row?.cnt ?? 0;

        // 事実だけ返す（評価しない）
        await interaction.reply(`これまでの記録回数は ${count} 回です。`);
      }
    );
    return;
  }
});

// ===== 5) 起動 =====
client.login(DISCORD_TOKEN);
```

---

# 4️⃣ 動作確認（順番が大事）

## 4-1. まずコマンド登録（register.js）

### いま操作している画面：VS Code のターミナル

```bash
node register.js
```

✅ 成功の目印

* `✅ スラッシュコマンド登録完了`

---

## 4-2. 次に Bot 起動（index.js）

```bash
node index.js
```

✅ 成功の目印

* `✅ Logged in as ...`
* `✅ Bot is ready...`

---

## 4-3. Discordで `/count` を実行する

### いま開いている画面：Discord（テキストチャンネル）

1. `/count` と入力
2. 候補に `count` が出たら選ぶ
3. 実行

✅ 数字が返ればOK（0でもOK）

---

## 4-4. `/hello` → `/count` の順に試す

1. `/hello` を1回実行（保存される）
2. `/count` を実行（数字が増える）

✅ `/count` の数字が 1 増えていれば成功

---

# 🔥 よくあるつまずき（先回り）

## ① `/count` が候補に出ない

* `node register.js` を実行していない可能性
* 反映まで少し待ちが必要なこともある

✅ もう一度 `node register.js`
✅ Discordを一度閉じて開き直す

---

## ② `/count` が 0 のまま

* `/hello` をそのサーバーで実行していない
* `data.db` が別フォルダにできている（作業場所違い）

✅ 先に `/hello` を実行 → その後 `/count`
✅ VS Code で `git_practice` の中に `data.db` があるか確認

---

## ③ エラーが出た（DB取得エラーなど）

✅ エラーメッセージは貼ってOK
⚠️ `.env` の中身（トークン類）は貼らない

---

# 5️⃣ Git に保存する（必須）

### いま操作している画面：VS Code のターミナル

```bash
git add .
git commit -m "add count command without evaluation"
git push
```

---

## ✅ この回のチェックリスト

* [ ] `register.js` に `/count` を追加して登録できた
* [ ] Bot が起動できた
* [ ] Discordで `/count` が表示される
* [ ] `/count` が数字を返す（0でもOK）
* [ ] `/hello` のあとに `/count` をすると数字が増える
* [ ] 返事に評価（すごい等）が入っていない
* [ ] commit / push できた