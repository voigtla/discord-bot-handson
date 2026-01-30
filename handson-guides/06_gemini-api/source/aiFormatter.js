/**
 * 第6回：Gemini API を使った文章整形専用モジュール
 * - 意味を変えない
 * - 判断・助言をさせない
 * - 自由生成しない
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

async function formatText(text) {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });

    const prompt = `
以下の文章の意味を一切変えず、
判断・助言・評価を追加せずに、
表現だけを自然に整えてください。

文章：
「${text}」
`;

    const result = await model.generateContent(prompt);
    return result.response.text().trim();
}

module.exports = { formatText };
