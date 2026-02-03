# 第12回：環境（手元・検証・本番）の違いを意識する

「ローカルでは動いたのに、本番では動かない...」

この悲劇を防ぐため、環境の違いを理解し、適切に管理する方法を学びます。

---

## 📌 この回の目標

- ローカル・検証・本番の3環境を理解する
- .envで環境ごとに挙動を切り替える
- 環境差分による事故を防ぐ

**💡 ポイント：**
- 本番でいきなり試さない
- 環境変数で挙動を制御する
- 差分を意識して開発する

---

## 🎯 完成イメージ

```
【3つの環境】

ローカル環境（あなたのPC）
├── 開発・テスト用
├── 自由に壊してOK
├── データは本物じゃない
└── NODE_ENV=development

検証環境（テスト用サーバー）※今回は作らない
├── 本番と同じ構成
├── 本番データのコピー
├── 最終確認用
└── NODE_ENV=staging

本番環境（ユーザーが使うサーバー）
├── ユーザーが実際に使う
├── 絶対に壊してはいけない
├── データは本物
└── NODE_ENV=production
```

---

## 第1章：なぜ環境を分けるのか（10分）

### 1-1. 環境を分けないとどうなるか

**ケース1：本番で直接開発した結果...**

```
開発者：「/export コマンドを追加しよう」
　↓
本番サーバーで直接コードを編集
　↓
バグが混入
　↓
Bot が停止
　↓
ユーザー：「Bot が動かない！」
　↓
慌てて修正
　↓
さらにバグが増える
　↓
事故
```

---

**ケース2：ローカルと本番で挙動が違う**

```
ローカル環境：
- データベース：10件のテストデータ
- AI API：制限なし
- ログ：詳細に出力

本番環境：
- データベース：10万件の本物データ
- AI API：レート制限あり
- ログ：最小限

結果：
→ ローカルでは0.1秒で動作
→ 本番では10秒かかる
→ タイムアウトエラー

→ ローカルでテストしたのに、本番で動かない
```

---

### 1-2. 環境を分けるメリット

```
【メリット1】安全に開発できる
- ローカルで自由に試せる
- 本番を壊すリスクがない

【メリット2】テストが確実になる
- 本番と同じ条件でテストできる（検証環境）
- バグを本番に出す前に発見できる

【メリット3】ロールバックが簡単
- 本番の古いバージョンを保持できる
- 問題があればすぐ戻せる
```

---

## 第2章：環境ごとの .env ファイル（15分）

### 2-1. 環境変数とは

**環境変数：**
- プログラムの外側から設定を与える仕組み
- 環境ごとに値を変えられる
- セキュアな情報を分離できる

---

### 2-2. 環境ごとの .env を作る

現在、あなたのプロジェクトには `.env` が1つだけあります。  
これを環境ごとに分けます。

---

#### ステップ1：ローカルPC（プロジェクトフォルダ）で作業

**現在のディレクトリ構造：**
```
git_practice/
├── .env  ← 今まで使っていたファイル
├── .gitignore
├── index.js
├── ai-helper.js
├── spam-detector.js
├── content-filter.js
└── register-commands.js
```

---

#### ステップ2：環境別の .env ファイルを作成

<details>
<summary><strong>🪟 Windows の場合</strong></summary>

```powershell
cd C:\Users\<あなたのユーザー名>\git_practice

# 開発環境用
Copy-Item .env .env.development

# 本番環境用（現在の .env を .env.production にコピー）
Copy-Item .env .env.production

# 元の .env は削除（混乱を防ぐため）
Remove-Item .env
```

</details>

<details>
<summary><strong>🍎 Mac の場合</strong></summary>

```bash
cd ~/git_practice

# 開発環境用
cp .env .env.development

# 本番環境用
cp .env .env.production

# 元の .env は削除
rm .env
```

</details>

---

#### ステップ3：.env.development を編集

VS Code で `.env.development` を開いて、以下のように編集：

```
# 開発環境設定
NODE_ENV=development

# Discord設定（開発用サーバー）
DISCORD_TOKEN=あなたの開発用トークン
CLIENT_ID=あなたの開発用クライアントID
GUILD_ID=あなたの開発用ギルドID

# Gemini API（本番と同じでOK）
GEMINI_API_KEY=あなたのGemini APIキー

# データベース設定
DATABASE_PATH=./bot-dev.db

# ログレベル
LOG_LEVEL=debug
```

