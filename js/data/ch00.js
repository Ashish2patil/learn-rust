export default {
  id: 0,
  title: "Why Rust? (start here)",
  emoji: "🧭",
  blurb: "What problem Rust solves, and how to use this app",
  intro: "Before the syntax: what is Rust actually <em>for</em>, and why does it look the way it does? Five minutes here will make the next twenty chapters click.",
  lessons: [
    {
      id: "0.1",
      title: "The problem Rust solves",
      est: "4 min",
      tags: ["why rust","memory safety","intro"],
      cards: [
        {
          t: "concept",
          kicker: "The big picture",
          title: "Programming languages make you pick two out of three",
          body: [
            "For decades you had to choose between <strong>fast</strong>, <strong>safe</strong>, and <strong>pleasant to write</strong>.",
            "C and C++ are fast and give you full control, but a single mistake — using memory after freeing it, running off the end of an array — silently corrupts your program. Roughly <strong>70% of serious security bugs</strong> at Microsoft and Google come from exactly this class of mistake.",
            "Python, Java and Go are safe and pleasant, but they achieve that with a <em>garbage collector</em>: a background system that pauses your program to clean up memory for you. That costs speed and predictability.",
            "Rust's bet: <strong>you can have all three</strong>, if the compiler is willing to be strict with you at compile time."
          ],
          compare: {
            note: "The same bug, in three worlds. Rust is the only one that catches it <em>before the program ever runs</em>.",
            langs: {
              rust: { src:
`fn main() {
    let v = vec![1, 2, 3];
    let first = &v[0];   // borrow the first element
    // v.push(4);        // ❌ compile error: cannot borrow v
                         //    as mutable while borrowed as immutable
    println!("{first}");
}`, note: "Rust <em>refuses to compile</em> the dangerous version. No runtime cost." },
              cpp: { src:
`int main() {
    std::vector<int> v{1, 2, 3};
    int& first = v[0];
    v.push_back(4);        // may reallocate the buffer...
    std::cout << first;    // 💥 dangling reference, undefined behaviour
}`, note: "Compiles happily. Might work today, crash in production tomorrow." },
              python: { src:
`v = [1, 2, 3]
first = v[0]   # copies the value, not a pointer
v.append(4)
print(first)   # 1 — always safe`, note: "Safe, but every object is heap-allocated and reference-counted. You pay for it in speed." },
              java: { src:
`var v = new ArrayList<Integer>(List.of(1, 2, 3));
Integer first = v.get(0);
v.add(4);
System.out.println(first);  // 1 — safe, GC handles memory`, note: "Safe via garbage collection — with pauses you don't control." },
              go: { src:
`v := []int{1, 2, 3}
first := v[0]
v = append(v, 4)
fmt.Println(first)  // 1 — safe, GC handles memory`, note: "Safe and simple, but also GC'd — and Go won't stop you sharing data across goroutines unsafely." }
            }
          }
        },
        {
          t: "quiz",
          q: "How does Rust achieve memory safety without a garbage collector?",
          options: [
            "By checking ownership rules at <strong>compile time</strong>, so unsafe code never builds",
            "By running a hidden background collector, just a faster one",
            "By making every value immutable",
            "By reference-counting every value automatically"
          ],
          answer: 0,
          why: "Rust's <em>borrow checker</em> proves your memory usage is safe while compiling. At runtime there is no checker, no collector, and no overhead — the generated machine code is comparable to C."
        },
        {
          t: "swipe",
          statement: "Rust programs are slower than C++ because of all the safety checks.",
          answer: false,
          why: "The safety checks happen at <strong>compile time</strong>, not run time. Rust calls this <em>zero-cost abstraction</em>: what you don't use, you don't pay for — and what you do use is as fast as hand-written equivalent code."
        },
        {
          t: "concept",
          kicker: "Who uses it",
          title: "Rust isn't a toy",
          body: [
            "Rust ships in the <strong>Linux kernel</strong> and <strong>Windows</strong>, powers Firefox's rendering engine, runs Discord's and Dropbox's backends, backs AWS Lambda's Firecracker VMs, and Cloudflare routes a large slice of the internet through it.",
            "It has been <em>Stack Overflow's most-loved language for 9 years running</em> — not because it's easy, but because once a Rust program compiles, it tends to just work."
          ],
          list: [
            "<strong>Systems programming</strong> — kernels, drivers, embedded devices",
            "<strong>Web backends</strong> — Axum, Actix (some of the fastest servers measured)",
            "<strong>CLI tools</strong> — <code>ripgrep</code>, <code>fd</code>, <code>bat</code>, <code>uv</code>",
            "<strong>WebAssembly</strong> — near-native speed in the browser",
            "<strong>Tooling for other languages</strong> — Python's <code>ruff</code> and <code>uv</code>, JS's <code>swc</code> and <code>rspack</code>"
          ]
        },
        {
          t: "summary",
          title: "Chapter 0.1 recap",
          points: [
            "Rust gives you <strong>C-level speed</strong> with <strong>memory safety guaranteed at compile time</strong>.",
            "It has <strong>no garbage collector</strong> — the compiler figures out exactly when to free memory.",
            "The strictness you'll feel early is the compiler moving bugs from <em>3am in production</em> to <em>right now, on your screen</em>.",
            "It's production-proven at Microsoft, Google, Amazon, Meta, Cloudflare and in the Linux kernel."
          ]
        }
      ]
    },
    {
      id: "0.2",
      title: "How to use this app",
      est: "2 min",
      tags: ["help","how to","guide"],
      cards: [
        {
          t: "concept",
          kicker: "Read me",
          title: "Concept → question → recap → next",
          body: [
            "Every lesson is a small deck of cards. You'll see a <strong>concept</strong>, then get <strong>asked something</strong>, then a <strong>recap</strong>. Then you move on. That's the whole loop.",
            "You can't skip a question card until you answer it — that's deliberate. Recall is what makes things stick."
          ],
          list: [
            "🖱️ <strong>Tap</strong> an answer, or press <kbd>1</kbd>–<kbd>4</kbd>",
            "👆 <strong>Swipe</strong> left/right on true-or-false cards (or arrow keys on desktop)",
            "🌍 Every concept has a <strong>“Same idea in a language you already know”</strong> panel — tap the tabs for Python, C, C++, Go, Java",
            "⚡ Right answers earn XP, finished lessons earn a bonus, daily use builds a streak",
            "📋 The <strong>cheat sheet</strong> and <strong>glossary</strong> on the home screen are your permanent reference"
          ],
          note: { html: "<b>Your progress is saved in this browser only.</b> Clearing site data resets it, and it doesn't sync between devices." }
        },
        {
          t: "swipe",
          statement: "You should install Rust on your own machine and actually run the examples.",
          answer: true,
          why: "Absolutely. Reading about the borrow checker and <em>arguing with</em> the borrow checker are different skills. Chapter 1 shows you how to install it — it takes about two minutes."
        },
        {
          t: "summary",
          title: "You're set",
          points: [
            "Cards go <strong>concept → question → recap</strong>, then straight to the next thing.",
            "Use the <strong>language tabs</strong> to anchor each new idea to something you already know.",
            "Chapters 4, 10, 13 and 15 are the ones that change how you think — don't rush them.",
            "Next up: installing Rust and shipping your first program."
          ]
        }
      ]
    }
  ]
};
