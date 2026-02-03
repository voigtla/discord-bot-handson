# 第16回：DB設計を変える判断（DB恐怖症の解除）

「データベースに新しいカラムを追加したいけど、怖い...」
「テーブル構造を変えたら、既存のデータが壊れそう...」

その恐怖、**正しい手順を知れば克服できます。**

この回では、データベース変更の現実的なリスクと、安全な変更手順を学びます。

---

## 📌 この回の目標

- データベーススキーマの変更方法を理解する
- 既存データの移行判断ができる
- マイグレーションスクリプトを作成できる

**💡 ポイント：**
- DB変更は「怖い」から「手順を守れば安全」へ
- 既存データは「残す」「変換する」「捨てる」の3択
- バックアップは必須

---

## 🎯 完成イメージ

```
【危険なDB変更】
「カラムを追加したい」
  ↓
サーバーで直接 ALTER TABLE
  ↓
既存データと不整合
  ↓
Bot が起動しない
  ↓
復旧に何時間もかかる

【安全なDB変更】
「カラムを追加したい」
  ↓
マイグレーションスクリプト作成
  ↓
ローカルでテスト
  ↓
バックアップ取得
  ↓
サーバーでスクリプト実行
  ↓
Bot再起動
  ↓
成功（5分で完了）
```

---

## 第1章：なぜDB変更は怖いのか（10分）

### 1-1. よくある「やらかし」事例

**事例1：カラム追加の失敗**

```
要望：気分記録に「プライベート設定」を追加したい

【間違った対応】
サーバーで直接実行：
ALTER TABLE feelings ADD COLUMN is_private INTEGER;

問題：
- 既存のコードが is_private を想定していない
- SELECT 文の結果が変わる
- 一部の処理でエラーが発生

結果：
- /count コマンドが動かない
- Bot が部分的に機能停止
```

---

**事例2：既存データとの不整合**

```
要望：気分の種類を増やしたい

【間違った対応】
feelings テーブルの feeling カラムを変更
'良い' → 'とても良い', '良い', 'まあまあ', '悪い', 'とても悪い'

問題：
- 既存データは '良い', '普通', '悪い' で保存されている
- 新しい選択肢と合わない
- 統計が取れなくなる

結果：
- /count コマンドで集計エラー
```

---

### 1-2. DB変更の3つのリスク

**リスク1：既存データとの不整合**
- 新しいスキーマと古いデータが合わない
- 集計やクエリでエラー

**リスク2：アプリケーションコードとの不一致**
- コードがDB変更を想定していない
- 一部の機能が動かなくなる

**リスク3：ロールバック困難**
- DB変更は元に戻しにくい
- データが混在すると復旧が困難

---

## 第2章：DB変更の基本パターン（15分）

### 2-1. パターン1：カラム追加（最も安全）

**例：気分記録にタグ機能を追加**

**変更内容：**
```sql
ALTER TABLE feelings ADD COLUMN tags TEXT DEFAULT '';
```

**この変更は安全：**
- 既存データはそのまま（影響なし）
- 新しいカラムはデフォルト値で埋められる
- 既存のクエリは動き続ける

**コード側の変更：**
```javascript
// 既存のコードは変更不要（デフォルト値があるため）

// 新しい機能でのみ使用
if (tags) {
  stmt = db.prepare(`
    INSERT INTO feelings (user_id, feeling, note, tags)
    VALUES (?, ?, ?, ?)
  `);
  stmt.run(user_id, feeling, note, tags);
}
```

---

### 2-2. パターン2：カラム削除（注意が必要）

**例：note カラムを削除（使われていない場合）**

**⚠️ 削除前の確認：**
1. 本当に使われていないか？
2. 既存データに note が入っているか？
3. 削除しても問題ないか？

**変更内容：**
```sql
-- SQLiteではカラム削除が直接できない
-- テーブルを再作成する必要がある

-- 1. 新しいテーブルを作成
CREATE TABLE feelings_new (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  user_id TEXT NOT NULL,
  feeling TEXT NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- 2. データをコピー（note カラムは除外）
INSERT INTO feelings_new (id, user_id, feeling, created_at)
SELECT id, user_id, feeling, created_at FROM feelings;

-- 3. 古いテーブルを削除
DROP TABLE feelings;

-- 4. 新しいテーブルをリネーム
ALTER TABLE feelings_new RENAME TO feelings;
```

