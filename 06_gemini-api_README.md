# 第6回：AI を利用する（Gemini API 登録）+ サンプルの実行

Bot に **AI の力** を加えます。  
Gemini API を使って、Bot が文脈を理解して応答できるようにします。

---

## 📌 この回の目標

- Gemini API を登録・設定する
- Bot に AI 会話機能を追加する
- コンテキストを考慮した応答を実装する
- メンタルサポートに特化したプロンプトを設定する

**💡 ポイント：**
- AI は「万能」ではなく「補助」として使う
- 適切なプロンプト設計が重要
- コスト管理も意識する

---

## 🎯 完成イメージ

```
ユーザー: 最近、寝れなくて困ってます
Bot: 🤖 睡眠に困っているんですね。それは辛いですよね。
     いくつか質問させてください：
     
     1. どのくらいの期間続いていますか？
     2. 寝る前に何か気になることはありますか？
     3. 昼間の眠気はどうですか？
     
     少しずつ一緒に考えていきましょう。
     
     急ぎの場合は `/sos` で専門機関の連絡先を確認できます。

ユーザー: 1週間くらいです。仕事のことが気になって...
Bot: 🤖 1週間続いているんですね。仕事のことが頭から離れないと、
     休まる時間がないですよね...
```

**👉 Bot が「理解して」応答するようになります**

---

## 📚 事前準備

### 必要なもの

- ✅ 第5回までの完成プロジェクト
- ✅ Google アカウント
- ✅ クレジットカード（無料枠内でOK）

---

## 第1章：Gemini API の登録（15分）

### 1-1. Google AI Studio にアクセス

