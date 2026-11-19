/*
 * realestate_calc.js：マンション収支の計算（画面には触れない）
 * 主な関数：calculateLoanPayment（毎月の返済額）、calculateRentIncome（入ってくる家賃・家賃保証の有無）、
 *           calculateExpenses（返済以外に出ていくお金）、calculateRealEstate（まとめて計算）
 * realestate_view.js から使われる。tests/realestate_calc.test.js でテストする。
 * ブラウザでは普通の <script> で、Node.js では require で読み込める形にしている。
 */

// 名前に RE_ をつけるのは、nisa_calc.js の定数と名前がぶつかるとブラウザでエラーになるため
// （普通の <script> は、ファイルをまたいで同じ場所に定数が置かれる）
const RE_MONTHS_PER_YEAR = 12;
const RE_PERCENT = 100;

// 画面を開いたときの初期値（index.html の入力欄の value と同じ。例と分かる切りのよい値。2026-11-19 v2.2.1）
// 値を変えるときは index.html の入力欄も同じ値にする（tests/realestate_calc.test.js が一致を確かめる）
const RE_DEFAULT_INPUTS = {
  rent: 10,          // 家賃（月・万円）
  vacancy: 5,        // 空室を見込む割合（%）
  loan: 2000,        // 借入額（万円）
  rate: 2,           // 金利（年・%）
  years: 35,         // 返済の年数（年）
  fee: 1,            // 管理費＋修繕積立金（月・万円）
  management: 5,     // 管理会社への手数料（%）
  tax: 10,           // 固定資産税など（年・万円）
  hasGuarantee: false, // 家賃保証（オフ）
  guaranteeCut: 1,   // 家賃保証で差し引かれる額（月・万円）
};

/**
 * 元利均等返済（毎月の返済額が同じになる返し方）で、毎月のローン返済額を計算する。
 * @param {number} loanMan 借入額（万円）
 * @param {number} annualRatePercent 金利（年・%）
 * @param {number} years 返済の年数
 * @returns {number} 毎月の返済額（万円）
 * @example calculateLoanPayment(1200, 0, 10) // 10
 */
function calculateLoanPayment(loanMan, annualRatePercent, years) {
  const monthlyRate = annualRatePercent / RE_PERCENT / RE_MONTHS_PER_YEAR;
  const months = years * RE_MONTHS_PER_YEAR;
  if (months === 0) {
    return 0;
  }
  if (monthlyRate === 0) {
    // 金利0%のときは下の式が0で割ることになるため、借入額を回数で割るだけにする
    return loanMan / months;
  }
  return loanMan * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
}

/**
 * 空室を考慮して、毎月入ってくる家賃（平均）を計算する。
 * 家賃保証がオンのときは、空室の期間も「家賃 − 差し引かれる額」が入る想定。
 * 差し引かれる額が家賃より大きいときは、空室の月の入金を0とする（保証なしより小さくならない）。
 * @param {number} rentMan 家賃（月・万円）
 * @param {number} vacancyPercent 空室を見込む割合（%）
 * @param {boolean} hasGuarantee 空室のときも家賃保証があるか
 * @param {number} guaranteeCutMan 空室のとき差し引かれる額（月・万円）
 * @returns {number} 入ってくる家賃（月・万円）
 * @example calculateRentIncome(10, 10, false, 0) // 9
 * @example calculateRentIncome(10, 10, true, 2)  // 9.8
 */
function calculateRentIncome(rentMan, vacancyPercent, hasGuarantee, guaranteeCutMan) {
  const vacancyRatio = vacancyPercent / RE_PERCENT;
  const incomeWithoutGuarantee = rentMan * (1 - vacancyRatio);
  if (!hasGuarantee) {
    return incomeWithoutGuarantee;
  }
  // 空室の月に入る額。マイナスにはならない（保証会社にお金を払う想定はしないため）
  const vacantMonthIncome = Math.max(0, rentMan - guaranteeCutMan);
  return incomeWithoutGuarantee + vacantMonthIncome * vacancyRatio;
}

/**
 * ローン返済以外に毎月出ていくお金を計算する。
 * 管理会社への手数料は「空室を考慮する前の家賃」にかける（元の動きのまま）。
 * @param {number} rentMan 家賃（月・万円）
 * @param {number} feeMan 管理費＋修繕積立金（月・万円）
 * @param {number} managementPercent 管理会社への手数料（%）
 * @param {number} annualTaxMan 固定資産税など（年・万円）
 * @returns {number} 出ていくお金（月・万円）
 * @example calculateExpenses(10, 1, 5, 12) // 2.5
 */
function calculateExpenses(rentMan, feeMan, managementPercent, annualTaxMan) {
  const managementFee = rentMan * managementPercent / RE_PERCENT;
  const monthlyTax = annualTaxMan / RE_MONTHS_PER_YEAR;
  return feeMan + managementFee + monthlyTax;
}

/**
 * マンション収支をまとめて計算する。
 * @param {{rent:number, vacancy:number, loan:number, rate:number, years:number,
 *          fee:number, management:number, tax:number,
 *          hasGuarantee:boolean, guaranteeCut:number}} inputs 入力値（金額は万円、割合は%）
 * @returns {{payment:number, income:number, expenses:number, monthlyCashFlow:number, annualCashFlow:number}}
 *          返済額・入る家賃・出るお金・毎月と年間の手元に残るお金（万円）
 * @example calculateRealEstate({rent:10, vacancy:10, loan:0, rate:0, years:35, fee:1, management:5,
 *          tax:12, hasGuarantee:false, guaranteeCut:0}).monthlyCashFlow // 6.5
 */
function calculateRealEstate(inputs) {
  const payment = calculateLoanPayment(inputs.loan, inputs.rate, inputs.years);
  const income = calculateRentIncome(inputs.rent, inputs.vacancy, inputs.hasGuarantee, inputs.guaranteeCut);
  const expenses = calculateExpenses(inputs.rent, inputs.fee, inputs.management, inputs.tax);
  const monthlyCashFlow = income - payment - expenses;
  return {
    payment: payment,
    income: income,
    expenses: expenses,
    monthlyCashFlow: monthlyCashFlow,
    annualCashFlow: monthlyCashFlow * RE_MONTHS_PER_YEAR,
  };
}

// Node.js（テスト）から require で使えるようにする。ブラウザには module がないので何もしない
if (typeof module !== "undefined" && module.exports) {
  module.exports = { calculateLoanPayment, calculateRentIncome, calculateExpenses, calculateRealEstate, RE_DEFAULT_INPUTS };
}
