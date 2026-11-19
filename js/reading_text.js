/*
 * reading_text.js：問いかけの見出し・読み方の一言・短い注意などの「文」を作る（画面には触れない）
 * 主な関数：buildQuestionText、buildManualReading、buildRangeReading、buildSingleReading ほか
 * 一言の中で太字にする部分があるため、文は「かけら（text と strong）の配列」で返す。segmentsToText で1つの文字に直せる。
 * question_view.js・nisa_view.js・realestate_view.js・history_result_view.js から使われる。tests/reading_text.test.js でテストする。
 */

// 金額の表示形式（format.js）。ブラウザでは先に読み込んだ関数、Node.js（テスト）では require で読む
let readingFormat;
if (typeof module !== "undefined" && module.exports) {
  readingFormat = require("./format.js");
} else {
  readingFormat = { formatMan: formatMan };
}

const QUESTION_REAL_ESTATE = "マンションを貸したら、毎月いくら残る？";
const QUESTION_ZERO = "毎月の積立、何年でいくらになる？";
// 倍や数字を小数第1位で四捨五入するための倍率
const READING_ROUND_SCALE = 10;
// 初期値の利回り。このときだけ「初期値で、正解の数字ではありません」を足す
const DEFAULT_RATE_PERCENT = 4;
// 100万円を例にするときの元の金額（万円）
const EXAMPLE_BASE_MAN = 100;

/**
 * 数字を小数第1位で四捨五入し、余計な「.0」をつけない文字にする。
 * @param {number} value 数字
 * @returns {string} 文字
 * @example plainNumber(3) // "3"、plainNumber(1.55) // "1.6"
 */
function plainNumber(value) {
  return String(Math.round(value * READING_ROUND_SCALE) / READING_ROUND_SCALE);
}

/**
 * 文のかけらを、太字なしの1つの文字につなぐ。
 * @param {{text:string, strong:boolean}[]} segments 文のかけら
 * @returns {string} つないだ文字
 */
function segmentsToText(segments) {
  return segments
    .map(function (segment) {
      return segment.text;
    })
    .join("");
}

/**
 * 文のかけらを1つ作る。
 * @param {string} text 文字
 * @param {boolean} isStrong 太字にするか
 * @returns {{text:string, strong:boolean}} かけら
 */
function createSegment(text, isStrong) {
  return { text: text, strong: isStrong === true };
}

/**
 * 画面の最初の問いかけ（見出し）を、入力に合わせて作る。
 * @param {{isRealEstate:boolean, monthlyMan:number, years:number, isHistory:boolean, periodMode:string, startYear:number, endYear:number}} state 今の状態
 * @returns {string} 見出し
 * @example buildQuestionText({isRealEstate:false, monthlyMan:3, years:20, isHistory:false}) // "毎月3万円を20年続けたら、いくらになる？"
 */
function buildQuestionText(state) {
  if (state.isRealEstate) {
    return QUESTION_REAL_ESTATE;
  }
  if (state.monthlyMan === 0 || state.years === 0) {
    return QUESTION_ZERO;
  }
  const base = "毎月" + plainNumber(state.monthlyMan) + "万円を";
  if (state.isHistory && state.periodMode === "past") {
    return base + plainNumber(state.years) + "年前から続けていたら、いくらになっていた？";
  }
  if (state.isHistory && state.periodMode === "custom") {
    if (state.endYear < state.startYear || Number.isNaN(state.startYear) || Number.isNaN(state.endYear)) {
      return base + "積み立てたら、いくらになる？";
    }
    return base + state.startYear + "〜" + state.endYear + "年度に続けたら、いくらになる？";
  }
  return base + plainNumber(state.years) + "年続けたら、いくらになる？";
}

/**
 * 利回りの例の一言：「年4%＝100万円が1年で104万円になるペース。」（4%のときだけ続きを足す）。
 * @param {number} ratePercent 利回り（%）
 * @returns {{text:string, strong:boolean}[]} 文のかけら
 */
function buildYieldExample(ratePercent) {
  const segments = [
    createSegment("年" + plainNumber(ratePercent) + "%＝", false),
    createSegment(EXAMPLE_BASE_MAN + "万円が1年で" + plainNumber(EXAMPLE_BASE_MAN + ratePercent) + "万円", true),
    createSegment("になるペース。", false),
  ];
  if (ratePercent === DEFAULT_RATE_PERCENT) {
    segments.push(createSegment("4%は初期値で、正解の数字ではありません。", false));
  }
  return segments;
}

/**
 * 「利回りを自分で入れる」の結果の見出し。
 * @param {number} years 年数
 * @param {number} ratePercent 利回り（%）
 * @returns {string} 見出し
 */
function buildManualLabel(years, ratePercent) {
  return plainNumber(years) + "年後の金額（年" + plainNumber(ratePercent) + "%で増え続けた場合の想定）";
}

/**
 * 「利回りを自分で入れる」の読み方の一言。元本が0のときは0である旨を返す。
 * @param {number} principalMan 元本（万円）
 * @param {number} totalMan 最終額（万円）
 * @returns {{text:string, strong:boolean}[]} 文のかけら
 */
