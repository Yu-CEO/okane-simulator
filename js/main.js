/*
 * main.js：入口。全体の流れだけを書く
 * 1. タブのボタンを使えるようにする（tabs.js）
 * 2. どの入力欄でも、数字を変えるたびに両方の結果を計算し直す（nisa_view.js・realestate_view.js）
 * 3. ページを開いた時点で、初期値の結果を表示する
 * index.html の最後に読み込まれる。
 */

/**
 * NISAとマンションの両方の結果を計算し直して表示する。
 * @returns {void}
 */
function updateAllResults() {
  updateNisaView();
  updateRealEstateView();
}

setupTabs();
// 計算ボタンはなく、入力のたびにすぐ再計算する（入力欄の中身が変わるたびにブラウザが出す合図＝input イベントを使う。チェック欄もオン・オフで出る）
document.querySelectorAll("input").forEach(function (inputElement) {
  inputElement.addEventListener("input", updateAllResults);
});
updateAllResults();