1. [Google AI Studio](https://makersuite.google.com/app/apikey) にアクセス
2. Google アカウントでログイン

---

### 1-2. API キーを作成

1. **Get API key** をクリック
2. **Create API key** をクリック
3. プロジェクトを選択（または新規作成）
4. API キーが表示されるので **コピーして保存**

**⚠️ 超重要：**
- このキーは絶対に他人に見せない
- GitHub にアップロードしない
- `.env` ファイルに保存する

---

### 1-3. 料金について

**Gemini API の料金（2025年時点）：**
- 無料枠: 1日 1,500リクエストまで
- 1分あたり 15リクエストまで

**このハンズオンでの使用量：**
- テスト: 数十リクエスト程度
- 実運用: 1日100-200リクエスト想定

**👉 無料枠で十分使えます**

---

### 1-4. .env に API キーを追加

ここはトークンなどの設定値を置く場所です。  
プロジェクト直下の `.env` を開き、`DISCORD_TOKEN=...` がある行の近くに追加します。  
※ 実トークンは README には貼らず、`.env` にだけ入れるのが安全です。


```bash
DISCORD_TOKEN=あなたのトークン
CLIENT_ID=あなたのアプリケーションID
GUILD_ID=あなたのサーバーID
GEMINI_API_KEY=あなたのGemini APIキー
```

---

## 第2章：Gemini API の基本的な使い方（15分）

### 2-1. 必要なパッケージをインストール

```bash
npm install @google/generative-ai
```

---

### 2-2. 簡単な動作確認スクリプト

`test-gemini.js` を作成して動作確認します：

```javascript
require('dotenv').config();
const { GoogleGenerativeAI } = require('@google/generative-ai');

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function testGemini() {
  try {
    const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    const prompt = 'こんにちは！あなたは誰ですか？';
    const result = await model.generateContent(prompt);
    const response = await result.response;
    const text = response.text();
    
    console.log('AI応答:', text);
  } catch (error) {
    console.error('エラー:', error);
  }
}

testGemini();
```

**実行：**
```bash
node test-gemini.js
```

**✅ AI からの応答が表示されれば成功です！**

---

## 第3章：Bot に AI 機能を追加（25分）

### 3-1. AI モジュールの作成

`ai-helper.js` を作成：

```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIHelper {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
    // システムプロンプト（Bot の役割定義）
    this.systemPrompt = `あなたはメンタルヘルスサポートのための優しいチャットボットです。

【あなたの役割】
- ユーザーの気持ちに寄り添い、共感的に応答する
- 専門的な診断や治療はしない（できない）
- 必要に応じて専門機関への相談を勧める
- 簡単な対処法や呼吸法などを提案する

【応答のルール】
1. 短く、分かりやすく（200文字以内）
2. 共感を示す（「そうなんですね」「辛いですよね」など）
3. 押し付けない（「〜してみてはいかがでしょうか」など）
4. 緊急性を感じたら /sos コマンドを案内する

【禁止事項】
- 診断（「うつ病です」など）
- 薬の推奨
- 過度な励まし（「頑張れ」など）
- カジュアルすぎる言葉遣い`;
  }

  async chat(userMessage, context = []) {
    try {
      // プロンプトを組み立て
      let fullPrompt = this.systemPrompt + '\n\n';
      
      // 会話履歴を追加
      if (context.length > 0) {
        fullPrompt += '【これまでの会話】\n';
        context.forEach(msg => {
          fullPrompt += `${msg.role}: ${msg.content}\n`;
        });
        fullPrompt += '\n';
      }
      
      fullPrompt += `ユーザー: ${userMessage}\n\nあなたの応答:`;
      
      // AI に送信
      const result = await this.model.generateContent(fullPrompt);
      const response = await result.response;
      const text = response.text();
      
      return {
        success: true,
        message: text,
        tokensUsed: response.usageMetadata?.totalTokenCount || 0
      };
    } catch (error) {
      console.error('AI Error:', error);
      
      return {
        success: false,
        message: '申し訳ありません。今、少し考えがまとまりません... もう一度お話しいただけますか？',
        error: error.message
      };
    }
  }

  // 緊急キーワードの検出
  detectEmergency(message) {
    const emergencyKeywords = [
      '死にたい', '消えたい', '自殺', '死ぬ',
      '終わりにしたい', 'もう無理', '限界'
    ];
    
    const lowerMessage = message.toLowerCase();
    return emergencyKeywords.some(keyword => lowerMessage.includes(keyword));
  }
}

module.exports = AIHelper;
```

---

### 3-2. 会話履歴を管理するテーブル

`index.js` に追加：

```javascript
// AI会話履歴用テーブル
db.exec(`
  CREATE TABLE IF NOT EXISTS ai_conversations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id TEXT NOT NULL,
    role TEXT NOT NULL,
    content TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 古い会話履歴を削除（24時間以上前）
db.exec(`
  DELETE FROM ai_conversations 
  WHERE created_at < datetime('now', '-24 hours')
`);
```

---

### 3-3. /ai コマンドの登録

`register-commands.js` に追加：

```javascript
{
  name: 'ai',
  description: 'AIと会話します',
  options: [
    {
      name: 'message',
      description: 'AIに送るメッセージ',
      type: 3,
      required: true
    }
  ]
},
{
  name: 'ai-reset',
  description: 'AI会話履歴をリセットします'
}
```

**コマンド再登録：**
```bash
node register-commands.js
```

---

### 3-4. index.js に AI 機能を統合

```javascript
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const Database = require('better-sqlite3');
const AIHelper = require('./ai-helper');

const db = new Database('bot.db');
const aiHelper = new AIHelper(process.env.GEMINI_API_KEY);

// ... データベース初期化 ...

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
});

// ... 既存のコマンド処理 ...

client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // ... 既存のコマンド ...

  // /ai コマンド
  if (interaction.commandName === 'ai') {
    const userMessage = interaction.options.getString('message');
    const userId = interaction.user.id;

    // 緊急キーワードチェック
    if (aiHelper.detectEmergency(userMessage)) {
      await interaction.reply({
        content: '⚠️ 緊急性の高い内容を検出しました。\n\n' +
                 'すぐに専門機関に相談してください。\n' +
                 '`/sos` で連絡先を確認できます。\n\n' +
                 'あなたは一人ではありません。必ず助けを求めてください。',
        ephemeral: false
      });
      return;
    }

    // 「考え中...」と表示
    await interaction.deferReply();

    // 会話履歴を取得（直近5件）
    const historyStmt = db.prepare(`
      SELECT role, content 
      FROM ai_conversations 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 5
    `);
    const history = historyStmt.all(userId).reverse();

    // AI に送信
    const result = await aiHelper.chat(userMessage, history);

    if (result.success) {
      // 会話を保存
      const saveStmt = db.prepare(`
        INSERT INTO ai_conversations (user_id, role, content) 
        VALUES (?, ?, ?)
      `);
      saveStmt.run(userId, 'user', userMessage);
      saveStmt.run(userId, 'assistant', result.message);

      await interaction.editReply(`🤖 ${result.message}`);
    } else {
      await interaction.editReply(result.message);
    }
  }

  // /ai-reset コマンド
  if (interaction.commandName === 'ai-reset') {
    const userId = interaction.user.id;
    
    const stmt = db.prepare('DELETE FROM ai_conversations WHERE user_id = ?');
    const result = stmt.run(userId);

    await interaction.reply({
      content: `✅ AI会話履歴をリセットしました（${result.changes}件削除）`,
      ephemeral: true
    });
  }
});
```

---

### 3-5. 動作確認

```bash
node index.js
```

Discord で試してください：

```
/ai message:最近、眠れなくて困っています
→ Bot: 🤖 [AIからの共感的な応答]

