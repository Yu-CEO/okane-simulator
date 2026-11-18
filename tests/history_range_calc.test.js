/*
 * history_range_calc.test.js：js/history_range_calc.js（将来の幅の年利回り）の自動テスト
 * 実行方法：simulator フォルダで `node --test`。テストの数字は架空の「テスト用A」
 */
const test = require("node:test");
const assert = require("node:assert");
const { average, sampleStandardDeviation, calculateFutureRates } = require("../js/history_range_calc.js");

test("平均と標準偏差（n−1 で割る）が手計算どおりになる", function () {
  assert.strictEqual(average([1, 2, 3]), 2);
  assert.strictEqual(sampleStandardDeviation([1, 2, 3]), 1);
  assert.strictEqual(sampleStandardDeviation([5]), 0);
});

test("AC-26：下 ≦ 中央 ≦ 上 で、中央は幾何平均、幅は標準偏差÷√将来の年数", function () {
  const returns = [10, -10, 20, 0, 5];
  const rates = calculateFutureRates(returns, 0, 4);
  assert.ok(rates.low <= rates.mid && rates.mid <= rates.high);
  const expectedMid = Math.pow(1.1 * 0.9 * 1.2 * 1.0 * 1.05, 1 / 5) - 1;
  assert.ok(Math.abs(rates.mid - expectedMid) < 1e-12);
  const spread = sampleStandardDeviation([0.1, -0.1, 0.2, 0, 0.05]) / 2;
  assert.ok(Math.abs(rates.high - rates.mid - spread) < 1e-12);
});

test("将来の年数が長いほど幅は狭くなる", function () {
  const returns = [10, -10, 20, 0, 5];
  const shortRange = calculateFutureRates(returns, 0, 1);
  const longRange = calculateFutureRates(returns, 0, 25);
  assert.ok(longRange.high - longRange.low < shortRange.high - shortRange.low);
});

test("AC-27：全部の年度が同じ収益率なら下・中央・上が同じで、何度やっても同じ結果", function () {
  const first = calculateFutureRates([7, 7, 7, 7], 0, 10);
  const second = calculateFutureRates([7, 7, 7, 7], 0, 10);
  assert.strictEqual(first.low, first.mid);
  assert.strictEqual(first.mid, first.high);
  assert.deepStrictEqual(first, second);
});

test("信託報酬などは収益率から引かれ、下は−99%より小さくならない", function () {
  const noFee = calculateFutureRates([10, 10, 10], 0, 5);
  const withFee = calculateFutureRates([10, 10, 10], 1, 5);
  assert.ok(withFee.mid < noFee.mid);
  const extreme = calculateFutureRates([-90, 200, -95, 300], 0, 1);
  assert.ok(extreme.low >= -0.99);
});
