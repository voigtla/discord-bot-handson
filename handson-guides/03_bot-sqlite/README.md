# 第3回：Discord Bot を起動する（超入門・画面つき手順）
— 「/hello に返事する」だけを最短で成功させる —

この回の目的は **理解ではありません**。  
Discord の画面で `/hello` を打ったら、Bot が返事をする。  
**それだけできれば合格**です。

- 分からない用語があってOK
- 途中でつまずいてOK
- **動いたら勝ち**です

---

## 🎯 この回のゴール

この回のゴールは、次の1点です。

> **Discord上で `/hello` を実行すると、Botが固定文を返す**

---

## ✅ 先に全体の流れ（迷子防止）

今日は、画面を3か所行ったり来たりします。

1. **Discord Developer Portal（ブラウザ）**  
   → Botの「身分証」を作る場所
2. **Discord（アプリ or ブラウザ）**  
   → Botを自分のサーバーに入れる場所
3. **VS Code（エディタ）**  
   → Botのプログラムを動かす場所

---

## 前提条件（ここまでできていればOK）

- VS Code が入っている
- Node.js が入っている（`node -v` が出る）
- `git_practice` フォルダを VS Code で開けている
- VS Code の下に **ターミナル**（黒い画面）を出せる

---

## 今回やらないこと（重要）

この回では、以下は **意図的にやりません**。

- SQLite（DB）
- AI / Gemini API
- 複数コマンド
- エラー処理の作り込み
- 「便利にする」工夫

**理由：**  
まずは **BotがDiscordに接続できる**ところだけを成功させるためです。

---

# 0️⃣ 事前に1つだけ確認（Discordの設定）

## Discordで「開発者モード」をONにする
このあと **サーバーID（GUILD ID）** をコピーするために必要です。

### いま開いている画面：Discord アプリ（またはブラウザ）
1. 左下の歯車 **ユーザー設定** を開く
2. **詳細設定** を開く
3. **開発者モード** を ON にする

✅ これで「IDをコピー」が出るようになります。

---

# 1️⃣ Botの“身分証”を作る（Developer Portal）

## 1-1. Developer Portal を開く

### いま開いている画面：ブラウザ
1. 次を開きます  
   https://discord.com/developers/applications
2. Discordにログインしていない場合はログインします

✅ **「Applications」一覧**が出ていればOKです。

---

## 1-2. アプリを新規作成する（= Botの入れ物）

### いま開いている画面：Developer Portal（Applications）
1. 右上の **New Application** をクリック
2. 名前を入力（例：`handson-bot`）
3. **Create** をクリック

✅ 画面が切り替わって、左にメニューが並んでいればOKです。

---

## 1-3. Application ID をメモする（あとで使う）

### いま開いている画面：Developer Portal（General Information）
1. 左メニューの **General Information** を開く（多くの場合、最初から開いています）
2. **Application ID** を探す
3. **Copy**（コピー）を押して、メモ帳などに貼っておく

📌 ここでコピーした Application ID は、後で `.env` に貼ります。  
📌 **コードに直接貼りません**（安全のため）。

---

## 1-4. Bot を作る

### いま開いている画面：Developer Portal
1. 左メニューの **Bot** をクリック
2. **Add Bot** をクリック
3. 確認が出たら **Yes, do it!**

✅ 「Bot」ページに、Botのアイコンや名前が出ていればOKです。

---

## 1-5. Bot Token を取得する（超重要）

### いま開いている画面：Developer Portal（Bot）
1. **Reset Token** をクリック
2. 表示されたトークンを **Copy** でコピー
3. どこかに一時的に貼っておく（あとで `.env` に入れます）

⚠️ トークンは「Botの鍵」です  
- 他人に見せない  
- チャットに貼らない  
- GitHubに絶対上げない  

---

# 2️⃣ Botを自分のサーバーに招待する（OAuth2）

ここは「Botをサーバーに入れる」手順です。

## 2-1. 招待URLを作る

### いま開いている画面：Developer Portal
1. 左メニュー **OAuth2** を開く
2. その下の **URL Generator** をクリック

---

### いま操作している場所：OAuth2 → URL Generator

#### Step A：Scopes を選ぶ
**Scopes** のところでチェックします。