**💡 ポイント：**
- `NODE_ENV=development` で開発環境であることを明示
- `DATABASE_PATH` を別ファイルにすることで、本番データを汚さない
- `LOG_LEVEL=debug` で詳細なログを出力

---

#### ステップ4：.env.production を編集

VS Code で `.env.production` を開いて、以下のように編集：

```
# 本番環境設定
NODE_ENV=production

# Discord設定（本番用サーバー）
DISCORD_TOKEN=あなたの本番用トークン
CLIENT_ID=あなたの本番用クライアントID
GUILD_ID=あなたの本番用ギルドID

# Gemini API
GEMINI_API_KEY=あなたのGemini APIキー

# データベース設定
DATABASE_PATH=./bot.db

# ログレベル
LOG_LEVEL=info
```

**💡 ポイント：**
- `NODE_ENV=production` で本番環境であることを明示
- `DATABASE_PATH` は本番用のファイル名
- `LOG_LEVEL=info` でログは必要最小限に

---

#### ステップ5：.gitignore を更新

`.gitignore` に以下を追加：

```
node_modules
.env
.env.*
bot.db
bot-dev.db
*.db
```

**💡 なぜ .env.* を除外？：**
- トークンやAPIキーが含まれているため
- GitHubに上げてはいけない

---

#### ステップ6：.env.example を作成

他の人がプロジェクトをクローンしたときの参考用に、`.env.example` を作成：

```
# 環境設定
NODE_ENV=development

# Discord設定
DISCORD_TOKEN=あなたのトークンを入れる
CLIENT_ID=あなたのクライアントIDを入れる
GUILD_ID=あなたのギルドIDを入れる

# Gemini API
GEMINI_API_KEY=あなたのGemini APIキーを入れる

# データベース設定
DATABASE_PATH=./bot-dev.db

# ログレベル（development: debug / production: info）
LOG_LEVEL=debug
```

**これはGitHubにコミットしてOKです。**

---

### 2-3. index.js を環境対応させる

現在の `index.js` は、ハードコーディングでデータベースファイル名が決まっています。  
これを `.env` から読み込むように変更します。

---

#### ステップ1：index.js の先頭部分を変更

**変更前：**
```javascript
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const Database = require('better-sqlite3');
const AIHelper = require('./ai-helper');
const SpamDetector = require('./spam-detector');
const ContentFilter = require('./content-filter');

const db = new Database('bot.db');
```

**変更後：**
```javascript
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const Database = require('better-sqlite3');
const AIHelper = require('./ai-helper');
const SpamDetector = require('./spam-detector');
const ContentFilter = require('./content-filter');

// 環境変数からデータベースパスを取得（デフォルトは bot.db）
const dbPath = process.env.DATABASE_PATH || 'bot.db';
const db = new Database(dbPath);

// 環境とログレベルを表示
console.log(`環境: ${process.env.NODE_ENV || 'development'}`);
console.log(`データベース: ${dbPath}`);
console.log(`ログレベル: ${process.env.LOG_LEVEL || 'info'}`);
```

---

#### ステップ2：ログ出力を環境に応じて制御

**現在のコード（例）：**
```javascript
console.log('データベース準備完了');
console.log('初期テンプレート準備完了');
console.log('キーワード反応準備完了');
```

**環境対応版：**
```javascript
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

function log(level, message) {
  const levels = { debug: 0, info: 1, warn: 2, error: 3 };
  const currentLevel = levels[LOG_LEVEL] || 1;
  const messageLevel = levels[level] || 1;
  
  if (messageLevel >= currentLevel) {
    console.log(`[${level.toUpperCase()}] ${message}`);
  }
}

// 使用例
log('debug', 'データベース準備完了');
log('info', '初期テンプレート準備完了');
log('debug', 'キーワード反応準備完了');
```

**💡 ポイント：**
- `LOG_LEVEL=debug` の時：すべてのログが表示される
- `LOG_LEVEL=info` の時：infoレベル以上のみ表示される
- 本番環境ではログを減らして、パフォーマンスを向上

---

### 2-4. package.json にスクリプトを追加

環境を切り替えやすくするため、`package.json` にスクリプトを追加：

