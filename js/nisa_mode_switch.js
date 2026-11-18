/*
 * nisa_mode_switch.js：NISA積立の「利回りを自分で入れる／過去の実績で計算する」の切り替え
 * 主な関数：showMode（指定した方だけ表示）、setupModeSwitch（ボタンを押したときの動きを登録）
 * main.js から呼ばれる。最初は「利回りを自分で入れる」（v1 の画面と結果のまま）。
 */

/**
 * 指定した計算方法の画面だけを表示し、切り替えボタンの選択も合わせる。
 * 「過去の実績で計算する」に切り替えたときは、すぐ結果を計算して出す。
 * @param {string} modeName "manual"（利回りを自分で入れる）または "history"（過去の実績で計算する）
 * @returns {void}
 * @example showMode("history") // 過去の実績の入力欄が出る
 */
function showMode(modeName) {
  const isHistory = modeName === "history";
  document.querySelector("input[name=mode][value=" + modeName + "]").checked = true;
  document.getElementById("m-manual").hidden = isHistory;
  document.getElementById("m-history").hidden = !isHistory;
  if (isHistory) {
    updateHistoryView();
  }
}

/**
 * 切り替えボタンと、データを読めなかったときの「戻る」ボタンを使えるようにする。
 * @returns {void}
 */
function setupModeSwitch() {
  document.querySelectorAll("input[name=mode]").forEach(function (radio) {
    radio.addEventListener("change", function () {
      showMode(radio.value);
    });
  });
  document.getElementById("f-back").addEventListener("click", function () {
    showMode("manual");
  });
}
