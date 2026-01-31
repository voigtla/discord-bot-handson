/**
 * aiFormatter.js
 *
 * 役割：
 * - 文章の「意味を変えずに」整える
 * - 判断・評価・助言はしない
 */

require("dotenv").config();

// ※ 第6回では中身はダミーでもOK
// 実際の API 呼び出しは簡略化しています

async function formatText(text) {
    // いまはそのまま返す（意味を変えない）
    return text;
}

module.exports = {
    formatText,
};
