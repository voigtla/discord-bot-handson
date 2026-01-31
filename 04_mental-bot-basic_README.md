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

## 第2章：/feeling コマンドの実装（15分）

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

**コマンドを再登録：**
```bash
node register-commands.js
```

---

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

## 第3章：/count コマンドの実装（20分）

### 3-1. 基本的な集計処理

了解。いまの文章は「どこに何を足すのか」「前提として何が必要なのか」が省略されていて、初学者だと迷子になります。
同じ内容を、**作業が迷わない順番**に書き換えます（コードも“貼る場所”がわかるようにします）。

---

## 3-1. `/count` の基本集計を追加（どこに入れるかが分かる版）

### この章でやること

`/count` が実行されたときに、次を返します。

* 📊 総記録数（これまで何回記録したか）
* 📅 今日の記録数（今日だけで何回記録したか）
* 🕒 最新の記録（最後に記録した気分と経過時間）
* 📝 メモがあれば表示

---

### 前提チェック（ここが抜けていると動きません）

* DBに **`feelings` テーブル**が作られていること
  （`messages` ではなく `feelings` を参照しています）
* `getTimeDiff()` 関数が **どこかに定義されていること**
  （このコードは `getTimeDiff(latest.created_at)` を呼びます）

> もしこの2つがまだなら、先に「feelingsテーブル作成」と「getTimeDiffの追加」を入れる必要があります。

---

### 追加する場所（ここが一番大事）

`index.js` のこの形の部分を探してください：

```js
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // ここに hello / save / read ... が並んでいるはず
});
```

`hello` / `save` / `read` と同じ並びで、**同じ深さ（インデント）**に `/count` を1ブロック追加します。
（つまり `client.on(...){ ... }` の中、他の `if (interaction.commandName === ...)` の“兄弟”として置く）

---

### `/count` の処理（このブロックを追加）

```js
// /count コマンド
if (interaction.commandName === 'count') {
  const userId = interaction.user.id;

  // 1) 総記録数
  const totalStmt = db.prepare(
    'SELECT COUNT(*) as count FROM feelings WHERE user_id = ?'
  );
  const { count: totalCount } = totalStmt.get(userId);

  // 記録が0件ならここで終了
  if (totalCount === 0) {
    await interaction.reply('まだ記録がありません。/feeling で気分を記録してみましょう！');
    return;
  }

  // 2) 今日の記録数（PCのローカル時間 기준）
  const todayStmt = db.prepare(`
    SELECT COUNT(*) as count
    FROM feelings
    WHERE user_id = ?
      AND DATE(created_at) = DATE('now', 'localtime')
  `);
  const { count: todayCount } = todayStmt.get(userId);

  // 3) 最新の記録
  const latestStmt = db.prepare(`
    SELECT feeling, note, created_at
    FROM feelings
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `);
  const latest = latestStmt.get(userId);

  // 4) 「どれくらい前か」を文字にする（getTimeDiffが必要）
  const timeDiff = getTimeDiff(latest.created_at);

  // 5) 返信メッセージを作る
  let message = '**あなたの記録**\n';
  message += `📊 総記録数: ${totalCount}回\n`;
  message += `📅 今日の記録: ${todayCount}回\n`;
  message += `🕒 最終記録: ${latest.feeling} (${timeDiff})`;

  if (latest.note) {
    message += `\n📝 メモ: ${latest.note}`;
  }

  await interaction.reply(message);
  return;
}
```

---

### よくある詰まりポイント（最短で確認）

* エラーで `feelings` がないと言われる → **テーブル名がまだ `messages` のまま**
* エラーで `getTimeDiff is not defined` → **関数をまだ追加していない**

---

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

## 第4章：気分の内訳を追加（15分）

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

## 第5章：週間集計を追加（応用編）（10分）

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
