# 第18回：Botをもう1体増やす判断をする

「もう1つ別のサーバー用のBotを作りたい...」
「でも、新しいサーバーを借りるのはコストが...」

**1つのサーバーで複数のBotを動かせます。**

この回では、1インスタンスで複数Botを管理する方法と、その判断基準を学びます。

---

## 📌 この回の目標

- 1サーバーで複数Botを動かせる
- ディレクトリとenvを分離できる
- pm2で複数Botを管理できる

**💡 ポイント：**
- 1サーバー = 1Bot ではない
- ディレクトリとデータベースを分ける
- リソースの監視が重要

---

## 🎯 完成イメージ

```
【現在の構成】
GCP Compute Engine
  └── discord-bot（1体のみ）

【この回の完成形】
GCP Compute Engine
  ├── discord-bot（メンタルサポート用）
  └── discord-bot-game（ゲームサーバー用）
  
それぞれ：
- 別のディレクトリ
- 別のデータベース
- 別のトークン
- 別のGitリポジトリ（またはブランチ）
```

---

## 第1章：複数Bot運用の判断基準（10分）

### 1-1. いつ複数Botを運用すべきか

**✅ 複数Bot運用が適している場合：**

1. **異なるDiscordサーバーで使う**
   - サーバーA：メンタルサポート用Bot
   - サーバーB：ゲームコミュニティ用Bot
   - データは完全に分離したい

2. **機能が大きく異なる**
   - Bot A：気分記録Bot（現在のBot）
   - Bot B：ゲーム統計Bot
   - コードベースが違う

3. **開発環境と本番環境を分ける**
   - Bot A：本番環境
   - Bot B：テスト環境（別のサーバーで動かす）

4. **チーム開発**
   - Bot A：チームメンバーA担当
   - Bot B：チームメンバーB担当

---

**❌ 複数Bot運用が不適切な場合：**

1. **同じDiscordサーバーで使う**
   - 1つのサーバーに複数Botがいると混乱
   - 1つのBotに機能を統合すべき

2. **機能がほぼ同じ**
   - 重複したコード
   - メンテナンスコストが2倍

3. **サーバーリソースが足りない**
   - メモリ不足
   - CPU使用率が高い

---

### 1-2. リソースの見積もり

**現在のBot のリソース使用量を確認：**

**サーバーで実行：**

```bash
# メモリ使用量
pm2 status discord-bot

# 詳細情報
pm2 show discord-bot

# システム全体のリソース
htop
# または
top
```

**出力例：**

```
│ memory               │ 45.2 MB      │
│ cpu                  │ 0.1%         │
```

---

**2体目を追加した場合の見積もり：**

```
現在：
- メモリ：45MB
- CPU：0.1%

2体目追加後：
- メモリ：90MB（45MB × 2）
- CPU：0.2%

サーバーのスペック：
- メモリ：1GB（1024MB）
- CPU：1コア

結論：
- メモリ：余裕あり（90MB / 1024MB = 約9%使用）
- CPU：余裕あり
→ 2体目を追加してもOK
```

---

## 第2章：ディレクトリ構成の設計（15分）

### 2-1. ディレクトリ構成の例

**推奨構成：**

```
~/ (ホームディレクトリ)
├── bots/
│   ├── mental-support-bot/     ← 既存のBot（移動）
│   │   ├── .env
│   │   ├── index.js
│   │   ├── bot.db
│   │   └── ...
│   │
│   └── game-stats-bot/         ← 新しいBot
│       ├── .env
│       ├── index.js
│       ├── bot.db
│       └── ...
│
├── backups/
│   ├── mental-support-bot/
│   └── game-stats-bot/
│
└── deploy-scripts/
    ├── deploy-mental.sh
    └── deploy-game.sh
```

---

### 2-2. 既存Botの移動

**⚠️ 慎重に作業してください。**

**サーバーで実行：**

```bash
# 1. Botを停止
pm2 stop discord-bot

# 2. bots ディレクトリを作成
mkdir -p ~/bots

# 3. 既存のプロジェクトを移動
mv ~/git_practice ~/bots/mental-support-bot

# 4. シンボリックリンクを作成（後方互換性のため）
ln -s ~/bots/mental-support-bot ~/git_practice

# 5. 確認
ls -la ~/
ls -la ~/bots/

# 6. Bot を再起動
pm2 restart discord-bot

# 7. 動作確認
pm2 logs discord-bot
```

