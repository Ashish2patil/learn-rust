export default {
  id: 17,
  title: "Async and Await",
  emoji: "⏳",
  blurb: "Futures, async/await, and concurrency without threads",
  intro: "Threads are great for CPU work. For thousands of simultaneous network connections, you want <strong>async</strong>: many tasks sharing a few threads, switching whenever one is waiting.",
  lessons: [
    {
      id: "17.1",
      title: "Futures and the async/await syntax",
      est: "8 min",
      tags: ["async","await","future","poll","lazy","runtime"],
      cards: [
        {
          t: "concept",
          kicker: "The problem",
          title: "Blocking wastes a whole thread",
          body: [
            "A web server handling 10,000 connections spends nearly all its time <em>waiting</em> — for the network, the disk, the database. With one OS thread per connection you'd need 10,000 threads, each with its own stack (typically 8 MB of address space) and a context switch every time attention moves.",
            "<strong>Async</strong> flips it: when a task has to wait, it yields, and the thread picks up another task. A handful of threads can serve tens of thousands of connections."
          ],
          code: { src:
`use trpl::{Html};   // the Rust Book's teaching crate

async fn page_title(url: &str) -> Option<String> {
    let response = trpl::get(url).await;          // yield while waiting
    let text = response.text().await;             // yield again
    Html::parse(&text)
        .select_first("title")
        .map(|t| t.inner_html())
}` },
          note: { html: "<code>async fn f() -> T</code> really returns <code>impl Future&lt;Output = T&gt;</code>. The <code>async</code> keyword rewrites your function into a state machine that can pause and resume at each <code>await</code>." }
        },
        {
          t: "concept",
          kicker: "The crucial difference",
          title: "Futures are lazy — nothing runs until awaited",
          code: { src:
`// Calling an async fn does NOTHING. It just builds a Future.
let future = page_title("https://example.com");
// ...no request has been sent yet.

let title = future.await;     // NOW it runs

// You need a runtime to drive futures at the top level:
fn main() {
    trpl::run(async {
        let title = page_title("https://example.com").await;
        println!("{title:?}");
    });
}

// With tokio, the usual production choice:
#[tokio::main]
async fn main() {
    let title = page_title("https://example.com").await;
}` },
          body: [
            "This laziness is a real design choice, and it differs from JavaScript: a JS <code>Promise</code> starts executing the moment you create it. A Rust <code>Future</code> does nothing until something polls it.",
            "The upside is that futures cost nothing until used, compose freely, and can be cancelled simply by dropping them."
          ],
          compare: {
            note: "Rust has <strong>no built-in async runtime</strong> — that's unusual. <code>tokio</code> (networking) and <code>async-std</code> are crates. It keeps <code>std</code> runtime-free, which is what allows async on microcontrollers via <code>embassy</code>.",
            langs: {
              js: { src:
`async function pageTitle(url) {
    const res = await fetch(url);      // starts IMMEDIATELY on call
    return (await res.text()).match(/<title>(.*?)<\\/title>/)?.[1];
}`, note: "Promises are eager; Rust's futures are lazy. Same syntax, different semantics." },
              python: { src:
`async def page_title(url):
    async with aiohttp.ClientSession() as s:
        async with s.get(url) as r:
            return await r.text()
asyncio.run(page_title(url))`, note: "Python ships asyncio in the standard library; Rust leaves the runtime to you." },
              go: { src:
`// Go has no async/await — goroutines make blocking code cheap,
// and the runtime schedules them onto OS threads for you.
resp, _ := http.Get(url)`, note: "Go hides the whole problem inside its runtime. The cost is that every Go binary carries that runtime." },
              java: `// Virtual threads (Java 21) take Go's approach
Thread.ofVirtual().start(() -> { httpClient.send(req, ...); });`
            }
          }
        },
        {
          t: "quiz",
          q: "What happens when you call an <code>async fn</code> but never <code>.await</code> the result?",
          options: [
            "Nothing runs — futures are lazy until polled",
            "It runs in the background",
            "It runs immediately and blocks",
            "Compile error"
          ],
          answer: 0,
          why: "Calling it just constructs a <code>Future</code>. Rust even warns you: <em>“unused implementer of Future that must be used”</em>. This is the opposite of JavaScript, where creating a Promise starts the work immediately."
        },
        {
          t: "swipe",
          statement: "Rust's standard library includes an async runtime.",
          answer: false,
          why: "<code>std</code> provides the <code>Future</code> trait and the <code>async</code>/<code>await</code> syntax, but <strong>no executor</strong>. You choose one: <code>tokio</code> for servers, <code>embassy</code> for embedded, <code>smol</code> when you want something small. Keeping the runtime out of <code>std</code> is what makes async usable on a microcontroller."
        },
        {
          t: "summary",
          title: "Async basics",
          points: [
            "<code>async fn</code> returns a <code>Future</code>; <code>.await</code> yields control while waiting.",
            "Futures are <strong>lazy</strong> — nothing happens until a runtime polls them.",
            "You must pick a runtime: <code>tokio</code>, <code>async-std</code>, <code>smol</code>, <code>embassy</code>.",
            "Async is for <strong>I/O-bound</strong> work; threads are for CPU-bound work.",
            "<code>#[tokio::main]</code> is the usual way to make <code>main</code> async."
          ]
        }
      ]
    },
    {
      id: "17.2",
      title: "Running futures concurrently",
      est: "7 min",
      tags: ["join","select","spawn","stream","concurrency","race"],
      cards: [
        {
          t: "concept",
          kicker: "Doing several things at once",
          title: "join, race and spawn",
          code: { src:
`// SEQUENTIAL — 2 seconds total
let a = fetch("url1").await;
let b = fetch("url2").await;

// CONCURRENT — ~1 second: both run, wait for BOTH
let (a, b) = trpl::join(fetch("url1"), fetch("url2")).await;
// tokio: let (a, b) = tokio::join!(fetch("url1"), fetch("url2"));

// RACE — take whichever finishes FIRST, drop the other
let first = trpl::race(fetch("fast"), fetch("slow")).await;
// tokio: tokio::select! { a = f1 => ..., b = f2 => ... }

// SPAWN — run independently, in the background
let handle = tokio::spawn(async { expensive_work().await });
let result = handle.await.unwrap();

// Many at once
let futures = urls.into_iter().map(|u| fetch(u));
let results = futures::future::join_all(futures).await;

// Timeouts
let r = tokio::time::timeout(Duration::from_secs(5), fetch(url)).await;` },
          body: [
            "Note the distinction: <code>join</code> waits for everything; <code>race</code>/<code>select</code> takes the first winner and <strong>drops</strong> the rest — which is how cancellation works in Rust. Dropping a future stops it, and its destructors clean up."
          ],
          note: { warn: true, html: "<b>Never block inside an async function.</b> <code>std::thread::sleep</code>, blocking file I/O or a long CPU loop will stall the whole executor thread and freeze unrelated tasks. Use <code>tokio::time::sleep</code>, async I/O, or <code>spawn_blocking</code> for CPU work." }
        },
        {
          t: "concept",
          kicker: "Which tool?",
          title: "Async vs threads",
          code: { lang: "text", label: "Choosing", src:
`ASYNC  — many tasks that mostly WAIT
         web servers, API clients, databases, chat, proxies
         thousands of concurrent tasks on a few threads
         cost: "function colouring" — async spreads through your call graph

THREADS — work that mostly COMPUTES
         image processing, compression, simulation, parsing
         parallelism across CPU cores
         cost: memory per thread, context switching

BOTH    — common in practice:
         tokio for the network layer,
         spawn_blocking or rayon for the CPU-heavy parts` },
          body: [
            "“Function colouring” is the main ergonomic complaint about async: an <code>async fn</code> can only be awaited from another <code>async fn</code>, so async tends to spread upward through your codebase. Go's goroutines avoid this by hiding the machinery in a runtime — at the cost of always shipping that runtime."
          ]
        },
        {
          t: "quiz",
          q: "Which runs two fetches concurrently?",
          options: [
            "<code>join(fetch(a), fetch(b)).await</code>",
            "<code>fetch(a).await; fetch(b).await;</code>",
            "<code>fetch(a); fetch(b);</code>",
            "<code>[fetch(a), fetch(b)]</code>"
          ],
          answer: 0,
          why: "Two sequential <code>.await</code>s run one after the other — the second doesn't even start until the first finishes. <code>join</code> polls both, so they overlap. And without any <code>.await</code> at all, neither future runs."
        },
        {
          t: "swipe",
          statement: "Calling <code>std::thread::sleep</code> inside an async function is fine.",
          answer: false,
          why: "It blocks the executor <strong>thread</strong>, not just your task — every other task scheduled on that thread freezes too. Use <code>tokio::time::sleep(...).await</code>, which yields properly. This is the most common async bug in production Rust."
        },
        {
          t: "summary",
          title: "Chapter 17 complete 🎉",
          points: [
            "<code>join</code> waits for all; <code>race</code>/<code>select!</code> takes the first and drops the rest.",
            "<code>tokio::spawn</code> runs a task independently, like a lightweight thread.",
            "<strong>Dropping a future cancels it</strong> — that's Rust's whole cancellation model.",
            "Never block inside async — use async equivalents or <code>spawn_blocking</code>.",
            "Async for I/O-bound work, threads for CPU-bound work, and often both together."
          ]
        }
      ]
    }
  ]
};
