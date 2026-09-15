# 🦀 Rustling — learn Rust by tapping and swiping

An interactive, dependency-free web app that teaches **the whole of _The Rust Programming Language_**
as small decks of cards: a concept, a question, a recap, then straight on to the next thing.

Every concept also shows **the same idea in a language you already know** — Python, C, C++, Go, Java
(and JavaScript where it's the clearer comparison) — so you learn Rust by anchoring it to what you
already understand.

## What's inside

- **22 chapters, 62 lessons, 336 cards** — chapter 0 (why Rust) through chapter 21 (the multithreaded
  web server final project), following the structure of the official book.
- **Four interaction types** — multiple choice, true/false swipe cards, drag-free "build it in order"
  cards, and recap summaries.
- **Language comparison tabs** on every concept card.
- **Cheat sheet** (12 tables: Cargo commands, ownership, iterators, common compiler errors and their
  fixes, …) and a **46-term glossary**, both searchable.
- **Progress tracking** — XP, per-lesson best scores, chapter progress rings and a daily streak, kept
  in `localStorage`.
- **Lesson search**, light/dark themes, full keyboard control, and a mobile-first layout.

## Running it

It's a static site with **no build step and no dependencies** — plain HTML, CSS and JavaScript.

You do need to serve it over HTTP rather than opening `index.html` directly: the app loads its
lessons as ES modules, and browsers block `import` over `file://`. Any static server works, so use
whichever of these you already have:

```bash
# Rust — fitting for this repo
cargo install miniserve && miniserve . --index index.html

# Node
npx serve

# Python — preinstalled on macOS and most Linux systems
python3 -m http.server 8000
```

Then open the address it prints (usually `http://localhost:8000`).

Or publish it straight to GitHub Pages — no configuration needed, and no server to run.

## Controls

| Input | Action |
| --- | --- |
| `→` / `←` | Next / previous card |
| `1`–`4` | Answer a multiple-choice question |
| `1` / `2` | False / true on a swipe card |
| `Esc` | Back to the chapter list |
| Swipe | Answer swipe cards, or move between cards |

## Project layout

```
index.html
css/style.css          design tokens, light + dark themes
js/
├── app.js             router, views, deck engine, progress
├── cards.js           card renderers and answer handling
├── highlight.js       multi-language syntax highlighter (no CDN)
├── store.js           localStorage progress, degrades gracefully
├── ui.js              shared rendering helpers
└── data/
    ├── index.js       course manifest
    ├── ch00.js … ch21.js
    └── reference.js   cheat sheet + glossary
```

## Adding or editing content

Each chapter file default-exports one object. Lessons hold an array of cards, and each card is one of
five types:

```js
{ t: "concept", title, body: [html], list: [html], code: { src, lang, label },
  code2, out, note: { html, warn }, codeFirst: true,
  compare: { note, langs: { python: "…", java: { src, note } } } }

{ t: "quiz",    q, code, options: [html], answer: 0, why }   // max 4 options
{ t: "swipe",   statement, answer: true, why }
{ t: "order",   prompt, pieces: [str], answer: [0,1,2], why }
{ t: "summary", title, points: [html] }
```

Two things to know when editing:

- Content lives inside JS template literals, so **don't use backticks** in prose or code samples.
- Run `./check.sh` afterwards — it parses every module and catches syntax errors before you load the page.

## Credits

Content follows the structure and teaching order of
[_The Rust Programming Language_](https://doc.rust-lang.org/book/) by Steve Klabnik and Carol Nichols,
which is free to read online and remains the best place to go deeper.
