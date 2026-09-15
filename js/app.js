import { course, findLesson, allLessons, PARTS } from "./data/index.js";
import { renderers, activate, isInteractive } from "./cards.js";
import { h, esc, ring, toast, wireCommon, codeBlock } from "./ui.js";
import { store } from "./store.js";
import { CHEATSHEET, GLOSSARY } from "./data/reference.js";

const app = document.getElementById("app");
wireCommon(app);
document.documentElement.dataset.theme = store.theme;

/* ---------------- helpers ---------------- */
const chapterPct = (ch) => {
  const done = ch.lessons.filter(l => store.isDone(l.id)).length;
  return ch.lessons.length ? done / ch.lessons.length : 0;
};
const totals = () => {
  const ls = allLessons();
  return { total: ls.length, done: ls.filter(l => store.isDone(l.id)).length };
};

function topbar(){
  const { done, total } = totals();
  return `<header class="topbar"><div class="topbar-inner">
    <button class="brand" data-go="#/"><span class="crab">🦀</span><span>Rustling</span></button>
    <div class="spacer"></div>
    <span class="pill xp" title="Experience points">⚡ ${store.xp}</span>
    <span class="pill" title="Lessons completed">${done}/${total}</span>
    <button class="icon-btn" data-theme-toggle title="Toggle light / dark">${store.theme === "dark" ? "☀️" : "🌙"}</button>
  </div></header>`;
}

/* ---------------- views ---------------- */
function viewHome(){
  const { done, total } = totals();
  const chDone = course.filter(c => chapterPct(c) === 1).length;
  const next = allLessons().find(l => !store.isDone(l.id)) || allLessons()[0];

  const parts = PARTS.map(part => `
    <div class="part">
      <div class="part-label">${esc(part.label)}</div>
      <div class="ch-list">
        ${course.filter(c => part.chapters.includes(c.id)).map(c => {
          const p = chapterPct(c);
          return `<button class="ch ${p===1?"done":""}" data-go="#/ch/${c.id}">
            <span class="num">${p === 1 ? "✓" : (c.id === 0 ? "◆" : c.id)}</span>
            <span class="meta"><b>${c.emoji} ${esc(c.title)}</b><small>${c.lessons.length} lessons · ${esc(c.blurb)}</small></span>
            <span class="ring">${ring(p)}</span>
          </button>`;
        }).join("")}
      </div>
    </div>`).join("");

  return `${topbar()}
  <main class="wrap">
    <section class="hero">
      <h1>Learn Rust by <span class="grad">tapping, swiping</span><br>and actually getting it.</h1>
      <p>The whole Rust Book, rebuilt as bite-sized interactive cards. Every concept is shown beside the same idea in Python, C, C++, Go and Java — so you learn from what you already know.</p>
      <div class="hero-cta">
        <button class="btn primary" data-go="#/lesson/${next.id}">${done ? "Continue" : "Start learning"} → ${esc(next.title)}</button>
        <button class="btn" data-go="#/cheatsheet">📋 Cheat sheet</button>
        <button class="btn" data-go="#/glossary">📖 Glossary</button>
      </div>
    </section>

    <div class="progress" style="margin:6px 0 4px"><i style="width:${total ? (done/total*100) : 0}%"></i></div>

    <div class="stats">
      <div class="stat"><b>${done}/${total}</b><small>Lessons</small></div>
      <div class="stat"><b>${chDone}/${course.length}</b><small>Chapters</small></div>
      <div class="stat"><b>${store.xp}</b><small>XP</small></div>
      <div class="stat"><b>${store.state.streak}🔥</b><small>Day streak</small></div>
    </div>

    <div class="section-title"><h2>The course</h2><small>follows The Rust Programming Language</small></div>
    <input class="search" id="q" placeholder="🔍 Search lessons — try &quot;ownership&quot;, &quot;lifetimes&quot;, &quot;trait&quot;…" autocomplete="off">
    <div id="results"></div>
    <div id="chapters">${parts}</div>
  </main>
  <footer class="site">Built with 🦀 and curiosity · content follows <em>The Rust Programming Language</em> (Klabnik &amp; Nichols) · <button class="btn ghost" data-reset style="padding:6px 12px;font-size:13px">Reset progress</button></footer>`;
}

