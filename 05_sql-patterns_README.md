# 第5回：SQL データの取り出しや定型的パターンの登録（緊急対策例）

メンタル系サーバーでは「辛いとき」に素早く反応することが大切です。  
今回は **定型メッセージ** と **緊急対応** の仕組みを作ります。

---

## 📌 この回の目標

- 定型メッセージを登録・呼び出しできるようにする
- キーワードに反応する自動応答を実装する
- 緊急時の対応パターンを作る

**💡 ポイント：**
- 実際のメンタル系サーバーで使える機能
- 管理者が簡単にメッセージを追加・編集できる

---

## 🎯 完成イメージ

```
【定型メッセージ機能】
管理者: /template add breathe "深呼吸してみましょう。吸って... 吐いて..."
Bot: テンプレート 'breathe' を登録しました

ユーザー: /template get breathe
Bot: 深呼吸してみましょう。吸って... 吐いて...

【自動応答機能】
ユーザー: 辛い...
Bot: 🤗 大丈夫ですよ。一緒に深呼吸してみましょう。
     /template get breathe を試してみてください。

【緊急対応】
ユーザー: /sos
Bot: 📞 緊急連絡先
     ・いのちの電話: 0570-783-556
     ・こころの健康相談: 0570-064-556
     一人で抱え込まないでくださいね。
```

**👉 Bot が実際に役立つ形になってきました**

---

## 📚 事前準備

### 必要なもの

- ✅ 第4回までの完成プロジェクト
- ✅ Bot が起動できる状態

---

## 第1章：定型メッセージ用のテーブル作成（10分）

### 1-1. データベース設計

**ここで編集するファイル：** `index.js`

