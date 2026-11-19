/*
 * history_view.js：「過去の実績で計算する」の入力を読み、期間・結果・出典の表を画面に表示する（流れだけ）
 * 主な関数：setupHistoryView（最初の準備）、updateHistoryView（入力を読んで書きかえる）、isHistoryReady、getPeriodMode
 * main.js・nisa_mode_switch.js・question_view.js から呼ばれる。
 * 計算は history_run.js・period_choice.js、結果の組み立ては history_result_view.js、部品は history_source_view.js。
 * 毎月の額（n-m）と年数（n-y）は「利回りを自分で入れる」と同じ欄を使う。
 * データ（GPIF_RETURNS）が読み込めなかったときは、「データを読めない」表示にして計算しない。
 */

// 選べる年度の上限。仕様 7-2 で2075年度までと決まっているため
const LAST_SELECTABLE_YEAR = 2075;
// 年数の欄が0・空のときに、「期間を戻す」ボタンの文字に使う年数（初期値と同じ20年）
const DEFAULT_PERIOD_YEARS = 20;

// 画面で使う資産データ（読み込みに成功したときだけ入る）
let historyAssets = [];
// 期間の選び方（period_choice.js の PERIOD_*）。最初は「これから」
let periodMode = PERIOD_FUTURE;
// 「過去の実際の期間」で、データが足りず最初の年度からにしたか
let periodClipped = false;
// 入力が変わったときに全体を計算し直す関数（main.js から受け取る）
let notifyHistoryChange = function () {};

/**
 * データを読み込めて、過去の実績の計算が使える状態か。
 * @returns {boolean} 使えるなら true
 */
function isHistoryReady() {
  return historyAssets.length > 0;
}

/**
 * 今の期間の選び方を返す（問いかけの見出しが使う）。
 * @returns {string} "future"・"past"・"custom"
 */
function getPeriodMode() {
  return periodMode;
}

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
 * 「何年つづける？」と「いつの期間？」から、年度のリスト（select）の中身と選択を決め直す。
 * 「細かく選んだ年度」のときは、利用者が選んだ年度をそのまま使うので触らない。
 * @returns {void}
 */
function applyPeriodChoice() {
  if (periodMode === PERIOD_CUSTOM) {
    return;
  }
  const years = getYearList(historyAssets[0].returns);
  const period = calculatePeriodFromChoice({
    periodMode: periodMode,
    years: toNonNegativeNumber(document.getElementById("n-y").value),
    firstYear: years[0],
    lastYear: years[years.length - 1],
    maxYear: LAST_SELECTABLE_YEAR,
  });
  periodClipped = period.clipped;
  fillYearOptions(document.getElementById("f-start"), years[0], LAST_SELECTABLE_YEAR, period.startYear);
  fillYearOptions(document.getElementById("f-end"), years[0], LAST_SELECTABLE_YEAR, period.endYear);
}

/**
 * 画面の入力欄を読み、計算に渡す形にする（空欄・数字でない・マイナスは v1 と同じく0）。
 * @returns {{monthlyMan:number, feePercent:number, startYear:number, endYear:number, isTaxable:boolean}} 入力
 */
