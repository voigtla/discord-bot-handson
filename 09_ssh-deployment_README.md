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
- ✅ SSH クライアント（Windows: PowerShell / Mac: ターミナル）
- ✅ 第8回までの完成プロジェクト
- ✅ GitHubにプッシュ済みのコード

### サーバーの選択肢

| サービス | 料金 | 推奨度 |
|---------|------|--------|
| Google Cloud (GCP) | 無料枠あり | ⭐⭐⭐ |
| AWS EC2 | 無料枠あり | ⭐⭐⭐ |
| ConoHa VPS | 月600円〜 | ⭐⭐ |
| さくらVPS | 月880円〜 | ⭐⭐ |

**このハンズオンでは GCP を前提に進めます**

---

## 第1章：GCP で仮想サーバーを作成（15分）

### 1-1. GCP Console にアクセス

**ブラウザで作業します（あなたのPC）：**

1. https://console.cloud.google.com/ にアクセス
2. Googleアカウントでログイン
3. 新しいプロジェクトを作成
   - プロジェクト名：`discord-bot-project`（任意）
   - プロジェクトIDは自動生成でOK

**💡 なぜプロジェクトを作るのか：**
- GCPでは、すべてのリソース（サーバーなど）をプロジェクトごとに管理します
- 料金もプロジェクト単位で把握できます
- 複数のプロジェクトを持つことで、用途ごとに分けられます

---

### 1-2. Compute Engine インスタンスを作成

ここでは、Discord Bot を動かすための **仮想サーバー（VM）** を1台作成します。  
設定項目が多くて戸惑いやすいですが、**この章では選ぶものが決まっています**。  
迷わず、以下の内容どおりに選んでください。

---

#### ステップ1：Compute Engine を開く

1. GCP Console 左上の **≡（ハンバーガーメニュー）** をクリック
2. **Compute Engine** → **VM インスタンス** を選択
3. 「Compute Engine API を有効にする」と表示されたら **有効にする** をクリック
   - 初回のみ数分かかります
4. **インスタンスを作成** をクリック

---

#### ステップ2：基本設定

**名前：**
- `discord-bot-instance`

**💡 名前の役割：**
- あなたがこのサーバーを識別するための名前です
- 英数字とハイフンのみ使用可能
- 1台だけなので、このままでOK

---

**リージョン：**
- **asia-northeast1（東京）**

**💡 リージョンとは：**
- サーバーが物理的に設置される場所です
- 東京を選ぶと、日本からのアクセスが速くなります
- Bot の応答速度にも影響します

**ゾーン：**
- **asia-northeast1-a**（デフォルトでOK）

**💡 ゾーンとは：**
- 同じリージョン内でも、さらに細かく分かれたデータセンターの場所
- 通常は気にしなくてOK

---

#### ステップ3：マシンの構成（重要）

**シリーズ（Series）：**
- **E2** を選びます

**💡 E2シリーズとは：**
- 低コストで軽量な用途に適したマシンタイプ
- 無料枠の対象
- Bot のような常時稼働アプリに最適

---

**マシンタイプ：**
- **e2-micro** を選びます

**💡 e2-microのスペック：**
- CPU: 0.25〜2.0 vCPU（共有）
- メモリ: 1GB
- Discord Bot には十分なスペック
- **月750時間まで無料**（1ヶ月は約730時間なので、1台なら無料）

**⚠️ 注意：画面に「無料枠対象」と表示されているか確認してください**

---

#### ステップ4：ブートディスク（OS）の設定

**「変更」をクリックして、以下を選択：**

**オペレーティングシステム：**
- **Ubuntu**

**💡 Ubuntuとは：**
- Linuxの一種で、サーバー用途で最も人気があるOS
- Node.js や PM2 のインストールが簡単
- 日本語の情報も豊富

---

**バージョン：**
- **Ubuntu 22.04 LTS**

**💡 LTS（Long Term Support）とは：**
- 長期サポート版という意味
- セキュリティアップデートが長期間提供される
- 安定性が高く、本番環境に最適

---

**ブートディスクの種類：**
- **標準永続ディスク**

