/*
 * history_range_calc.js：将来の部分の「幅」（下・中央・上）に使う年利回りの計算（画面には触れない）
 * 主な関数：calculateFutureRates（幾何平均と、標準偏差÷√将来の年数で、下・中央・上の年利回りを作る）
 * history_run.js から使われる。tests/history_range_calc.test.js でテストする。
 * 乱数は使わない（同じ入力なら必ず同じ結果にするため）。
 * ブラウザでは普通の <script>、Node.js（テスト）では require で読み込める形にしている。
 */

const RANGE_PERCENT = 100;
// 1年の増え方（1＋収益率）がこれより小さくならないようにする。対数が計算できなくなるのを防ぐため
const RANGE_MIN_GROWTH_FACTOR = 0.01;
// 下の年利回りの下限（−99%）。−100%以下だと残高の計算が成り立たないため
const MIN_LOW_RATE = -0.99;

/**
 * 数字の配列の平均を返す。
 * @param {number[]} values 数字の配列
 * @returns {number} 平均
 */
function average(values) {
  let sum = 0;
  values.forEach(function (value) {
    sum += value;
  });
  return sum / values.length;
}

/**
 * 標準偏差（数字のばらつきの大きさ）を、標本の形（n−1 で割る）で返す。
 * 過去の実績は「ありえる年」の一部を見ているだけなので、n−1 で割る一般的な形にしている。
 * @param {number[]} values 数字の配列
 * @returns {number} 標準偏差。数字が1つ以下のときは0
 */
function sampleStandardDeviation(values) {
  if (values.length < 2) {
    return 0;
  }
  const mean = average(values);
  let squareSum = 0;
  values.forEach(function (value) {
    squareSum += (value - mean) * (value - mean);
  });
  return Math.sqrt(squareSum / (values.length - 1));
}

/**
 * 過去の年度ごとの収益率から、将来の下・中央・上の年利回りを作る。
 * 中央＝幾何平均（年平均の伸び率）／下・上＝中央 −／＋ 標準偏差÷√将来の年数
 * （年数が長いほど、年平均のばらつきは小さくなるという一般的な考え方）。
 * @param {number[]} returnPercents 過去の年度ごとの収益率（%）
 * @param {number} feePercent 信託報酬など（年・%）。収益率から引く
 * @param {number} futureYears 将来の年数（1以上）
 * @returns {{low:number, mid:number, high:number}} 年利回り（0.05 は +5%）
 * @example calculateFutureRates([10, 10, 10], 0, 5) // { low: 0.1, mid: 0.1, high: 0.1 }（ほぼ）
 */
function calculateFutureRates(returnPercents, feePercent, futureYears) {
  const netReturns = returnPercents.map(function (percent) {
    return (percent - feePercent) / RANGE_PERCENT;
  });
  const logs = netReturns.map(function (annualReturn) {
    return Math.log(Math.max(1 + annualReturn, RANGE_MIN_GROWTH_FACTOR));
  });
  const middle = Math.exp(average(logs)) - 1;
  const spread = sampleStandardDeviation(netReturns) / Math.sqrt(futureYears);
  return {
    low: Math.max(middle - spread, MIN_LOW_RATE),
    mid: middle,
    high: middle + spread,
  };
}

// Node.js（テスト）から require で使えるようにする。ブラウザには module がないので何もしない
if (typeof module !== "undefined" && module.exports) {
  module.exports = { average, sampleStandardDeviation, calculateFutureRates };
}
