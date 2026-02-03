# 第13回：安全なデプロイ手順を作る

「コードを書いた。さあデプロイしよう！」

その前に、**本番環境を壊さないための手順**を作りましょう。

この回では、deploy.shを改良し、失敗時のリカバリまで含めた**安全なデプロイフロー**を構築します。

---

## 📌 この回の目標

- deploy.shを読めるようになる
- デプロイ手順の安全性を高める
- 失敗時のリカバリ手順を理解する

**💡 ポイント：**
- デプロイは「成功するか失敗するか」の2択ではない
- 失敗しても**元に戻せる**ことが重要
- 手順を書き出すことで、事故を防ぐ

---

## 🎯 完成イメージ

```
【危険なデプロイ】
サーバーにSSH → git pull → pm2 restart
→ バグがあったら？→ 本番が止まる

【安全なデプロイ】
1. バックアップを取る
2. git pullする
3. npm install する（依存関係の更新）
4. 構文エラーをチェック
5. pm2 restart する
6. 動作確認
7. 失敗したら → バックアップから復元

→ 失敗しても戻せる
```

---

## 第1章:なぜデプロイは危険なのか（10分）

### 1-1. よくある「やらかし」事例

**事例1：構文エラーに気づかずデプロイ**

```
開発者：「新機能を追加した！デプロイしよう」
→ git pull
→ pm2 restart discord-bot
→ Bot が起動しない
→ ログを見る → SyntaxError: Unexpected token

原因：ローカルで動作確認したつもりだったが、
     コミット後に「ちょっとした修正」を加えた
     その修正でカンマを消し忘れていた

結果：本番が止まった
```

---

**事例2:依存関係の更新忘れ**

```
開発者：「新しいライブラリを追加した」
→ ローカルで npm install moment
→ コミット・プッシュ
→ サーバーで git pull
→ pm2 restart discord-bot
→ エラー：Cannot find module 'moment'

原因：サーバーで npm install していなかった

結果：本番が止まった
```

---

**事例3：環境変数の設定忘れ**

```
開発者：「新しいAPI連携を追加した」
→ .env.development に NEW_API_KEY を追加
→ ローカルで動作確認OK
→ コミット・プッシュ
→ サーバーで git pull
→ pm2 restart discord-bot
→ エラー：API_KEY is not defined

原因：.env.production に NEW_API_KEY を追加していなかった

結果：本番が止まった
```

---

### 1-2. デプロイの「落とし穴」

**落とし穴1：ローカルと本番の差**
- ローカルでは動くが、本番では動かない
- 環境変数の違い
- Node.jsのバージョンの違い
- OSの違い（Windows vs Linux）

**落とし穴2：「ちょっとした修正」の罠**
- コミット後に「ちょっとだけ」修正
- その修正が本番で動かない
- ローカルで再テストしていない

**落とし穴3：ロールバック手段がない**
- 失敗したときに「戻す方法」がない
- 慌てて手動で修正 → さらに悪化

---

## 第2章：deploy.shの読解と改良（20分）

### 2-1. 現在の deploy.sh を確認

第9回で作成した `deploy.sh` の内容を確認しましょう。

**サーバーにSSH接続：**

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

**deploy.sh を表示：**

```bash
cd ~/git_practice
cat deploy.sh
```

**現在のdeploy.sh（第9回版）：**

```bash
#!/bin/bash

echo "デプロイを開始します..."

# 最新のコードを取得
git pull origin main

# 依存関係をインストール
npm install

# PM2でBotを再起動
pm2 restart discord-bot

echo "デプロイが完了しました！"
```

---

### 2-2. この deploy.sh の問題点

**問題1：失敗時の対処がない**
- git pull が失敗したら？
- npm install が失敗したら？
- pm2 restart が失敗したら？
→ **そのまま進んでしまう**

**問題2：バックアップがない**
- デプロイ前の状態を保存していない
- 失敗したら戻せない

**問題3：構文チェックがない**
- JavaScriptの構文エラーをチェックしていない
- Bot起動後に初めて気づく

**問題4：動作確認がない**
- デプロイ後に「ちゃんと動いているか」を確認していない

---

### 2-3. 安全な deploy.sh に改良する

**改良版 deploy.sh を作成します。**

**サーバーで実行：**

```bash
cd ~/git_practice
nano deploy.sh
```

**以下の内容に書き換えてください：**

