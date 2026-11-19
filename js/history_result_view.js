/*
 * history_result_view.js：「過去の実績で計算する」の結果の中身（数字・棒・読み方の一言・注意・出典の1行）を組み立てる
 * 主な関数：renderHistoryResult（結果全体）、renderHistoryError（年度がおかしいときの案内）
 * history_view.js から使われる。計算は history_run.js、部品は history_parts_view.js・bar_view.js、文は reading_text.js。
 * 注意書きの文言は仕様どおり（変えない）。GPIF の注意と出典の1行は、畳まずに常に出す（GPIF の引用条件のため）。
 */

const NOTE_RANGE = "過去の実績をもとにした計算です。将来の結果を保証するものではありません。実際には幅の外になることもあります。";
const NOTE_RANGE_PLAIN = "過去と同じくらいばらつくと、だいたいこの範囲";
const NOTE_TAX = "※分配金・売る時期・損益通算などで実際の税額は変わります。";
const NOTE_GPIF =
  "表示しているのは年金積立金管理運用独立行政法人（GPIF）の資産ごとの運用実績です。個人が買える特定の商品の成績ではなく、特定の商品をすすめるものでもありません。このツールは GPIF とは関係ありません。";
const NOTE_YEAR_FIX = "「細かく選ぶ」の年度を直すか、下のボタンで期間を戻してください。";

/**
 * 結果が1つの数字のとき（終了年度がデータの最後の年度以前）の表示を足す。
 * @param {HTMLElement} body 結果を入れる要素
 * @param {Object} result runHistory の結果
 * @param {Object} inputs 入力
 * @param {Object} asset 選んでいる資産
 * @returns {void}
 */
function appendSingleResult(body, result, inputs, asset) {
  body.appendChild(createElement("div", "label", inputs.endYear + "年度末の金額（過去の実績で計算）"));
  body.appendChild(createElement("div", "big", formatMan(result.totals.mid)));
  const reading = createElement("p", "read", "");
  fillSegments(
    reading,
    buildSingleReading({
      startYear: inputs.startYear,
      years: inputs.endYear - inputs.startYear + 1,
      monthlyMan: inputs.monthlyMan,
      principalMan: result.principal,
      totalMan: result.totals.mid,
      assetName: asset.name,
    })
  );
  body.appendChild(reading);
  body.appendChild(createRow("入れたお金（元本）", formatMan(result.principal), "", ""));
  body.appendChild(createRow("増えた額", formatMan(result.gainMid), gainClassName(result.gainMid), ""));
  if (result.taxes) {
    body.appendChild(createRow("税金（約" + TAX_RATE_TEXT + "）", formatMan(result.taxes.mid.tax), "", "after"));
    body.appendChild(createRow("税引き後の最終額", formatMan(result.taxes.mid.afterTax), "", ""));
  }
}

/**
 * 結果が「下 〜 上」の幅のとき（終了年度がデータの最後の年度より後）の表示を足す。1本の数字にはしない。
 * @param {HTMLElement} body 結果を入れる要素
 * @param {Object} result runHistory の結果
 * @param {Object} inputs 入力
 * @returns {void}
 */
function appendRangeResult(body, result, inputs) {
  const totals = result.totals;
  body.appendChild(createElement("div", "label", inputs.endYear + "年度末の金額のめやす（下 〜 上）"));
  body.appendChild(createElement("div", "big range", formatManShort(totals.low) + " 〜 " + formatMan(totals.high)));
  body.appendChild(createThreeBoxes(totals.low, totals.mid, totals.high));
  body.appendChild(createRangeBar(totals.low, totals.mid, totals.high, result.principal));
  body.appendChild(createElement("p", "plain", NOTE_RANGE_PLAIN));
  const reading = createElement("p", "read", "");
  fillSegments(reading, buildRangeReading(result.principal, totals.low, totals.mid));
  body.appendChild(reading);
  body.appendChild(createElement("p", "rangenote", NOTE_RANGE));
  body.appendChild(createRow("入れたお金（元本）", formatMan(result.principal), "", ""));
  body.appendChild(createRow("増えた額（中央）", formatMan(result.gainMid), gainClassName(result.gainMid), ""));
  if (result.taxes) {
    body.appendChild(createRow("税金（中央・約" + TAX_RATE_TEXT + "）", formatMan(result.taxes.mid.tax), "", "after"));
    body.appendChild(
      createRow("税引き後の最終額", formatManShort(result.taxes.low.afterTax) + " 〜 " + formatMan(result.taxes.high.afterTax), "", "")
    );
    body.appendChild(createRow("（中央）", formatMan(result.taxes.mid.afterTax), "", ""));
  }
}

