/*
 * nisa_mode_switch.js：積立の「利回りを自分で入れる／過去の実績で計算する」の切り替え
 * 主な関数：showMode（指定した方だけ表示）、setupModeSwitch（ボタンを押したときの動きを登録）
 * main.js から呼ばれる。最初は「利回りを自分で入れる」。
 * データを読めなかったときは、過去の実績の結果の代わりに理由と2つのボタンを出し、次の行動の2ボタンは隠す（仕様 8-7）。
 */

/**
 * 指定した計算方法の画面だけを表示し、切り替えボタンの選択も合わせる。
 * @param {string} modeName "manual"（利回りを自分で入れる）または "history"（過去の実績で計算する）
 * @returns {void}
 * @example showMode("history") // 過去の実績の入力欄と結果が出る
 */
function showMode(modeName) {
  const isHistory = modeName === "history";
  const isFailed = isHistory && !isHistoryReady();
  document.querySelector("input[name=mode][value=" + modeName + "]").checked = true;
  document.getElementById("m-manual").hidden = isHistory;
  document.getElementById("m-history").hidden = !isHistory;
  document.getElementById("f-inputs").hidden = isFailed;
  document.getElementById("n-result").hidden = isHistory;
  document.getElementById("f-result").hidden = !isHistory || isFailed;
  document.getElementById("f-fail").hidden = !isFailed;
  document.getElementById("next-nisa").hidden = isFailed;
  document.getElementById("info-history").hidden = !isHistory || isFailed;
  document.getElementById("info-manual").hidden = isHistory;
}

/**
 * 切り替えボタンと、データを読めなかったときの2つのボタンを使えるようにする。
 * @param {Function} onChange 切り替えたあとに全体を計算し直す関数
 * @returns {void}
 */
function setupModeSwitch(onChange) {
  document.querySelectorAll("input[name=mode]").forEach(function (radio) {
    radio.addEventListener("change", function () {
      showMode(radio.value);
      onChange();
    });
  });
  document.getElementById("f-back").addEventListener("click", function () {
    showMode("manual");
    onChange();
  });
  document.getElementById("f-reload").addEventListener("click", function () {
    location.reload();
  });
}
