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

本番環境を想定した堅牢性：
- エラーハンドリング
- リトライ処理
- ロールバック
- わざと危ない実装を体験

**👉 Bot が壊れない仕組みを作ります！**
