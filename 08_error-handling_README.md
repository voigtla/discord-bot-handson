# 第8回：エラーが起きても安全に終わる（フォールバック）、わざと危ない実装 → 手で止めて戻す（体験）

本番環境では **必ずエラーが起きます**。  
今回は、エラーが起きても Bot が壊れない仕組みを作ります。

---

## 📌 この回の目標

- エラーハンドリングの基礎を学ぶ
- フォールバック（安全な代替処理）を実装する
- わざと壊れるコードを書いて、復旧を体験する
- データベーストランザクションを理解する

**💡 ポイント：**
- エラーは「起きないようにする」ではなく「起きても大丈夫にする」
- ログとモニタリングが重要
- 失敗から学ぶのが一番早い

---

## 🎯 この回の流れ

1. **わざと壊れるコードを書く**
2. **Bot が動かなくなるのを体験**
3. **エラーハンドリングで修正**
4. **データ整合性の問題を体験**
5. **トランザクションで解決**

**👉 失敗 → 学習 → 改善のサイクルを体験します**

---

## 第1章：現在のコードの脆弱性を知る（15分）

### 1-1. わざと壊れるコードを追加

`index.js` に「危険な」コマンドを追加します：

```javascript
// ⚠️ これは教育用の「悪い例」です
if (interaction.commandName === 'dangerous-test') {
  const userId = interaction.user.id;
  
  // エラーハンドリングなし！
  const data = JSON.parse('これは壊れる');  // 構文エラー
  
  await interaction.reply('成功しました');
}
```

**コマンド登録（register-commands.js）：**
```javascript
{
  name: 'dangerous-test',
  description: '【デモ】エラーハンドリングのテスト'
}
```

```bash
node register-commands.js
```

---

### 1-2. 実行して壊れることを確認

```bash
node index.js
```

Discord で `/dangerous-test` を実行してください。

**何が起きるか：**
1. Bot がクラッシュする
2. Discord に応答が返らない
3. `node index.js` が止まる

**コンソール出力例：**
```
SyntaxError: Unexpected token in JSON
    at JSON.parse...
```

**👉 これが「エラーハンドリングなし」の結果です**

---

### 1-3. なぜ危険か

- **Bot全体が停止** → 他のコマンドも使えなくなる
- **ユーザーに応答なし** → Discord側でエラー表示
- **データの不整合** → 処理が中途半端に終わる可能性

**👉 1つの機能のエラーが、Bot全体を止めてはいけない**

---

## 第2章：基本的なエラーハンドリング（20分）

### 2-1. try-catch の基本

危険なコードを `try-catch` で包みます：

```javascript
if (interaction.commandName === 'dangerous-test') {
  try {
    const data = JSON.parse('これは壊れる');
    await interaction.reply('成功しました');
  } catch (error) {
    console.error('エラーが発生:', error);
    await interaction.reply('❌ エラーが発生しました。もう一度お試しください。');
  }
}
```

**再起動して試してください：**
```bash
node index.js
```

Discord で `/dangerous-test` を実行。

**今度は：**
- Bot はクラッシュしない
- エラーメッセージが返る
- コンソールにエラーログが出る

**✅ エラーハンドリングの基本形**

---

### 2-2. エラー情報を記録する

`index.js` に エラーログ用のテーブルを追加：

```javascript
// エラーログ用テーブル
db.exec(`
  CREATE TABLE IF NOT EXISTS error_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    error_type TEXT NOT NULL,
    error_message TEXT,
    stack_trace TEXT,
    user_id TEXT,
    command TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
