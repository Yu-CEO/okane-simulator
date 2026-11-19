/*
 * page_switch.js：積立の画面 ⇔ マンション収支の画面の切り替え（上のタブの代わり）
 * 主な関数：showPage（画面を切り替える）、setupPageSwitch（ボタンの動きを登録）
 * main.js から呼ばれる。「ほかの計算」ボタンでマンション収支へ、「← 積立の計算に戻る」で積立へ。
 */

/**
 * 指定した画面だけを表示し、問いかけの見出しを合わせ、画面の上に戻す。
 * @param {boolean} showRealEstate マンション収支を出すなら true、積立なら false
 * @returns {void}
 */
function showPage(showRealEstate) {
  document.getElementById("p-nisa").hidden = showRealEstate;
  document.getElementById("p-re").hidden = !showRealEstate;
  updateQuestionView();
  window.scrollTo(0, 0);
}

/**
 * 切り替えのボタンを使えるようにする。
 * @returns {void}
 */
function setupPageSwitch() {
  document.getElementById("go-re").addEventListener("click", function () {
    showPage(true);
  });
  document.getElementById("go-nisa").addEventListener("click", function () {
    showPage(false);
  });
}