```bash
#!/bin/bash

set -e  # エラーが発生したら即座に終了

echo "========================================="
echo "  安全なデプロイスクリプト v2.0"
echo "========================================="

# 色の定義
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# プロジェクトディレクトリ
PROJECT_DIR=~/git_practice
cd $PROJECT_DIR

# 現在の日時（バックアップ用）
BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR=~/backups/$BACKUP_DATE

echo -e "${YELLOW}[1/7] バックアップを作成中...${NC}"
mkdir -p ~/backups
cp -r $PROJECT_DIR $BACKUP_DIR
echo -e "${GREEN}✓ バックアップ完了: $BACKUP_DIR${NC}"

echo -e "${YELLOW}[2/7] 現在のBotを停止中...${NC}"
pm2 stop discord-bot || echo "Botが起動していませんでした"

echo -e "${YELLOW}[3/7] 最新のコードを取得中...${NC}"
git pull origin main
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ git pull が失敗しました${NC}"
    echo "バックアップから復元するには: cp -r $BACKUP_DIR/* $PROJECT_DIR/"
    exit 1
fi
echo -e "${GREEN}✓ コード取得完了${NC}"

echo -e "${YELLOW}[4/7] 依存関係をインストール中...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ npm install が失敗しました${NC}"
    echo "バックアップから復元するには: cp -r $BACKUP_DIR/* $PROJECT_DIR/"
    exit 1
fi
echo -e "${GREEN}✓ 依存関係のインストール完了${NC}"

echo -e "${YELLOW}[5/7] 構文チェック中...${NC}"
node -c index.js
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ index.js に構文エラーがあります${NC}"
    echo "バックアップから復元するには: cp -r $BACKUP_DIR/* $PROJECT_DIR/"
    exit 1
fi
echo -e "${GREEN}✓ 構文チェック完了${NC}"

echo -e "${YELLOW}[6/7] Botを再起動中...${NC}"
pm2 restart discord-bot
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Bot の再起動に失敗しました${NC}"
    echo "バックアップから復元するには: cp -r $BACKUP_DIR/* $PROJECT_DIR/"
    exit 1
fi
echo -e "${GREEN}✓ Bot再起動完了${NC}"

echo -e "${YELLOW}[7/7] 動作確認中（5秒待機）...${NC}"
sleep 5
pm2 status discord-bot | grep "online"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Botは正常に動作しています${NC}"
else
    echo -e "${RED}✗ Botが起動していません${NC}"
    echo "ログを確認: pm2 logs discord-bot"
    echo "バックアップから復元するには: cp -r $BACKUP_DIR/* $PROJECT_DIR/"
    exit 1
fi

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  デプロイが完了しました！${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "ログを確認: pm2 logs discord-bot"
echo "バックアップ: $BACKUP_DIR"
echo ""
```

**保存して閉じる：**
- `Ctrl + X` → `Y` → `Enter`

---

**実行権限を付与：**

```bash
chmod +x deploy.sh
```

---

### 2-4. 改良版の特徴

**追加された安全機能：**

1. **バックアップ自動作成**
   - デプロイ前に必ずバックアップ
   - 失敗時の復元方法も表示

2. **エラーハンドリング**
   - `set -e`：エラーが発生したら即座に停止
   - 各ステップで成否を確認

3. **構文チェック**
   - `node -c index.js`：JavaScriptの構文エラーを事前検出

4. **動作確認**
   - 再起動後、Botが本当に動いているか確認

5. **視覚的なフィードバック**
   - 色分けで成功／失敗が一目瞭然
   - 各ステップの進捗を表示

---

## 第3章：デプロイの実践（15分）

### 3-1. 実際にデプロイしてみる

**ローカルPCで作業：**

1. **小さな変更をコミット**

```powershell
cd C:\Users\<あなたのユーザー名>\git_practice
```

**index.js の先頭に1行追加：**

```javascript
// 第13回：安全なデプロイのテスト
require('dotenv').config();
// ...以降は変更なし
```

**コミット・プッシュ：**

```powershell
git add index.js
git commit -m "第13回：デプロイテスト用コメント追加"
git push origin main
```

---

2. **サーバーでデプロイ実行**

**サーバーにSSH接続：**

```bash
cd ~/git_practice
./deploy.sh
```

**✅ 成功すると：**

