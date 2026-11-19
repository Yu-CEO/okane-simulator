/*
 * reading_text.test.js：js/reading_text.js（問いかけ・読み方の一言・短い注意の文）の自動テスト
 * 実行方法：simulator フォルダで `node --test`。対応する受け入れ基準：AC-42・43・44・45・46・51・54
 */
const test = require("node:test");
const assert = require("node:assert");
const text = require("../js/reading_text.js");
const { calculateNisa } = require("../js/nisa_calc.js");

const toText = text.segmentsToText;

test("AC-42：問いかけは入力に合わせて変わる", function () {
  const base = { isRealEstate: false, monthlyMan: 3, years: 20, isHistory: false, periodMode: "future", startYear: 2026, endYear: 2045 };
  assert.strictEqual(text.buildQuestionText(base), "毎月3万円を20年続けたら、いくらになる？");
  assert.strictEqual(text.buildQuestionText(Object.assign({}, base, { monthlyMan: 5 })), "毎月5万円を20年続けたら、いくらになる？");
  assert.strictEqual(
    text.buildQuestionText(Object.assign({}, base, { isHistory: true, periodMode: "past" })),
    "毎月3万円を20年前から続けていたら、いくらになっていた？"
  );
  assert.strictEqual(
    text.buildQuestionText(Object.assign({}, base, { isHistory: true, periodMode: "custom", startYear: 2016, endYear: 2035 })),
    "毎月3万円を2016〜2035年度に続けたら、いくらになる？"
  );
  assert.strictEqual(
    text.buildQuestionText(Object.assign({}, base, { isHistory: true, periodMode: "custom", startYear: 2030, endYear: 2020 })),
    "毎月3万円を積み立てたら、いくらになる？"
  );
});

test("AC-42：0のとき・マンションのときの問いかけ", function () {
  const base = { isRealEstate: false, monthlyMan: 0, years: 20, isHistory: false, periodMode: "future" };
  assert.strictEqual(text.buildQuestionText(base), "毎月の積立、何年でいくらになる？");
  assert.strictEqual(text.buildQuestionText(Object.assign({}, base, { isRealEstate: true })), "マンションを貸したら、毎月いくら残る？");
});

test("AC-43：利回りの例の一言（4%のときだけ初期値の断り書きが付く）", function () {
  assert.strictEqual(
    toText(text.buildYieldExample(4)),
    "年4%＝100万円が1年で104万円になるペース。4%は初期値で、正解の数字ではありません。"
  );
  assert.strictEqual(toText(text.buildYieldExample(6)), "年6%＝100万円が1年で106万円になるペース。");
});

test("AC-44：初期値の読み方の一言・短い注意・見出し", function () {
  const result = calculateNisa(3, 20, 4);
  assert.strictEqual(toText(text.buildManualReading(result.principal, result.total)), "入れたお金 720万円 が、約1.5倍になる計算です。");
  assert.strictEqual(
    text.buildManualShortNote(4),
    "年4%がずっと続いた場合の計算です。実際の増え方は年ごとに上下し、減る年もあります。"
  );
  assert.strictEqual(text.buildManualLabel(20, 4), "20年後の金額（年4%で増え続けた場合の想定）");
});

test("AC-44：元本が0のときは0の旨を出し、NaN を出さない", function () {
  const result = calculateNisa(0, 20, 4);
  const reading = toText(text.buildManualReading(result.principal, result.total));
  assert.strictEqual(reading, "毎月の積立額か年数が0のため、結果は0万円です。");
  assert.ok(!reading.includes("NaN"));
});

test("AC-45：幅の読み方の一言（低いほうが元本より小さいとき／そうでないとき）", function () {
  assert.strictEqual(
    toText(text.buildRangeReading(720, 600, 900)),
    "入れたお金は 720万円（点線）。低いほうは点線より左＝入れたお金より減っていることもある、という幅です。"
  );
  assert.strictEqual(toText(text.buildRangeReading(720, 800, 900)), "入れたお金は 720万円（点線）。まんなかは 900万円 の計算です。");
});

test("過去の実績（1つの数字）の読み方の一言", function () {
  const reading = text.buildSingleReading({
    startYear: 2020, years: 1, monthlyMan: 1, principalMan: 12, totalMan: 12.5, assetName: "テスト用A（年金の運用実績）",
  });
  assert.strictEqual(
    toText(reading),
    "もし2020年度から1年間、毎月1万円を続けていたら、入れたお金 12万円 が 12.5万円 になっていた計算です（テスト用A（年金の運用実績））。"
  );
});

test("AC-46：最も悪かった／よかった年度の例（−8%→92万円・+12%→112万円）", function () {
  assert.strictEqual(text.buildExtremeExample(-8), "（100万円が1年で92万円になるくらい）");
  assert.strictEqual(text.buildExtremeExample(12), "（100万円が1年で112万円になるくらい）");
});

test("AC-51：マンション収支の読み方の一言（プラス／マイナス）", function () {
  assert.strictEqual(toText(text.buildRealEstateReading(6.5)), "家賃からローンと費用を払っても、毎月 6.5万円 残る計算です。");
  assert.strictEqual(toText(text.buildRealEstateReading(-3)), "家賃だけでは足りず、毎月 3万円 を自分のお財布から出す計算です。");
});

test("AC-48：「細かく選ぶ」の見出しの今の設定", function () {
  assert.strictEqual(text.buildCurrentSettingText(2026, 2045, 0, false), "今：2026〜2045年度・手数料0%・NISA");
  assert.strictEqual(text.buildCurrentSettingText(2026, 2045, 1, true), "今：2026〜2045年度・手数料1%・課税口座");
});

test("AC-54：読み方の文に、すすめる・約束に見える言い方がない", function () {
  const all = [
    toText(text.buildManualReading(720, 1100)), toText(text.buildRangeReading(720, 600, 900)),
    toText(text.buildRealEstateReading(1)), toText(text.buildYieldExample(4)), text.buildManualShortNote(4),
  ].join("");
  ["おすすめ", "人気", "買うべき", "約束します", "必ず"].forEach(function (word) {
    assert.ok(!all.includes(word), "「" + word + "」があります");
  });
});