**💡 ディスクの種類：**
- 標準：安価で、Bot用途には十分
- SSD：高速だが、料金が高い（不要）

---

**サイズ：**
- **10 GB**

**💡 ディスクサイズ：**
- 10GBでNode.js、Bot、ログすべて収まります
- 無料枠の範囲内
- 後から拡張も可能

**「選択」をクリックして、ブートディスク設定を確定**

---

#### ステップ5：ファイアウォール設定

**「ファイアウォール」セクションで：**
- □ HTTP トラフィックを許可する → **チェック不要**
- □ HTTPS トラフィックを許可する → **チェック不要**

**💡 なぜHTTP/HTTPSは不要か：**
- Discord Bot は Discord のサーバーと通信します
- ブラウザからのアクセス（HTTP/HTTPS）は受け付けません
- 不要なポートを開けるとセキュリティリスクになります

---

#### ステップ6：詳細オプション（展開して設定）

**「管理、セキュリティ、ディスク、ネットワーク、単一テナンシー」を展開**

**「ネットワーキング」タブをクリック**

**ネットワークインターフェース → 外部IPv4アドレス：**
- **エフェメラル** を選択

**💡 エフェメラルとは：**
- 「一時的な」という意味
- インスタンスを停止すると、IPアドレスが変わる
- 無料
- 学習用途にはこれで十分

**💡 静的IPアドレスとの違い：**
- 静的（予約済み）: IPアドレスが固定される（有料）
- エフェメラル: IPアドレスが変動する（無料）
- Bot用途ではエフェメラルで問題ありません

---

#### ステップ7：作成を実行

**画面下部の「作成」ボタンをクリック**

**✅ 数分待つと、インスタンスが起動します**

起動すると、VMインスタンスの一覧に以下が表示されます：
- 名前：`discord-bot-instance`
- ゾーン：`asia-northeast1-a`
- 外部IP：`34.84.xxx.xxx`（例）← この数字をメモしてください

**💡 外部IPの役割：**
- このIPアドレスを使って、あなたのPCからサーバーに接続します
- 「サーバーの住所」のようなものです

---

**🎯 第1章で完了したこと：**
- ✅ GCPプロジェクトの作成
- ✅ 仮想サーバー（VM）の起動
- ✅ 外部IPアドレスの取得

次の章で、このサーバーに接続します。

---

## 第2章：SSH 接続の準備（15分）

### 2-1. SSH キーを作成する

ここからは **あなたのPC（ローカル）** で作業します。  
**⚠️ 重要：サーバーではなく、あなたのPCで実行してください。**

> 💡 **何をするか：**  
> SSH接続のための「鍵ペア」を作ります。  
> 鍵は2つ作られます：
> - **秘密鍵**：あなただけが持つ（絶対に人に見せない）
> - **公開鍵**：サーバーに登録する（サーバーに教えてOK）
> 
> この2つが揃って初めて、サーバーにログインできます。

---

#### ステップ1：SSHキーペアを作成する

**あなたのOS（Windows または Mac）を選んでください：**

<details>
<summary><strong>🪟 Windows の場合（PowerShell または VSCode ターミナル）</strong></summary>

**ローカルPC（Windows）で実行：**

```powershell
ssh-keygen -t rsa -b 2048 -f $env:USERPROFILE\.ssh\gcp-discord-bot
```

**⚠️ Windowsの注意点：**
- PowerShell または VSCode の統合ターミナルを使用してください
- コマンドプロンプト（cmd.exe）では動作しません

**途中で次のように聞かれます：**

```
Enter passphrase (empty for no passphrase):
```
→ **何も入力せずに Enter を押す**（パスワードなしでOK）

```
Enter same passphrase again:
```
→ **そのまま Enter を押す**

**✅ 完了すると次のように表示されます：**
```
Your identification has been saved in C:\Users\<あなたのユーザー名>\.ssh\gcp-discord-bot
Your public key has been saved in C:\Users\<あなたのユーザー名>\.ssh\gcp-discord-bot.pub
```

