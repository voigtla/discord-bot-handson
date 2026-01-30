# 第1回：開発環境構築

Discord Bot開発に必要な環境をセットアップします。

---

## この回でやること

1. **Node.js** のインストール（JavaScript実行環境）
2. **Git** のインストール
3. **GitHub** アカウント作成
4. **VS Code** のインストール（エディタ）
5. **動作確認**

---

## 所要時間

約30〜40分

---

## 1. Node.js のインストール

### ダウンロード

https://nodejs.org/ja/download にアクセスします。

![Node.js ダウンロードページ]

**推奨版（LTS）** をダウンロードしてください。

---

### インストール手順

1. ダウンロードした `.msi` ファイルを実行
2. **Next** をクリックして進める
3. すべてデフォルト設定のまま **Next** → **Install**
4. **Finish** をクリックして完了

---

### 動作確認

**Windows Terminal（または PowerShell）** を起動します。

**起動方法：**
- スタートボタンを **右クリック**
- **ターミナル** または **Windows PowerShell** を選択

以下のコマンドを実行：

```bash
node -v
npm -v
```

**表示例：**
```
v20.11.0
10.2.4
```

バージョンが表示されれば **成功** です！

---

## 2. Git のインストール

### ダウンロード

https://git-scm.com/ にアクセスします。

**Download for Windows** をクリックしてインストーラーをダウンロードします。

---

### インストール手順

1. ダウンロードした `.exe` ファイルを実行
2. すべてデフォルト設定のまま **Next** → **Install**
3. **Finish** をクリックして完了

---

### 動作確認

ターミナルで以下のコマンドを実行：

```bash
git --version
```

**表示例：**
```
git version 2.43.0.windows.1
```

バージョンが表示されれば **成功** です！

---

## 3. GitHub アカウント作成

### アカウント登録

https://github.com/ にアクセスします。

**Sign up** をクリックして、以下を入力：
- メールアドレス
- パスワード
- ユーザー名

**注意：** ユーザー名は後から変更できますが、URLに使われるので慎重に決めてください。

---

### 初期設定（Git）

ターミナルで以下のコマンドを実行：

```bash
git config --global user.name "あなたの名前"
git config --global user.email "あなたのメールアドレス"
```

**例：**
```bash
git config --global user.name "Taro Yamada"
git config --global user.email "taro@example.com"
```

---

## 4. VS Code のインストール

### ダウンロード

https://code.visualstudio.com/ にアクセスします。

**Download for Windows** をクリックしてインストーラーをダウンロードします。

---

### インストール手順

1. ダウンロードした `.exe` ファイルを実行
2. 利用規約に **同意する**
3. 以下にチェックを入れる（推奨）：
   - ☑ デスクトップにアイコンを作成する
   - ☑ PATH への追加（すべてのユーザー）
   - ☑ エクスプローラーのコンテキストメニューに追加する
4. **インストール** をクリック
5. **完了** をクリックして閉じる

---

### 日本語化（任意）

VS Codeを起動したら、左側のアイコンから **Extensions（拡張機能）** をクリック。

検索欄に `Japanese` と入力し、**Japanese Language Pack for VS Code** をインストールします。

インストール後、**再起動** すると日本語になります。

---

## 5. 動作確認（実践テスト）

### ゴール

- VS Codeでフォルダを開ける
- ファイルを作って保存できる
- JavaScriptコードを実行できる

---

### 手順①：作業フォルダを作成

ターミナルで以下のコマンドを実行：

```bash
mkdir discord-bot-test
cd discord-bot-test
```

**👉 `discord-bot-test` という名前のフォルダが作成され、そのフォルダに移動しました**

---

### 手順②：VS Codeでフォルダを開く

VS Codeを起動して：
1. **File（ファイル）** → **Open Folder（フォルダーを開く）**
2. 先ほど作成した `discord-bot-test` フォルダを選択
3. **フォルダーの選択** をクリック

---

### 手順③：ファイルを作成

1. **File（ファイル）** → **New File（新しいファイル）**
2. ファイル名を `index.js` として保存
3. 以下のコードを入力：

```javascript
console.log("はじめてのVS Code");
```

4. **Ctrl + S** で保存

---

### 手順④：ターミナルで実行

VS Code内でターミナルを開きます：
- ショートカットキー **Ctrl + @**（Ctrl + Shift + @ の場合もあります）

ターミナルで以下のコマンドを実行：

```bash
node index.js
```

**表示例：**
```
はじめてのVS Code
```

この表示が出れば **成功** です！🎉

---

## トラブルシューティング

### ターミナルが開かない

**対処法：**
- メニューバーから **表示** → **ターミナル** を選択

---

### `node: command not found` と表示される

**原因：** Node.jsが正しくインストールされていない

**対処法：**
1. ターミナルを **再起動**
2. それでもダメなら Node.js を **再インストール**

---

### `git: command not found` と表示される

**原因：** Gitが正しくインストールされていない

**対処法：**
1. ターミナルを **再起動**
2. それでもダメなら Git を **再インストール**

---

## 用語解説

### Node.js とは？

JavaScriptを **パソコン上で実行** するための環境です。

通常、JavaScriptはブラウザの中でしか動きませんが、Node.jsを使うことで：
- サーバー側のプログラムが書ける
- Discord Botが作れる

---

### npm とは？

**Node Package Manager** の略。

Node.jsで使えるライブラリ（便利な道具）を **インストール・管理** するツールです。

---

### Git とは？

ファイルの変更履歴を記録する **バージョン管理システム** です。

「いつ」「誰が」「何を変更したか」を記録できます。

---

### GitHub とは？

Gitの履歴を **インターネット上で管理・共有** できるサービスです。

---

### VS Code とは？

**Visual Studio Code** の略。

Microsoftが開発した、プログラミング用の **無料エディタ** です。

---

## この回で覚えること

- Node.jsはJavaScriptの実行環境
- GitとGitHubは違うもの（Gitは道具、GitHubはサービス）
- VS Codeはプログラミング用のエディタ
- ターミナル（コマンドライン）の基本操作

---

## 次回予告

**第2回：Git/GitHub基礎**
- リポジトリの作成
- commit / push の基本
- branchを使った開発

---

## 参考資料

- [Node.js公式サイト](https://nodejs.org/ja/)
- [Git公式サイト](https://git-scm.com/)
- [GitHub公式サイト](https://github.com/)
- [VS Code公式サイト](https://code.visualstudio.com/)

---

## お疲れさまでした！

環境構築が完了しました。次回からいよいよBot開発に入っていきます 🎉
