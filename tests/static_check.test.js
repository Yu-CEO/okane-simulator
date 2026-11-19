/*
 * static_check.test.js：ファイルの中身を文字として調べるテスト（画面は動かさない）
 * 調べること：言い方のルール（AC-30・38）、外部通信がないこと・ファイルの大きさ（AC-32）、
 *   外部リンクが新しいタブで開く設定・年度の注記・注意書きの文言・画面の構造（AC-5・11・20・21・29・42・48〜53）
 * 実行方法：simulator フォルダで `node --test`
 */
const test = require("node:test");
const assert = require("node:assert");
const fs = require("node:fs");
const path = require("node:path");

const ROOT = path.join(__dirname, "..");
// データファイルの大きさの上限（バイト）。仕様 7-8：20KB 以内
const DATA_LIMIT_BYTES = 20 * 1024;
// 最初に読むファイル（HTML・CSS・JS・データ）の合計の上限（バイト）。仕様 7-8：150KB 以内
const TOTAL_LIMIT_BYTES = 150 * 1024;

/**
 * 公開するファイル（html・css・js・data）の一覧を集める。tests・docs・ci は含めない。
 * @returns {string[]} ファイルの絶対パスの一覧
 */
function listPublicFiles() {
  const files = [path.join(ROOT, "index.html")];
  ["css", "js", "data"].forEach(function (folder) {
    fs.readdirSync(path.join(ROOT, folder)).forEach(function (name) {
      files.push(path.join(ROOT, folder, name));
    });
  });
  return files;
}

/**
 * ファイルの中身（文字）を返す。
 * @param {string} filePath ファイルのパス
 * @returns {string} 中身
 */
function readText(filePath) {
  return fs.readFileSync(filePath, "utf8");
}

/**
 * 公開するファイルすべての中身を、空白・改行を取り除いて1つにつなぐ（文言が改行で分かれていても照合できるように）。
 * @returns {string} つないだ文字
 */
function readAllPublicTextWithoutSpaces() {
  return listPublicFiles()
    .map(readText)
    .join("")
    .replace(/\s+/g, "");
}

test("AC-30：画面・コード・データに、すすめる言い方・ランキングの言葉がない", function () {
  const bannedWords = ["おすすめ", "オススメ", "人気", "買うべき", "ランキング"];
  listPublicFiles().forEach(function (filePath) {
    const text = readText(filePath);
    bannedWords.forEach(function (word) {
      assert.ok(!text.includes(word), path.basename(filePath) + " に「" + word + "」があります");
    });
  });
});

test("AC-30・49：GPIF の実績であり商品の成績ではないこと・GPIF とは関係ないことの注意書きがある", function () {
  const all = readAllPublicTextWithoutSpaces();
  assert.ok(all.includes("特定の商品の成績ではなく"));
  assert.ok(all.includes("このツールは GPIF とは関係ありません。".replace(/\s+/g, "")));
});

test("AC-38：データにベンチマーク（比べる基準の指数）や投資信託の言葉がない", function () {
  const data = readText(path.join(ROOT, "data", "gpif_returns.js"));
  ["ベンチマーク", "TOPIX", "MSCI", "投資信託", "インデックス"].forEach(function (word) {
    assert.ok(!data.includes(word), "データに「" + word + "」があります");
  });
});

