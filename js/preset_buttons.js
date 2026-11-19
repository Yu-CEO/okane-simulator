/*
 * preset_buttons.js：「よく使う値」のボタン（毎月 1万・3万・5万／年数 10・20・30／利回り 2・4・6%）
 * 主な関数：setupPresetButtons（押したときの動きを登録）、syncPresetButtons（入力欄の値と同じボタンを「押された」見た目にする）
 * main.js から呼ばれる。ボタンの値は index.html の data-v に書いてある。数字の手入力もできる。
 */

/**
 * 入力欄の値と同じ値のボタンだけを、選ばれた見た目（黒塗り）にする。
 * @returns {void}
 */
function syncPresetButtons() {
  document.querySelectorAll(".chips").forEach(function (group) {
    const currentValue = parseFloat(document.getElementById(group.dataset.for).value);
    group.querySelectorAll(".chip").forEach(function (button) {
      button.setAttribute("aria-pressed", String(parseFloat(button.dataset.v) === currentValue));
    });
  });
}

/**
 * ボタンを押すと、対応する入力欄にその値を入れて、全体を計算し直すようにする。
 * @param {Function} onChange 値を入れたあとに呼ぶ関数
 * @returns {void}
 */
function setupPresetButtons(onChange) {
  document.querySelectorAll(".chips .chip").forEach(function (button) {
    button.addEventListener("click", function () {
      document.getElementById(button.parentNode.dataset.for).value = button.dataset.v;
      onChange();
    });
  });
}
