/*
 * static_check.test.js：ファイルの中身を文字として調べるテスト（画面は動かさない）
 * 調べること：言い方のルール（AC-30・38）、外部通信がないこと・ファイルの大きさ（AC-32）、
 *   出典リンクが新しいタブで開く設定・年度の注記があること（AC-21・29）
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

test("AC-30：画面・コード・データに、すすめる言い方・ランキングの言葉がない", function () {
  const bannedWords = ["おすすめ", "オススメ", "人気", "買うべき", "ランキング"];
  listPublicFiles().forEach(function (filePath) {
    const text = readText(filePath);
    bannedWords.forEach(function (word) {
      assert.ok(!text.includes(word), path.basename(filePath) + " に「" + word + "」があります");
    });
  });
});

test("AC-30：GPIF の実績であり商品の成績ではないこと・GPIF とは関係ないことの注意書きがある", function () {
  const html = readText(path.join(ROOT, "index.html"));
  assert.ok(html.includes("特定の商品の成績ではなく"));
  assert.ok(html.includes("このツールは GPIF とは関係ありません。"));
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

test("AC-29：出典のリンクは新しいタブで開き、rel に noopener noreferrer がある", function () {
  const view = readText(path.join(ROOT, "js", "history_source_view.js"));
  assert.ok(view.includes('link.target = "_blank"'));
  assert.ok(view.includes('link.rel = "noopener noreferrer"'));
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

test("AC-26・AC-29：幅の注意文と出典の形が画面のコードにある", function () {
  const view = readText(path.join(ROOT, "js", "history_view.js"));
  assert.ok(view.includes("過去の実績をもとにした計算です。将来の結果を保証するものではありません。実際には幅の外になることもあります。"));
  const source = readText(path.join(ROOT, "js", "history_source_view.js"));
  assert.ok(source.includes("GPIFウェブサイト（"));
});
