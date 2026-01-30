# Git トラブルシューティングガイド

困ったときに見る1枚。

---

## 🚨 とにかく困ったら

```bash
git status
```

これで「今何が起きているか」が分かります。

---

## よくあるエラーと対処法

### エラー①：Changes not staged for commit

**表示:**
```
Changes not staged for commit:
  modified: README.md
```

**原因:** `git add` を忘れている

**対処法:**
```bash
git add .
git commit -m "メッセージ"
```

---

### エラー②：src refspec 〇〇 does not match any

**表示:**
```
error: src refspec feature/xxx does not match any
```

**原因:** 
- ブランチが存在しない
- または commitが1つも無い

**対処法:**
```bash
git status  # 今どこにいるか確認
git branch  # ブランチ一覧を確認
git add .
git commit -m "メッセージ"  # commitを作る
git push -u origin ブランチ名
```

---

### エラー③：fatal: not a git repository

**表示:**
```
fatal: not a git repository (or any of the parent directories): .git
```

**原因:** Gitが初期化されていない

**対処法:**
```bash
git init
```

---

### エラー④：error: failed to push some refs

**表示:**
```
error: failed to push some refs to 'https://github.com/...'
```

**原因:** GitHub側が進んでいる（他の人がpushした、など）

**対処法:**
```bash
git pull  # まず最新を取得
git push  # もう一度push
```

---

### エラー⑤：Please commit your changes or stash them

**表示:**
```
error: Your local changes to the following files would be overwritten by merge:
Please commit your changes or stash them before you merge.
```

**原因:** ローカルに未コミットの変更がある状態でpullしようとした

**対処法:**

**方法A（変更を残したい場合）:**
```bash
git add .
git commit -m "作業中の変更"
git pull
```

**方法B（変更を一時退避）:**
```bash
git stash
git pull
git stash pop  # 退避した変更を戻す
```

---

### エラー⑥：Permission denied (publickey)

**表示:**
```
Permission denied (publickey).
fatal: Could not read from remote repository.
```

**原因:** SSH鍵の設定ができていない、またはHTTPS URLが必要

**対処法:**

**方法A（HTTPSに変更）:**
```bash
git remote set-url origin https://github.com/ユーザー名/リポジトリ名.git
```

**方法B（SSH鍵を設定）:**
GitHubの設定ページでSSH鍵を登録する必要があります。
詳細: https://docs.github.com/ja/authentication/connecting-to-github-with-ssh

---

## よくある間違い

### 間違い①：ブランチを作っただけで移動した気になる

```bash
git branch feature/xxx  # ← これは「作っただけ」
# まだ main にいる！
```

**正しい方法:**
```bash
git switch -c feature/xxx  # 作る＋移動が同時にできる
```

---

### 間違い②：mainで作業してしまう

```bash
# 今どこ？を確認せずに作業開始
git add .
git commit -m "メッセージ"
# → あれ、mainにcommitしちゃった...
```

**予防策:**
```bash
git status  # 必ず確認
# → On branch main  ← ここを見る
```

---

### 間違い③：commitする前にpushしようとする

```bash
git push -u origin feature/xxx
# → Everything up-to-date（何も起きない）
```

**正しい順序:**
```bash
git add .
git commit -m "メッセージ"    # ← これが無いとpushできない
git push -u origin feature/xxx
```

---

## 状態確認コマンド

### 今どのブランチにいる？
```bash
git branch
# → * が付いているのが今いるブランチ
```

### 何が変更されている？
```bash
git status
```

### コミット履歴を見る
```bash
git log
# または
git log --oneline  # 簡潔版
```

### リモートの設定を確認
```bash
git remote -v
```

---

## 取り消し系コマンド

### addを取り消す
```bash
git restore --staged ファイル名
# または
git reset HEAD ファイル名
```

### 直前のcommitを取り消す（変更は残す）
```bash
git reset --soft HEAD^
```

### 変更を完全に破棄（危険）
```bash
git restore ファイル名
```

---

## ブランチ操作

### ブランチ一覧
```bash
git branch        # ローカル
git branch -a     # ローカル＋リモート
```

### ブランチ作成＋移動
```bash
git switch -c ブランチ名
```

### ブランチ移動
```bash
git switch ブランチ名
```

### ブランチ削除
```bash
git branch -d ブランチ名  # マージ済みの場合
git branch -D ブランチ名  # 強制削除
```

---

## それでも分からないとき

1. **`git status` の結果をコピーして質問する**
2. **エラーメッセージ全文をコピーして質問する**
3. **直前に実行したコマンドを伝える**

このリポジトリの [Issues](../../issues) か Discord で質問してください。

---

## 参考リンク

- [Git公式ドキュメント](https://git-scm.com/doc)
- [GitHub公式ヘルプ](https://docs.github.com/ja)
- [サル先生のGit入門](https://backlog.com/ja/git-tutorial/)