**作成されたファイル：**
- `C:\Users\<あなたのユーザー名>\.ssh\gcp-discord-bot` ← 秘密鍵（絶対に共有しない）
- `C:\Users\<あなたのユーザー名>\.ssh\gcp-discord-bot.pub` ← 公開鍵（サーバーに登録する）

</details>

<details>
<summary><strong>🍎 Mac の場合（ターミナル）</strong></summary>

**ローカルPC（Mac）で実行：**

```bash
ssh-keygen -t rsa -b 2048 -f ~/.ssh/gcp-discord-bot
```

**途中で次のように聞かれます：**

```
Enter passphrase (empty for no passphrase):
```
→ **何も入力せずに Enter を押す**（パスワードなしでOK）

```
Enter same passphrase again:
```
→ **そのまま Enter を押す**

**✅ 完了すると次のように表示されます：**
```
Your identification has been saved in /Users/<あなたのユーザー名>/.ssh/gcp-discord-bot
Your public key has been saved in /Users/<あなたのユーザー名>/.ssh/gcp-discord-bot.pub
```

**作成されたファイル：**
- `~/.ssh/gcp-discord-bot` ← 秘密鍵（絶対に共有しない）
- `~/.ssh/gcp-discord-bot.pub` ← 公開鍵（サーバーに登録する）

</details>

---

#### ステップ2：公開鍵の内容を表示してコピーする

**次に、サーバーに登録するための公開鍵を表示します。**

<details>
<summary><strong>🪟 Windows の場合</strong></summary>

**ローカルPC（Windows）で実行：**

```powershell
type $env:USERPROFILE\.ssh\gcp-discord-bot.pub
```

または

```powershell
cat $env:USERPROFILE\.ssh\gcp-discord-bot.pub
```

