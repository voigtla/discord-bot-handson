# 第20回（最終回）：自分がいなくても回る状態を作る

「もし明日、自分がいなくなったら...このBotはどうなる？」

**誰もメンテナンスできず、サービスが止まる。**

この回では、**自分がいなくても誰かが引き継げる状態**を作る方法を学びます。

---

## 📌 この回の目標

- 引き継ぎドキュメントを作成できる
- 「何も分からない人」目線のREADMEが書ける
- データベース構造図を作成できる

**💡 ポイント：**
- 「自分にしか分からない」を排除
- 最悪のシナリオを想定する
- 引き継ぎは「いつか」ではなく「今」

---

## 🎯 完成イメージ

```
【引き継ぎドキュメントがないと】
開発者が突然いなくなる
  ↓
「どうやって動かすの？」
  ↓
「.env って何？」
  ↓
「データベースはどこ？」
  ↓
誰も引き継げず、サービス停止

【引き継ぎドキュメントがあると】
開発者が突然いなくなる
  ↓
HANDOVER.md を読む
  ↓
「なるほど、こうやって動かすのか」
  ↓
「.env はここにあって...」
  ↓
「データベースはこの構造で...」
  ↓
無事に引き継ぎ完了
```

---

## 第1章：なぜ引き継ぎが必要なのか（10分）

### 1-1. 最悪のシナリオ

**シナリオ1：自分が突然いなくなる**

```
理由：
- 事故・病気
- 転職・引っ越し
- 単純に飽きた

結果：
- 誰もBotをメンテナンスできない
- サーバーが止まっても誰も気づかない
- ユーザーのデータが失われる
```

---

**シナリオ2：引き継ぎ相手が見つかったが...**

```
あなた：「このBotを引き継いでほしい」
相手：「分かりました。どうやって動かすんですか？」
あなた：「えーっと、サーバーにSSHで...あ、パスワードどこだっけ？」
相手：「データベースの構造は？」
あなた：「えーっと、feelings テーブルがあって...あれ、他に何があったっけ？」
相手：「これ、引き継げないですね...」

結果：
- 引き継ぎ失敗
- サービス停止
```

---

### 1-2. 引き継ぎドキュメントの価値

**価値1：自分のため**

```
- 半年後の自分も「何も分からない人」
- 「なんでこうしたんだっけ？」を防ぐ
- 再開するときの助けになる
```

**価値2：引き継ぎ相手のため**

```
- 最速で引き継げる
- 迷わない
- 失敗しない
```

**価値3：ユーザーのため**

```
- サービスが継続する
- データが守られる
- 安心して使える
```

---

## 第2章：引き継ぎドキュメントの作成（30分）

### 2-1. HANDOVER.md のテンプレート

**ローカルPCで作業：**

```powershell
cd C:\Users\<あなたのユーザー名>\git_practice
New-Item -ItemType File -Name HANDOVER.md
code HANDOVER.md
```

**HANDOVER.md の内容：**

```markdown
# Bot 引き継ぎドキュメント

このドキュメントは、**何も知らない人**がこのBotを引き継げるように書かれています。

---

## 目次

1. [このBotについて](#このbotについて)
2. [サーバー情報](#サーバー情報)
3. [起動・停止方法](#起動停止方法)
4. [デプロイ方法](#デプロイ方法)
5. [トラブル対応](#トラブル対応)
6. [データベース構造](#データベース構造)
7. [連絡先](#連絡先)

---

## このBotについて

### 概要
Discord Bot for メンタルサポート

### 主な機能
- `/feeling`: 気分を記録
- `/count`: 気分の統計を表示
- `/ai`: AI相談
- `/help`: ヘルプ表示

### ユーザー数
約15人（2026年2月時点）

### 運用状態
- [ ] 拡張中（新機能を追加している）
- [x] 凍結（メンテナンスのみ）
- [ ] 廃止予定

---

## サーバー情報

### サーバー環境
- プロバイダー: Google Cloud Platform (GCP)
- インスタンス名: `discord-bot-instance`
- リージョン: `asia-northeast1`（東京）
- OS: Ubuntu 24.04 LTS
- スペック: e2-micro（1vCPU、1GB メモリ）

### SSH接続方法

**Windowsの場合：**
```powershell
ssh -i $env:USERPROFILE\.ssh\gcp-discord-bot discord_bot@<サーバーのIPアドレス>
```

**Macの場合：**
```bash
ssh -i ~/.ssh/gcp-discord-bot discord_bot@<サーバーのIPアドレス>
```

**IPアドレス:**
`XX.XX.XX.XX`（GCPコンソールで確認）

**SSHキーの場所:**
- ローカルPC: `~/.ssh/gcp-discord-bot`（秘密鍵）
- GCP: メタデータに公開鍵が登録済み

**⚠️ 重要:**
SSHキー（秘密鍵）は絶対に共有しないこと。
引き継ぐ場合は、新しいキーペアを作成してください。

---

## 起動・停止方法

### Botの状態確認

```bash
pm2 status
```

### Botの起動

```bash
cd ~/bots/mental-support-bot
pm2 start index.js --name discord-bot
pm2 save
```

### Botの停止

```bash
pm2 stop discord-bot
```

### Botの再起動

```bash
pm2 restart discord-bot
```

### ログの確認

```bash
# リアルタイムログ
pm2 logs discord-bot

