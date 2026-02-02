# 第9回：SSH 本番環境にデプロイ

ローカルPCで動いていた Bot を **本番環境** に移します。  
24時間稼働する Bot を実現します。

---

## 📌 この回の目標

- サーバーに SSH 接続する
- Bot をサーバーにデプロイする
- プロセスマネージャー（PM2）で常時起動
- 環境変数を安全に管理する

**💡 ポイント：**
- ローカルと本番は別物
- セキュリティを意識
- 自動再起動の仕組み

---

## 🎯 完成イメージ

```
【ローカル】
- 開発用
- 手動起動・停止
- テスト環境

【本番サーバー】
- 24時間稼働
- 自動再起動
- ログ管理
- 複数プロセス対応
```

**👉 「本物の Bot」になります**

---

## 📚 事前準備

### この回で必要なもの

- ✅ VPS または GCP のアカウント
- ✅ SSH クライアント（Windows: PowerShell or WSL）
- ✅ 第8回までの完成プロジェクト

### サーバーの選択肢

| サービス | 料金 | 推奨度 |
|---------|------|--------|
| Google Cloud (GCP) | 無料枠あり | ⭐⭐⭐ |
| AWS EC2 | 無料枠あり | ⭐⭐⭐ |
| ConoHa VPS | 月600円〜 | ⭐⭐ |
| さくらVPS | 月880円〜 | ⭐⭐ |

**このハンズオンでは GCP を前提に進めます**

---

## 第1章：GCP でサーバーを準備（15分）

### 1-1. GCP Console にアクセス