test("AC-32：外部への通信（fetch・XMLHttpRequest・外部の script/link）がない", function () {
  listPublicFiles().forEach(function (filePath) {
    const text = readText(filePath);
    assert.ok(!/fetch\(|XMLHttpRequest|sendBeacon|WebSocket/.test(text), path.basename(filePath));
  });
  const html = readText(path.join(ROOT, "index.html"));
  assert.ok(!/<(script|link)[^>]+(src|href)="https?:/.test(html));
});

test("AC-32：データファイルは20KB以内、最初に読むファイルの合計は150KB以内", function () {
  const dataSize = fs.statSync(path.join(ROOT, "data", "gpif_returns.js")).size;
  assert.ok(dataSize <= DATA_LIMIT_BYTES, "データが " + dataSize + " バイトあります");
  let total = 0;
  listPublicFiles().forEach(function (filePath) {
    total += fs.statSync(filePath).size;
  });
  assert.ok(total <= TOTAL_LIMIT_BYTES, "合計が " + total + " バイトあります");
});

test("AC-29：外部リンクは新しいタブで開き、rel に noopener noreferrer がある", function () {
  const helper = readText(path.join(ROOT, "js", "dom_helper.js"));
  assert.ok(helper.includes('link.target = "_blank"'));
  assert.ok(helper.includes('link.rel = "noopener noreferrer"'));
  const result = readText(path.join(ROOT, "js", "history_result_view.js"));
  assert.ok(result.includes("出典："));
  assert.ok(result.includes("GPIFウェブサイト（"));
});

test("AC-21：年度が4月〜翌年3月であることの表示と、信託報酬の説明が画面にある", function () {
  const html = readText(path.join(ROOT, "index.html"));
  assert.ok(html.includes("年度は4月〜翌年3月です（GPIF の運用実績が年度単位のため）。"));
  assert.ok(html.includes("年金の運用実績は、個人が払う信託報酬とは別のものです。"));
});

test("AC-20：最初に選ばれているのは「利回りを自分で入れる」で、過去の実績の欄は隠れている", function () {
  const html = readText(path.join(ROOT, "index.html"));
  assert.ok(/name="mode" value="manual" checked/.test(html));
  assert.ok(/<div id="m-history" hidden>/.test(html));
});

test("AC-48：細かく選ぶは最初は閉じていて、手数料の説明の後ろに「分からなければ0のまま」がある", function () {
  const html = readText(path.join(ROOT, "index.html"));
  assert.ok(/<details class="more" id="f-more">/.test(html));
  assert.ok(html.includes("その分を差し引いて計算します。分からなければ0のままで計算できます。"));
});

test("AC-49：「くわしく知りたい人へ」は最初は閉じている", function () {
  const html = readText(path.join(ROOT, "index.html"));
  assert.ok(/<details class="card info" id="info-nisa">/.test(html));
});

test("AC-11・49：注意書き（2-4・7-4・7-6・税金・NISA・2020年度）の文言が仕様どおり1字も違わない", function () {
  const all = readAllPublicTextWithoutSpaces();
  [
    "数字を入れるだけ。計算は端末の中だけで行い、入力内容はどこにも送信されません。",
    "※所得税・住民税の増減（減価償却など）は含みません。実際の税額は税理士や税務署でご確認ください。",
    "このツールは、入力された数字をもとに計算するだけのものです。特定の商品や売買をすすめるものではなく、将来の結果を約束するものでもありません。想定の利回り・金利は仮の数字です。実際の判断はご自身の責任で、必要に応じて専門家にご相談ください。",
    "※家賃保証の条件（差し引かれる額・免責期間など）は契約によって違います。契約書でご確認ください。",
    "過去の実績をもとにした計算です。将来の結果を保証するものではありません。実際には幅の外になることもあります。",
    "表示しているのは年金積立金管理運用独立行政法人（GPIF）の資産ごとの運用実績です。個人が買える特定の商品の成績ではなく、特定の商品をすすめるものでもありません。このツールは GPIF とは関係ありません。",
    "※分配金・売る時期・損益通算などで実際の税額は変わります。",
    "つみたて投資枠の上限は年120万円（月10万円）です。成長投資枠と合わせると年360万円までです。",
    "NISAの生涯の非課税枠は1,800万円（元本ベース）です。超えた分は課税口座になります。",
    "2020年度から、GPIF の資産の分け方が変わっています（為替ヘッジ付きの外国債券を、外国債券から国内債券に移しました）。そのため、2019年度以前と2020年度以後では、同じ資産名でも中身が少し違います。",
    "年金の運用実績は、個人が払う信託報酬とは別のものです。ご自身の商品の信託報酬を入れると、その分を差し引いて計算します。",
    "年度は4月〜翌年3月です（GPIF の運用実績が年度単位のため）。",
  ].forEach(function (sentence) {
    assert.ok(all.includes(sentence.replace(/\s+/g, "")), "文言がありません：" + sentence);
  });
});

test("AC-42・50：左上「← Yu」と「Yuのページへ戻る」が portal へのリンクで、問いかけの見出しと次の行動のボタンがある", function () {
  const html = readText(path.join(ROOT, "index.html"));
  assert.ok(html.includes('<a class="bar-logo" href="https://yu-ceo.github.io/"'));
  assert.ok(html.includes('class="btn btn-sub" href="https://yu-ceo.github.io/">Yuのページへ戻る</a>'));
  assert.ok(html.includes("条件を変えてもう一度"));
  assert.ok(html.includes("毎月3万円を20年続けたら、いくらになる？"));
  assert.ok(!html.includes('class="tabs"'), "上部のタブは廃止");
});

test("AC-5・51：マンション収支は「ほかの計算」から入り、4つの入力以外は「細かく選ぶ」の中にある", function () {
  const html = readText(path.join(ROOT, "index.html"));
  assert.ok(html.includes('id="go-re"') && html.includes("← 積立の計算に戻る"));
  const moreStart = html.indexOf('<details class="more" id="r-more">');
  ["r-vac", "r-fee", "r-pm", "r-tax", "r-guar"].forEach(function (id) {
    assert.ok(html.indexOf('id="' + id + '"') > moreStart, id + " は細かく選ぶの中");
  });
  ["r-rent", "r-loan", "r-rate", "r-yrs"].forEach(function (id) {
    assert.ok(html.indexOf('id="' + id + '"') < moreStart, id + " は外に見える");
  });
});

test("AC-52：データが読めないときの「読み込み直す」「利回りを自分で入れる に切り替える」ボタンがある", function () {
  const html = readText(path.join(ROOT, "index.html"));
  assert.ok(html.includes('id="f-reload"') && html.includes('id="f-back"'));
});

test("AC-53：版番号・「試作」「（仮）」の表示がなく、13px未満の文字がない", function () {
  const html = readText(path.join(ROOT, "index.html"));
  ["試作", "（仮）"].forEach(function (word) {
    assert.ok(!html.includes(word), "「" + word + "」があります");
  });
  const css = readText(path.join(ROOT, "css", "style.css"));
  const sizes = css.match(/font-size:\s*(\d+(?:\.\d+)?)px/g) || [];
  sizes.forEach(function (declaration) {
    assert.ok(parseFloat(declaration.match(/(\d+(?:\.\d+)?)px/)[1]) >= 13, declaration);
  });
});

test("AC-26・29：幅の注意文と出典の形が画面のコードにある", function () {
  const view = readText(path.join(ROOT, "js", "history_result_view.js"));
  assert.ok(view.includes("過去の実績をもとにした計算です。将来の結果を保証するものではありません。実際には幅の外になることもあります。"));
  assert.ok(view.includes("GPIFウェブサイト（"));
});
