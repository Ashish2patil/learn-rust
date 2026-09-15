export default {
  id: 10,
  title: "Generic Types, Traits, and Lifetimes",
  emoji: "🧬",
  blurb: "Write code once, use it for many types — safely",
  intro: "The three tools for abstraction: <strong>generics</strong> (code for many types), <strong>traits</strong> (shared behaviour), and <strong>lifetimes</strong> (how long references stay valid).",
  lessons: [
    {
      id: "10.1",
      title: "Generic data types",
      est: "8 min",
      tags: ["generics","monomorphization","type parameter","T"],
      cards: [
        {
          t: "concept",
          kicker: "Duplication, removed",
          title: "One function, many types",
          codeFirst: true,
          code: { src:
`// Before: the same logic, twice
fn largest_i32(list: &[i32]) -> &i32 { /* ... */ }
fn largest_char(list: &[char]) -> &char { /* ... */ }

// After: one function, any comparable type
fn largest<T: PartialOrd>(list: &[T]) -> &T {
    let mut largest = &list[0];
    for item in list {
        if item > largest { largest = item; }
    }
    largest
}

fn main() {
    println!("{}", largest(&[34, 50, 25, 100]));       // 100
    println!("{}", largest(&['y', 'm', 'a', 'q']));    // y
}` },
          body: [
            "<code>&lt;T&gt;</code> declares a type parameter. <code>T: PartialOrd</code> is a <strong>trait bound</strong>: it says <em>“T must be a type you can compare with <code>&gt;</code>”</em>.",
            "The bound isn't optional. Rust checks the generic function's body <strong>once</strong>, against the bounds — so if it compiles, it works for every type that satisfies them. There's no such thing as a generic that compiles but fails for some specific type."
          ],
          compare: {
            note: "This is the key difference from C++ templates: C++ checks the body when you <em>instantiate</em> it, which is why a tiny mistake produces 400 lines of error. Rust checks it once, up front.",
            langs: {
              java: { src:
`static <T extends Comparable<T>> T largest(List<T> list) { ... }`, note: "Very similar syntax — but Java erases the type at runtime, so no int specialisation and boxing costs." },
              cpp: { src:
`template<typename T>
const T& largest(const std::vector<T>& list) { ... }
// Any T compiles until the body fails on it -> legendary error messages
// C++20 concepts finally added Rust-style bounds`, note: "Rust's trait bounds are C++20 concepts, but mandatory." },
              go: { src:
`func Largest[T cmp.Ordered](list []T) T { ... }   // Go 1.18+`, note: "Go's generics arrived in 2022, with constraints much like trait bounds." },
              python: { src:
`def largest(list): ...   # works on anything, fails at runtime if it can't compare`, note: "Duck typing: no compile-time guarantee at all." },
              c: { src:
`// No generics. Use void* and casts, or preprocessor macros.
#define LARGEST(T) ...`, note: "This is why C code has so much duplication." }
            }
          }
        },
        {
          t: "concept",
          kicker: "Everywhere",
          title: "Generics in structs, enums and impls",
          code: { src:
`struct Point<T> { x: T, y: T }          // both fields must be the SAME type
struct Pair<T, U> { first: T, second: U } // two independent type parameters

impl<T> Point<T> {
    fn x(&self) -> &T { &self.x }        // available for every T
}

impl Point<f32> {                         // ONLY for Point<f32>
    fn distance_from_origin(&self) -> f32 {
        (self.x.powi(2) + self.y.powi(2)).sqrt()
    }
}

// You've been using generic enums all along:
enum Option<T> { Some(T), None }
enum Result<T, E> { Ok(T), Err(E) }

let integer = Point { x: 5, y: 10 };
let float = Point { x: 1.0, y: 4.0 };
// let mixed = Point { x: 5, y: 4.0 };   ❌ x and y must share one type` },
          note: { html: "<code>impl Point&lt;f32&gt;</code> adds a method that <b>only exists</b> for that concrete type. It's a neat way to give extra capabilities to specific instantiations." }
        },
        {
          t: "concept",
          kicker: "The performance question",
          title: "Generics are free — monomorphization",
          code: { src:
`// You write this:
let integer = Some(5);
let float = Some(5.0);

// The compiler generates this (roughly):
enum Option_i32 { Some(i32), None }
enum Option_f64 { Some(f64), None }` },
          body: [
            "At compile time, Rust stamps out a <strong>separate specialised copy</strong> of the generic code for every concrete type actually used. This is called <em>monomorphization</em>.",
            "The result: generic Rust runs exactly as fast as hand-written type-specific code. No boxing, no virtual dispatch, no runtime type lookups. The only cost is compile time and binary size."
          ],
          compare: {
            note: "Java pays at runtime (boxing, casts, no primitives in generics). Rust and C++ pay at compile time. Only one of those is visible to your users.",
            langs: {
              java: { src:
`List<Integer> list;    // every int is boxed into an Integer object
// Generic type info is ERASED at runtime — you can't write new T[]`, note: "Type erasure: convenient for compatibility, costly for performance." },
              cpp: `// Templates also monomorphize — same zero-cost model as Rust`,
              go: { src:
`// Go uses a hybrid: dictionaries + partial stenciling`, note: "Somewhere between Java's and Rust's approach." },
              python: `# Everything is dynamic. No specialisation, and everything is an object.`
            }
          }
        },
        {
          t: "quiz",
          q: "What is <em>monomorphization</em>?",
          options: [
            "The compiler generating a specialised copy of generic code for each concrete type used",
            "Converting all types to a single common supertype",
            "Erasing type parameters so one copy handles every type",
            "A runtime optimisation that caches type lookups"
          ],
          answer: 0,
          why: "It's why Rust generics are <strong>zero-cost</strong>: by the time your code runs, <code>largest&lt;i32&gt;</code> and <code>largest&lt;char&gt;</code> are two separate, fully-optimised functions. The trade-off is longer compiles and larger binaries."
        },
        {
          t: "swipe",
          statement: "<code>struct Point&lt;T&gt; { x: T, y: T }</code> lets you write <code>Point { x: 5, y: 4.0 }</code>.",
          answer: false,
          why: "Both fields are declared as the <em>same</em> <code>T</code>, so they must be the same type. You'd need two parameters: <code>struct Point&lt;T, U&gt; { x: T, y: U }</code>."
        },
        {
          t: "summary",
          title: "Generics",
          points: [
            "<code>&lt;T&gt;</code> declares a type parameter; <code>T: Trait</code> bounds what it must be able to do.",
            "Works on functions, structs, enums, methods and traits.",
            "<strong>Monomorphized</strong> at compile time — zero runtime cost.",
            "The body is checked <em>once</em> against the bounds, so errors are clear and early.",
            "<code>Option&lt;T&gt;</code> and <code>Result&lt;T, E&gt;</code> are generics you already use daily."
          ]
        }
      ]
    },
    {
      id: "10.2",
      title: "Traits: defining shared behaviour",
      est: "10 min",
      tags: ["trait","interface","impl trait","default method","orphan rule","derive"],
      cards: [
        {
          t: "concept",
          kicker: "Shared behaviour",
          title: "A trait is a set of methods a type promises to provide",
          codeFirst: true,
          code: { src:
`pub trait Summary {
    fn summarize_author(&self) -> String;          // must be implemented

    fn summarize(&self) -> String {                // default implementation
        format!("(Read more from {}...)", self.summarize_author())
    }
}

pub struct Tweet { pub username: String, pub content: String }

impl Summary for Tweet {
    fn summarize_author(&self) -> String {
        format!("@{}", self.username)
    }
    // summarize() comes free from the default
}

pub struct Article { pub headline: String, pub author: String }

impl Summary for Article {
    fn summarize_author(&self) -> String { self.author.clone() }
    fn summarize(&self) -> String {                 // override the default
        format!("{}, by {}", self.headline, self.author)
    }
}` },
          body: [
            "If you know interfaces from Java or Go, traits will feel familiar — with two big upgrades: traits can provide <strong>default method bodies</strong>, and you can implement a trait for a type <strong>you didn't write</strong>."
          ],
          compare: {
            note: "The superpower: <code>impl MyTrait for i32</code> is legal. You can add behaviour to standard-library and third-party types without wrapping or subclassing.",
            langs: {
              java: { src:
`interface Summary {
    String summarizeAuthor();
    default String summarize() { return "..."; }   // Java 8+ defaults
}
class Tweet implements Summary { ... }
// but you can't make String implement your interface after the fact`, note: "Implementations must be declared on the class itself." },
              go: { src:
`type Summary interface { Summarize() string }
// Implicit: any type with that method satisfies it — no 'implements' needed`, note: "Go's structural typing is looser; Rust requires an explicit impl, which catches accidental matches." },
              python: { src:
`class Summary(Protocol):
    def summarize(self) -> str: ...
# or duck typing: if it has the method, it works`, note: "Checked by a type checker at best, never by the runtime." },
              cpp: `// Abstract base class with virtual functions, or a C++20 concept
class Summary { public: virtual std::string summarize() = 0; };`
            }
          }
        },
        {
          t: "concept",
          kicker: "Using traits",
          title: "Trait bounds, impl Trait, and where clauses",
          code: { src:
`// impl Trait — concise, for simple cases
pub fn notify(item: &impl Summary) {
    println!("Breaking! {}", item.summarize());
}

// Generic form — identical meaning, but names the type
pub fn notify<T: Summary>(item: &T) { /* ... */ }

// Two items of the SAME type
pub fn notify_pair<T: Summary>(a: &T, b: &T) { /* ... */ }

// Multiple bounds with +
pub fn notify<T: Summary + std::fmt::Display>(item: &T) { /* ... */ }

// where clause — much easier to read with several bounds
fn some_function<T, U>(t: &T, u: &U) -> i32
where
    T: std::fmt::Display + Clone,
    U: Clone + std::fmt::Debug,
{ 0 }

// Returning a type that implements a trait
fn make_summarizable() -> impl Summary {
    Tweet { username: String::from("rustlang"), content: String::from("hi") }
}

// Conditional methods: only available when the bounds hold
struct Pair<T> { x: T, y: T }

impl<T: std::fmt::Display + PartialOrd> Pair<T> {
    fn cmp_display(&self) {       // exists only for comparable, printable T
        if self.x >= self.y { println!("largest is x"); }
    }
}` },
          note: { html: "<code>fn f(x: &amp;impl Trait)</code> and <code>fn f&lt;T: Trait&gt;(x: &amp;T)</code> mean the same thing. Use <code>impl Trait</code> when you don't need to name the type; use the generic form when you do (for example, to require two arguments be the <em>same</em> type)." }
        },
        {
          t: "concept",
          kicker: "The rule that keeps things sane",
          title: "The orphan rule",
          code: { src:
`// ✅ your trait, your type
impl Summary for Tweet {}

// ✅ your trait, someone else's type — very useful!
impl Summary for Vec<String> {}
impl Summary for i32 {}

// ✅ someone else's trait, your type
impl std::fmt::Display for Tweet {}

// ❌ someone else's trait for someone else's type
// impl std::fmt::Display for Vec<String> {}
//    error: only traits defined in the current crate can be
//    implemented for types defined outside of the crate` },
          body: [
            "At least one of the trait or the type must be yours. This is the <strong>orphan rule</strong>, and it guarantees there's exactly one implementation of any trait for any type across your whole dependency graph.",
            "Without it, two crates could both implement <code>Display for Vec&lt;String&gt;</code> differently, and adding a dependency could silently change your program's behaviour."
          ],
          note: { html: "Need to break the rule? Use the <strong>newtype pattern</strong>: <code>struct MyVec(Vec&lt;String&gt;);</code> — now the type is yours, and you can implement anything for it." }
        },
        {
          t: "concept",
          kicker: "Free implementations",
          title: "The traits you'll derive constantly",
          code: { src:
`#[derive(Debug, Clone, Copy, PartialEq, Eq, Hash, PartialOrd, Ord, Default)]
struct Point { x: i32, y: i32 }` },
          list: [
            "<code>Debug</code> — enables <code>{:?}</code> printing",
            "<code>Clone</code> — explicit deep copy via <code>.clone()</code>",
            "<code>Copy</code> — implicit bitwise copy instead of move (needs <code>Clone</code>)",
            "<code>PartialEq</code> / <code>Eq</code> — <code>==</code> and <code>!=</code>",
            "<code>PartialOrd</code> / <code>Ord</code> — <code>&lt;</code>, <code>&gt;</code>, and sorting",
            "<code>Hash</code> — usable as a <code>HashMap</code> key",
            "<code>Default</code> — <code>Point::default()</code> gives zeroes"
          ],
          note: { html: "Other traits you'll meet everywhere: <code>Display</code> (user-facing <code>{}</code>, written by hand), <code>From</code>/<code>Into</code> (conversions), <code>Iterator</code> (Ch 13), <code>Drop</code> (Ch 15), <code>Send</code>/<code>Sync</code> (Ch 16)." }
        },
        {
          t: "quiz",
          q: "Can you implement <code>std::fmt::Display</code> for <code>Vec&lt;String&gt;</code> in your crate?",
          options: [
            "No — the orphan rule forbids it, since both the trait and the type are foreign",
            "Yes, traits can be implemented for any type",
            "Only if you mark it <code>unsafe</code>",
            "Only inside a test module"
          ],
          answer: 0,
          why: "The <strong>orphan rule</strong>: either the trait or the type must be local to your crate. It guarantees coherence — one implementation, globally. The workaround is the newtype pattern: wrap it in <code>struct MyVec(Vec&lt;String&gt;);</code> and implement on that."
        },
        {
          t: "swipe",
          statement: "A trait can provide a default method body that implementors may override.",
          answer: true,
          why: "Yes — and default methods can call other methods of the same trait, even ones with no default. That lets a trait provide a lot of functionality from one required method. <code>Iterator</code> is the extreme example: implement <code>next()</code>, get 70+ methods for free."
        },
        {
          t: "order",
          prompt: "Order these by how much the trait system checks them",
          pieces: ["Python duck typing (runtime, or not at all)", "Go implicit interfaces (structural, compile time)", "Rust traits (explicit impl, compile time)"],
          answer: [0,1,2],
          why: "Python discovers mismatches when the call happens. Go checks at compile time but matches purely on method shape, so a coincidental match counts. Rust requires you to <em>write</em> <code>impl Trait for Type</code>, so conformance is always deliberate."
        },
        {
          t: "summary",
          title: "Traits",
          points: [
            "A trait declares shared behaviour; <code>impl Trait for Type</code> provides it.",
            "Traits can have <strong>default method bodies</strong>, and implementors may override them.",
            "<code>T: Trait</code>, <code>impl Trait</code> and <code>where</code> clauses all express bounds.",
            "The <strong>orphan rule</strong>: the trait or the type must be yours. Newtype gets around it.",
            "<code>#[derive(...)]</code> gives you <code>Debug</code>, <code>Clone</code>, <code>PartialEq</code>, <code>Hash</code> and more for free."
          ]
        }
      ]
    },
    {
      id: "10.3",
      title: "Validating references with lifetimes",
      est: "10 min",
      tags: ["lifetime","borrow checker","elision","static","dangling"],
      cards: [
        {
          t: "concept",
          kicker: "The scary-looking one",
          title: "Lifetimes are just names for “how long is this reference valid?”",
          body: [
            "Here's the reassuring part: <strong>every reference has a lifetime</strong> and always has. You've been using them since Chapter 4 — the compiler just worked them out silently.",
            "You only write them down when the compiler genuinely can't tell which input a returned reference came from."
          ],
          code: { src:
`// The problem lifetimes solve:
fn main() {
    let r;
    {
        let x = 5;
        r = &x;          // r borrows x
    }                    // x is dropped here
    // println!("{r}");  ❌ error: x does not live long enough
}` },
          note: { html: "The borrow checker compares the <b>lifetime of the reference</b> against the <b>lifetime of the data</b>. If the data dies first, it's an error. That's the whole idea." }
        },
        {
          t: "concept",
          kicker: "Annotating",
          title: "When the compiler needs your help",
          code: { src:
`// ❌ Which reference does the return value borrow from?
// The compiler can't know, so it can't verify the result stays valid.
fn longest(x: &str, y: &str) -> &str {
    if x.len() > y.len() { x } else { y }
}
// error[E0106]: missing lifetime specifier

// ✅ Tell it: the result lives as long as the SHORTER of the two inputs
fn longest<'a>(x: &'a str, y: &'a str) -> &'a str {
    if x.len() > y.len() { x } else { y }
}` },
          body: [
            "<code>'a</code> (read “tick a”) is a <strong>lifetime parameter</strong>. It doesn't change how long anything lives — it <em>describes a relationship</em> so the compiler can check it.",
            "Reading the signature: <em>“for some lifetime <code>'a</code>, both arguments live at least that long, and the returned reference is valid for that long too.”</em> In practice <code>'a</code> becomes the shorter of the two."
          ],
          code2: { src:
`fn main() {
    let s1 = String::from("long string is long");
    {
        let s2 = String::from("xyz");
        let result = longest(s1.as_str(), s2.as_str());
        println!("Longest: {result}");    // ✅ used while s2 is still alive
    }

    let result;
    {
        let s2 = String::from("xyz");
        result = longest(s1.as_str(), s2.as_str());
    }                                      // s2 dropped
    // println!("{result}");               // ❌ correctly rejected
}` }
        },
        {
          t: "concept",
          kicker: "Good news",
          title: "Elision: three rules mean you rarely write them",
          list: [
            "<strong>Rule 1:</strong> every reference parameter gets its own lifetime parameter.",
            "<strong>Rule 2:</strong> if there's exactly <em>one</em> input lifetime, it's assigned to all outputs.",
            "<strong>Rule 3:</strong> if one of the inputs is <code>&amp;self</code> or <code>&amp;mut self</code>, <em>its</em> lifetime is assigned to all outputs."
          ],
          code: { src:
`// You write:
fn first_word(s: &str) -> &str { ... }
// Compiler infers (rule 1 then rule 2):
fn first_word<'a>(s: &'a str) -> &'a str { ... }

// You write:
impl Parser {
    fn peek(&self) -> &str { ... }
}
// Compiler infers (rule 3):
fn peek<'a>(&'a self) -> &'a str { ... }

// Structs holding references DO need annotations:
struct Excerpt<'a> {
    part: &'a str,          // "this struct cannot outlive the str it points at"
}

// 'static: lives for the entire program.
// Every string literal is &'static str, because it's baked into the binary.
let s: &'static str = "I live forever";` },
          note: { warn: true, html: "Getting a lifetime error? Nine times out of ten the fix isn't a clever annotation — it's to <b>return an owned value</b> (<code>String</code> instead of <code>&amp;str</code>). Don't fight the borrow checker to save one allocation." }
        },
        {
          t: "concept",
          kicker: "All three at once",
          title: "Generics, trait bounds and lifetimes together",
          code: { src:
`use std::fmt::Display;

fn longest_with_announcement<'a, T>(
    x: &'a str,
    y: &'a str,
    ann: T,
) -> &'a str
where
    T: Display,
{
    println!("Announcement! {ann}");
    if x.len() > y.len() { x } else { y }
}` },
          body: [
            "Lifetime parameters come first inside <code>&lt;&gt;</code>, then type parameters. This is about as dense as ordinary Rust signatures get — and once you can read this one, you can read most library code."
          ],
          compare: {
            note: "No other mainstream language checks reference validity at compile time. Everyone else either uses a GC (Java, Go, Python, C#) or hopes for the best (C, C++).",
            langs: {
              cpp: { src:
`const std::string& longest(const std::string& x, const std::string& y) {
    return x.size() > y.size() ? x : y;
}
// Caller can easily keep the result past the argument's lifetime.
// Compiles fine. Undefined behaviour at runtime.`, note: "The exact bug lifetimes exist to prevent." },
              java: `String longest(String x, String y) { ... }   // GC keeps it alive; no problem`,
              go: `func longest(x, y string) string { ... }   // GC and escape analysis handle it`,
              python: `def longest(x, y): return x if len(x) > len(y) else y   # refcounting handles it`
            }
          }
        },
        {
          t: "quiz",
          q: "What does <code>'a</code> in <code>fn f&lt;'a&gt;(x: &amp;'a str) -> &amp;'a str</code> actually do?",
          options: [
            "Tells the compiler the returned reference is valid as long as <code>x</code> is",
            "Extends how long <code>x</code> lives",
            "Makes the reference static",
            "Allocates <code>x</code> on the heap"
          ],
          answer: 0,
          why: "Lifetime annotations are purely <strong>descriptive</strong>. They never change how long data lives — they state a relationship the borrow checker then verifies. If the relationship isn't true, you get a compile error rather than a dangling pointer."
        },
        {
          t: "swipe",
          statement: "You must write lifetime annotations on most functions you create.",
          answer: false,
          why: "The three <strong>elision rules</strong> cover the overwhelming majority of real functions. You'll mostly only annotate when a function returns a reference derived from <em>multiple</em> reference parameters, or when a struct stores a reference."
        },
        {
          t: "summary",
          title: "Chapter 10 complete 🎉 A big one",
          points: [
            "<strong>Generics</strong> remove duplication and cost nothing at runtime (monomorphization).",
            "<strong>Traits</strong> define shared behaviour, support default methods, and obey the orphan rule.",
            "<strong>Lifetimes</strong> describe how long references are valid; they never change anything, they only let the compiler check.",
            "<strong>Elision</strong> means you rarely write lifetimes by hand.",
            "Stuck on a lifetime error? Returning an owned <code>String</code> is usually the right answer, not a cleverer annotation."
          ]
        }
      ]
    }
  ]
};
