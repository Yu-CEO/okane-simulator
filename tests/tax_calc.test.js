/*
 * tax_calc.test.js：js/tax_calc.js（課税口座の税金）の自動テスト
 * 実行方法：simulator フォルダで `node --test`
 */
const test = require("node:test");
const assert = require("node:assert");
const { TAX_RATE, calculateTax } = require("../js/tax_calc.js");
const { formatMan } = require("../js/format.js");

test("税率は20.315%の1か所にまとまっている", function () {
  assert.strictEqual(TAX_RATE, 0.20315);
});

test("AC-25：最終額12.5万円・元本12万円なら税金は約0.1万円、税引き後は12.4万円", function () {
  const result = calculateTax(12.5, 12);
  assert.strictEqual(formatMan(result.tax), "0.1万円");
  assert.strictEqual(formatMan(result.afterTax), "12.4万円");
});

test("増えた額がマイナスや0のときは税金0", function () {
  assert.strictEqual(calculateTax(10, 12).tax, 0);
  assert.strictEqual(calculateTax(10, 12).afterTax, 10);
  assert.strictEqual(calculateTax(12, 12).tax, 0);
});
