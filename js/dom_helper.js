/*
 * dom_helper.js：画面の部品（要素）を安全につくる小さな道具（ブラウザ専用）
 * 主な関数：createElement（タグ・クラス・文字から要素をつくる）、clearChildren（中身を空にする）
 * history_parts_view.js・history_source_view.js・history_view.js から使われる。
 * 文字は textContent（文字として入れる安全な方法）だけで入れ、HTMLとしては解釈させない。
 */

/**
 * 要素を1つつくる。
 * @param {string} tagName タグ名（"div"・"p" など）
 * @param {string} className クラス名（なければ空文字）
 * @param {string} text 中に入れる文字（なければ空文字）
 * @returns {HTMLElement} つくった要素
 * @example createElement("p", "note", "注意") // <p class="note">注意</p>
 */
function createElement(tagName, className, text) {
  const element = document.createElement(tagName);
  if (className) {
    element.className = className;
  }
  if (text) {
    element.textContent = text;
  }
  return element;
}

/**
 * 要素の中身をすべて消す（表示を書き換える前に使う）。
 * @param {HTMLElement} element 空にしたい要素
 * @returns {void}
 */
function clearChildren(element) {
  while (element.firstChild) {
    element.removeChild(element.firstChild);
  }
}
