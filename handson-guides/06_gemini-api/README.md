# 第6回：AIを「文章整形専用」で使う  
— 意味を変えずに、整えるだけ —

第6回では、はじめて **AI（Gemini API）** を使います。

ただし、この回でやることは **とても限定的**です。

- 自由な文章生成はしません
- 判断・助言・評価はさせません
- ユーザー入力は AI に渡しません

> **すでに決まっている文章を、  
> 意味を変えずに少し整える**  
それだけをやります。

---

## 🎯 この回のゴール

この回のゴールは、次の1点です。

> **Botの返答文を AI に通しても、  
> 意味・内容・立場が一切変わらない**

- 返す情報は同じ
- 言っていることも同じ
- ただ少し「読みやすくなる」だけ

---

## ✅ 先に全体の流れ（迷子防止）

今回は、画面を次の3か所で使います。

1. **ブラウザ**  
   → Google アカウントで Gemini API を有効化する
2. **VS Code**  
   → 新しいファイルを1つ追加する
3. **Discord**  
   → Botの返事が変わらないことを確認する

---

## 前提条件（重要）

### ソフト・環境
- 第5回を完了している
- `/hello` と `/count` が動作している
- `git_practice` フォルダを継続使用している
- VS Code でターミナルを開ける

### アカウント・外部サービス
- **Google アカウント** を持っている  
  （個人用でOK / 会社用でなくてOK）
- Webブラウザで Google にログインできる

⚠️ クレジットカード登録は **不要**です  
⚠️ 有料契約は **不要**です

---

## 今回やらないこと（最重要）

この回では、以下は **絶対に行いません**。

- ユーザー入力を AI に渡す
- 自由に文章を作らせる
- 判断・助言・評価をさせる
- 感情分析・分類
- 危険ワード検知

**理由：**  
初学者段階で AI に主導権を渡すと、  
「何が起きているか分からない」状態になるからです。

---

# 1️⃣ Gemini API とは何か（超かんたん）

Gemini API は、

> **文章を作ったり、整えたりできる AI を  
> プログラムから使うための入口**

です。

今回はその中でも、

- ❌ 作る  
- ❌ 考える  
- ❌ 判断する  

は使いません。

✅ **整える** だけ使います。

---

# 2️⃣ Gemini API を使える状態にする（ブラウザ）

## 2-1. AI Studio を開く

### いま開いている画面：ブラウザ
1. 次のページを開きます  
   https://aistudio.google.com/
2. Google アカウントでログインします

---

## 2-2. APIキーを作成する

### いま開いている画面：AI Studio

1. 画面右上またはメニューから **API keys** を探す
2. **Create API key** をクリック
3. 表示されたキーを **Copy** でコピーする

⚠️ このキーは **秘密情報** です。

* チャットに貼らない
* README に書かない
* GitHub に上げない

👉 **このあと `.env` にだけ入れます。**

---

### 2-3. `.env` に APIキーを書く（具体例つき）

ここでは **書き方の形だけ**を確認します。
実際のキーは **`xxxxx` の部分に自分のものが入る**イメージです。

---

#### いま開いている画面：VS Code（エクスプローラー）

* プロジェクト直下の `.env` を開く
  （第3回で作成済み）

---

#### `.env` の中身（例・マスク済み）

```env
DISCORD_TOKEN=xxxxx
CLIENT_ID=xxxxx
GUILD_ID=xxxxx
GEMINI_API_KEY=xxxxx
```

ポイント：

* `=` の **右側にだけ** APIキーを貼る
* 余計なスペースは入れない
* `" "`（ダブルクォート）は **付けない**
* 改行して1行ずつ書く

---

#### よくある間違い（やらない）

```env
GEMINI_API_KEY: xxxxx   ← コロンは使わない
GEMINI_API_KEY="xxxxx" ← クォート不要
```

---

#### 保存したらやること

* `.env` を **保存**
* 中身を **どこにも貼らない**
* そのまま次の手順に進む

---

# 3️⃣ AI専用ファイルを1つ追加する

ここからは **VS Code** に戻ります。

---

## 3-1. ファイル構成（第6回）

第6回では、ファイルが1つ増えます。

