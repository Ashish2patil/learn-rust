export const CHEATSHEET = [
  {
    title: "🔧 Cargo commands",
    cols: ["Command", "What it does"],
    rows: [
      ["cargo new NAME", "Create a new binary project (<code>--lib</code> for a library)"],
      ["cargo run", "Build and run (<code>-- args</code> to pass arguments to your program)"],
      ["cargo check", "Type-check only — much faster than a build; use it constantly"],
      ["cargo build --release", "Optimised build. Always benchmark with this"],
      ["cargo test", "Run unit, integration and doc tests"],
      ["cargo fmt", "Auto-format to the standard style"],
      ["cargo clippy", "Lint: catches bugs and unidiomatic code"],
      ["cargo add CRATE", "Add a dependency from crates.io"],
      ["cargo doc --open", "Build and open docs for your crate and all dependencies"],
      ["cargo install TOOL", "Install a binary crate as a command-line tool"],
      ["rustup update", "Update the Rust toolchain itself"]
    ]
  },
  {
    title: "📦 Variables and types",
    cols: ["Syntax", "Meaning"],
    rows: [
      ["let x = 5;", "Immutable binding (the default)"],
      ["let mut x = 5;", "Mutable binding"],
      ["const MAX: u32 = 100;", "Compile-time constant; type required, any scope"],
      ["let x = x + 1;", "Shadowing — a new variable reusing the name, type may change"],
      ["i8 i16 i32 i64 i128 isize", "Signed integers (<code>i32</code> is the default)"],
      ["u8 u16 u32 u64 u128 usize", "Unsigned; <code>usize</code> is used for indexing and lengths"],
      ["f32 f64", "Floats (<code>f64</code> is the default)"],
      ["bool char", "<code>char</code> is 4 bytes — any Unicode scalar value"],
      ["(i32, f64)", "Tuple — mixed types, fixed length, access with <code>.0</code>"],
      ["[i32; 5]", "Array — one type, fixed length, on the stack"],
      ["x as i64", "Explicit cast — Rust never converts numeric types implicitly"]
    ]
  },
  {
    title: "🔐 Ownership and borrowing",
    note: "The rule: <strong>many readers XOR one writer</strong>, and a borrow ends at its last use.",
    cols: ["Form", "Meaning"],
    rows: [
      ["let b = a;", "<strong>Moves</strong> <code>a</code> into <code>b</code> (unless the type is <code>Copy</code>)"],
      ["&x", "Immutable borrow — read only, many allowed at once"],
      ["&mut x", "Mutable borrow — read and write, exactly one at a time"],
      ["x.clone()", "Explicit deep copy (the expensive one is always visible)"],
      ["fn f(x: T)", "Takes ownership — the caller loses <code>x</code>"],
      ["fn f(x: &T)", "Borrows — prefer this when you only need to read"],
      ["fn f(x: &mut T)", "Borrows mutably — for modifying in place"],
      ["&str / &[T]", "Slices: borrowed views. Accept these in parameters"],
      ["String / Vec<T>", "Owned, growable. Return and store these"]
    ]
  },
  {
    title: "🎭 Enums, Option and Result",
    cols: ["Pattern", "Use"],
    rows: [
      ["Option<T>", "<code>Some(T)</code> or <code>None</code> — Rust's replacement for null"],
      ["Result<T, E>", "<code>Ok(T)</code> or <code>Err(E)</code> — recoverable errors"],
      ["match x { .. }", "Exhaustive — the compiler proves every case is handled"],
      ["if let Some(v) = x", "Handle one case, ignore the rest"],
      ["let Some(v) = x else { return };", "Bind, or bail out early"],
      ["x?", "Propagate the error to the caller (converts via <code>From</code>)"],
      ["x.unwrap()", "Panic on <code>None</code>/<code>Err</code> — fine in tests and prototypes"],
      ["x.expect(\"why\")", "Panic with your message — prefer over <code>unwrap</code>"],
      ["x.unwrap_or(d)", "Fall back to a default, never panics"],
      ["x.map(|v| ..)", "Transform the inner value, leaving the wrapper"],
      ["x.ok_or(err)", "Turn an <code>Option</code> into a <code>Result</code>"]
    ]
  },
  {
    title: "🗃️ Collections",
    cols: ["Operation", "Code"],
    rows: [
      ["New vector", "<code>Vec::new()</code> or <code>vec![1, 2, 3]</code>"],
      ["Add / remove", "<code>v.push(x)</code>, <code>v.pop()</code>, <code>v.insert(i, x)</code>, <code>v.remove(i)</code>"],
      ["Safe indexing", "<code>v.get(i)</code> → <code>Option&lt;&amp;T&gt;</code> (<code>v[i]</code> panics)"],
      ["Sort / filter", "<code>v.sort()</code>, <code>v.retain(|x| ..)</code>, <code>v.dedup()</code>"],
      ["New map", "<code>use std::collections::HashMap;</code> then <code>HashMap::new()</code>"],
      ["Insert / read", "<code>m.insert(k, v)</code>, <code>m.get(&amp;k)</code>"],
      ["Counter idiom", "<code>*m.entry(k).or_insert(0) += 1;</code>"],
      ["Sorted map", "<code>BTreeMap</code> — like <code>HashMap</code> but ordered by key"],
      ["Sets", "<code>HashSet</code>, <code>BTreeSet</code>"],
      ["Build a string", "<code>format!(\"{a}-{b}\")</code>, <code>s.push_str(..)</code>"],
      ["String length", "<code>s.len()</code> is BYTES; <code>s.chars().count()</code> is characters"]
    ]
  },
  {
    title: "⚡ Iterators",
    note: "Adapters are <strong>lazy</strong>; nothing runs until a consumer drives the chain.",
    cols: ["Method", "What it does"],
    rows: [
      ["iter() / iter_mut() / into_iter()", "Borrow / borrow mutably / consume"],
      ["map(|x| ..)", "Transform each item"],
      ["filter(|x| ..)", "Keep matching items"],
      ["filter_map(|x| ..)", "Filter and transform in one pass"],
      ["enumerate()", "Yield <code>(index, item)</code> pairs"],
      ["zip(other)", "Pair up two iterators"],
      ["take(n) / skip(n) / rev()", "First n / drop n / reverse"],
      ["chain(other) / flatten()", "Concatenate / flatten nested iterators"],
      ["collect()", "Build a <code>Vec</code>, <code>String</code>, <code>HashMap</code>… (a consumer)"],
      ["sum() / product() / count()", "Reduce to a number (consumers)"],
      ["find() / position() / any() / all()", "Search and test (consumers)"],
      ["fold(init, |acc, x| ..)", "General reduce (a consumer)"]
    ]
  },
  {
    title: "🧬 Generics, traits, lifetimes",
    cols: ["Syntax", "Meaning"],
    rows: [
      ["fn f<T>(x: T)", "Generic over any type <code>T</code>"],
      ["fn f<T: Trait>(x: T)", "…that implements <code>Trait</code> (a bound)"],
      ["fn f(x: impl Trait)", "Same thing, when you don't need to name the type"],
      ["where T: A + B", "Multiple bounds, more readable"],
      ["trait Name { fn m(&self); }", "Declare shared behaviour (bodies may be provided)"],
      ["impl Trait for Type", "Provide that behaviour for a type"],
      ["Box<dyn Trait>", "Trait object — runtime dispatch, mixed types allowed"],
      ["#[derive(Debug, Clone)]", "Auto-implement common traits"],
      ["fn f<'a>(x: &'a str) -> &'a str", "The result lives as long as <code>x</code>"],
      ["&'static str", "Lives for the whole program (every string literal is one)"]
    ]
  },
  {
    title: "📦 Smart pointers",
    cols: ["Type", "When to use it"],
    rows: [
      ["Box<T>", "Single owner, heap allocation — recursive types, large moves"],
      ["Rc<T>", "Multiple owners, single thread (reference counted)"],
      ["Arc<T>", "Multiple owners across threads (atomic)"],
      ["RefCell<T>", "Interior mutability, borrow rules checked at runtime (panics)"],
      ["Rc<RefCell<T>>", "Shared and mutable, single thread"],
      ["Arc<Mutex<T>>", "Shared and mutable across threads"],
      ["Weak<T>", "Non-owning reference — breaks <code>Rc</code> cycles"]
    ]
  },
  {
    title: "🧵 Concurrency",
    cols: ["Tool", "Use"],
    rows: [
      ["thread::spawn(move || ..)", "Start an OS thread; <code>move</code> is nearly always needed"],
      ["handle.join()", "Wait for a thread to finish"],
      ["mpsc::channel()", "Message passing — <code>send</code> moves ownership"],
      ["Mutex<T>", "Mutual exclusion; the mutex <em>owns</em> the data"],
      ["RwLock<T>", "Many readers or one writer"],
      ["Atomic*", "Lock-free counters and flags"],
      ["Send / Sync", "Auto traits: movable / shareable across threads"],
      ["rayon", "Data parallelism — swap <code>iter()</code> for <code>par_iter()</code>"],
      ["tokio", "Async runtime for network services"]
    ]
  },
  {
    title: "🧪 Testing",
    cols: ["Syntax", "Meaning"],
    rows: [
      ["#[test]", "Marks a test function"],
      ["#[cfg(test)] mod tests", "Compiled only when testing"],
      ["assert!(cond, \"msg {x}\")", "Assert a condition, with an optional message"],
      ["assert_eq!(a, b)", "Assert equality — prints both sides on failure"],
      ["#[should_panic(expected = \"..\")]", "Assert the code panics for the right reason"],
      ["#[ignore]", "Skip unless <code>--ignored</code> is passed"],
      ["cargo test NAME", "Run only tests whose name contains NAME"],
      ["cargo test -- --show-output", "Show <code>println!</code> from passing tests"],
      ["tests/*.rs", "Integration tests — public API only, each file its own crate"]
    ]
  },
  {
    title: "🔣 Symbols you'll see",
    cols: ["Symbol", "Meaning"],
    rows: [
      ["!", "Macro invocation (<code>println!</code>) — or the never type in a return position"],
      ["?", "Propagate the error / <code>None</code> to the caller"],
      ["&", "Borrow / reference"],
      ["*", "Dereference"],
      ["::", "Path separator (<code>std::io</code>, <code>Type::method</code>)"],
      ["->", "Return type"],
      ["=>", "Match arm separator"],
      ["|x|", "Closure parameters"],
      ["'a", "Lifetime parameter (or a loop label)"],
      ["_", "Ignore this value / wildcard pattern"],
      ["..", "Range, or “the rest” in a pattern or struct update"],
      ["..=", "Inclusive range"],
      ["#[..]", "Attribute (<code>#[derive]</code>, <code>#[test]</code>, <code>#[cfg]</code>)"],
      ["@", "Bind a value while also testing it against a pattern"],
      ["dyn", "Dynamic dispatch (trait object)"],
      ["::<T>", "Turbofish — specify a generic type explicitly"]
    ]
  },
  {
    title: "🚑 Common errors and fixes",
    cols: ["Error", "Usual fix"],
    rows: [
      ["borrow of moved value", "Use <code>&amp;x</code> to borrow, or <code>x.clone()</code>"],
      ["cannot borrow as mutable", "The variable needs <code>mut</code>, or another borrow is still alive"],
      ["cannot borrow as mutable more than once", "Shorten the first borrow's scope — it ends at its last use"],
      ["missing lifetime specifier", "Add <code>&lt;'a&gt;</code>, or return an owned <code>String</code> instead"],
      ["mismatched types: expected &str, found String", "Use <code>&amp;s</code> or <code>s.as_str()</code>"],
      ["cannot move out of borrowed content", "<code>.clone()</code>, or restructure to work with the reference"],
      ["non-exhaustive patterns", "Add the missing match arm, or a <code>_</code> catch-all"],
      ["doesn't live long enough", "The data dies before the reference does — extend its scope or own it"],
      ["Rc cannot be sent between threads", "Use <code>Arc</code> instead of <code>Rc</code>"],
      ["value used after move (into a closure)", "Add <code>move</code> and clone what the outer scope still needs"]
    ]
  }
];

