/*
 * history_calc.js：過去の実績（年度ごとの収益率）で積み立てたときの計算（画面には触れない）
 * 主な関数：growOneYear（1年度ぶん積み上げ）、calculateHistoryPast（実績の年度を順に積み上げ）、checkPeriod（年度の入力チェック）、
 *   crossesClassificationChange（期間が2020年度の分け方の変更をまたぐか）、needsClassificationNote（分け方の変更の注意書きを出すか）
 * history_run.js・history_view.js から使われる。tests/history_calc.test.js でテストする。
 * ブラウザでは普通の <script>、Node.js（テスト）では require で読み込める形にしている。
 */

const HISTORY_MONTHS_PER_YEAR = 12;
const HISTORY_PERCENT = 100;
// 1年の増え方（1＋収益率）がこれより小さくならないようにする。収益率が−100%以下だと累乗が計算できず NaN になるため
const MIN_GROWTH_FACTOR = 0.01;

// GPIF が資産の分け方を変えた年度（為替ヘッジ付き外国債券を、外国債券から国内債券に移した）。この年度をまたぐ計算に注意を出す
const CLASSIFICATION_CHANGE_YEAR = 2020;
const CLASSIFICATION_CHANGE_NOTE =
  "2020年度から、GPIF の資産の分け方が変わっています（為替ヘッジ付きの外国債券を、外国債券から国内債券に移しました）。そのため、2019年度以前と2020年度以後では、同じ資産名でも中身が少し違います。";

/**
 * 計算期間が、資産の分け方が変わった年度（2020年度）をまたぐかを調べる。
 * @param {number} startYear 運用開始年度
 * @param {number} endYear 運用終了年度
 * @returns {boolean} 開始が2019年度以前で、終了が2020年度以後なら true
 * @example crossesClassificationChange(2018, 2022) // true
 */
function crossesClassificationChange(startYear, endYear) {
  return startYear < CLASSIFICATION_CHANGE_YEAR && endYear >= CLASSIFICATION_CHANGE_YEAR;
}

// 分け方の変更の影響を受ける資産（国内債券・外国債券）の id。株式では注意を出さない
const CLASSIFICATION_CHANGE_ASSET_IDS = ["dbond", "fbond"];

/**
 * 分け方が変わった注意書きを出すべきかを調べる（債券を選んでいて、期間が2020年度をまたぐとき）。
 * @param {string} assetId 選んでいる資産の id
 * @param {number} startYear 運用開始年度
 * @param {number} endYear 運用終了年度
 * @returns {boolean} 出すなら true
 * @example needsClassificationNote("fbond", 2018, 2022) // true
 */
function needsClassificationNote(assetId, startYear, endYear) {
  return CLASSIFICATION_CHANGE_ASSET_IDS.includes(assetId) && crossesClassificationChange(startYear, endYear);
}

/**
 * 年度の入力が計算できる範囲かを調べる。
 * @param {number} startYear 運用開始年度
 * @param {number} endYear 運用終了年度
 * @param {number} firstDataYear データの最初の年度（2001）
 * @returns {string} 問題がなければ空文字、あればその案内文
 * @example checkPeriod(2000, 2010, 2001) // "運用開始年度は2001年度以降、終了年度は開始年度以降にしてください。"
 */
function checkPeriod(startYear, endYear, firstDataYear) {
  const isNumber = Number.isFinite(startYear) && Number.isFinite(endYear);
  if (!isNumber || startYear < firstDataYear || endYear < startYear) {
    return "運用開始年度は" + firstDataYear + "年度以降、終了年度は開始年度以降にしてください。";
  }
  return "";
}

/**
 * 1年度（12か月）ぶん、毎月末に積み立てながら複利で積み上げる。
 * 年の収益率を12か月に均等に割り振る：月の利回り＝(1＋年の収益率)^(1/12)−1
 * @param {number} startBalance 年度の初めの残高（万円）
 * @param {number} monthlyMan 毎月の積立額（万円）
 * @param {number} annualReturn その年度の収益率（0.1 は +10%。信託報酬などを引いた後）
 * @returns {number} 年度末の残高（万円）
 * @example growOneYear(0, 1, 0) // 12
 */
function growOneYear(startBalance, monthlyMan, annualReturn) {
  const growthFactor = Math.max(1 + annualReturn, MIN_GROWTH_FACTOR);
  const monthlyRate = Math.pow(growthFactor, 1 / HISTORY_MONTHS_PER_YEAR) - 1;
  let balance = startBalance;
  for (let month = 0; month < HISTORY_MONTHS_PER_YEAR; month++) {
    balance = balance * (1 + monthlyRate) + monthlyMan;
  }
  return balance;
}

/**
 * ある年度の実績の収益率から、利用者が入れた信託報酬など（年・%）を引く。
 * @param {number} returnPercent データの収益率（%）
 * @param {number} feePercent 信託報酬など（年・%）
 * @returns {number} 引いた後の収益率（0.1 は +10%）
 * @example netReturn(10, 1) // 0.09
 */
function netReturn(returnPercent, feePercent) {
  return (returnPercent - feePercent) / HISTORY_PERCENT;
}

/**
 * データにある年度（実績）を、開始年度から順に積み上げる。データの最後の年度より後は計算しない。
 * @param {number} monthlyMan 毎月の積立額（万円）
 * @param {Object} returnsByYear {年度: 収益率(%)}
 * @param {number} startYear 運用開始年度
 * @param {number} endYear 運用終了年度
 * @param {number} feePercent 信託報酬など（年・%）
 * @param {number} lastDataYear データの最後の年度
 * @returns {number} 実績の最後の年度（または終了年度）末の残高（万円）。実績の年度がなければ0
 * @example calculateHistoryPast(1, {"2020": 10}, 2020, 2020, 0, 2020) // 約12.5
 */
function calculateHistoryPast(monthlyMan, returnsByYear, startYear, endYear, feePercent, lastDataYear) {
  let balance = 0;
  const lastPastYear = Math.min(endYear, lastDataYear);
  for (let year = startYear; year <= lastPastYear; year++) {
    const annualReturn = netReturn(returnsByYear[String(year)], feePercent);
    balance = growOneYear(balance, monthlyMan, annualReturn);
  }
  return balance;
}

// Node.js（テスト）から require で使えるようにする。ブラウザには module がないので何もしない
if (typeof module !== "undefined" && module.exports) {
  module.exports = { needsClassificationNote, CLASSIFICATION_CHANGE_NOTE, crossesClassificationChange, checkPeriod, growOneYear, netReturn, calculateHistoryPast };
}
