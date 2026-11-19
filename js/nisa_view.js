/*
 * nisa_view.js：「利回りを自分で入れる」の入力欄を読み、結果・棒・読み方の一言・注意を画面に表示する
 * 主な関数：updateNisaView
 * main.js から呼ばれる。計算は nisa_calc.js、文は reading_text.js、棒は bar_view.js、表示形式は format.js に任せる。
 */

/**
 * 入力欄を読み、計算して結果欄を書きかえる。
 * @returns {void}
 */
function updateNisaView() {
  const monthlyMan = toNonNegativeNumber(document.getElementById("n-m").value);
  const years = toNonNegativeNumber(document.getElementById("n-y").value);
  const ratePercent = toNonNegativeNumber(document.getElementById("n-r").value);

  const result = calculateNisa(monthlyMan, years, ratePercent);
  document.getElementById("n-label").textContent = buildManualLabel(years, ratePercent);
  document.getElementById("n-total").textContent = formatMan(result.total);
  document.getElementById("n-prin").textContent = formatMan(result.principal);
  document.getElementById("n-gain").textContent = formatMan(result.gain);
  updateStackBar(document.getElementById("n-bar-p"), document.getElementById("n-bar-g"), result.principal, result.gain);
  fillSegments(document.getElementById("r-ex"), buildYieldExample(ratePercent));
  fillSegments(document.getElementById("n-read"), buildManualReading(result.principal, result.total));
  document.getElementById("n-short").textContent = buildManualShortNote(ratePercent);

  // 注意文が2つ当てはまるときは、空白でつないで両方表示する
  const warnings = getNisaWarnings(monthlyMan, result.principal);
  const warningArea = document.getElementById("n-warn");
  warningArea.hidden = warnings.length === 0;
  warningArea.textContent = warnings.join(" ");
}