1. [Google Cloud Console](https://console.cloud.google.com/) にアクセス
2. 新しいプロジェクトを作成
   - プロジェクト名: `discord-bot-server`

---

### 1-2. Compute Engine インスタンスを作成

1. **Compute Engine → VM インスタンス** に移動
2. **インスタンスを作成** をクリック

**設定：**
- **名前**: `discord-bot-instance`
- **リージョン**: `asia-northeast1（東京）`
- **マシンタイプ**: `e2-micro`（無料枠対象）
- **ブートディスク**: 
  - OS: `Ubuntu 22.04 LTS`
  - ディスクサイズ: `10GB`
- **ファイアウォール**: 
  - HTTPトラフィック: チェックなし
  - HTTPSトラフィック: チェックなし

3. **作成** をクリック

**💡 無料枠：**
- e2-micro: 月730時間まで無料
- ディスク: 30GBまで無料
- この構成なら完全無料で運用可能

---

### 1-3. 外部 IP アドレスを確認

VM インスタンス一覧に表示される **外部 IP** をメモしてください。

例: `34.84.123.456`

---

## 第2章：SSH 接続（15分）

### 2-1. SSH キーの設定（初回のみ）

この章は、ローカル（あなたのPC）とサーバー（SSHで入る先）を行き来します。  
手順の冒頭で「ローカルで実行」「サーバーで実行」を必ず確認してから進めてください。


**ローカルPC（Windows PowerShell）で実行：**

```bash
# SSH キーを生成
ssh-keygen -t rsa -b 2048 -f ~/.ssh/gcp-discord-bot

# パスフレーズは任意（Enter でスキップ可）
```

**公開鍵を表示：**
```bash
cat ~/.ssh/gcp-discord-bot.pub
```

出力された内容をコピーしてください。

---

### 2-2. GCP に公開鍵を登録

1. GCP Console → **Compute Engine → メタデータ**
2. **SSH 認証鍵** タブ
3. **項目を追加**
4. コピーした公開鍵を貼り付け
5. **保存**

---

### 2-3. SSH 接続テスト

この章は、ローカル（あなたのPC）とサーバー（SSHで入る先）を行き来します。  
手順の冒頭で「ローカルで実行」「サーバーで実行」を必ず確認してから進めてください。


**ローカルPC（PowerShell）で実行：**

```bash
ssh -i ~/.ssh/gcp-discord-bot <ユーザー名>@<外部IP>
```

**例：**
```bash
ssh -i ~/.ssh/gcp-discord-bot discord_bot@34.84.123.456
```

**初回接続時の確認：**
```
The authenticity of host ... can't be established.
Are you sure you want to continue connecting (yes/no)?
```

→ `yes` と入力

**✅ 接続成功すると、サーバーのターミナルが表示されます**

```
Welcome to Ubuntu 22.04 LTS
discord_bot@discord-bot-instance:~$
```

---

## 第3章：サーバーに必要なソフトをインストール（20分）

### 3-1. システム更新

```bash
sudo apt update
sudo apt upgrade -y
```

---

### 3-2. Node.js のインストール

```bash
# NodeSourceリポジトリを追加
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -

# Node.jsをインストール
sudo apt install -y nodejs

# バージョン確認
node -v
npm -v
```

**✅ v20.x.x が表示されればOK**

---

### 3-3. PM2 のインストール

PM2 は Node.js プロセスマネージャーです。

```bash
sudo npm install -g pm2
```

**PM2 の機能：**
- 自動再起動
- ログ管理
- 複数プロセス管理
- モニタリング

---

### 3-4. Git のインストール

```bash
sudo apt install -y git
```

---

## 第4章：Bot のデプロイ（20分）

### 4-1. GitHub からクローン

**サーバー上で実行：**

```bash
# ホームディレクトリに移動
cd ~

# リポジトリをクローン
git clone https://github.com/<あなたのユーザー名>/git_practice.git

# ディレクトリに移動
cd git_practice
```

---

### 4-2. 依存パッケージのインストール

```bash
npm install
```

---

### 4-3. 環境変数の設定

**`.env` ファイルを作成：**

```bash
nano .env
```

**以下の内容を入力：**
```
DISCORD_TOKEN=あなたのトークン
CLIENT_ID=あなたのクライアントID
GEMINI_API_KEY=あなたのGemini APIキー
```

**保存方法：**
- `Ctrl + O` → Enter（保存）
- `Ctrl + X`（終了）

**⚠️ セキュリティ：**
- `.env` ファイルは絶対に Git にコミットしない
- サーバー上でのみ作成

---

### 4-4. コマンドの登録

```bash
node register-commands.js
```

---

### 4-5. Bot をテスト起動

```bash
node index.js
```

**✅ Bot がオンラインになることを確認**

Discord で `/hello` など試してください。

**停止方法：**
```bash
Ctrl + C
```

---

## 第5章：PM2 でプロセス管理（20分）

### 5-1. PM2 で起動

```bash
pm2 start index.js --name discord-bot
```

**出力例：**
```
┌────┬────────────────┬─────────┬─────────┬──────────┐
│ id │ name           │ mode    │ status  │ cpu      │
├────┼────────────────┼─────────┼─────────┼──────────┤
│ 0  │ discord-bot    │ fork    │ online  │ 0%       │
└────┴────────────────┴─────────┴─────────┴──────────┘
```

**✅ status が online になっていればOK**

---

### 5-2. PM2 の基本コマンド

**⚠️ サーバー上で実行します。**

PM2 で Bot を管理するための基本的なコマンドを覚えましょう。

**これらのコマンドはすべてサーバーのターミナルで実行します。**

ここで追加する処理は、**スラッシュコマンドを実行した瞬間**に動くものです。  
`index.js` を開き、`client.on('interactionCreate', ...)` を探してください。  
その中の `if (!interaction.isChatInputCommand()) return;` があるブロックが対象です。  
この章のコードは、基本的にその **ブロックの中**（他の `if (interaction.commandName === ...)` と同じ並び）に入れます。


```bash
# プロセス一覧
pm2 list

# ログを表示
pm2 logs discord-bot

# プロセスを停止
pm2 stop discord-bot

# プロセスを再起動
pm2 restart discord-bot

# プロセスを削除
pm2 delete discord-bot

# モニタリング
pm2 monit
```

---

### 5-3. 自動起動設定

サーバー再起動時に自動で Bot を起動します：

```bash
# PM2のスタートアップスクリプトを生成
pm2 startup

# 表示されたコマンドをコピーして実行（例）
sudo env PATH=$PATH:/usr/bin pm2 startup systemd -u discord_bot --hp /home/discord_bot

# 現在の設定を保存
pm2 save
```

**テスト：**
```bash
# サーバーを再起動
sudo reboot

# （再起動後、再度SSH接続）

# Bot が自動起動していることを確認
pm2 list
```

**✅ discord-bot が online になっていればOK**

---

### 5-4. ログローテーション

ログファイルが大きくなりすぎないように設定：

```bash
pm2 install pm2-logrotate

# 設定
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## 第6章：更新とデプロイフロー（15分）

### 6-1. 開発の流れ

**ローカルPC：**
1. コードを修正
2. Git にコミット・プッシュ

**サーバー：**
1. 最新コードを取得
2. Bot を再起動

---

### 6-2. サーバーでの更新手順

```bash
# 最新コードを取得
cd ~/git_practice
git pull

# 依存関係を更新（package.json が変更された場合）
npm install

# コマンド再登録（必要な場合）
node register-commands.js

# Bot を再起動
pm2 restart discord-bot
```

---

### 6-3. デプロイスクリプトの作成

この章は、ローカル（あなたのPC）とサーバー（SSHで入る先）を行き来します。  
手順の冒頭で「ローカルで実行」「サーバーで実行」を必ず確認してから進めてください。


更新作業を自動化します：

**`deploy.sh` を作成：**

```bash
nano deploy.sh
```

**内容：**
```bash
#!/bin/bash

echo "🚀 デプロイ開始..."

# 最新コードを取得
git pull

# 依存関係を更新
npm install

# Botを再起動
pm2 restart discord-bot

echo "✅ デプロイ完了"
```

**実行権限を付与：**
```bash
chmod +x deploy.sh
```

**使い方：**
```bash
./deploy.sh
```

---

## 第7章：監視とメンテナンス（10分）

### 7-1. ヘルスチェック

**サーバー上でcronを設定：**

```bash
crontab -e
```

**以下を追加（5分ごとにチェック）：**
```
*/5 * * * * pm2 ping discord-bot || pm2 restart discord-bot
```

---

### 7-2. ディスク容量の確認

```bash
df -h
```

---

### 7-3. メモリ使用量の確認

```bash
free -h
```

---

### 7-4. ログの確認

```bash
# リアルタイムでログを表示
pm2 logs discord-bot --lines 100

# エラーログのみ
pm2 logs discord-bot --err

# 特定期間のログ
pm2 logs discord-bot --lines 1000 --timestamp
```

---

## 第8章：セキュリティ対策（10分）

### 8-1. ファイアウォール設定

```bash
# UFWをインストール（通常は既に入っている）
sudo apt install ufw

# SSH接続を許可
sudo ufw allow ssh

# ファイアウォールを有効化
sudo ufw enable

# 状態確認
sudo ufw status
```

---

### 8-2. 自動セキュリティアップデート

```bash
sudo apt install unattended-upgrades
sudo dpkg-reconfigure --priority=low unattended-upgrades
```

---

### 8-3. SSH セキュリティ強化

この章は、ローカル（あなたのPC）とサーバー（SSHで入る先）を行き来します。  
手順の冒頭で「ローカルで実行」「サーバーで実行」を必ず確認してから進めてください。


**SSH 設定を編集：**
```bash
sudo nano /etc/ssh/sshd_config
```

**変更箇所：**
```
# パスワード認証を無効化
PasswordAuthentication no

# ルートログインを無効化
PermitRootLogin no
```

**設定を反映：**
```bash
sudo systemctl restart sshd
```

---

## 第9章：トラブルシューティング（5分）

### Bot が起動しない

```bash
# ログを確認
pm2 logs discord-bot

# プロセスを確認
pm2 list

# 手動起動でエラーを確認
node index.js
```

---

### メモリ不足

```bash
# メモリを確認
free -h

# 不要なプロセスを停止
pm2 delete 不要なプロセス名
```

---

### ディスク容量不足

```bash
# 容量確認
df -h

# ログを削除
pm2 flush

# 古いログファイルを削除
find ~/.pm2/logs -type f -mtime +7 -delete
```

---

## ✅ この回のチェックリスト

- [ ] GCP でサーバーを作成できた
- [ ] SSH 接続できた
- [ ] Node.js をインストールした
- [ ] PM2 をインストールした
- [ ] Bot をデプロイできた
- [ ] PM2 で起動できた
- [ ] 自動起動設定が完了した
- [ ] デプロイスクリプトを作成した

---

## 🔍 今日覚えること

### SSH の基本

この章は、ローカル（あなたのPC）とサーバー（SSHで入る先）を行き来します。  
手順の冒頭で「ローカルで実行」「サーバーで実行」を必ず確認してから進めてください。


- 公開鍵認証
- SSH接続コマンド
- セキュリティ設定

### プロセス管理

- PM2 の使い方
- 自動再起動
- ログ管理

### デプロイフロー

この章は、ローカル（あなたのPC）とサーバー（SSHで入る先）を行き来します。  
手順の冒頭で「ローカルで実行」「サーバーで実行」を必ず確認してから進めてください。


- Git pull → npm install → 再起動
- デプロイスクリプト
- 監視とメンテナンス

---

## 📊 本番運用のチェックリスト

### 必須対策

- [x] PM2 で自動再起動
- [x] ログローテーション
- [x] 自動起動設定
- [x] ファイアウォール

### 推奨対策

- [ ] 監視アラート（Discord Webhook）
- [ ] バックアップ（データベース）
- [ ] 複数サーバー（冗長化）
- [ ] CDN（画像配信など）

---

## 🎓 発展課題（自習用）

1. **CI/CD 導入**
   - GitHub Actions で自動デプロイ

2. **Docker 化**
   - コンテナで実行

3. **負荷分散**
   - 複数サーバーで運用

---

## 次回予告

### 第10回：通し確認＋振り返り

最終回は：
- 全機能の動作確認
- パフォーマンステスト
- 改善点の洗い出し
- 今後の拡張アイデア

**👉 ここまでの学習を総まとめします！**
---

## 📦 第9回の完成版ソースコード

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
├── spam-detector.js
├── content-filter.js
└── deploy.sh（★新規）
```

---

### 新規ファイル：deploy.sh

**サーバー上で作成するデプロイスクリプト：**

```bash
#!/bin/bash

# デプロイスクリプト
# 使い方: ./deploy.sh

echo "🚀 デプロイを開始します..."

# Git から最新のコードを取得
echo "📥 最新のコードを取得中..."
git pull origin main

# 依存パッケージのインストール
echo "📦 パッケージをインストール中..."
npm install

# コマンドを再登録
echo "🔧 コマンドを再登録中..."
node register-commands.js

# PM2 でBotを再起動
echo "♻️ Botを再起動中..."
pm2 restart discord-bot || pm2 start index.js --name discord-bot

# ログを表示
echo "📊 Botの状態:"
pm2 status

echo "✅ デプロイ完了！"
echo ""
echo "ログを確認する: pm2 logs discord-bot"
echo "停止する: pm2 stop discord-bot"
echo "削除する: pm2 delete discord-bot"
```

**実行権限を付与：**
```bash
chmod +x deploy.sh
```

**使用方法：**
```bash
./deploy.sh
```

---

### index.js の変更点

**第8回と基本的に同じです。** デプロイのための変更は不要です。

ただし、本番環境での実行を想定して、以下の点を確認：

1. **環境変数が正しく設定されているか**
   - `.env` ファイルがサーバー上に存在し、正しい値が入っているか
   
2. **ログ出力が適切か**
   - `console.log()` で重要な情報を出力しているか
   - エラーログが記録されているか

3. **データベースのパス**
   - `bot.db` が適切な場所に作成されるか
   - 権限の問題がないか

---

### サーバー上での環境設定

**1. .envファイルの作成（サーバー上）：**
```bash
nano .env
```

```
DISCORD_TOKEN=あなたのトークン
CLIENT_ID=あなたのアプリケーションID
GUILD_ID=あなたのサーバーID
GEMINI_API_KEY=あなたのGemini APIキー
```

**2. PM2の設定ファイル（オプション）：**

`ecosystem.config.js` を作成：

```javascript
module.exports = {
  apps: [{
    name: 'discord-bot',
    script: 'index.js',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '500M',
    env: {
      NODE_ENV: 'production'
    },
    error_file: './logs/err.log',
    out_file: './logs/out.log',
    log_file: './logs/combined.log',
    time: true
  }]
};
```

**PM2で起動（設定ファイル使用）：**
```bash
pm2 start ecosystem.config.js
```

---

### PM2 主要コマンド一覧

**基本操作：**
```bash
# 起動
pm2 start index.js --name discord-bot

# 停止
pm2 stop discord-bot

# 再起動
pm2 restart discord-bot

# 削除
pm2 delete discord-bot

# 状態確認
pm2 status

# ログ確認
pm2 logs discord-bot

# リアルタイムモニター
pm2 monit
```

**自動起動設定：**
```bash
# 現在の状態を保存
pm2 save

# 自動起動を有効化
pm2 startup

# 表示されたコマンドを実行（sudoが含まれる場合があります）
```

---

### トラブルシューティング

**問題1: Botが起動しない**
```bash
# ログを確認
pm2 logs discord-bot

# エラーの内容を確認
# よくある原因：
# - .env ファイルがない
# - 環境変数が間違っている
# - パッケージがインストールされていない
```

**問題2: コマンドが反映されない**
```bash
# コマンドを再登録
node register-commands.js

# Botを再起動
pm2 restart discord-bot
```

**問題3: データベースエラー**
```bash
# データベースファイルの権限を確認
ls -la bot.db

# 必要に応じて権限を変更
chmod 644 bot.db
```

これで第9回は完成です！

