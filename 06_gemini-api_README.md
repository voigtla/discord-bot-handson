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

**ここで編集するファイル：** `index.js`

**何をするか：**  
2つのステップがあります。

**ステップ1：** ファイルの先頭部分に、AI を使うための「読み込み」を追加する  
**ステップ2：** `/ai` と `/ai-reset` コマンドの処理を追加する

---

#### ステップ1：ファイルの先頭に追加

**どこに書くか：**  
`index.js` の **一番上のほう**（`require` が並んでいるあたり）に追加します。

具体的には、次のような行があるはずです：

```javascript
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const Database = require('better-sqlite3');
```

この **下**に、次の行を追加してください：

```javascript
const AIHelper = require('./ai-helper');
```

そして、`const db = new Database('bot.db');` の **すぐ下**に、次の行を追加：

```javascript
const aiHelper = new AIHelper(process.env.GEMINI_API_KEY);
```

---

#### ステップ2：コマンド処理を追加

**どこに書くか：**  
スラッシュコマンドを実行した瞬間に動く処理です。  
`client.on('interactionCreate', async interaction => { ... })` の中で、  
`if (!interaction.isChatInputCommand()) return;` の **下**に、  
他の `if (interaction.commandName === '...')` と **同じ並び（同じ深さ）** として追加します。

**具体的には：**  
すでにある `/template` や `/sos` のコマンド処理の **下**に、  
次のコードを追加してください。

**以下は全体像の参考です（実際には差分だけ追加してください）：**

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

**ここで編集するファイル：** `index.js`

**どこに書くか：**  
関数を定義する場所です。  
`index.js` の中で、`client.on(...)` などのイベントハンドラよりも **上**に書きます。

**具体的には：**  
ファイルの構成は通常こうなっています：

```
1. require文（ライブラリの読み込み）
2. データベース接続・初期化
3. 関数の定義 ← ここに書く
4. Botクライアントの作成
5. イベントハンドラ（ready, interactionCreate など）
6. client.login()
```

「3. 関数の定義」のエリアに、次の関数を追加してください。

**この関数の役割：**  
ユーザーが制限回数を超えていないかチェックします。

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

**ここで編集するファイル：** `index.js`

**どこに書くか：**  
スラッシュコマンドを実行した瞬間に動く処理です。  
`client.on('interactionCreate', async interaction => { ... })` の中で、  
`if (!interaction.isChatInputCommand()) return;` の **下**に、  
他の `if (interaction.commandName === '...')` と **同じ並び（同じ深さ）** として追加します。

**具体的には：**  
すでにある `/ai-reset` コマンドの処理の **下**に、  
次のコードを追加してください。

**このコマンドの役割：**  
管理者が AI の使用状況を確認できます。  
総会話数、今日の会話数、利用者数を表示します。

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
---

## 📦 第6回の完成版ソースコード

### ファイル構成
```
git_practice/
├── .gitignore
├── .env
├── .env.example
├── package.json
├── index.js
├── register-commands.js
└── ai-helper.js（★新規）
```

---

### 新規ファイル：ai-helper.js
```javascript
const { GoogleGenerativeAI } = require('@google/generative-ai');

class AIHelper {
  constructor(apiKey) {
    this.genAI = new GoogleGenerativeAI(apiKey);
    this.model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    
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
      let fullPrompt = this.systemPrompt + '\n\n';
      if (context.length > 0) {
        fullPrompt += '【これまでの会話】\n';
        context.forEach(msg => {
          fullPrompt += `${msg.role}: ${msg.content}\n`;
        });
        fullPrompt += '\n';
      }
      fullPrompt += `ユーザー: ${userMessage}\n\nあなたの応答:`;
      
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

  detectEmergency(message) {
    const emergencyKeywords = ['死にたい', '消えたい', '自殺', '死ぬ', '終わりにしたい', 'もう無理', '限界'];
    const lowerMessage = message.toLowerCase();
    return emergencyKeywords.some(keyword => lowerMessage.includes(keyword));
  }
}

module.exports = AIHelper;
```

---

### index.js の変更点

**第5回のindex.jsをベースに以下を追加：**

**1. ファイル先頭に追加：**
```javascript
const AIHelper = require('./ai-helper');
const aiHelper = new AIHelper(process.env.GEMINI_API_KEY);
```

**2. データベーステーブルに追加：**
```javascript
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

db.exec(`DELETE FROM ai_conversations WHERE created_at < datetime('now', '-24 hours')`);
```

**3. レート制限関数を追加：**
```javascript
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
```