```
=========================================
  安全なデプロイスクリプト v2.0
=========================================
[1/7] バックアップを作成中...
✓ バックアップ完了: /home/discord_bot/backups/20260204_143022
[2/7] 現在のBotを停止中...
✓ Bot停止完了
[3/7] 最新のコードを取得中...
✓ コード取得完了
[4/7] 依存関係をインストール中...
✓ 依存関係のインストール完了
[5/7] 構文チェック中...
✓ 構文チェック完了
[6/7] Botを再起動中...
✓ Bot再起動完了
[7/7] 動作確認中（5秒待機）...
✓ Botは正常に動作しています

=========================================
  デプロイが完了しました!
=========================================

ログを確認: pm2 logs discord-bot
バックアップ: /home/discord_bot/backups/20260204_143022
```

---

### 3-2. わざと失敗させてみる

**デプロイの失敗時の挙動を確認します。**

**ローカルPCで作業：**

**index.js にわざと構文エラーを入れる：**

```javascript
// 第13回：安全なデプロイのテスト
require('dotenv').config();
const { Client, GatewayIntentBits } = require('discord.js');
const Database = require('better-sqlite3')  // ← セミコロンを削除（エラー）

// ...以降は変更なし
```

**コミット・プッシュ：**

```powershell
git add index.js
git commit -m "テスト：構文エラーを混入"
git push origin main
```

---

**サーバーでデプロイ実行：**

```bash
cd ~/git_practice
./deploy.sh
```

**❌ エラーで停止：**

```
=========================================
  安全なデプロイスクリプト v2.0
=========================================
[1/7] バックアップを作成中...
✓ バックアップ完了: /home/discord_bot/backups/20260204_143545
[2/7] 現在のBotを停止中...
✓ Bot停止完了
[3/7] 最新のコードを取得中...
✓ コード取得完了
[4/7] 依存関係をインストール中...
✓ 依存関係のインストール完了
[5/7] 構文チェック中...
✗ index.js に構文エラーがあります
バックアップから復元するには: cp -r /home/discord_bot/backups/20260204_143545/* /home/discord_bot/git_practice/
```

**💡 重要：**
- デプロイは**構文チェックの段階で停止**した
- Botはまだ起動していない（本番は止まったまま）
- バックアップがあるので、すぐ復元できる

---

### 3-3. バックアップから復元する

**サーバーで実行：**

```bash
# バックアップから復元
cp -r /home/discord_bot/backups/20260204_143545/* ~/git_practice/

# Botを再起動
pm2 restart discord-bot

# 確認
pm2 status discord-bot
```

**✅ 復元完了：**
- エラーが出る前の状態に戻った
- Botは正常に動作している

---

**ローカルPCで修正：**

```javascript
// index.js のセミコロンを元に戻す
const Database = require('better-sqlite3');  // ← セミコロンを追加
```

**コミット・プッシュ：**

```powershell
git add index.js
git commit -m "修正：構文エラーを解消"
git push origin main
```

**サーバーで再デプロイ：**

```bash
./deploy.sh
```

**今度は成功します。**

---

## 第4章：デプロイ前チェックリスト（10分）

### 4-1. デプロイ前に必ず確認すること

**チェックリストを作成します。**

**ローカルPCで作業：**

```powershell
cd C:\Users\<あなたのユーザー名>\git_practice
New-Item -ItemType File -Name DEPLOY_CHECKLIST.md
code DEPLOY_CHECKLIST.md
```

**以下の内容を貼り付け：**

