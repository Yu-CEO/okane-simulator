/*
 * main.js：入口。全体の流れだけを書く
 * 1. タブのボタンと、NISAの計算方法の切り替えを使えるようにする（tabs.js・nisa_mode_switch.js）
 * 2. 過去の実績モードの資産ボタン・年度リストを用意する（history_view.js）
 * 3. どの入力欄でも、数字を変えるたびに結果を計算し直す（nisa_view.js・realestate_view.js・history_view.js）
 * 4. ページを開いた時点で、初期値の結果を表示する（最初は「利回りを自分で入れる」）
 * index.html の最後に読み込まれる。
 */

/**
 * NISA（自分で入れる利回り・過去の実績）とマンションの結果を計算し直して表示する。
 * @returns {void}
 */
function updateAllResults() {
  updateNisaView();
  updateRealEstateView();
  updateHistoryView();
}

setupTabs();
setupHistoryView();
setupModeSwitch();
// 計算ボタンはなく、入力のたびにすぐ再計算する（入力欄の中身が変わるたびにブラウザが出す合図＝input イベントを使う。チェック欄もオン・オフで出る）
document.querySelectorAll("input").forEach(function (inputElement) {
  inputElement.addEventListener("input", updateAllResults);
});
updateAllResults();
