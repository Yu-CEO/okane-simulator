/*
 * nisa_view.js：NISAの入力欄を読み、計算結果と注意文を画面に表示する
 * 主な関数：updateNisaView
 * main.js から呼ばれる。計算は nisa_calc.js、表示形式は format.js に任せる。
 */

/**
 * NISAの入力欄を読み、計算して結果欄と注意文を書きかえる。
 * @returns {void}
 */
function updateNisaView() {
  const monthlyMan = toNonNegativeNumber(document.getElementById("n-m").value);
  const years = toNonNegativeNumber(document.getElementById("n-y").value);
  const ratePercent = toNonNegativeNumber(document.getElementById("n-r").value);

  const result = calculateNisa(monthlyMan, years, ratePercent);
  document.getElementById("n-total").textContent = formatMan(result.total);
  document.getElementById("n-prin").textContent = formatMan(result.principal);
  document.getElementById("n-gain").textContent = formatMan(result.gain);

  // 注意文が2つ当てはまるときは、空白でつないで両方表示する
  const warnings = getNisaWarnings(monthlyMan, result.principal);
  const warningArea = document.getElementById("n-warn");
  warningArea.hidden = warnings.length === 0;
  warningArea.textContent = warnings.join(" ");
}