- ✅ `bot`
- ✅ `applications.commands`

👉 `applications.commands` は **スラッシュコマンド**（/hello）に必要です。

---

#### Step B：Bot Permissions は今回は最小でOK
**Bot Permissions** は、今回は何も選ばなくて大丈夫です。  
（スラッシュコマンドの返信だけなら十分）

---

#### Step C：URLをコピー
ページ下の方に **Generated URL** が出ます。  
それを **Copy** して、ブラウザで開きます。

---

## 2-2. サーバーに追加する

### いま開いている画面：Discordの認証画面（ブラウザ）
1. 「追加するサーバー」を選ぶ
2. **認証** をクリック
3. 認証後、サーバーに Bot が参加していることを確認

✅ Discordのサーバーメンバー一覧に Bot がいればOKです。

---

# 3️⃣ サーバーID（GUILD ID）をコピーする

スラッシュコマンドを登録する先として **サーバーID** が必要です。

### いま開いている画面：Discord（アプリ）
1. サーバー名（左上）を右クリック
2. **IDをコピー** をクリック

📌 ここでコピーしたサーバーIDは、後で `.env` に貼ります。  
📌 **コードに直接貼りません**（安全のため）。

---

# 4️⃣ VS Code 側の準備（プロジェクト）

ここからは **VS Code** で作業します。

## 4-1. `git_practice` を開く

### いま開いている画面：VS Code
- 左のエクスプローラーに `git_practice` が表示されていればOK

---

## 4-2. ターミナルを開く

### いま開いている画面：VS Code
- メニュー：**表示 → ターミナル**
- もしくは `Ctrl + @`

---

## 4-3. 必要なライブラリを入れる

### いま操作している場所：VS Code のターミナル
```bash
npm install discord.js dotenv
````

✅ 成功の目印：

* `node_modules` フォルダができる
* エラーが出なければOK

---

# 5️⃣ 秘密情報は「コードではなく .env」に入れる（安全に扱う）

ここが今日の超重要ポイントです。

> **IDやトークンは、コードに書かない**
> **.env に入れて、コードはそれを読むだけにする**

---

## 5-1. `.env` を作る

### いま操作している場所：VS Code のターミナル

```bash
type nul > .env
```

（Windows用：空の `.env` ファイルを作ります）

---

## 5-2. `.env` を編集して「貼る場所」を作る

### いま開いている画面：VS Code（エディタ）

1. 左のエクスプローラーで `.env` をクリックして開く
2. 下の3行を **そのまま**書く（右側は空でOK）

```env
DISCORD_TOKEN=
CLIENT_ID=
GUILD_ID=
```

---

## 5-3. `.env` に値を貼る（この手順で迷子にならない）

### いまやることは「右側に貼る」だけです

* `DISCORD_TOKEN=` の右側に、Developer Portalでコピーした **Bot Token** を貼る
* `CLIENT_ID=` の右側に、Developer Portalでコピーした **Application ID** を貼る
* `GUILD_ID=` の右側に、Discordでコピーした **サーバーID** を貼る

⚠️ `.env` の中身は **共有しない**（チャットにも資料にも貼らない）

---

## 5-4. `.gitignore` を確認する（超重要）

### いま開いている画面：VS Code（エディタ）

`.gitignore` が無い場合は作ってOKです。

中身をこうします：

```gitignore
node_modules
.env
```

✅ これで `.env` は GitHub に上がりません。

---

# 6️⃣ Bot本体（index.js）を書く

## 6-1. `index.js` を作成

### いま開いている画面：VS Code（エクスプローラー）

* `git_practice` を右クリック → **新しいファイル**
* `index.js` を作る

---

## 6-2. `index.js` に貼るコード（最小構成）

※ 第3回は「動けば勝ち」なので、いちばん事故りにくい書き方（require）にします。

```js
require("dotenv").config();

const { Client, GatewayIntentBits } = require("discord.js");

const client = new Client({
  intents: [GatewayIntentBits.Guilds],
});

client.once("ready", () => {
  console.log("Bot is ready");
});

client.on("interactionCreate", async (interaction) => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === "hello") {
    await interaction.reply("こんにちは！");
  }
});