function buildManualReading(principalMan, totalMan) {
  if (principalMan <= 0) {
    return [createSegment("毎月の積立額か年数が0のため、結果は0万円です。", false)];
  }
  return [
    createSegment("入れたお金 ", false),
    createSegment(readingFormat.formatMan(principalMan), true),
    createSegment(" が、", false),
    createSegment("約" + plainNumber(totalMan / principalMan) + "倍", true),
    createSegment("になる計算です。", false),
  ];
}

/**
 * 「利回りを自分で入れる」の短い注意（常に出す）。
 * @param {number} ratePercent 利回り（%）
 * @returns {string} 文
 */
function buildManualShortNote(ratePercent) {
  return "年" + plainNumber(ratePercent) + "%がずっと続いた場合の計算です。実際の増え方は年ごとに上下し、減る年もあります。";
}

/**
 * 過去の実績（1つの数字）の読み方の一言。
 * @param {{startYear:number, years:number, monthlyMan:number, principalMan:number, totalMan:number, assetName:string}} info 結果
 * @returns {{text:string, strong:boolean}[]} 文のかけら
 */
function buildSingleReading(info) {
  return [
    createSegment("もし" + info.startYear + "年度から" + info.years + "年間、毎月" + plainNumber(info.monthlyMan) + "万円を続けていたら、入れたお金 ", false),
    createSegment(readingFormat.formatMan(info.principalMan), true),
    createSegment(" が ", false),
    createSegment(readingFormat.formatMan(info.totalMan), true),
    createSegment(" になっていた計算です（" + info.assetName + "）。", false),
  ];
}

/**
 * 過去の実績（幅）の読み方の一言。低いほうが元本より小さいかどうかで文が変わる。
 * @param {number} principalMan 元本（万円）
 * @param {number} lowMan 低いほう（万円）
 * @param {number} midMan まんなか（万円）
 * @returns {{text:string, strong:boolean}[]} 文のかけら
 */
function buildRangeReading(principalMan, lowMan, midMan) {
  const segments = [createSegment("入れたお金は ", false), createSegment(readingFormat.formatMan(principalMan), true), createSegment("（点線）。", false)];
  if (lowMan < principalMan) {
    segments.push(createSegment("低いほうは点線より左＝", false));
    segments.push(createSegment("入れたお金より減っている", true));
    segments.push(createSegment("こともある、という幅です。", false));
    return segments;
  }
  segments.push(createSegment("まんなかは ", false));
  segments.push(createSegment(readingFormat.formatMan(midMan), true));
  segments.push(createSegment(" の計算です。", false));
  return segments;
}

/**
 * マンション収支の読み方の一言。
 * @param {number} monthlyCashFlowMan 毎月の手元に残るお金（万円）
 * @returns {{text:string, strong:boolean}[]} 文のかけら
 */
function buildRealEstateReading(monthlyCashFlowMan) {
  if (monthlyCashFlowMan >= 0) {
    return [
      createSegment("家賃からローンと費用を払っても、毎月 ", false),
      createSegment(readingFormat.formatMan(monthlyCashFlowMan), true),
      createSegment(" 残る計算です。", false),
    ];
  }
  return [
    createSegment("家賃だけでは足りず、毎月 ", false),
    createSegment(readingFormat.formatMan(-monthlyCashFlowMan), true),
    createSegment(" を自分のお財布から出す計算です。", false),
  ];
}

/**
 * 最も悪かった／よかった年度に添える例：「（100万円が1年で92万円になるくらい）」。
 * @param {number} returnPercent 収益率（%）
 * @returns {string} 文
 */
function buildExtremeExample(returnPercent) {
  return "（" + EXAMPLE_BASE_MAN + "万円が1年で" + plainNumber(EXAMPLE_BASE_MAN + returnPercent) + "万円になるくらい）";
}

/**
 * 「細かく選ぶ」の見出しに出す今の設定：「今：2026〜2045年度・手数料0%・NISA」。
 * @param {number} startYear 開始年度
 * @param {number} endYear 終了年度
 * @param {number} feePercent 手数料（%）
 * @param {boolean} isTaxable 課税口座か
 * @returns {string} 文
 */
function buildCurrentSettingText(startYear, endYear, feePercent, isTaxable) {
  let account = "NISA";
  if (isTaxable) {
    account = "課税口座";
  }
  return "今：" + startYear + "〜" + endYear + "年度・手数料" + plainNumber(feePercent) + "%・" + account;
}

// Node.js（テスト）から require で使えるようにする。ブラウザには module がないので何もしない
if (typeof module !== "undefined" && module.exports) {
  module.exports = {
    plainNumber, segmentsToText, buildQuestionText, buildYieldExample, buildManualLabel, buildManualReading,
    buildManualShortNote, buildSingleReading, buildRangeReading, buildRealEstateReading, buildExtremeExample,
    buildCurrentSettingText,
  };
}
