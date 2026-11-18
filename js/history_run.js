/*
 * history_run.js：「過去の実績で計算する」の計算をひとつにまとめる（画面には触れない）
 * 主な関数：runHistory（実績の部分→将来の幅→税金の順に計算して、画面が使う結果を返す）
 * history_data.js・history_calc.js・history_range_calc.js・tax_calc.js の部品を組み合わせる。history_view.js から使われる。
 * tests/history_run.test.js でテストする。
 * ブラウザでは普通の <script>（部品は読み込み済みの関数をそのまま使う）、Node.js（テスト）では require で部品を読み込む。
 */

/**
 * 計算の部品（ほかのファイルの関数）をまとめて取り出す。
 * ブラウザでは <script> で先に読み込んだ関数がそのまま使えるが、Node.js（テスト）ではファイルごとに
 * 中身が分かれていて自動では見えないため、require（別のファイルを読み込む命令）で読む必要がある。
 * @returns {Object} 部品の関数をまとめたもの
 */
function loadHistoryParts() {
  if (typeof module !== "undefined" && module.exports) {
    return Object.assign(
      {},
      require("./history_data.js"),
      require("./history_calc.js"),
      require("./history_range_calc.js"),
      require("./tax_calc.js")
    );
  }
  return {
    getYearList: getYearList,
    checkPeriod: checkPeriod,
    growOneYear: growOneYear,
    calculateHistoryPast: calculateHistoryPast,
    calculateFutureRates: calculateFutureRates,
    calculateTax: calculateTax,
  };
}

const historyParts = loadHistoryParts();

// 1年＝12か月（history_calc.js の HISTORY_MONTHS_PER_YEAR と同じ。ブラウザでは同じ名前の const を2回書けないため別名）
const RUN_MONTHS_PER_YEAR = 12;

/**
 * 実績の部分で積み上げた残高を引き継いで、将来の年数ぶん、決まった年利回りで積み上げる。
 * @param {number} startBalance 将来の部分の最初の残高（万円）
 * @param {number} monthlyMan 毎月の積立額（万円）
 * @param {number} annualRate 将来の年利回り（0.05 は +5%）
 * @param {number} futureYears 将来の年数
 * @returns {number} 終了年度末の残高（万円）
 */
function growFuture(startBalance, monthlyMan, annualRate, futureYears) {
  let balance = startBalance;
  for (let index = 0; index < futureYears; index++) {
    balance = historyParts.growOneYear(balance, monthlyMan, annualRate);
  }
  return balance;
}

/**
 * 将来の年数（終了年度がデータの最後の年度より後の部分）を求める。
 * @param {number} startYear 運用開始年度
 * @param {number} endYear 運用終了年度
 * @param {number} lastDataYear データの最後の年度
 * @returns {number} 将来の年数（実績だけなら0）
 */
function countFutureYears(startYear, endYear, lastDataYear) {
  if (endYear <= lastDataYear) {
    return 0;
  }
  return endYear - Math.max(startYear, lastDataYear + 1) + 1;
}

/**
 * 下・中央・上の最終額を求める。将来がなければ3つとも実績の残高と同じ（1つの数字）。
 * @param {Object} asset 資産データ
 * @param {Object} inputs 入力
 * @param {number} pastBalance 実績の部分の残高（万円）
 * @param {number} futureYears 将来の年数
 * @returns {{low:number, mid:number, high:number}} 最終額（万円）
 */
function calculateTotals(asset, inputs, pastBalance, futureYears) {
  if (futureYears === 0) {
    return { low: pastBalance, mid: pastBalance, high: pastBalance };
  }
  const returnPercents = historyParts.getYearList(asset.returns).map(function (year) {
    return asset.returns[String(year)];
  });
  const rates = historyParts.calculateFutureRates(returnPercents, inputs.feePercent, futureYears);
  return {
    low: growFuture(pastBalance, inputs.monthlyMan, rates.low, futureYears),
    mid: growFuture(pastBalance, inputs.monthlyMan, rates.mid, futureYears),
    high: growFuture(pastBalance, inputs.monthlyMan, rates.high, futureYears),
  };
}

/**
 * 課税口座のとき、下・中央・上それぞれの税金と税引き後の額を求める。NISAのときは null。
 * @param {{low:number, mid:number, high:number}} totals 最終額（万円）
 * @param {number} principal 元本（万円）
 * @param {boolean} isTaxable 課税口座か
 * @returns {Object|null} {low, mid, high}（それぞれ {tax, afterTax}）または null
 */
function calculateTaxes(totals, principal, isTaxable) {
  if (!isTaxable) {
    return null;
  }
  return {
    low: historyParts.calculateTax(totals.low, principal),
    mid: historyParts.calculateTax(totals.mid, principal),
    high: historyParts.calculateTax(totals.high, principal),
  };
}

/**
 * 「過去の実績で計算する」の結果をまとめて計算する（流れだけ：年度チェック→実績→将来の幅→税金）。
 * 終了年度がデータの最後の年度以前なら1つの数字（isRange=false・下＝中央＝上）、後なら下・中央・上の幅。
 * @param {Object} asset 資産1つ分のデータ（returns は {年度: 収益率(%)}）
 * @param {{monthlyMan:number, feePercent:number, startYear:number, endYear:number, isTaxable:boolean}} inputs 入力
 * @returns {Object} 計算できないとき {error: 案内文}。できたとき {error:"", principal, pastYears, futureYears,
 *   lastDataYear, isRange, totals:{low,mid,high}, gainMid, taxes:{low,mid,high}|null}（taxes の中身は {tax, afterTax}）
 * @example runHistory(asset, {monthlyMan:1, feePercent:0, startYear:2020, endYear:2020, isTaxable:false}).totals.mid
 */
function runHistory(asset, inputs) {
  const years = historyParts.getYearList(asset.returns);
  const lastDataYear = years[years.length - 1];
  const message = historyParts.checkPeriod(inputs.startYear, inputs.endYear, years[0]);
  if (message !== "") {
    return { error: message };
  }
  const totalYears = inputs.endYear - inputs.startYear + 1;
  const principal = inputs.monthlyMan * RUN_MONTHS_PER_YEAR * totalYears;
  const futureYears = countFutureYears(inputs.startYear, inputs.endYear, lastDataYear);
  const pastBalance = historyParts.calculateHistoryPast(
    inputs.monthlyMan, asset.returns, inputs.startYear, inputs.endYear, inputs.feePercent, lastDataYear
  );
  const totals = calculateTotals(asset, inputs, pastBalance, futureYears);
  return {
    error: "",
    principal: principal,
    pastYears: totalYears - futureYears,
    futureYears: futureYears,
    lastDataYear: lastDataYear,
    isRange: futureYears > 0,
    totals: totals,
    gainMid: totals.mid - principal,
    taxes: calculateTaxes(totals, principal, inputs.isTaxable),
  };
}

// Node.js（テスト）から require で使えるようにする。ブラウザには module がないので何もしない
if (typeof module !== "undefined" && module.exports) {
  module.exports = { runHistory };
}