**💡 ポイント：**
- カラム削除は複雑
- 慎重に計画する
- 本当に削除する必要があるか再検討

---

### 2-3. パターン3：カラム名変更

**例：feeling → mood に変更**

**⚠️ 推奨：変更しない**
- カラム名変更はリスクが高い
- すべてのクエリを書き換える必要がある
- トラブルの元

**代替案：新しいカラムを追加**
```sql
-- mood カラムを追加
ALTER TABLE feelings ADD COLUMN mood TEXT;

-- 既存データを移行
UPDATE feelings SET mood = feeling WHERE mood IS NULL;

-- 将来的に feeling カラムは削除（段階的に）
```

---

### 2-4. パターン4：テーブル追加（安全）

**例：ユーザー設定テーブルを追加**

**変更内容：**
```sql
CREATE TABLE user_settings (
  user_id TEXT PRIMARY KEY,
  timezone TEXT DEFAULT 'Asia/Tokyo',
  notifications INTEGER DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

**この変更は安全：**
- 既存のテーブルに影響なし
- 既存の機能は動き続ける
- 新機能だけが新しいテーブルを使用

---

## 第3章：マイグレーションスクリプトの作成（20分）

### 3-1. マイグレーションとは

**マイグレーション（Migration）：**
- データベーススキーマの変更を管理する仕組み
- 「いつ、何を、どう変更したか」を記録
- 安全に適用・ロールバックできる

---

### 3-2. マイグレーションスクリプトの作成

**ローカルPCで作業：**

```powershell
cd C:\Users\<あなたのユーザー名>\git_practice

# migrationsフォルダを作成
New-Item -ItemType Directory -Name migrations

# 最初のマイグレーションスクリプトを作成
New-Item -ItemType File -Name migrations\001_add_tags_column.js
code migrations\001_add_tags_column.js
```

---

**001_add_tags_column.js の内容：**

```javascript
const Database = require('better-sqlite3');

// マイグレーション実行関数
function up(db) {
  console.log('[マイグレーション] tags カラムを追加中...');
  
  try {
    // tags カラムを追加
    db.exec(`
      ALTER TABLE feelings ADD COLUMN tags TEXT DEFAULT '';
    `);
    
    console.log('[マイグレーション] tags カラムの追加が完了しました');
    return true;
  } catch (error) {
    console.error('[マイグレーション] エラー:', error.message);
    return false;
  }
}

// ロールバック関数（カラム削除はSQLiteで困難なので、空文字に戻す）
function down(db) {
  console.log('[ロールバック] tags カラムをクリア中...');
  
  try {
    // tags カラムを空文字にする（削除の代わり）
    db.exec(`
      UPDATE feelings SET tags = '';
    `);
    
    console.log('[ロールバック] tags カラムのクリアが完了しました');
    return true;
  } catch (error) {
    console.error('[ロールバック] エラー:', error.message);
    return false;
  }
}

// CLIから実行できるようにする
if (require.main === module) {
  const dbPath = process.argv[2] || './bot.db';
  const action = process.argv[3] || 'up';
  
  const db = new Database(dbPath);
  
  if (action === 'up') {
    const result = up(db);
    process.exit(result ? 0 : 1);
  } else if (action === 'down') {
    const result = down(db);
    process.exit(result ? 0 : 1);
  } else {
    console.error('使い方: node 001_add_tags_column.js [dbPath] [up|down]');
    process.exit(1);
  }
}

module.exports = { up, down };
```

---

### 3-3. ローカルでテスト

**ローカルPC（開発環境）で実行：**

```powershell
# 開発環境のDBに適用
node migrations/001_add_tags_column.js ./bot-dev.db up
```

**✅ 成功すると：**
```
[マイグレーション] tags カラムを追加中...
[マイグレーション] tags カラムの追加が完了しました
```

---

**確認：**

```powershell
# SQLiteで確認
sqlite3 bot-dev.db

# SQLite内で実行
.schema feelings

# 出力例：
# CREATE TABLE feelings (
#   id INTEGER PRIMARY KEY AUTOINCREMENT,
#   user_id TEXT NOT NULL,
#   feeling TEXT NOT NULL,
#   note TEXT,
#   tags TEXT DEFAULT '',  ← 追加された！
#   created_at DATETIME DEFAULT CURRENT_TIMESTAMP
# );

