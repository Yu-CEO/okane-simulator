/*
 * next_actions.js：結果のあとの「条件を変えてもう一度」ボタン
 * 主な関数：setupNextActions
 * main.js から呼ばれる。押すと入力のカードへ戻り、最初の入力欄（積立は毎月の額）にカーソルを置く。
 * 「Yuのページへ戻る」は、ふつうのリンク（index.html に書いてある）なのでここでは扱わない。
 */

// スクロールが終わるのを待ってからカーソルを置くための待ち時間（ミリ秒）。すぐ置くと画面がずれるため
const FOCUS_DELAY_MS = 350;

/**
 * 「条件を変えてもう一度」ボタンを使えるようにする（data-again に戻り先のカードの id が書いてある）。
 * @returns {void}
 */
function setupNextActions() {
  document.querySelectorAll("[data-again]").forEach(function (button) {
    button.addEventListener("click", function () {
      const card = document.getElementById(button.dataset.again);
      card.scrollIntoView({ behavior: "smooth", block: "start" });
      const firstInput = card.querySelector("input");
      if (firstInput) {
        setTimeout(function () {
          firstInput.focus({ preventScroll: true });
        }, FOCUS_DELAY_MS);
      }
    });
  });
}
