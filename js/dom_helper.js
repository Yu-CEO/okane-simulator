/*
 * dom_helper.js：画面の部品（要素）を安全につくる小さな道具（ブラウザ専用）
 * 主な関数：createElement、clearChildren（中身を空にする）、fillSegments（太字つきの文をつくる）、createExternalLink（新しいタブで開くリンク）
 * 各 *_view.js から使われる。
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

/**
 * 要素の中身を、文のかけら（reading_text.js の {text, strong}）で書きかえる。太字のかけらは b にする。
 * @param {HTMLElement} element 書きかえる要素
 * @param {{text:string, strong:boolean}[]} segments 文のかけら
 * @returns {void}
 */
function fillSegments(element, segments) {
  clearChildren(element);
  segments.forEach(function (segment) {
    if (segment.strong) {
      element.appendChild(createElement("b", "", segment.text));
    } else {
      element.appendChild(document.createTextNode(segment.text));
    }
  });
}

/**
 * 外のサイトへのリンクをつくる。新しいタブで開き、元の画面の情報を渡さない設定にする。
 * @param {string} url リンク先
 * @param {string} text 表示する文字
 * @returns {HTMLAnchorElement} リンク
 */
function createExternalLink(url, text) {
  const link = createElement("a", "", text);
  link.href = url;
  link.target = "_blank";
  link.rel = "noopener noreferrer";
  return link;
}
