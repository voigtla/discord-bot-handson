# 第7回：AI を利用する 第二回 - Bot の荒らし対策・リクエスト数を制限する

AI 機能を **安全に運用** するために、荒らし対策とセキュリティを強化します。

---

## 📌 この回の目標

- スパム・荒らし対策を実装する
- 不適切なコンテンツをフィルタリングする
- ユーザーごとの制限を強化する
- モデレーションログを記録する

**💡 ポイント：**
- AI は便利だが、悪用されるリスクもある
- 適切な制限とログで安全性を確保
- ユーザー体験を損なわない範囲で防御

---

## 🎯 完成イメージ

```
【スパム検出】
ユーザー: aaaaaaaaaa (連投)
Bot: ⚠️ スパム行為を検出しました。
     一時的に機能を制限します。

【不適切コンテンツ検出】
ユーザー: /ai message:[不適切な内容]
Bot: ❌ 不適切な内容が含まれています。
     このBotはメンタルサポート専用です。

【モデレーションログ】
管理者: /moderation-log
Bot: 📋 モデレーションログ（直近10件）
     2025-02-01 14:30 - user123: スパム検出
     2025-02-01 13:15 - user456: 不適切コンテンツ
```

**👉 Bot が安全に運用できる状態になります**

---

## 📚 事前準備

### 必要なもの

- ✅ 第6回までの完成プロジェクト
- ✅ AI 機能が動作している状態

---

## 第1章:スパム検出システム（20分）

### 1-1. スパム検出用テーブルの作成

`index.js` に追加：

```javascript
// スパム検出用テーブル
db.exec(`
  CREATE TABLE IF NOT EXISTS spam_detection (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    action_type TEXT NOT NULL,
    detected_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    penalty_until DATETIME
  )
`);

// モデレーションログ用テーブル
db.exec(`
  CREATE TABLE IF NOT EXISTS moderation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    reason TEXT,
    moderator_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
```

---

### 1-2. スパム検出モジュールの作成

`spam-detector.js` を新規作成：

```javascript
const Database = require('better-sqlite3');

class SpamDetector {
  constructor(db) {
    this.db = db;
    
    // スパム判定の閾値
    this.thresholds = {
      messagesPerMinute: 5,      // 1分間に5回まで
      repeatedMessages: 3,        // 同じメッセージ3回まで
      shortInterval: 2000,        // 2秒未満の連投
      penaltyDuration: 300000     // ペナルティ5分
    };
    
    // 一時記憶（メモリ内）
    this.recentMessages = new Map();
  }

  // スパム判定
  async isSpam(userId, message) {
    // ペナルティ中かチェック
    if (await this.isPenalized(userId)) {
      return { 
        isSpam: true, 
        reason: 'penalty',
        message: 'スパム行為により一時的に制限されています。'
      };
    }

    const now = Date.now();
    const userKey = `${userId}`;

    // ユーザーの履歴を取得
    if (!this.recentMessages.has(userKey)) {
      this.recentMessages.set(userKey, []);
    }

    const history = this.recentMessages.get(userKey);

    // 古い履歴を削除（1分以上前）
    const oneMinuteAgo = now - 60000;
    const recentHistory = history.filter(h => h.timestamp > oneMinuteAgo);

    // チェック1: 1分間のメッセージ数
    if (recentHistory.length >= this.thresholds.messagesPerMinute) {
      await this.applyPenalty(userId, 'high_frequency');
      return {
        isSpam: true,
        reason: 'high_frequency',
        message: '⏰ メッセージが多すぎます。少し時間を置いてください。'
      };
    }

    // チェック2: 短時間の連投
    if (recentHistory.length > 0) {
      const lastMessage = recentHistory[recentHistory.length - 1];
      const timeDiff = now - lastMessage.timestamp;

      if (timeDiff < this.thresholds.shortInterval) {
        await this.applyPenalty(userId, 'rapid_posting');
        return {
          isSpam: true,
          reason: 'rapid_posting',
          message: '⚠️ メッセージの送信が早すぎます。'
        };
      }
    }

    // チェック3: 同じメッセージの繰り返し
    const sameMessages = recentHistory.filter(h => h.content === message);
    if (sameMessages.length >= this.thresholds.repeatedMessages) {
      await this.applyPenalty(userId, 'repeated_content');
      return {
        isSpam: true,
        reason: 'repeated_content',
        message: '🔁 同じメッセージを繰り返さないでください。'
      };
    }

    // 履歴に追加
    recentHistory.push({ timestamp: now, content: message });
    this.recentMessages.set(userKey, recentHistory);

    return { isSpam: false };
  }

  // ペナルティを適用
  async applyPenalty(userId, actionType) {
    const penaltyUntil = new Date(Date.now() + this.thresholds.penaltyDuration);
    
    const stmt = this.db.prepare(`
      INSERT INTO spam_detection (user_id, action_type, penalty_until) 
      VALUES (?, ?, ?)
    `);
    stmt.run(userId, actionType, penaltyUntil.toISOString());

    // モデレーションログに記録
    const logStmt = this.db.prepare(`
      INSERT INTO moderation_logs (user_id, action, reason) 
      VALUES (?, 'penalty_applied', ?)
    `);
    logStmt.run(userId, actionType);
  }

  // ペナルティ中かチェック
  async isPenalized(userId) {
    const stmt = this.db.prepare(`
      SELECT penalty_until 
      FROM spam_detection 
      WHERE user_id = ? 
      AND penalty_until > datetime('now')
      ORDER BY detected_at DESC 
      LIMIT 1
    `);
    const result = stmt.get(userId);
    return !!result;
  }

  // ペナルティを解除
  async removePenalty(userId) {
    const stmt = this.db.prepare(`
      UPDATE spam_detection 
      SET penalty_until = datetime('now')
      WHERE user_id = ?
    `);
    stmt.run(userId);
  }

  // 統計を取得
  getStats() {
    const stmt = this.db.prepare(`
      SELECT action_type, COUNT(*) as count 
      FROM spam_detection 
      WHERE detected_at > datetime('now', '-7 days')
      GROUP BY action_type
    `);
    return stmt.all();
  }
}

