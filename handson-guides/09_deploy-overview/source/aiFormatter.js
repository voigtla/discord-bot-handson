/**
 * aiFormatter.js
 *
 * 役割：
 * - すでに決まっている文章を AI に渡す
 * - 意味を変えずに、読みやすく整えた文章を返す
 *
 * 重要：
 * - ユーザー入力は渡さない
 * - 判断・評価・助言をさせない
 */

const { GoogleGenerativeAI } = require("@google/generative-ai");

const apiKey = process.env.GEMINI_API_KEY;
const genAI = new GoogleGenerativeAI(apiKey);

const model = genAI.getGenerativeModel({
    model: "gemini-pro",
});

export async function formatText(text) {
    const prompt = `
次の文章を、意味を変えずに、丁寧で読みやすい日本語に整えてください。
内容を足したり、評価したり、助言したりしないでください。

文章：
${text}
`;

    const result = await model.generateContent(prompt);
    const response = result.response;
    return response.text();
}