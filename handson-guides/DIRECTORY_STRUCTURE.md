# Discord Bot ハンズオン - ディレクトリ構造

このドキュメントは、ハンズオン用リポジトリの推奨ディレクトリ構造を示します。

---

## 📁 完成形のディレクトリ構造

```
discord-bot-handson/
│
├── README.md                           # トップページ（本リポジトリの説明）
├── index.md                            # ハンズオン目次（全10回の概要）
├── roadmap.md                          # 全10回の詳細ロードマップ
├── SETUP_GITHUB.md                     # GitHubアップロード手順
├── LICENSE                             # ライセンス（MIT推奨）
│
├── handson-guides/                     # 各回のハンズオン資料
│   ├── 01_setup/                       # 第1回: 環境セットアップ
│   │   └── README.md
│   │
│   ├── 02_git-practice/                # 第2回: Git/GitHub基礎
│   │   └── README.md                   # ✅ 既存資料
│   │
│   ├── 03_bot-sqlite/                  # 第3回: Bot+SQLite
│   │   ├── README.md                   # ✅ 今回作成
│   │   └── source/                     # サンプルコード
│   │       ├── index.js
│   │       ├── register-commands.js
│   │       ├── package.json
│   │       └── .env.example
│   │
│   ├── 04_mental-bot-basic/            # 第4回: 気分記録+統計
│   │   ├── README.md                   # ✅ 今回作成
│   │   └── source/
│   │       ├── index.js
│   │       ├── register-commands.js
│   │       └── package.json
│   │
│   ├── 05_sql-patterns/                # 第5回: 定型パターン
│   │   ├── README.md                   # ✅ 今回作成
│   │   └── source/
│   │       ├── index.js
│   │       ├── register-commands.js
│   │       └── templates.json          # 初期テンプレート
│   │
│   ├── 06_gemini-api/                  # 第6回: AI機能（第一回）
│   │   ├── README.md                   # ✅ 今回作成
│   │   └── source/
│   │       ├── index.js
│   │       ├── ai-helper.js            # AI機能モジュール
│   │       ├── register-commands.js
│   │       └── test-gemini.js          # 動作確認スクリプト
│   │
│   ├── 07_bot-security/                # 第7回: セキュリティ
│   │   ├── README.md                   # ✅ 今回作成
│   │   └── source/
│   │       ├── index.js
│   │       ├── spam-detector.js        # スパム検出モジュール
│   │       ├── content-filter.js       # コンテンツフィルタ
│   │       └── register-commands.js
│   │
│   ├── 08_error-handling/              # 第8回: エラーハンドリング
│   │   ├── README.md                   # ✅ 今回作成
│   │   └── source/
│   │       ├── index.js
│   │       ├── dangerous-examples.js   # わざと壊れる例
│   │       └── safe-examples.js        # 安全な実装例
│   │
│   ├── 09_ssh-deployment/              # 第9回: デプロイ
│   │   ├── README.md                   # ✅ 今回作成
│   │   └── scripts/
│   │       ├── deploy.sh               # デプロイスクリプト
│   │       ├── backup.sh               # バックアップスクリプト
│   │       └── ecosystem.config.js     # PM2設定
│   │
│   └── 10_final-review/                # 第10回: 総まとめ
│       ├── README.md                   # ✅ 今回作成
│       ├── COMMANDS.md                 # コマンドリファレンス
│       └── OPERATIONS.md               # 運用マニュアル
│
├── references/                         # 参考資料
│   ├── git-troubleshooting.md          # Gitエラー対処法
│   ├── gemini-guidelines.md            # LLM使用ガイドライン
│   ├── faq.md                          # よくある質問
│   ├── troubleshooting.md              # トラブルシューティング
│   └── resources.md                    # 参考リンク集
│
├── templates/                          # テンプレートファイル
│   ├── .env.example                    # 環境変数のサンプル
│   ├── .gitignore                      # Git除外設定
│   ├── package.json.template           # package.jsonのひな形
│   └── ecosystem.config.js.example     # PM2設定のサンプル
│
├── completed-bot/                      # 完成版のBot（参考用）
│   ├── index.js                        # メインファイル
│   ├── ai-helper.js                    # AI機能
│   ├── spam-detector.js                # スパム検出
│   ├── content-filter.js               # コンテンツフィルタ
│   ├── register-commands.js            # コマンド登録
│   ├── package.json                    # 依存関係
│   ├── .env.example                    # 環境変数サンプル
│   ├── .gitignore                      # Git除外設定
│   └── README.md                       # 使い方
│
└── assets/                             # 画像・図解などのリソース
    ├── screenshots/                    # スクリーンショット
    │   ├── discord-dev-portal.png
    │   ├── bot-invite.png
    │   └── pm2-monitoring.png
    │
    └── diagrams/                       # 図解
        ├── architecture.png            # システム構成図
        ├── data-flow.png               # データフロー図
        └── deployment.png              # デプロイフロー図
```

