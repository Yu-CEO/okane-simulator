/*
 * history_parts_view.js：「過去の実績で計算する」の結果の部品（行・年表の棒・幅の棒・最も悪い／よい年度）をつくる
 * 主な関数：createRow、createTimeline、createRangeBar、createExtremes
 * history_view.js から使われる。表示だけで、計算はしない。dom_helper.js・format.js・history_data.js を使う。
 */

// 幅の棒の右端に余白をつける倍率（最大値ちょうどだと端に貼りつくため。8%の余白）
const RANGE_BAR_MARGIN = 1.08;
const PERCENT_FULL = 100;
// 幅の棒の位置を小数第何位まで指定するか
const BAR_POSITION_DIGITS = 1;

/**
 * 「ラベル　値」の1行をつくる。
 * @param {string} labelText 左のラベル
 * @param {string} valueText 右の値
 * @param {string} valueClass 値につけるクラス（"plus"・"minus"・なければ空文字）
 * @param {string} rowClass 行につけるクラス（なければ空文字）
 * @returns {HTMLElement} 行の要素
 */
function createRow(labelText, valueText, valueClass, rowClass) {
  let className = "row";
  if (rowClass) {
    className = "row " + rowClass;
  }
  const row = createElement("div", className, labelText);
  row.appendChild(createElement("b", valueClass, valueText));
  return row;
}

/**
 * 増えた額の表示に使うクラス名を返す（マイナスは赤、それ以外は緑）。
 * @param {number} gainMan 増えた額（万円）
 * @returns {string} "plus" または "minus"
 */
function gainClassName(gainMan) {
  if (gainMan < 0) {
    return "minus";
  }
  return "plus";
}

/**
 * 年表の棒：どこまでが過去の実績の年度で、どこからがめやすの年度かを示す。
 * @param {number} startYear 運用開始年度
 * @param {number} endYear 運用終了年度
 * @param {number} pastYears 実績の年数
 * @param {number} futureYears めやすの年数
 * @param {number} lastDataYear データの最後の年度
 * @returns {HTMLElement} 年表の要素
 */
function createTimeline(startYear, endYear, pastYears, futureYears, lastDataYear) {
  const wrapper = createElement("div", "tl", "");
  const bar = createElement("div", "tl-bar", "");
  const legend = createElement("div", "tl-leg", "");
  if (pastYears > 0) {
    const past = createElement("span", "tl-past", "");
    past.style.flex = String(pastYears);
    bar.appendChild(past);
    const pastText = "実績 " + startYear + "〜" + Math.min(endYear, lastDataYear) + "年度（" + pastYears + "年）";
    legend.appendChild(createLegendItem("var(--sub)", pastText));
  }
  if (futureYears > 0) {
    const future = createElement("span", "tl-fut", "");
    future.style.flex = String(futureYears);
    bar.appendChild(future);
    const futureText = "めやす " + Math.max(startYear, lastDataYear + 1) + "〜" + endYear + "年度（" + futureYears + "年）";
    legend.appendChild(createLegendItem("var(--future)", futureText));
  }
  wrapper.appendChild(bar);
  wrapper.appendChild(legend);
  return wrapper;
}

/**
 * 年表の凡例（色の四角＋説明）を1つつくる。
 * @param {string} colorValue 四角の色（CSS の値）
 * @param {string} text 説明
 * @returns {HTMLElement} 凡例の要素
 */
function createLegendItem(colorValue, text) {
  const item = createElement("span", "", "");
  const square = createElement("i", "", "");
  square.style.background = colorValue;
  item.appendChild(square);
  item.appendChild(document.createTextNode(text));
  return item;
}

/**
 * 値を、棒の中の位置（0〜100%の文字）に直す。
 * @param {number} value 金額（万円）
 * @param {number} maxValue 棒の右端にあたる金額（万円）
 * @returns {number} 位置（0〜100）
 */
function toBarPosition(value, maxValue) {
  const position = (value / maxValue) * PERCENT_FULL;
  return Math.max(0, Math.min(PERCENT_FULL, position));
}

/**
 * 幅の棒（CSSだけ）：紫＝下〜上の幅、白い線＝中央、点線＝元本。どの資産でも同じ色。
 * @param {number} low 下（万円）
 * @param {number} mid 中央（万円）
 * @param {number} high 上（万円）
 * @param {number} principal 元本（万円）
 * @returns {HTMLElement} 棒と凡例をまとめた要素
 */
function createRangeBar(low, mid, high, principal) {
  let maxValue = Math.max(high, principal) * RANGE_BAR_MARGIN;
  if (maxValue <= 0) {
    // 金額がすべて0のとき、0で割って位置が計算できなくなるのを防ぐため
    maxValue = 1;
  }
  const lowPosition = toBarPosition(low, maxValue);
  const highPosition = toBarPosition(high, maxValue);
  const wrapper = createElement("div", "", "");
  const bar = createElement("div", "rbar", "");
  bar.setAttribute("aria-hidden", "true");
  bar.appendChild(createElement("div", "track", ""));
  const fill = createElement("div", "fill", "");
  fill.style.left = lowPosition.toFixed(BAR_POSITION_DIGITS) + "%";
  fill.style.width = (highPosition - lowPosition).toFixed(BAR_POSITION_DIGITS) + "%";
  bar.appendChild(fill);
  const dot = createElement("div", "dot", "");
  dot.style.left = toBarPosition(mid, maxValue).toFixed(BAR_POSITION_DIGITS) + "%";
  bar.appendChild(dot);
  const principalLine = createElement("div", "pr", "");
  principalLine.style.left = toBarPosition(principal, maxValue).toFixed(BAR_POSITION_DIGITS) + "%";
  bar.appendChild(principalLine);
  wrapper.appendChild(bar);
  const legend = createElement("div", "rleg", "");
  legend.appendChild(createRangeLegendItem("legend-fill", "めやすの幅"));
  legend.appendChild(createRangeLegendItem("legend-dot", "中央"));
  legend.appendChild(createRangeLegendItem("legend-pr", "元本"));
  wrapper.appendChild(legend);
  return wrapper;
}

/**
 * 幅の棒の凡例を1つつくる。見た目は css/style.css の legend-* クラスで決める。
 * @param {string} iconClass 印のクラス名
 * @param {string} text 説明
 * @returns {HTMLElement} 凡例の要素
 */
function createRangeLegendItem(iconClass, text) {
  const item = createElement("span", "", "");
  item.appendChild(createElement("i", iconClass, ""));
  item.appendChild(document.createTextNode(text));
  return item;
}

/**
 * 「使ったデータの中で、最も悪かった年度／最もよかった年度」。信託報酬などを引く前の数字。
 * 4資産とも同じ見た目・同じ色で、向きの要約文は出さない（比べる材料にしないため）。
 * @param {Object} asset 資産1つ分のデータ
 * @returns {HTMLElement} 要素
 */
function createExtremes(asset) {
  const years = getYearList(asset.returns);
  const extremes = findWorstAndBestYear(asset.returns);
  const box = createElement("div", "ext", "");
  const title = "使ったデータ（" + years[0] + "〜" + years[years.length - 1] + "年度）の中で";
  box.appendChild(createElement("div", "label", title));
  box.appendChild(
    createRow("最も悪かった年度", extremes.worst.year + "年度 " + formatPercentSigned(extremes.worst.value), "", "")
  );
  box.appendChild(
    createRow("最もよかった年度", extremes.best.year + "年度 " + formatPercentSigned(extremes.best.value), "", "")
  );
  return box;
}
