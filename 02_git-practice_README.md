# Git/GitHub 実践ハンズオン（60分版）

---

## 第0章：事前準備（5分）

### 必要なもの

- Windows PC
- インターネット接続
- **GitHubアカウント**
- VS Code
- Git for Windows（インストール済み想定）

### インストールURL

- VS Code: https://code.visualstudio.com/
- GitHub: https://github.com/
- Git For Windows: https://gitforwindows.org/

**※ GitHub Desktopは今回使いません（仕組みを理解するため）**

---

## 第1章：Gitとは何か？（5分）

### Gitの正体

> **Gitは「ファイルの変更履歴を記録し、いつでも戻れるようにする仕組み」**

特徴：
- 「いつ」「誰が」「どこを」「どう変えたか」を全部記録
- 間違えたら過去の状態に戻せる

**👉 Gitは「セーブポイント付きの保存システム」**

---

### GitHubとは？

> **GitHubは、Gitの履歴をインターネット上に置いておくサービス**

**GitHubがあることで：**
- 自分のPCが壊れても履歴が残る
- 他の人と同じコードを共有できる
- チームで開発できる
- バックアップが自動的に取れる
- 世界中の人と共同開発が可能

---

### GitHubの特徴（Discord Bot開発で役立つもの）

| 特徴 | 説明 |
|------|------|
| **リモートリポジトリ** | Gitプロジェクトをクラウドに置ける |
| **共同開発** | Pull Request / Issue でチーム開発ができる |
| **公開・非公開** | 個人用リポジトリは非公開にも、OSSとして公開も可能 |
| **GitHub Actions** | 自動テストやデプロイなど自動化が可能 |

---

### GitとGitHubの関係

```
[ローカルPC] --git push--> [GitHubリポジトリ] --git pull--> [他のメンバーPC]
```

- **Git** → 履歴を記録する仕組み（自分のPCで動く）
- **GitHub** → その履歴を置いておく場所（インターネット上）

**重要：GitとGitHubは別物です**

**👉 Discord Bot開発では：**
- Botのコードを GitHub に置く → どこからでも作業可能
- チームで機能追加・修正 → Pull Request で安全に統合
- Botのデプロイ用ファイルやドキュメントも一緒に管理

---

### 基本用語（最小限）

#### repository（リポジトリ）

**コードと履歴をまとめて入れておく箱**

- フォルダ ＋ 履歴
- 1プロジェクト＝1リポジトリ

#### commit

**変更を「履歴として確定」すること**

- 「ここまでやった」という区切り
- 後からその時点に戻れる
- 変更の理由をメモとして残せる

**👉 commit = セーブポイント**

#### push

**commitした履歴をGitHubへ送ること**

- ファイルを保存しただけ → ❌
- commitしただけ → ❌（まだローカル）
- **commitしてからpush** → ⭕

**👉 pushは「commit（履歴）」を送る操作**

#### branch（ブランチ）

**作業用の別ルート**

**🔰 かんたんに言うと：**
> ブランチ = 並行して開発するためのコピーの流れ

**イメージ：**
```
main (本線)
 ├─ feature/login   ← ログイン機能を作るブランチ
 ├─ fix/bug-123     ← バグ修正用ブランチ
```

**なぜブランチを使うの？**
1. **安全に作業できる** → mainは安定版、壊してもいい作業は別ブランチで
2. **複数人で同時に開発できる** → 人ごと・機能ごとにブランチを分けられる
3. **作業の管理がしやすい** → 「この変更は何のため？」が明確になる

**👉 branch = 安全に試すための場所**

---

### よく使われるブランチの種類

| ブランチ名 | 役割 |
|-----------|------|
| **main / master** | 本番・完成版 |
| **develop** | 開発用 |
| **feature/xxx** | 新機能追加 |
| **fix/xxx** | バグ修正 |
| **hotfix/xxx** | 緊急修正 |

**基本的な流れ：**
```
mainからブランチを作る
  ↓
ブランチで作業・コミット
  ↓
GitHubでプルリクエスト
  ↓
レビュー後、mainにマージ
```

