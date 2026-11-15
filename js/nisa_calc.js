/*
 * nisa_calc.js：NISA積立の計算と、注意文を出す条件の判定（画面には触れない）
 * 主な関数：calculateNisa（最終金額・元本・増えた分）、getNisaWarnings（注意文の一覧）
 * nisa_view.js から使われる。tests/nisa_calc.test.js でテストする。
 * ブラウザでは普通の <script> で、Node.js では require で読み込める形にしている。
 */

const MONTHS_PER_YEAR = 12;
const PERCENT = 100;
// つみたて投資枠の年間の上限（万円）。これを超える積立額のとき注意を出す
const TSUMITATE_ANNUAL_LIMIT_MAN = 120;
// NISAの生涯の非課税枠（万円・元本ベース）。これを超える元本のとき注意を出す
const LIFETIME_LIMIT_MAN = 1800;

const WARNING_ANNUAL_LIMIT =
  "つみたて投資枠の上限は年120万円（月10万円）です。成長投資枠と合わせると年360万円までです。";
const WARNING_LIFETIME_LIMIT =
  "NISAの生涯の非課税枠は1,800万円（元本ベース）です。超えた分は課税口座になります。";

/**
 * 毎月末に積み立て、月ごとに複利（増えた分にもさらに利回りがつく増え方）で増える想定で、最終的な金額を計算する。
 * @param {number} monthlyMan 毎月の積立額（万円）
 * @param {number} years 積み立てる年数
 * @param {number} annualRatePercent 想定の利回り（年・%）
 * @returns {{total:number, principal:number, gain:number}} 最終的な金額・元本・増えた分（万円）
 * @example calculateNisa(3, 20, 0) // { total: 720, principal: 720, gain: 0 }
 */
function calculateNisa(monthlyMan, years, annualRatePercent) {
  const monthlyRate = annualRatePercent / PERCENT / MONTHS_PER_YEAR;
  const months = years * MONTHS_PER_YEAR;
  const principal = monthlyMan * months;

  let total;
  if (monthlyRate === 0) {
    // 利回り0%のときは下の式が0で割ることになるため、元本そのままにする
    total = principal;
  } else {
    total = monthlyMan * ((Math.pow(1 + monthlyRate, months) - 1) / monthlyRate);
  }

  return { total: total, principal: principal, gain: total - principal };
}

/**
 * 入力がNISAの上限を超えているときに出す注意文を集める。
 * @param {number} monthlyMan 毎月の積立額（万円）
 * @param {number} principalMan 積み立てた元本（万円）
 * @returns {string[]} 注意文の一覧（当てはまらなければ空の配列）
 * @example getNisaWarnings(11, 2640).length // 2
 */
function getNisaWarnings(monthlyMan, principalMan) {
  const warnings = [];
  if (monthlyMan * MONTHS_PER_YEAR > TSUMITATE_ANNUAL_LIMIT_MAN) {
    warnings.push(WARNING_ANNUAL_LIMIT);
  }
  if (principalMan > LIFETIME_LIMIT_MAN) {
    warnings.push(WARNING_LIFETIME_LIMIT);
  }
  return warnings;
}

// Node.js（テスト）から require で使えるようにする。ブラウザには module がないので何もしない
if (typeof module !== "undefined" && module.exports) {
  module.exports = { calculateNisa, getNisaWarnings, WARNING_ANNUAL_LIMIT, WARNING_LIFETIME_LIMIT };
}
