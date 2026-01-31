# 第8回：わざと「危ないBot」を作って、手で止める  
— 実装して、消して、理解する —

第8回では、**一時的に Bot を「ダメな方向」に進めます**。

これは失敗ではありません。  
**体験するために、わざとやります。**

> 作って  
> ↓  
> 「あ、これはダメだ」と感じて  
> ↓  
> 自分の手で削除する  

ここまでやって、はじめて理解になります。

---

## 🎯 この回のゴール

この回のゴールは、次の1点です。

> **「この実装は危ない」と、  
> コードを見て・触って・消せるようになる**

- 理屈で説明できなくてOK
- 気持ち悪いと感じられたらOK
- **最後に元に戻せたら合格**

---

## ✅ 先に全体の流れ（迷子防止）

今日は次の流れで進めます。

1. `/count` に「余計な一言」を足す  
2. Discordで実際に見てみる  
3. 「何が変か」を確認する  
4. そのコードを **自分の手で削除**する  
5. Botを元に戻す  

---

## 前提条件

- 第7回を完了している
- `/hello` と `/count` が動作している
- エラー時は固定文で終わる
- `git_practice` フォルダを継続使用している

---

## 今回の重要ルール

⚠️ この回で入れる変更は **一時的**です。  
⚠️ 最後に **必ず消します**。  
⚠️ Git に残しません（commit しません）。

---

# 1️⃣ `/count` に「余計な一言」を足す

まず、**あえて危ない実装**を入れます。

---

## 1-1. index.js を開く

### いま開いている画面：VS Code（エディタ）

`index.js` を開いてください。

---

## 1-2. `/count` の返信部分を探す

このあたりを探します。

```js
if (interaction.commandName === "count") {
  const userId = interaction.user.id;

  db.get(
    `SELECT COUNT(*) as cnt FROM logs WHERE user_id = ?`,
    [userId],
    async (err, row) => {
      if (err) {
        await interaction.reply({
          content: "処理に失敗しました。",
          ephemeral: true,
        });
        return;
      }

      const rawText = `これまでの記録回数は ${row.cnt} 回です。`;
      const formatted = await formatText(rawText);

      await interaction.reply(formatted);
    }
  );
}
````

---

## 1-3. 危ない一文を足す（わざと）

**次のように書き換えてください。**

```js
if (interaction.commandName === "count") {
  const userId = interaction.user.id;

  db.get(
    `SELECT COUNT(*) as cnt FROM logs WHERE user_id = ?`,
    [userId],
    async (err, row) => {
      if (err) {
        await interaction.reply({
          content: "処理に失敗しました。",
          ephemeral: true,
        });
        return;
      }

      // 👇「危ない一言」は rawText 側に入れる（AI整形が入っていても消えにくい）
      const rawText =
        `これまでの記録回数は ${row.cnt} 回です。` +
        `\n\n最近の調子が分かりますね。`;

      const formatted = await formatText(rawText);

      await interaction.reply(formatted);
    }
  );
}
```

👉 これが **今回わざと入れる「余計な一言」**です。

---

# 2️⃣ Botを起動して、実際に見てみる

## 2-1. Botを起動

### いま操作している画面：VS Code のターミナル

```bash
node index.js
```

---

## 2-2. Discordで `/count` を実行

### いま開いている画面：Discord

```text
これまでの記録回数は 3 回です。

最近の調子が分かりますね。
```

---

# 3️⃣ 違和感を確認する（重要）

ここで **考えてください**。
正解はありません。

* この一文、必要？
* Botが「分かってる」感じしない？
* 誰かに言われたら、重くない？

👉 **少しでも引っかかればOK**です。

---

# 4️⃣ なぜこれが「危ない」のか（短く）

理由は1つだけです。

> **Botが「解釈した」ように見えるから**

* 数字に意味を足している
* 状態を判断したように見える
* 受け取り方が人によって変わる

これが積み重なると、
Botが **余計なことを言う存在**になります。

---

# 5️⃣ そのコードを「自分の手で消す」

ここがこの回の本番です。

---

## 5-1. さっき変更したコードを元に戻す

```js
if (interaction.commandName === "count") {
  const userId = interaction.user.id;

  db.get(
    `SELECT COUNT(*) as cnt FROM logs WHERE user_id = ?`,
    [userId],
    async (err, row) => {
      if (err) {
        await interaction.reply({
          content: "処理に失敗しました。",
          ephemeral: true,
        });
        return;
      }

      const rawText = `これまでの記録回数は ${row.cnt} 回です。`;
      const formatted = await formatText(rawText);

      await interaction.reply(formatted);
    }
  );
}
```

**元に戻すだけ**でOKです。

---

## 5-2. Botを再起動

```bash
Ctrl + C
node index.js
```

---

## 5-3. もう一度 `/count`

```text
これまでの記録回数は 3 回です。
```

👉 **余計な一文が消えていれば成功**

---

# 6️⃣ 今回は Git に保存しない

この回でやったことは：

* 危ない実装を入れた
* 見た
* 消した

👉 **最終状態は第7回と同じ**なので、

* `git add`
* `git commit`

は **やりません**。

---

# 7️⃣ この回で体験したこと（まとめ）

今日やったのは、たったこれだけです。

* 文章を1行足した
* 違和感を見た
* 消した

でもこれは、

> **「安全な設計を守るための最短ルート」**

です。

---

## ✅ この回のチェックリスト

* [ ] `/count` に余計な一文を足した
* [ ] Discordで見て違和感を感じた
* [ ] その一文を自分で削除した
* [ ] Botが元の挙動に戻った
* [ ] Git に何も残していない

---

## 次回予告（第9回）

次回は、
**「このBotを他の人に使わせても壊れない形」にします。**

* 環境差で落ちない
* 秘密情報を持ち出さない
* 起動手順を固定する

**運用の入口**に進みます。
