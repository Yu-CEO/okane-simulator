/*
 * realestate_calc.test.js：js/realestate_calc.js（マンション収支の計算・家賃保証）の自動テスト
 * 実行方法：simulator フォルダで `node --test`
 * 数字はすべて仕様書の受け入れ基準どおりの仮の数字。
 */
const test = require("node:test");
const assert = require("node:assert");
const { calculateRentIncome, calculateRealEstate } = require("../js/realestate_calc.js");
const { formatMan, formatManSigned } = require("../js/format.js");

// 画面の初期値（仕様書 2-2）。テストでは必要な項目だけ上書きして使う
const DEFAULT_INPUTS = {
  rent: 8, vacancy: 5, loan: 2000, rate: 1.8, years: 35,
  fee: 1.5, management: 5, tax: 8, hasGuarantee: false, guaranteeCut: 1,
};

/**
 * 初期値に、テストで変えたい項目だけを上書きした入力値を作る。
 * @param {object} changes 変えたい項目
 * @returns {object} 入力値
 */
function makeInputs(changes) {
  return Object.assign({}, DEFAULT_INPUTS, changes);
}

test("AC-6：家賃10・借入1200・金利0・10年（ほか0）は返済10万円、毎月+0万円", function () {
  const result = calculateRealEstate(makeInputs({
    rent: 10, vacancy: 0, loan: 1200, rate: 0, years: 10, fee: 0, management: 0, tax: 0,
  }));
  assert.strictEqual(formatMan(result.payment), "10万円");
  assert.strictEqual(formatManSigned(result.monthlyCashFlow), "+0万円");
  assert.ok(result.monthlyCashFlow >= 0); // 0以上なので緑で表示される
});

test("AC-7：家賃10・空室10・借入0・管理費等1・手数料5・税金12 は 9／2.5／+6.5／+78", function () {
  const result = calculateRealEstate(makeInputs({
    rent: 10, vacancy: 10, loan: 0, fee: 1, management: 5, tax: 12,
  }));
  assert.strictEqual(formatMan(result.income), "9万円");
  assert.strictEqual(formatMan(result.expenses), "2.5万円");
  assert.strictEqual(formatManSigned(result.monthlyCashFlow), "+6.5万円");
  assert.strictEqual(formatManSigned(result.annualCashFlow), "+78万円");
});

test("AC-8a：家賃10・空室10・家賃保証オン・差し引き2 は入る家賃9.8万円、オフに戻すと9万円", function () {
  const changes = { rent: 10, vacancy: 10, loan: 0, fee: 0, management: 0, tax: 0, guaranteeCut: 2 };
  const withGuarantee = calculateRealEstate(makeInputs(Object.assign({}, changes, { hasGuarantee: true })));
  assert.strictEqual(formatMan(withGuarantee.income), "9.8万円");
  const withoutGuarantee = calculateRealEstate(makeInputs(Object.assign({}, changes, { hasGuarantee: false })));
  assert.strictEqual(formatMan(withoutGuarantee.income), "9万円");
});

test("AC-8b：差し引かれる額20（家賃より大きい）でも入る家賃は9万円（保証なしより小さくならない）", function () {
  assert.strictEqual(formatMan(calculateRentIncome(10, 10, true, 20)), "9万円");
});

test("AC-8：家賃5・借入3000・金利2・20年（ほか初期値）は毎月がマイナス", function () {
  const result = calculateRealEstate(makeInputs({ rent: 5, loan: 3000, rate: 2, years: 20 }));
  assert.ok(result.monthlyCashFlow < 0);
  assert.ok(formatManSigned(result.monthlyCashFlow).startsWith("−"));
});

test("AC-9：返済の年数0・すべて0でもNaNにならない", function () {
  const result = calculateRealEstate({
    rent: 0, vacancy: 0, loan: 0, rate: 0, years: 0,
    fee: 0, management: 0, tax: 0, hasGuarantee: false, guaranteeCut: 0,
  });
  assert.strictEqual(result.payment, 0);
  assert.strictEqual(formatManSigned(result.monthlyCashFlow), "+0万円");
});

test("AC-15：家賃保証オフの計算は、ファイル分けの前の式と同じ結果になる", function () {
  // ファイル分けの前の index.html にあった式を、ここにそのまま書いて比べる
  const inputs = makeInputs({});
  const monthlyRate = inputs.rate / 100 / 12;
  const months = inputs.years * 12;
  const oldPayment = inputs.loan * monthlyRate / (1 - Math.pow(1 + monthlyRate, -months));
  const oldIncome = inputs.rent * (1 - inputs.vacancy / 100);
  const oldExpenses = inputs.fee + inputs.rent * inputs.management / 100 + inputs.tax / 12;
  const result = calculateRealEstate(inputs);
  assert.strictEqual(result.payment, oldPayment);
  assert.strictEqual(result.income, oldIncome);
  assert.strictEqual(result.expenses, oldExpenses);
  assert.strictEqual(result.monthlyCashFlow, oldIncome - oldPayment - oldExpenses);
});