function viewChapter(id){
  const ch = course.find(c => c.id === +id);
  if (!ch) return viewHome();
  const p = chapterPct(ch);
  return `${topbar()}
  <main class="wrap">
    <div class="section-title" style="margin-top:20px">
      <button class="btn ghost" data-go="#/" style="padding:7px 12px">←</button>
      <h2>${ch.emoji} Chapter ${ch.id === 0 ? "0" : ch.id}: ${esc(ch.title)}</h2>
    </div>
    <p style="color:var(--fg-dim);margin:0 0 14px">${ch.intro || esc(ch.blurb)}</p>
    <div class="progress" style="margin-bottom:16px"><i style="width:${p*100}%"></i></div>
    <div class="stack">
      ${ch.lessons.map((l, i) => {
        const sc = store.score(l.id);
        return `<button class="lesson-item ${store.isDone(l.id)?"done":""}" data-go="#/lesson/${l.id}">
          <span class="dot">${store.isDone(l.id) ? "✓" : i+1}</span>
          <span class="meta"><b>${esc(l.title)}</b>
            <small>${l.cards.length} cards${sc ? ` · best ${sc.correct}/${sc.total}` : ""}${l.est ? ` · ~${l.est}` : ""}</small></span>
          <span style="color:var(--fg-faint)">›</span>
        </button>`;
      }).join("")}
    </div>
    <div style="height:30px"></div>
  </main>`;
}

/* ---------------- lesson deck ---------------- */
let deck = null;

function viewLesson(lessonId){
  const found = findLesson(lessonId);
  if (!found) return viewHome();
  deck = { ...found, i: 0, correct: 0, asked: 0, answered: new Set() };
  return `${topbar()}
  <section class="deck">
    <div class="deck-head">
      <button class="icon-btn" data-go="#/ch/${found.chapter.id}" title="Back to chapter">←</button>
      <div style="flex:1">
        <div style="font-size:12px;color:var(--fg-faint);margin-bottom:5px">
          Ch ${found.chapter.id} · ${esc(found.lesson.title)} <span data-counter></span>
        </div>
        <div class="progress"><i data-deck-progress style="width:0%"></i></div>
      </div>
    </div>
    <div class="card-area"><div id="cardhost"></div></div>
    <div class="hint" data-hint></div>
  </section>
  <div class="deck-nav"><div class="deck-nav-inner">
    <button class="btn ghost" data-prev>← Back</button>
    <button class="btn primary" style="flex:1" data-next>Next →</button>
  </div></div>`;
}

let cardKeys = {};

function paintCard(){
  const host = document.getElementById("cardhost");
  const { lesson, i } = deck;
  const card = lesson.cards[i];
  const el = h(`<article class="card">${renderers[card.t](card)}</article>`);
  host.innerHTML = "";
  host.appendChild(el);
  window.scrollTo({ top: 0, behavior: "instant" in window ? "instant" : "auto" });

  document.querySelector("[data-deck-progress]").style.width = `${(i) / lesson.cards.length * 100}%`;
  document.querySelector("[data-counter]").textContent = `· ${i+1}/${lesson.cards.length}`;

  const nextBtn = document.querySelector("[data-next]");
  const hint = document.querySelector("[data-hint]");
  const last = i === lesson.cards.length - 1;
  nextBtn.textContent = last ? "Finish lesson ✓" : "Next →";
  document.querySelector("[data-prev]").disabled = i === 0;

  cardKeys = {};
  if (isInteractive(card.t)){
    nextBtn.disabled = !deck.answered.has(i);
    hint.innerHTML = card.t === "swipe"
      ? `Swipe the card, tap a side, or press <kbd>1</kbd>/<kbd>2</kbd>`
      : card.t === "quiz" ? `Tap an answer or press <kbd>1</kbd>–<kbd>4</kbd>` : `Tap the pieces in order`;
    cardKeys = activate(el, card, (ok) => {
      if (!deck.answered.has(i)){
        deck.answered.add(i);
        deck.asked++;
        if (ok){ deck.correct++; store.addXp(10); toast("+10 XP ⚡"); }
      }
      nextBtn.disabled = false;
    });
    if (deck.answered.has(i)) nextBtn.disabled = false;
  } else {
    nextBtn.disabled = false;
    hint.innerHTML = `<kbd>←</kbd> <kbd>→</kbd> to move · <kbd>Esc</kbd> for the chapter`;
  }
}