function readHistoryInputs() {
  return {
    monthlyMan: toNonNegativeNumber(document.getElementById("n-m").value),
    feePercent: toNonNegativeNumber(document.getElementById("f-fee").value),
    startYear: parseInt(document.getElementById("f-start").value, 10),
    endYear: parseInt(document.getElementById("f-end").value, 10),
    isTaxable: document.querySelector("input[name=tax]:checked").value === "taxable",
  };
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
 * 期間まわりの表示（選択中の2択・「計算する期間」・「細かく選ぶ」の見出し・年度の例）を更新する。
 * @param {Object} inputs 入力
 * @param {number} firstYear データの最初の年度
 * @param {number} lastYear データの最後の年度
 * @returns {void}
 */
function renderPeriodParts(inputs, firstYear, lastYear) {
  document.querySelectorAll("input[name=when]").forEach(function (radio) {
    radio.checked = radio.value === periodMode;
  });
  document.getElementById("f-when-future").textContent = lastYear + 1 + "年度から";
  document.getElementById("f-when-past").textContent = lastYear + "年度まで";
  const showNote = periodClipped && periodMode === PERIOD_PAST;
  const summary = formatPeriodSummary(inputs.startYear, inputs.endYear, showNote, firstYear);
  const periodArea = document.getElementById("f-period");
  periodArea.textContent = summary.main;
  if (summary.note !== "") {
    periodArea.appendChild(document.createElement("br"));
    periodArea.appendChild(document.createTextNode(summary.note));
  }
  document.getElementById("f-fy-ex").textContent = formatFiscalYearExample(inputs.startYear);
  document.getElementById("f-more-now").textContent = buildCurrentSettingText(
    inputs.startYear, inputs.endYear, inputs.feePercent, inputs.isTaxable
  );
}

/**
 * 「期間を『これから○年』に戻す」ボタンを押したときの動き。
 * @returns {void}
 */
function resetPeriodToFuture() {
  periodMode = PERIOD_FUTURE;
  notifyHistoryChange();
}

/**
 * 入力を読み、結果のカードを作り直す。計算できない入力のときは、案内文だけを出す（NaN・エラーは出さない）。
 * @returns {void}
 */
function updateHistoryView() {
  if (!isHistoryReady()) {
    return;
  }
  applyPeriodChoice();
  const asset = getSelectedAsset();
  const inputs = readHistoryInputs();
  const years = getYearList(asset.returns);
  renderAssetName(asset);
  renderPeriodParts(inputs, years[0], years[years.length - 1]);
  renderSource(asset.source);
  renderDataTable(asset);

  const body = document.getElementById("f-result-body");
  clearChildren(body);
  const result = runHistory(asset, inputs);
  if (result.error !== "") {
    // 年数の欄が0や空のときは、「期間を戻す」ボタンの文字に初期値の年数を使う
    let resetYears = toNonNegativeNumber(document.getElementById("n-y").value);
    if (resetYears === 0) {
      resetYears = DEFAULT_PERIOD_YEARS;
    }
    renderHistoryError(body, result.error, resetYears, resetPeriodToFuture);
    return;
  }
  renderHistoryResult(body, asset, inputs, result);
}

/**
 * 期間の2択・年度のリスト・手数料・口座など、入力が変わったときの動きを登録する。
 * @returns {void}
 */
function setupHistoryEvents() {
  document.querySelectorAll("input[name=when]").forEach(function (radio) {
    radio.addEventListener("change", function () {
      periodMode = radio.value;
      notifyHistoryChange();
    });
  });
  // 年度のリストを動かしたら、2択の選択を外して「細かく選んだ年度」として扱う
  ["f-start", "f-end"].forEach(function (id) {
    document.getElementById(id).addEventListener("change", function () {
      periodMode = PERIOD_CUSTOM;
      notifyHistoryChange();
    });
  });
}

/**
 * 最初の準備：データの形を調べ、資産ボタンを作る。年度のリストは updateHistoryView が期間の選び方から作る。
 * データが使えないときは「読めない」表示にして、利回りを自分で入れる方へ戻れるようにする。
 * @param {Function} onChange 入力が変わったときに全体を計算し直す関数
 * @returns {void}
 */
function setupHistoryView(onChange) {
  notifyHistoryChange = onChange;
  // データのファイルが読み込めなかったとき、GPIF_RETURNS をそのまま使うとエラーで画面全体が止まるため、先にあるかを確かめる
  let loaded;
  if (typeof GPIF_RETURNS !== "undefined") {
    loaded = GPIF_RETURNS;
  }
  const check = checkHistoryData(loaded);
  if (!check.ok) {
    return;
  }
  historyAssets = loaded.assets;
  renderAssetButtons(historyAssets, onChange);
  setupHistoryEvents();
}
