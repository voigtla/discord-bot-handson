# 第7回：エラーが起きても「変なことを言わない」  
— Botの壊れ方を先に決める —

第7回では、**新しい機能は増えません**。

代わりに、次のことをやります。

> **何かが失敗したとき、  
> Botがどう振る舞うかを先に決める**

これはとても地味ですが、  
**実際に運用できるかどうかを分ける重要な回**です。

---

## 🎯 この回のゴール

この回のゴールは、次の1点です。

> **エラーが起きても、  
> Botが必ず「安全な固定文」で終わる**

- エラー内容をユーザーに見せない
- 判断・助言・評価をしない
- Botが落ちない

---

## ✅ 先に全体の流れ（迷子防止）

今日は次の流れで進みます。

1. 「エラーが起きる場所」を知る  
2. 失敗したら使う **固定文** を決める  
3. 失敗処理を1か所にまとめる  
4. わざと失敗させて、正しい動きを確認する  

---

## 前提条件

以下を満たしていることを前提に進めます。

- 第6回を完了している
- `/hello` と `/count` が動作している
- AI（Gemini API）を使っても意味が変わらない状態
- `git_practice` フォルダを継続使用している

---

## 今回やらないこと（重要）

この回では、以下は **意図的にやりません**。

- エラー内容の詳細表示
- 原因の説明
- 自動再試行
- ログ通知
- ユーザーへの謝罪文の工夫

**理由：**  
メンタル系サーバーでは、  
**エラー説明そのものが負荷になる**ことがあるからです。

---

# 0️⃣ まず考え方を揃える（超重要）

Botの処理は、こう考えます。

```

うまくいく
↓
失敗する
↓
安全な一文を返す
↓
終了

````

- 取り繕わない
- 励まさない
- 説明しない

**「静かに終わる」** が正解です。

---

# 1️⃣ エラーが起きやすい場所を知る

いまの Bot で、失敗しやすいのは主に次の3か所です。

1. SQLite（保存・取得）
2. AI（Gemini API）
3. Discord への返信

👉 これらを **毎回 if / try-catch で書くと事故ります**。

---

# 2️⃣ フォールバック用の文章を決める

まず、**失敗したときに必ず使う文章**を決めます。

## 2-1. responses.js を新しく作る

### いま開いている画面：VS Code（エクスプローラー）

- `git_practice` を右クリック
- **新しいファイル**
- ファイル名：`responses.js`

---

## 2-2. responses.js（全文）

```js
/**
 * responses.js
 *
 * Botが「言っていいこと」だけを集めたファイル
 * エラー時の文章もここに置く
 */

module.exports = {
  fallback:
    "いまは処理できませんでした。時間をおいて、また試してください。",
};
````

ポイント：

* 理由を書かない
* 感情を煽らない
* 次の行動を指示しない

---

# 3️⃣ 失敗処理をまとめる（safeReply.js）

次に、**失敗したら必ずこの文章を返す**仕組みを作ります。

---

## 3-1. safeReply.js を作成する

### いま開いている画面：VS Code（エクスプローラー）

* 新しいファイル
* ファイル名：`safeReply.js`

---

## 3-2. safeReply.js（全文）

```js
/**
 * safeReply.js
 *
 * 役割：
 * - 中で何が失敗しても
 * - ユーザーには安全な固定文だけを返す
 */

const { fallback } = require("./responses.js");

module.exports = async function safeReply(interaction, handler) {
  try {
    const result = await handler();
    return result;
  } catch (err) {
    console.error("❌ エラー発生:", err);

    if (interaction.replied || interaction.deferred) return;

    await interaction.reply({
      content: fallback,
      ephemeral: true,
    });
  }
};
```

👉 これで
**「失敗時の振る舞い」は1か所に集まりました。**

---

# 4️⃣ index.js を安全版に差し替える

ここから **index.js を丸ごと差し替え**ます。

---

## 4-1. Before（第6回までの index.js）

※ 第6回で使っていた AI 整形あり版

---

## 4-2. After（第7回の index.js：安全版）

**このコードを index.js に丸ごと貼り替えてください。**

```js
require("dotenv").config();

const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { Client, GatewayIntentBits } = require("discord.js");

const { formatText } = require("./aiFormatter.js");
const safeReply = require("./safeReply.js");

// ===== SQLite =====
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

// ===== Discord =====
const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", () => {
  console.log(`✅ Logged in as ${client.user.tag}`);
});

// ===== /hello と /count（safeReply で包む） =====
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  // ---- /hello ----
  if (interaction.commandName === "hello") {
    await safeReply(interaction, async () => {
      const userId = interaction.user.id;
      const now = new Date().toISOString();

      await new Promise((resolve, reject) => {
        db.run(
          `INSERT INTO logs (user_id, created_at) VALUES (?, ?)`,
          [userId, now],
          (err) => {
            if (err) reject(err);
            else resolve();
          }
        );
      });

      const rawText = `こんにちは、${interaction.user}！（記録しました）`;
      const formatted = await formatText(rawText);

      await interaction.reply(formatted);
    });
    return;
  }

  // ---- /count ----
  if (interaction.commandName === "count") {
    await safeReply(interaction, async () => {
      const userId = interaction.user.id;

      const count = await new Promise((resolve, reject) => {
        db.get(
          `SELECT COUNT(*) as cnt FROM logs WHERE user_id = ?`,
          [userId],
          (err, row) => {
            if (err) reject(err);
            else resolve(row.cnt);
          }
        );
      });

      const rawText = `これまでの記録回数は ${count} 回です。`;
      const formatted = await formatText(rawText);

      await interaction.reply(formatted);
    });
  }
});

// ===== 起動 =====
client.login(process.env.DISCORD_TOKEN);
```

---

# 5️⃣ わざと失敗させて確認する（重要）

**成功だけ確認しても意味がありません。**

---

## 5-1. テスト手順

1. Bot を起動する
2. `/hello` を1回実行（成功）
3. `.env` の **AI用キーを一時的に消す**
4. Bot を再起動
5. `/hello` または `/count` を実行

---

## 5-2. 正しい挙動

* Bot は落ちない
* エラー内容は表示されない
* 固定文が返る

```
いまは処理できませんでした。時間をおいて、また試してください。
```

これが出れば **合格**です。

---

# 🔥 よくあるつまずき

## ① 何も返ってこない

* Botがすでに reply 済みの可能性
* 二重 reply になっている可能性

👉 safeReply があるか確認

---

## ② エラーが見えなくて不安

* エラーは **ターミナルにだけ出ます**
* ユーザーに見せない設計です

---

# 6️⃣ Git に保存する

```bash
git add .
git commit -m "add safe fallback for errors"
git push
```

---

## ✅ この回のチェックリスト

* [ ] responses.js を作成した
* [ ] safeReply.js を作成した
* [ ] index.js を安全版に差し替えた
* [ ] エラー時に固定文が返る
* [ ] エラー内容がユーザーに出ない
* [ ] Botが落ちない
* [ ] commit / push できた