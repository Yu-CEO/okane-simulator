/*
 * tabs.js：タブ（NISA積立／マンション収支）の切り替え
 * 主な関数：showTab（指定したタブを表示）、setupTabs（ボタンを押したときの動きを登録）
 * main.js から呼ばれる。
 */

// タブの名前と、それに対応するボタン・画面のID
const TABS = {
  nisa: { buttonId: "t-nisa", panelId: "p-nisa" },
  re: { buttonId: "t-re", panelId: "p-re" },
};

/**
 * 指定したタブの画面だけを表示し、そのボタンに選択中の印（.on）をつける。
 * @param {string} tabName "nisa" または "re"
 * @returns {void}
 * @example showTab("re") // マンション収支の画面に切り替わる
 */
function showTab(tabName) {
  Object.keys(TABS).forEach(function (name) {
    const isSelected = name === tabName;
    document.getElementById(TABS[name].buttonId).classList.toggle("on", isSelected);
    document.getElementById(TABS[name].panelId).hidden = !isSelected;
  });
}

/**
 * 各タブのボタンを押したときに、そのタブへ切り替わるようにする。
 * @returns {void}
 */
function setupTabs() {
  Object.keys(TABS).forEach(function (name) {
    document.getElementById(TABS[name].buttonId).addEventListener("click", function () {
      showTab(name);
    });
  });
}