---

## 📝 各ディレクトリの説明

### ルートディレクトリ

| ファイル | 説明 |
|---------|------|
| `README.md` | リポジトリのトップページ（GitHub表示用） |
| `index.md` | ハンズオン全体の目次・概要 |
| `roadmap.md` | 各回の詳細な学習内容 |
| `SETUP_GITHUB.md` | GitHubへのアップロード手順 |
| `LICENSE` | ライセンス情報（MIT推奨） |

---

### `handson-guides/` - ハンズオン資料

各回ごとにディレクトリを分けて、README.mdとサンプルコードを配置。

**命名規則**: `XX_テーマ名/`
- 01_setup
- 02_git-practice
- 03_bot-sqlite
- ...

**各回のディレクトリ構成**:
```
XX_テーマ名/
├── README.md           # その回のハンズオン手順
└── source/             # サンプルコード
    ├── index.js
    ├── register-commands.js
    └── package.json
```

---

### `references/` - 参考資料

ハンズオン中に参照する補足資料。

| ファイル | 内容 |
|---------|------|
| `git-troubleshooting.md` | Gitでよくあるエラーと対処法 |
| `gemini-guidelines.md` | Gemini API使用時の注意点 |
| `faq.md` | よくある質問と回答 |
| `troubleshooting.md` | トラブルシューティング全般 |
| `resources.md` | 参考リンク・学習リソース |

---

### `templates/` - テンプレートファイル

プロジェクトで使い回すテンプレート。

| ファイル | 用途 |
|---------|------|
| `.env.example` | 環境変数のサンプル（トークンは空） |
| `.gitignore` | Git除外設定 |
| `package.json.template` | Node.jsプロジェクトのひな形 |
| `ecosystem.config.js.example` | PM2設定のサンプル |

---

### `completed-bot/` - 完成版Bot

全10回を通して作成するBotの完成形。

**用途**:
- 参加者が詰まったときの参考
- コードの答え合わせ
- デモ用

**注意**: これをそのまま使うのではなく、ハンズオンで自分で作ることが重要。

---

### `assets/` - リソースファイル

画像、図解などのメディアファイル。

**サブディレクトリ**:
- `screenshots/`: 手順説明用のスクリーンショット
- `diagrams/`: システム構成図などの図解

---

## 🚀 セットアップ手順

### 1. リポジトリをクローン

```bash
git clone https://github.com/your-username/discord-bot-handson.git
cd discord-bot-handson
```

### 2. 資料を確認

```bash
# トップページを開く
cat README.md

# 目次を確認
cat index.md

# 各回の資料を確認
ls handson-guides/
```

### 3. ハンズオンを開始

```bash
# 例: 第3回の資料を開く
cat handson-guides/03_bot-sqlite/README.md

# サンプルコードを確認
ls handson-guides/03_bot-sqlite/source/
```

---

## 📦 参加者の作業ディレクトリ

参加者は別途、自分の作業用ディレクトリを作成します：

