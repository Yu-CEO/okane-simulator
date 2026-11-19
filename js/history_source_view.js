/*
 * history_source_view.js：資産ボタン（資産ごとの「何か」の一言つき）・年度リスト・出典・年度ごとの収益率の表を画面に出す
 * 主な関数：renderAssetButtons（ASSET_DESCRIPTIONS の一言を添える）、fillYearOptions、renderAssetName、renderSource、renderDataTable
 * history_view.js から使われる。表示だけで、計算はしない。dom_helper.js・format.js・history_data.js を使う。
 */

// 資産ごとの「何か」の説明（1行だけ。値動きの大きさなどの向きは書かない。仕様 7-2）。並びはデータの順で固定
const ASSET_DESCRIPTIONS = {
  dstock: "日本の会社の株",
  fstock: "海外の会社の株",
  dbond: "日本の国などに貸す",
  fbond: "海外の国などに貸す",
};

/**
 * 資産名「国内株式（年金の運用実績）」から、ボタンに出す短い名前（かっこの前）を取り出す。
 * @param {string} assetName 資産名
 * @returns {string} 短い名前
 * @example getShortAssetName("国内株式（年金の運用実績）") // "国内株式"
 */
function getShortAssetName(assetName) {
  return assetName.split("（")[0];
}

/**
 * 資産のボタン（ラジオボタン）を、データの順のまま並べる。並べ替えはしない。4つとも同じ見た目。
 * @param {Object[]} assets 資産データの配列
 * @param {Function} onChange 選ばれたときに呼ぶ関数
 * @returns {void}
 */
function renderAssetButtons(assets, onChange) {
  const group = document.getElementById("f-asset");
  assets.forEach(function (asset, index) {
    const label = createElement("label", "", "");
    const input = createElement("input", "", "");
    input.type = "radio";
    input.name = "asset";
    input.value = asset.id;
    input.checked = index === 0;
    input.addEventListener("change", onChange);
    label.appendChild(input);
    label.appendChild(createElement("span", "", getShortAssetName(asset.name)));
    label.appendChild(createElement("small", "", ASSET_DESCRIPTIONS[asset.id] || ""));
    group.appendChild(label);
  });
}

/**
 * 年度のリスト（select）に、最初の年度から最後の年度までを入れ、指定の年度を選ぶ。
 * @param {HTMLSelectElement} select リストの要素
 * @param {number} firstYear 最初の年度
 * @param {number} lastYear 最後の年度
 * @param {number} selectedYear 選んでおく年度
 * @returns {void}
 */
function fillYearOptions(select, firstYear, lastYear, selectedYear) {
  clearChildren(select);
  for (let year = firstYear; year <= lastYear; year++) {
    const option = createElement("option", "", String(year));
    option.value = String(year);
    option.selected = year === selectedYear;
    select.appendChild(option);
  }
}

/**
 * 「選んでいる資産：○○（年金の運用実績）」を出す。
 * @param {Object} asset 選んでいる資産
 * @returns {void}
 */
function renderAssetName(asset) {
  const area = document.getElementById("f-asset-name");
  clearChildren(area);
  area.appendChild(document.createTextNode("選んでいる資産："));
  area.appendChild(createElement("b", "", asset.name));
}

/**
 * 出典（GPIFウェブサイトの URL・資料名・確認日）を出す。URL は新しいタブで開く。
 * @param {Object} source 出典（title・url・checked）
 * @returns {void}
 */
function renderSource(source) {
  const list = document.getElementById("f-src");
  clearChildren(list);
  const link = createExternalLink(source.url, source.url);
  const siteCell = createElement("dd", "", "GPIFウェブサイト（");
  siteCell.appendChild(link);
  siteCell.appendChild(document.createTextNode("）"));
  list.appendChild(createElement("dt", "", "出典"));
  list.appendChild(siteCell);
  list.appendChild(createElement("dt", "", "資料名"));
  list.appendChild(createElement("dd", "", source.title));
  list.appendChild(createElement("dt", "", "確認日"));
  list.appendChild(createElement("dd", "", source.checked));
}

/**
 * 年度ごとの収益率の表（2列に折り返す）を作り、説明文と一緒に「くわしく知りたい人へ」の中へ入れる。
 * 色分けはしない（良い年度が目立たないようにするため）。
 * @param {Object} asset 選んでいる資産
 * @returns {void}
 */
function renderDataTable(asset) {
  const years = getYearList(asset.returns);
  const note = document.getElementById("f-data-note");
  note.textContent =
    asset.name + "：" + years[0] + "〜" + years[years.length - 1] + "年度（" + years.length +
    "年度分・各年度は4月〜翌年3月）。信託報酬などを引く前の数字です。";
  const half = Math.ceil(years.length / 2);
  const area = document.getElementById("f-table");
  clearChildren(area);
  const columns = createElement("div", "cols", "");
  columns.appendChild(createYearTable(asset, years.slice(0, half)));
  columns.appendChild(createYearTable(asset, years.slice(half)));
  area.appendChild(columns);
}

/**
 * 年度と収益率の表を1つつくる。
 * @param {Object} asset 資産データ
 * @param {number[]} years この表に入れる年度
 * @returns {HTMLTableElement} 表
 */
function createYearTable(asset, years) {
  const table = document.createElement("table");
  const head = document.createElement("tr");
  head.appendChild(createElement("th", "", "年度"));
  head.appendChild(createElement("th", "", "収益率"));
  table.appendChild(head);
  years.forEach(function (year) {
    const row = document.createElement("tr");
    row.appendChild(createElement("td", "", String(year)));
    row.appendChild(createElement("td", "", formatPercentSigned(asset.returns[String(year)])));
    table.appendChild(row);
  });
  return table;
}