export const GLOSSARY = [
  { term: "Borrow checker", def: "The part of the compiler that verifies every reference points to valid data and that the aliasing rules hold. It's the reason Rust needs no garbage collector." },
  { term: "Ownership", def: "Each value has exactly one owner; when the owner goes out of scope the value is dropped. The foundation of Rust's memory model." },
  { term: "Move", def: "Transferring ownership from one variable to another. The source becomes unusable. Cheap — only stack metadata is copied." },
  { term: "Borrow", def: "Temporary access to a value without taking ownership. <code>&amp;T</code> is shared and read-only; <code>&amp;mut T</code> is exclusive and writable." },
  { term: "Lifetime", def: "The span during which a reference is valid. Usually inferred; written as <code>'a</code> when the compiler needs the relationship spelled out." },
  { term: "Drop", def: "The automatic cleanup that runs when a value goes out of scope. Rust's version of a destructor, and why it needs no <code>finally</code> block." },
  { term: "Copy", def: "A trait for small stack-only types that are duplicated instead of moved — integers, <code>bool</code>, <code>char</code>, shared references." },
  { term: "Clone", def: "An explicit, potentially expensive deep copy. Always written out, so the cost is visible in the source." },
  { term: "Trait", def: "A set of methods a type can implement — Rust's interface. Supports default method bodies and can be implemented for foreign types." },
  { term: "Trait bound", def: "A constraint on a generic parameter, like <code>T: Display</code>. Checked once, so generic code either works for all valid types or fails immediately." },
  { term: "Trait object", def: "<code>dyn Trait</code> behind a pointer. Enables runtime polymorphism and mixed-type collections, at the cost of a vtable lookup." },
  { term: "Object safety", def: "The rules a trait must satisfy to be used as a trait object: no methods returning <code>Self</code>, no generic methods." },
  { term: "Monomorphization", def: "Generating a specialised copy of generic code for each concrete type used. Why Rust generics cost nothing at runtime." },
  { term: "Zero-cost abstraction", def: "An abstraction that compiles away entirely — iterators, generics and <code>Option</code> all produce code as fast as the hand-written equivalent." },
  { term: "Crate", def: "The unit of compilation: either a binary (with <code>main</code>) or a library. Rust's word for a package." },
  { term: "Package", def: "One <code>Cargo.toml</code>: up to one library crate plus any number of binary crates." },
  { term: "Workspace", def: "Several packages sharing one <code>Cargo.lock</code> and one <code>target/</code> directory. How large Rust projects are organised." },
  { term: "Module", def: "A namespace within a crate, declared with <code>mod</code>. Everything inside is private unless marked <code>pub</code>." },
  { term: "Prelude", def: "The set of items imported automatically into every file — <code>Option</code>, <code>Result</code>, <code>String</code>, <code>Vec</code>, <code>println!</code> and more." },
  { term: "Option&lt;T&gt;", def: "<code>Some(T)</code> or <code>None</code>. Rust's replacement for null: absence is encoded in the type, so it can't be ignored." },
  { term: "Result&lt;T, E&gt;", def: "<code>Ok(T)</code> or <code>Err(E)</code>. Recoverable errors as ordinary values — Rust has no exceptions." },
  { term: "Panic", def: "An unrecoverable error. Unwinds the stack and ends the thread. Signals a bug, not an expected failure." },
  { term: "The ? operator", def: "Early-returns the error (or <code>None</code>) from the enclosing function, converting error types via <code>From</code>." },
  { term: "Shadowing", def: "Declaring a new variable that reuses an existing name, possibly with a different type. Distinct from mutation." },
  { term: "Pattern", def: "A shape that a value is matched against, optionally binding parts of it. Used in <code>match</code>, <code>let</code>, <code>if let</code>, function parameters and more." },
  { term: "Exhaustiveness", def: "The compiler's guarantee that a <code>match</code> covers every possible value. Missing a case is a build error." },
  { term: "Refutable / irrefutable", def: "A refutable pattern may fail to match (<code>Some(x)</code>); an irrefutable one always matches (<code>x</code>). <code>let</code> requires irrefutable." },
  { term: "Closure", def: "An anonymous function that captures its environment. Classified as <code>Fn</code>, <code>FnMut</code> or <code>FnOnce</code> by how it uses what it captures." },
  { term: "Iterator", def: "Anything implementing <code>next()</code>. Gains 70+ combinators for free; adapters are lazy until a consumer runs them." },
  { term: "Slice", def: "A borrowed view of a contiguous sequence — <code>&amp;str</code>, <code>&amp;[T]</code>. A pointer plus a length; no copying." },
  { term: "Smart pointer", def: "A type that behaves like a pointer but adds capabilities — <code>Box</code>, <code>Rc</code>, <code>Arc</code>, <code>RefCell</code>, <code>Mutex</code>." },
  { term: "Interior mutability", def: "Mutating data through an immutable reference, with a runtime guarantee of exclusivity. Provided by <code>Cell</code>, <code>RefCell</code>, <code>Mutex</code>." },
  { term: "Newtype pattern", def: "Wrapping a value in a one-field tuple struct to create a distinct type. Free at runtime; sidesteps the orphan rule and prevents unit mix-ups." },
  { term: "Typestate pattern", def: "Encoding a state machine in the type system, so each transition consumes one type and returns another. Invalid sequences won't compile." },
  { term: "Orphan rule", def: "You may implement a trait for a type only if the trait or the type is yours. Guarantees one implementation exists globally." },
  { term: "Deref coercion", def: "Automatic conversion between reference types via the <code>Deref</code> trait — why <code>&amp;String</code> works where <code>&amp;str</code> is expected." },
  { term: "Send / Sync", def: "Marker traits meaning “can be moved between threads” and “can be shared by reference between threads”. Derived automatically; enforced by the compiler." },
  { term: "Data race", def: "Two threads accessing the same memory with at least one writing, without synchronisation. Impossible in safe Rust." },
  { term: "Unsafe", def: "A block permitting five extra operations the compiler can't verify. It disables no checks — it just marks code that needs human review." },
  { term: "Macro", def: "Code that generates code at compile time. <code>macro_rules!</code> for declarative macros; procedural macros power <code>derive</code> and attributes." },
  { term: "Turbofish", def: "The <code>::&lt;T&gt;</code> syntax for specifying a generic type explicitly, as in <code>\"42\".parse::&lt;i32&gt;()</code>." },
  { term: "Edition", def: "An opt-in set of language changes (2015, 2018, 2021, 2024). Crates on different editions interoperate, so upgrades never split the ecosystem." },
  { term: "Future", def: "A value representing work that will complete later. Lazy in Rust: nothing runs until a runtime polls it." },
  { term: "Async runtime", def: "The executor that drives futures — <code>tokio</code>, <code>async-std</code>, <code>smol</code>, <code>embassy</code>. Not part of the standard library." },
  { term: "Fat pointer", def: "A pointer carrying extra data: <code>&amp;str</code> and <code>&amp;[T]</code> carry a length; <code>&amp;dyn Trait</code> carries a vtable pointer." },
  { term: "RAII", def: "Resource Acquisition Is Initialisation — tying resource cleanup to scope. In Rust this is the <code>Drop</code> trait, and it's automatic." }
];
