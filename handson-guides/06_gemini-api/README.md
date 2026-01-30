いいところに気づいたね。
**第6回は「コード」よりも「前提で詰まらせない」方が圧倒的に重要**だから、
Google アカウント／管理画面遷移は **README にちゃんと書くべき**。

じゃあいくね。
以下は **第6回 README の全文・完成版**。
このまま `handson-guides/06_gemini-api/README.md` に置ける内容になってる。

---

````md
# 第6回：Gemini API を使う  
— ただし自由生成しない —

第6回では、はじめて LLM（Gemini API）を扱います。

ただし、この回では  
**自由な文章生成は行いません。**

Gemini API は、
**すでに決まっている文章を「整える」ための補助ツール**
としてのみ使用します。

---

## 🎯 この回のゴール

この回のゴールは、次の1点です。

> **Gemini API を安全に組み込み、  
> Bot の返答文を「整形専用」として利用できること**

具体的には：

- Gemini API を呼び出せる
- ユーザー入力を API に渡していない
- 新しい文章を生成していない
- 判断・助言・評価を行っていない

---

## 📘 事前準備（重要）

### 1️⃣ Google アカウントが必要です

Gemini API を利用するには  
**Google アカウントが必須**です。

- 個人の Google アカウントで問題ありません
- 会社アカウントである必要はありません

👉 この回の前に、  
**Google アカウントでログインできる状態**にしておいてください。

---

### 2️⃣ Gemini API の有効化（手順）

以下の手順で、Gemini API を有効化します。

#### 手順①  
ブラウザで次のページを開きます。

https://aistudio.google.com/

#### 手順②  
Google アカウントでログインします。

#### 手順③  
画面右上またはメニューから  
**「Get API key」** または **「API keys」** を選択します。

#### 手順④  
「Create API key」を押して、APIキーを発行します。

#### 手順⑤  
表示された APIキーを **コピーして保存**します。

⚠️ このキーは他人に共有しないでください。

---

### 3️⃣ APIキーを .env に設定

`.env` ファイルに、次の行を追加します。

```env
GEMINI_API_KEY=ここにコピーしたAPIキー
````

---

## 前提条件

以下を満たしていることを前提に進めます。

* 第5回を完了している
* `/hello` と `/count` が動作している
* Bot の返答文が `responses.js` に集約されている
* `git_practice` フォルダを継続使用している

---

## 今回やらないこと（最重要）

この回では、以下は **絶対に行いません**。

* ユーザー入力を Gemini API に渡す
* 自由な文章生成をさせる
* 判断・評価・助言を生成させる
* 感情分析・分類を行う
* 危険ワードの検知や解釈

**理由：**
LLM は便利ですが、
自由に使うと意図しない出力が起きやすいためです。

---

## 1️⃣ 第6回での AI の役割

Gemini API の役割は、次の1つだけです。

> **決められた文章を、意味を変えずに整える**

例：

* 文末を自然にする
* 表記ゆれをなくす
* 文章を少し読みやすくする

👉 意味を足さない
👉 判断しない
👉 励まさない

---

## 2️⃣ source 構成（第6回）

```
source/
├─ index.js          # 既存ファイル（一部修正）
├─ db.js             # 第5回から変更なし
├─ responses.js      # 第5回から変更なし
└─ aiFormatter.js    # ★ 第6回で新規追加
```

---

## 3️⃣ aiFormatter.js の役割

`aiFormatter.js` は、
**Gemini API を使った「文章整形専用」モジュール**です。

* 入力：Bot が決めた文章のみ
* 出力：意味を変えずに整えた文章
* ユーザー入力は渡さない

👉 AI に主導権を渡しません。

---

## 4️⃣ index.js の変更箇所（重要）

### 変更するのはここだけ

`interaction.reply()` が複数ありますが、
**変更するのは次の2か所だけです。**

* `/hello` の正常系
* `/count` の正常系

エラー時の `interaction.reply` は変更しません。

---

### 変更前（第5回）

```js
await interaction.reply(responses.hello_ok);
```

```js
await interaction.reply(responses.count_result(count));
```

---

### 変更後（第6回）

```js
const rawText = responses.hello_ok;
const formattedText = await formatText(rawText);
await interaction.reply(formattedText);
```

```js
const rawText = responses.count_result(count);
const formattedText = await formatText(rawText);
await interaction.reply(formattedText);
```

---

## 5️⃣ 実行手順

Gemini API のクライアントライブラリを追加します。

```bash
npm install @google/generative-ai
node index.js
```

---

## 6️⃣ Gitでの保存

この回の変更も、必ず Git に保存します。

```bash
git add .
git commit -m "use gemini api only for text formatting"
git push
```

---

## ✅ チェックリスト

* [ ] Google アカウントで APIキーを取得できた
* [ ] `.env` に APIキーを設定した
* [ ] Gemini API が呼び出されている
* [ ] ユーザー入力を渡していない
* [ ] 新しい文章を生成していない
* [ ] Bot の返答の意味が変わっていない

---

## 🚧 よくある詰まりポイント

### APIキーが取得できない

→ Google アカウントにログインできているか確認
→ aistudio.google.com から再度アクセス

---

### Gemini API を使っている意味が分からない

→ **安全に組み込めた時点で、この回は成功**
→ 実務ではこの使い方が一番多い

---

### 自由生成したくなる

→ 第6回では禁止
→ やるなら第7回以降で慎重に設計します

---

## 次回予告（第7回）

第7回では、
**エラーや例外が起きたときの扱い**を扱います。

* Gemini API が落ちたとき
* DB が壊れたとき
* 想定外が起きたとき

Bot を「止めない」ための回です。
