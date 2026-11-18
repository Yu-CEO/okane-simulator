/*
 * history_data.test.js：js/history_data.js（データの読み出し・形のチェック）と、本番データ data/gpif_returns.js の形のテスト
 * 実行方法：simulator フォルダで `node --test`
 * 計算のテストは架空の「テスト用A」を使う。本番データは「形」だけを調べる（数字そのものは QA が GPIF の資料と照合する）。
 */
const test = require("node:test");
const assert = require("node:assert");
const { getYearList, checkHistoryData, findWorstAndBestYear } = require("../js/history_data.js");
const { GPIF_RETURNS } = require("../data/gpif_returns.js");
const { makeFlatAsset, makeVaryingAsset } = require("./fixture_test_asset.js");

// 本番データの最初の年度（仕様 7-7：2001年度から連続）
const FIRST_YEAR = 2001;
// 仕様 7-7 の資産の順（固定）
const EXPECTED_ASSET_NAMES = [
  "国内株式（年金の運用実績）",
  "外国株式（年金の運用実績）",
  "国内債券（年金の運用実績）",
  "外国債券（年金の運用実績）",
];

/**
 * テスト用に、4つの架空の資産を持つデータ全体をつくる。
 * @returns {Object} GPIF_RETURNS と同じ形のデータ
 */
function makeFakeData() {
  const assets = [1, 2, 3, 4].map(function (number) {
    const asset = makeFlatAsset(number, 2020, 3);
    asset.id = "test_" + number;
    asset.name = "テスト用" + number + "（仮データ）";
    return asset;
  });
  return { fiscal_year_note: "年度は4月〜翌年3月です。", terms_checked: "2000-01-01", assets: assets };
}

test("年度の一覧は小さい順の数字になる", function () {
  assert.deepStrictEqual(getYearList({ "2002": 1, "2001": 2, "2003": 3 }), [2001, 2002, 2003]);
});

test("形が正しい仮データは ok、読み込めていないデータ（undefined）は ok ではない", function () {
  assert.strictEqual(checkHistoryData(makeFakeData()).ok, true);
  assert.strictEqual(checkHistoryData(undefined).ok, false);
  assert.strictEqual(checkHistoryData({}).ok, false);
});

test("年度が飛んでいる・数字でない・出典が空のデータは問題として見つかる", function () {
  const brokenYear = makeFakeData();
  delete brokenYear.assets[0].returns["2021"];
  assert.strictEqual(checkHistoryData(brokenYear).ok, false);

  const notNumber = makeFakeData();
  notNumber.assets[1].returns["2021"] = "abc";
  assert.strictEqual(checkHistoryData(notNumber).ok, false);

  const noSource = makeFakeData();
  noSource.assets[2].source.url = "";
  assert.strictEqual(checkHistoryData(noSource).ok, false);

  const noTerms = makeFakeData();
  noTerms.terms_checked = "";
  assert.strictEqual(checkHistoryData(noTerms).ok, false);
});

test("最も悪かった年度・最もよかった年度を探せる", function () {
  const result = findWorstAndBestYear(makeVaryingAsset().returns);
  assert.strictEqual(result.worst.year, 2021);
  assert.strictEqual(result.worst.value, -10);
  assert.strictEqual(result.best.year, 2022);
  assert.strictEqual(result.best.value, 20);
});

test("AC-31：本番データは全資産で2001年度から年度が連続し、収益率が数字で、出典3項目と terms_checked が空でない", function () {
  assert.strictEqual(checkHistoryData(GPIF_RETURNS).ok, true, checkHistoryData(GPIF_RETURNS).problems.join(" / "));
  assert.ok(GPIF_RETURNS.terms_checked);
  GPIF_RETURNS.assets.forEach(function (asset) {
    const years = getYearList(asset.returns);
    assert.strictEqual(years[0], FIRST_YEAR, asset.name);
    assert.ok(years.length >= 25, asset.name + " は2025年度まで入っている");
    assert.ok(asset.source.title && asset.source.url && asset.source.checked, asset.name);
  });
});

test("AC-37：資産は国内株式・外国株式・国内債券・外国債券の順で、4資産とも同じ年度がそろっている", function () {
  const names = GPIF_RETURNS.assets.map(function (asset) {
    return asset.name;
  });
  assert.deepStrictEqual(names, EXPECTED_ASSET_NAMES);
  const firstYears = getYearList(GPIF_RETURNS.assets[0].returns);
  GPIF_RETURNS.assets.forEach(function (asset) {
    assert.deepStrictEqual(getYearList(asset.returns), firstYears);
  });
});
