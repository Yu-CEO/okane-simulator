/*
 * history_view.js：「過去の実績で計算する」の入力を読み、結果・幅・注意・出典を画面に表示する
 * 主な関数：setupHistoryView（最初の準備）、updateHistoryView（入力を読んで結果を書きかえる）
 * main.js から呼ばれる。計算は history_run.js、部品は history_parts_view.js・history_source_view.js、表示形式は format.js。
 * データ（GPIF_RETURNS）が読み込めなかったときは、「データを読めない」表示にして計算しない。
 */

// 選べる年度の上限。仕様 7-2 で2075年度までと決まっているため
const LAST_SELECTABLE_YEAR = 2075;
// 終了年度の初期値は「開始年度＋19」＝20年間（仕様 7-2）
const DEFAULT_PERIOD_YEARS = 20;

const NOTE_RANGE = "過去の実績をもとにした計算です。将来の結果を保証するものではありません。実際には幅の外になることもあります。";
const NOTE_RANGE_PLAIN = "過去と同じくらいばらつくと、だいたいこの範囲";
const NOTE_TAX = "※分配金・売る時期・損益通算などで実際の税額は変わります。";

// 画面で使う資産データ（読み込みに成功したときだけ入る）
let historyAssets = [];

/**
 * 画面で選ばれている資産のデータを返す。
 * @returns {Object} 資産1つ分のデータ
 */
function getSelectedAsset() {
  const selectedId = document.querySelector("input[name=asset]:checked").value;
  return historyAssets.filter(function (asset) {
    return asset.id === selectedId;
  })[0];
}

/**
 * 画面の入力欄を読み、計算に渡す形にする（空欄・数字でない・マイナスは v1 と同じく0）。
 * @returns {{monthlyMan:number, feePercent:number, startYear:number, endYear:number, isTaxable:boolean}} 入力
 */
function readHistoryInputs() {
  return {
    monthlyMan: toNonNegativeNumber(document.getElementById("f-m").value),
    feePercent: toNonNegativeNumber(document.getElementById("f-fee").value),
    startYear: parseInt(document.getElementById("f-start").value, 10),
    endYear: parseInt(document.getElementById("f-end").value, 10),
    isTaxable: document.querySelector("input[name=tax]:checked").value === "taxable",
  };
}

/**
 * 結果が1つの数字のとき（終了年度がデータの最後の年度以前）の表示を足す。
 * @param {HTMLElement} card 結果のカード
 * @param {Object} result runHistory の結果
 * @param {number} endYear 運用終了年度
 * @returns {void}
 */
function appendSingleResult(card, result, endYear) {
  card.appendChild(createElement("div", "label", "最終額（過去の実績で計算・" + endYear + "年度末）"));
  card.appendChild(createElement("div", "big", formatMan(result.totals.mid)));
  card.appendChild(createRow("積み立てた元本", formatMan(result.principal), "", ""));
  card.appendChild(createRow("増えた額", formatMan(result.gainMid), gainClassName(result.gainMid), ""));
  if (result.taxes) {
    card.appendChild(createRow("税金（約" + TAX_RATE_TEXT + "）", formatMan(result.taxes.mid.tax), "", "after"));
    card.appendChild(createRow("税引き後の最終額", formatMan(result.taxes.mid.afterTax), "", ""));
  }
}

/**
 * 結果が「下 〜 上（中央）」の幅のとき（終了年度がデータの最後の年度より後）の表示を足す。1本の数字にはしない。
 * @param {HTMLElement} card 結果のカード
 * @param {Object} result runHistory の結果
 * @param {number} endYear 運用終了年度
 * @returns {void}
 */
function appendRangeResult(card, result, endYear) {
  const totals = result.totals;
  card.appendChild(createElement("div", "label", "最終額のめやす（下 〜 上・" + endYear + "年度末）"));
  card.appendChild(createElement("div", "big range", formatManShort(totals.low) + " 〜 " + formatMan(totals.high)));
  const middle = createElement("p", "mid", "中央 ");
  middle.appendChild(createElement("b", "", formatMan(totals.mid)));
  card.appendChild(middle);
  card.appendChild(createRangeBar(totals.low, totals.mid, totals.high, result.principal));
  card.appendChild(createElement("p", "plain", NOTE_RANGE_PLAIN));
  card.appendChild(createElement("p", "rangenote", NOTE_RANGE));
  card.appendChild(createRow("積み立てた元本", formatMan(result.principal), "", ""));
  card.appendChild(createRow("増えた額（中央）", formatMan(result.gainMid), gainClassName(result.gainMid), ""));
  if (result.taxes) {
    card.appendChild(createRow("税金（中央・約" + TAX_RATE_TEXT + "）", formatMan(result.taxes.mid.tax), "", "after"));
    card.appendChild(
      createRow("税引き後の最終額", formatManShort(result.taxes.low.afterTax) + " 〜 " + formatMan(result.taxes.high.afterTax), "", "")
    );
    card.appendChild(createRow("（中央）", formatMan(result.taxes.mid.afterTax), "", ""));
  }
}

