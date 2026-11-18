/*
 * history_calc.test.js：js/history_calc.js（過去の実績での積立計算）の自動テスト
 * 実行方法：simulator フォルダで `node --test`。テストの数字は架空の「テスト用A」（2020年度から）
 */
const test = require("node:test");
const assert = require("node:assert");
const { needsClassificationNote, CLASSIFICATION_CHANGE_NOTE, crossesClassificationChange, checkPeriod, growOneYear, netReturn, calculateHistoryPast } = require("../js/history_calc.js");
const { formatMan } = require("../js/format.js");
const { makeFlatAsset } = require("./fixture_test_asset.js");

test("AC-22：収益率+10%・毎月1万円・1年度＝元本12万円・最終額12.5万円（増えた額0.5万円）", function () {
  const asset = makeFlatAsset(10, 2020, 1);
  const total = calculateHistoryPast(1, asset.returns, 2020, 2020, 0, 2020);
  assert.strictEqual(formatMan(total), "12.5万円");
  assert.strictEqual(formatMan(total - 12), "0.5万円");
});

test("AC-23：収益率0%の年度は最終額12万円・増えた額0万円", function () {
  const asset = makeFlatAsset(0, 2020, 1);
  const total = calculateHistoryPast(1, asset.returns, 2020, 2020, 0, 2020);
  assert.strictEqual(formatMan(total), "12万円");
  assert.strictEqual(formatMan(total - 12), "0万円");
});

test("AC-24：信託報酬など1%を引くと最終額が小さくなり、0に戻すと元の結果に戻る", function () {
  const asset = makeFlatAsset(10, 2020, 1);
  const withoutFee = calculateHistoryPast(1, asset.returns, 2020, 2020, 0, 2020);
  const withFee = calculateHistoryPast(1, asset.returns, 2020, 2020, 1, 2020);
  assert.ok(withFee < withoutFee);
  assert.strictEqual(netReturn(10, 1), 0.09);
  assert.strictEqual(calculateHistoryPast(1, asset.returns, 2020, 2020, 0, 2020), withoutFee);
});

test("実績の年度は順に積み上がり、データの最後の年度より後は計算しない", function () {
  const asset = makeFlatAsset(0, 2020, 2);
  // 2年度・利回り0%・毎月1万円＝24万円。終了年度が2030でも実績の部分は2021年度までの24万円
  assert.strictEqual(calculateHistoryPast(1, asset.returns, 2020, 2030, 0, 2021), 24);
  // 開始年度がデータの後ろなら実績の部分は0
  assert.strictEqual(calculateHistoryPast(1, asset.returns, 2022, 2030, 0, 2021), 0);
});

test("収益率が−100%以下でも NaN にならない", function () {
  const result = growOneYear(10, 1, -1.5);
  assert.ok(Number.isFinite(result));
});

test("AC-28：開始年度がデータの最初の年度より前・終了年度が開始年度より前は案内文を返す", function () {
  const message = "運用開始年度は2020年度以降、終了年度は開始年度以降にしてください。";
  assert.strictEqual(checkPeriod(2019, 2030, 2020), message);
  assert.strictEqual(checkPeriod(2025, 2024, 2020), message);
  assert.strictEqual(checkPeriod(NaN, 2024, 2020), message);
  assert.strictEqual(checkPeriod(2020, 2020, 2020), "");
});

test("2020年度をまたぐ期間（開始≦2019かつ終了≧2020）だけ、資産の分け方が変わった注意が必要", function () {
  assert.strictEqual(crossesClassificationChange(2019, 2020), true);
  assert.strictEqual(crossesClassificationChange(2001, 2045), true);
  assert.strictEqual(crossesClassificationChange(2010, 2019), false);
  assert.strictEqual(crossesClassificationChange(2020, 2030), false);
  assert.strictEqual(crossesClassificationChange(2026, 2045), false);
  assert.ok(CLASSIFICATION_CHANGE_NOTE.startsWith("2020年度から、GPIF の資産の分け方が変わっています"));
});

test("分け方の注意は国内債券・外国債券で2020年度をまたぐときだけ出し、株式では出さない", function () {
  assert.strictEqual(needsClassificationNote("dbond", 2018, 2022), true);
  assert.strictEqual(needsClassificationNote("fbond", 2001, 2045), true);
  assert.strictEqual(needsClassificationNote("dstock", 2018, 2022), false);
  assert.strictEqual(needsClassificationNote("fstock", 2001, 2045), false);
  assert.strictEqual(needsClassificationNote("fbond", 2020, 2030), false);
});