**package.json に追加：**
```json
{
  "name": "git_practice",
  "version": "1.0.0",
  "description": "Discord Bot ハンズオン",
  "main": "index.js",
  "scripts": {
    "start": "node index.js",
    "start:dev": "cross-env NODE_ENV=development node index.js",
    "start:prod": "cross-env NODE_ENV=production node index.js",
    "register:dev": "cross-env NODE_ENV=development node register-commands.js",
    "register:prod": "cross-env NODE_ENV=production node register-commands.js"
  },
  "dependencies": {
    "discord.js": "^14.14.1",
    "better-sqlite3": "^9.2.2",
    "dotenv": "^16.3.1",
    "@google/generative-ai": "^0.1.3"
  },
  "devDependencies": {
    "cross-env": "^7.0.3"
  }
}
```

---

#### cross-env をインストール

<details>
<summary><strong>🪟 Windows の場合</strong></summary>

```powershell
npm install --save-dev cross-env
```

</details>

<details>
<summary><strong>🍎 Mac の場合</strong></summary>

```bash
npm install --save-dev cross-env
```

</details>

**💡 cross-env とは：**
- Windows と Mac で環境変数の設定方法が違う問題を解決
- クロスプラットフォーム対応

---

#### 使い方

**開発環境で起動：**
```bash
npm run start:dev
```

**本番環境で起動：**
```bash
npm run start:prod
```

**開発環境でコマンド登録：**
```bash
npm run register:dev
```

---

## 第3章：環境の切り替え実践（15分）

### 3-1. ローカルで開発環境を使う

#### ステップ1：.env.development を使う設定

**ローカルPC（プロジェクトフォルダ）で実行：**

<details>
<summary><strong>🪟 Windows の場合</strong></summary>

```powershell
# .env.development を .env にコピー
Copy-Item .env.development .env

# 起動
npm run start:dev
```

</details>

<details>
<summary><strong>🍎 Mac の場合</strong></summary>

```bash
# .env.development を .env にコピー
cp .env.development .env

# 起動
npm run start:dev
```

</details>

---

#### ステップ2：動作確認

**✅ 正しく動作していれば：**
```
環境: development
データベース: ./bot-dev.db
ログレベル: debug
[DEBUG] データベース準備完了
[INFO] 初期テンプレート準備完了
[DEBUG] キーワード反応準備完了
discord-bot-dev でログインしました！
```

**💡 ポイント：**
- `bot-dev.db` という新しいデータベースファイルが作成される
- 本番の `bot.db` は触らない
- 開発用のテストデータで自由に試せる

---

### 3-2. サーバーで本番環境を使う

#### ステップ1：サーバーにSSH接続

<details>
<summary><strong>🪟 Windows の場合</strong></summary>

```powershell
ssh -i $env:USERPROFILE\.ssh\gcp-discord-bot discord_bot@<サーバーのIP>
```

</details>

<details>
<summary><strong>🍎 Mac の場合</strong></summary>

```bash
ssh -i ~/.ssh/gcp-discord-bot discord_bot@<サーバーのIP>
```

</details>

---

#### ステップ2：.env.production を配置

**⚠️ サーバーで実行：**

```bash
cd ~/git_practice

# .env.production を .env にコピー
cp .env.production .env

# 内容を確認
cat .env
```

**✅ 確認ポイント：**
- `NODE_ENV=production` になっているか
- `DATABASE_PATH=./bot.db` になっているか
- トークンは本番用か

---

#### ステップ3：PM2で再起動

```bash
pm2 restart discord-bot
pm2 logs discord-bot
```

**✅ 正しく動作していれば：**
```
環境: production
データベース: ./bot.db
ログレベル: info
[INFO] 初期テンプレート準備完了
discord-bot でログインしました！
```

**💡 ポイント：**
- DEBUGログは表示されない（LOG_LEVEL=info のため）
- 本番用の `bot.db` を使用
- 本番用のトークンで動作

---

## 第4章：環境差分のチェックリスト（10分）

### 4-1. デプロイ前に必ずチェック

