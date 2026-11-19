/*
 * main.js：入口。全体の流れだけを書く
 * 1. 画面の切り替え・計算方法の切り替え・値のボタン・次の行動のボタンを使えるようにする
 *    （page_switch.js・nisa_mode_switch.js・preset_buttons.js・next_actions.js）
 * 2. 過去の実績モードの資産ボタンを用意する（history_view.js）
 * 3. どの入力欄でも、数字を変えるたびに結果と問いかけを計算し直す
 * 4. ページを開いた時点で、初期値の結果を表示する（最初は積立の「利回りを自分で入れる」）
 * index.html の最後に読み込まれる。
 */

/**
 * 積立（自分で入れる利回り・過去の実績）・マンションの結果と、問いかけ・値のボタンの見た目を計算し直して表示する。
 * @returns {void}
 */
function updateAllResults() {
  updateNisaView();
  updateRealEstateView();
  updateHistoryView();
  updateQuestionView();
  syncPresetButtons();
}

setupHistoryView(updateAllResults);
setupPageSwitch();
setupModeSwitch(updateAllResults);
setupPresetButtons(updateAllResults);
setupNextActions();
// 計算ボタンはなく、入力のたびにすぐ再計算する（入力欄の中身が変わるたびにブラウザが出す合図＝input イベントを使う。チェック欄もオン・オフで出る）
document.querySelectorAll("input").forEach(function (inputElement) {
  inputElement.addEventListener("input", updateAllResults);
});
showMode("manual");
updateAllResults();