**👉 1つの作業 = 1ブランチがベストプラクティス**

## 今回やらないこと

この回では、以下の内容は扱いません。

- 複雑な Git コマンド
- rebase / cherry-pick / stash
- GitHub Actions
- 実務レベルのブランチ戦略

**理由：**
第3回以降の Discord Bot 開発に必要なのは、  
「変更を記録して戻せる」ことだけだからです。

---

### 今覚えること（まとめ）

- Git → 履歴付きの保存システム
- GitHub → 履歴を置く場所
- commit → セーブポイントを作る
- push → セーブポイントをGitHubに送る
- repository → コードと履歴の箱

---

## 第2章：GitHubのリポジトリ作成（5分）

### この章でやること

GitHub上にリポジトリ（箱）を1つ作成します。

- まだコードは書きません
- まだコマンドも打ちません

**👉「このあとローカルと紐づける受け皿を用意する」**

---

### 手順

1. [GitHub](https://github.com/)にアクセス
2. ホーム画面の **New** ボタンをクリック
3. リポジトリ名：`git_practice`
4. Private を選択
5. **Create repository** をクリック

---

### Quick Setup画面について

リポジトリ作成後、コマンドが表示されます。

**👉 今はまだコマンドを実行しません**
**👉 この画面は閉じずに残しておいてください**

---

### この時点での状態

- **GitHub上** → `git_practice` という空のリポジトリが存在
- **ローカルPC** → まだ何も作っていない

---

## 第3章：ローカルフォルダの作成（5分）

### この章でやること

VS Codeのターミナルで：
- コマンドでフォルダを作成
- 作業フォルダに移動
- **まだGit管理されていない状態を確認**

---

### ターミナルを開く

1. VS Codeを開く
2. ショートカットキー **Ctrl + @** を入力
3. 画面下部にターミナルが表示される

---

### フォルダを作成して移動

```bash
mkdir git_practice
cd git_practice
```

**👉 これからの作業は `git_practice` フォルダの中で行います**

---

### VS Codeでフォルダを開く

1. メニュー **ファイル → フォルダーを開く**
2. `git_practice` フォルダを選択
3. **フォルダーの選択** をクリック

---

### Git管理されていないことを確認

```bash
git status
```

次のような表示が出るはずです：

```
fatal: not a git repository
```

**👉 これはエラーではありません**
**👉「このフォルダは、まだGit管理されていません」という意味です**

---

## 第4章：Gitを開始し、最初のcommit/pushを行う（15分）

### この章でやること

**Gitの核心となる操作を一気に行います**

- フォルダをGit管理にする
- ファイルを作成する
- commit（セーブポイント）を作る
- push（GitHubに送る）を行う

---

### 手順①：READMEファイルを作成

```bash
echo "# git_practice" > README.md
```

**👉 `README.md` というファイルが作成されます**

---

### 手順②：Gitを開始する

```bash
git init
```

**👉 このコマンドを実行した瞬間から、このフォルダはGit管理されます**

---

### 手順③：変更を追加する

```bash
git add .
```

**👉 `.` は「今のフォルダ内の変更すべて」という意味**

- **add** = カメラの画角を決めること
- **commit** = シャッターを切ること

---

### 手順④：最初のcommitを作成

```bash
git commit -m "first commit"
```

**👉 この commit が、このプロジェクトの最初の履歴になります**

---

### 手順⑤：ブランチ名をmainに統一

```bash
git branch -M main
```

**👉 これ以降、このプロジェクトの本線は `main` になります**

---

### 手順⑥：GitHubリポジトリと紐づける

```bash
git remote add origin https://github.com/自分のユーザー名/git_practice.git
```

**※ URLは自分のリポジトリURLに置き換えてください**

---

### 手順⑦：GitHubへpushする

```bash
git push -u origin main
```

**👉 このコマンドで、ローカルのcommitがGitHubに送信されます**

---

### GitHubで結果を確認

ブラウザで **GitHub** を開き、`git_practice` リポジトリを確認してください。

**✅ README.md が表示されていれば成功です！**

---

### なぜaddとcommitの2段階なの？

> フォルダの中で複数のファイルを変更していても、「今はこの変更だけを記録したい」ということがあります。

そのために：
- **`git add`** → どの変更を記録するか選ぶ（準備）
- **`git commit`** → その状態を履歴として確定する

という2ステップになっています。

---

### ここまでの流れ（整理）

```bash
echo "# git_practice" > README.md
git init
git add .
git commit -m "first commit"
git branch -M main
git remote add origin ...
git push -u origin main
```

**👉 これがGitで「最初の1作業」を完了させる最小構成です**

---

### ⚠️ よくあるつまずきポイント（超重要）

**ここは、Gitを初めて触る人がほぼ必ず一度は止まります。エラーが出ても正常です。**

#### つまずき①：「保存したのにcommitできない」

```bash
git commit -m "メッセージ"
# → Changes not staged for commit
```

**何が起きているか：**
- ファイルを保存しただけでは commit できません
- commit の前に必ず `git add` が必要です

**正しい手順：**
```bash
git add .        # ← これを忘れがち
git commit -m "メッセージ"
```

**👉 保存 ≠ Git への保存**

---

#### つまずき②：「ブランチ名を書いたのにpushできない」

```bash
git push origin feature/xxx
# → src refspec feature/xxx does not match any
```

**何が起きているか：**
- 存在しないブランチは push できません
- commit が1つも無いブランチも push できません

**正しい手順：**
```bash
git switch -c feature/xxx    # ブランチを作って移動
git add .                     # 変更を追加
git commit -m "メッセージ"    # commitを作る
git push -u origin feature/xxx # 初めてpush
```

**👉 ブランチは「作る→移動する→commitする→push」がセット**

---

#### つまずき③：「今どこにいるか分からない」

```bash
git status
# → On branch main
# （あれ？feature/xxxを作ったはずなのに？）
```

**何が起きているか：**
- ブランチを作っただけでは移動していません
- 今いる場所（ブランチ）を常に意識する必要があります

**確認方法：**
```bash
git branch
# → * が付いているのが今いるブランチ
```

**👉 Gitは常に「今どこ？」が超重要**

---

### 困ったときのチェックリスト

#### エラーが出たら、まずこれを実行：

```bash
git status
```

これで「Gitが今どう思ってるか」が分かります。

**表示の意味：**
- 赤い文字 → まだcommitできない（`git add` が必要）
- 緑の文字 → commitできる
- 何も出ない → 変更なし

---

### この章で覚えること

- Gitは **git init** から始まる
- 変更は **add → commit** で履歴になる
- GitHubに反映されるのは **pushしたときだけ**
- **エラーは失敗ではなく、Gitが正常に動いている証拠**

---

## 第5章：VSCodeで編集し、2回目のcommit/pushを行う（10分）

### この章でやること

**「保存」と「Gitの保存」は違うことを体験します**

- ファイルを編集する
- 保存する
- もう一度 commit / push を行う

---

### 手順①：README.mdを編集する

VS Codeで `README.md` を開き、内容を変更してください：

```markdown
# git_practice

Gitの練習用リポジトリ

## メモ
VSCodeで編集して2回目のcommitを行う
```

入力後、**保存（Ctrl + S）** します。

---

### ここで意識してほしいこと（超重要）

この時点で：
- ファイルは保存された
- しかし **GitHubにはまだ反映されていない**

**👉 保存 ≠ Gitに保存された**

---

### ⚠️ 初心者あるある

「Ctrl + S で保存したから、もうGitHubにも反映されてるはず」

**❌ これは間違いです**

**正しい理解：**
1. Ctrl + S → ローカルのファイルが保存される
2. git add → 「この変更をcommitする準備」
3. git commit → 「履歴として確定」
4. git push → 「GitHubに送信」

**👉 4つのステップすべてが必要です**

---

### 手順②：変更をcommitする

```bash
git add .
git commit -m "READMEを更新"
```

**👉 この commit は「READMEを編集した」という履歴の記録です**

---

### 手順③：GitHubにpushする

```bash
git push
```

**👉 このコマンドで、2回目のcommitがGitHubに送信されます**

---

### GitHubで結果を確認

ブラウザで **GitHub** を開き、`git_practice` リポジトリを確認してください。

**✅ README.md の内容が更新されていれば成功です！**

---

### この章で起きたこと

1. VS Codeでファイルを編集した
2. 保存した
3. commit を作った
4. push した
5. GitHubに反映された

**👉 GitHubに反映されたのは「pushしたから」です**

---

### Git作業の基本形

```bash
git add .
git commit -m "変更内容"
git push
```

**👉 これがGit作業の基本形です**

---

## 第6章：Node.jsプロジェクトとして初期化（5分）

### この章でやること

`git_practice` を **Node.jsプロジェクト** にします。

- Nodeプロジェクトを初期化
- ライブラリをインストール
- `.gitignore` と `.env` を用意
- **まとめてcommit / push**

**👉 ファイルが増えても、Gitの操作は増えません**

---

### 手順①：Node.jsプロジェクトを初期化

```bash
npm init -y
```

**👉 `package.json` が作成されます**

---

### 手順②：ライブラリをインストール

```bash
npm install discord.js dotenv
```

**👉 これで `node_modules` フォルダと `package-lock.json` が自動で作成されます**

---

### 手順③：.gitignoreを作成

```bash
echo node_modules > .gitignore
echo .env >> .gitignore
```

**👉 `.gitignore` に次の内容が入ります：**

```
node_modules
.env
```

---

### 手順④：.envファイルを作成

```bash
echo DISCORD_TOKEN= > .env
echo CLIENT_ID= >> .env
```

**👉 `.env` は GitHubにpushされません（`.gitignore` に書いたため）**

---

### 手順⑤：ここまでをcommit

```bash
git add .
git commit -m "Nodeプロジェクト初期化"
```

**👉 ファイルが何十個増えていても、commitは1つでOK**

---

### 手順⑥：GitHubにpush

```bash
git push
```

---

### GitHubで確認するポイント

- `package.json` がある
- `node_modules` は **存在しない**
- `.env` も **存在しない**

**👉 これが正しい状態です**

---

### この章で覚えること

- ファイルが大量に増えても焦らない
- Gitは **変更の量ではなく、区切りでcommitする**
- `.gitignore` は「上げない宣言」

---

## 第7章：branchを切ってBot機能を追加（10分）

### この章でやること

**初めてbranchを使った開発を行います**

- 作業用のbranchを作る
- Botに機能を1つ追加する
- branch上でcommit / pushする
- GitHubでbranchが分かれていることを確認

**👉 ここではまだmainに戻しません**

---

### 手順①：作業用ブランチを作成

```bash
git switch -c feature/add-ping
```

**👉 `feature/add-ping` というbranchが作られ、そのbranchに移動します**

---

### 手順②：branchが切り替わったことを確認

```bash
git branch
```

表示例：

```
* feature/add-ping
  main
```

**👉 `*` が付いているbranchが、今作業しているbranchです**

---

### ⚠️ ブランチ操作でよくある間違い

#### 間違い①：ブランチを作っただけで移動した気になる

```bash
git branch feature/xxx    # ← これは「作っただけ」
# まだ main にいる！
```

**正しい方法：**
```bash
git switch -c feature/xxx  # 作る＋移動が同時にできる
```

---

#### 間違い②：mainで作業してしまう

```bash
# 今どこ？を確認せずに作業開始
git add .
git commit -m "メッセージ"
# → あれ、mainにcommitしちゃった...
```

**予防策：**
```bash
git status  # 必ず確認
# → On branch main  ← ここを見る
```

**👉 作業前に必ず `git status` で現在地を確認**

---

#### 間違い③：commitする前にpushしようとする

```bash
git push -u origin feature/xxx
# → Everything up-to-date（何も起きない）
```

**何が起きているか：**
- commitが無いとpushするものが無い

**正しい順序：**
```bash
git add .
git commit -m "メッセージ"    # ← これが無いとpushできない
git push -u origin feature/xxx
```

---

### 手順③：Botのエントリーファイルを作成

```bash
echo "console.log('Bot start');" > index.js
```

---

### 手順④：Botに機能を追加

VS Codeで `index.js` を開き、次のように編集してください：

```javascript
console.log("Bot start");

function ping() {
  return "pong";
}

console.log(ping());
```

保存（Ctrl + S）します。

---

### 手順⑤：branch上でcommit

```bash
git add .
git commit -m "add ping function"
```

**👉 このcommitは、mainではなく `feature/add-ping` にだけ存在します**

---

### 手順⑥：branchをGitHubにpush

```bash
git push -u origin feature/add-ping
```

**👉 これで、GitHub上にも `feature/add-ping` branchが作られます**

---

### GitHubでbranchを確認

ブラウザで **GitHub** を開き、`git_practice` リポジトリを確認してください。

- branch一覧に `feature/add-ping` が表示されている
- mainとは別の履歴になっている

**👉 これがbranchの正体です**

---

### この章で起きていること

- mainは一切触っていない
- 新しいbranchでだけ作業した
- 変更はbranchに閉じ込められている
- GitHub上でもbranchが分かれている

**👉 branch = 作業用の隔離空間**

---

## 第8章：Pull Requestを作成し、mainにマージ（5分）

### この章でやること

**GitHub上での操作が中心になります**

- featureブランチの変更を確認する
- Pull Request（PR）を作成する
- mainブランチにマージする
- mainが更新されたことを確認する

---

### 手順①：Pull Request作成画面を開く

リポジトリ画面上部に **Compare & pull request** ボタンが表示されている場合は、それをクリックします。

表示されていない場合：
1. 上部タブの **Pull requests** をクリック
2. **New pull request** をクリック
3. base: `main`、compare: `feature/add-ping` になっていることを確認

---

### 手順②：Pull Requestの内容を入力

**Title:**
```
add ping function
```

**Description（任意）:**
```
ping用の関数を追加しました
```

入力できたら、**Create pull request** をクリック

---

### 手順③：Pull Requestをマージ

問題なければ、**Merge pull request** をクリック。

続けて、**Confirm merge** をクリック。

**👉 これで、featureブランチの変更がmainブランチに取り込まれます**

---

### 手順④：ローカルのmainを最新にする

VS Codeのターミナルで、次を実行：

```bash
git switch main
git pull
```

**👉 これで、GitHub上でマージされた内容がローカルのmainにも反映されます**

---

### この章で起きたこと

1. branchで作業した
2. branchをGitHubにpushした
3. Pull Requestを作成した
4. GitHub上でレビュー対象にした
5. mainにマージした
6. ローカルのmainを最新にした

**👉 これがGitHubを使った基本的なチーム開発フローです**

---

### なぜPull Requestを使うのか

- mainを直接触らないため
- 変更内容を確認するため
- 「なぜこの変更を入れたか」を残すため

**👉 Pull Request = 安全装置＋説明書**

---

## 第9章：Pull Requestまわりのよくある疑問（5分）

### 結論を先に（1行）

> **Pull Requestは「ブランチでやった作業を、mainに入れていいか確認するための手続き」**

- コードを書くための作業ではありません
- **安全に合流させるための作業**です

---

### PRが出てきた瞬間に何が起きていたか

第7章でやったことを事実だけ並べます：

1. `feature/add-ping` ブランチで作業した
2. commitしてpushした
3. **👉 この変更はmainには入っていない**

この時点の状態：
- **main** → 安全・そのまま
- **feature** → 新しい変更がある
- 両者は **分かれたまま**

**👉 Gitは「勝手に合流」しません**

---

### じゃあ、なぜPRが必要？

理由は1つだけ：

> **「本当にこの変更をmainに入れていい？」を確認するため**

PRは：
- 「どのブランチから」
- 「どのブランチへ」
- 「どんな変更を」
- 「なぜ入れるのか」

を **人が確認できる形にする装置** です。

---

### PRを作った瞬間、実は何も変わっていない

**PR作成時点では：**
- main → ❌ 変わっていない
- feature → ❌ 変わっていない
- コード → ❌ どこにも移動していない

**👉 PRは「相談を出しただけ」**

---

### 「Merge」を押した瞬間に起きたこと

PR画面で **Merge pull request** を押した瞬間、初めてこれが起きます：

```
feature/add-ping のcommit
        ↓
      mainにコピーされる
```

つまり：
- featureブランチで作ったcommitが
- **mainの履歴に追加された**

**👉 ここが本当のゴール**

---

### PRを一言で言い換えるなら

- PR = **合流ボタンに安全カバーを付けたもの**
- PR = **mainに入れる前の関所**
- PR = **「この変更、入れてOK？」の書面**

---

### じゃあ、いつPRを使うの？

**使うとき：**
- branchで作業したあと
- mainを直接触りたくないとき
- チーム開発（ほぼ必須）

**使わないとき（例外）：**
- 1人・超小規模
- 練習用リポジトリ
- 「壊れてもいい」作業

**👉 だから最初は「面倒」に感じるのが正常**

---

## 第10章：まとめ（5分）

### 結局、Gitとは何だったのか

> **変更の履歴を、区切りごとに残す仕組み**

今日やったことを思い出してください：
- ファイルを作った
- ファイルを編集した
- 区切りのタイミングでcommitした

**👉 Gitは「変更を覚えておく仕組み」**

---

### 主要な用語の整理

#### commitとは？

> **「ここまでやった」というセーブポイント**

- 変更が履歴として確定する
- 後から戻れる
- 「何をしたか」が言葉で残る

**👉 commitしない変更は、なかったことと同じ**

---

#### pushとは？

> **自分のPCの履歴を、GitHubに送る操作**

- commit → 自分のPCの中だけ
- push → はじめて共有される

**👉 pushしない限り、他の人には何も起きていない**

---

#### pullとは？

> **GitHub側で進んだ履歴を、自分のPCに取り込む操作**

- PRをマージしたあと
- 他の人がpushしたあと
- GitHub上で直接編集したあと

**👉 pull = 最新状態にそろえるための操作**

---

#### branchとは？

> **本線を壊さずに作業するための別ルート**

今回やったこと：
- mainは触らなかった
- featureブランチで作業した
- 問題なければmainに戻した

**👉 branch = 安全に試すための場所**

---

#### Pull Requestとは？

> **branchの作業を、mainに入れていいか確認する手続き**

- PRを作っただけ → 何も変わらない
- Mergeした瞬間 → mainが更新される

**👉 PR = 合流のための関所**

---

### 今日やった流れを1行で

```
mainを守りながら
  ↓
branchで作業して
  ↓
commitで区切り
  ↓
pushで共有し
  ↓
PRで確認して
  ↓
mainに戻す
```

**👉 これがGitを使った基本の開発フローです**

---

### 実務で最低限覚えておけばいいこと

全部覚えなくて大丈夫です。最低限、これだけで十分：

#### 毎回やること

```bash
git add .
git commit -m "変更内容"
git push
```

#### mainでは作業しない

- まずbranchを切る

#### PRは「確認の場」

- コードを書く場所ではない

---

### 最初は分からなくて当たり前

もし今「正直、全部は分かってない」と思っていても、それでOKです。

**Gitは：**
- 読んで理解するもの ❌
- **触って、あとから意味が分かるもの** ⭕

今日のハンズオンで：
- 手を動かした
- 失敗した
- 「なんで？」と思った

**それだけで、十分な一歩です。**

---

## このプロジェクト（Discord Bot開発）でのブランチ運用ルール

### 🌿 ブランチ構成

| ブランチ名 | 役割 |
|-----------|------|
| **main** | 本番用（実際に稼働中のBot） |
| **develop** | 開発の統合用（動作確認OKな状態） |
| **feature/〇〇** | 新機能追加（例：feature/music-command） |
| **fix/〇〇** | バグ修正（例：fix/token-error） |
| **hotfix/〇〇** | 本番の緊急修正 |

---

### 🔄 開発の流れ

```
1. develop から feature/* を作成
   ↓
2. 機能実装・テスト
   ↓
3. develop にマージ
   ↓
4. 動作確認後、main にマージ → デプロイ
```

---

### 📌 ルールのポイント

- **main では直接作業しない**
- Botのコマンド単位・修正単位でブランチを切る
- マージ前にローカル or テストサーバーで動作確認

**👉 小規模Botなら main ＋ feature/* だけでもOK**

---

### デプロイ先とは？

**👉 作成したプログラムやWebアプリを「実際に動かす場所」のことです。**

**🔰 かんたんに言うと：**
- **手元（ローカル）** → 自分のPCで作る・試す
- **デプロイ先** → 他の人が使えるように公開する場所

---

### 🏗️ デプロイ先の代表例

#### ☁️ クラウドサービス
- Vercel（Next.js など）
- Netlify（静的サイト）
- AWS（EC2 / S3 / ECS など）
- Google Cloud
- Azure

#### 🖥️ サーバー
- レンタルサーバー
- VPS（さくら、ConoHaなど）

**👉 このプロジェクトでのデプロイ先は、別途会議で決定します**

---

### 開発〜デプロイの基本的な流れ

```
1. ローカルで開発
   ↓
2. GitHubにpush
   ↓
3. デプロイ先（サーバーなど）とGitHubを連携
   ↓
4. 自動でデプロイ
   ↓
5. Botが実際に動作開始 🎉
```

**👉 具体的なデプロイ手順は、環境が決まってから整備します**

---

## 困ったときのトラブルシューティング

### エラーメッセージ別対処法

#### 「Changes not staged for commit」

**原因：** `git add` を忘れている

**対処法：**
```bash
git add .
git commit -m "メッセージ"
```

---

#### 「src refspec 〇〇 does not match any」

**原因：** 
- ブランチが存在しない
- または commitが1つも無い

**対処法：**
```bash
git status  # 今どこにいるか確認
git branch  # ブランチ一覧を確認
git add .
git commit -m "メッセージ"  # commitを作る
git push -u origin ブランチ名
```

---

#### 「fatal: not a git repository」

**原因：** Gitが初期化されていない

**対処法：**
```bash
git init
```

---

#### 「error: failed to push some refs」

**原因：** GitHub側が進んでいる（他の人がpushした、など）

**対処法：**
```bash
git pull  # まず最新を取得
git push  # もう一度push
```

---

### とにかく困ったら

```bash
git status
```

**これを実行すると：**
- 今どのブランチにいるか
- 何が変更されているか
- 次に何をすべきか

が分かります。

**👉 困ったらまず `git status`**

---

## コマンド一覧（チートシート）

### 初回セットアップ

```bash
git init
git remote add origin <URL>
git branch -M main
```

### 日常的な作業

```bash
git add .
git commit -m "メッセージ"
git push
```

### ブランチ操作

```bash
git switch -c <ブランチ名>    # ブランチ作成＋移動
git switch main              # mainに移動
git branch                   # ブランチ一覧
```

### 最新状態の取得

```bash
git pull
```

### 状態確認

```bash
git status
git log
```

---

## 次のステップ

1. **このハンズオンをもう一度、自分で最初から実行してみる**
2. **別のプロジェクトでGitを使ってみる**
3. **チームメンバーと一緒にPRの練習をしてみる**
4. **conflict（競合）が起きたときの対処を学ぶ**

---

## 参考資料・リンク

### Git/GitHub基礎
- **GitHub公式ドキュメント**: https://docs.github.com/ja
- **GitHub Copilot概念解説**: https://zenn.dev/cbmrham/articles/202401-github-copilot-concepts

---

## お疲れさまでした！

60分のハンズオンはこれで完了です。

- Gitの基本操作ができるようになった
- branchを使った開発フローが分かった
- Pull Requestの意味が理解できた

**👉 もうGitを触ったことがある人です！**

何か分からないことがあれば、いつでも質問してください。
