/*
 * tax_calc.js：課税口座の税金と、税引き後の最終額の計算（画面には触れない）
 * 主な関数：calculateTax
 * history_run.js から使われる。tests/tax_calc.test.js でテストする。
 * ブラウザでは普通の <script>、Node.js（テスト）では require で読み込める形にしている。
 */

// 譲渡益にかかる税率（20.315%＝所得税・復興特別所得税・住民税の合計）。仕様 7-5 で1か所にまとめる決まり
const TAX_RATE = 0.20315;
// 画面に出す税率の文字（TAX_RATE と同じ値を人が読む形にしたもの）
const TAX_RATE_TEXT = "20.315%";

/**
 * 課税口座で、終了年度の末に一括で売った想定の税金と税引き後の最終額を求める。
 * 税金は、増えた額がプラスのときだけかかる（マイナスのときは0）。
 * @param {number} totalMan 最終額（万円）
 * @param {number} principalMan 元本（万円）
 * @returns {{tax:number, afterTax:number}} 税金・税引き後の最終額（万円）
 * @example calculateTax(12.5, 12) // { tax: 約0.1, afterTax: 約12.4 }
 */
function calculateTax(totalMan, principalMan) {
  const gain = totalMan - principalMan;
  let tax = 0;
  if (gain > 0) {
    tax = gain * TAX_RATE;
  }
  return { tax: tax, afterTax: totalMan - tax };
}

// Node.js（テスト）から require で使えるようにする。ブラウザには module がないので何もしない
if (typeof module !== "undefined" && module.exports) {
  module.exports = { TAX_RATE, TAX_RATE_TEXT, calculateTax };
}