```markdown
# デプロイ前チェックリスト

デプロイする前に、このチェックリストをすべて確認してください。

## ローカルでの確認

- [ ] ローカル環境で動作確認済み
  - [ ] `npm run start:dev` で起動する
  - [ ] 新機能が動作する
  - [ ] 既存機能に影響がない
  - [ ] エラーログが出ていない

- [ ] コードの品質確認
  - [ ] console.log のデバッグコードを削除した
  - [ ] コメントアウトされたコードを削除した
  - [ ] TODOコメントを確認した
  - [ ] 不要なファイルを削除した

- [ ] Git の確認
  - [ ] すべての変更をコミットした
  - [ ] コミットメッセージが適切
  - [ ] GitHub にプッシュした
  - [ ] GitHub で変更内容を確認した

## 環境変数の確認

- [ ] .env.production に必要な変数がすべて揃っている
  - [ ] 新しい環境変数を追加した場合、サーバーの .env も更新した
  - [ ] トークンやAPIキーが正しい
  - [ ] DATABASE_PATH が正しい

## データベースの確認

- [ ] データベーススキーマに変更がある場合：
  - [ ] マイグレーションスクリプトを用意した
  - [ ] バックアップを取る計画がある
  - [ ] ロールバック手順を確認した

- [ ] データベーススキーマに変更がない場合：
  - [ ] このチェックをスキップ

## デプロイの準備

- [ ] デプロイするタイミングを決めた
  - [ ] ユーザーが少ない時間帯
  - [ ] 自分が対応できる時間帯

- [ ] ロールバック手段を確認した
  - [ ] バックアップから復元する手順を理解している
  - [ ] git reset でコミットを戻す方法を理解している

- [ ] 関係者に通知した（チーム開発の場合）
  - [ ] デプロイすることを伝えた
  - [ ] メンテナンス時間を伝えた

## デプロイ後の確認

- [ ] Bot が起動している
  - [ ] `pm2 status discord-bot` で確認
  - [ ] ステータスが `online` になっている

- [ ] ログにエラーがない
  - [ ] `pm2 logs discord-bot` で確認
  - [ ] エラーログが出ていない

- [ ] 新機能が動作する
  - [ ] Discord で実際に試した
  - [ ] 期待通りの動作をする

- [ ] 既存機能が動作する
  - [ ] /feeling、/count、/ai など主要コマンドを試した
  - [ ] すべて正常に動作する

## 問題が発生した場合

- [ ] ロールバックを実行した
  - [ ] バックアップから復元した
  - [ ] Bot が正常に動作することを確認した

- [ ] 原因を調査した
  - [ ] ログを確認した
  - [ ] ローカルで再現した
  - [ ] 修正方法を検討した

- [ ] 次回のデプロイ計画を立てた
  - [ ] 修正内容を決めた
  - [ ] テスト方法を決めた
```

**保存してコミット：**

```powershell
git add DEPLOY_CHECKLIST.md
git commit -m "デプロイ前チェックリストを追加"
git push origin main
```

---

### 4-2. チェックリストの使い方

**デプロイする前に：**
1. このチェックリストを開く
2. 上から順に確認
3. すべてチェックが入ったらデプロイ実行

**チェックリストを守るメリット：**
- 「うっかり忘れ」を防げる
- デプロイの品質が安定する
- 問題が起きても対処できる

---

## 第5章：失敗時のリカバリフロー（10分）

### 5-1. リカバリの3つの選択肢

**デプロイが失敗したとき、取れる選択肢は3つ：**

**選択肢1：バックアップから復元**
- 最速で元に戻せる
- 失敗した変更を完全に取り消す

**選択肢2：Gitでコミットを戻す**
- 失敗したコミットだけを取り消す
- 再デプロイする

**選択肢3：手動で修正してデプロイ**
- 原因が明確な場合のみ
- リスクが高い

---

### 5-2. 各リカバリ方法の手順

#### 方法1：バックアップから復元（最速）

**サーバーで実行：**

```bash
# 1. バックアップ一覧を確認
ls -lt ~/backups/

# 2. 最新のバックアップを確認（一番上）
# 例：20260204_143545

# 3. バックアップから復元
cp -r ~/backups/20260204_143545/* ~/git_practice/

# 4. Botを再起動
pm2 restart discord-bot

# 5. 確認
pm2 status discord-bot
pm2 logs discord-bot
```

**メリット：**
- 最速（1分以内）
- 確実に元に戻る

**デメリット：**
- 失敗した変更を調査する時間がない

---

#### 方法2：Gitでコミットを戻す

**サーバーで実行：**

```bash
cd ~/git_practice

# 1. コミット履歴を確認
git log --oneline -5

# 2. 戻したいコミットを特定
# 例：直前のコミットを取り消す
git reset --hard HEAD~1

# 3. Botを再起動
pm2 restart discord-bot

# 4. 確認
pm2 status discord-bot
```

**メリット：**
- 失敗したコミットだけを取り消せる
- Git履歴がきれいになる

**デメリット：**
- Gitの知識が必要
- 間違えると大変

---

#### 方法3：手動で修正してデプロイ

**ローカルPCで修正 → コミット → プッシュ → 再デプロイ**

**メリット：**
- 原因を理解して修正できる

**デメリット：**
- 時間がかかる
- 修正が正しいか不明

---

### 5-3. リカバリのフローチャート

```
デプロイ失敗
    ↓
【判断1】Botは動いているか？
    ├─ YES → 急ぎではない
    │        → 方法3：修正してデプロイ
    │
    └─ NO  → 急ぎ
           ↓
       【判断2】原因は分かっているか？
           ├─ YES → 方法2：Gitで戻す
           │
           └─ NO  → 方法1：バックアップから復元
                   → 後で原因を調査
```

