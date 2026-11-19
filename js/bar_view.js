/*
 * bar_view.js：結果の棒（CSSだけで描く）。積み上げの棒・年度の帯・幅の棒
 * 主な関数：updateStackBar、createTimeline、createRangeBar
 * nisa_view.js・history_result_view.js から使われる。表示だけで、計算はしない。dom_helper.js を使う。
 * 色は資産で変えない（どの資産でも同じ見た目）。
 */

// 幅の棒の右端に余白をつける倍率（最大値ちょうどだと端に貼りつくため。8%の余白）
const RANGE_BAR_MARGIN = 1.08;
const PERCENT_FULL = 100;
// 幅の棒の位置を小数第何位まで指定するか
const BAR_POSITION_DIGITS = 1;

/**
 * 積み上げの棒（入れたお金＋増えた分）の長さを決める。flex（残りを割合で分ける指定）の比で長さが決まる。
 * @param {HTMLElement} principalPart 入れたお金の部分
 * @param {HTMLElement} gainPart 増えた分の部分
 * @param {number} principalMan 元本（万円）
 * @param {number} gainMan 増えた分（万円。マイナスは0として描く）
 * @returns {void}
 */
function updateStackBar(principalPart, gainPart, principalMan, gainMan) {
  principalPart.style.flex = String(principalMan);
  gainPart.style.flex = String(Math.max(gainMan, 0));
}

/**
 * 年度の帯：どこまでが実際にあった実績の年度で、どこからがめやすの年度かを示す。
 * @param {number} startYear 運用開始年度
 * @param {number} endYear 運用終了年度
 * @param {number} pastYears 実績の年数
 * @param {number} futureYears めやすの年数
 * @param {number} lastDataYear データの最後の年度
 * @returns {HTMLElement} 帯の要素
 */
function createTimeline(startYear, endYear, pastYears, futureYears, lastDataYear) {
  const wrapper = createElement("div", "tl", "");
  const bar = createElement("div", "tl-bar", "");
  const legend = createElement("div", "leg", "");
  if (pastYears > 0) {
    const past = createElement("span", "tl-past", "");
    past.style.flex = String(pastYears);
    bar.appendChild(past);
    const pastText = "実際にあった実績 " + startYear + "〜" + Math.min(endYear, lastDataYear) + "年度（" + pastYears + "年）";
    legend.appendChild(createLegendItem("legend-past", pastText));
  }
  if (futureYears > 0) {
    const future = createElement("span", "tl-fut", "");
    future.style.flex = String(futureYears);
    bar.appendChild(future);
    const futureText = "めやす " + Math.max(startYear, lastDataYear + 1) + "〜" + endYear + "年度（" + futureYears + "年）";
    legend.appendChild(createLegendItem("legend-future", futureText));
  }
  wrapper.appendChild(bar);
  wrapper.appendChild(legend);
  return wrapper;
}

/**
 * 凡例（印＋説明）を1つつくる。見た目は css/style.css の legend-* クラスで決める。
 * @param {string} iconClass 印のクラス名
 * @param {string} text 説明
 * @returns {HTMLElement} 凡例の要素
 */
function createLegendItem(iconClass, text) {
  const item = createElement("span", "", "");
  item.appendChild(createElement("i", iconClass, ""));
  item.appendChild(document.createTextNode(text));
  return item;
}

/**
 * 値を、棒の中の位置（0〜100）に直す。
 * @param {number} value 金額（万円）
 * @param {number} maxValue 棒の右端にあたる金額（万円）
 * @returns {number} 位置（0〜100）
 */
function toBarPosition(value, maxValue) {
  const position = (value / maxValue) * PERCENT_FULL;
  return Math.max(0, Math.min(PERCENT_FULL, position));
}

/**
 * 位置（0〜100）を、CSS の left に入れる文字（例 "42.5%"）にする。
 * @param {number} position 位置
 * @returns {string} CSS の値
 */
function toPercentText(position) {
  return position.toFixed(BAR_POSITION_DIGITS) + "%";
}

/**
 * 幅の棒（CSSだけ）：青＝低いほう〜高いほうの幅、黒い線＝まんなか、点線＝入れたお金。どの資産でも同じ色。
 * @param {number} low 低いほう（万円）
 * @param {number} mid まんなか（万円）
 * @param {number} high 高いほう（万円）
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
  fill.style.left = toPercentText(lowPosition);
  fill.style.width = toPercentText(highPosition - lowPosition);
  bar.appendChild(fill);
  const dot = createElement("div", "dot", "");
  dot.style.left = toPercentText(toBarPosition(mid, maxValue));
  bar.appendChild(dot);
  const principalLine = createElement("div", "pr", "");
  principalLine.style.left = toPercentText(toBarPosition(principal, maxValue));
  bar.appendChild(principalLine);
  wrapper.appendChild(bar);
  const legend = createElement("div", "leg", "");
  legend.appendChild(createLegendItem("legend-fill", "めやすの幅"));
  legend.appendChild(createLegendItem("legend-dot", "まんなか"));
  legend.appendChild(createLegendItem("legend-pr", "入れたお金"));
  wrapper.appendChild(legend);
  return wrapper;
}