module.exports = SpamDetector;
```

---

### 1-3. index.js に統合

**ここで編集するファイル：** `index.js`

**何をするか：**  
2つのステップがあります。

**ステップ1：** ファイルの先頭で `spam-detector.js` を読み込む  
**ステップ2：** `/ai` コマンドの処理の中にスパムチェックを追加する

---

#### ステップ1：ファイルの先頭に追加

**どこに書くか：**  
`index.js` の **一番上のほう**（`require` が並んでいるあたり）に追加します。

具体的には、`const AIHelper = require('./ai-helper');` の **下**に追加：

```javascript
const SpamDetector = require('./spam-detector');
```

そして、`const aiHelper = new AIHelper(...);` の **下**に追加：

```javascript
const spamDetector = new SpamDetector(db);
```

---

#### ステップ2：/ai コマンドにスパムチェックを追加

**どこに書くか：**  
すでにある `/ai` コマンドの処理の **中**に、チェック処理を追加します。

具体的には、`if (interaction.commandName === 'ai') {` の **すぐ下**に追加してください。

**以下は修正後のイメージです：**

```javascript
const SpamDetector = require('./spam-detector');

// ... データベース初期化後 ...

const spamDetector = new SpamDetector(db);

// /ai コマンドに統合
if (interaction.commandName === 'ai') {
  const userId = interaction.user.id;
  const userMessage = interaction.options.getString('message');

  // スパムチェック
  const spamCheck = await spamDetector.isSpam(userId, userMessage);
  if (spamCheck.isSpam) {
    await interaction.reply({
      content: spamCheck.message,
      ephemeral: true
    });
    return;
  }

  // ... 既存のAI処理 ...
}
```

---

## 第2章：不適切コンテンツのフィルタリング（20分）

### 2-1. コンテンツフィルターモジュールの作成

`content-filter.js` を新規作成：

```javascript
class ContentFilter {
  constructor() {
    // 禁止ワードリスト（基本的なもの）
    this.blockedWords = [
      // 暴力的な表現
      '殺す', 'ぶっ殺す', '殺してやる',
      
      // 差別的な表現（例示のみ）
      // 実際の運用では、より詳細なリストを用意
      
      // Bot悪用
      'プロンプト', 'システムプロンプト', 'ignore all previous'
    ];

    // 繰り返しパターン
    this.spamPatterns = [
      /(.)\1{9,}/,  // 同じ文字10回以上
      /^[ｗwWW]{10,}$/,  // wwwww...
      /^[！!？?]{5,}$/  // !!!!! or ?????
    ];

    // AI ジェイルブレイク検出
    this.jailbreakPatterns = [
      /ignore\s+(all\s+)?previous/i,
      /プロンプトを無視/i,
      /you\s+are\s+now/i,
      /システムプロンプト/i,
      /新しい指示/i
    ];
  }

  // メッセージをフィルタリング
  filter(message) {
    const lowerMessage = message.toLowerCase();

    // 禁止ワードチェック
    for (const word of this.blockedWords) {
      if (lowerMessage.includes(word)) {
        return {
          allowed: false,
          reason: 'blocked_word',
          message: '❌ 不適切な表現が含まれています。'
        };
      }
    }

    // スパムパターンチェック
    for (const pattern of this.spamPatterns) {
      if (pattern.test(message)) {
        return {
          allowed: false,
          reason: 'spam_pattern',
          message: '🔁 意味のない繰り返しは避けてください。'
        };
      }
    }

    // ジェイルブレイクチェック
    for (const pattern of this.jailbreakPatterns) {
      if (pattern.test(message)) {
        return {
          allowed: false,
          reason: 'jailbreak_attempt',
          message: '⚠️ システムの指示を変更しようとしています。このBotはメンタルサポート専用です。'
        };
      }
    }

    // メッセージ長チェック
    if (message.length > 2000) {
      return {
        allowed: false,
        reason: 'too_long',
        message: '📏 メッセージが長すぎます（2000文字以内）。'
      };
    }

    return { allowed: true };
  }

  // URL検出
  hasURL(message) {
    const urlPattern = /(https?:\/\/[^\s]+)/g;
    return urlPattern.test(message);
  }

  // メンション検出
  hasMentions(message) {
    const mentionPattern = /<@!?\d+>/g;
    return mentionPattern.test(message);
  }
}

module.exports = ContentFilter;
```

---

### 2-2. index.js に統合

**ここで編集するファイル：** `index.js`

**何をするか：**  
2つのステップがあります。

**ステップ1：** ファイルの先頭で `content-filter.js` を読み込む  
**ステップ2：** `/ai` コマンドの処理の中にフィルタリングを追加する

---

#### ステップ1：ファイルの先頭に追加

**どこに書くか：**  
`index.js` の **一番上のほう**（`require` が並んでいるあたり）に追加します。

具体的には、`const SpamDetector = require('./spam-detector');` の **下**に追加：

```javascript
const ContentFilter = require('./content-filter');
```

そして、`const spamDetector = new SpamDetector(db);` の **下**に追加：

```javascript
const contentFilter = new ContentFilter();
```

---

#### ステップ2：/ai コマンドにフィルタリングを追加

**どこに書くか：**  
すでにある `/ai` コマンドの処理の **中**、スパムチェックの **下**に追加します。

**以下は修正後のイメージです（既存のスパムチェック + 新しいフィルタリング）：**

```javascript
const ContentFilter = require('./content-filter');

const contentFilter = new ContentFilter();

// /ai コマンドに統合
if (interaction.commandName === 'ai') {
  const userId = interaction.user.id;
  const userMessage = interaction.options.getString('message');

  // スパムチェック
  const spamCheck = await spamDetector.isSpam(userId, userMessage);
  if (spamCheck.isSpam) {
    await interaction.reply({
      content: spamCheck.message,
      ephemeral: true
    });
    
    // ログに記録
    const logStmt = db.prepare(`
      INSERT INTO moderation_logs (user_id, action, reason) 
      VALUES (?, 'message_blocked', ?)
    `);
    logStmt.run(userId, spamCheck.reason);
    
    return;
  }

  // コンテンツフィルタリング
  const filterResult = contentFilter.filter(userMessage);
  if (!filterResult.allowed) {
    await interaction.reply({
      content: filterResult.message,
      ephemeral: true
    });
    
    // ログに記録
    const logStmt = db.prepare(`
      INSERT INTO moderation_logs (user_id, action, reason) 
      VALUES (?, 'content_filtered', ?)
    `);
    logStmt.run(userId, filterResult.reason);
    
    return;
  }

  // ... 既存のAI処理 ...
}
```

---

## 第3章：モデレーション管理コマンド（20分）

### 3-1. コマンドの登録

`register-commands.js` に追加：

```javascript
{
  name: 'moderation',
  description: 'モデレーション機能（管理者のみ）',
  options: [
    {
      name: 'logs',
      description: 'モデレーションログを表示',
      type: 1,
      options: [
        {
          name: 'limit',
          description: '表示件数（デフォルト: 10）',
          type: 4,
          required: false
        }
      ]
    },
    {
      name: 'unban',
      description: 'ペナルティを解除',
      type: 1,
      options: [
        {
          name: 'user',
          description: '対象ユーザー',
          type: 6, // USER型
          required: true
        }
      ]
    },
    {
      name: 'stats',
      description: 'スパム統計を表示',
      type: 1
    },
    {
      name: 'add-word',
      description: '禁止ワードを追加',
      type: 1,
      options: [
        {
          name: 'word',
          description: '追加する禁止ワード',
          type: 3,
          required: true
        }
      ]
    }
  ]
}
```

**コマンド再登録：**
```bash
node register-commands.js
```

---

### 3-2. モデレーションコマンドの実装

ここで追加する処理は、**スラッシュコマンドを実行した瞬間**に動くものです。  
`index.js` を開き、`client.on('interactionCreate', ...)` を探してください。  
その中の `if (!interaction.isChatInputCommand()) return;` があるブロックが対象です。  
この章のコードは、基本的にその **ブロックの中**（他の `if (interaction.commandName === ...)` と同じ並び）に入れます。


```javascript
if (interaction.commandName === 'moderation') {
  // 管理者権限チェック
  if (!interaction.member.permissions.has('ManageMessages')) {
    await interaction.reply({ content: 'このコマンドは管理者のみ使用できます。', ephemeral: true });
    return;
  }

  const subcommand = interaction.options.getSubcommand();

  // ログ表示
  if (subcommand === 'logs') {
    const limit = interaction.options.getInteger('limit') || 10;
    
    const stmt = db.prepare(`
      SELECT user_id, action, reason, created_at 
      FROM moderation_logs 
      ORDER BY created_at DESC 
      LIMIT ?
    `);
    const logs = stmt.all(limit);

    if (logs.length === 0) {
      await interaction.reply('モデレーションログはありません。');
      return;
    }

    let message = `**📋 モデレーションログ（直近${limit}件）**\n\n`;
    logs.forEach(log => {
      const date = new Date(log.created_at).toLocaleString('ja-JP');
      message += `${date}\n`;
      message += `ユーザー: <@${log.user_id}>\n`;
      message += `アクション: ${log.action}\n`;
      message += `理由: ${log.reason}\n\n`;
    });

    await interaction.reply(message);
  }

  // ペナルティ解除
  if (subcommand === 'unban') {
    const targetUser = interaction.options.getUser('user');
    
    await spamDetector.removePenalty(targetUser.id);
    
    const logStmt = db.prepare(`
      INSERT INTO moderation_logs (user_id, action, reason, moderator_id) 
      VALUES (?, 'penalty_removed', 'manual_unban', ?)
    `);
    logStmt.run(targetUser.id, interaction.user.id);

    await interaction.reply(`✅ <@${targetUser.id}> のペナルティを解除しました。`);
  }

  // スパム統計
  if (subcommand === 'stats') {
    const stats = spamDetector.getStats();

    if (stats.length === 0) {
      await interaction.reply('過去7日間のスパム検出はありません。');
      return;
    }

    let message = '**📊 スパム統計（過去7日間）**\n\n';
    stats.forEach(stat => {
      const actionName = {
        high_frequency: '高頻度投稿',
        rapid_posting: '連投',
        repeated_content: '繰り返し'
      }[stat.action_type] || stat.action_type;

      message += `${actionName}: ${stat.count}回\n`;
    });

    await interaction.reply(message);
  }

  // 禁止ワード追加（簡易版）
  if (subcommand === 'add-word') {
    const word = interaction.options.getString('word');
    
    // 実際はデータベースに保存すべきですが、ここでは簡易的に
    contentFilter.blockedWords.push(word);
    
    await interaction.reply({
      content: `✅ 禁止ワード「${word}」を追加しました。\n⚠️ Bot再起動後は失われます。`,
      ephemeral: true
    });
  }
}
```

---

## 第4章：AI応答のモデレーション（15分）

### 4-1. AI応答のチェック

AI からの応答も不適切でないかチェックします：

```javascript
// ai-helper.js に追加
async chat(userMessage, context = []) {
  try {
    // ... 既存の処理 ...

    const result = await this.model.generateContent(fullPrompt);
    const response = await result.response;
    const text = response.text();

    // AI応答の安全性チェック
    if (this.containsUnsafeContent(text)) {
      return {
        success: false,
        message: '申し訳ありません。適切な応答を生成できませんでした。別の質問をお試しください。',
        filtered: true
      };
    }

    return {
      success: true,
      message: text,
      tokensUsed: response.usageMetadata?.totalTokenCount || 0
    };
  } catch (error) {
    // ... エラーハンドリング ...
  }
}

// 危険なコンテンツ検出
containsUnsafeContent(text) {
  const unsafePatterns = [
    /診断します?/,
    /薬を?.*?飲/,
    /病院に?.*?行くな/,
    /医師.*?必要ない/
  ];

  return unsafePatterns.some(pattern => pattern.test(text));
}
```

---

## 第5章：ユーザー通報機能（10分）

### 5-1. /report コマンドの登録

ここは「Discordにコマンドを登録する」ためのファイルです。  
`register-commands.js` を開き、`const commands = [` を探してください。  
この章で追加・変更するのは、基本的にこの **配列の中身**です（既存の配列を編集します）。


```javascript
{
  name: 'report',
  description: '不適切な動作を報告します',
  options: [
    {
      name: 'type',
      description: '報告の種類',
      type: 3,
      required: true,
      choices: [
        { name: 'スパム', value: 'spam' },
        { name: '不適切なAI応答', value: 'inappropriate_ai' },
        { name: 'バグ', value: 'bug' },
        { name: 'その他', value: 'other' }
      ]
    },
    {
      name: 'detail',
      description: '詳細（任意）',
      type: 3,
      required: false
    }
  ]
}
```

---

### 5-2. /report コマンドの実装

ここで追加する処理は、**スラッシュコマンドを実行した瞬間**に動くものです。  
`index.js` を開き、`client.on('interactionCreate', ...)` を探してください。  
その中の `if (!interaction.isChatInputCommand()) return;` があるブロックが対象です。  
この章のコードは、基本的にその **ブロックの中**（他の `if (interaction.commandName === ...)` と同じ並び）に入れます。


```javascript
if (interaction.commandName === 'report') {
  const reportType = interaction.options.getString('type');
  const detail = interaction.options.getString('detail') || 'なし';
  const userId = interaction.user.id;

  // 報告を記録
  const stmt = db.prepare(`
    INSERT INTO moderation_logs (user_id, action, reason) 
    VALUES (?, 'user_report', ?)
  `);
  stmt.run(userId, `${reportType}: ${detail}`);

  await interaction.reply({
    content: '✅ 報告を受け付けました。ご協力ありがとうございます。',
    ephemeral: true
  });

  // 管理者に通知（チャンネルIDは環境変数で設定）
  const adminChannelId = process.env.ADMIN_CHANNEL_ID;
  if (adminChannelId) {
    const adminChannel = await client.channels.fetch(adminChannelId);
    if (adminChannel) {
      await adminChannel.send(`🚨 **ユーザー報告**\n報告者: <@${userId}>\n種類: ${reportType}\n詳細: ${detail}`);
    }
  }
}
```

---

## 第6章：Git で記録（5分）

```bash
git add .
git commit -m "第7回: 荒らし対策+コンテンツフィルタリング実装"
git push
```

---

## ✅ この回のチェックリスト

- [ ] スパム検出が動作した
- [ ] コンテンツフィルタリングが動作した
- [ ] モデレーションログが記録された
- [ ] `/moderation` コマンドが動作した
- [ ] `/report` コマンドが動作した
- [ ] Git にコミット・プッシュできた

---

## 🔍 今日覚えること

### セキュリティの基本

- 多層防御（レイヤード・セキュリティ）
- ログの重要性
- ユーザー報告機能

### スパム対策

- 頻度制限
- パターン検出
- ペナルティシステム

### コンテンツモデレーション

- 禁止ワードリスト
- 正規表現パターン
- AI応答のチェック

---

## ⚠️ よくあるトラブル

### 誤検出が多い

**対処法：**
1. 閾値を調整
2. ホワイトリストを追加
3. モデレーションログで確認

---

### ペナルティが解除されない

**対処法：**
```javascript
await spamDetector.removePenalty(userId);
```

---

## 📊 モデレーションのベストプラクティス

### バランスが重要

- **厳しすぎる** → ユーザー体験が悪化
- **緩すぎる** → 荒らしが増える

### 定期的な見直し

1. モデレーションログを確認
2. 誤検出を分析
3. ルールを調整

### 透明性

- ペナルティ理由を明示
- 解除方法を案内
- フィードバックを受け付ける

---

## 🎓 発展課題（自習用）

1. **自動学習**
   - スパムパターンを自動検出

2. **段階的ペナルティ**
   - 初回: 警告
   - 2回目: 5分ペナルティ
   - 3回目: 1時間ペナルティ

3. **IP制限**
   - 同一IPからの大量アクセス検出

---

## 次回予告

### 第8回：エラーが起きても安全に終わる（フォールバック）

ここでは「落ちにくくする」ために、既存の処理の近くへ `try/catch` などを追加します。  
まず `index.js` で該当するコマンド処理（`interaction.commandName === ...`）を見つけ、  
その **処理の内側**に書き足す形で進めます。


本番環境を想定した堅牢性：
- エラーハンドリング
- リトライ処理
- ロールバック
- わざと危ない実装を体験

**👉 Bot が壊れない仕組みを作ります！**
---

## 📦 第7回の完成版ソースコード

### ファイル構成
```
git_practice/
├── .gitignore
├── .env
├── .env.example
├── package.json
├── index.js
├── register-commands.js
├── ai-helper.js
├── spam-detector.js（★新規）
└── content-filter.js（★新規）
```

---

### 新規ファイル：spam-detector.js
```javascript
class SpamDetector {
  constructor(db) {
    this.db = db;
    
    // スパム検出用テーブル
    db.exec(`
      CREATE TABLE IF NOT EXISTS spam_logs (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id TEXT NOT NULL,
        message_content TEXT,
        reason TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      )
    `);
    
    // ペナルティテーブル
    db.exec(`
      CREATE TABLE IF NOT EXISTS penalties (
        user_id TEXT PRIMARY KEY,
        count INTEGER DEFAULT 0,
        banned_until DATETIME
      )
    `);
  }

  async checkSpam(userId, message) {
    // 連投チェック
    const stmt = this.db.prepare(`
      SELECT COUNT(*) as count 
      FROM spam_logs 
      WHERE user_id = ? AND created_at > datetime('now', '-30 seconds')
    `);
    const { count } = stmt.get(userId);
    
    if (count >= 3) {
      this.addPenalty(userId, 'rapid_posting');
      return { isSpam: true, reason: '連投が検出されました' };
    }
    
    // 重複メッセージチェック
    const dupStmt = this.db.prepare(`
      SELECT message_content 
      FROM spam_logs 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 3
    `);
    const recent = dupStmt.all(userId);
    
    if (recent.length >= 3 && recent.every(r => r.message_content === message)) {
      this.addPenalty(userId, 'duplicate_messages');
      return { isSpam: true, reason: '同じメッセージの繰り返しが検出されました' };
    }
    
    // ログに記録
    const logStmt = this.db.prepare('INSERT INTO spam_logs (user_id, message_content) VALUES (?, ?)');
    logStmt.run(userId, message);
    
    return { isSpam: false };
  }

  addPenalty(userId, reason) {
    const stmt = this.db.prepare(`
      INSERT INTO penalties (user_id, count, banned_until) 
      VALUES (?, 1, datetime('now', '+5 minutes'))
      ON CONFLICT(user_id) DO UPDATE SET 
        count = count + 1,
        banned_until = datetime('now', '+' || (count * 5) || ' minutes')
    `);
    stmt.run(userId);
  }

  checkPenalty(userId) {
    const stmt = this.db.prepare('SELECT banned_until FROM penalties WHERE user_id = ?');
    const row = stmt.get(userId);
    
    if (!row) return { banned: false };
    
    const bannedUntil = new Date(row.banned_until);
    const now = new Date();
    
    if (now < bannedUntil) {
      const minutesLeft = Math.ceil((bannedUntil - now) / 60000);
      return { banned: true, minutesLeft };
    }
    
    return { banned: false };
  }

  removePenalty(userId) {
    const stmt = this.db.prepare('DELETE FROM penalties WHERE user_id = ?');
    stmt.run(userId);
  }
}

module.exports = SpamDetector;
```

---

### 新規ファイル：content-filter.js
```javascript
class ContentFilter {
  constructor() {
    this.bannedWords = [
      // 不適切な表現
      '死ね', 'クソ', 'バカ', 'アホ', 'カス',
      // 差別的表現
      // ...（実際には適切なリストを用意）
    ];
    
    this.sensitivePatterns = [
      /https?:\/\/[^\s]+/gi,  // URL
      /\d{10,}/,              // 長い数字（電話番号など）
      /@everyone/,            // メンション
      /@here/
    ];
  }

  check(message) {
    const lowerMessage = message.toLowerCase();
    
    // 禁止ワードチェック
    for (const word of this.bannedWords) {
      if (lowerMessage.includes(word)) {
        return {
          safe: false,
          reason: 'inappropriate_language',
          message: '不適切な表現が含まれています'
        };
      }
    }
    
    // パターンチェック
    for (const pattern of this.sensitivePatterns) {
      if (pattern.test(message)) {
        return {
          safe: false,
          reason: 'suspicious_pattern',
          message: '不適切なパターンが検出されました'
        };
      }
    }
    
    return { safe: true };
  }

  sanitize(message) {
    let sanitized = message;
    
    // URLを削除
    sanitized = sanitized.replace(/https?:\/\/[^\s]+/gi, '[URL削除]');
    
    // メンションを削除
    sanitized = sanitized.replace(/@(everyone|here)/gi, '[@$1]');
    
    return sanitized;
  }
}

module.exports = ContentFilter;
```

---

### index.js の変更点

**第6回のindex.jsをベースに以下を追加：**

**1. ファイル先頭に追加：**
```javascript
const SpamDetector = require('./spam-detector');
const ContentFilter = require('./content-filter');

const spamDetector = new SpamDetector(db);
const contentFilter = new ContentFilter();
```

**2. モデレーションログテーブルを追加：**
```javascript
db.exec(`
  CREATE TABLE IF NOT EXISTS moderation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    reason TEXT,
    moderator_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
```

**3. /ai コマンドにスパムチェックとフィルタリングを追加：**
```javascript
if (interaction.commandName === 'ai') {
  const userId = interaction.user.id;
  const userMessage = interaction.options.getString('message');

  // スパムチェック
  const penalty = spamDetector.checkPenalty(userId);
  if (penalty.banned) {
    await interaction.reply({ content: `⏸️ 現在ペナルティ中です。あと${penalty.minutesLeft}分お待ちください。`, ephemeral: true });
    return;
  }

  const spamCheck = await spamDetector.checkSpam(userId, userMessage);
  if (spamCheck.isSpam) {
    await interaction.reply({ content: `⚠️ ${spamCheck.reason}\n少し時間を置いてからお試しください。`, ephemeral: true });
    return;
  }

  // コンテンツフィルタリング
  const filterResult = contentFilter.check(userMessage);
  if (!filterResult.safe) {
    await interaction.reply({ content: `⛔ ${filterResult.message}`, ephemeral: true });
    return;
  }

  // 以降は第6回と同じAI処理
  // ...
}
```

**4. モデレーションコマンドを追加：**
```javascript
if (interaction.commandName === 'moderation') {
  if (!interaction.member.permissions.has('ManageMessages')) {
    await interaction.reply({ content: 'このコマンドは管理者のみ使用できます。', ephemeral: true });
    return;
  }

  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'logs') {
    const limit = interaction.options.getInteger('limit') || 10;
    const stmt = db.prepare(`SELECT * FROM moderation_logs ORDER BY created_at DESC LIMIT ?`);
    const logs = stmt.all(limit);
    
    if (logs.length === 0) {
      await interaction.reply('モデレーションログはありません。');
      return;
    }
    
    let message = `**📋 モデレーションログ（直近${limit}件）**\n\n`;
    logs.forEach(log => {
      const date = new Date(log.created_at).toLocaleString('ja-JP');
      message += `${date}\nユーザー: <@${log.user_id}>\nアクション: ${log.action}\n理由: ${log.reason}\n\n`;
    });
    
    await interaction.reply(message);
  }

  if (subcommand === 'unban') {
    const targetUser = interaction.options.getUser('user');
    await spamDetector.removePenalty(targetUser.id);
    const logStmt = db.prepare(`INSERT INTO moderation_logs (user_id, action, reason, moderator_id) VALUES (?, 'penalty_removed', 'manual_unban', ?)`);
    logStmt.run(targetUser.id, interaction.user.id);
    await interaction.reply(`✅ <@${targetUser.id}> のペナルティを解除しました。`);
  }
}
```

---

### register-commands.js の変更点

**commands配列に以下を追加：**
```javascript
{
  name: 'moderation',
  description: 'モデレーション機能（管理者のみ）',
  options: [
    {
      name: 'logs',
      description: 'モデレーションログを表示',
      type: 1,
      options: [{ name: 'limit', description: '表示件数', type: 4, required: false }]
    },
    {
      name: 'unban',
      description: 'ペナルティを解除',
      type: 1,
      options: [{ name: 'user', description: '対象ユーザー', type: 6, required: true }]
    }
  ]
},
{
  name: 'report',
  description: 'ユーザーを通報します',
  options: [
    { name: 'user', description: '通報するユーザー', type: 6, required: true },
    { name: 'reason', description: '理由', type: 3, required: true }
  ]
}
```

これで第7回は完成です！


---

### index.js（完全版）

```javascript
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const Database = require('better-sqlite3');
const AIHelper = require('./ai-helper');
const SpamDetector = require('./spam-detector');
const ContentFilter = require('./content-filter');

const db = new Database('bot.db');
const aiHelper = new AIHelper(process.env.GEMINI_API_KEY);
const spamDetector = new SpamDetector(db);
const contentFilter = new ContentFilter();

// 既存のテーブル（第6回と同じ）
db.exec(`
  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS feelings (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    feeling TEXT NOT NULL,
    note TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    key TEXT NOT NULL UNIQUE,
    content TEXT NOT NULL,
    category TEXT,
    created_by TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS keyword_responses (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    keyword TEXT NOT NULL,
    template_key TEXT NOT NULL,
    priority INTEGER DEFAULT 0,
    enabled INTEGER DEFAULT 1,
    FOREIGN KEY (template_key) REFERENCES templates(key)
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS ai_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`
  CREATE TABLE IF NOT EXISTS rate_limits (
    user_id TEXT PRIMARY KEY,
    count INTEGER DEFAULT 0,
    reset_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// モデレーションログテーブル（第7回で追加）
db.exec(`
  CREATE TABLE IF NOT EXISTS moderation_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    action TEXT NOT NULL,
    reason TEXT,
    moderator_id TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

db.exec(`DELETE FROM ai_conversations WHERE created_at < datetime('now', '-24 hours')`);

console.log('データベース準備完了');

// 初期テンプレートを登録
function initializeTemplates() {
  const defaultTemplates = [
    { key: 'breathe', content: '🌬️ **深呼吸してみましょう**\n\n4秒吸って... 7秒止めて... 8秒かけて吐く...\n\nゆっくり3回繰り返してみてください。', category: 'relaxation' },
    { key: 'comfort', content: '🤗 **大丈夫です**\n\n辛い気持ち、よく話してくれましたね。\nあなたは一人じゃありません。\n少しずつ、一緒に乗り越えていきましょう。', category: 'comfort' },
    { key: 'emergency', content: '📞 **緊急連絡先**\n\n• いのちの電話: 0570-783-556 (24時間)\n• こころの健康相談: 0570-064-556\n• SNS相談: https://www.mhlw.go.jp/mamorouyokokoro/\n\n一人で抱え込まないでください。', category: 'emergency' },
    { key: 'grounding', content: '🌍 **グラウンディング法**\n\n周りを見渡して、次のものを探してみてください：\n• 5つの見えるもの\n• 4つの触れるもの\n• 3つの聞こえる音\n• 2つの匂い\n• 1つの味\n\n「今ここ」に戻ってきましょう。', category: 'relaxation' }
  ];
  const insertStmt = db.prepare(`INSERT OR IGNORE INTO templates (key, content, category) VALUES (?, ?, ?)`);
  defaultTemplates.forEach(template => { insertStmt.run(template.key, template.content, template.category); });
  console.log('初期テンプレート準備完了');
}

function initializeKeywords() {
  const defaultKeywords = [
    { keyword: '辛い', template_key: 'comfort', priority: 10 },
    { keyword: 'つらい', template_key: 'comfort', priority: 10 },
    { keyword: '苦しい', template_key: 'breathe', priority: 8 },
    { keyword: '息苦しい', template_key: 'breathe', priority: 10 },
    { keyword: 'パニック', template_key: 'grounding', priority: 10 },
    { keyword: '死にたい', template_key: 'emergency', priority: 100 },
    { keyword: '消えたい', template_key: 'emergency', priority: 100 }
  ];
  const insertStmt = db.prepare(`INSERT OR IGNORE INTO keyword_responses (keyword, template_key, priority) VALUES (?, ?, ?)`);
  defaultKeywords.forEach(kw => { insertStmt.run(kw.keyword, kw.template_key, kw.priority); });
  console.log('キーワード反応準備完了');
}

initializeTemplates();
initializeKeywords();

function checkRateLimit(userId) {
  const now = new Date();
  const stmt = db.prepare('SELECT count, reset_at FROM rate_limits WHERE user_id = ?');
  const row = stmt.get(userId);
  if (!row) {
    const insertStmt = db.prepare('INSERT INTO rate_limits (user_id, count, reset_at) VALUES (?, 1, datetime("now", "+1 hour"))');
    insertStmt.run(userId);
    return { allowed: true, remaining: 9 };
  }
  const resetAt = new Date(row.reset_at);
  if (now >= resetAt) {
    const updateStmt = db.prepare('UPDATE rate_limits SET count = 1, reset_at = datetime("now", "+1 hour") WHERE user_id = ?');
    updateStmt.run(userId);
    return { allowed: true, remaining: 9 };
  }
  if (row.count >= 10) {
    const minutesLeft = Math.ceil((resetAt - now) / 60000);
    return { allowed: false, minutesLeft };
  }
  const updateStmt = db.prepare('UPDATE rate_limits SET count = count + 1 WHERE user_id = ?');
  updateStmt.run(userId);
  return { allowed: true, remaining: 10 - row.count - 1 };
}

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

const client = new Client({
  intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMessages, GatewayIntentBits.MessageContent]
});

client.once('ready', () => {
  console.log(`${client.user.tag} でログインしました！`);
});

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

  if (interaction.commandName === 'feeling') {
    const userId = interaction.user.id;
    const feeling = interaction.options.getString('mood');
    const note = interaction.options.getString('note') || null;
    const stmt = db.prepare('INSERT INTO feelings (user_id, feeling, note) VALUES (?, ?, ?)');
    stmt.run(userId, feeling, note);
    const countStmt = db.prepare('SELECT COUNT(*) as count FROM feelings WHERE user_id = ?');
    const { count } = countStmt.get(userId);
    const emoji = { great: '😊', good: '🙂', okay: '😐', down: '😔', bad: '😢' }[feeling] || '📝';
    let message = `今日の気分を記録しました ${emoji} (累計: ${count}回目)`;
    if (note) message += `\nメモ: ${note}`;
    await interaction.reply(message);
  }

  if (interaction.commandName === 'count') {
    const userId = interaction.user.id;
    const totalStmt = db.prepare('SELECT COUNT(*) as count FROM feelings WHERE user_id = ?');
    const { count: totalCount } = totalStmt.get(userId);
    if (totalCount === 0) {
      await interaction.reply('まだ記録がありません。/feeling で気分を記録してみましょう！');
      return;
    }
    const todayStmt = db.prepare(`SELECT COUNT(*) as count FROM feelings WHERE user_id = ? AND DATE(created_at) = DATE('now', 'localtime')`);
    const { count: todayCount } = todayStmt.get(userId);
    const weekStmt = db.prepare(`SELECT COUNT(*) as count FROM feelings WHERE user_id = ? AND DATE(created_at) >= DATE('now', '-7 days', 'localtime')`);
    const { count: weekCount } = weekStmt.get(userId);
    const feelingStmt = db.prepare(`SELECT feeling, COUNT(*) as count FROM feelings WHERE user_id = ? GROUP BY feeling`);
    const feelingCounts = feelingStmt.all(userId);
    const latestStmt = db.prepare(`SELECT feeling, note, created_at FROM feelings WHERE user_id = ? ORDER BY created_at DESC LIMIT 1`);
    const latest = latestStmt.get(userId);
    const timeDiff = getTimeDiff(latest.created_at);
    const emojiMap = { great: '😊', good: '🙂', okay: '😐', down: '😔', bad: '😢' };
    let message = '**あなたの記録**\n';
    message += `📊 総記録数: ${totalCount}回\n📅 今日の記録: ${todayCount}回\n📆 過去7日間: ${weekCount}回\n\n**気分の内訳**\n`;
    feelingCounts.forEach(({ feeling, count }) => {
      const emoji = emojiMap[feeling] || '📝';
      const percentage = Math.round((count / totalCount) * 100);
      message += `${emoji} ${feeling}: ${count}回 (${percentage}%)\n`;
    });
    message += `\n最終記録: ${latest.feeling} (${timeDiff})`;
    if (latest.note) message += `\nメモ: ${latest.note}`;
    await interaction.reply(message);
  }

  if (interaction.commandName === 'template') {
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'get') {
      const key = interaction.options.getString('key');
      const stmt = db.prepare('SELECT content FROM templates WHERE key = ?');
      const row = stmt.get(key);
      if (row) {
        await interaction.reply(row.content);
      } else {
        await interaction.reply(`テンプレート '${key}' が見つかりません。/template list で一覧を確認してください。`);
      }
    }
    if (subcommand === 'list') {
      const stmt = db.prepare('SELECT key, category FROM templates ORDER BY category, key');
      const templates = stmt.all();
      if (templates.length === 0) {
        await interaction.reply('登録されているテンプレートはありません。');
        return;
      }
      const grouped = {};
      templates.forEach(t => {
        const cat = t.category || 'その他';
        if (!grouped[cat]) grouped[cat] = [];
        grouped[cat].push(t.key);
      });
      let message = '**📝 登録されているテンプレート**\n\n';
      for (const [category, keys] of Object.entries(grouped)) {
        message += `**${category}**\n`;
        keys.forEach(key => { message += `• \`${key}\`\n`; });
        message += '\n';
      }
      message += '使い方: `/template get <キー>`';
      await interaction.reply(message);
    }
    if (subcommand === 'add') {
      if (!interaction.member.permissions.has('ManageMessages')) {
        await interaction.reply({ content: 'このコマンドは管理者のみ使用できます。', ephemeral: true });
        return;
      }
      const key = interaction.options.getString('key');
      const content = interaction.options.getString('content');
      const category = interaction.options.getString('category') || 'その他';
      const createdBy = interaction.user.id;
      try {
        const stmt = db.prepare(`INSERT INTO templates (key, content, category, created_by) VALUES (?, ?, ?, ?)`);
        stmt.run(key, content, category, createdBy);
        await interaction.reply(`✅ テンプレート '${key}' を登録しました。`);
      } catch (error) {
        if (error.message.includes('UNIQUE')) {
          await interaction.reply({ content: `❌ テンプレート '${key}' は既に存在します。`, ephemeral: true });
        } else {
          await interaction.reply({ content: '❌ 登録に失敗しました。', ephemeral: true });
        }
      }
    }
    if (subcommand === 'delete') {
      if (!interaction.member.permissions.has('ManageMessages')) {
        await interaction.reply({ content: 'このコマンドは管理者のみ使用できます。', ephemeral: true });
        return;
      }
      const key = interaction.options.getString('key');
      const stmt = db.prepare('DELETE FROM templates WHERE key = ?');
      const result = stmt.run(key);
      if (result.changes > 0) {
        await interaction.reply(`✅ テンプレート '${key}' を削除しました。`);
      } else {
        await interaction.reply({ content: `❌ テンプレート '${key}' が見つかりません。`, ephemeral: true });
      }
    }
  }

  if (interaction.commandName === 'sos') {
    const stmt = db.prepare('SELECT content FROM templates WHERE key = ?');
    const row = stmt.get('emergency');
    if (row) {
      await interaction.reply(row.content);
    } else {
      await interaction.reply('📞 緊急連絡先\n\n• いのちの電話: 0570-783-556 (24時間)\n• こころの健康相談: 0570-064-556\n\n一人で抱え込まないでください。');
    }
  }

  if (interaction.commandName === 'keyword') {
    if (!interaction.member.permissions.has('ManageMessages')) {
      await interaction.reply({ content: 'このコマンドは管理者のみ使用できます。', ephemeral: true });
      return;
    }
    const subcommand = interaction.options.getSubcommand();
    if (subcommand === 'add') {
      const keyword = interaction.options.getString('keyword');
      const templateKey = interaction.options.getString('template');
      const priority = interaction.options.getInteger('priority') || 5;
      const checkStmt = db.prepare('SELECT key FROM templates WHERE key = ?');
      if (!checkStmt.get(templateKey)) {
        await interaction.reply({ content: `❌ テンプレート '${templateKey}' が見つかりません。`, ephemeral: true });
        return;
      }
      const stmt = db.prepare(`INSERT INTO keyword_responses (keyword, template_key, priority) VALUES (?, ?, ?)`);
      stmt.run(keyword, templateKey, priority);
      await interaction.reply(`✅ キーワード '${keyword}' を登録しました（優先度: ${priority}）`);
    }
    if (subcommand === 'list') {
      const stmt = db.prepare(`SELECT id, keyword, template_key, priority, enabled FROM keyword_responses ORDER BY priority DESC, keyword`);
      const keywords = stmt.all();
      if (keywords.length === 0) {
        await interaction.reply('登録されているキーワードはありません。');
        return;
      }
      let message = '**🔑 登録されているキーワード**\n\n';
      keywords.forEach(kw => {
        const status = kw.enabled ? '✅' : '❌';
        message += `${status} ID:${kw.id} | 「${kw.keyword}」 → \`${kw.template_key}\` (優先度: ${kw.priority})\n`;
      });
      await interaction.reply(message);
    }
    if (subcommand === 'delete') {
      const id = interaction.options.getInteger('id');
      const stmt = db.prepare('DELETE FROM keyword_responses WHERE id = ?');
      const result = stmt.run(id);
      if (result.changes > 0) {
        await interaction.reply(`✅ キーワードID ${id} を削除しました。`);
      } else {
        await interaction.reply({ content: `❌ キーワードID ${id} が見つかりません。`, ephemeral: true });
      }
    }
  }

  // AI機能（第7回ではスパムチェックとコンテンツフィルタリングを追加）
  if (interaction.commandName === 'ai') {
    const userId = interaction.user.id;
    const userMessage = interaction.options.getString('message');

    // スパムチェック
    const penalty = spamDetector.checkPenalty(userId);
    if (penalty.banned) {
      await interaction.reply({ 
        content: `⏸️ 現在ペナルティ中です。あと${penalty.minutesLeft}分お待ちください。`, 
        ephemeral: true 
      });
      return;
    }

    const spamCheck = await spamDetector.checkSpam(userId, userMessage);
    if (spamCheck.isSpam) {
      await interaction.reply({ 
        content: `⚠️ ${spamCheck.reason}\n少し時間を置いてからお試しください。`, 
        ephemeral: true 
      });
      return;
    }

    // コンテンツフィルタリング
    const filterResult = contentFilter.check(userMessage);
    if (!filterResult.safe) {
      await interaction.reply({ 
        content: `⛔ ${filterResult.message}`, 
        ephemeral: true 
      });
      return;
    }

    // レート制限チェック
    const rateLimit = checkRateLimit(userId);
    if (!rateLimit.allowed) {
      await interaction.reply({ 
        content: `⏰ 1時間に10回までです。あと${rateLimit.minutesLeft}分後に再度お試しください。`, 
        ephemeral: true 
      });
      return;
    }

    // 緊急キーワード検出
    if (aiHelper.detectEmergency(userMessage)) {
      await interaction.reply('⚠️ もしもの時は一人で抱え込まないでください。\n`/sos` で緊急連絡先を確認できます。\n\nそれでもお話を聞かせていただきますね...');
    }

    await interaction.deferReply();

    const historyStmt = db.prepare(`SELECT role, content FROM ai_conversations WHERE user_id = ? ORDER BY created_at DESC LIMIT 10`);
    const history = historyStmt.all(userId).reverse();
    const aiResponse = await aiHelper.chat(userMessage, history);

    const saveStmt = db.prepare('INSERT INTO ai_conversations (user_id, role, content) VALUES (?, ?, ?)');
    saveStmt.run(userId, 'user', userMessage);
    saveStmt.run(userId, 'assistant', aiResponse.message);

    await interaction.editReply(aiResponse.message + `\n\n_（残り ${rateLimit.remaining} 回）_`);
  }

  if (interaction.commandName === 'ai-reset') {
    const userId = interaction.user.id;
    const stmt = db.prepare('DELETE FROM ai_conversations WHERE user_id = ?');
    const result = stmt.run(userId);
    await interaction.reply(`✅ 会話履歴を削除しました（${result.changes}件）`);
  }

  if (interaction.commandName === 'ai-stats') {
    if (!interaction.member.permissions.has('ManageMessages')) {
      await interaction.reply({ content: 'このコマンドは管理者のみ使用できます。', ephemeral: true });
      return;
    }
    const totalStmt = db.prepare('SELECT COUNT(*) as count FROM ai_conversations');
    const { count: totalConversations } = totalStmt.get();
    const todayStmt = db.prepare(`SELECT COUNT(*) as count FROM ai_conversations WHERE DATE(created_at) = DATE('now', 'localtime')`);
    const { count: todayConversations } = todayStmt.get();
    const usersStmt = db.prepare('SELECT COUNT(DISTINCT user_id) as count FROM ai_conversations');
    const { count: uniqueUsers } = usersStmt.get();
    let message = '**📊 AI使用統計**\n\n総会話数: ${totalConversations}回\n今日の会話数: ${todayConversations}回\n利用ユーザー数: ${uniqueUsers}人\n';
    await interaction.reply(message);
  }

  // モデレーションコマンド（第7回で追加）
  if (interaction.commandName === 'moderation') {
    if (!interaction.member.permissions.has('ManageMessages')) {
      await interaction.reply({ content: 'このコマンドは管理者のみ使用できます。', ephemeral: true });
      return;
    }

    const subcommand = interaction.options.getSubcommand();

    if (subcommand === 'logs') {
      const limit = interaction.options.getInteger('limit') || 10;
      const stmt = db.prepare(`SELECT * FROM moderation_logs ORDER BY created_at DESC LIMIT ?`);
      const logs = stmt.all(limit);
      
      if (logs.length === 0) {
        await interaction.reply('モデレーションログはありません。');
        return;
      }
      
      let message = `**📋 モデレーションログ（直近${limit}件）**\n\n`;
      logs.forEach(log => {
        const date = new Date(log.created_at).toLocaleString('ja-JP');
        message += `${date}\nユーザー: <@${log.user_id}>\nアクション: ${log.action}\n理由: ${log.reason}\n\n`;
      });
      
      await interaction.reply(message);
    }

    if (subcommand === 'unban') {
      const targetUser = interaction.options.getUser('user');
      await spamDetector.removePenalty(targetUser.id);
      const logStmt = db.prepare(`INSERT INTO moderation_logs (user_id, action, reason, moderator_id) VALUES (?, 'penalty_removed', 'manual_unban', ?)`);
      logStmt.run(targetUser.id, interaction.user.id);
      await interaction.reply(`✅ <@${targetUser.id}> のペナルティを解除しました。`);
    }
  }

  // 通報コマンド（第7回で追加）
  if (interaction.commandName === 'report') {
    const targetUser = interaction.options.getUser('user');
    const reason = interaction.options.getString('reason');
    
    const logStmt = db.prepare(`INSERT INTO moderation_logs (user_id, action, reason, moderator_id) VALUES (?, 'user_reported', ?, ?)`);
    logStmt.run(targetUser.id, reason, interaction.user.id);
    
    await interaction.reply({ content: '✅ 通報を受け付けました。管理者が確認します。', ephemeral: true });
  }
});

// オートコンプリート
client.on('interactionCreate', async interaction => {
  if (!interaction.isAutocomplete()) return;
  if (interaction.commandName === 'template') {
    const focusedValue = interaction.options.getFocused();
    const stmt = db.prepare('SELECT key FROM templates WHERE key LIKE ? LIMIT 25');
    const choices = stmt.all(`%${focusedValue}%`);
    await interaction.respond(choices.map(choice => ({ name: choice.key, value: choice.key })));
  }
});

// メッセージイベント
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (message.system) return;
  const content = message.content.toLowerCase();
  const stmt = db.prepare(`
    SELECT kr.keyword, kr.template_key, kr.priority, t.content 
    FROM keyword_responses kr
    JOIN templates t ON kr.template_key = t.key
    WHERE kr.enabled = 1 AND LOWER(?) LIKE '%' || LOWER(kr.keyword) || '%'
    ORDER BY kr.priority DESC, kr.keyword DESC LIMIT 1
  `);
  const match = stmt.get(content);
  if (match) {
    if (match.priority >= 100) {
      await message.reply(match.content);
      return;
    }
    if (match.priority >= 10) {
      await message.reply({ content: `${match.content}\n\n必要であれば \`/sos\` で緊急連絡先を確認できます。`, allowedMentions: { repliedUser: false } });
      return;
    }
    await message.reply({ content: `💡 \`/template get ${match.template_key}\` が役立つかもしれません。`, allowedMentions: { repliedUser: false } });
  }
});

client.login(process.env.DISCORD_TOKEN);
```

これで第7回は完成です！