/ai message:どうしたらいいでしょうか
→ Bot: 🤖 [前の文脈を踏まえた提案]

/ai-reset
→ Bot: ✅ AI会話履歴をリセットしました
```

**✅ AI が文脈を理解して応答すれば成功です！**

---

## 第4章：レート制限とコスト管理（15分）

### 4-1. レート制限テーブルの作成

ここはデータベース（SQLite）の準備をする場所です。  
`index.js` の上のほうにある `const db = new Database(...)` と `db.exec(` が並んでいるあたりを探してください。  
テーブル作成や初期化のコードは、基本的にこの **DB準備のかたまりの中**に置きます。


```javascript
// レート制限用テーブル
db.exec(`
  CREATE TABLE IF NOT EXISTS rate_limits (
    user_id TEXT PRIMARY KEY,
    request_count INTEGER DEFAULT 0,
    last_reset DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);
```

---

### 4-2. レート制限の実装

```javascript
// レート制限をチェックする関数
function checkRateLimit(userId, maxRequests = 20, windowMinutes = 60) {
  const stmt = db.prepare(`
    SELECT request_count, last_reset 
    FROM rate_limits 
    WHERE user_id = ?
  `);
  let limit = stmt.get(userId);

  const now = new Date();

  if (!limit) {
    // 初回
    const insertStmt = db.prepare(`
      INSERT INTO rate_limits (user_id, request_count, last_reset) 
      VALUES (?, 1, ?)
    `);
    insertStmt.run(userId, now.toISOString());
    return { allowed: true, remaining: maxRequests - 1 };
  }

  const lastReset = new Date(limit.last_reset);
  const minutesPassed = (now - lastReset) / 60000;

  // ウィンドウがリセット
  if (minutesPassed >= windowMinutes) {
    const resetStmt = db.prepare(`
      UPDATE rate_limits 
      SET request_count = 1, last_reset = ? 
      WHERE user_id = ?
    `);
    resetStmt.run(now.toISOString(), userId);
    return { allowed: true, remaining: maxRequests - 1 };
  }

  // 制限内
  if (limit.request_count < maxRequests) {
    const updateStmt = db.prepare(`
      UPDATE rate_limits 
      SET request_count = request_count + 1 
      WHERE user_id = ?
    `);
    updateStmt.run(userId);
    return { allowed: true, remaining: maxRequests - limit.request_count - 1 };
  }

  // 制限超過
  const resetIn = Math.ceil(windowMinutes - minutesPassed);
  return { allowed: false, remaining: 0, resetIn };
}
```

---

### 4-3. /ai コマンドにレート制限を追加

ここで追加する処理は、**スラッシュコマンドを実行した瞬間**に動くものです。  
`index.js` を開き、`client.on('interactionCreate', ...)` を探してください。  
その中の `if (!interaction.isChatInputCommand()) return;` があるブロックが対象です。  
この章のコードは、基本的にその **ブロックの中**（他の `if (interaction.commandName === ...)` と同じ並び）に入れます。


```javascript
if (interaction.commandName === 'ai') {
  const userId = interaction.user.id;
  
  // レート制限チェック
  const rateLimit = checkRateLimit(userId, 20, 60); // 60分で20回まで
  
  if (!rateLimit.allowed) {
    await interaction.reply({
      content: `⏰ AI利用の制限に達しました。\n${rateLimit.resetIn}分後にリセットされます。`,
      ephemeral: true
    });
    return;
  }

  const userMessage = interaction.options.getString('message');

  // ... 既存の処理 ...

  // 成功時に残り回数を表示（オプション）
  if (result.success && rateLimit.remaining <= 5) {
    await interaction.followUp({
      content: `💡 残り ${rateLimit.remaining} 回利用可能です`,
      ephemeral: true
    });
  }
}
```

---

## 第5章：AI 使用状況の可視化（10分）

### 5-1. /ai-stats コマンドの登録

`register-commands.js` に追加：

```javascript
{
  name: 'ai-stats',
  description: 'AI使用状況を表示します（管理者のみ）'
}
```

---

### 5-2. 統計表示の実装

```javascript
if (interaction.commandName === 'ai-stats') {
  if (!interaction.member.permissions.has('ManageMessages')) {
    await interaction.reply({ content: 'このコマンドは管理者のみ使用できます。', ephemeral: true });
    return;
  }

  // 総会話数
  const totalStmt = db.prepare('SELECT COUNT(*) as count FROM ai_conversations');
  const { count: totalConversations } = totalStmt.get();

  // 本日の会話数
  const todayStmt = db.prepare(`
    SELECT COUNT(*) as count 
    FROM ai_conversations 
    WHERE DATE(created_at) = DATE('now', 'localtime')
  `);
  const { count: todayConversations } = todayStmt.get();

  // ユニークユーザー数
  const usersStmt = db.prepare('SELECT COUNT(DISTINCT user_id) as count FROM ai_conversations');
  const { count: uniqueUsers } = usersStmt.get();

  let message = '**📊 AI使用統計**\n\n';
  message += `総会話数: ${totalConversations}回\n`;
  message += `今日の会話数: ${todayConversations}回\n`;
  message += `利用ユーザー数: ${uniqueUsers}人\n`;

  await interaction.reply(message);
}
```

---

## 第6章：Git で記録（5分）

```bash
git add .
git commit -m "第6回: Gemini API導入+AI会話機能実装"
git push
```

---

## ✅ この回のチェックリスト

- [ ] Gemini API を取得できた
- [ ] `.env` に API キーを追加した
- [ ] AI 応答のテストが成功した
- [ ] `/ai` コマンドが動作した
- [ ] 会話履歴が保存された
- [ ] レート制限が機能している
- [ ] Git にコミット・プッシュできた

---

## 🔍 今日覚えること

### AI API の基本

- API キーの管理
- リクエスト・レスポンスの流れ
- エラーハンドリング

### プロンプトエンジニアリング

- システムプロンプトの重要性
- 役割定義
- 禁止事項の明示

### レート制限

- API コストの管理
- ユーザーごとの制限
- ウィンドウ方式

---

## ⚠️ よくあるトラブル

### API エラーが出る

**原因：** API キーが間違っている

**対処法：**
1. `.env` の `GEMINI_API_KEY` を確認
2. Google AI Studio で新しいキーを発行

---

### 応答が遅い

**原因：** ネットワーク遅延 or API 側の遅延

**対処法：**
- `deferReply()` で「考え中...」を表示
- タイムアウト処理を追加

---

### レート制限が厳しすぎる

**対処法：**
```javascript
checkRateLimit(userId, 50, 60) // 60分で50回に緩和
```

---

## 📊 コスト管理のベストプラクティス

### 無料枠の活用

- Gemini API: 1日1,500リクエストまで無料
- 1ユーザー20回/時間制限 → 72ユーザーで上限

### コスト削減のコツ

1. **プロンプトを短くする**
   - 不要な履歴は削除

2. **キャッシュを活用**
   - よくある質問は定型応答

3. **段階的利用**
   - 定型メッセージ → キーワード反応 → AI の順

---

## 🎓 発展課題（自習用）

1. **感情分析**
   - ユーザーの感情をスコア化

2. **マルチモーダル**
   - 画像の説明を AI に生成させる

3. **要約機能**
   - 長い会話を要約

---

## 次回予告

### 第7回：AI を利用する 第二回 - Bot の荒らし対策・リクエスト数を制限する

AI 機能を安全に運用するために：
- スパム対策
- 不適切な質問のフィルタリング
- モデレーション機能
- ログ監視

**👉 Bot を本番環境で安全に動かす準備をします！**