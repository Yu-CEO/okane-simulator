/*
 * nisa_calc.test.js：js/nisa_calc.js（NISA積立の計算・注意文の条件）の自動テスト
 * 実行方法：simulator フォルダで `node --test`
 */
const test = require("node:test");
const assert = require("node:assert");
const { calculateNisa, getNisaWarnings, WARNING_ANNUAL_LIMIT, WARNING_LIFETIME_LIMIT } =
  require("../js/nisa_calc.js");
const { formatMan } = require("../js/format.js");

test("AC-1：初期値（3万円・20年・4%）は元本720万円、最終金額は式どおり約1,100万円", function () {
  const result = calculateNisa(3, 20, 4);
  assert.strictEqual(formatMan(result.principal), "720万円");
  // 式：3 × ((1 + 0.04/12)^240 − 1) ÷ (0.04/12)
  const monthlyRate = 0.04 / 12;
  const expected = 3 * ((Math.pow(1 + monthlyRate, 240) - 1) / monthlyRate);
  assert.strictEqual(result.total, expected);
  assert.ok(result.total > 1090 && result.total < 1110);
});

test("AC-2：毎月3万円・20年・利回り0%は 720万円／720万円／0万円", function () {
  const result = calculateNisa(3, 20, 0);
  assert.strictEqual(formatMan(result.total), "720万円");
  assert.strictEqual(formatMan(result.principal), "720万円");
  assert.strictEqual(formatMan(result.gain), "0万円");
});

test("AC-3：毎月11万円ではつみたて投資枠の注意が出て、10万円では出ない", function () {
  assert.ok(getNisaWarnings(11, 11 * 12).includes(WARNING_ANNUAL_LIMIT));
  assert.ok(!getNisaWarnings(10, 10 * 12).includes(WARNING_ANNUAL_LIMIT));
});

test("AC-4：毎月10万円・20年は生涯枠の注意だけ、11万円・20年は両方", function () {
  const tenMan = calculateNisa(10, 20, 4);
  assert.deepStrictEqual(getNisaWarnings(10, tenMan.principal), [WARNING_LIFETIME_LIMIT]);
  const elevenMan = calculateNisa(11, 20, 4);
  assert.deepStrictEqual(getNisaWarnings(11, elevenMan.principal), [WARNING_ANNUAL_LIMIT, WARNING_LIFETIME_LIMIT]);
});

test("AC-9：0年・0円でもNaNにならない", function () {
  const result = calculateNisa(0, 0, 0);
  assert.strictEqual(formatMan(result.total), "0万円");
  assert.strictEqual(formatMan(result.gain), "0万円");
});