```text
git_practice/
├─ index.js
├─ register.js
├─ aiFormatter.js   ← ★ 新しく追加
├─ data.db
├─ .env
├─ .gitignore
├─ package.json
└─ node_modules/
````

---

## 3-2. Gemini 用ライブラリを入れる

### いま操作している画面：VS Code のターミナル

```bash
npm install @google/generative-ai
```

---

## 3-3. `aiFormatter.js` を作成する

### いま開いている画面：VS Code（エクスプローラー）

* `git_practice` を右クリック
* **新しいファイル**
* ファイル名：`aiFormatter.js`

---

## 3-4. `aiFormatter.js`（全文）

**このコードをそのまま貼ってください。**

```js
/**
 * aiFormatter.js
 *
 * 役割：
 * - すでに決まっている文章を AI に渡す
 * - 意味を変えずに、読みやすく整えた文章を返す
 *
 * 重要：
 * - ユーザー入力は渡さない
 * - 判断・評価・助言をさせない
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
  model: "gemini-pro",
});

export async function formatText(text) {
  const prompt = `
次の文章を、意味を変えずに、丁寧で読みやすい日本語に整えてください。
内容を足したり、評価したり、助言したりしないでください。

文章：
${text}
`;

  const result = await model.generateContent(prompt);
  const response = result.response;
  return response.text();
}
```

---

# 4️⃣ index.js を AI対応版に差し替える

ここでは **文章を返している部分だけ** を AI に通します。

---

## 4-1. Before（第5回の index.js）

※ 省略せず、**丸ごと差し替え**が前提です。
（第5回の After をそのまま使っている状態）

---

## 4-2. After（第6回の index.js：AI整形あり）

**このコードを index.js に丸ごと貼り替えてください。**

```js
/**
 * 第6回：AIを文章整形専用で使う
 *
 * ゴール：
 * - Botの返答文を AI に通しても意味が変わらない
 */

require("dotenv").config();

const path = require("path");
const sqlite3 = require("sqlite3").verbose();
const { Client, GatewayIntentBits } = require("discord.js");
const { formatText } = require("./aiFormatter.js");

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

// ===== /hello と /count =====
client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "hello") {
    const userId = interaction.user.id;
    const now = new Date().toISOString();

    db.run(
      `INSERT INTO logs (user_id, created_at) VALUES (?, ?)`,
      [userId, now],
      async (err) => {
        if (err) {
          await interaction.reply({
            content: "処理に失敗しました。",
            ephemeral: true,
          });
          return;
        }

        const rawText = `こんにちは、${interaction.user}！（記録しました）`;
        const formatted = await formatText(rawText);

        await interaction.reply(formatted);
      }
    );
    return;
  }

  if (interaction.commandName === "count") {
    const userId = interaction.user.id;

    db.get(
      `SELECT COUNT(*) as cnt FROM logs WHERE user_id = ?`,
      [userId],
      async (err, row) => {
        if (err) {
          await interaction.reply({
            content: "処理に失敗しました。",
            ephemeral: true,
          });
          return;
        }

        const rawText = `これまでの記録回数は ${row.cnt} 回です。`;
        const formatted = await formatText(rawText);

        await interaction.reply(formatted);
      }
    );
  }
});

// ===== 起動 =====
client.login(process.env.DISCORD_TOKEN);
```

---

# 5️⃣ 動作確認

## 5-1. Bot を起動

```bash
node index.js
```

---

## 5-2. Discordで確認

* `/hello` を実行
* `/count` を実行

✅ 情報は同じ
✅ 言い回しだけ少し整っている
❌ 意味が増えていない

---

# 🔥 よくあるつまずき

## ① AIがエラーになる

* APIキーが設定されていない可能性
* コピーミスの可能性

👉 `.env` の中身は貼らず、
👉 エラーメッセージだけ確認

---

## ② 返事が遅い

* AI呼び出しが入るため、少し遅くなります
* 数秒待ってOK

---

# 6️⃣ Git に保存する

```bash
git add .
git commit -m "use gemini api only for text formatting"
git push
```

---

## ✅ この回のチェックリスト

* [ ] Google アカウントで Gemini API を有効化した
* [ ] APIキーを取得した（共有していない）
* [ ] `aiFormatter.js` を追加した
* [ ] Bot が起動する
* [ ] `/hello` と `/count` が動く
* [ ] AIを使っても意味が変わっていない
* [ ] commit / push できた