# 第4回：SQLite 保存 + データを読む（/count）【親切版・コピペ事故防止】

---

## この回が難しく見える理由（最初に1分で理解）

この回は「SQLが難しい」のではなく、主に次の3つが原因でつまずきやすいです。

1. **どこに貼るか（貼り付け範囲）が曖昧**で、二重定義や二重返信が起きやすい  
2. `/count` は処理が増えるため、**Discordの3秒制限**に引っかかりやすい  
3. `feelings` テーブル・`getTimeDiff` など、**前提パーツの不足**があると一気に落ちる

この親切版では、各章の冒頭に「ここだけ見ればOK」という *作業地図* を追加しています。

---

## 作業の基本ルール（このファイルの読み方）

- 「**追加**」と書いてある → 既存コードは残したまま、指定位置に貼る  
- 「**置き換え**」と書いてある → 同じブロックを探して、**そのブロック全体を入れ替える**  
  - ただし今回の運用方針上、可能な限り「置き換え」ではなく「差分追加」で案内します  
- 実行するたびに **必ず bot を再起動**（PowerShellで `Ctrl + C` → `node index.js`）

---

## 30秒でできる“事故防止”チェック（毎章共通）

- ✅ `register-commands.js` は **最後に一回だけ** `node register-commands.js`  
- ✅ `.env` は `DISCORD_TOKEN / CLIENT_ID / GUILD_ID` が揃っている  
- ✅ Discordでコマンドが見えないときは「反映待ち」ではなく **登録先（guild）を疑う**  
- ✅ 「アプリケーションが応答しませんでした」＝ **3秒以内に返信できていない or 例外**  
  - まず PowerShell のログを見る（例外が出ていれば原因がそこに出ます）

---
# 第4回：SQLite 保存 + データを読む（/count）

前回は「1つだけ保存・読み出し」でした。  
今回は **複数のデータを扱い、集計する** ことを学びます。

---

## 📌 この回の目標

- メンタル系 Bot らしい機能を実装する
- ユーザーごとのデータを複数保存できるようにする
- データを集計して表示する（カウント機能）

**💡 ポイント：**
- 「何回記録したか」を数えられるようになる
- 日付ごとの記録を管理できるようになる

---

## 🎯 完成イメージ

```
ユーザー: /feeling good
Bot: 今日の気分を記録しました 😊 (累計: 5回目)

ユーザー: /count
Bot: 
あなたの記録
📊 総記録数: 5回
📅 今日の記録: 2回
最終記録: good (2分前)
```

**👉 実用的な機能が見えてきました**

---

## 📚 事前準備

### 必要なもの

- ✅ 第3回で作成したプロジェクト
- ✅ Bot が起動できる状態
- ✅ SQLite が使える状態

### 確認

```bash
cd git_practice
node index.js
```

Bot がオンラインになれば準備OKです。  
`Ctrl + C` で一旦停止してください。

---


> 🧭 **この章のゴール**  
> `feelings` テーブルを追加して、気分データを保存できる土台を作ります。  
>  
> ✅ ここでよくある事故  
> - `messages` テーブルを消してしまう（消さない）  
> - `feelings` を作り忘れて `/feeling` や `/count` が動かない
## 第1章：データベース設計の見直し（10分）

### 1-1. 現在のテーブル構造

前回作成した `messages` テーブル：

```sql
CREATE TABLE messages (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
```

**問題点：**
- 「気分」を記録するには情報が足りない
- 集計しにくい

---


> ✅ **貼り付け位置の指定（重要）**  
> `index.js` の `const db = new Database('bot.db');` 付近を探します。  
> その直後にある `db.exec(` の塊が「テーブル作成」です。  
> **messages の塊は残したまま**、その“すぐ下”に feelings の塊を**追加**します。

### 1-2. 新しいテーブルを追加

`index.js` のデータベース初期化部分を次のように修正：

```javascript
const db = new Database('bot.db');

// 既存のテーブルはそのまま
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 気分記録用の新しいテーブル
db.exec(`
  CREATE TABLE IF NOT EXISTS feelings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    feeling TEXT NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