**どこに書くか：**  
データベース（SQLite）の準備をする場所です。  
`index.js` の上のほうにある `const db = new Database(...)` と `db.exec(\` が並んでいるあたりを探してください。  
テーブル作成や初期化のコードは、基本的にこの **DB準備のかたまりの中**に置きます。

**具体的には：**  
すでにある `db.exec(\`CREATE TABLE IF NOT EXISTS feelings ...\`)` などのテーブル作成ブロックの **下**に、  
新しく次のテーブル作成コードを追加します。

**このテーブルの役割：**  
定型メッセージ（テンプレート）を保存します。  
管理者が自由にメッセージを追加・編集できるようにするためのテーブルです。

`index.js` のデータベース初期化部分に追加：

```javascript
// 定型メッセージ用テーブル
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
```

**テーブル設計：**
- `key` → 呼び出し用のキーワード（一意）
- `content` → メッセージ本文
- `category` → カテゴリ（breathe, comfort, emergency など）
- `created_by` → 作成者のユーザーID

---

### 1-2. 初期データを投入

**ここで編集するファイル：** `index.js`

**どこに書くか：**  
データベースの初期化が終わった後、Bot を起動する前の場所です。

具体的には：
1. `db.exec(...)` でテーブルを作成するコードの **下**
2. `const client = new Client(...)` で Bot を作成するコードの **上**

この位置に、次の関数を追加してください。

**この関数の役割：**  
Bot を起動するたびに、基本的なテンプレート（深呼吸ガイドや緊急連絡先など）を自動で登録します。  
`INSERT OR IGNORE` を使っているので、すでに登録されている場合は何もしません（重複しません）。

Bot 起動時に基本的なテンプレートを自動追加します：

```javascript
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

// データベース準備後に実行
initializeTemplates();
```

---

## 第2章：/template コマンドの実装（20分）

### 2-1. コマンドを登録

**ここで編集するファイル：** `register-commands.js`

**どこに書くか：**  
「Discordにコマンドを登録する」ためのファイルです。  
`register-commands.js` を開き、`const commands = [` を探してください。  
この章で追加するのは、基本的にこの **配列の中身**です（既存の配列を編集します）。

**具体的には：**  
すでにある `{ name: 'count', description: ... }` などのコマンド定義の **下**に、  
カンマ（`,`）で区切って、次のコマンドを追加します。

**このコマンドの役割：**  
`/template` コマンドは、サブコマンド形式です。  
- `/template get [キー]` → テンプレートを取得
- `/template list` → 一覧表示
- `/template add` → 追加（管理者のみ）
- `/template delete` → 削除（管理者のみ）

`register-commands.js` に追加：

```javascript
{
  name: 'template',
  description: '定型メッセージを管理します',
  options: [
    {
      name: 'get',
      description: 'テンプレートを取得',
      type: 1, // SUB_COMMAND
      options: [
        {
          name: 'key',
          description: 'テンプレートのキー',
          type: 3, // STRING
          required: true,
          autocomplete: true // オートコンプリート有効化
        }
      ]
    },
    {
      name: 'list',
      description: '登録されているテンプレート一覧',
      type: 1
    },
    {
      name: 'add',
      description: 'テンプレートを追加（管理者のみ）',
      type: 1,
      options: [
        {
          name: 'key',
          description: 'テンプレートのキー',
          type: 3,
          required: true
        },
        {
          name: 'content',
          description: 'メッセージ内容',
          type: 3,
          required: true
        },
        {
          name: 'category',
          description: 'カテゴリ',
          type: 3,
          required: false
        }
      ]
    },
    {
      name: 'delete',
      description: 'テンプレートを削除（管理者のみ）',
      type: 1,
      options: [
        {
          name: 'key',
          description: '削除するテンプレートのキー',
          type: 3,
          required: true
        }
      ]
    }
  ]
},
{
  name: 'sos',
  description: '緊急時の連絡先を表示します'
}
```

**コマンド再登録：**
```bash
node register-commands.js
```

---

### 2-2. /template コマンドの処理を実装

**ここで編集するファイル：** `index.js`

**どこに書くか：**  
スラッシュコマンドを実行した瞬間に動く処理です。  
`client.on('interactionCreate', async interaction => { ... })` の中で、  
`if (!interaction.isChatInputCommand()) return;` の **下**に、  
他の `if (interaction.commandName === '...')` と **同じ並び（同じ深さ）** として追加します。

**具体的には：**  
すでにある `/count` や `/feeling` のコマンド処理の **下**に、  
次のコードを追加してください。

`index.js` に追加：

```javascript
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;

  // ... 既存のコマンド処理 ...

  // /template コマンド
  if (interaction.commandName === 'template') {
    const subcommand = interaction.options.getSubcommand();

    // テンプレート取得
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

    // テンプレート一覧
    if (subcommand === 'list') {
      const stmt = db.prepare('SELECT key, category FROM templates ORDER BY category, key');
      const templates = stmt.all();

      if (templates.length === 0) {
        await interaction.reply('登録されているテンプレートはありません。');
        return;
      }

      // カテゴリごとに整理
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

    // テンプレート追加（管理者のみ）
    if (subcommand === 'add') {
      // 管理者権限チェック
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

    // テンプレート削除（管理者のみ）
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

  // /sos コマンド
  if (interaction.commandName === 'sos') {
    const stmt = db.prepare('SELECT content FROM templates WHERE key = ?');
    const row = stmt.get('emergency');

    if (row) {
      await interaction.reply(row.content);
    } else {
      // フォールバック
      await interaction.reply('📞 緊急連絡先\n\n• いのちの電話: 0570-783-556 (24時間)\n• こころの健康相談: 0570-064-556\n\n一人で抱え込まないでください。');
    }
  }
});
```

---

### 2-3. オートコンプリートの実装

**ここで編集するファイル：** `index.js`

**どこに書くか：**  
⚠️ **注意：** ここは `/template` を実行したときの処理ではなく、**入力中に候補を返すため**の処理です。  
そのため、`interaction.isChatInputCommand()` の中（/template の処理ブロックの中）には書きません。

**具体的には：**  
`index.js` を開き、すでにある `client.on('interactionCreate', async interaction => { ... })` を探してください。  
その **ブロックの外側（同じ階層）**に、次の「オートコンプリート用の interactionCreate」を **新しいブロックとして追加**します。

**イメージ：**
```javascript
// 既存のコマンド処理
client.on('interactionCreate', async interaction => {
  if (!interaction.isChatInputCommand()) return;
  // ... コマンド処理 ...
});

// ここに新しく追加 ↓
client.on('interactionCreate', async interaction => {
  if (!interaction.isAutocomplete()) return;
  // ... オートコンプリート処理 ...
});
```

`index.js` を開き、すでにある `client.on('interactionCreate', async interaction => { ... })` を探してください。  
その **近く（同じ階層）**に、次の「オートコンプリート用の interactionCreate」を **別ブロックとして新しく追加**します。

```js
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
````

---

### 2-4. 動作確認

```bash
node index.js
```

Discord で試してください：

```
/template list
→ Bot: 登録されているテンプレート一覧が表示される

/template get breathe
→ Bot: 深呼吸のガイドが表示される

/sos
→ Bot: 緊急連絡先が表示される
```

**✅ テンプレートが表示されれば成功です！**

---

## 第3章：キーワード反応システム（20分）

### 3-1. キーワードテーブルの作成

ここはデータベース（SQLite）の準備をする場所です。  
`index.js` の上のほうにある `const db = new Database(...)` と `db.exec(` が並んでいるあたりを探してください。  
テーブル作成や初期化のコードは、基本的にこの **DB準備のかたまりの中**に置きます。


特定のキーワードに自動反応するシステムを作ります：

```javascript
// キーワード反応用テーブル
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

initializeKeywords();
```

---

### 3-2. メッセージ監視の実装

**ここで編集するファイル：** `index.js`

**どこに書くか：**  
⚠️ **注意：** ここでは、スラッシュコマンドではなく **通常のメッセージ**（ユーザーがそのまま送信した文）に反応します。  
そのため、`client.on('interactionCreate', ...)` の中には書きません（別イベントです）。

**具体的には：**  
`index.js` を開き、まず `client.on('interactionCreate', ...)` のブロックを見つけてください。  
その **ブロックの外側（同じ階層）**に、次の `client.on('messageCreate', ...)` を **新しく追加**します。

**イメージ：**
```javascript
// コマンド処理（既存）
client.on('interactionCreate', async interaction => {
  // ... コマンド処理 ...
});

// オートコンプリート（既存）
client.on('interactionCreate', async interaction => {
  if (!interaction.isAutocomplete()) return;
  // ... オートコンプリート処理 ...
});

// ここに新しく追加 ↓
client.on('messageCreate', async message => {
  // ... メッセージ監視処理 ...
});
```

**この処理の役割：**  
ユーザーが普通にメッセージを送ったとき（スラッシュコマンドではなく）、  
そのメッセージに「辛い」「苦しい」などのキーワードが含まれていたら、  
自動で励ましのメッセージを返します。

ここでは、スラッシュコマンドではなく **通常のメッセージ**（ユーザーがそのまま送信した文）に反応します。  
そのため、`client.on('interactionCreate', ...)` の中には書きません（別イベントです）。

`index.js` を開き、まず `client.on('interactionCreate', ...)` のブロックを見つけてください。  
その **ブロックの外側（同じ階層）**に、次の `client.on('messageCreate', ...)` を **新しく追加**します。

```js
// メッセージイベントのハンドラ
client.on('messageCreate', async message => {
  // Bot自身のメッセージは無視
  if (message.author.bot) return;

  // システムメッセージは無視
  if (message.system) return;

  const content = message.content.toLowerCase();

  // キーワードをチェック
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
    // 優先度が高い（緊急）場合は即座に反応
    if (match.priority >= 100) {
      await message.reply(match.content);
      return;
    }

    // 優先度が中程度の場合は控えめに反応
    if (match.priority >= 10) {
      await message.reply({
        content: `${match.content}\n\n必要であれば \`/sos\` で緊急連絡先を確認できます。`,
        allowedMentions: { repliedUser: false } // メンションしない
      });
      return;
    }

    // 低優先度は提案のみ
    await message.reply({
      content: `💡 \`/template get ${match.template_key}\` が役立つかもしれません。`,
      allowedMentions: { repliedUser: false }
    });
  }
});
```

---

### 3-3. 動作確認

```bash
node index.js
```

Discord のチャンネルで試してください：

```
ユーザー: なんか辛い...
Bot: 🤗 大丈夫です
     辛い気持ち、よく話してくれましたね。
     ...
     必要であれば `/sos` で緊急連絡先を確認できます。

ユーザー: 息苦しい
Bot: 🌬️ **深呼吸してみましょう**
     ...
```

**✅ キーワードに反応すれば成功です！**

---

## 第4章：管理者向けキーワード管理コマンド（15分）

### 4-1. /keyword コマンドの登録

`register-commands.js` に追加：

```javascript
{
  name: 'keyword',
  description: 'キーワード反応を管理します（管理者のみ）',
  options: [
    {
      name: 'add',
      description: 'キーワードを追加',
      type: 1,
      options: [
        {
          name: 'keyword',
          description: '反応するキーワード',
          type: 3,
          required: true
        },
        {
          name: 'template',
          description: 'テンプレートキー',
          type: 3,
          required: true
        },
        {
          name: 'priority',
          description: '優先度（1-100、高いほど優先）',
          type: 4, // INTEGER
          required: false
        }
      ]
    },
    {
      name: 'list',
      description: '登録されているキーワード一覧',
      type: 1
    },
    {
      name: 'delete',
      description: 'キーワードを削除',
      type: 1,
      options: [
        {
          name: 'id',
          description: 'キーワードID',
          type: 4,
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

### 4-2. /keyword コマンドの処理

ここは **スラッシュコマンド実行時の処理**なので、`index.js` の  
`client.on('interactionCreate', async interaction => { ... })` の中に入れます。

具体的には、`if (!interaction.isChatInputCommand()) return;` の **下**で、  
他の `if (interaction.commandName === '...') { ... }` と **同じ並び（同じ深さ）**として追加します。

```js
if (interaction.commandName === 'keyword') {
  // 管理者権限チェック
  if (!interaction.member.permissions.has('ManageMessages')) {
    await interaction.reply({ content: 'このコマンドは管理者のみ使用できます。', ephemeral: true });
    return;
  }

  const subcommand = interaction.options.getSubcommand();

  if (subcommand === 'add') {
    const keyword = interaction.options.getString('keyword');
    const templateKey = interaction.options.getString('template');
    const priority = interaction.options.getInteger('priority') || 5;

    // テンプレートの存在確認
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
```

---

## 第5章：Git で記録（5分）

```bash
git add .
git commit -m "第5回: 定型メッセージ+キーワード反応実装"
git push
```

---

## ✅ この回のチェックリスト

- [ ] `templates` テーブルを作成できた
- [ ] 初期テンプレートが登録された
- [ ] `/template` コマンドが動作した
- [ ] `/sos` コマンドが動作した
- [ ] キーワードに自動反応した
- [ ] 管理者が新しいキーワードを追加できた
- [ ] Git にコミット・プッシュできた

---

## 🔍 今日覚えること

### テンプレートシステム

- 再利用可能なメッセージの管理
- カテゴリ分けによる整理
- 管理者による動的な追加・削除

### キーワード反応

- メッセージ監視
- 優先度による反応の制御
- 緊急対応の自動化

### 実用的な設計

- 外部キー制約（FOREIGN KEY）
- 優先度システム
- 有効/無効フラグ

---

## ⚠️ よくあるトラブル

### キーワードに反応しない

**原因：** メッセージイベントが登録されていない

**対処法：**
1. `client.on('messageCreate', ...)` が追加されているか確認
2. Bot を再起動

---

### 管理者コマンドが使えない

ここで追加する処理は、**スラッシュコマンドを実行した瞬間**に動くものです。  
`index.js` を開き、`client.on('interactionCreate', ...)` を探してください。  
その中の `if (!interaction.isChatInputCommand()) return;` があるブロックが対象です。  
この章のコードは、基本的にその **ブロックの中**（他の `if (interaction.commandName === ...)` と同じ並び）に入れます。


**原因：** 権限がない

**対処法：**
- サーバーで「メッセージの管理」権限を持っているか確認

---

### テンプレートが見つからない

**原因：** 初期化関数が実行されていない

**対処法：**
1. `initializeTemplates()` が呼ばれているか確認
2. Bot を再起動
3. データベースファイルを削除して再作成

---

## 📊 データベース設計のポイント

### 外部キー制約

```sql
FOREIGN KEY (template_key) REFERENCES templates(key)
```

**意味：**
- `template_key` は `templates` テーブルの `key` に存在する値のみ
- 存在しないテンプレートは登録できない

**メリット：**
- データの整合性が保たれる
- 削除時の連鎖処理も可能

---

### 優先度システム

- 100以上 → 緊急（即座に反応）
- 10-99 → 重要（控えめに反応）
- 1-9 → 提案（リンクのみ）

**👉 柔軟な対応が可能**

---

## 🎓 発展課題（自習用）

1. **時間帯による反応制御**
   - 深夜は優先度を上げる

2. **クールダウン機能**
   - 同じキーワードに連続反応しない

3. **統計機能**
   - どのテンプレートが多く使われているか

---

## 次回予告

### 第6回：AI を利用する（Gemini API 登録）+ サンプルの実行

ついに AI を導入します：
- Gemini API の登録
- AI との会話機能
- コンテキストを理解した応答

**👉 Bot が本当に「会話」できるようになります！**