function finishLesson(){
  const { lesson, chapter } = deck;
  const first = !store.isDone(lesson.id);
  store.completeLesson(lesson.id, deck.correct, Math.max(deck.asked, 1));
  if (first) store.addXp(25);
  const idx = chapter.lessons.findIndex(l => l.id === lesson.id);
  const nextLesson = chapter.lessons[idx+1];
  const nextChapter = course[course.findIndex(c => c.id === chapter.id) + 1];
  const pct = deck.asked ? Math.round(deck.correct / deck.asked * 100) : 100;

  app.innerHTML = `${topbar()}
  <main class="wrap"><div class="card" style="margin:26px auto">
    <div class="kicker">Lesson complete</div>
    <h2>${pct === 100 ? "Flawless 🦀" : pct >= 70 ? "Nicely done 👏" : "Good effort — review and retry 💪"}</h2>
    <div class="score-ring">
      <div class="big">${pct}%</div>
      <div style="color:var(--fg-dim);font-size:14px">${deck.correct} of ${deck.asked} questions correct${first ? " · +25 XP bonus" : ""}</div>
    </div>
    <div class="stack">
      ${nextLesson ? `<button class="btn primary wide" data-go="#/lesson/${nextLesson.id}">Next lesson: ${esc(nextLesson.title)} →</button>`
        : nextChapter ? `<button class="btn primary wide" data-go="#/ch/${nextChapter.id}">Start Chapter ${nextChapter.id}: ${esc(nextChapter.title)} →</button>`
        : `<button class="btn primary wide" data-go="#/">🎉 You finished the whole book! Back to home</button>`}
      <button class="btn wide" data-go="#/lesson/${lesson.id}">↺ Redo this lesson</button>
      <button class="btn ghost wide" data-go="#/ch/${chapter.id}">Back to chapter</button>
    </div>
  </div></main>`;
}

function viewCheatsheet(){
  return `${topbar()}<main class="wrap">
    <div class="section-title" style="margin-top:20px">
      <button class="btn ghost" data-go="#/" style="padding:7px 12px">←</button><h2>📋 Rust cheat sheet</h2>
    </div>
    <p style="color:var(--fg-dim)">Everything worth keeping within arm's reach, grouped the way you'll reach for it.</p>
    <div class="stack">
      ${CHEATSHEET.map(sec => `<div class="card cheat" style="box-shadow:none">
        <h2 style="font-size:17px">${esc(sec.title)}</h2>
        ${sec.note ? `<div class="note">${sec.note}</div>` : ""}
        <div class="table-scroll"><table>
          <tr><th>${esc(sec.cols?.[0] || "Thing")}</th><th>${esc(sec.cols?.[1] || "How")}</th></tr>
          ${sec.rows.map(r => `<tr><td><code>${esc(r[0])}</code></td><td>${r[1]}</td></tr>`).join("")}
        </table></div>
      </div>`).join("")}
    </div><div style="height:36px"></div></main>`;
}

function viewGlossary(){
  return `${topbar()}<main class="wrap">
    <div class="section-title" style="margin-top:20px">
      <button class="btn ghost" data-go="#/" style="padding:7px 12px">←</button><h2>📖 Glossary</h2>
    </div>
    <input class="search" id="gq" placeholder="🔍 Filter terms…" autocomplete="off">
    <div class="stack" style="margin-top:12px" id="glist">
      ${GLOSSARY.map(g => `<div class="gl" data-term="${esc((g.term + " " + g.def).toLowerCase())}">
        <b>${esc(g.term)}</b><p>${g.def}</p></div>`).join("")}
    </div><div style="height:36px"></div></main>`;
}

/* ---------------- router ---------------- */
function render(){
  const hash = location.hash || "#/";
  const [, route, arg] = hash.split("/");
  if (route === "ch") app.innerHTML = viewChapter(arg);
  else if (route === "lesson") { app.innerHTML = viewLesson(decodeURIComponent(arg)); if (deck) paintCard(); }
  else if (route === "cheatsheet") app.innerHTML = viewCheatsheet();
  else if (route === "glossary") app.innerHTML = viewGlossary();
  else app.innerHTML = viewHome();
  if (!route || route === "") wireSearch();
  if (route === "glossary") wireGlossary();
}

