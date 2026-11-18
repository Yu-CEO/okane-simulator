/*
 * history_data.js：GPIF の運用実績データの読み出しと、形のチェック（画面には触れない）
 * 主な関数：checkHistoryData（形のチェック）、getYearList（年度の一覧）、findWorstAndBestYear（最も悪い・よい年度）
 * history_run.js・history_view.js から使われる。データ本体は data/gpif_returns.js。
 * ブラウザでは普通の <script>、Node.js（テスト）では require で読み込める形にしている。
 */

// 資産の数。仕様 7-7 で「国内株式・外国株式・国内債券・外国債券」の4つに固定されているため
const EXPECTED_ASSET_COUNT = 4;

/**
 * 資産の returns（{年度: 収益率}）から、年度を小さい順の数字の配列にする。
 * @param {Object} returnsByYear {"2001": -17.05, ...} の形のデータ
 * @returns {number[]} 年度の一覧（小さい順）
 * @example getYearList({"2002": 1, "2001": 2}) // [2001, 2002]
 */
function getYearList(returnsByYear) {
  return Object.keys(returnsByYear)
    .map(Number)
    .sort(function (a, b) {
      return a - b;
    });
}

/**
 * 1つの資産のデータが正しい形かを調べ、問題があれば日本語で返す。
 * 年度が連続していること・収益率が数字であること・出典3項目が空でないことを見る。
 * @param {Object} asset 資産1つ分のデータ
 * @returns {string[]} 問題の一覧（問題がなければ空の配列）
 */
function checkAsset(asset) {
  const problems = [];
  let name = "名前なしの資産";
  if (asset && asset.name) {
    name = asset.name;
  }
  if (!asset || !asset.id || !asset.name || !asset.returns) {
    return [name + "：id・name・returns のどれかがありません。"];
  }
  const years = getYearList(asset.returns);
  years.forEach(function (year, index) {
    if (index > 0 && year !== years[index - 1] + 1) {
      problems.push(name + "：" + year + "年度の前の年度が抜けています。");
    }
    const value = asset.returns[String(year)];
    if (typeof value !== "number" || !Number.isFinite(value)) {
      problems.push(name + "：" + year + "年度の収益率が数字ではありません。");
    }
  });
  const source = asset.source || {};
  ["title", "url", "checked"].forEach(function (key) {
    if (!source[key]) {
      problems.push(name + "：出典の " + key + " が空です。");
    }
  });
  return problems;
}

/**
 * データ全体の形を調べる。読み込めなかったとき・形が崩れているときは、画面側が「データを読めない」表示にする。
 * @param {Object} data GPIF_RETURNS と同じ形のデータ
 * @returns {{ok:boolean, problems:string[]}} ok が true なら使える
 * @example checkHistoryData(undefined).ok // false
 */
function checkHistoryData(data) {
  if (!data || !Array.isArray(data.assets)) {
    return { ok: false, problems: ["データを読み込めませんでした。"] };
  }
  const problems = [];
  if (data.assets.length !== EXPECTED_ASSET_COUNT) {
    problems.push("資産の数が " + EXPECTED_ASSET_COUNT + " ではありません。");
  }
  if (!data.fiscal_year_note) {
    problems.push("fiscal_year_note が空です。");
  }
  if (!data.terms_checked) {
    problems.push("terms_checked が空です。");
  }
  data.assets.forEach(function (asset) {
    checkAsset(asset).forEach(function (problem) {
      problems.push(problem);
    });
  });
  return { ok: problems.length === 0, problems: problems };
}

/**
 * データ全体の中で、収益率がいちばん低かった年度と高かった年度を探す（信託報酬などを引く前の数字）。
 * 4資産とも同じ見た目で出すための材料で、良し悪しの判断は付けない。
 * @param {Object} returnsByYear {年度: 収益率}
 * @returns {{worst:{year:number, value:number}, best:{year:number, value:number}}}
 * @example findWorstAndBestYear({"2001": -5, "2002": 10}).best.year // 2002
 */
function findWorstAndBestYear(returnsByYear) {
  const years = getYearList(returnsByYear);
  let worstYear = years[0];
  let bestYear = years[0];
  years.forEach(function (year) {
    if (returnsByYear[String(year)] < returnsByYear[String(worstYear)]) {
      worstYear = year;
    }
    if (returnsByYear[String(year)] > returnsByYear[String(bestYear)]) {
      bestYear = year;
    }
  });
  return {
    worst: { year: worstYear, value: returnsByYear[String(worstYear)] },
    best: { year: bestYear, value: returnsByYear[String(bestYear)] },
  };
}

// Node.js（テスト）から require で使えるようにする。ブラウザには module がないので何もしない
if (typeof module !== "undefined" && module.exports) {
  module.exports = { getYearList, checkAsset, checkHistoryData, findWorstAndBestYear };
}