# 過去100行
pm2 logs discord-bot --lines 100

# エラーログのみ
pm2 logs discord-bot --err
```

---

## デプロイ方法

### 前提条件
- GitHubリポジトリへのアクセス権
- サーバーへのSSH接続

### デプロイ手順

1. **ローカルPCで変更をプッシュ**
   ```bash
   git add .
   git commit -m "変更内容"
   git push origin main
   ```

2. **サーバーにSSH接続**
   ```bash
   ssh -i ~/.ssh/gcp-discord-bot discord_bot@<IP>
   ```

3. **デプロイスクリプトを実行**
   ```bash
   cd ~/bots/mental-support-bot
   ./deploy.sh
   ```

4. **動作確認**
   ```bash
   pm2 logs discord-bot
   ```

### デプロイ失敗時の対処

詳細は `RESTORE_PROCEDURE.md` を参照。

**最速の対処法:**
```bash
# バックアップから復元
ls -lt ~/backups/mental-support-bot/
cp -r ~/backups/mental-support-bot/最新の日時/* ~/bots/mental-support-bot/
pm2 restart discord-bot
```

---

## トラブル対応

### Bot が起動しない

**確認手順:**
1. ログを確認
   ```bash
   pm2 logs discord-bot --err --lines 50
   ```

2. エラーメッセージから原因を特定
   - "Cannot find module": `npm install` を実行
   - "API_KEY is not defined": `.env` を確認
   - "SyntaxError": コードの構文エラー → 前のバージョンに戻す

3. バックアップから復元（最終手段）
   ```bash
   cp -r ~/backups/mental-support-bot/最新/* ~/bots/mental-support-bot/
   pm2 restart discord-bot
   ```

### Bot が遅い

**確認手順:**
1. リソースを確認
   ```bash
   pm2 status
   htop
   ```

2. メモリ使用量が90%を超えている場合
   - Bot を再起動: `pm2 restart discord-bot`
   - 再起動しても改善しない場合 → メモリリーク（コードの修正が必要）

3. CPU使用率が80%を超えている場合
   - サーバーのスペック不足
   - GCPコンソールからインスタンスのスペックを上げる

### ユーザーからの問い合わせ

**よくある問い合わせ:**

| 問い合わせ | 対処法 |
|-----------|--------|
| 「Bot が反応しない」 | Bot が起動しているか確認（`pm2 status`） |
| 「データが消えた」 | バックアップから復元できるか確認 |
| 「新機能を追加してほしい」 | 運用状態を確認（凍結中の場合は丁寧に断る） |

---

## データベース構造

### データベースファイル
- 場所: `~/bots/mental-support-bot/bot.db`
- 種類: SQLite

### テーブル一覧

#### feelings テーブル（気分記録）

| カラム名 | 型 | 説明 | 例 |
|---------|---|------|---|
| id | INTEGER | 主キー（自動採番） | 1 |
| user_id | TEXT | DiscordユーザーID | "123456789012345678" |
| feeling | TEXT | 気分 | "良い", "普通", "悪い" |
| note | TEXT | メモ（オプション） | "今日は楽しかった" |
| tags | TEXT | タグ（オプション） | "仕事,運動" |
| created_at | DATETIME | 記録日時 | "2026-02-04 12:34:56" |

**クエリ例:**
```sql
-- すべての気分記録を取得
SELECT * FROM feelings;

-- 特定ユーザーの気分記録を取得
SELECT * FROM feelings WHERE user_id = '123456789012345678';

-- 最近7日間の気分を集計
SELECT feeling, COUNT(*) as count 
FROM feelings 
WHERE created_at >= date('now', '-7 days') 
GROUP BY feeling;
```

#### migrations テーブル（マイグレーション履歴）

| カラム名 | 型 | 説明 |
|---------|---|------|
| id | INTEGER | 主キー |
| name | TEXT | マイグレーション名 |
| executed_at | DATETIME | 実行日時 |

### バックアップ

- 場所: `~/backups/mental-support-bot/database/`
- 頻度: 毎日午前3時（cron）
- 保持期間: 7日分
- 手動バックアップ: `./backup.sh`

### 復元方法

詳細は `RESTORE_PROCEDURE.md` を参照。

---

## 連絡先

### 前任者（開発者）
- Discord: @your_discord_id
- Email: your_email@example.com
- GitHub: https://github.com/your_username

### 緊急連絡先
- （チームメンバーや信頼できる人の連絡先）

### 関連リンク
- GitHubリポジトリ: https://github.com/your_username/discord-bot
- Discord Developer Portal: https://discord.com/developers/applications
- GCP Console: https://console.cloud.google.com/

---

## その他の重要情報

### 費用
- サーバー代: 月500〜1000円（GCP）
- API利用料: 月200円程度（Gemini API）

### アカウント情報
- GCP: （アカウント所有者の情報）
- Discord Developer: （アカウント所有者の情報）
- GitHub: （リポジトリのオーナー）

### .env ファイルの場所と内容
- 場所: `~/bots/mental-support-bot/.env`
- ⚠️ このファイルは Git に含まれていません
- 引き継ぎ時は、安全な方法で共有してください

**必要な環境変数:**
```
NODE_ENV=production
DISCORD_TOKEN=<Discord Bot のトークン>
CLIENT_ID=<Discord Application のクライアントID>
GUILD_ID=<Discord サーバーのギルドID>
GEMINI_API_KEY=<Gemini API キー>
DATABASE_PATH=./bot.db
LOG_LEVEL=info
```

### セキュリティ上の注意
- SSHキーは絶対に共有しない
- .env ファイルの内容は慎重に扱う
- トークンやAPIキーが漏洩したら即座に再発行

---

## 最後に

このBotを引き継いでくれて、ありがとうございます。

何か分からないことがあれば、上記の連絡先に遠慮なく連絡してください。

このドキュメントは定期的に更新してください。
次の引き継ぎ者のために。

---

最終更新: 2026-02-04
作成者: （あなたの名前）
```

---

### 2-2. データベース構造図の作成

**図を作成するツール（推奨）:**

1. **draw.io（無料）**
   - https://app.diagrams.net/
   - ブラウザで動作
   - エクスポート可能

2. **dbdiagram.io（無料）**
   - https://dbdiagram.io/
   - テキストからER図を自動生成

---

**dbdiagram.io でのER図作成例：**

```
Table feelings {
  id integer [pk, increment]
  user_id text [not null]
  feeling text [not null]
  note text
  tags text
  created_at datetime [default: `CURRENT_TIMESTAMP`]
}

Table migrations {
  id integer [pk, increment]
  name text [not null, unique]
  executed_at datetime [default: `CURRENT_TIMESTAMP`]
}
```

**上記をコピーして、dbdiagram.io に貼り付けると、ER図が自動生成されます。**

**エクスポート：**
- PNG、SVG、PDF でエクスポート可能
- `DATABASE_STRUCTURE.png` として保存

---

## 第3章：「何も分からない人」目線のREADME（20分）

### 3-1. README.md の改善

**現在のREADME.md は、開発者目線で書かれています。**

**改善ポイント：**

```
Before:
「このBotは Discord.js 14.x を使用しています」

After:
「このBotは、Discord という チャットアプリで動くプログラムです」
```

---

**ローカルPCで作業：**

```powershell
code README.md
```

**README.md に追加する内容：**

```markdown
# Discord Bot - Mental Support

メンタルサポート用の Discord Bot です。

---

## 🚀 クイックスタート（初めての人向け）

### このBotを動かすには何が必要？

1. **Discord のアカウント**
   - 無料で作れます
   - https://discord.com/

2. **サーバー（パソコンが常に動いている場所）**
   - このBotは GCP（Google のクラウドサービス）で動いています
   - 月500〜1000円かかります

3. **APIキー（外部サービスを使うための鍵）**
   - Discord Bot Token：Discord でBotを動かすための鍵
   - Gemini API Key：AI機能を使うための鍵

### 初めてこのBotを触る人へ

1. `HANDOVER.md` を読んでください
   - サーバーへの接続方法
   - Botの起動・停止方法
   - トラブル対応

2. 分からない単語があれば：
   - `GLOSSARY.md`（用語集）を参照
   - または Google で検索

3. 実際に触ってみる
   - まずはサーバーに接続
   - `pm2 status` でBotの状態を確認
   - ログを見てみる

---

## 📁 ファイル構成（何がどこにあるか）

```
~/bots/mental-support-bot/
├── index.js              ← Bot のメインプログラム
├── ai-helper.js          ← AI機能
├── spam-detector.js      ← スパム検知
├── content-filter.js     ← 不適切な内容のフィルタ
├── register-commands.js  ← コマンドを Discord に登録
├── bot.db                ← データベース（ユーザーのデータ）
├── .env                  ← 秘密情報（トークンなど）
├── package.json          ← 必要なライブラリの一覧
├── deploy.sh             ← デプロイ（更新）用スクリプト
├── backup.sh             ← バックアップ用スクリプト
└── README.md             ← このファイル
```

---

## 🔧 よくある作業

### Bot を再起動したい

```bash
pm2 restart discord-bot
```

### ログを見たい

```bash
pm2 logs discord-bot
```

### コードを更新したい

```bash
./deploy.sh
```

### バックアップを取りたい

```bash
./backup.sh
```

---

## 📚 詳細ドキュメント

| ドキュメント | 内容 |
|------------|------|
| HANDOVER.md | 引き継ぎ情報（必読） |
| RESTORE_PROCEDURE.md | 復元手順 |
| BACKUP_PLAN.md | バックアップ計画 |
| PROJECT_COST_ANALYSIS.md | 運用コスト分析 |
| GLOSSARY.md | 用語集 |

---

## ❓ 困ったときは

1. `HANDOVER.md` の「トラブル対応」を見る
2. `pm2 logs discord-bot --err` でエラーログを確認
3. それでも分からなければ、前任者に連絡
   - Discord: @your_discord_id
   - Email: your_email@example.com

---

最終更新: 2026-02-04
```

---

### 3-2. 用語集（GLOSSARY.md）の作成

**ローカルPCで作業：**

```powershell
New-Item -ItemType File -Name GLOSSARY.md
code GLOSSARY.md
```

**GLOSSARY.md の内容：**

```markdown
# 用語集

このドキュメントは、技術用語を分かりやすく説明しています。

---

## Bot（ボット）
**意味:** 自動で動くプログラム

**例:** 
- Discordサーバーに投稿すると、自動で反応する
- 決まった時間に自動でメッセージを送る

---

## SSH（エスエスエイチ）
**正式名称:** Secure Shell

**意味:** 遠くにあるサーバーに安全に接続する方法

**例:**
- 自分のパソコンから、GCPのサーバーに接続
- ターミナル（黒い画面）で操作する

---

## API（エーピーアイ）
**正式名称:** Application Programming Interface

**意味:** プログラム同士がやり取りするための「窓口」

**例:**
- Discord API：Discord とBotがやり取りする窓口
- Gemini API：AI機能を使うための窓口

---

## トークン
**意味:** サービスを使うための「鍵」

**例:**
- Discord Bot Token：Botが Discord にログインするための鍵
- 漏れると悪用されるので、絶対に公開しない

---

## データベース（DB）
**意味:** データを整理して保存する場所

**例:**
- ユーザーの気分記録を保存
- 後で検索したり、集計したりできる

---

## PM2（ピーエムツー）
**意味:** Node.js のプログラムを管理するツール

**できること:**
- Botを起動・停止・再起動
- ログを確認
- サーバーが再起動してもBotを自動起動

---

## デプロイ
**意味:** 新しいバージョンのプログラムを本番環境に反映すること

**手順:**
1. ローカルPC でコードを編集
2. Git でサーバーに送信
3. サーバーで Bot を再起動

---

## ロールバック
**意味:** 前のバージョンに戻すこと

**使うとき:**
- 新しいバージョンでバグが出た
- 元の動作に戻したい

---

## バックアップ
**意味:** データを別の場所にコピーして保存すること

**目的:**
- サーバーが壊れてもデータを復元できる
- 誤ってデータを消しても復元できる

---

## .env（ドットエンブ）
**正式名称:** Environment Variables File

**意味:** 秘密情報を保存するファイル

**内容:**
- トークン
- APIキー
- パスワード

**⚠️ 注意:** Git に含めてはいけない

---

## Git（ギット）
**意味:** プログラムのバージョン管理ツール

**できること:**
- 変更履歴を保存
- 前のバージョンに戻せる
- チームで開発できる

---

## GitHub（ギットハブ）
**意味:** Git で管理しているプログラムを保存する場所（クラウドサービス）

**例:**
- このBotのコードは GitHub に保存されている
- 誰でも（権限があれば）見れる

---

## ログ
**意味:** プログラムの実行記録

**例:**
- 「Botが起動しました」
- 「エラーが発生しました」

**用途:**
- トラブル時に何が起きたか調べる

---

## マイグレーション
**意味:** データベースの構造を変更すること

**例:**
- 新しいカラム（項目）を追加
- テーブル名を変更

---

最終更新: 2026-02-04
```

---

## 第4章：運用メモの作成（15分）

### 4-1. OPERATIONS.md の作成

**ローカルPCで作業：**

```powershell
New-Item -ItemType File -Name OPERATIONS.md
code OPERATIONS.md
```

**OPERATIONS.md の内容：**

```markdown
# 運用メモ

日々の運用で気づいたこと、ハマったことを記録します。

---

## 運用履歴

### 2026-02-04
- Bot をメンテナンスモードに移行
- ユーザーに告知

### 2026-01-15
- Gemini API のレート制限に引っかかった
- 対処：1日あたりのリクエスト数を制限

### 2026-01-10
- サーバーのディスク容量が不足
- 対処：古いログファイルを削除

### 2025-12-20
- 初回デプロイ成功

---

## よくあるトラブルと対処法

### Bot が突然停止する

**原因:**
- メモリ不足
- API制限

**対処法:**
1. `pm2 logs discord-bot --err` でエラーを確認
2. メモリ不足の場合：`pm2 restart discord-bot`
3. API制限の場合：しばらく待つ

---

### デプロイ後、Bot が起動しない

**原因:**
- 構文エラー
- 環境変数の設定ミス

**対処法:**
1. `pm2 logs discord-bot --err` でエラーを確認
2. バックアップから復元
3. ローカル環境で修正してから再デプロイ

---

## 定期作業

### 毎週
- [ ] `pm2 status` でBotの状態確認
- [ ] `df -h` でディスク容量確認

### 毎月
- [ ] バックアップの復元演習
- [ ] GCP の利用料金確認

### 3ヶ月ごと
- [ ] プロジェクトの継続判断
- [ ] ドキュメントの見直し

---

## Tips & Tricks

### SSH接続が遅いとき
```bash
# DNS解決を無効化
ssh -o GSSAPIAuthentication=no discord_bot@<IP>
```

### ログが多すぎて見づらいとき
```bash
# エラーログだけを表示
pm2 logs discord-bot --err --lines 50
```

### データベースを直接確認したいとき
```bash
sqlite3 bot.db
.schema feelings
SELECT * FROM feelings LIMIT 10;
.quit
```

---

## ハマったこと

### pm2 が起動しない
**状況:**
サーバー再起動後、pm2 が起動しない

**原因:**
pm2 startup の設定が消えていた

**対処法:**
```bash
pm2 startup
# 表示されたコマンドを実行
pm2 save
```

---

### .env が読み込まれない
**状況:**
Bot 起動時に「環境変数が設定されていません」エラー

**原因:**
.env ファイルの改行コードが CRLF になっていた

**対処法:**
```bash
# LF に変換
dos2unix .env
```

---

最終更新: 2026-02-04
次回更新予定: 2026-03-04
```

---

## 第5章：最終チェックリスト（10分）

### 5-1. 引き継ぎドキュメント完全版チェックリスト

**以下のファイルがすべて揃っているか確認：**

```
git_practice/
├── README.md（改善版）
├── HANDOVER.md（引き継ぎドキュメント）
├── GLOSSARY.md（用語集）
├── OPERATIONS.md（運用メモ）
├── RESTORE_PROCEDURE.md（復元手順）
├── BACKUP_PLAN.md（バックアップ計画）
├── DEPLOY_CHECKLIST.md（デプロイ前チェックリスト）
├── PROJECT_COST_ANALYSIS.md（コスト分析）
├── DATABASE_STRUCTURE.png（DB構造図）
└── ROADMAP.md（ロードマップ・拡張する場合）
```

---

### 5-2. 最終確認

**以下の質問に YES と答えられるか確認：**

```
- [ ] 「何も分からない人」がこのドキュメントだけで Bot を起動できる？
- [ ] サーバーへの接続方法が明記されている？
- [ ] トラブル時の対処法が書かれている？
- [ ] データベースの構造が分かる？
- [ ] バックアップと復元の方法が書かれている？
- [ ] 連絡先が明記されている？
- [ ] 専門用語が説明されている？
```

**すべて YES なら、引き継ぎドキュメント完成です！**

---

### 5-3. GitHubへコミット

**ローカルPCで実行：**

```powershell
git add .
git commit -m "最終回：引き継ぎドキュメント完成"
git push origin main
```

---

## ✅ この回のチェックリスト

- [ ] HANDOVER.md を作成した
- [ ] GLOSSARY.md を作成した
- [ ] OPERATIONS.md を作成した
- [ ] README.md を改善した
- [ ] DATABASE_STRUCTURE.png を作成した
- [ ] 最終確認を完了した
- [ ] GitHubにコミットした

---

## 🎓 この回で学んだこと

**最重要ポイント：**
> **「自分にしか分からない」を排除する。引き継ぎは「いつか」ではなく「今」やる。**

**具体的に学んだこと：**
1. 引き継ぎドキュメントの作成方法
2. 「何も分からない人」目線のREADME
3. 用語集の重要性
4. 運用メモの記録方法
5. データベース構造図の作成

---

## 🎉 全20回完走おめでとうございます！

### あなたが身につけたもの

**技術面：**
- Node.js / Discord.js
- SQLite
- Git / GitHub
- GCP Compute Engine
- PM2
- Gemini API

**判断面（最も重要）：**
- 触っていいか／止めるべきか
- 直すべきか／戻すべきか
- 続けるか／凍結するか／捨てるか

---

## 📝 次のステップ

### このBotを続ける場合
1. ROADMAP.md を定期的に更新
2. 3ヶ月ごとに継続判断を見直し
3. ドキュメントを最新に保つ

### 新しいプロジェクトを始める場合
1. この20回で学んだことを活かす
2. 最初から「引き継ぎ可能な状態」を意識
3. 判断のフレームワークを使う

### さらに学びたい場合
- PostgreSQL などの本格的なDB
- Docker によるコンテナ化
- CI/CD パイプライン
- 負荷分散・スケーリング
- 監視・アラート

---

## 🙏 最後に

この20回を通じて、

**「作って終わり」ではなく、**
**「壊さず・直し・判断し・引き継ぐ」**

ところまで到達しました。

これは、**現場で最も必要とされる力**です。

この経験は、どんなプロジェクトでも活きます。

お疲れさまでした。そして、おめでとうございます。

---

## 📦 完成版ファイル構成

```
git_practice/
├── README.md
├── HANDOVER.md
├── GLOSSARY.md
├── OPERATIONS.md
├── RESTORE_PROCEDURE.md
├── BACKUP_PLAN.md
├── DEPLOY_CHECKLIST.md
├── PROJECT_COST_ANALYSIS.md
├── INCIDENT_LOG.md
├── ROADMAP.md
├── DATABASE_STRUCTURE.png
├── TERMS_OF_SERVICE.md
├── SPECIFICATION.md
├── index.js
├── ai-helper.js
├── spam-detector.js
├── content-filter.js
├── register-commands.js
├── run-migrations.js
├── deploy.sh
├── backup.sh
├── .env.development
├── .env.production
├── .env.example
├── .gitignore
├── package.json
├── bot.db
└── migrations/
    └── 001_add_tags_column.js
```

---

これで全20回が完了です！

本当にお疲れさまでした。🎉