console.log('データベース準備完了');
```

**新しいテーブルの設計：**
- `feeling` → 気分（good, okay, bad など）
- `note` → メモ（任意）
- `created_at` → 記録日時

---


> 🧭 **この章のゴール**  
> Discord側に `/feeling` を“登録”し、Bot側に“処理”を追加します。  
>  
> ✅ ここでよくある事故  
> - `commands` 配列を“追記”して2回定義してしまう  
> - `/feeling` の処理を貼ったのに bot を再起動していない
## 第2章：/feeling コマンドの実装（15分）


> ✅ **ここは“置き換え”が安全**  
> `register-commands.js` に `const commands = [` がすでにある場合は、  
> その配列の中身をこの章の配列に“合わせる”必要があります。  
> **同じファイルに `const commands =` を2回書くとエラー**になります。

### 2-1. コマンドを登録

`register-commands.js` に `/feeling` コマンドを追加：

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
        type: 3,
        required: true
      }
    ]
  },
  {
    name: 'read',
    description: '最後に保存したメッセージを読み出します'
  },
  {
    name: 'feeling',
    description: '今の気分を記録します',
    options: [
      {
        name: 'mood',
        description: '気分を選んでください',
        type: 3,
        required: true,
        choices: [
          { name: '😊 とても良い (great)', value: 'great' },
          { name: '🙂 良い (good)', value: 'good' },
          { name: '😐 普通 (okay)', value: 'okay' },
          { name: '😔 少し辛い (down)', value: 'down' },
          { name: '😢 辛い (bad)', value: 'bad' }
        ]
      },
      {
        name: 'note',
        description: 'メモ（任意）',
        type: 3,
        required: false
      }
    ]
  },
  {
    name: 'count',
    description: '記録の統計を表示します'
  }
];
```


> ✅ **再登録のタイミング**  
> `register-commands.js` を編集したら、その直後に1回だけ実行します。  
> 実行できたら Discord で `/` を打って候補に `/feeling` が出るか確認します。

**コマンドを再登録：**
```bash
node register-commands.js
```

---


> ✅ **貼り付け位置の指定（重要）**  
> `index.js` の `client.on('interactionCreate', async interaction => {` の中に貼ります。  
> すでに `hello / save / read` があるなら、その **同じ深さ** に `feeling` の if を追加します。  
>  
> ✅ **この章の成功条件**：Discordで `/feeling` を実行すると、Botが返信すること。

### 2-2. /feeling の処理を追加

`index.js` の `client.on('interactionCreate', ...)` に追加：

```javascript
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  if (interaction.commandName === 'hello') {
    await interaction.reply('こんにちは！今日も頑張りましょう 😊');
  }

  if (interaction.commandName === 'save') {
    const message = interaction.options.getString('message');
    const userId = interaction.user.id;

    const stmt = db.prepare('INSERT INTO messages (user_id, content) VALUES (?, ?)');
    stmt.run(userId, message);

    await interaction.reply('メッセージを記録しました 📝');
  }

  if (interaction.commandName === 'read') {
    const userId = interaction.user.id;

    const stmt = db.prepare('SELECT content FROM messages WHERE user_id = ? ORDER BY created_at DESC LIMIT 1');
    const row = stmt.get(userId);

    if (row) {
      await interaction.reply(`記録されたメッセージ: ${row.content}`);
    } else {
      await interaction.reply('まだメッセージが記録されていません');
    }
  }

  // 👇 新しく追加
  if (interaction.commandName === 'feeling') {
    const userId = interaction.user.id;
    const feeling = interaction.options.getString('mood');
    const note = interaction.options.getString('note') || null;

    // 気分を保存
    const stmt = db.prepare('INSERT INTO feelings (user_id, feeling, note) VALUES (?, ?, ?)');
    stmt.run(userId, feeling, note);

    // 総記録数を取得
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM feelings WHERE user_id = ?');
    const { count } = countStmt.get(userId);

    // 気分に応じた絵文字
    const emoji = {
      great: '😊',
      good: '🙂',
      okay: '😐',
      down: '😔',
      bad: '😢'
    }[feeling] || '📝';

    let message = `今日の気分を記録しました ${emoji} (累計: ${count}回目)`;
    if (note) {
      message += `\nメモ: ${note}`;
    }

    await interaction.reply(message);
  }
});
```

---

### 2-3. 動作確認

```bash
node index.js
```

Discord で試してください：

```
/feeling mood:good note:天気が良い
→ Bot: 今日の気分を記録しました 🙂 (累計: 1回目)
     メモ: 天気が良い
```

**✅ 気分が記録できれば成功です！**

---


> 🧭 **この章のゴール**  
> `/count` で「総数」「今日」「最新」などを返します。  
>  
> ✅ ここでよくある事故  
> - `getTimeDiff` が未定義で落ちる（PowerShellに ReferenceError）  
> - 例外で止まって Discordが「応答しませんでした」になる
## 第3章：/count コマンドの実装（20分）


> ✅ **ここは“追加”ではなく“どこに入れるか”が最重要**  
> `/count` も `interactionCreate` の中に入れます。  
> もし `/count` の if がすでに存在する場合、  
> **同じコマンド名の if を2つ作らない**でください（動作が不明になります）。  
>  
> 🔥 **よくあるエラー**  
> - `getTimeDiff is not defined` → 関数が存在しないのに呼び出している

### 3-1. 基本的な集計処理

`index.js` の `client.on('interactionCreate', ...)` に `/count` の処理を追加：

```javascript
if (interaction.commandName === 'count') {
  const userId = interaction.user.id;

  // 総記録数
  const totalStmt = db.prepare('SELECT COUNT(*) as count FROM feelings WHERE user_id = ?');
  const { count: totalCount } = totalStmt.get(userId);

  if (totalCount === 0) {
    await interaction.reply('まだ記録がありません。/feeling で気分を記録してみましょう！');
    return;
  }

  // 今日の記録数
  const todayStmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM feelings 
    WHERE user_id = ? 
    AND DATE(created_at) = DATE('now', 'localtime')
  `);
  const { count: todayCount } = todayStmt.get(userId);

  // 最新の記録
  const latestStmt = db.prepare(`
    SELECT feeling, note, created_at 
    FROM feelings 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 1
  `);
  const latest = latestStmt.get(userId);

  // 時間差を計算
  const timeDiff = getTimeDiff(latest.created_at);

  // 返信メッセージを組み立て
  let message = '**あなたの記録**\n';
  message += `📊 総記録数: ${totalCount}回\n`;
  message += `📅 今日の記録: ${todayCount}回\n`;
  message += `最終記録: ${latest.feeling} (${timeDiff})`;

  if (latest.note) {
    message += `\nメモ: ${latest.note}`;
  }

  await interaction.reply(message);
}
```

---


> ⚠️ **注意（教材上の落とし穴）**  
> ここで `getTimeDiff` を追加する指示があります。  
> **この関数が無い状態で 3-1 の /count を動かすと ReferenceError で落ちます。**  
>  
> ✅ 受講者向けの確認：  
> - 3-1 を貼ったあとに `/count` を試す前に、必ず 3-2 も終わっているか？

### 3-2. 時間差計算の関数を追加

`index.js` の上部（`client.on` の前）に以下の関数を追加：

```javascript
// 時間差を人間に読みやすい形式で返す
function getTimeDiff(timestamp) {
  const now = new Date();
  const past = new Date(timestamp);
  const diffMs = now - past;
  const diffMinutes = Math.floor(diffMs / 60000);

  if (diffMinutes < 1) return '今';
  if (diffMinutes < 60) return `${diffMinutes}分前`;

  const diffHours = Math.floor(diffMinutes / 60);
  if (diffHours < 24) return `${diffHours}時間前`;

  const diffDays = Math.floor(diffHours / 24);
  return `${diffDays}日前`;
}
```

---

### 3-3. 動作確認

```bash
node index.js
```

Discord で試してください：

```
/count
→ Bot:
**あなたの記録**
📊 総記録数: 3回
📅 今日の記録: 2回
最終記録: good (5分前)
```

**✅ 統計が表示されれば成功です！**

---


> 🧭 **この章のゴール**  
> `/count` の表示を“内訳付き”に拡張します。  
>  
> ✅ ここでよくある事故  
> - `/count` の処理を“追加”して2つ存在してしまう（どっちが動いてるか混乱）  
> - replyが複数回になって InteractionAlreadyReplied
## 第4章：気分の内訳を追加（15分）


> ✅ **ここは“/count の中身を更新する章”**  
> 3-1 で作った `/count` の if ブロックを、この章の内容で“更新”します。  
>  
> ✅ **安全な進め方（この資料の推奨）**  
> - まず 3-1 の `/count` が動く状態にする  
> - 次に 4-1 の変更を入れる（段階的に確認）

### 4-1. 気分ごとの集計を追加

`/count` コマンドの処理をさらに改良します：

```javascript
if (interaction.commandName === 'count') {
  const userId = interaction.user.id;

  // 総記録数
  const totalStmt = db.prepare('SELECT COUNT(*) as count FROM feelings WHERE user_id = ?');
  const { count: totalCount } = totalStmt.get(userId);

  if (totalCount === 0) {
    await interaction.reply('まだ記録がありません。/feeling で気分を記録してみましょう！');
    return;
  }

  // 今日の記録数
  const todayStmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM feelings 
    WHERE user_id = ? 
    AND DATE(created_at) = DATE('now', 'localtime')
  `);
  const { count: todayCount } = todayStmt.get(userId);

  // 気分ごとの集計
  const feelingStmt = db.prepare(`
    SELECT feeling, COUNT(*) as count 
    FROM feelings 
    WHERE user_id = ? 
    GROUP BY feeling
  `);
  const feelingCounts = feelingStmt.all(userId);

  // 最新の記録
  const latestStmt = db.prepare(`
    SELECT feeling, note, created_at 
    FROM feelings 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 1
  `);
  const latest = latestStmt.get(userId);

  const timeDiff = getTimeDiff(latest.created_at);

  // 絵文字マップ
  const emojiMap = {
    great: '😊',
    good: '🙂',
    okay: '😐',
    down: '😔',
    bad: '😢'
  };

  // 返信メッセージを組み立て
  let message = '**あなたの記録**\n';
  message += `📊 総記録数: ${totalCount}回\n`;
  message += `📅 今日の記録: ${todayCount}回\n\n`;

  message += '**気分の内訳**\n';
  feelingCounts.forEach(({ feeling, count }) => {
    const emoji = emojiMap[feeling] || '📝';
    const percentage = Math.round((count / totalCount) * 100);
    message += `${emoji} ${feeling}: ${count}回 (${percentage}%)\n`;
  });

  message += `\n最終記録: ${latest.feeling} (${timeDiff})`;

  if (latest.note) {
    message += `\nメモ: ${latest.note}`;
  }

  await interaction.reply(message);
}
```

---

### 4-2. 動作確認

```bash
node index.js
```

複数回 `/feeling` で記録した後、`/count` を実行：

```
/count
→ Bot:
**あなたの記録**
📊 総記録数: 10回
📅 今日の記録: 3回

**気分の内訳**
😊 great: 2回 (20%)
🙂 good: 4回 (40%)
😐 okay: 3回 (30%)
😔 down: 1回 (10%)

最終記録: good (10分前)
メモ: リラックスできた
```

**✅ 内訳が表示されれば成功です！**

---


> 🧭 **この章のゴール**  
> `/count` に「過去7日間」を追加して、応用集計を体験します。  
>  
> ✅ ここでよくある事故  
> - SQLの貼り場所がずれて変数が未定義になる  
> - 「...既存の処理...」の意味を誤読して、そのまま動かなくなる
## 第5章：週間集計を追加（応用編）（10分）


> ✅ **ここは“/count の中で追記”するパート**  
> 4-1 の `/count` ブロックの中に「weekStmt」を追加します。  
>  
> ✅ 重要：この章のコードは `totalCount` や `todayCount` が既にある前提です。  
> そのため、貼り付け位置を間違えると「変数が未定義」になりやすいです。

### 5-1. 過去7日間の集計を追加

`/count` コマンドに週間統計を追加します：

```javascript
if (interaction.commandName === 'count') {
  const userId = interaction.user.id;

  // ... 既存の処理 ...

  // 過去7日間の記録数
  const weekStmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM feelings 
    WHERE user_id = ? 
    AND DATE(created_at) >= DATE('now', '-7 days', 'localtime')
  `);
  const { count: weekCount } = weekStmt.get(userId);

  // ... 気分ごとの集計 ...

  // 返信メッセージを組み立て
  let message = '**あなたの記録**\n';
  message += `📊 総記録数: ${totalCount}回\n`;
  message += `📅 今日の記録: ${todayCount}回\n`;
  message += `📆 過去7日間: ${weekCount}回\n\n`;

  // ... 以下既存のコード ...
}
```

---

### 5-2. 動作確認

```bash
node index.js
```

```
/count
→ Bot:
**あなたの記録**
📊 総記録数: 15回
📅 今日の記録: 3回
📆 過去7日間: 10回