function wireSearch(){
  const q = document.getElementById("q"), out = document.getElementById("results"), chs = document.getElementById("chapters");
  if (!q) return;
  q.addEventListener("input", () => {
    const term = q.value.trim().toLowerCase();
    if (term.length < 2){ out.innerHTML = ""; chs.style.display = ""; return; }
    chs.style.display = "none";
    const hits = allLessons().filter(l =>
      l.title.toLowerCase().includes(term) || (l.tags || []).some(t => t.includes(term)) ||
      String(l.chapterTitle).toLowerCase().includes(term)
    ).slice(0, 25);
    out.innerHTML = hits.length
      ? `<div class="stack" style="margin-top:14px">${hits.map(l => `<button class="lesson-item" data-go="#/lesson/${l.id}">
          <span class="dot">${l.id.split(".")[0]}</span>
          <span class="meta"><b>${esc(l.title)}</b><small>Chapter ${l.id.split(".")[0]} · ${esc(l.chapterTitle)}</small></span>
          <span style="color:var(--fg-faint)">›</span></button>`).join("")}</div>`
      : `<p style="color:var(--fg-faint);margin-top:16px">No lesson matches “${esc(term)}”. Try the glossary?</p>`;
  });
}

function wireGlossary(){
  const q = document.getElementById("gq");
  q?.addEventListener("input", () => {
    const t = q.value.trim().toLowerCase();
    document.querySelectorAll("#glist .gl").forEach(el => {
      el.style.display = !t || el.dataset.term.includes(t) ? "" : "none";
    });
  });
}

/* ---------------- global interactions ---------------- */
app.addEventListener("click", (e) => {
  const go = e.target.closest("[data-go]");
  if (go){ location.hash = go.dataset.go; if (location.hash === go.dataset.go) render(); return; }
  if (e.target.closest("[data-theme-toggle]")){
    const t = store.theme === "dark" ? "light" : "dark";
    store.setTheme(t); document.documentElement.dataset.theme = t; render(); return;
  }
  if (e.target.closest("[data-reset]")){
    if (confirm("Reset all progress, XP and streak?")){ store.reset(); render(); toast("Progress reset"); }
    return;
  }
  if (e.target.closest("[data-next]")){ advance(1); return; }
  if (e.target.closest("[data-prev]")){ advance(-1); return; }
});

function advance(dir){
  if (!deck) return;
  const n = deck.i + dir;
  if (n < 0) return;
  if (n >= deck.lesson.cards.length){ finishLesson(); return; }
  deck.i = n;
  paintCard();
}

window.addEventListener("keydown", (e) => {
  if (e.target.matches("input,textarea")) return;
  if (!location.hash.startsWith("#/lesson")) return;
  if (e.key === "ArrowRight"){ const b = document.querySelector("[data-next]"); if (b && !b.disabled) b.click(); }
  else if (e.key === "ArrowLeft") advance(-1);
  else if (e.key === "Escape" && deck) location.hash = `#/ch/${deck.chapter.id}`;
  else if (/^[1-4]$/.test(e.key)) cardKeys.keys?.(e.key);
});

/* touch swipe on the card */
let tx = 0, ty = 0;
app.addEventListener("touchstart", (e) => { tx = e.touches[0].clientX; ty = e.touches[0].clientY; }, { passive:true });
app.addEventListener("touchend", (e) => {
  if (!deck) return;
  const dx = e.changedTouches[0].clientX - tx, dy = e.changedTouches[0].clientY - ty;
  if (Math.abs(dx) < 70 || Math.abs(dx) < Math.abs(dy) * 1.6) return;
  const card = deck.lesson.cards[deck.i];
  if (card.t === "swipe" && cardKeys.swipe && !deck.answered.has(deck.i)) cardKeys.swipe(dx > 0);
  else if (dx < 0){ const b = document.querySelector("[data-next]"); if (b && !b.disabled) b.click(); }
  else advance(-1);
}, { passive:true });

window.addEventListener("hashchange", render);
render();