**✅ 表示例：**
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC... (長い文字列) ...== あなたのPC名
```

**この長い1行の文字列を全部コピーしてください。**
- 文字列の最初（`ssh-rsa`）から最後（PC名）まで、すべて選択
- 途中で改行しないように注意
- メモ帳などに一時的に貼り付けておくと安心です

</details>

<details>
<summary><strong>🍎 Mac の場合</strong></summary>

**ローカルPC（Mac）で実行：**

```bash
cat ~/.ssh/gcp-discord-bot.pub
```

**✅ 表示例：**
```
ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAABAQC... (長い文字列) ...== あなたのPC名
```

**この長い1行の文字列を全部コピーしてください。**
- 文字列の最初（`ssh-rsa`）から最後（PC名）まで、すべて選択
- 途中で改行しないように注意
- メモ帳などに一時的に貼り付けておくと安心です

**💡 クリップボードに直接コピーする方法（便利）：**

```bash
cat ~/.ssh/gcp-discord-bot.pub | pbcopy
```

このコマンドを実行すると、公開鍵が自動でクリップボードにコピーされます。

</details>

---

**🎯 この時点で準備できたもの：**
- ✅ SSH秘密鍵（あなたのPCに保存済み）
- ✅ SSH公開鍵（クリップボードにコピー済み）

次のステップで、この公開鍵をGCPに登録します。

---

### 2-2. GCP に公開鍵を登録する

ここからは **ブラウザ（GCP Console）** で作業します。

> 💡 **何をするか：**  
> さきほどコピーした公開鍵を、GCPのサーバーに登録します。  
> これにより、「この鍵を持っているPCだけがサーバーに入れる」という設定になります。

---

#### ステップ1：メタデータ画面を開く

1. GCP Console 左上の **≡（ハンバーガーメニュー）** をクリック
2. **Compute Engine** → **メタデータ** を選択

**💡 メタデータとは：**
- サーバー全体に適用される設定のこと
- ここで登録したSSH鍵は、プロジェクト内のすべてのVMで使えます

---

#### ステップ2：SSH認証鍵タブを開く

1. 上部の **SSH 認証鍵** タブをクリック
2. **項目を追加** または **編集** ボタンをクリック

---

#### ステップ3：公開鍵を貼り付ける

1. 大きなテキストボックスが表示されます
2. **さきほどコピーした公開鍵をそのまま貼り付け**
   - 最初（`ssh-rsa`）から最後（PC名）まで、全部貼り付け
   - 余分なスペースや改行を入れない
3. **保存** をクリック

**✅ 保存されると、リストに追加されます**

**💡 表示される情報：**
- ユーザー名が自動で抽出されます（例：`discord_bot`）
- このユーザー名でSSH接続します

---

**🎯 第2章で完了したこと：**
- ✅ SSH鍵ペアの作成
- ✅ 公開鍵のGCPへの登録
- ✅ SSH接続の準備完了

次の章で、実際にサーバーに接続します。

---

### 2-3. SSH 接続テスト

この章では、実際にサーバーに接続してみます。  
**⚠️ 実行場所に注意：ローカル（あなたのPC）で実行します。**

---

#### ステップ1：接続情報を確認する

**必要な情報：**
1. **ユーザー名**：GCPのSSH認証鍵ページで確認できます
   - 通常は公開鍵から自動抽出された名前（例：`discord_bot`）
2. **外部IP**：VMインスタンス一覧で確認
   - 例：`34.84.123.456`
3. **秘密鍵のパス**：
   - Windows: `$env:USERPROFILE\.ssh\gcp-discord-bot`
   - Mac: `~/.ssh/gcp-discord-bot`

---

#### ステップ2：SSH接続を実行する

<details>
<summary><strong>🪟 Windows の場合</strong></summary>

**ローカルPC（Windows PowerShell）で実行：**

```powershell
ssh -i $env:USERPROFILE\.ssh\gcp-discord-bot <ユーザー名>@<外部IP>
```

**実際の例：**
```powershell
ssh -i $env:USERPROFILE\.ssh\gcp-discord-bot discord_bot@34.84.123.456
```

**💡 コマンドの意味：**
- `ssh`：SSH接続コマンド
- `-i $env:USERPROFILE\.ssh\gcp-discord-bot`：使用する秘密鍵のパス
- `discord_bot@34.84.123.456`：ユーザー名@サーバーのIPアドレス

</details>

<details>
<summary><strong>🍎 Mac の場合</strong></summary>

**ローカルPC（Mac ターミナル）で実行：**

```bash
ssh -i ~/.ssh/gcp-discord-bot <ユーザー名>@<外部IP>
```

**実際の例：**
```bash
ssh -i ~/.ssh/gcp-discord-bot discord_bot@34.84.123.456
```

**💡 コマンドの意味：**
- `ssh`：SSH接続コマンド
- `-i ~/.ssh/gcp-discord-bot`：使用する秘密鍵のパス
- `discord_bot@34.84.123.456`：ユーザー名@サーバーのIPアドレス

</details>

---

#### ステップ3：初回接続時の確認

**初めて接続するときは、次のような確認メッセージが表示されます：**

```
The authenticity of host '34.84.123.456 (34.84.123.456)' can't be established.
ED25519 key fingerprint is SHA256:XXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXXX.
Are you sure you want to continue connecting (yes/no/[fingerprint])?
```

**💡 これは何？：**
- 初めて接続するサーバーなので、「本当にこのサーバーでいいですか？」と確認しています
- セキュリティのための確認です

**→ `yes` とタイプして Enter を押してください**

---

#### ステップ4：接続成功の確認

**✅ 接続に成功すると、次のように表示されます：**

```
Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-1035-gcp x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

