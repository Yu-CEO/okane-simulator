/*
 * period_choice.test.js：js/period_choice.js（期間の決め方）の自動テスト（AC-47）
 * 実行方法：simulator フォルダで `node --test`。テストの数字は架空のデータ（最初の年度2001・最後の年度2025）
 */
const test = require("node:test");
const assert = require("node:assert");
const { calculatePeriodFromChoice, formatPeriodSummary } = require("../js/period_choice.js");

const BASE = { firstYear: 2001, lastYear: 2025, maxYear: 2075 };

test("AC-47：「これから」20年＝最後の年度＋1 から＋20 まで", function () {
  const period = calculatePeriodFromChoice(Object.assign({ periodMode: "future", years: 20 }, BASE));
  assert.deepStrictEqual(period, { startYear: 2026, endYear: 2045, clipped: false });
});

test("AC-47：「これから」は2075年度で止まる", function () {
  const period = calculatePeriodFromChoice(Object.assign({ periodMode: "future", years: 60 }, BASE));
  assert.strictEqual(period.endYear, 2075);
});

test("AC-47：「過去の実際の期間」20年＝最後の年度までさかのぼる", function () {
  const period = calculatePeriodFromChoice(Object.assign({ periodMode: "past", years: 20 }, BASE));
  assert.deepStrictEqual(period, { startYear: 2006, endYear: 2025, clipped: false });
});

test("AC-47：「過去」でデータが足りないときは最初の年度から（clipped）", function () {
  const period = calculatePeriodFromChoice(Object.assign({ periodMode: "past", years: 30 }, BASE));
  assert.deepStrictEqual(period, { startYear: 2001, endYear: 2025, clipped: true });
});

test("年数が0や空のときは1年として扱う", function () {
  const period = calculatePeriodFromChoice(Object.assign({ periodMode: "future", years: 0 }, BASE));
  assert.strictEqual(period.startYear, period.endYear);
});

test("AC-47：「計算する期間」の文と、足りないときの補足", function () {
  const summary = formatPeriodSummary(2001, 2025, true, 2001);
  assert.strictEqual(summary.main, "計算する期間：2001〜2025年度（25年）");
  assert.strictEqual(summary.note, "データが2001年度からのため、25年で計算しています。");
  assert.strictEqual(formatPeriodSummary(2026, 2045, false, 2001).note, "");
});

test("年度がおかしいときは「計算する期間」を出さない", function () {
  assert.deepStrictEqual(formatPeriodSummary(2030, 2020, false, 2001), { main: "", note: "" });
});