---

## ✅ この回のチェックリスト

- [ ] deploy.sh の問題点を理解した
- [ ] 安全な deploy.sh を作成した
- [ ] デプロイを実際に実行した
- [ ] わざと失敗させてリカバリを体験した
- [ ] デプロイ前チェックリストを作成した
- [ ] リカバリの3つの方法を理解した

---

## 🎓 この回で学んだこと

**最重要ポイント：**
> **デプロイは「成功」と「失敗」の2択ではない。失敗しても戻せることが重要。**

**具体的に学んだこと：**
1. deploy.sh の改良（バックアップ・エラーハンドリング・構文チェック）
2. デプロイ前チェックリストの作成
3. 失敗時のリカバリフロー
4. バックアップの重要性

---

## 📝 次回予告

**第14回：ログによる調査の基礎体力**

安全なデプロイフローができたので、次は「トラブルが起きたときの調査方法」を学びます。

pm2 logs を活用して：
- エラーを探す
- 原因を特定する
- 適切なログを追加する

を体験します。

---

## 📦 この回で作成したファイル

### deploy.sh（改良版・サーバー側）

```bash
#!/bin/bash

set -e

echo "========================================="
echo "  安全なデプロイスクリプト v2.0"
echo "========================================="

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

PROJECT_DIR=~/git_practice
cd $PROJECT_DIR

BACKUP_DATE=$(date +"%Y%m%d_%H%M%S")
BACKUP_DIR=~/backups/$BACKUP_DATE

echo -e "${YELLOW}[1/7] バックアップを作成中...${NC}"
mkdir -p ~/backups
cp -r $PROJECT_DIR $BACKUP_DIR
echo -e "${GREEN}✓ バックアップ完了: $BACKUP_DIR${NC}"

echo -e "${YELLOW}[2/7] 現在のBotを停止中...${NC}"
pm2 stop discord-bot || echo "Botが起動していませんでした"

echo -e "${YELLOW}[3/7] 最新のコードを取得中...${NC}"
git pull origin main
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ git pull が失敗しました${NC}"
    echo "バックアップから復元するには: cp -r $BACKUP_DIR/* $PROJECT_DIR/"
    exit 1
fi
echo -e "${GREEN}✓ コード取得完了${NC}"

echo -e "${YELLOW}[4/7] 依存関係をインストール中...${NC}"
npm install
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ npm install が失敗しました${NC}"
    echo "バックアップから復元するには: cp -r $BACKUP_DIR/* $PROJECT_DIR/"
    exit 1
fi
echo -e "${GREEN}✓ 依存関係のインストール完了${NC}"

echo -e "${YELLOW}[5/7] 構文チェック中...${NC}"
node -c index.js
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ index.js に構文エラーがあります${NC}"
    echo "バックアップから復元するには: cp -r $BACKUP_DIR/* $PROJECT_DIR/"
    exit 1
fi
echo -e "${GREEN}✓ 構文チェック完了${NC}"

echo -e "${YELLOW}[6/7] Botを再起動中...${NC}"
pm2 restart discord-bot
if [ $? -ne 0 ]; then
    echo -e "${RED}✗ Bot の再起動に失敗しました${NC}"
    echo "バックアップから復元するには: cp -r $BACKUP_DIR/* $PROJECT_DIR/"
    exit 1
fi
echo -e "${GREEN}✓ Bot再起動完了${NC}"

echo -e "${YELLOW}[7/7] 動作確認中（5秒待機）...${NC}"
sleep 5
pm2 status discord-bot | grep "online"
if [ $? -eq 0 ]; then
    echo -e "${GREEN}✓ Botは正常に動作しています${NC}"
else
    echo -e "${RED}✗ Botが起動していません${NC}"
    echo "ログを確認: pm2 logs discord-bot"
    echo "バックアップから復元するには: cp -r $BACKUP_DIR/* $PROJECT_DIR/"
    exit 1
fi

echo ""
echo -e "${GREEN}=========================================${NC}"
echo -e "${GREEN}  デプロイが完了しました！${NC}"
echo -e "${GREEN}=========================================${NC}"
echo ""
echo "ログを確認: pm2 logs discord-bot"
echo "バックアップ: $BACKUP_DIR"
echo ""
```

### DEPLOY_CHECKLIST.md（ローカル側）

（上記の内容を参照）

---

これで第13回は完了です！

次回（第14回）では、ログを使った調査方法を学びます。
