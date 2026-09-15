import { highlight, normLang, LANG_LABEL } from "./highlight.js";

export const h = (html) => { const t = document.createElement("template"); t.innerHTML = html.trim(); return t.content.firstElementChild; };
export const esc = (s) => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

/** Render a code block with a language label and copy button. */
export function codeBlock(src, lang = "rust", label){
  const L = normLang(lang);
  const title = label || LANG_LABEL[L] || "Code";
  return `<div class="code">
    <div class="code-head">${esc(title)}</div>
    <button class="copy" data-copy>Copy</button>
    <pre><code>${highlight(src.replace(/\s+$/,""), lang)}</code></pre>
  </div>`;
}

/** Render the "same idea in other languages" tabbed panel. */
export function comparePanel(compare, uid){
  if (!compare || !compare.langs) return "";
  const keys = Object.keys(compare.langs);
  const tabs = keys.map((k,i) =>
    `<button class="tab" role="tab" data-cmp="${uid}" data-lang="${k}" aria-selected="${i===0}">${esc(LANG_LABEL[normLang(k)] || k)}</button>`
  ).join("");
  const bodies = keys.map((k,i) => {
    const item = compare.langs[k];
    const src = typeof item === "string" ? item : item.src;
    const note = typeof item === "string" ? "" : item.note;
    return `<div data-cmp-body="${uid}" data-lang="${k}" ${i===0?"":"hidden"}>
      ${codeBlock(src, k)}
      ${note ? `<div class="compare-note">${note}</div>` : ""}
    </div>`;
  }).join("");
  return `<div class="compare">
    <div class="compare-head">🌍 Same idea in a language you already know</div>
    <div class="tabs" role="tablist">${tabs}</div>
    <div class="compare-body">${bodies}</div>
  </div>
  ${compare.note ? `<div class="note">${compare.note}</div>` : ""}`;
}

export function ring(pct, size = 34){
  const r = (size/2) - 2.5, c = 2*Math.PI*r;
  return `<svg class="ring" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}" aria-hidden="true">
    <circle class="bg" cx="${size/2}" cy="${size/2}" r="${r}"></circle>
    <circle class="fg" cx="${size/2}" cy="${size/2}" r="${r}" stroke-dasharray="${c}" stroke-dashoffset="${c*(1-pct)}"></circle>
  </svg>`;
}

let toastTimer;
export function toast(msg){
  const el = document.getElementById("toast");
  el.textContent = msg; el.classList.add("show");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.remove("show"), 1600);
}

/** Delegated handlers for copy buttons and comparison tabs. */
export function wireCommon(root){
  root.addEventListener("click", (e) => {
    const copy = e.target.closest("[data-copy]");
    if (copy){
      const code = copy.parentElement.querySelector("pre code");
      navigator.clipboard?.writeText(code.innerText).then(
        () => toast("Copied 📋"),
        () => toast("Copy blocked by browser")
      );
      return;
    }
    const tab = e.target.closest("[data-cmp]");
    if (tab){
      const uid = tab.dataset.cmp, lang = tab.dataset.lang;
      root.querySelectorAll(`[data-cmp="${uid}"]`).forEach(t => t.setAttribute("aria-selected", String(t === tab)));
      root.querySelectorAll(`[data-cmp-body="${uid}"]`).forEach(b => { b.hidden = b.dataset.lang !== lang; });
    }
  });
}