```markdown
## デプロイ前チェックリスト

### ローカルでの確認
- [ ] .env.development で動作確認済み
- [ ] 新機能が正しく動作する
- [ ] 既存機能に影響がない
- [ ] エラーログが出ていない

### コードの確認
- [ ] console.log の削除（または log() 関数に置き換え）
- [ ] テストコード・デバッグコードの削除
- [ ] コメントアウトされたコードの削除
- [ ] TODO コメントの確認

### 環境変数の確認
- [ ] .env.production に必要な変数がすべて揃っている
- [ ] トークンは本番用か
- [ ] DATABASE_PATH は正しいか
- [ ] LOG_LEVEL は適切か（info 推奨）

### データベースの確認
- [ ] データベーススキーマの変更がある場合、マイグレーションスクリプトを用意
- [ ] 既存データへの影響を確認
- [ ] バックアップを取った

### デプロイの確認
- [ ] GitHub にプッシュ済み
- [ ] デプロイスクリプト（deploy.sh）の確認
- [ ] ロールバック手順を確認

### デプロイ後の確認
- [ ] Bot が起動している（pm2 status）
- [ ] エラーログがない（pm2 logs）
- [ ] 新機能が動作する
- [ ] 既存機能が動作する
```

---

### 4-2. よくある環境差分の問題と対策

**問題1：ファイルパスの違い**

```javascript
// ❌ 悪い例（Windows でしか動かない）
const filePath = 'C:\\Users\\admin\\data.txt';

// ✅ 良い例（どの環境でも動く）
const path = require('path');
const filePath = path.join(__dirname, 'data.txt');
```

---

**問題2：環境変数の未設定**

```javascript
// ❌ 悪い例（環境変数がないとエラー）
const apiKey = process.env.API_KEY;

// ✅ 良い例（デフォルト値を設定）
const apiKey = process.env.API_KEY || 'default-key';
```

---

**問題3：大文字・小文字の違い**

```javascript
// ❌ 悪い例（Linux では動かない）
require('./MyFile.js');  // Windows は大文字小文字を区別しない

// ✅ 良い例（正確なファイル名）
require('./myfile.js');  // Linux は大文字小文字を区別する
```

---

## ✅ この回のチェックリスト

- [ ] 環境を分ける理由を理解した
- [ ] .env.development と .env.production を作成した
- [ ] index.js を環境対応させた
- [ ] package.json にスクリプトを追加した
- [ ] ローカルで開発環境を使えるようになった
- [ ] サーバーで本番環境を使えるようになった
- [ ] デプロイ前チェックリストを理解した

---

## 🎓 この回で学んだこと

**最重要ポイント：**
> **環境を分けて、本番でいきなり試さない。**

**具体的に学んだこと：**
1. ローカル・本番の環境分離
2. .env による環境ごとの設定管理
3. 環境変数の使い方
4. デプロイ前のチェックリスト

---

## 📝 次回予告

**第13回：安全なデプロイ手順を作る**

環境が分かれたので、次は「どうやって本番環境に安全にデプロイするか」を学びます。

deploy.sh を改良して、失敗時のリカバリも含めた完璧なデプロイフローを作ります。

---

## 📦 この回の完成版ソースコード

### ファイル構成
```
git_practice/
├── .env（ローカルでは .env.development のコピー）
├── .env.development
├── .env.production
├── .env.example
├── .gitignore
├── package.json
├── index.js（環境対応版）
├── ai-helper.js
├── spam-detector.js
├── content-filter.js
├── register-commands.js
├── bot.db（本番用データベース）
└── bot-dev.db（開発用データベース）
```

### index.js の変更箇所（先頭部分のみ抜粋）

```javascript
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const Database = require('better-sqlite3');
const AIHelper = require('./ai-helper');
const SpamDetector = require('./spam-detector');
const ContentFilter = require('./content-filter');

// 環境変数からデータベースパスを取得
const dbPath = process.env.DATABASE_PATH || 'bot.db';
const db = new Database(dbPath);

// 環境情報を表示
console.log(`環境: ${process.env.NODE_ENV || 'development'}`);
console.log(`データベース: ${dbPath}`);
console.log(`ログレベル: ${process.env.LOG_LEVEL || 'info'}`);

// ログ出力関数
const LOG_LEVEL = process.env.LOG_LEVEL || 'info';

function log(level, message) {
  const levels = { debug: 0, info: 1, warn: 2, error: 3 };
  const currentLevel = levels[LOG_LEVEL] || 1;
  const messageLevel = levels[level] || 1;
  
  if (messageLevel >= currentLevel) {
    console.log(`[${level.toUpperCase()}] ${message}`);
  }
}

// 以降は第8回のコードと同じ（console.log を log() に置き換え）
// ...
```

これで第12回は完了です！
