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

了解です。
いまの文章は **「何をしている章か」「どこを編集するのか」「何を触ってはいけないか」** が混ざっていて、初学者だとかなり迷います。
**“事故らない教材用”**に、構造を整理した md をそのまま出します。

---

````md
## 第2章：`/feeling` コマンドの実装（15分）

この章では、  
**「今の気分を選んで記録する `/feeling` コマンド」** を追加します。

作業は次の2つだけです。

1. コマンドを Discord に登録する（`register-commands.js`）
2. 実行時の処理を Bot に追加する（`index.js`）

---

## 2-1. `/feeling` コマンドを登録する

### やること
`register-commands.js` にある **`commands` 配列を置き換えて**、  
`/feeling` を含む最新の定義にします。

> ⚠️ **注意**  
> `const commands = [...]` は **1ファイルに1回だけ** 定義します。  
> 追記ではなく、**配列全体を置き換える**のがポイントです。

### 手順

1. `register-commands.js` を開く
2. 既存の `const commands = [...]` を **すべて削除**
3. 次のコードを **同じ場所に貼り付け**

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
````

4. 保存したら、コマンドを再登録します：

```bash
node register-commands.js
```

✅ 成功すると
`コマンド登録完了！`
と表示され、Discord上で `/feeling` が候補に出るようになります。

---

## 2-2. `/feeling` の処理を追加する（index.js）

### やること

`/feeling` が実行されたときに、

* 選んだ気分を DB に保存
* 累計回数を数える
* 結果をメッセージで返す

処理を **`index.js` に追加**します。

---

### 追加する場所（重要）

`index.js` の次の形の部分を探してください：

```js
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // hello / save / read などの処理が並んでいる
});
```

その中で、`hello` / `save` / `read` と **同じ深さ**に
`/feeling` の処理を **1ブロック追加**します。

---

### 追加するコード（このまま貼る）

```javascript
// 👇 新しく追加（/feeling）
if (interaction.commandName === 'feeling') {
  const userId = interaction.user.id;
  const feeling = interaction.options.getString('mood');
  const note = interaction.options.getString('note') || null;

  // 気分を保存
  const stmt = db.prepare(
    'INSERT INTO feelings (user_id, feeling, note) VALUES (?, ?, ?)'
  );
  stmt.run(userId, feeling, note);

  // 総記録数を取得
  const countStmt = db.prepare(
    'SELECT COUNT(*) as count FROM feelings WHERE user_id = ?'
  );
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
```

---

### この時点でできること

* Discordで `/feeling` を実行
* 気分を選ぶ → 記録される
* メモは省略してもOK
* 次の章で `/count` による集計ができる

---

### もし「アプリケーションが応答しませんでした」と出たら

* `feelings` テーブルがまだ作られていない
* `/feeling` の追加処理が貼られていない
* Bot を再起動していない

この3点をまず確認してください。

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
いいところまで来てます 👍
ただし、**教材として見るとまだ2つだけノイズ**があります。

### 問題点（設計目線）

1. **メタ解説（「了解。いまの文章は〜」）が本文に混ざっている**

   * これは「作成者の思考」で、**受講者向け本文には不要**
2. **3-1 と 3-2 の「役割の境界」は良いが、導線が少しだけ不安**

   * 「なぜ先に関数を足すのか」が一瞬わからない人が出る

なので方針は：

> 内容はほぼそのまま
> **教材として“読むだけで迷わない形”に整形**

---

以下、**そのまま差し替え可能な md** を出します。

---

````md
## 第3章：`/count` コマンドの実装（20分）

この章では、これまで `/feeling` で記録した内容を集計し、  
**自分の記録状況を確認できる `/count` コマンド**を実装します。

---

## 3-1. `/count` の基本集計処理を追加する

### この章でできるようになること

`/count` を実行すると、次の情報が表示されます。

- 📊 総記録数（これまでに何回記録したか）
- 📅 今日の記録数（今日だけで何回記録したか）
- 🕒 最新の記録（最後に記録した気分と経過時間）
- 📝 メモ（あれば表示）

---

### 前提チェック（ここが抜けていると動きません）

次の2つが **すでに実装されていること**を確認してください。

- DB に **`feelings` テーブル**が作られている  
  （※ `messages` ではなく `feelings` を使います）
- `getTimeDiff()` 関数が定義されている  
  （※ 後の手順 3-2 で追加します）

> まだ入っていない場合は、先に  
> **3-2 → 3-1 の順で作業してもOK**です。

---

### 追加する場所（重要）

`index.js` の中で、次の形のコードを探します。

```js
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // hello / save / read / feeling などの処理が並んでいる
});
````

この中で、`hello` / `save` / `read` / `feeling` と
**同じ深さ（インデント）**に `/count` の処理を追加します。

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
    await interaction.reply(
      'まだ記録がありません。/feeling で気分を記録してみましょう！'
    );
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

  // 4) 経過時間を計算
  const timeDiff = getTimeDiff(latest.created_at);

  // 5) 返信メッセージを作成
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

### よくある詰まりポイント

* `no such table: feelings`
  → **テーブル名がまだ `messages` のまま**
* `getTimeDiff is not defined`
  → **次の 3-2 をまだ追加していない**

---

## 3-2. 経過時間を計算する関数を追加

`index.js` の **上部（`client.on` より前）** に、
次の関数を追加します。

```js
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

## 3-3. 動作確認

Bot を再起動します。

```bash
node index.js
```

Discordで次を試してください。

* `/count` を実行
* 記録がある場合 → 集計結果が表示される
* 記録がない場合 → ガイドメッセージが表示される

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
