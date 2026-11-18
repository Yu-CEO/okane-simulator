/*
 * fixture_test_asset.js：テスト専用の架空データ「テスト用A」（本物の運用実績ではない）
 * 各テストファイルから require で読み込む。データの最初の年度は 2020（仕様 7-10 の取り決め）。
 * ファイル名は .test.js で終わらないので、node --test の対象にはならない。
 */

/**
 * 全部の年度が同じ収益率（%）の架空の資産をつくる。
 * @param {number} percent 毎年度の収益率（%）
 * @param {number} firstYear 最初の年度
 * @param {number} count 年度の数
 * @returns {Object} 資産1つ分のデータ
 * @example makeFlatAsset(10, 2020, 1).returns["2020"] // 10
 */
function makeFlatAsset(percent, firstYear, count) {
  const returns = {};
  for (let index = 0; index < count; index++) {
    returns[String(firstYear + index)] = percent;
  }
  return {
    id: "test_a",
    name: "テスト用A（仮データ）",
    returns: returns,
    source: { title: "テスト用の資料名", url: "https://example.com/", checked: "2000-01-01" },
  };
}

/**
 * 年度ごとに収益率が違う架空の資産（2020〜2024年度）をつくる。幅の計算のテストに使う。
 * @returns {Object} 資産1つ分のデータ
 */
function makeVaryingAsset() {
  return {
    id: "test_a",
    name: "テスト用A（仮データ）",
    returns: { "2020": 10, "2021": -10, "2022": 20, "2023": 0, "2024": 5 },
    source: { title: "テスト用の資料名", url: "https://example.com/", checked: "2000-01-01" },
  };
}

module.exports = { makeFlatAsset, makeVaryingAsset };