Last login: Tue Feb 03 12:34:56 2026 from xxx.xxx.xxx.xxx
discord_bot@discord-bot-instance:~$
```

**💡 表示の意味：**
- `Welcome to Ubuntu...`：サーバーのOSとバージョン
- `discord_bot@discord-bot-instance`：ログインユーザー名@サーバー名
- `~$`：ホームディレクトリにいることを示す（`~` = `/home/discord_bot`）

**これでサーバーの中にいます！**

---

#### トラブルシューティング

<details>
<summary><strong>❌ Permission denied (publickey) というエラーが出る場合</strong></summary>

**原因：**
- 秘密鍵のパスが間違っている
- GCPに登録した公開鍵が間違っている
- ユーザー名が間違っている

**対処法：**
1. 秘密鍵のパスを確認
   - Windows: `type $env:USERPROFILE\.ssh\gcp-discord-bot` でファイルが存在するか確認
   - Mac: `cat ~/.ssh/gcp-discord-bot` でファイルが存在するか確認
2. GCPの「SSH認証鍵」ページで、登録した公開鍵を確認
3. ユーザー名が公開鍵から抽出されたものと一致しているか確認

</details>

<details>
<summary><strong>❌ Connection timed out というエラーが出る場合</strong></summary>

**原因：**
- 外部IPアドレスが間違っている
- サーバーが起動していない
- ファイアウォールの設定問題

**対処法：**
1. GCP Console でVMインスタンスの外部IPを再確認
2. VMインスタンスが「実行中」になっているか確認
3. VMインスタンスの詳細で、ファイアウォールルールを確認

</details>

---

**🎯 SSH接続テスト完了！**

次の章から、サーバー内で作業を進めます。

---

## 第3章：サーバーに必要なソフトをインストール（20分）

この章からは、**サーバー内で作業**します。  
SSH接続した状態で、以下のコマンドを実行してください。

> 💡 **実行場所の確認：**  
> プロンプトが `discord_bot@discord-bot-instance:~$` のようになっていれば、サーバー内です。

---

### 3-1. システムを最新の状態に更新する

**⚠️ サーバーで実行：**

```bash
sudo apt update
sudo apt upgrade -y
```

**💡 このコマンドの意味：**
- `sudo`：管理者権限で実行（Super User DO の略）
- `apt`：Ubuntuのパッケージ管理ツール
- `update`：利用可能なパッケージのリストを更新
- `upgrade -y`：インストール済みパッケージを最新版に更新（-yは自動承認）

**実行時間：** 数分かかる場合があります

**✅ 完了すると次のように表示されます：**
```
Reading package lists... Done
Building dependency tree... Done
...
0 upgraded, 0 newly installed, 0 to remove and 0 not upgraded.
```

---

### 3-2. Node.js のインストール

**⚠️ サーバーで実行：**

#### ステップ1：NodeSourceリポジトリを追加

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
```

**💡 このコマンドの意味：**
- `curl`：インターネットからデータを取得するコマンド
- NodeSourceの公式スクリプトをダウンロードして実行
- Node.js 20.x をインストールできるように設定

---

#### ステップ2：Node.jsをインストール

```bash
sudo apt install -y nodejs
```

**実行時間：** 1〜2分

---

#### ステップ3：インストールの確認

```bash
node -v
npm -v
```

**✅ 正しくインストールされていれば：**
```
v20.11.0
10.2.4
```

（バージョン番号は多少異なる場合があります）

**💡 これで何ができるようになった？：**
- Node.jsのプログラム（あなたのBot）が実行できる
- npmでパッケージがインストールできる

---

### 3-3. PM2 のインストール

**⚠️ サーバーで実行：**

```bash
sudo npm install -g pm2
```

**💡 PM2とは：**
- Node.js のプロセスマネージャー
- アプリケーションを「常時起動」させるためのツール
- クラッシュしても自動で再起動してくれる

**💡 このコマンドの意味：**
- `npm install`：パッケージをインストール
- `-g`：グローバルインストール（システム全体で使える）
- `pm2`：インストールするパッケージ名

**実行時間：** 1〜2分

---

#### PM2のバージョン確認

```bash
pm2 -v
```

**✅ 正しくインストールされていれば：**
```
5.3.0
```

**💡 PM2の主な機能：**
- ✅ 自動再起動（クラッシュしても復活）
- ✅ ログ管理（エラーや実行ログを記録）
- ✅ 複数プロセス管理（複数のBotを同時起動）
- ✅ モニタリング（CPU、メモリ使用状況を確認）

---

### 3-4. Git のインストール

**⚠️ サーバーで実行：**

```bash
sudo apt install -y git
```

**💡 Gitの役割：**
- GitHubからあなたのBotのコードをダウンロード（クローン）する
- コードの更新を取得する

---

#### Gitのバージョン確認

```bash
git --version
```

**✅ 正しくインストールされていれば：**
```
git version 2.34.1
```

---