**✅ 正常に動作していれば移動完了。**

---

## 第3章：2体目のBotを追加（25分）

### 3-1. 新しいBotのDiscord設定

**Discord Developer Portal で作業：**

1. **新しいApplicationを作成**
   - https://discord.com/developers/applications
   - 「New Application」をクリック
   - 名前：`game-stats-bot`

2. **Botを追加**
   - 左メニュー「Bot」
   - 「Add Bot」
   - トークンをコピー（後で使う）

3. **権限設定**
   - Privileged Gateway Intents:
     - MESSAGE CONTENT INTENT: ON
     - SERVER MEMBERS INTENT: ON

4. **OAuth2設定**
   - 左メニュー「OAuth2」→「URL Generator」
   - SCOPES: `bot`, `applications.commands`
   - BOT PERMISSIONS: 必要な権限を選択
   - URLをコピーして、Botを招待

---

### 3-2. 2体目のBot用ディレクトリ作成

**サーバーで実行：**

```bash
cd ~/bots

# 既存のBotをテンプレートとしてコピー
cp -r mental-support-bot game-stats-bot

cd game-stats-bot

# .env を編集
nano .env
```

**.env の内容（game-stats-bot用）：**

```
# 環境設定
NODE_ENV=production

# Discord設定（新しいBot用）
DISCORD_TOKEN=<新しいBotのトークン>
CLIENT_ID=<新しいBotのクライアントID>
GUILD_ID=<ゲームサーバーのギルドID>

# Gemini API（同じでOK）
GEMINI_API_KEY=<あなたのGemini APIキー>

# データベース設定
DATABASE_PATH=./bot.db

# ログレベル
LOG_LEVEL=info
```

**保存して閉じる：**
- `Ctrl + X` → `Y` → `Enter`

---

### 3-3. データベースの初期化

**新しいBot用のデータベースを作成：**

```bash
# 古いデータベースを削除
rm bot.db

# Bot を起動すると、自動的に新しいデータベースが作成される
```

---

### 3-4. スラッシュコマンドの登録

```bash
# コマンドを登録
node register-commands.js
```

**✅ 成功すると：**
```
コマンドを登録しました！
```

---

### 3-5. PM2で2体目を起動

```bash
# game-stats-bot を起動
pm2 start index.js --name game-stats-bot

# 確認
pm2 status
```

**出力例：**

```
┌─────┬──────────────────────┬─────────┬─────────┬─────────┐
│ id  │ name                 │ status  │ cpu     │ memory  │
├─────┼──────────────────────┼─────────┼─────────┼─────────┤
│ 0   │ discord-bot          │ online  │ 0.1%    │ 45.2 MB │
│ 1   │ game-stats-bot       │ online  │ 0.1%    │ 43.8 MB │
└─────┴──────────────────────┴─────────┴─────────┴─────────┘
```

**✅ 両方とも `online` になっていればOK！**

---

### 3-6. 動作確認

**Discord（ゲームサーバー）で確認：**

1. `/feeling` コマンドを実行
2. 正常に動作すればOK

**ログを確認：**

```bash
pm2 logs game-stats-bot
```

---

### 3-7. PM2設定を保存

```bash
# 現在の設定を保存
pm2 save

# システム起動時に自動起動（すでに設定済みの場合はスキップ）
pm2 startup
# 表示されたコマンドを実行
```

---

## 第4章：複数Botの管理（20分）

### 4-1. PM2での複数Bot管理

**すべてのBotを一覧表示：**

```bash
pm2 list
```

---

**特定のBotを操作：**

```bash
# 停止
pm2 stop discord-bot
pm2 stop game-stats-bot

# 再起動
pm2 restart discord-bot
pm2 restart game-stats-bot

# 削除
pm2 delete game-stats-bot
```

---

**すべてのBotを一括操作：**

```bash
# すべて再起動
pm2 restart all

# すべて停止
pm2 stop all

# すべてのログを表示
pm2 logs

# 特定のBotのログのみ
pm2 logs discord-bot
pm2 logs game-stats-bot
```

---

### 4-2. リソース監視

**リアルタイムでリソースを監視：**

```bash
pm2 monit
```

**出力例：**

