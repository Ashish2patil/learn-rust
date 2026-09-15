import { codeBlock, comparePanel, esc } from "./ui.js";

let uid = 0;
const nextUid = () => `c${++uid}`;

/** Every card type knows how to render itself and (optionally) be answered. */
export const renderers = {
  concept(card){
    const id = nextUid();
    const code = card.code ? codeBlock(card.code.src, card.code.lang || "rust", card.code.label) : "";
    return `
      ${card.kicker ? `<div class="kicker">${esc(card.kicker)}</div>` : ""}
      <h2>${card.title}</h2>
      ${card.codeFirst ? code : ""}
      ${(card.body || []).map(p => `<p>${p}</p>`).join("")}
      ${card.list ? `<ul>${card.list.map(li => `<li>${li}</li>`).join("")}</ul>` : ""}
      ${card.codeFirst ? "" : code}
      ${card.after ? card.after.map(p => `<p>${p}</p>`).join("") : ""}
      ${card.code2 ? codeBlock(card.code2.src, card.code2.lang || "rust", card.code2.label) : ""}
      ${card.out ? codeBlock(card.out, "text", "Output") : ""}
      ${card.note ? `<div class="note ${card.note.warn ? "warn" : ""}">${card.note.html || card.note}</div>` : ""}
      ${comparePanel(card.compare, id)}
    `;
  },

  quiz(card){
    const letters = "ABCD EFGH".split("");
    return `
      <div class="kicker">Quick check</div>
      <h2>${card.q}</h2>
      ${card.code ? codeBlock(card.code.src || card.code, card.code.lang || "rust", card.code.label) : ""}
      ${card.hint ? `<div class="note">${card.hint}</div>` : ""}
      <div class="options" data-quiz>
        ${card.options.map((o,i) => `<button class="opt" data-i="${i}"><span class="key">${letters[i]}</span><span class="txt">${o}</span></button>`).join("")}
      </div>
      <div data-feedback></div>
    `;
  },

  swipe(card){
    return `
      <div class="kicker">True or false — swipe or tap</div>
      <div class="statement">${card.statement}</div>
      ${card.code ? codeBlock(card.code.src || card.code, card.code.lang || "rust", card.code.label) : ""}
      <div class="swipe-zone" data-swipe>
        <button class="swipe-btn no" data-v="false">👈 False<small>swipe left</small></button>
        <button class="swipe-btn yes" data-v="true">True 👉<small>swipe right</small></button>
      </div>
      <div data-feedback></div>
    `;
  },

  order(card){
    return `
      <div class="kicker">Build it</div>
      <h2>${card.prompt}</h2>
      ${card.note ? `<div class="note">${card.note}</div>` : ""}
      <div class="slot-line" data-slots></div>
      <div class="chips" data-pieces>
        ${card.pieces.map((p,i) => `<button class="chip" data-p="${i}">${esc(p)}</button>`).join("")}
      </div>
      <div class="row" style="gap:8px">
        <button class="btn ghost" data-order-reset type="button">↺ Reset</button>
        <button class="btn primary" data-order-check type="button">Check</button>
      </div>
      <div data-feedback></div>
    `;
  },

  summary(card){
    return `
      <div class="kicker">Recap</div>
      <h2>${card.title || "What you just learned"}</h2>
      <div class="sum-list">
        ${card.points.map(p => `<div class="sum-item"><span class="ic">▸</span><div>${p}</div></div>`).join("")}
      </div>
      ${card.code ? codeBlock(card.code.src, card.code.lang || "rust", card.code.label) : ""}
      ${card.note ? `<div class="note">${card.note.html || card.note}</div>` : ""}
    `;
  }
};

export const isInteractive = (t) => t === "quiz" || t === "swipe" || t === "order";

/** Wire up answering for one rendered card. onDone(correct:boolean) fires once. */
export function activate(cardEl, card, onDone){
  const fb = cardEl.querySelector("[data-feedback]");
  const say = (ok, why) => {
    fb.innerHTML = `<div class="feedback ${ok ? "good" : "bad"}">
      <b>${ok ? "✅ Correct!" : "❌ Not quite"}</b><p>${why || ""}</p></div>`;
  };

  if (card.t === "quiz"){
    const box = cardEl.querySelector("[data-quiz]");
    box.addEventListener("click", (e) => {
      const btn = e.target.closest(".opt");
      if (!btn || box.dataset.answered) return;
      box.dataset.answered = "1";
      const i = +btn.dataset.i, ok = i === card.answer;
      box.querySelectorAll(".opt").forEach((b, j) => {
        b.disabled = true;
        if (j === card.answer) b.classList.add("correct");
        else if (j === i) b.classList.add("wrong");
      });
      say(ok, card.why);
      onDone(ok);
    });
    return { keys: (k) => { const i = "1234".indexOf(k); if (i >= 0) box.querySelectorAll(".opt")[i]?.click(); } };
  }

  if (card.t === "swipe"){
    const box = cardEl.querySelector("[data-swipe]");
    const answer = (v) => {
      if (box.dataset.answered) return;
      box.dataset.answered = "1";
      const ok = v === card.answer;
      box.querySelectorAll(".swipe-btn").forEach(b => {
        b.disabled = true;
        if ((b.dataset.v === "true") === card.answer) b.classList.add("correct");
      });
      cardEl.classList.add(v ? "swipe-right" : "swipe-left");
      setTimeout(() => cardEl.classList.remove("swipe-right","swipe-left"), 310);
      say(ok, card.why);
      onDone(ok);
    };
    box.addEventListener("click", (e) => {
      const b = e.target.closest(".swipe-btn");
      if (b) answer(b.dataset.v === "true");
    });
    return { swipe: answer, keys: (k) => { if (k === "1") answer(false); if (k === "2") answer(true); } };
  }

  if (card.t === "order"){
    const slots = cardEl.querySelector("[data-slots]");
    const pieces = cardEl.querySelector("[data-pieces]");
    let picked = [];
    const paint = () => {
      slots.innerHTML = picked.map(i => `<span class="chip">${esc(card.pieces[i])}</span>`).join("");
      pieces.querySelectorAll(".chip").forEach((c, i) => c.classList.toggle("picked", picked.includes(i)));
    };
    pieces.addEventListener("click", (e) => {
      const c = e.target.closest(".chip");
      if (c && !slots.dataset.answered){ picked.push(+c.dataset.p); paint(); }
    });
    cardEl.querySelector("[data-order-reset]").addEventListener("click", () => {
      if (slots.dataset.answered) return;
      picked = []; paint();
    });
    cardEl.querySelector("[data-order-check]").addEventListener("click", () => {
      if (slots.dataset.answered) return;
      slots.dataset.answered = "1";
      const ok = picked.length === card.answer.length && picked.every((v, i) => v === card.answer[i]);
      if (!ok){
        slots.innerHTML = card.answer.map(i => `<span class="chip">${esc(card.pieces[i])}</span>`).join("");
      }
      say(ok, card.why);
      onDone(ok);
    });
    return {};
  }
  return {};
}