```

---

### 2-3. エラーログ記録関数

```javascript
function logError(errorType, error, userId = null, command = null) {
  try {
    const stmt = db.prepare(`
      INSERT INTO error_logs (error_type, error_message, stack_trace, user_id, command) 
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(
      errorType,
      error.message || '不明なエラー',
      error.stack || '',
      userId,
      command
    );
  } catch (logError) {
    // ログ記録自体が失敗しても Bot は止めない
    console.error('ログ記録失敗:', logError);
  }
}
```

---

### 2-4. エラーハンドリングを強化

```javascript
if (interaction.commandName === 'dangerous-test') {
  try {
    const data = JSON.parse('これは壊れる');
    await interaction.reply('成功しました');
  } catch (error) {
    // エラーを記録
    logError('command_error', error, interaction.user.id, 'dangerous-test');
    
    console.error('エラーが発生:', error);
    
    // ユーザーに返答
    await interaction.reply({
      content: '❌ エラーが発生しました。管理者に報告されました。',
      ephemeral: true
    });
  }
}
```

---

## 第3章：データベースのトランザクション（25分）

### 3-1. トランザクションなしの危険性

次のコードの問題点を考えてみましょう：

```javascript
// ❌ 危険な例：トランザクションなし
if (interaction.commandName === 'transfer-points') {
  const fromUser = interaction.user.id;
  const toUser = interaction.options.getUser('to').id;
  const amount = interaction.options.getInteger('amount');

  // ステップ1: fromUserからポイントを引く
  db.prepare('UPDATE users SET points = points - ? WHERE user_id = ?').run(amount, fromUser);
  
  // ⚠️ ここでエラーが起きたら？
  throw new Error('わざとエラー');
  
  // ステップ2: toUserにポイントを足す（実行されない）
  db.prepare('UPDATE users SET points = points + ? WHERE user_id = ?').run(amount, toUser);

  await interaction.reply('ポイントを送信しました');
}
```

**何が起きるか：**
- fromUser のポイントは減る
- toUser のポイントは増えない
- **ポイントが消滅する**

**👉 これがデータ不整合の問題です**

---

### 3-2. トランザクションで解決

```javascript
// ✅ 安全な例：トランザクション使用
if (interaction.commandName === 'transfer-points') {
  const fromUser = interaction.user.id;
  const toUser = interaction.options.getUser('to').id;
  const amount = interaction.options.getInteger('amount');

  // トランザクション開始
  const transaction = db.transaction(() => {
    // ステップ1: fromUserからポイントを引く
    db.prepare('UPDATE users SET points = points - ? WHERE user_id = ?')
      .run(amount, fromUser);
    
    // ⚠️ ここでエラーが起きても、ステップ1はロールバックされる
    // throw new Error('わざとエラー');
    
    // ステップ2: toUserにポイントを足す
    db.prepare('UPDATE users SET points = points + ? WHERE user_id = ?')
      .run(amount, toUser);
  });

  try {
    transaction();  // トランザクション実行
    await interaction.reply('✅ ポイントを送信しました');
  } catch (error) {
    // エラー時は全てロールバック（何も変更されない）
    logError('transaction_error', error, fromUser, 'transfer-points');
    await interaction.reply('❌ 送信に失敗しました。ポイントは変更されていません。');
  }
}
```

**トランザクションの仕組み：**
1. すべての操作が成功 → コミット（確定）
2. 途中でエラー → ロールバック（すべて取り消し）

**👉 データ整合性が保たれます**

---

### 3-3. 実際に体験する

ユーザーポイントシステムを簡易実装して試します：

**テーブル作成：**
```javascript
db.exec(`
  CREATE TABLE IF NOT EXISTS user_points (
    user_id TEXT PRIMARY KEY,
    points INTEGER DEFAULT 100
  )
`);
```

**コマンド登録：**
```javascript
{
  name: 'points',
  description: 'ポイント残高を確認'
},
{
  name: 'give-points',
  description: 'ポイントを送る（トランザクションテスト）',
  options: [
    {
      name: 'to',
      description: '送る相手',
      type: 6,
      required: true
    },
    {
      name: 'amount',
      description: '送るポイント',
      type: 4,
      required: true
    }
  ]
}
```

**実装（トランザクションなし版）：**
```javascript
// まずはトランザクションなしで試す
if (interaction.commandName === 'give-points') {
  const fromUser = interaction.user.id;
  const toUser = interaction.options.getUser('to').id;
  const amount = interaction.options.getInteger('amount');

  try {
    // ユーザーが存在しない場合は作成
    db.prepare('INSERT OR IGNORE INTO user_points (user_id, points) VALUES (?, 100)').run(fromUser);
    db.prepare('INSERT OR IGNORE INTO user_points (user_id, points) VALUES (?, 100)').run(toUser);

    // ポイントチェック
    const balance = db.prepare('SELECT points FROM user_points WHERE user_id = ?').get(fromUser);
    if (balance.points < amount) {
      await interaction.reply('❌ ポイントが不足しています');
      return;
    }

    // ステップ1: 減らす
    db.prepare('UPDATE user_points SET points = points - ? WHERE user_id = ?').run(amount, fromUser);
    
    // わざとエラーを起こす（コメントアウトを外して試す）
    // throw new Error('送信中にエラー発生');
    
    // ステップ2: 増やす
    db.prepare('UPDATE user_points SET points = points + ? WHERE user_id = ?').run(amount, toUser);

    await interaction.reply(`✅ ${amount}ポイントを送信しました`);
  } catch (error) {
    logError('points_transfer_error', error, fromUser, 'give-points');
    await interaction.reply('❌ 送信に失敗しました');
  }
}
```

**試してみる：**
1. `/give-points to:@友達 amount:10` を実行
2. 成功することを確認
3. コードのエラー行のコメントアウトを外す
4. もう一度実行
5. **ポイントが消える**ことを確認

---

### 3-4. トランザクション版に修正

```javascript
if (interaction.commandName === 'give-points') {
  const fromUser = interaction.user.id;
  const toUser = interaction.options.getUser('to').id;
  const amount = interaction.options.getInteger('amount');

  try {
    // ユーザー作成は外で実行
    db.prepare('INSERT OR IGNORE INTO user_points (user_id, points) VALUES (?, 100)').run(fromUser);
    db.prepare('INSERT OR IGNORE INTO user_points (user_id, points) VALUES (?, 100)').run(toUser);

    // ポイントチェック
    const balance = db.prepare('SELECT points FROM user_points WHERE user_id = ?').get(fromUser);
    if (balance.points < amount) {
      await interaction.reply('❌ ポイントが不足しています');
      return;
    }

    // トランザクションで実行
    const transferPoints = db.transaction(() => {
      db.prepare('UPDATE user_points SET points = points - ? WHERE user_id = ?')
        .run(amount, fromUser);
      
      // わざとエラーを起こす（コメントアウトを外して試す）
      // throw new Error('送信中にエラー発生');
      
      db.prepare('UPDATE user_points SET points = points + ? WHERE user_id = ?')
        .run(amount, toUser);
    });

    transferPoints();  // トランザクション実行

    await interaction.reply(`✅ ${amount}ポイントを送信しました`);
  } catch (error) {
    logError('points_transfer_error', error, fromUser, 'give-points');
    await interaction.reply('❌ 送信に失敗しました。ポイントは変更されていません。');
  }
}
```

**試してみる：**
1. エラー行のコメントアウトを外す
2. `/give-points` を実行
3. エラーメッセージが出る
4. **ポイントは変更されていない**ことを確認

**✅ トランザクションで安全になりました**

---

## 第4章：フォールバック戦略（15分）

### 4-1. AI が失敗したときの代替処理

```javascript
async function getAIResponse(userMessage, userId) {
  try {
    // AI に問い合わせ
    const result = await aiHelper.chat(userMessage);
    
    if (result.success) {
      return result.message;
    } else {
      // AIが応答できなかった → フォールバック
      return getFallbackResponse(userMessage);
    }
  } catch (error) {
    // エラーが起きた → フォールバック
    logError('ai_error', error, userId, 'ai');
    return getFallbackResponse(userMessage);
  }
}

function getFallbackResponse(message) {
  // メッセージの内容に応じた簡易応答
  const lowerMessage = message.toLowerCase();
  
  if (lowerMessage.includes('辛い') || lowerMessage.includes('つらい')) {
    return '🤗 辛い気持ちを話してくれてありがとうございます。\n`/template get comfort` で落ち着くメッセージを見られます。';
  }
  
  if (lowerMessage.includes('眠れない') || lowerMessage.includes('不眠')) {
    return '😴 眠れないのは辛いですね。\n`/template get breathe` で呼吸法を試してみてください。';
  }
  
  // デフォルト
  return '申し訳ありません。今、応答を生成できません。\n定型メッセージは `/template list` で確認できます。';
}
```

---

### 4-2. データベース接続失敗時の対応

```javascript
// Bot起動時のデータベース接続
try {
  const db = new Database('bot.db');
  console.log('✅ データベース接続成功');
} catch (error) {
  console.error('❌ データベース接続失敗:', error);
  
  // フォールバック: メモリ内データベース
  const db = new Database(':memory:');
  console.log('⚠️ メモリ内データベースで起動');
  
  // 最小限のテーブルのみ作成
  db.exec(`
    CREATE TABLE error_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      error_message TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);
}
```

---

## 第5章：グレースフル シャットダウン（10分）

### 5-1. 安全な終了処理

```javascript
// シグナルハンドラ
process.on('SIGINT', async () => {
  console.log('\n🛑 シャットダウン開始...');

  try {
    // 進行中の処理を待つ
    await new Promise(resolve => setTimeout(resolve, 1000));

    // データベースを閉じる
    db.close();
    console.log('✅ データベースクローズ');

    // Discord から切断
    client.destroy();
    console.log('✅ Discord切断');

    console.log('👋 正常終了');
    process.exit(0);
  } catch (error) {
    console.error('❌ 終了処理でエラー:', error);
    process.exit(1);
  }
});

// 未処理のエラーをキャッチ
process.on('uncaughtException', (error) => {
  console.error('🚨 未処理の例外:', error);
  logError('uncaught_exception', error);
  
  // Bot は停止しない（本番環境では要検討）
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('🚨 未処理のPromise拒否:', reason);
  logError('unhandled_rejection', new Error(String(reason)));
});
```

**試してみる：**
```bash
node index.js
# Ctrl + C で終了
```

**出力例：**
```
🛑 シャットダウン開始...
✅ データベースクローズ
✅ Discord切断
👋 正常終了
```

---

## 第6章：エラーログの確認コマンド（10分）

### 6-1. /error-logs コマンドの登録

```javascript
{
  name: 'error-logs',
  description: 'エラーログを表示（管理者のみ）',
  options: [
    {
      name: 'limit',
      description: '表示件数',
      type: 4,
      required: false
    }
  ]
}
```

---

### 6-2. 実装

```javascript
if (interaction.commandName === 'error-logs') {
  if (!interaction.member.permissions.has('ManageMessages')) {
    await interaction.reply({ content: '管理者のみ使用できます', ephemeral: true });
    return;
  }

  const limit = interaction.options.getInteger('limit') || 10;
  
  const stmt = db.prepare(`
    SELECT error_type, error_message, command, user_id, created_at 
    FROM error_logs 
    ORDER BY created_at DESC 
    LIMIT ?
  `);
  const logs = stmt.all(limit);

  if (logs.length === 0) {
    await interaction.reply('エラーログはありません');
    return;
  }

  let message = `**🔍 エラーログ（直近${limit}件）**\n\n`;
  logs.forEach(log => {
    const date = new Date(log.created_at).toLocaleString('ja-JP');
    message += `[${date}]\n`;
    message += `種類: ${log.error_type}\n`;
    message += `メッセージ: ${log.error_message}\n`;
    if (log.command) message += `コマンド: ${log.command}\n`;
    if (log.user_id) message += `ユーザー: <@${log.user_id}>\n`;
    message += '\n';
  });

  await interaction.reply({ content: message, ephemeral: true });
}
```

---

## 第7章：Git で記録（5分）

```bash
git add .
git commit -m "第8回: エラーハンドリング+トランザクション実装"
git push
```

---

## ✅ この回のチェックリスト

- [ ] わざとエラーを起こして Bot がクラッシュすることを確認した
- [ ] try-catch でエラーハンドリングを実装した
- [ ] エラーログが記録された
- [ ] トランザクションなしでデータ不整合を体験した
- [ ] トランザクションで安全になることを確認した
- [ ] フォールバック処理を実装した
- [ ] Git にコミット・プッシュできた

---

## 🔍 今日覚えること

### エラーハンドリングの原則

1. **エラーは必ず起きる** → 起きたときの対策が重要
2. **ユーザーに影響させない** → エラーでBot全体が止まらない
3. **記録する** → 問題を分析できるように

### トランザクションの重要性

- 複数のDB操作は必ずトランザクションで包む
- 「全部成功」か「全部失敗」の2択だけ
- データ整合性が保たれる

### フォールバック

- AI が失敗 → 定型メッセージ
- DB が失敗 → メモリDB
- 最悪でも「何か」は返す

---

## ⚠️ よくあるトラブル

### トランザクションの使い方が分からない

```javascript
// パターン1: 関数型
const doSomething = db.transaction(() => {
  // ここに複数のDB操作
});
doSomething();

// パターン2: インライン
db.transaction(() => {
  // ここに複数のDB操作
})();
```

---

### エラーログが記録されない

**原因：** ログ記録自体がエラー

**対処法：**
```javascript
try {
  // メイン処理
} catch (error) {
  try {
    logError(...);
  } catch (logErr) {
    console.error('ログ記録失敗', logErr);
  }
}
```

---

## 📊 本番運用のチェックリスト

### 必須対策

- [x] すべてのコマンドに try-catch
- [x] データベース操作はトランザクション
- [x] エラーログの記録
- [x] フォールバック処理

### 推奨対策

- [ ] エラー通知（管理者へ Discord DM）
- [ ] 自動再起動（PM2 などの使用）
- [ ] ヘルスチェック
- [ ] 定期的なログ確認

---

## 🎓 発展課題（自習用）

1. **リトライ処理**
   - API 失敗時に3回まで再試行

2. **サーキットブレーカー**
   - 連続エラー時は一時停止

3. **監視ダッシュボード**
   - エラー率をグラフ化

---

## 次回予告

### 第9回：SSH 本番環境にデプロイ

ついに本番環境へ：
- VPS または GCP への接続
- SSH の基本
- Bot のデプロイ
- プロセス管理（PM2）

**👉 Bot を24時間稼働させます！**