/**
 * 結果の下に出す補足（信託報酬の一言・税金の注意・NISAの上限の注意・積立額0の一言）を足す。
 * @param {HTMLElement} card 結果のカード
 * @param {Object} inputs 入力
 * @param {Object} result runHistory の結果
 * @returns {void}
 */
function appendResultNotes(card, inputs, result) {
  if (inputs.feePercent > 0) {
    card.appendChild(createElement("p", "hint", "信託報酬など 年" + inputs.feePercent + "% を毎年度差し引いています。"));
  }
  if (inputs.isTaxable) {
    card.appendChild(createElement("p", "warn", NOTE_TAX));
  } else {
    const warnings = getNisaWarnings(inputs.monthlyMan, result.principal);
    if (warnings.length > 0) {
      card.appendChild(createElement("p", "warn", warnings.join(" ")));
    }
  }
  if (inputs.monthlyMan === 0) {
    card.appendChild(createElement("p", "hint", "毎月の積立額が0のため、結果は0万円です。"));
  }
}

/**
 * 年度の例の文（「例：2026年度（2026年4月〜2027年3月）。」）をつくる。
 * @param {number} startYear 運用開始年度
 * @returns {string} 例の文。年度が数字でないときは空文字
 */
function formatFiscalYearExample(startYear) {
  if (Number.isNaN(startYear)) {
    return "";
  }
  return "例：" + startYear + "年度（" + startYear + "年4月〜" + (startYear + 1) + "年3月）。";
}

/**
 * 入力を読み、結果のカードを作り直す。計算できない入力のときは、案内文だけを出す（NaN・エラーは出さない）。
 * @returns {void}
 */
function updateHistoryView() {
  if (historyAssets.length === 0) {
    return;
  }
  const asset = getSelectedAsset();
  const inputs = readHistoryInputs();
  renderAssetName(asset);
  document.getElementById("f-fy-ex").textContent = formatFiscalYearExample(inputs.startYear);
  renderSource(asset.source);
  renderDataTable(asset);

  const card = document.getElementById("f-result");
  clearChildren(card);
  const result = runHistory(asset, inputs);
  if (result.error !== "") {
    card.appendChild(createElement("div", "label", "計算できません"));
    card.appendChild(createElement("p", "err", result.error));
    return;
  }
  card.appendChild(createTimeline(inputs.startYear, inputs.endYear, result.pastYears, result.futureYears, result.lastDataYear));
  if (result.isRange) {
    appendRangeResult(card, result, inputs.endYear);
  } else {
    appendSingleResult(card, result, inputs.endYear);
  }
  if (needsClassificationNote(asset.id, inputs.startYear, inputs.endYear)) {
    card.appendChild(createElement("p", "warn", CLASSIFICATION_CHANGE_NOTE));
  }
  card.appendChild(createExtremes(asset));
  appendResultNotes(card, inputs, result);
}

/**
 * 最初の準備：データの形を調べ、資産ボタンと年度リストを作り、初期値を入れる。
 * 初期値：開始＝データの最後の年度＋1（これから始める想定）、終了＝開始＋19（20年間）。
 * データが使えないときは「読めない」表示にして、利回りを自分で入れる方へ戻れるようにする。
 * @returns {void}
 */
function setupHistoryView() {
  // データのファイルが読み込めなかったとき、GPIF_RETURNS をそのまま使うとエラーで画面全体が止まるため、先にあるかを確かめる
  let loaded;
  if (typeof GPIF_RETURNS !== "undefined") {
    loaded = GPIF_RETURNS;
  }
  const check = checkHistoryData(loaded);
  document.getElementById("f-fail").hidden = check.ok;
  document.getElementById("f-main").hidden = !check.ok;
  if (!check.ok) {
    return;
  }
  historyAssets = loaded.assets;
  const years = getYearList(historyAssets[0].returns);
  const firstYear = years[0];
  const startYear = years[years.length - 1] + 1;
  renderAssetButtons(historyAssets, updateHistoryView);
  fillYearOptions(document.getElementById("f-start"), firstYear, LAST_SELECTABLE_YEAR, startYear);
  fillYearOptions(document.getElementById("f-end"), firstYear, LAST_SELECTABLE_YEAR, startYear + DEFAULT_PERIOD_YEARS - 1);
  document.getElementById("f-start").addEventListener("change", updateHistoryView);
  document.getElementById("f-end").addEventListener("change", updateHistoryView);
}
