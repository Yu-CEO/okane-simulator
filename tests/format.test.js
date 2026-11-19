/*
 * format.test.js：js/format.js（金額の表示形式・入力値の変換）の自動テスト
 * 実行方法：simulator フォルダで `node --test`
 */
const test = require("node:test");
const assert = require("node:assert");
const { toNonNegativeNumber, formatMan, formatManSigned, formatManShort, formatPercentSigned, formatPercentShort } =
  require("../js/format.js");

test("AC-9：空欄・数字でないもの・マイナスは0になる", function () {
  assert.strictEqual(toNonNegativeNumber(""), 0);
  assert.strictEqual(toNonNegativeNumber("abc"), 0);
  assert.strictEqual(toNonNegativeNumber("-5"), 0);
  assert.strictEqual(toNonNegativeNumber("3.5"), 3.5);
});

test("金額は小数第1位で四捨五入し、カンマと「万円」をつける", function () {
  assert.strictEqual(formatMan(1100.32), "1,100.3万円");
  assert.strictEqual(formatMan(78), "78万円");
  assert.strictEqual(formatMan(0), "0万円");
});

test("マイナスの金額は全角の「−」をつける", function () {
  assert.strictEqual(formatMan(-6.54), "−6.5万円");
  assert.strictEqual(formatMan(-1234.5), "−1,234.5万円");
});

test("手元に残るお金は0以上なら「+」をつける", function () {
  assert.strictEqual(formatManSigned(6.5), "+6.5万円");
  assert.strictEqual(formatManSigned(0), "+0万円");
  assert.strictEqual(formatManSigned(-3), "−3万円");
});

test("幅の下の数字は「円」を省き、収益率は小数第2位まで符号つきで出す", function () {
  assert.strictEqual(formatManShort(1100.32), "1,100.3万");
  assert.strictEqual(formatPercentSigned(14.89), "+14.89%");
  assert.strictEqual(formatPercentSigned(-17.05), "−17.05%");
  assert.strictEqual(formatPercentSigned(0), "0.00%");
  assert.strictEqual(formatPercentSigned(50.3), "+50.30%");
});

test("AC-39・46：最も悪かった／よかった年度の収益率は小数第1位", function () {
  assert.strictEqual(formatPercentShort(-8), "−8.0%");
  assert.strictEqual(formatPercentShort(12), "+12.0%");
  assert.strictEqual(formatPercentShort(0), "0.0%");
});
