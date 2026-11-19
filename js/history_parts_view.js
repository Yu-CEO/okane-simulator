/*
 * history_parts_view.js：「過去の実績で計算する」の結果の小さな部品（行・3つの箱・最も悪い／よい年度）をつくる
 * 主な関数：createRow、gainClassName、createThreeBoxes、createExtremes
 * history_result_view.js から使われる。表示だけで、計算はしない。dom_helper.js・format.js・history_data.js・reading_text.js を使う。
 */

/**
 * 「ラベル　値」の1行をつくる。
 * @param {string} labelText 左のラベル
 * @param {string} valueText 右の値
 * @param {string} valueClass 値につけるクラス（"plus"・"minus"・なければ空文字）
 * @param {string} rowClass 行につけるクラス（なければ空文字）
 * @returns {HTMLElement} 行の要素
 */
function createRow(labelText, valueText, valueClass, rowClass) {
  let className = "rowv";
  if (rowClass) {
    className = "rowv " + rowClass;
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
 * 「低いほう（下）／まんなか（中央）／高いほう（上）」の3つの同じ形の箱をつくる。
 * @param {number} low 低いほう（万円）
 * @param {number} mid まんなか（万円）
 * @param {number} high 高いほう（万円）
 * @returns {HTMLElement} 3つの箱
 */
function createThreeBoxes(low, mid, high) {
  const boxes = createElement("div", "three", "");
  [
    ["低いほう（下）", low],
    ["まんなか（中央）", mid],
    ["高いほう（上）", high],
  ].forEach(function (item) {
    const box = createElement("div", "", "");
    box.appendChild(createElement("small", "", item[0]));
    box.appendChild(createElement("b", "", formatManShort(item[1])));
    boxes.appendChild(box);
  });
  return boxes;
}

/**
 * 最も悪かった／よかった年度の1行（値と、%の例つき）をつくる。2行とも同じ見た目。
 * @param {string} labelText 「最も悪かった年度」など
 * @param {{year:number, value:number}} extreme 年度と収益率（%）
 * @returns {HTMLElement} 行の要素
 */
function createExtremeRow(labelText, extreme) {
  const row = createRow(labelText, extreme.year + "年度 " + formatPercentShort(extreme.value), "", "");
  row.appendChild(createElement("span", "eg", buildExtremeExample(extreme.value)));
  return row;
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
  box.appendChild(createExtremeRow("最も悪かった年度", extremes.worst));
  box.appendChild(createExtremeRow("最もよかった年度", extremes.best));
  return box;
}