**🎯 第3章で完了したこと：**
- ✅ システムの更新
- ✅ Node.js 20.x のインストール
- ✅ PM2 のインストール
- ✅ Git のインストール

サーバーがBotを実行できる環境になりました！

---

## 第4章：Bot のデプロイ（20分）

この章では、GitHubに保存されているあなたのBotのコードをサーバーにダウンロードし、実行します。

**⚠️ すべてサーバーで実行します**

---

### 4-1. GitHub からコードをクローン

#### ステップ1：ホームディレクトリに移動

```bash
cd ~
```

**💡 `~` の意味：**
- ホームディレクトリを表す記号
- `/home/discord_bot` と同じ意味

---

#### ステップ2：リポジトリをクローン

```bash
git clone https://github.com/<あなたのユーザー名>/git_practice.git
```

**実際の例：**
```bash
git clone https://github.com/taro-yamada/git_practice.git
```

**💡 クローンとは：**
- GitHubに保存されているコードを、サーバーにコピーすること
- ローカルで開発したコードが、そのままサーバーにダウンロードされます

**✅ 成功すると次のように表示されます：**
```
Cloning into 'git_practice'...
remote: Enumerating objects: 123, done.
remote: Counting objects: 100% (123/123), done.
...
```

---

#### ステップ3：プロジェクトディレクトリに移動

```bash
cd git_practice
```

**現在地の確認：**
```bash
pwd
```

**✅ 次のように表示されれば正しい場所にいます：**
```
/home/discord_bot/git_practice
```

---

### 4-2. 依存パッケージのインストール

**⚠️ サーバーで実行：**

```bash
npm install
```

**💡 このコマンドの役割：**
- `package.json` に書かれているパッケージを全部インストール
- `discord.js`、`better-sqlite3`、`@google/generative-ai` など
- `node_modules` フォルダが作成される

**実行時間：** 3〜5分（初回は時間がかかります）

**✅ 完了すると次のように表示されます：**
```
added 234 packages, and audited 235 packages in 2m

12 packages are looking for funding
  run `npm fund` for details

found 0 vulnerabilities
```

---

### 4-3. 環境変数（.env）ファイルを作成

**⚠️ サーバーで実行：**

#### ステップ1：.envファイルを作成

```bash
nano .env
```

**💡 nanoとは：**
- Linux のテキストエディタ
- ターミナル上でファイルを編集できる

---

#### ステップ2：環境変数を入力

**nanoエディタが開いたら、以下を入力：**

```
DISCORD_TOKEN=あなたの実際のDiscordトークン
CLIENT_ID=あなたの実際のクライアントID
GUILD_ID=あなたの実際のギルドID
GEMINI_API_KEY=あなたの実際のGemini APIキー
```

**⚠️ 注意：**
- ローカルPCの `.env` ファイルからコピーしてください
- トークンやAPIキーは絶対に人に見せないでください

---

#### ステップ3：ファイルを保存して終了

1. **Ctrl + O**（保存）を押す
2. **Enter** を押して確認
3. **Ctrl + X**（終了）を押す

**💡 nanoの基本操作：**
- `Ctrl + O`：保存
- `Ctrl + X`：終了
- `Ctrl + K`：行を切り取り
- `Ctrl + U`：貼り付け

---

#### ステップ4：.envファイルの確認

```bash
cat .env
```

**✅ 正しく保存されていれば、入力した内容が表示されます**

**⚠️ セキュリティ確認：**

```bash
ls -la .env
```

**✅ 次のように表示されればOK：**
```
-rw-r--r-- 1 discord_bot discord_bot 234 Feb  3 12:34 .env
```

**💡 権限の意味：**
- `rw-`：所有者（あなた）は読み書き可能
- `r--`：グループは読み取りのみ
- `r--`：その他のユーザーは読み取りのみ

もし他のユーザーにも読み取り権限があるのが気になる場合：
```bash
chmod 600 .env
```

---

### 4-4. コマンドの登録

**⚠️ サーバーで実行：**

```bash
node register-commands.js
```

**💡 なぜ必要？：**
- Discord にスラッシュコマンドを登録する必要があります
- ローカルで登録済みでも、サーバーからも登録が必要です