/**
 * 結果の下の条件つきの注意（信託報酬の一言・税金の注意・NISAの上限の注意・積立額0の一言）を足す。
 * @param {HTMLElement} body 結果を入れる要素
 * @param {Object} inputs 入力
 * @param {Object} result runHistory の結果
 * @returns {void}
 */
function appendConditionalNotes(body, inputs, result) {
  if (inputs.feePercent > 0) {
    body.appendChild(createElement("p", "short", "信託報酬など 年" + inputs.feePercent + "% を毎年度差し引いています。"));
  }
  if (inputs.isTaxable) {
    body.appendChild(createElement("p", "warn", NOTE_TAX));
  } else {
    const warnings = getNisaWarnings(inputs.monthlyMan, result.principal);
    if (warnings.length > 0) {
      body.appendChild(createElement("p", "warn", warnings.join(" ")));
    }
  }
  if (inputs.monthlyMan === 0) {
    body.appendChild(createElement("p", "help", "毎月の積立額が0のため、結果は0万円です。"));
  }
}

/**
 * 結果カードの最後に、GPIF の注意と出典の1行を足す（常に表示・畳まない）。
 * @param {HTMLElement} body 結果を入れる要素
 * @param {Object} source 出典（url など）
 * @returns {void}
 */
function appendGpifFooter(body, source) {
  body.appendChild(createElement("p", "gpif", NOTE_GPIF));
  const line = createElement("p", "srcline", "出典：");
  const link = createExternalLink(source.url, "GPIFウェブサイト（" + source.url + "）");
  line.appendChild(link);
  body.appendChild(line);
}

/**
 * 計算できたときの結果全体を組み立てる（年度の帯→数字→注意→最も悪い／よい年度→GPIFの注意と出典）。
 * @param {HTMLElement} body 結果を入れる要素（先に空にしておく）
 * @param {Object} asset 選んでいる資産
 * @param {Object} inputs 入力
 * @param {Object} result runHistory の結果（error が空のもの）
 * @returns {void}
 */
function renderHistoryResult(body, asset, inputs, result) {
  body.appendChild(createTimeline(inputs.startYear, inputs.endYear, result.pastYears, result.futureYears, result.lastDataYear));
  if (result.isRange) {
    appendRangeResult(body, result, inputs);
  } else {
    appendSingleResult(body, result, inputs, asset);
  }
  body.appendChild(createExtremes(asset));
  if (needsClassificationNote(asset.id, inputs.startYear, inputs.endYear)) {
    body.appendChild(createElement("p", "short", CLASSIFICATION_CHANGE_NOTE));
  }
  appendConditionalNotes(body, inputs, result);
  appendGpifFooter(body, asset.source);
}

/**
 * 年度がおかしいときの案内（理由・直し方・「期間を戻す」ボタン）を出す。NaN・エラーは出さない。
 * @param {HTMLElement} body 結果を入れる要素（先に空にしておく）
 * @param {string} message 計算側が返した案内文
 * @param {number} defaultYears 戻すときの年数（ボタンの文字に使う）
 * @param {Function} onReset ボタンを押したときに呼ぶ関数
 * @returns {void}
 */
function renderHistoryError(body, message, defaultYears, onReset) {
  body.appendChild(createElement("div", "label", "計算できません"));
  body.appendChild(createElement("p", "err", message));
  body.appendChild(createElement("p", "help", NOTE_YEAR_FIX));
  const button = createElement("button", "btn btn-sub", "期間を「これから" + defaultYears + "年」に戻す");
  button.type = "button";
  button.id = "f-reset-period";
  button.addEventListener("click", onReset);
  body.appendChild(button);
}