```
┌─ Process list ────────────────────────────────────────┐
│ discord-bot        online │ 0.1% │ 45.2 MB │
│ game-stats-bot     online │ 0.1% │ 43.8 MB │
└───────────────────────────────────────────────────────┘

┌─ Custom metrics (discord-bot) ────────────────────────┐
│ Loop delay: 0.50ms                                    │
└───────────────────────────────────────────────────────┘
```

**終了：**
- `Ctrl + C`

---

**メモリ使用量の確認：**

```bash
pm2 status
```

**⚠️ 注意すべき指標：**

```
メモリ使用量が90%を超えたら危険：
- Bot を減らす
- サーバーのスペックアップ
- メモリリークの調査

CPU使用率が継続的に80%を超えたら危険：
- 処理を軽量化
- サーバーのスペックアップ
```

---

### 4-3. デプロイスクリプトの分離

**各Bot用のデプロイスクリプトを作成：**

**mental-support-bot 用：**

```bash
cd ~/bots/mental-support-bot
nano deploy.sh
```

**内容（第13回のdeploy.shと同じ）：**

```bash
#!/bin/bash
set -e

PROJECT_DIR=~/bots/mental-support-bot
BOT_NAME=discord-bot

cd $PROJECT_DIR

echo "[$BOT_NAME] デプロイ開始..."

# バックアップ
BACKUP_DIR=~/backups/mental-support-bot/$(date +"%Y%m%d_%H%M%S")
mkdir -p $BACKUP_DIR
cp -r $PROJECT_DIR/* $BACKUP_DIR/

# コード更新
git pull origin main
npm install

# 構文チェック
node -c index.js

# Bot再起動
pm2 restart $BOT_NAME

echo "[$BOT_NAME] デプロイ完了"
```

**実行権限を付与：**

```bash
chmod +x deploy.sh
```

---

**game-stats-bot 用：**

```bash
cd ~/bots/game-stats-bot
nano deploy.sh
```

**内容（BOT_NAMEを変更）：**

```bash
#!/bin/bash
set -e

PROJECT_DIR=~/bots/game-stats-bot
BOT_NAME=game-stats-bot

cd $PROJECT_DIR

echo "[$BOT_NAME] デプロイ開始..."

# バックアップ
BACKUP_DIR=~/backups/game-stats-bot/$(date +"%Y%m%d_%H%M%S")
mkdir -p $BACKUP_DIR
cp -r $PROJECT_DIR/* $BACKUP_DIR/

# コード更新
git pull origin main
npm install

# 構文チェック
node -c index.js

# Bot再起動
pm2 restart $BOT_NAME

echo "[$BOT_NAME] デプロイ完了"
```

**実行権限を付与：**

```bash
chmod +x deploy.sh
```

---

### 4-4. バックアップスクリプトの更新

**全Bot用のバックアップスクリプト：**

```bash
nano ~/backup-all-bots.sh
```

**内容：**

```bash
#!/bin/bash

echo "=== すべてのBotをバックアップ ==="

# mental-support-bot
echo "[1/2] mental-support-bot をバックアップ中..."
cd ~/bots/mental-support-bot
./backup.sh

# game-stats-bot
echo "[2/2] game-stats-bot をバックアップ中..."
cd ~/bots/game-stats-bot
./backup.sh

echo "=== バックアップ完了 ==="
```

**実行権限を付与：**

```bash
chmod +x ~/backup-all-bots.sh
```

---

**cron設定を更新：**

```bash
crontab -e
```

**変更：**

```
# 毎日午前3時にすべてのBotをバックアップ
0 3 * * * /home/discord_bot/backup-all-bots.sh >> /home/discord_bot/backup.log 2>&1
```

---

## 第5章：運用上の注意点（10分）

### 5-1. リソースの監視

**定期的にチェック：**

```bash
# 週1回程度
pm2 status
```

**メモリリークの兆候：**

```
- メモリ使用量が徐々に増加
- 再起動すると減る
- 長時間動かすとBot が遅くなる

対策：
- コードの見直し（メモリリークの修正）
- 定期的な再起動（cron で週1回など）
```

---

### 5-2. ログの管理

**ログファイルの肥大化を防ぐ：**

