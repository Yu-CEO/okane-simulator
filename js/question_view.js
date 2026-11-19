/*
 * question_view.js：画面の最初の問いかけ（見出し）を、入力に合わせて書きかえる
 * 主な関数：updateQuestionView
 * main.js・page_switch.js から呼ばれる。文は reading_text.js（buildQuestionText）が作り、ここは画面に入れるだけ。
 */

/**
 * 今の入力と画面の状態を読み、問いかけの見出し（#q）を書きかえる。
 * @returns {void}
 */
function updateQuestionView() {
  const selectedMode = document.querySelector("input[name=mode]:checked").value;
  const text = buildQuestionText({
    isRealEstate: !document.getElementById("p-re").hidden,
    monthlyMan: toNonNegativeNumber(document.getElementById("n-m").value),
    years: toNonNegativeNumber(document.getElementById("n-y").value),
    isHistory: selectedMode === "history" && isHistoryReady(),
    periodMode: getPeriodMode(),
    startYear: parseInt(document.getElementById("f-start").value, 10),
    endYear: parseInt(document.getElementById("f-end").value, 10),
  });
  document.getElementById("q").textContent = text;
}