client.login(process.env.DISCORD_TOKEN);
```

---

# 7️⃣ `/hello` コマンドを登録する（register.js）

Botは起動するだけでは `/hello` が出ません。  
**Discordに「helloというコマンドがあります」と登録する**必要があります。

ここで重要なルールがあります。

- **ID や Token をコードに直接貼りません**
- **値は `.env` に入れて、コードはそれを読むだけ**にします

---

## 7-1. `register.js` を作る

### いま開いている画面：VS Code（エクスプローラー）

- `git_practice` を右クリック → 新しいファイル
- `register.js` を作る

---

## 7-2. `register.js` に貼るコード（全文）

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

const {
  REST,
  Routes,
  SlashCommandBuilder,
} = require("discord.js");

// ===== 1) 環境変数チェック =====
const DISCORD_TOKEN = process.env.DISCORD_TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;
const GUILD_ID = process.env.GUILD_ID;

if (!DISCORD_TOKEN || !CLIENT_ID || !GUILD_ID) {
  console.error("❌ 実行に必要な設定が不足しています。（.env を確認）");
  process.exit(1);
}

// ===== 2) 登録するコマンド定義 =====
const commands = [
  new SlashCommandBuilder()
    .setName("hello")
    .setDescription("挨拶する")
    .toJSON(),
];

// ===== 3) Discord に登録 =====
const rest = new REST({ version: "10" }).setToken(DISCORD_TOKEN);

(async () => {
  try {
    console.log("🔄 スラッシュコマンド登録中...");

    await rest.put(
      Routes.applicationGuildCommands(CLIENT_ID, GUILD_ID),
      { body: commands }
    );

    console.log("✅ スラッシュコマンド登録完了");
  } catch (error) {
    console.error("❌ コマンド登録に失敗しました（ターミナルのログを確認）");
  }
})();
````

---

## 7-3. コマンド登録を実行する

### いま操作している場所：VS Code のターミナル

```bash
node register.js
```

✅ 成功の目印：

* `✅ スラッシュコマンド登録完了` と表示される

---

## 7-4. よくあるつまずき（ここだけ見ればOK）

* `/hello` が候補に出ない
  → `node register.js` を実行し直す

* `❌ 実行に必要な設定が不足しています` が出る
  → `.env` の中身を「貼らずに」見直す（空欄がないか）

---

# 8️⃣ Botを起動する

## 8-1. 起動コマンド

### いま操作している場所：VS Code のターミナル

```bash
node index.js
```

✅ 成功の目印：

* `Bot is ready` が出る

---

# 9️⃣ Discordで `/hello` を試す

### いま開いている画面：Discord（サーバーのテキストチャンネル）

1. チャット欄で `/hello` と入力
2. 候補に `hello` が出たら選ぶ
3. 実行する

✅ `こんにちは！` と返ってくれば合格です。

---

# 🔥 つまずきポイント（超よくある・先回り）

## ① `/hello` が候補に出ない

* `node register.js` を実行していない可能性
* `.env` の `CLIENT_ID` / `GUILD_ID` が別のものになっている可能性

👉 まず `node register.js` をもう一回

---

## ② `Bot is ready` が出ない

* `.env` の `DISCORD_TOKEN` が間違っている可能性
* `.env` を保存していない可能性

👉 `.env` を開いて「右側に何か入っているか」だけ確認（貼らない）

---

## ③ Botがサーバーにいない

* 招待URLで入れていない
* 別サーバーに入れている

👉 サーバー右のメンバー一覧に Bot がいるか確認

---

# 10️⃣ Git に保存する（必須）

### いま操作している場所：VS Code のターミナル

```bash
git add .
git commit -m "add minimal discord bot with hello command"
git push
```

✅ 確認ポイント：

* GitHubに `.env` が上がっていない（絶対）

---

## ✅ この回のチェックリスト

* [ ] Developer Portal で Bot を作った
* [ ] Bot をサーバーに招待できた
* [ ] `.env` に値を貼った（共有してない）
* [ ] `node register.js` が成功した
* [ ] `node index.js` で `Bot is ready` が出た
* [ ] Discordで `/hello` が反応した
* [ ] commit / push できた