**4. コマンド処理に追加（client.on('interactionCreate'の中）：**
```javascript
if (interaction.commandName === 'ai') {
  const userId = interaction.user.id;
  const userMessage = interaction.options.getString('message');

  const rateLimit = checkRateLimit(userId);
  if (!rateLimit.allowed) {
    await interaction.reply({ content: `⏰ 1時間に10回までです。あと${rateLimit.minutesLeft}分後に再度お試しください。`, ephemeral: true });
    return;
  }

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
```

---

### register-commands.js の変更点

**第5回のcommands配列に以下を追加：**
```javascript
{
  name: 'ai',
  description: 'AIと会話します',
  options: [{ name: 'message', description: 'AIに送るメッセージ', type: 3, required: true }]
},
{
  name: 'ai-reset',
  description: 'AI会話履歴をリセットします'
},
{
  name: 'ai-stats',
  description: 'AI使用統計を表示します（管理者のみ）'
}
```

---

### .env.example の変更点
```
DISCORD_TOKEN=あなたのトークン
CLIENT_ID=あなたのアプリケーションID
GUILD_ID=あなたのサーバーID
GEMINI_API_KEY=あなたのGemini APIキー
```

---

### package.json の変更点
```json
{
  "dependencies": {
    "discord.js": "^14.14.1",
    "better-sqlite3": "^9.2.2",
    "dotenv": "^16.3.1",
    "@google/generative-ai": "^0.1.3"
  }
}
```

**インストール：**
```bash
npm install @google/generative-ai
```

これで第6回は完成です！


---

### index.js（完全版）

```javascript
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const Database = require('better-sqlite3');
const AIHelper = require('./ai-helper');

const db = new Database('bot.db');
const aiHelper = new AIHelper(process.env.GEMINI_API_KEY);

// 既存のテーブル
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

// レート制限用テーブル
db.exec(`
  CREATE TABLE IF NOT EXISTS rate_limits (
    user_id TEXT PRIMARY KEY,
    count INTEGER DEFAULT 0,
    reset_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 古い会話履歴を削除（24時間以上前）
db.exec(`
  DELETE FROM ai_conversations 
  WHERE created_at < datetime('now', '-24 hours')
`);

console.log('データベース準備完了');

// 初期テンプレートを登録
function initializeTemplates() {
  const defaultTemplates = [
    {
      key: 'breathe',
      content: '🌬️ **深呼吸してみましょう**\n\n4秒吸って... 7秒止めて... 8秒かけて吐く...\n\nゆっくり3回繰り返してみてください。',
      category: 'relaxation'
    },
    {
      key: 'comfort',
      content: '🤗 **大丈夫です**\n\n辛い気持ち、よく話してくれましたね。\nあなたは一人じゃありません。\n少しずつ、一緒に乗り越えていきましょう。',
      category: 'comfort'
    },
    {
      key: 'emergency',
      content: '📞 **緊急連絡先**\n\n• いのちの電話: 0570-783-556 (24時間)\n• こころの健康相談: 0570-064-556\n• SNS相談: https://www.mhlw.go.jp/mamorouyokokoro/\n\n一人で抱え込まないでください。',
      category: 'emergency'
    },
    {
      key: 'grounding',
      content: '🌍 **グラウンディング法**\n\n周りを見渡して、次のものを探してみてください：\n• 5つの見えるもの\n• 4つの触れるもの\n• 3つの聞こえる音\n• 2つの匂い\n• 1つの味\n\n「今ここ」に戻ってきましょう。',
      category: 'relaxation'
    }
  ];

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO templates (key, content, category) 
    VALUES (?, ?, ?)
  `);

  defaultTemplates.forEach(template => {
    insertStmt.run(template.key, template.content, template.category);
  });

  console.log('初期テンプレート準備完了');
}

// 初期キーワードを登録
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

  const insertStmt = db.prepare(`
    INSERT OR IGNORE INTO keyword_responses (keyword, template_key, priority) 
    VALUES (?, ?, ?)
  `);

  defaultKeywords.forEach(kw => {
    insertStmt.run(kw.keyword, kw.template_key, kw.priority);
  });

  console.log('キーワード反応準備完了');
}

initializeTemplates();
initializeKeywords();

// レート制限チェック
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

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent
  ]
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

  if (interaction.commandName === 'count') {
    const userId = interaction.user.id;

    const totalStmt = db.prepare('SELECT COUNT(*) as count FROM feelings WHERE user_id = ?');
    const { count: totalCount } = totalStmt.get(userId);

    if (totalCount === 0) {
      await interaction.reply('まだ記録がありません。/feeling で気分を記録してみましょう！');
      return;
    }

    const todayStmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM feelings 
      WHERE user_id = ? 
      AND DATE(created_at) = DATE('now', 'localtime')
    `);
    const { count: todayCount } = todayStmt.get(userId);

    const weekStmt = db.prepare(`
      SELECT COUNT(*) as count 
      FROM feelings 
      WHERE user_id = ? 
      AND DATE(created_at) >= DATE('now', '-7 days', 'localtime')
    `);
    const { count: weekCount } = weekStmt.get(userId);

    const feelingStmt = db.prepare(`
      SELECT feeling, COUNT(*) as count 
      FROM feelings 
      WHERE user_id = ? 
      GROUP BY feeling
    `);
    const feelingCounts = feelingStmt.all(userId);

    const latestStmt = db.prepare(`
      SELECT feeling, note, created_at 
      FROM feelings 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 1
    `);
    const latest = latestStmt.get(userId);

    const timeDiff = getTimeDiff(latest.created_at);

    const emojiMap = {
      great: '😊',
      good: '🙂',
      okay: '😐',
      down: '😔',
      bad: '😢'
    };

    let message = '**あなたの記録**\n';
    message += `📊 総記録数: ${totalCount}回\n`;
    message += `📅 今日の記録: ${todayCount}回\n`;
    message += `📆 過去7日間: ${weekCount}回\n\n`;

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
        keys.forEach(key => {
          message += `• \`${key}\`\n`;
        });
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
        const stmt = db.prepare(`
          INSERT INTO templates (key, content, category, created_by) 
          VALUES (?, ?, ?, ?)
        `);
        stmt.run(key, content, category, createdBy);

        await interaction.reply(`✅ テンプレート '${key}' を登録しました。`);
      } catch (error) {
        if (error.message.includes('UNIQUE')) {
          await interaction.reply({ 
            content: `❌ テンプレート '${key}' は既に存在します。`, 
            ephemeral: true 
          });
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

      const stmt = db.prepare(`
        INSERT INTO keyword_responses (keyword, template_key, priority) 
        VALUES (?, ?, ?)
      `);
      stmt.run(keyword, templateKey, priority);

      await interaction.reply(`✅ キーワード '${keyword}' を登録しました（優先度: ${priority}）`);
    }

    if (subcommand === 'list') {
      const stmt = db.prepare(`
        SELECT id, keyword, template_key, priority, enabled 
        FROM keyword_responses 
        ORDER BY priority DESC, keyword
      `);
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

  // AI機能
  if (interaction.commandName === 'ai') {
    const userId = interaction.user.id;
    const userMessage = interaction.options.getString('message');

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

    // 会話履歴を取得
    const historyStmt = db.prepare(`
      SELECT role, content 
      FROM ai_conversations 
      WHERE user_id = ? 
      ORDER BY created_at DESC 
      LIMIT 10
    `);
    const history = historyStmt.all(userId).reverse();

    // AI に送信
    const aiResponse = await aiHelper.chat(userMessage, history);

    // 会話を保存
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
});

// オートコンプリートのハンドラ
client.on('interactionCreate', async interaction => {
  if (!interaction.isAutocomplete()) return;

  if (interaction.commandName === 'template') {
    const focusedValue = interaction.options.getFocused();
    const stmt = db.prepare('SELECT key FROM templates WHERE key LIKE ? LIMIT 25');
    const choices = stmt.all(`%${focusedValue}%`);

    await interaction.respond(
      choices.map(choice => ({ name: choice.key, value: choice.key }))
    );
  }
});

// メッセージイベントのハンドラ
client.on('messageCreate', async message => {
  if (message.author.bot) return;
  if (message.system) return;

  const content = message.content.toLowerCase();

  const stmt = db.prepare(`
    SELECT kr.keyword, kr.template_key, kr.priority, t.content 
    FROM keyword_responses kr
    JOIN templates t ON kr.template_key = t.key
    WHERE kr.enabled = 1
    AND LOWER(?) LIKE '%' || LOWER(kr.keyword) || '%'
    ORDER BY kr.priority DESC, kr.keyword DESC
    LIMIT 1
  `);
  const match = stmt.get(content);

  if (match) {
    if (match.priority >= 100) {
      await message.reply(match.content);
      return;
    }

    if (match.priority >= 10) {
      await message.reply({
        content: `${match.content}\n\n必要であれば \`/sos\` で緊急連絡先を確認できます。`,
        allowedMentions: { repliedUser: false }
      });
      return;
    }

    await message.reply({
      content: `💡 \`/template get ${match.template_key}\` が役立つかもしれません。`,
      allowedMentions: { repliedUser: false }
    });
  }
});

client.login(process.env.DISCORD_TOKEN);
```

これで第6回は完成です！
