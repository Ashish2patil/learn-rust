export default {
  id: 9,
  title: "Error Handling",
  emoji: "🚨",
  blurb: "panic!, Result, and the ? operator",
  intro: "Rust splits errors into two kinds: <strong>unrecoverable</strong> (panic — the program is broken) and <strong>recoverable</strong> (Result — a normal thing that can go wrong). There are no exceptions.",
  lessons: [
    {
      id: "9.1",
      title: "Unrecoverable errors with panic!",
      est: "5 min",
      tags: ["panic","unwind","abort","backtrace","crash"],
      cards: [
        {
          t: "concept",
          kicker: "When the world is broken",
          title: "panic! stops the thread immediately",
          code: { src:
`fn main() {
    panic!("crash and burn");
}

// thread 'main' panicked at src/main.rs:2:5:
// crash and burn
// note: run with RUST_BACKTRACE=1 to display a backtrace` },
          body: [
            "A panic prints a message, unwinds the stack (running every destructor on the way), and ends the thread. It's for situations your code has no sensible way to continue from.",
            "Many panics come from the standard library rather than your own <code>panic!</code> calls: indexing out of bounds, <code>unwrap()</code> on <code>None</code>, dividing an integer by zero, arithmetic overflow in debug builds."
          ],
          code2: { lang: "toml", label: "Cargo.toml — abort instead of unwind", src:
`[profile.release]
panic = "abort"     # skip cleanup, exit immediately; produces a smaller binary` },
          note: { html: "<code>RUST_BACKTRACE=1 cargo run</code> shows the full call stack — the single most useful debugging command in Rust." },
          compare: {
            note: "A Rust panic is roughly “an unchecked exception you're not supposed to catch”. It signals a <em>bug</em>, not an expected failure.",
            langs: {
              python: `raise RuntimeError("crash and burn")   # and you might catch it`,
              java: `throw new RuntimeException("crash and burn");`,
              go: `panic("crash and burn")    // Go's panic is almost identical`,
              c: `abort();   // or just segfault, with no message at all`
            }
          }
        },
        {
          t: "quiz",
          q: "Which of these does <strong>not</strong> panic?",
          options: [
            "<code>vec.get(99)</code> on a 3-element vector",
            "<code>vec[99]</code> on a 3-element vector",
            "<code>Option::None.unwrap()</code>",
            "<code>\"abc\".parse::&lt;i32&gt;().unwrap()</code>"
          ],
          answer: 0,
          why: "<code>.get()</code> returns <code>Option&lt;&amp;T&gt;</code> — it hands back <code>None</code> rather than crashing. That's the general pattern: methods that can fail come in a panicking form and a <code>Option</code>/<code>Result</code> form, and you pick based on whether failure is a bug or a normal outcome."
        },
        {
          t: "swipe",
          statement: "You should catch panics and carry on, like catching an exception.",
          answer: false,
          why: "A panic means <em>“a bug has occurred; my assumptions are violated.”</em> <code>std::panic::catch_unwind</code> exists (web servers use it to isolate one bad request), but it's not general-purpose control flow. For expected failures, return a <code>Result</code>."
        },
        {
          t: "summary",
          title: "panic!",
          points: [
            "<code>panic!</code> = unrecoverable: the program has a bug and must stop.",
            "Triggered by out-of-bounds indexing, <code>unwrap</code> on <code>None</code>/<code>Err</code>, division by zero, debug-build overflow.",
            "It unwinds by default (running destructors); <code>panic = \"abort\"</code> skips that.",
            "<code>RUST_BACKTRACE=1</code> shows you exactly where it happened."
          ]
        }
      ]
    },
    {
      id: "9.2",
      title: "Recoverable errors with Result",
      est: "9 min",
      tags: ["result","ok","err","unwrap","expect","match","question mark"],
      cards: [
        {
          t: "concept",
          kicker: "Errors as values",
          title: "Result<T, E> — success or failure, in the type",
          codeFirst: true,
          code: { src:
`enum Result<T, E> {     // in the prelude, always available
    Ok(T),
    Err(E),
}

use std::fs::File;

let result = File::open("hello.txt");   // Result<File, std::io::Error>

let file = match result {
    Ok(f) => f,
    Err(e) => panic!("Problem opening the file: {e:?}"),
};` },
          body: [
            "There are <strong>no exceptions</strong> in Rust. A function that can fail says so in its return type, and callers cannot accidentally ignore it — the compiler warns on an unused <code>Result</code>.",
            "That means you can read a signature and know exactly what can go wrong, with no invisible control flow jumping out of your function."
          ],
          compare: {
            note: "Exceptions are invisible in a signature; <code>Result</code> is right there in it. Go made the same choice — Rust just adds pattern matching and <code>?</code> to keep it concise.",
            langs: {
              python: { src:
`try:
    f = open("hello.txt")
except FileNotFoundError as e:
    ...
# nothing in open()'s signature told you this could happen`, note: "Any call can throw anything. You find out from docs, or from production." },
              java: { src:
`try {
    var f = new FileReader("hello.txt");
} catch (FileNotFoundException e) { ... }
// checked exceptions were Java's attempt at this — widely disliked`, note: "Java tried and people worked around it with RuntimeException." },
              go: { src:
`f, err := os.Open("hello.txt")
if err != nil { return err }    // very close to Rust's approach`, note: "Same philosophy. Go's weakness is that ignoring err is easy; Rust warns you." },
              cpp: `try { ... } catch (const std::exception& e) { ... }
// or std::expected<T,E> in C++23 — which is Rust's Result, arriving 12 years later`
            }
          }
        },
        {
          t: "concept",
          kicker: "Shortcuts",
          title: "unwrap, expect, and the friendlier combinators",
          code: { src:
`use std::fs::File;

// Panic on error, generic message
let f = File::open("hello.txt").unwrap();

// Panic with YOUR message — always prefer this over unwrap
let f = File::open("hello.txt")
    .expect("hello.txt should be included in this project");

// Don't panic — provide a fallback
let n: i32 = "abc".parse().unwrap_or(0);
let n: i32 = "abc".parse().unwrap_or_default();        // 0
let n: i32 = "abc".parse().unwrap_or_else(|_| compute_default());

// Transform without unwrapping
let len: Result<usize, _> = "42".parse::<i32>().map(|n| n.to_string().len());
let ok: bool = "42".parse::<i32>().is_ok();

// Match on the KIND of error
use std::io::ErrorKind;
let f = match File::open("hello.txt") {
    Ok(file) => file,
    Err(e) => match e.kind() {
        ErrorKind::NotFound => File::create("hello.txt")
            .expect("could not create the file"),
        other => panic!("could not open the file: {other:?}"),
    },
};` },
          note: { warn: true, html: "<b>Rule of thumb:</b> <code>unwrap()</code> and <code>expect()</code> are fine in examples, prototypes and tests. In library code and anything long-lived, return a <code>Result</code> and let the caller decide." }
        },
        {
          t: "concept",
          kicker: "The one you'll use most",
          title: "The ? operator",
          code: { src:
`use std::fs::File;
use std::io::{self, Read};

// Without ? — correct, but drowning in ceremony
fn read_username_v1() -> Result<String, io::Error> {
    let mut f = match File::open("hello.txt") {
        Ok(file) => file,
        Err(e) => return Err(e),
    };
    let mut s = String::new();
    match f.read_to_string(&mut s) {
        Ok(_) => Ok(s),
        Err(e) => Err(e),
    }
}

// With ? — identical behaviour
fn read_username_v2() -> Result<String, io::Error> {
    let mut f = File::open("hello.txt")?;   // on Err: return it immediately
    let mut s = String::new();
    f.read_to_string(&mut s)?;
    Ok(s)
}

// Chained
fn read_username_v3() -> Result<String, io::Error> {
    let mut s = String::new();
    File::open("hello.txt")?.read_to_string(&mut s)?;
    Ok(s)
}

// Or just use the standard library
fn read_username_v4() -> Result<String, io::Error> {
    std::fs::read_to_string("hello.txt")
}` },
          body: [
            "<code>?</code> means: <em>if this is <code>Ok(v)</code>, give me <code>v</code>; if it's <code>Err(e)</code>, return <code>Err(e)</code> from this function right now.</em>",
            "It also <strong>converts the error type</strong> automatically via the <code>From</code> trait — so a function returning <code>Box&lt;dyn Error&gt;</code> can use <code>?</code> on many different error types.",
            "<code>?</code> works on <code>Option</code> too: it returns <code>None</code> early."
          ],
          note: { warn: true, html: "<code>?</code> only works in a function that returns <code>Result</code>, <code>Option</code>, or another type implementing <code>Try</code>. Using it in a plain <code>fn main()</code> is an error — but <code>fn main() -> Result&lt;(), Box&lt;dyn Error&gt;&gt;</code> is allowed, and is the usual fix." },
          compare: {
            note: "<code>?</code> gives you the brevity of exceptions with the explicitness of error values. Go programmers have been asking for exactly this for a decade.",
            langs: {
              go: { src:
`f, err := os.Open("hello.txt")
if err != nil { return "", err }          // every. single. call.
var s string
_, err = f.Read(&s)
if err != nil { return "", err }
return s, nil`, note: "This is the boilerplate ? was designed to remove." },
              python: `# exceptions propagate implicitly — concise, but invisible
with open("hello.txt") as f:
    return f.read()`,
              java: `// checked exceptions must be declared or caught
String read() throws IOException { ... }`,
              js: `const s = await readFile("hello.txt");   // throws on error`
            }
          }
        },
        {
          t: "quiz",
          q: "What does <code>?</code> do when the expression is <code>Err(e)</code>?",
          options: [
            "Returns <code>Err(e)</code> from the enclosing function immediately (converting the error type if needed)",
            "Panics with the error message",
            "Evaluates to <code>None</code>",
            "Logs the error and continues"
          ],
          answer: 0,
          why: "It's an early return for the error path. On <code>Ok(v)</code> the expression evaluates to <code>v</code> and execution continues. The automatic <code>From</code> conversion is what makes it work across different error types in the same function."
        },
        {
          t: "swipe",
          statement: "You can use <code>?</code> inside any function.",
          answer: false,
          why: "Only in functions whose return type can carry the failure — <code>Result</code>, <code>Option</code>, or another <code>Try</code> type. That's not a limitation so much as the point: <code>?</code> propagates the error to <em>your</em> caller, so your signature has to admit that failure is possible."
        },
        {
          t: "order",
          prompt: "Order these from “most likely to crash” to “most careful”",
          pieces: ["r.unwrap()", "r.expect(\"msg\")", "r.unwrap_or(default)", "match r { Ok(..) => .., Err(..) => .. }"],
          answer: [0,1,2,3],
          why: "<code>unwrap</code> panics with a generic message; <code>expect</code> panics with a useful one; <code>unwrap_or</code> never panics; a full <code>match</code> lets you react differently to each kind of failure. Pick the lightest tool that's still honest about what can go wrong."
        },
        {
          t: "summary",
          title: "Result",
          points: [
            "<code>Result&lt;T, E&gt;</code> = <code>Ok(T)</code> or <code>Err(E)</code>. No exceptions, no hidden control flow.",
            "<code>unwrap</code>/<code>expect</code> panic; <code>unwrap_or</code>/<code>unwrap_or_else</code> give fallbacks; <code>match</code> handles each case.",
            "<code>?</code> propagates errors upward and converts error types via <code>From</code>.",
            "<code>?</code> requires a compatible return type — including <code>fn main() -> Result&lt;(), Box&lt;dyn Error&gt;&gt;</code>.",
            "An unused <code>Result</code> produces a compiler warning — errors don't slip through."
          ]
        }
      ]
    },
    {
      id: "9.3",
      title: "To panic! or not to panic!",
      est: "6 min",
      tags: ["guidelines","validation","newtype","invariants","design"],
      cards: [
        {
          t: "concept",
          kicker: "Decision guide",
          title: "Is this a bug, or a thing that happens?",
          list: [
            "<strong>Return <code>Result</code></strong> when failure is an expected part of life: a missing file, malformed user input, a network timeout, a parse failure.",
            "<strong>Panic</strong> when a contract has been broken — the code is wrong, not the world. Out-of-range index, a violated invariant, an impossible state.",
            "<strong>Panic freely</strong> in examples, prototypes and tests. A failing test <em>should</em> panic; that's how it reports failure.",
            "<strong>Never panic in a library</strong> for something the caller could reasonably handle. You don't get to decide that their program should die."
          ],
          code: { src:
`// You know more than the compiler: this literal is definitely valid.
use std::net::IpAddr;
let home: IpAddr = "127.0.0.1".parse().expect("hardcoded IP is valid");

// The caller gave you bad input: that's a Result, not a panic.
fn parse_config(text: &str) -> Result<Config, ConfigError> { /* ... */ }` },
          note: { html: "Good <code>expect</code> messages explain <b>why you believe it can't fail</b> — not what failed. “hardcoded IP is valid” tells a future reader the reasoning; “parse failed” tells them nothing." }
        },
        {
          t: "concept",
          kicker: "Best practice",
          title: "Encode validation in the type, and check it once",
          code: { src:
`pub struct Guess {
    value: i32,          // private! nobody outside can set it directly
}

impl Guess {
    pub fn new(value: i32) -> Guess {
        if value < 1 || value > 100 {
            panic!("Guess must be between 1 and 100, got {value}");
        }
        Guess { value }
    }

    pub fn value(&self) -> i32 { self.value }   // read-only accessor
}

// Now any function taking a Guess KNOWS it is in range.
// No defensive checks. No "what if someone passed 0" comments.
fn check(guess: Guess) { /* guaranteed 1..=100 */ }` },
          body: [
            "This is one of Rust's most valuable habits: <strong>make invalid states unrepresentable</strong>. Validate at the boundary, wrap the value in a type that guarantees the invariant, and every downstream function gets the guarantee for free.",
            "A library version would return <code>Result&lt;Guess, GuessError&gt;</code> instead of panicking — same shape, caller decides."
          ],
          compare: {
            note: "The idea isn't unique to Rust, but Rust's private fields plus no-null make it airtight: there's literally no way to obtain a <code>Guess</code> without going through <code>new</code>.",
            langs: {
              python: `class Guess:
    def __init__(self, value):
        if not 1 <= value <= 100: raise ValueError(...)
        self._value = value     # _value is private by convention only`,
              java: `record Guess(int value) {
    Guess { if (value < 1 || value > 100) throw new IllegalArgumentException(); }
}`,
              go: `// Go can't hide the field from its own package,
// so the invariant is weaker.
type Guess struct{ value int }
func NewGuess(v int) (Guess, error) { ... }`
            }
          }
        },
        {
          t: "quiz",
          q: "A library function parses a user-supplied config file. What should it return on malformed input?",
          options: [
            "<code>Result&lt;Config, ConfigError&gt;</code> — bad input is expected, and the caller should decide",
            "Panic — the config is invalid so nothing can continue",
            "<code>Option&lt;Config&gt;</code> — None means it failed",
            "A default Config, silently"
          ],
          answer: 0,
          why: "User input being wrong is <strong>expected</strong>, and a library must not kill someone else's program. <code>Result</code> carries <em>why</em> it failed (unlike <code>Option</code>), which lets the caller show a useful message. Silently defaulting hides real problems."
        },
        {
          t: "swipe",
          statement: "If you validate a value once and wrap it in its own type, downstream code doesn't need to re-check it.",
          answer: true,
          why: "That's the whole benefit. With a private field and a validating constructor, a <code>Guess</code> cannot exist in an invalid state — so every function accepting one can rely on the invariant. Validate at the boundary, trust the type everywhere inside."
        },
        {
          t: "summary",
          title: "Chapter 9 complete 🎉",
          points: [
            "<strong>Result</strong> for expected failures; <strong>panic</strong> for broken assumptions.",
            "Libraries return <code>Result</code>; applications may choose to panic at the top level.",
            "<code>expect</code> messages should say <em>why you believe this can't fail</em>.",
            "Wrap validated values in their own type — <strong>make invalid states unrepresentable</strong>.",
            "For real projects, the <code>thiserror</code> crate builds error enums and <code>anyhow</code> handles application-level errors."
          ]
        }
      ]
    }
  ]
};