```
~/git_practice/                 # 参加者の作業ディレクトリ
├── index.js                    # 自分で作成するファイル
├── register-commands.js
├── ai-helper.js
├── spam-detector.js
├── content-filter.js
├── package.json
├── package-lock.json
├── .env                        # 環境変数（Git除外）
├── .gitignore
├── bot.db                      # SQLiteデータベース（Git除外）
├── node_modules/               # 依存パッケージ（Git除外）
└── README.md                   # 任意: 自分用のメモ
```

**重要**: 
- ハンズオン資料のリポジトリ ≠ 参加者の作業リポジトリ
- 参加者は自分のGitHubに `git_practice` リポジトリを作成

---

## 🔒 Git除外設定（`.gitignore`）

ハンズオン資料リポジトリの `.gitignore`:

```gitignore
# 環境変数
.env

# データベース
*.db
*.sqlite

# Node.js
node_modules/
npm-debug.log
package-lock.json

# OS
.DS_Store
Thumbs.db

# エディタ
.vscode/
.idea/
*.swp
*.swo

# ログ
*.log
logs/

# PM2
.pm2/
```

---

## 📋 ファイル作成チェックリスト

### 今回作成済み（✅）

- [x] `index.md` - ハンズオン目次
- [x] `03_bot-sqlite_README.md` - 第3回資料
- [x] `04_mental-bot-basic_README.md` - 第4回資料
- [x] `05_sql-patterns_README.md` - 第5回資料
- [x] `06_gemini-api_README.md` - 第6回資料
- [x] `07_bot-security_README.md` - 第7回資料
- [x] `08_error-handling_README.md` - 第8回資料
- [x] `09_ssh-deployment_README.md` - 第9回資料
- [x] `10_final-review_README.md` - 第10回資料

### 今後作成が必要（□）

- [ ] ルート `README.md` - リポジトリ説明
- [ ] `roadmap.md` - 詳細ロードマップ
- [ ] 各回のサンプルコード (`source/`)
- [ ] 参考資料 (`references/`)
- [ ] テンプレートファイル (`templates/`)
- [ ] 完成版Bot (`completed-bot/`)
- [ ] スクリーンショット (`assets/screenshots/`)

---

## 🎨 ディレクトリ構造のビジュアル表示

```
discord-bot-handson/
│
├── 📘 index.md                    ← スタートはここ
├── 📚 handson-guides/
│   ├── 📗 01_setup/
│   ├── 📗 02_git-practice/
│   ├── 📗 03_bot-sqlite/          ← Botの始まり
│   ├── 📗 04_mental-bot-basic/
│   ├── 📗 05_sql-patterns/
│   ├── 📗 06_gemini-api/          ← AI導入
│   ├── 📗 07_bot-security/
│   ├── 📗 08_error-handling/
│   ├── 📗 09_ssh-deployment/      ← 本番デプロイ
│   └── 📗 10_final-review/        ← ゴール
│
├── 📖 references/                 ← 困ったらここ
├── 📄 templates/                  ← コピーして使う
├── 🤖 completed-bot/              ← 答え合わせ用
└── 🖼️ assets/                     ← 画像・図解
```

---

## 💡 ベストプラクティス

### ファイル命名規則

- **ディレクトリ**: `小文字-ハイフン区切り`
  - 例: `bot-security`, `error-handling`

- **Markdownファイル**: `大文字スタート + .md`
  - 例: `README.md`, `OPERATIONS.md`

- **コードファイル**: `小文字-ハイフン区切り.js`
  - 例: `ai-helper.js`, `spam-detector.js`

### ディレクトリの整理

- 1回あたり1ディレクトリ
- サンプルコードは `source/` に格納
- 画像は `assets/` に格納
- 共通資料は `references/` に格納

---

このディレクトリ構造に従うことで：
✅ ハンズオンが進めやすくなる
✅ 資料が探しやすくなる
✅ チーム開発がスムーズになる
✅ 保守性が向上する

---

最終更新: 2025年2月
