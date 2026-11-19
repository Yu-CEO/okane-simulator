/*
 * period_choice.js：「何年つづける？」＋「これから／過去の実際の期間」から、開始・終了年度を決める（画面には触れない）
 * 主な関数：calculatePeriodFromChoice（年度を決める）、formatPeriodSummary（「計算する期間」の文を作る）
 * history_view.js から使われる。tests/period_choice.test.js でテストする。
 */

// 期間の選び方の名前。future＝これから、past＝過去の実際の期間、custom＝「細かく選ぶ」で選んだ年度
const PERIOD_FUTURE = "future";
const PERIOD_PAST = "past";
const PERIOD_CUSTOM = "custom";

/**
 * 年数と期間の選び方から、開始年度・終了年度を決める。
 * 「これから」＝開始は最後の年度＋1、「過去」＝終了は最後の年度で、開始は年数ぶんさかのぼる。
 * 過去で最初の年度より前になるときは最初の年度からにして、clipped を true にする。
 * @param {{periodMode:string, years:number, firstYear:number, lastYear:number, maxYear:number}} choice 選び方
 * @returns {{startYear:number, endYear:number, clipped:boolean}} 年度（years は1年未満なら1年として扱う）
 * @example calculatePeriodFromChoice({periodMode:"future", years:20, firstYear:2001, lastYear:2025, maxYear:2075})
 *   // {startYear:2026, endYear:2045, clipped:false}
 */
function calculatePeriodFromChoice(choice) {
  const years = Math.max(1, Math.round(choice.years));
  if (choice.periodMode === PERIOD_PAST) {
    const endYear = choice.lastYear;
    let startYear = endYear - years + 1;
    let clipped = false;
    if (startYear < choice.firstYear) {
      startYear = choice.firstYear;
      clipped = true;
    }
    return { startYear: startYear, endYear: endYear, clipped: clipped };
  }
  const startYear = choice.lastYear + 1;
  // 2075年度より先は選べないため、そこで止める（仕様 7-2）
  const endYear = Math.min(startYear + years - 1, choice.maxYear);
  return { startYear: startYear, endYear: endYear, clipped: false };
}

/**
 * 「計算する期間：2026〜2045年度（20年）」の文と、足りないときの補足を作る。
 * @param {number} startYear 開始年度
 * @param {number} endYear 終了年度
 * @param {boolean} showClippedNote 「データが2001年度からのため…」を出すか
 * @param {number} firstYear データの最初の年度
 * @returns {{main:string, note:string}} 本文と補足（出さないときは空文字）。年度がおかしいときは両方空文字
 */
function formatPeriodSummary(startYear, endYear, showClippedNote, firstYear) {
  if (Number.isNaN(startYear) || Number.isNaN(endYear) || endYear < startYear) {
    return { main: "", note: "" };
  }
  const count = endYear - startYear + 1;
  let note = "";
  if (showClippedNote) {
    note = "データが" + firstYear + "年度からのため、" + count + "年で計算しています。";
  }
  return { main: "計算する期間：" + startYear + "〜" + endYear + "年度（" + count + "年）", note: note };
}

// Node.js（テスト）から require で使えるようにする。ブラウザには module がないので何もしない
if (typeof module !== "undefined" && module.exports) {
  module.exports = { calculatePeriodFromChoice, formatPeriodSummary, PERIOD_FUTURE, PERIOD_PAST, PERIOD_CUSTOM };
}
