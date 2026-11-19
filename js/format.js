/*
 * format.js：金額の表示形式と、入力値を数字に直す処理
 * 主な関数：toNonNegativeNumber（入力→0以上の数字）、formatMan（万円の表示）、formatManSigned（+付きの表示）、
 *   formatManShort（「万円」の「円」を省いた表示）、formatPercentSigned（収益率の%表示・小数第2位）、
 *   formatPercentShort（最も悪かった／よかった年度用の%表示・小数第1位）
 * nisa_view.js・realestate_view.js・history_*view.js・reading_text.js から使われる。tests/format.test.js でテストする。
 * ブラウザでは普通の <script> で、Node.js（ブラウザの外でJavaScriptを動かす仕組み。テストに使う）では
 * require（Node.jsで別のファイルを読み込む命令）で読み込める形にしている。
 */

// 小数第1位で四捨五入するための倍率（10倍して丸め、10で割る）
const ROUNDING_SCALE = 10;
// マイナスの金額の先頭につける記号。仕様で全角のマイナス記号と決まっている
const MINUS_SIGN = "−";

/**
 * 入力欄の文字を、計算に使える0以上の数字に直す。
 * 空欄・数字でないもの・マイナスは 0 として扱う（エラーや NaN（計算できなかったことを表す、数字ではない特別な値）を画面に出さないため）。
 * @param {string} text 入力欄の文字
 * @returns {number} 0以上の数字
 * @example toNonNegativeNumber("3.5") // 3.5
 * @example toNonNegativeNumber("")    // 0
 * @example toNonNegativeNumber("-2")  // 0
 */
function toNonNegativeNumber(text) {
  const number = parseFloat(text);
  if (Number.isNaN(number)) {
    return 0;
  }
  return Math.max(0, number);
}

/**
 * 万円の金額を「1,100.3万円」の形の文字にする。
 * 小数第1位で四捨五入し、3けたごとにカンマを入れる。マイナスは先頭に「−」をつける。
 * @param {number} amountMan 金額（万円）
 * @returns {string} 表示用の文字
 * @example formatMan(1100.32) // "1,100.3万円"
 * @example formatMan(-6.54)   // "−6.5万円"
 */
function formatMan(amountMan) {
  const rounded = Math.round(amountMan * ROUNDING_SCALE) / ROUNDING_SCALE;
  let sign = "";
  if (rounded < 0) {
    sign = MINUS_SIGN;
  }
  return sign + Math.abs(rounded).toLocaleString("ja-JP") + "万円";
}

/**
 * 0以上のときは先頭に「+」をつけて表示する（手元に残るお金の表示用）。
 * @param {number} amountMan 金額（万円）
 * @returns {string} 表示用の文字
 * @example formatManSigned(6.5) // "+6.5万円"
 * @example formatManSigned(-3)  // "−3万円"
 */
function formatManSigned(amountMan) {
  let prefix = "";
  if (amountMan >= 0) {
    prefix = "+";
  }
  return prefix + formatMan(amountMan);
}

/**
 * 幅の「下」の数字に使う、「万円」の「円」を省いた表示（「1,234.5万 〜 3,456.7万円」の左側）。
 * @param {number} amountMan 金額（万円）
 * @returns {string} 表示用の文字
 * @example formatManShort(1100.32) // "1,100.3万"
 */
function formatManShort(amountMan) {
  return formatMan(amountMan).replace("万円", "万");
}

// 収益率の表（年度ごとの一覧）で、小数第何位まで出すか（GPIF の資料の表記に合わせて第2位まで）
const PERCENT_DIGITS = 2;
// 最も悪かった／よかった年度で出す、小数第何位か（仕様 7-6：小数第1位）
const PERCENT_DIGITS_SHORT = 1;

/**
 * 収益率（%）を、指定した小数の桁数で「+14.89%」「−17.05%」の形の文字にする（0 は符号なし）。
 * @param {number} percent 収益率（%）
 * @param {number} digits 小数第何位まで出すか
 * @returns {string} 表示用の文字
 */
function formatPercentWithDigits(percent, digits) {
  let sign = "";
  if (percent < 0) {
    sign = MINUS_SIGN;
  } else if (percent > 0) {
    sign = "+";
  }
  return sign + Math.abs(percent).toFixed(digits) + "%";
}

/**
 * 収益率（%）を小数第2位まで（年度ごとの表用）。
 * @param {number} percent 収益率（%）
 * @returns {string} 表示用の文字
 * @example formatPercentSigned(14.89) // "+14.89%"
 */
function formatPercentSigned(percent) {
  return formatPercentWithDigits(percent, PERCENT_DIGITS);
}

/**
 * 収益率（%）を小数第1位まで（最も悪かった／よかった年度用）。
 * @param {number} percent 収益率（%）
 * @returns {string} 表示用の文字
 * @example formatPercentShort(-8) // "−8.0%"
 */
function formatPercentShort(percent) {
  return formatPercentWithDigits(percent, PERCENT_DIGITS_SHORT);
}

// Node.js（テスト）から require で使えるようにする。module（Node.jsでファイルの外に渡すものを入れる箱）は
// ブラウザにはないので、ブラウザでは何もしない
if (typeof module !== "undefined" && module.exports) {
  module.exports = { toNonNegativeNumber, formatMan, formatManSigned, formatManShort, formatPercentSigned, formatPercentShort };
}
