/*
 * history_run.test.js：js/history_run.js（実績→将来の幅→税金をまとめた計算）の自動テスト
 * 実行方法：simulator フォルダで `node --test`。テストの数字は架空の「テスト用A」（2020年度から）
 */
const test = require("node:test");
const assert = require("node:assert");
const { runHistory } = require("../js/history_run.js");
const { formatMan } = require("../js/format.js");
const { makeFlatAsset, makeVaryingAsset } = require("./fixture_test_asset.js");

/**
 * テスト用の入力（毎月1万円・信託報酬0・2020〜2020年度・NISA）に、必要なところだけ上書きする。
 * @param {Object} overrides 上書きする項目
 * @returns {Object} 入力
 */
function makeInputs(overrides) {
  return Object.assign(
    { monthlyMan: 1, feePercent: 0, startYear: 2020, endYear: 2020, isTaxable: false },
    overrides
  );
}

test("AC-22：+10%・毎月1万円・2020〜2020・NISA＝元本12万円・最終額12.5万円・増えた額0.5万円・幅なし", function () {
  const result = runHistory(makeFlatAsset(10, 2020, 1), makeInputs({}));
  assert.strictEqual(formatMan(result.principal), "12万円");
  assert.strictEqual(formatMan(result.totals.mid), "12.5万円");
  assert.strictEqual(formatMan(result.gainMid), "0.5万円");
  assert.strictEqual(result.isRange, false);
  assert.strictEqual(result.taxes, null);
});

test("AC-23：収益率0%なら最終額12万円・増えた額0万円", function () {
  const result = runHistory(makeFlatAsset(0, 2020, 1), makeInputs({}));
  assert.strictEqual(formatMan(result.totals.mid), "12万円");
  assert.strictEqual(formatMan(result.gainMid), "0万円");
});

test("AC-24：信託報酬など1%で最終額が小さくなり、0に戻すと元の結果に戻る", function () {
  const asset = makeFlatAsset(10, 2020, 1);
  const base = runHistory(asset, makeInputs({}));
  const withFee = runHistory(asset, makeInputs({ feePercent: 1 }));
  assert.ok(withFee.totals.mid < base.totals.mid);
  assert.strictEqual(runHistory(asset, makeInputs({ feePercent: 0 })).totals.mid, base.totals.mid);
});

test("AC-25：課税口座にすると税金約0.1万円・税引き後12.4万円。NISAに戻すと税金なし", function () {
  const asset = makeFlatAsset(10, 2020, 1);
  const taxable = runHistory(asset, makeInputs({ isTaxable: true }));
  assert.strictEqual(formatMan(taxable.taxes.mid.tax), "0.1万円");
  assert.strictEqual(formatMan(taxable.taxes.mid.afterTax), "12.4万円");
  assert.strictEqual(runHistory(asset, makeInputs({ isTaxable: false })).taxes, null);
});

test("AC-26：終了年度がデータの最後の年度より後なら幅（下 ≦ 中央 ≦ 上）になる", function () {
  const result = runHistory(makeVaryingAsset(), makeInputs({ startYear: 2022, endYear: 2034 }));
  assert.strictEqual(result.isRange, true);
  assert.strictEqual(result.pastYears, 3);
  assert.strictEqual(result.futureYears, 10);
  assert.ok(result.totals.low <= result.totals.mid && result.totals.mid <= result.totals.high);
  assert.ok(result.totals.low < result.totals.high);
});

test("AC-27：全部の年度の収益率が同じなら下・中央・上が同じ金額。同じ入力なら何度でも同じ結果", function () {
  const asset = makeFlatAsset(5, 2020, 5);
  const first = runHistory(asset, makeInputs({ startYear: 2022, endYear: 2040 }));
  const second = runHistory(asset, makeInputs({ startYear: 2022, endYear: 2040 }));
  assert.strictEqual(first.totals.low, first.totals.mid);
  assert.strictEqual(first.totals.mid, first.totals.high);
  assert.deepStrictEqual(first, second);
});

test("開始年度がデータより後（これから始める）でも幅が出て、元本は年数×12か月ぶん", function () {
  const result = runHistory(makeVaryingAsset(), makeInputs({ startYear: 2030, endYear: 2049 }));
  assert.strictEqual(result.pastYears, 0);
  assert.strictEqual(result.futureYears, 20);
  assert.strictEqual(result.principal, 240);
});

test("AC-28：開始年度が最初の年度より前・終了年度が開始年度より前は、計算せず案内文（NaNなし）", function () {
  const asset = makeVaryingAsset();
  const message = "運用開始年度は2020年度以降、終了年度は開始年度以降にしてください。";
  assert.strictEqual(runHistory(asset, makeInputs({ startYear: 2019, endYear: 2025 })).error, message);
  assert.strictEqual(runHistory(asset, makeInputs({ startYear: 2030, endYear: 2025 })).error, message);
});

test("積立額0なら結果は0万円（NaNにならない）", function () {
  const result = runHistory(makeVaryingAsset(), makeInputs({ monthlyMan: 0, startYear: 2030, endYear: 2040 }));
  assert.strictEqual(formatMan(result.totals.mid), "0万円");
});