.quit
```

---

### 3-4. マイグレーション実行スクリプトの作成

**複数のマイグレーションを順番に実行するスクリプト：**

**ローカルPCで作業：**

```powershell
New-Item -ItemType File -Name run-migrations.js
code run-migrations.js
```

**run-migrations.js の内容：**

```javascript
const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

// データベースパス
const dbPath = process.env.DATABASE_PATH || './bot.db';
const db = new Database(dbPath);

// マイグレーション履歴テーブルを作成
db.exec(`
  CREATE TABLE IF NOT EXISTS migrations (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL UNIQUE,
    executed_at DATETIME DEFAULT CURRENT_TIMESTAMP
  )
`);

// 実行済みマイグレーションを取得
const executedMigrations = db.prepare('SELECT name FROM migrations').all();
const executedNames = executedMigrations.map(m => m.name);

// migrationsフォルダからマイグレーションファイルを取得
const migrationsDir = path.join(__dirname, 'migrations');
const migrationFiles = fs.readdirSync(migrationsDir)
  .filter(file => file.endsWith('.js'))
  .sort();

console.log('=== マイグレーション実行 ===');
console.log(`データベース: ${dbPath}`);
console.log(`実行済みマイグレーション: ${executedNames.length}件`);
console.log('');

let executed = 0;

// 各マイグレーションを実行
for (const file of migrationFiles) {
  const name = path.basename(file, '.js');
  
  if (executedNames.includes(name)) {
    console.log(`[スキップ] ${name} (実行済み)`);
    continue;
  }
  
  console.log(`[実行] ${name}`);
  
  const migration = require(path.join(migrationsDir, file));
  
  try {
    const result = migration.up(db);
    
    if (result) {
      // マイグレーション履歴に追加
      db.prepare('INSERT INTO migrations (name) VALUES (?)').run(name);
      console.log(`[完了] ${name}`);
      executed++;
    } else {
      console.error(`[失敗] ${name}`);
      process.exit(1);
    }
  } catch (error) {
    console.error(`[エラー] ${name}:`, error.message);
    process.exit(1);
  }
}

console.log('');
console.log(`=== マイグレーション完了：${executed}件実行 ===`);
db.close();
```

---

## 第4章：本番環境でのDB変更（15分）

### 4-1. DB変更の手順

**ステップ1：ローカルで準備**
1. マイグレーションスクリプト作成
2. ローカル環境でテスト
3. コミット・プッシュ

**ステップ2：本番環境でバックアップ**
```bash
# サーバーで実行
cd ~/git_practice
cp bot.db bot.db.backup.$(date +%Y%m%d_%H%M%S)
```

**ステップ3：コードを更新**
```bash
git pull origin main
npm install
```

**ステップ4：マイグレーション実行**
```bash
node run-migrations.js
```

**ステップ5：Bot再起動**
```bash
pm2 restart discord-bot
```

**ステップ6：動作確認**
```bash
pm2 logs discord-bot
```

---

### 4-2. 実践：tags カラムを本番に追加

**ローカルPCで作業：**

```powershell
# コミット・プッシュ
git add migrations/001_add_tags_column.js run-migrations.js
git commit -m "マイグレーション：tags カラムを追加"
git push origin main
```

---

**サーバーで実行：**

```bash
# SSH接続
ssh -i ~/.ssh/gcp-discord-bot discord_bot@<サーバーのIP>

cd ~/git_practice

# 1. バックアップ
cp bot.db bot.db.backup.$(date +%Y%m%d_%H%M%S)

# 2. コード更新
git pull origin main

# 3. マイグレーション実行
node run-migrations.js

# 出力例：
# === マイグレーション実行 ===
# データベース: ./bot.db
# 実行済みマイグレーション: 0件
# 
# [実行] 001_add_tags_column
# [マイグレーション] tags カラムを追加中...
# [マイグレーション] tags カラムの追加が完了しました
# [完了] 001_add_tags_column
# 
# === マイグレーション完了：1件実行 ===

# 4. Bot再起動
pm2 restart discord-bot

# 5. 確認
pm2 logs discord-bot
```

---

### 4-3. 失敗時のロールバック

**マイグレーションが失敗した場合：**

```bash
# 1. Botを停止
pm2 stop discord-bot

# 2. バックアップから復元
cp bot.db.backup.<日時> bot.db

# 3. Bot再起動
pm2 restart discord-bot