```bash
# pm2-logrotate の設定を確認
pm2 conf pm2-logrotate

# ログサイズの制限
pm2 set pm2-logrotate:max_size 10M

# 保持期間
pm2 set pm2-logrotate:retain 7
```

---

### 5-3. Bot間の独立性を保つ

**❌ 悪い例：Botが互いに依存**

```javascript
// discord-bot の index.js
const gameBot = require('../game-stats-bot/index.js');  // ❌

// 問題：
// - 片方のBotがもう片方に依存
// - 独立して動かせない
```

**✅ 良い例：完全に独立**

```javascript
// discord-bot の index.js
// 他のBotを参照しない

// もしBot間で連携が必要なら：
// - Webhook を使う
// - 共有データベースを使う（慎重に）
// - 外部API経由で連携
```

---

### 5-4. トラブルシューティング

**問題1：1つのBotだけが起動しない**

```bash
# ログを確認
pm2 logs game-stats-bot --err

# 原因の可能性：
# - .env の設定ミス
# - トークンの間違い
# - ポートの競合（通常はない）
```

---

**問題2：両方のBotが遅い**

```bash
# リソースを確認
pm2 status
free -h
top

# 原因の可能性：
# - メモリ不足
# - CPU使用率が高い
# - ディスク容量不足

# 対策：
# - サーバーのスペックアップ
# - Bot の数を減らす
```

---

## ✅ この回のチェックリスト

- [ ] 複数Bot運用の判断基準を理解した
- [ ] ディレクトリ構成を設計した
- [ ] 既存Botを移動した
- [ ] 2体目のBotを追加した
- [ ] PM2で複数Botを管理できる
- [ ] リソース監視の方法を理解した
- [ ] デプロイスクリプトを分離した
- [ ] バックアップを自動化した

---

## 🎓 この回で学んだこと

**最重要ポイント：**
> **1サーバー = 1Bot ではない。リソースが許す限り、複数Botを動かせる。ただし、独立性とリソース監視が重要。**

**具体的に学んだこと：**
1. 複数Bot運用の判断基準
2. ディレクトリとenvの分離方法
3. PM2での複数Bot管理
4. リソース監視の重要性
5. デプロイとバックアップの分離

---

## 📝 次回予告

**第19回：このBotは作り続ける価値があるか？**

複数Botを管理できるようになったので、次は「プロジェクト視点」を学びます。

- 拡張する／凍結する／捨てる の判断
- 継続コストの見積もり
- 技術ではなく「判断」

---

## 📦 この回で作成したファイル構成

```
~/ (ホームディレクトリ)
├── bots/
│   ├── mental-support-bot/
│   │   ├── .env
│   │   ├── index.js
│   │   ├── bot.db
│   │   ├── deploy.sh
│   │   ├── backup.sh
│   │   └── ...
│   │
│   └── game-stats-bot/
│       ├── .env
│       ├── index.js
│       ├── bot.db
│       ├── deploy.sh
│       ├── backup.sh
│       └── ...
│
├── backups/
│   ├── mental-support-bot/
│   │   ├── database/
│   │   └── YYYYMMDD_HHMMSS/
│   │
│   └── game-stats-bot/
│       ├── database/
│       └── YYYYMMDD_HHMMSS/
│
├── backup-all-bots.sh
├── backup.log
└── git_practice -> bots/mental-support-bot (シンボリックリンク)
```

---

## 🔧 よくある質問

**Q1: 何体までBotを動かせる？**
A: サーバーのスペック次第です。1GB メモリなら5〜10体程度は可能ですが、
   実際には3〜4体程度に抑えることを推奨します。

**Q2: Bot間でデータベースを共有してもいい？**
A: 可能ですが、推奨しません。データの整合性が難しくなります。
   どうしても共有したい場合は、PostgreSQLなど本格的なDBMSを使用してください。

**Q3: 2体目を追加したら、1体目が遅くなった。なぜ？**
A: リソースの競合が考えられます。`pm2 monit` でリソースを確認し、
   メモリやCPUが限界に達していないかチェックしてください。

**Q4: 1つのGitリポジトリで複数Botを管理できる？**
A: 可能です。ブランチを分けるか、サブディレクトリで管理します。
   ただし、完全に独立したプロジェクトなら、別リポジトリを推奨します。

---

これで第18回は完了です！

次回（第19回）では、プロジェクトの継続判断について学びます。