**✅ 成功すると次のように表示されます：**
```
コマンドを登録中...
コマンド登録完了！
```

---

**🎯 第4章で完了したこと：**
- ✅ GitHubからコードをクローン
- ✅ 依存パッケージのインストール
- ✅ 環境変数の設定
- ✅ Discordコマンドの登録

Botを起動する準備が整いました！

---

## 第5章：PM2 で Bot を常時起動（15分）

この章では、PM2 を使ってBotを「常に動き続ける」状態にします。

**⚠️ すべてサーバーで実行します**

---

### 5-1. Bot を起動する（初回）

**⚠️ サーバーで実行：**

```bash
pm2 start index.js --name discord-bot
```

**💡 このコマンドの意味：**
- `pm2 start`：PM2でプログラムを起動
- `index.js`：起動するファイル
- `--name discord-bot`：プロセスに名前をつける（管理しやすくなる）

**✅ 成功すると次のように表示されます：**
```
[PM2] Starting /home/discord_bot/git_practice/index.js in fork_mode (1 instance)
[PM2] Done.
┌────┬────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┐
│ id │ name           │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │
├────┼────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┤
│ 0  │ discord-bot    │ default     │ 1.0.0   │ fork    │ 12345    │ 0s     │ 0    │ online    │ 0%       │ 45.0mb   │ discor…  │
└────┴────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┘
```

**💡 表示の意味：**
- `status: online`：Botが動いている
- `uptime: 0s`：起動してからの時間
- `mem: 45.0mb`：使用メモリ

---

### 5-2. Bot の状態を確認する

**⚠️ サーバーで実行：**

```bash
pm2 status
```

または

```bash
pm2 list
```

**✅ Botが正常に動いていれば：**
```
┌────┬────────────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┐
│ id │ name           │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │
├────┼────────────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┤
│ 0  │ discord-bot    │ default     │ 1.0.0   │ fork    │ 12345    │ 2m     │ 0    │ online    │ 0.2%     │ 52.1mb   │ discor…  │
└────┴────────────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┘
```

**💡 ステータスの意味：**
- `online`：正常に動作中
- `stopping`：停止処理中
- `stopped`：停止中
- `errored`：エラーで停止

---

### 5-3. ログを確認する

**⚠️ サーバーで実行：**

#### リアルタイムでログを見る

```bash
pm2 logs discord-bot
```

**💡 ログの見方：**
- 上半分：標準出力（console.log の内容）
- 下半分：エラー出力（console.error の内容）
- リアルタイムで更新される

**終了する：** `Ctrl + C`

---

#### 直近のログだけ見る

```bash
pm2 logs discord-bot --lines 50
```

**💡 `--lines 50` の意味：**
- 最新50行だけ表示
- 数字を変えると表示行数が変わる

---

### 5-4. 主なPM2コマンド

**⚠️ すべてサーバーで実行：**

#### Bot を再起動

```bash
pm2 restart discord-bot
```

**💡 いつ使う？：**
- コードを更新したとき
- 設定を変更したとき
- 動作がおかしくなったとき

---

#### Bot を停止

```bash
pm2 stop discord-bot
```

**💡 いつ使う？：**
- メンテナンスのとき
- デバッグするとき

---

#### Bot を削除（PM2から登録解除）

```bash
pm2 delete discord-bot
```

**💡 いつ使う？：**
- Bot を完全に削除するとき
- 設定をやり直すとき

---

#### リアルタイムモニター

```bash
pm2 monit
```

**💡 何が見える？：**
- CPU使用率
- メモリ使用率
- ログ
- リアルタイムで更新

**終了する：** `q` を押す

---

### 5-5. 自動起動の設定

サーバーが再起動しても、Botが自動で起動するように設定します。

**⚠️ サーバーで実行：**

#### ステップ1：現在の状態を保存

```bash
pm2 save
```

**✅ 成功すると：**
```
[PM2] Saving current process list...
[PM2] Successfully saved in /home/discord_bot/.pm2/dump.pm2
```

---

#### ステップ2：自動起動を有効化