# 4. 原因調査
# ローカル環境でマイグレーションスクリプトを修正
```

---

## 第5章：既存データの移行判断（10分）

### 5-1. データ移行の3つの選択肢

**選択肢1：データを残す（変換しない）**

**例：tags カラムの追加**
- 既存データ：tags は空文字
- 新しいデータ：tags に値が入る
- 混在してもOK

**メリット：**
- 安全
- 移行処理不要

**デメリット：**
- 古いデータと新しいデータが混在

---

**選択肢2：データを変換する**

**例：feeling の値を統一**
- 既存データ：'良い', '普通', '悪い'
- 新しいデータ：'とても良い', '良い', 'まあまあ', '悪い', 'とても悪い'
- 変換：'普通' → 'まあまあ'

**メリット：**
- データが統一される
- 集計が正確

**デメリット：**
- 変換ロジックが必要
- リスクがある

**変換スクリプト例：**

```javascript
function up(db) {
  console.log('[マイグレーション] feeling の値を統一中...');
  
  db.exec(`
    UPDATE feelings SET feeling = 'まあまあ' WHERE feeling = '普通';
  `);
  
  console.log('[マイグレーション] 完了');
  return true;
}
```

---

**選択肢3：データを捨てる**

**例：テスト期間中のデータ**
- 本番稼働前のテストデータは削除してOK
- ユーザーに事前通知

**メリット：**
- クリーンな状態で開始

**デメリット：**
- データが失われる
- ユーザーへの説明が必要

---

### 5-2. データ移行の判断基準

**残すべきデータ：**
- ユーザーの記録（気分記録など）
- 統計・集計に必要なデータ
- 法的に保存が必要なデータ

**変換すべきデータ：**
- 新しいスキーマと互換性がない
- 集計・検索に影響する
- 少量のデータ（リスクが低い）

**捨ててもいいデータ：**
- テスト期間中のデータ
- ユーザーの同意が得られている
- 復元不可能でも問題ない

---

## ✅ この回のチェックリスト

- [ ] DB変更の3つのリスクを理解した
- [ ] カラム追加・削除・テーブル追加の方法を理解した
- [ ] マイグレーションスクリプトを作成できる
- [ ] ローカルでマイグレーションをテストできる
- [ ] 本番環境で安全にDB変更できる
- [ ] データ移行の3つの選択肢を理解した

---

## 🎓 この回で学んだこと

**最重要ポイント：**
> **データベース変更は、正しい手順を守れば怖くない。バックアップ・テスト・マイグレーションが基本。**

**具体的に学んだこと：**
1. DB変更の基本パターン（カラム追加・削除・テーブル追加）
2. マイグレーションスクリプトの作成方法
3. 本番環境でのDB変更手順
4. 既存データの移行判断（残す・変換する・捨てる）
5. 失敗時のロールバック方法

---

## 📝 次回予告

**第17回：本番データを守る（捨てる）を決める**

DB変更ができるようになったので、次は「データをどう守るか」を学びます。

- バックアップの自動化
- 復元演習
- 守る価値のあるデータとは
- 責任の所在を理解する

---

## 📦 この回で作成したファイル

### ファイル構成

```
git_practice/
├── migrations/
│   └── 001_add_tags_column.js
├── run-migrations.js
└── ...
```

### migrations/001_add_tags_column.js

（上記参照）

### run-migrations.js

（上記参照）

---

## 🔧 よくある質問

**Q1: マイグレーション実行中にエラーが出たら？**
A: マイグレーションは途中で停止します。バックアップから復元して、
   マイグレーションスクリプトを修正し、再度実行してください。

**Q2: 一度実行したマイグレーションを再実行できる？**
A: いいえ。migrations テーブルに記録されているため、スキップされます。
   再実行したい場合は、migrations テーブルからレコードを削除してください。

**Q3: SQLiteでカラム削除が難しいのはなぜ？**
A: SQLite の制限です。テーブルを再作成する必要があります。
   他のデータベース（PostgreSQL, MySQL）では ALTER TABLE DROP COLUMN が使えます。

**Q4: 本番環境でマイグレーション中にBotは動いている？**
A: 動いています。ただし、マイグレーション中にデータを書き込むと、
   不整合が起きる可能性があるため、Bot を一時停止することを推奨します。

---

これで第16回は完了です！

フェーズBに入り、DB変更の恐怖を克服しました。次回は、データの保護について学びます。
