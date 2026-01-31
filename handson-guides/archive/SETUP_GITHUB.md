# GitHubリポジトリ作成手順

このリポジトリをGitHubにアップロードする手順です。

---

## 1. GitHubでリポジトリを作成

1. https://github.com/ にアクセス
2. 右上の **+** → **New repository** をクリック
3. 以下を設定：
   - **Repository name**: `discord-bot-handson`（または任意の名前）
   - **Description**: `Discord Bot開発ハンズオン資料（全10回）`
   - **Public** または **Private** を選択（推奨：Public）
   - **❌ Initialize this repository with a README はチェックしない**
4. **Create repository** をクリック

---

## 2. ローカルとGitHubを紐づける

GitHubのQuick setup画面に表示されるURLをコピーして、以下を実行：

```bash
# リポジトリのディレクトリに移動
cd discord-bot-handson

# GitHubと紐づける（URLは自分のものに置き換える）
git remote add origin https://github.com/あなたのユーザー名/discord-bot-handson.git

# 確認
git remote -v
```

---

## 3. GitHubにpush

```bash
git push -u origin main
```

---

## 4. 確認

ブラウザでGitHubのリポジトリページを開き、ファイルがアップロードされていることを確認してください。

---

## 5. Discordで共有

以下のメッセージをDiscordに投稿：

```markdown
【Discord Bot開発ハンズオン 資料公開】

全10回のハンズオン資料をGitHubで公開しました！

📚 トップページ：
https://github.com/あなたのユーザー名/discord-bot-handson

📄 第2回（Git/GitHub基礎）：
https://github.com/あなたのユーザー名/discord-bot-handson/tree/main/handson-guides/02_git-practice

🗺️ 全体ロードマップ：
https://github.com/あなたのユーザー名/discord-bot-handson/blob/main/roadmap.md

途中参加・途中離脱OK！
気になる回だけ参加もできます。
```

---

## トラブルシューティング

### Permission denied (publickey)

HTTPSのURLを使ってください：

```bash
git remote set-url origin https://github.com/あなたのユーザー名/discord-bot-handson.git
```

### Already exists

すでにリモートが設定されている場合：

```bash
git remote remove origin
git remote add origin https://github.com/あなたのユーザー名/discord-bot-handson.git
```

---

## 今後の更新方法

新しい資料を追加したら：

```bash
git add .
git commit -m "Add handson 04: Mental bot basic"
git push
```

---

## 完了！

これでGitHub上にナレッジベースが構築されました 🎉
