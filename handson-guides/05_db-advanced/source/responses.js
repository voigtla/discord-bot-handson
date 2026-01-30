/**
 * 第5回：Botが返してよい文章だけを定義する
 * - 評価しない
 * - 断定しない
 * - 指示しない
 */

module.exports = {
    hello_ok: "記録しました。教えてくれてありがとう。",
    restricted: "ここでは判断や助言は行いません。",
    count_result: (count) => `これまでの記録回数は ${count} 回です。`,
};