```bash
pm2 startup
```

**✅ 次のようなコマンドが表示されます：**
```
[PM2] To setup the Startup Script, copy/paste the following command:
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u discord_bot --hp /home/discord_bot
```

**💡 このコマンドをコピーして実行してください**

---

#### ステップ3：表示されたコマンドを実行

**例（表示されたコマンドをそのまま実行）：**
```bash
sudo env PATH=$PATH:/usr/bin /usr/lib/node_modules/pm2/bin/pm2 startup systemd -u discord_bot --hp /home/discord_bot
```

**✅ 成功すると：**
```
[PM2] Init System found: systemd
[PM2] To setup the Startup Script, copy/paste the following command:
[PM2] Successfully created systemd service.
```

---

**🎯 自動起動の設定完了！**

**確認方法：**
- サーバーを再起動しても、Botが自動で起動します
- PM2が自動で `pm2 resurrect` を実行します

---

**🎯 第5章で完了したこと：**
- ✅ PM2でBotを起動
- ✅ ログの確認方法を習得
- ✅ PM2の基本コマンドを習得
- ✅ 自動起動の設定

Botが24時間稼働する体制が整いました！

---

## 第6章：デプロイスクリプトの作成（10分）

コードを更新するたびに、毎回同じ手順を実行するのは大変です。  
デプロイ（更新）を自動化するスクリプトを作ります。

**⚠️ サーバーで実行：**

---

### 6-1. デプロイスクリプトを作成

```bash
nano deploy.sh
```

**以下の内容を入力：**

```bash
#!/bin/bash

# デプロイスクリプト
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

**保存して終了：** `Ctrl + O` → `Enter` → `Ctrl + X`

---

### 6-2. 実行権限を付与

```bash
chmod +x deploy.sh
```

**💡 `chmod +x` の意味：**
- このファイルを「実行可能」にする
- これがないと、スクリプトとして実行できない

---

### 6-3. デプロイスクリプトの使い方

**今後、コードを更新したら：**

1. **ローカルでコードを編集**
2. **GitHubにプッシュ**
   ```bash
   git add .
   git commit -m "機能追加"
   git push
   ```
3. **サーバーでデプロイスクリプトを実行**
   ```bash
   ./deploy.sh
   ```

**💡 スクリプトが自動で：**
- ✅ GitHubから最新コードを取得
- ✅ パッケージをインストール
- ✅ コマンドを再登録
- ✅ Botを再起動

**これだけで更新完了！**

---

**🎯 第6章で完了したこと：**
- ✅ デプロイスクリプトの作成
- ✅ 実行権限の設定
- ✅ デプロイの自動化

今後の更新作業が劇的に楽になりました！

---

## ✅ この回のチェックリスト

- [ ] GCPでVMインスタンスを作成できた
- [ ] SSH接続できた
- [ ] Node.js、PM2、Gitをインストールできた
- [ ] GitHubからコードをクローンできた
- [ ] .envファイルを作成できた
- [ ] PM2でBotを起動できた
- [ ] Botが正常に動作している
- [ ] 自動起動の設定ができた
- [ ] デプロイスクリプトを作成できた

---

## 🔍 トラブルシューティング

### Bot が起動しない

**確認項目：**
1. `.env` ファイルは正しく設定されていますか？
   ```bash
   cat .env
   ```
2. コマンドは登録されていますか？
   ```bash
   node register-commands.js
   ```
3. エラーログを確認
   ```bash
   pm2 logs discord-bot --err
   ```

---

### SSH接続できない

**確認項目：**
1. 外部IPアドレスは正しいですか？
2. SSH鍵は正しく登録されていますか？
3. VMインスタンスは起動していますか？

---

### データベースエラー

**原因：**
- データベースファイルが存在しない
- 権限の問題

**対処：**
```bash
# ホームディレクトリにいることを確認
cd ~/git_practice

# Botを再起動（自動でDBが作成される）
pm2 restart discord-bot
```

---

## お疲れさまでした！

**あなたのBotは今、24時間稼働しています** 🎉

次回（第10回）は、全体の通し確認と振り返りを行います。