**気分の内訳**
...
```

**✅ 週間集計が表示されれば成功です！**

---


> 🧭 **この章のゴール**  
> Gitで「第4回の到達点」を確実に保存します（戻れる状態を作る）。
## 第6章：Git で記録（5分）

```bash
git add .
git commit -m "第4回: SQLite集計+countコマンド実装"
git push
```

---

## ✅ この回のチェックリスト

- [ ] `feelings` テーブルを作成できた
- [ ] `/feeling` コマンドで気分を記録できた
- [ ] `/count` コマンドで統計が表示された
- [ ] 気分ごとの内訳が表示された
- [ ] 週間集計が表示された
- [ ] Git にコミット・プッシュできた

---

## 🔍 今日覚えること

### SQLite の集計

- `COUNT()` → 件数を数える
- `GROUP BY` → グループごとに集計
- `DATE()` → 日付で絞り込み

### データの可視化

- パーセンテージ計算
- 時間差の表示
- 統計情報の整形

### 実用的な設計

- テーブル設計の重要性
- 集計しやすいデータ構造
- ユーザーごとのデータ管理

---

## ⚠️ よくあるトラブル

### 統計が0回になる

**原因：** テーブルが新しく作られてデータがない

**対処法：**
1. `/feeling` で何回か記録する
2. `/count` で確認

---

### パーセンテージがおかしい

**原因：** 小数点の計算誤差

**対処法：**
- `Math.round()` で四捨五入する
- すでにコードに含まれています

---

### 時間がずれている

**原因：** タイムゾーンの問題

**対処法：**
- SQLite の `'localtime'` オプションを使う
- すでにコードに含まれています

---

## 📊 データベース設計のポイント

### なぜ別テーブルにしたか

`messages` テーブルと `feelings` テーブルを分けた理由：

1. **目的が違う**
   - messages → 自由なメモ
   - feelings → 気分の記録

2. **集計しやすい**
   - feelings は選択肢が決まっている
   - COUNT や GROUP BY が使いやすい

3. **拡張しやすい**
   - 将来的に別の機能を追加できる

**👉 テーブルは「何を管理するか」で分ける**

---

## 📈 次のステップ（自習用）

### チャレンジ課題

1. **月間集計を追加**
   - 過去30日間の統計を表示

2. **グラフ風の表示**
   - `■■■■■ 40%` のようなバー表示

3. **連続記録日数**
   - 何日連続で記録しているか表示

---

## 次回予告

### 第5回：SQLデータの取り出しや定型的パターンの登録（緊急対策例）

今回は「記録と集計」でしたが、次回は：
- 定型メッセージの登録
- キーワード検索機能
- 緊急時の自動応答
- メンタル系Botらしい実用機能

**👉 実際に使える Bot になってきます！**
---

# 付録：トラブルシューティング（この回だけで使える版）

この付録は「エラーが出たとき、どこを見ればいいか」を1枚にまとめたものです。

## A. Discordで「アプリケーションが応答しませんでした」になった

これは **Discordが3秒以内に応答を受け取れなかった**ときに出ます。  
原因はほぼ次の2つです。

1) **処理が3秒を超えた**  
2) **処理の途中で例外が発生して止まった**（PowerShellに赤いエラーが出ている）

✅ まずやること：  
- PowerShell（`node index.js` を実行している画面）に **赤いエラー**が出ていないか確認

よくある例：  
- `ReferenceError: getTimeDiff is not defined`  
- `SqliteError: no such table: feelings`  
- `InteractionAlreadyReplied`  

---

## B. `/feeling` が候補に出ない

✅ まずやること：  
- `node register-commands.js` を実行したか？  
- `.env` に `GUILD_ID` があるか？  
- 登録先が guild になっているか？  

---

## C. `/feeling` は出るが、実行すると無反応

✅ まずやること：  
- Botを再起動したか？（`Ctrl + C` → `node index.js`）  
- PowerShellに例外が出ていないか？  

---

## D. データが保存されているか不安（SQLiteの確認）

この回では `bot.db` がプロジェクト直下に作られます。  
別フォルダで `node index.js` を実行すると、別の `bot.db` が作られてしまい  
「保存されない」と勘違いしやすいです。

✅ まずやること：  
- `PS C:\Users\admin\git_practice>` のように **今いるフォルダ**を確認  
- `dir`（Windows）で `bot.db` があるか確認  

---

## E. “貼り付け事故”を防ぐ合言葉

- `commands` は **1ファイルに1回**  
- `client.on('interactionCreate')` は **1ファイルに1回**  
- コマンドの if は **同じ commandName を二重にしない**  
- DBの `CREATE TABLE` は **消さずに追加（IF NOT EXISTS）**  

---