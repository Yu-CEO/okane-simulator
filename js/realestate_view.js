/*
 * realestate_view.js：マンションの入力欄を読み、計算結果を画面に表示する
 * 主な関数：readRealEstateInputs（入力欄を読む）、updateRealEstateView（結果を表示する）
 * main.js から呼ばれる。計算は realestate_calc.js、読み方の一言は reading_text.js、表示形式は format.js に任せる。
 */

// 入ってくる家賃のラベル。家賃保証がオンのときだけ「家賃保証あり」をつける
const INCOME_LABEL_NORMAL = "入ってくる家賃（空室を考慮）";
const INCOME_LABEL_GUARANTEE = "入ってくる家賃（空室を考慮・家賃保証あり）";

/**
 * 入力欄の数字を1つ読む（空欄・マイナスは0）。
 * @param {string} id 入力欄のID
 * @returns {number} 0以上の数字
 */
function readRealEstateNumber(id) {
  return toNonNegativeNumber(document.getElementById(id).value);
}

/**
 * マンションの入力欄をすべて読み、計算に渡す形にまとめる。
 * @returns {object} calculateRealEstate に渡す入力値
 */
function readRealEstateInputs() {
  return {
    rent: readRealEstateNumber("r-rent"),
    vacancy: readRealEstateNumber("r-vac"),
    loan: readRealEstateNumber("r-loan"),
    rate: readRealEstateNumber("r-rate"),
    years: readRealEstateNumber("r-yrs"),
    fee: readRealEstateNumber("r-fee"),
    management: readRealEstateNumber("r-pm"),
    tax: readRealEstateNumber("r-tax"),
    hasGuarantee: document.getElementById("r-guar").checked,
    guaranteeCut: readRealEstateNumber("r-guar-cut"),
  };
}

/**
 * 家賃保証のチェックに合わせて、差し引かれる額の欄・注意文・ラベルを出し分ける。
 * @param {boolean} hasGuarantee 家賃保証がオンか
 * @returns {void}
 */
function showGuaranteeParts(hasGuarantee) {
  document.getElementById("r-guar-cut-row").hidden = !hasGuarantee;
  document.getElementById("r-guar-note").hidden = !hasGuarantee;
  let label = INCOME_LABEL_NORMAL;
  if (hasGuarantee) {
    label = INCOME_LABEL_GUARANTEE;
  }
  document.getElementById("r-in-label").textContent = label;
}

/**
 * マンションの入力欄を読み、計算して結果欄を書きかえる（プラスは緑・マイナスは赤）。
 * @returns {void}
 */
function updateRealEstateView() {
  const inputs = readRealEstateInputs();
  const result = calculateRealEstate(inputs);

  const cashFlowArea = document.getElementById("r-cf");
  cashFlowArea.textContent = formatManSigned(result.monthlyCashFlow);
  let colorClass = "minus";
  if (result.monthlyCashFlow >= 0) {
    colorClass = "plus";
  }
  cashFlowArea.className = "big " + colorClass;

  fillSegments(document.getElementById("r-read"), buildRealEstateReading(result.monthlyCashFlow));
  document.getElementById("r-cfy").textContent = formatManSigned(result.annualCashFlow);
  document.getElementById("r-pay").textContent = formatMan(result.payment);
  document.getElementById("r-in").textContent = formatMan(result.income);
  document.getElementById("r-out").textContent = formatMan(result.expenses);
  showGuaranteeParts(inputs.hasGuarantee);
}
