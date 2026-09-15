export default {
  id: 3,
  title: "Common Programming Concepts",
  emoji: "🧱",
  blurb: "Variables, types, functions, control flow — the Rust way",
  intro: "The familiar building blocks every language has — but with Rust's twists: immutability by default, expressions everywhere, and no implicit conversions.",
  lessons: [
    {
      id: "3.1",
      title: "Variables and mutability",
      est: "6 min",
      tags: ["let","mut","const","shadowing","immutable"],
      cards: [
        {
          t: "concept",
          kicker: "The default that surprises everyone",
          title: "Variables are immutable unless you say otherwise",
          code: { src:
`fn main() {
    let x = 5;
    println!("x is {x}");
    x = 6;                 // ❌ error: cannot assign twice to immutable variable
}` },
          after: ["Add <code>mut</code> and it compiles:"],
          code2: { src:
`fn main() {
    let mut x = 5;
    println!("x is {x}");
    x = 6;                 // ✅ fine now
    println!("x is {x}");
}` },
          body: [
            "Rust flips the default of almost every other language. Why? Because <strong>most variables never need to change</strong>, and marking the ones that do makes intent obvious — to readers, and to the compiler, which can optimise and can guarantee nobody else changes your data behind your back."
          ],
          note: { html: "You'll see <code>mut</code> appear in the error message as the suggested fix. Rust's compiler errors are famously helpful — read them, they usually tell you the answer." },
          compare: {
            note: "Only Rust makes <em>immutable</em> the default and <em>mutable</em> the opt-in.",
            langs: {
              rust: `let x = 5;        // immutable
let mut y = 5;    // mutable
y += 1;           // fine`,
              python: { src:
`x = 5      # everything is rebindable
x = 6      # fine
X = 5      # UPPERCASE is just a convention, nothing enforces it`, note: "Python has no real immutability for names." },
              java: { src:
`int x = 5;          // mutable by default
final int y = 5;    // opt in to immutable`, note: "Java's final ≈ Rust's default. Rust just picked the safer default." },
              cpp: { src:
`int x = 5;          // mutable by default
const int y = 5;    // opt in to immutable`, note: "Everyone says 'use const everywhere' in C++. Rust made that automatic." },
              go: { src:
`x := 5             // mutable
const y = 5        // compile-time constant only`, note: "Go's const only works for compile-time values, like Rust's const." }
            }
          }
        },
        {
          t: "concept",
          kicker: "Three ways to not change",
          title: "let vs let mut vs const",
          code: { src:
`const MAX_POINTS: u32 = 100_000;   // always uppercase, type required,
                                   // computed at compile time, global scope OK

fn main() {
    let a = 1;           // immutable binding
    let mut b = 1;       // mutable binding
    b += 1;

    let a = a + 1;       // shadowing: a brand-new immutable 'a'
    let a = "now text";  // shadowing can even change the type

    println!("{a} {b} {MAX_POINTS}");
}` },
          list: [
            "<code>let</code> — immutable binding, type usually inferred.",
            "<code>let mut</code> — same, but you may reassign or mutate it. The type cannot change.",
            "<code>const</code> — a true compile-time constant. Type is mandatory, name is SCREAMING_CASE, and it's inlined everywhere it's used.",
            "<strong>Shadowing</strong> — reusing a name with a fresh <code>let</code>. New variable, new type allowed, still immutable."
          ],
          note: { html: "<code>100_000</code> — underscores in numbers are ignored and purely for readability. Handy for <code>1_000_000_000</code>." }
        },
        {
          t: "quiz",
          q: "Which of these compiles?",
          code: { src:
`let spaces = "   ";
let spaces = spaces.len();` },
          options: [
            "Yes — this is shadowing, and shadowing may change the type",
            "No — you can't redeclare a variable",
            "No — the type changed from &str to usize",
            "Only if the first line says <code>let mut spaces</code>"
          ],
          answer: 0,
          why: "Shadowing creates a <strong>new variable</strong> that reuses the name, so changing the type is fine. With <code>mut</code> it would be an error — <code>mut</code> lets you change the <em>value</em>, never the <em>type</em>."
        },
        {
          t: "swipe",
          statement: "<code>const</code> and <code>let</code> are basically the same thing with different spelling.",
          answer: false,
          why: "<code>const</code> is evaluated at <strong>compile time</strong>, must have an explicit type, can be declared at global scope, and is inlined at every use site. <code>let</code> is a runtime binding that lives in a scope. You can't write <code>const x = some_function();</code> unless that function is itself <code>const</code>."
        },
        {
          t: "summary",
          title: "Variables, done",
          points: [
            "<strong>Immutable by default</strong> — add <code>mut</code> only where you need change.",
            "<code>const</code> = compile-time, typed, SCREAMING_CASE, any scope.",
            "<strong>Shadowing</strong> reuses a name for a genuinely new variable — type changes allowed.",
            "Underscores in number literals (<code>1_000_000</code>) are purely cosmetic."
          ]
        }
      ]
    },
    {
      id: "3.2",
      title: "Data types",
      est: "8 min",
      tags: ["types","integer","float","bool","char","tuple","array","overflow"],
      cards: [
        {
          t: "concept",
          kicker: "Scalars",
          title: "Rust makes you say how big your numbers are",
          code: { src:
`// Signed        Unsigned      Size
let a: i8   = -128;   let b: u8   = 255;      // 8-bit
let c: i16  = 0;      let d: u16  = 0;        // 16-bit
let e: i32  = 0;      let f: u32  = 0;        // 32-bit  <- i32 is the default
let g: i64  = 0;      let h: u64  = 0;        // 64-bit
let i: i128 = 0;      let j: u128 = 0;        // 128-bit
let k: isize = 0;     let l: usize = 0;       // pointer-sized (usize for indexing)

let x: f64 = 2.0;     // 64-bit float — the default
let y: f32 = 3.0;     // 32-bit float

let t: bool = true;
let c: char = '🦀';   // 4 bytes, a Unicode scalar value — not a byte!` },
          body: [
            "If you don't annotate, Rust infers <code>i32</code> for integers and <code>f64</code> for floats — good defaults on modern hardware.",
            "<code>usize</code> is the type used for indexing and lengths: it's as wide as a pointer on your machine (64-bit on most)."
          ],
          compare: {
            note: "Rust's names tell you exactly what you get. C's <code>int</code> could be 16, 32 or 64 bits depending on platform — a legendary source of portability bugs.",
            langs: {
              python: { src:
`x = 5                # int: arbitrary precision, never overflows
y = 2.0              # float: always 64-bit
c = "🦀"             # no char type — just a 1-length str`, note: "Python trades speed for never having to think about width." },
              java: { src:
`byte b; short s; int i; long l;   // always signed, fixed sizes
float f; double d;
char c;   // 16-bit UTF-16 unit — can't hold 🦀 in one char!`, note: "Java has no unsigned types, and its char is too small for emoji." },
              go: { src:
`var a int8; var b uint8   // Go's names match Rust's closely
var i int                 // platform-sized
var r rune                // 32-bit, = Rust's char`, note: "Go's rune is exactly Rust's char." },
              c: { src:
`int8_t a; uint8_t b;      // <stdint.h> — the portable way
int i;                    // 16, 32 or 64 bits... depends!
char c;                   // 1 byte, signedness is implementation-defined`, note: "Rust made the explicit-width types the normal ones." }
            }
          }
        },
        {
          t: "concept",
          kicker: "The famous one",
          title: "Integer overflow is not silent",
          body: [
            "In C, C++ and Go, <code>u8</code> 255 + 1 quietly wraps to 0. In Rust:"
          ],
          code: { src:
`let x: u8 = 255;
let y = x + 1;
// Debug build:   💥 panics — "attempt to add with overflow"
// Release build: wraps to 0 (checks removed for speed)

// Be explicit instead — these work identically in every build:
let a = x.wrapping_add(1);    // 0        — wrap around
let b = x.checked_add(1);     // None     — Option: tells you it failed
let c = x.saturating_add(1);  // 255      — clamp at the maximum
let (d, over) = x.overflowing_add(1);  // (0, true) — value + did-it-overflow` },
          note: { warn: true, html: "<b>Rule of thumb:</b> if overflow is <em>possible in your domain</em>, use one of the explicit methods. Don't rely on the debug-build panic — it's a safety net, not a design." },
          compare: {
            note: "Overflow bugs have caused rocket failures and banking exploits. Rust makes you choose a behaviour instead of assuming one.",
            langs: {
              c: `uint8_t x = 255;
x + 1;   // == 0, silently. Signed overflow is UB — even worse.`,
              java: `int x = Integer.MAX_VALUE;
x + 1;   // silently wraps to Integer.MIN_VALUE`,
              go: `var x uint8 = 255
x + 1    // silently 0`,
              python: `x = 255
x + 1    # 256 — Python ints just grow. No overflow ever.`
            }
          }
        },
        {
          t: "quiz",
          q: "In a <strong>debug</strong> build, what does this do?",
          code: { src: `let x: u8 = 250;\nlet y = x + 10;` },
          options: [
            "Panics with “attempt to add with overflow”",
            "Silently wraps to 4",
            "Automatically promotes to u16 and gives 260",
            "Compile error"
          ],
          answer: 0,
          why: "Debug builds insert overflow checks, so it <strong>panics immediately</strong> and you find the bug. Release builds wrap for speed. If you need a defined answer in both, say so with <code>wrapping_add</code>, <code>checked_add</code> or <code>saturating_add</code>."
        },
        {
          t: "concept",
          kicker: "Compound types",
          title: "Tuples and arrays — both fixed size",
          code: { src:
`// Tuple: fixed length, MIXED types
let tup: (i32, f64, char) = (500, 6.4, 'x');
let (a, b, c) = tup;             // destructuring
let first = tup.0;               // index with a dot
let unit = ();                   // the empty tuple — Rust's "void"

// Array: fixed length, SAME type, lives on the stack
let arr: [i32; 5] = [1, 2, 3, 4, 5];
let zeros = [0; 10];             // ten zeros
let item = arr[0];
let len = arr.len();             // 5

// Out of bounds is checked at RUNTIME and panics — never reads junk memory
let idx = 10;
// arr[idx];   // 💥 index out of bounds: the len is 5 but the index is 10` },
          note: { html: "Need a <em>growable</em> list? That's <code>Vec&lt;T&gt;</code>, coming in Chapter 8. Arrays are for when you know the exact size up front." },
          compare: {
            note: "The important difference: in C, reading past the end of an array is undefined behaviour that may read anything. In Rust it is a clean, immediate panic.",
            langs: {
              python: { src:
`t = (500, 6.4, 'x')     # tuple, mixed types
a, b, c = t             # destructuring
arr = [1, 2, 3, 4, 5]   # list — growable, more like Rust's Vec
arr[10]                 # IndexError`, note: "Python's list ≈ Rust's Vec, not Rust's array." },
              go: { src:
`arr := [5]int{1,2,3,4,5}   // array, fixed size
sl  := []int{1,2,3}        // slice, growable
arr[10]                    // compile error if constant, else panic`, note: "Go distinguishes array vs slice much like Rust's array vs Vec." },
              java: { src:
`int[] arr = {1,2,3,4,5};
arr[10];   // ArrayIndexOutOfBoundsException`, note: "Java also bounds-checks — safe, like Rust." },
              c: { src:
`int arr[5] = {1,2,3,4,5};
arr[10];   // 😱 undefined behaviour — no check at all`, note: "This single difference is behind a huge share of real-world security bugs." }
            }
          }
        },
        {
          t: "swipe",
          statement: "Rust will automatically convert an <code>i32</code> into an <code>i64</code> when you add them.",
          answer: false,
          why: "Rust has <strong>no implicit numeric conversion</strong>, ever. <code>let x: i32 = 5; let y: i64 = 10; x + y</code> is a compile error. You must write <code>x as i64 + y</code> or <code>i64::from(x) + y</code>. Verbose, yes — but no more surprise truncation or precision loss."
        },
        {
          t: "summary",
          title: "Types, done",
          points: [
            "Integers state their width and signedness: <code>i8</code>…<code>i128</code>, <code>u8</code>…<code>u128</code>, plus <code>isize</code>/<code>usize</code>. Default: <code>i32</code>.",
            "Overflow <strong>panics in debug</strong>, wraps in release — or be explicit with <code>checked_</code>/<code>wrapping_</code>/<code>saturating_</code>.",
            "<code>char</code> is 4 bytes and holds any Unicode scalar value, emoji included.",
            "Tuples mix types and are indexed with <code>.0</code>; arrays are one type, fixed length, bounds-checked.",
            "<strong>No implicit conversions</strong> — use <code>as</code> or <code>from</code>."
          ]
        }
      ]
    },
    {
      id: "3.3",
      title: "Functions and expressions",
      est: "6 min",
      tags: ["fn","functions","expression","statement","return"],
      cards: [
        {
          t: "concept",
          kicker: "Functions",
          title: "Parameter types are always required",
          code: { src:
`fn main() {
    let result = add(5, 6);
    println!("{result}");
    print_label("total", result);
}

fn add(x: i32, y: i32) -> i32 {
    x + y            // no semicolon = this is the return value
}

fn print_label(name: &str, value: i32) {   // no -> means it returns ()
    println!("{name}: {value}");
}` },
          body: [
            "Rust infers types <em>inside</em> functions, but <strong>never in the signature</strong>. That's deliberate: the signature is documentation and a contract, and it means changing a function body can never silently change its public type.",
            "Functions can be defined in any order — <code>main</code> can call something declared below it. No forward declarations, unlike C."
          ],
          compare: {
            note: "Only Rust and Go make the return type mandatory-and-explicit while inferring everything inside the body.",
            langs: {
              python: `def add(x, y):        # types optional (and unchecked at runtime)
    return x + y`,
              go: `func add(x, y int) int {
    return x + y      // explicit return required
}`,
              java: `int add(int x, int y) { return x + y; }`,
              c: `int add(int x, int y) { return x + y; }
// and you may need a prototype above main()`,
              cpp: `auto add(int x, int y) -> int { return x + y; }  // same arrow syntax!`
            }
          }
        },
        {
          t: "concept",
          kicker: "The mental shift",
          title: "Statements vs expressions — almost everything is an expression",
          code: { src:
`fn main() {
    // A block is an expression: it evaluates to its last expression
    let y = {
        let x = 3;
        x + 1        // no semicolon -> the block's value is 4
    };

    // if is an expression, so no ternary operator is needed
    let condition = true;
    let number = if condition { 5 } else { 6 };

    // match is an expression too
    let label = match number {
        5 => "five",
        _ => "other",
    };

    println!("{y} {number} {label}");   // 4 5 five
}` },
          body: [
            "<strong>Statements</strong> do something and return nothing (<code>let x = 5;</code>). <strong>Expressions</strong> evaluate to a value (<code>5 + 6</code>, <code>if ...</code>, <code>match ...</code>, a block <code>{ ... }</code>).",
            "Adding a semicolon turns an expression into a statement, discarding its value. That one character is the single most common beginner error in Rust — and the error message always points right at it."
          ],
          note: { warn: true, html: "<code>fn f() -> i32 { 5; }</code> ❌ — the semicolon throws the 5 away, so the function returns <code>()</code>. Drop the semicolon: <code>{ 5 }</code> ✅" },
          compare: {
            note: "Rust has <strong>no ternary operator</strong> — it doesn't need one, because <code>if</code> already produces a value.",
            langs: {
              rust: `let number = if condition { 5 } else { 6 };`,
              python: `number = 5 if condition else 6`,
              java: `int number = condition ? 5 : 6;`,
              c: `int number = condition ? 5 : 6;`,
              go: { src:
`var number int
if condition { number = 5 } else { number = 6 }`, note: "Go has neither a ternary nor if-as-expression — you need a mutable variable." }
            }
          }
        },
        {
          t: "quiz",
          q: "What does this function return?",
          code: { src: `fn f() -> i32 {\n    let x = 5;\n    x + 1;\n}` },
          options: [
            "Nothing — it's a compile error, because the semicolon discards the value",
            "6",
            "5",
            "()"
          ],
          answer: 0,
          why: "The trailing semicolon makes <code>x + 1;</code> a <em>statement</em>, so the block evaluates to <code>()</code> — which doesn't match the declared <code>-> i32</code>. Remove the semicolon (or write <code>return x + 1;</code>) and it returns 6."
        },
        {
          t: "order",
          prompt: "Build a function that doubles a number and returns it",
          pieces: ["fn double(n: i32) -> i32 {", "n * 2", "}"],
          answer: [0,1,2],
          why: "Signature with explicit parameter and return types, then a final expression with <strong>no semicolon</strong> as the return value. Idiomatic Rust prefers this over <code>return n * 2;</code>."
        },
        {
          t: "summary",
          title: "Functions, done",
          points: [
            "Parameter and return types are <strong>always explicit</strong> in the signature.",
            "The last expression in a block is its value — <strong>omit the semicolon</strong> to return it.",
            "<code>if</code>, <code>match</code> and blocks are all <strong>expressions</strong> that produce values.",
            "<code>return</code> exists for early exits, but a trailing expression is the idiomatic way.",
            "No return type means returning <code>()</code>, the unit type."
          ]
        }
      ]
    },
    {
      id: "3.4",
      title: "Comments and documentation",
      est: "3 min",
      tags: ["comments","doc","rustdoc","documentation"],
      cards: [
        {
          t: "concept",
          kicker: "Comments",
          title: "Three kinds — and two of them build a website",
          code: { src:
`// A normal line comment.

/* A block comment,
   which can nest. */

/// Doc comment for the THING BELOW. Markdown supported.
///
/// # Examples
///
/// \`\`\`
/// let n = my_crate::double(4);
/// assert_eq!(n, 8);
/// \`\`\`
pub fn double(n: i32) -> i32 { n * 2 }

//! Doc comment for the THING CONTAINING it (a module or crate).
//! Put these at the very top of a file.` },
          body: [
            "<code>///</code> and <code>//!</code> comments are compiled by <code>cargo doc</code> into a browsable HTML site that looks exactly like the official std docs.",
            "The magic part: <strong>code examples inside doc comments are run as tests</strong> by <code>cargo test</code>. Your documentation can't silently rot into a lie."
          ],
          note: { html: "This is why Rust libraries have unusually good docs — the tooling makes writing them the path of least resistance, and the compiler keeps the examples honest." },
          compare: {
            note: "Doctests aren't unique (Python has them), but Rust runs them <em>by default</em>, for every library, as part of the normal test command.",
            langs: {
              python: `def double(n):
    """Double a number.

    >>> double(4)
    8
    """
    return n * 2`,
              java: `/** Doubles a number. @param n the input */
int double(int n) { return n * 2; }   // javadoc — not executed`,
              go: `// Double doubles a number.
func Double(n int) int { return n * 2 }   // godoc; Example funcs are tested`,
              cpp: `/// Doubles a number. (Doxygen — not executed)
int doubleIt(int n) { return n * 2; }`
            }
          }
        },
        {
          t: "quiz",
          q: "What happens to the code inside a <code>///</code> doc comment's example block when you run <code>cargo test</code>?",
          options: [
            "It's compiled and run as a test",
            "It's ignored — comments aren't code",
            "It's only checked for syntax",
            "It's copied into the docs verbatim and nothing else"
          ],
          answer: 0,
          why: "They're called <strong>doctests</strong>. Every example in every doc comment is compiled and executed. If you change an API and forget to update the docs, your test suite fails."
        },
        {
          t: "summary",
          title: "Comments, done",
          points: [
            "<code>//</code> line, <code>/* */</code> block (and they nest).",
            "<code>///</code> documents the item <em>below</em>; <code>//!</code> documents the enclosing module or crate.",
            "<code>cargo doc --open</code> builds a full documentation site from them.",
            "Examples inside doc comments are <strong>run as tests</strong> — docs stay true."
          ]
        }
      ]
    },
    {
      id: "3.5",
      title: "Control flow",
      est: "7 min",
      tags: ["if","loop","while","for","break","labels","range"],
      cards: [
        {
          t: "concept",
          kicker: "Branching",
          title: "if — with no parentheses, and no truthiness",
          code: { src:
`let number = 6;

if number % 4 == 0 {
    println!("divisible by 4");
} else if number % 3 == 0 {
    println!("divisible by 3");
} else {
    println!("not divisible by 4 or 3");
}

// The condition MUST be a bool:
// if number { ... }   ❌ error: expected bool, found integer` },
          body: [
            "No parentheses around the condition, braces are mandatory (so no dangling-else bugs), and <strong>there is no truthiness</strong>. <code>0</code>, <code>\"\"</code> and empty collections are not false — they're just values of their own types.",
            "Forcing an explicit <code>bool</code> kills the classic <code>if (x = 5)</code> assignment typo, because assignment doesn't produce a bool in Rust."
          ],
          compare: {
            note: "Truthiness feels convenient until it bites. Rust just won't play.",
            langs: {
              python: `if number:       # 0, "", [], None are all falsy
    ...`,
              c: `if (number) { }   // any nonzero is true
if (x = 5) { }    // classic typo: assigns, then tests. Compiles!`,
              java: `if (number != 0) { }   // Java also requires a boolean — like Rust`,
              go: `if number != 0 { }     // Go also requires a bool, no parens — closest match`
            }
          }
        },
        {
          t: "concept",
          kicker: "Looping",
          title: "Three loops, and one of them returns a value",
          code: { src:
`// 1. loop — infinite until you break. Can RETURN a value.
let mut counter = 0;
let result = loop {
    counter += 1;
    if counter == 10 { break counter * 2; }   // break WITH a value
};
println!("{result}");   // 20

// 2. while — loop with a condition
let mut n = 3;
while n != 0 {
    println!("{n}!");
    n -= 1;
}

// 3. for — iterate over anything iterable. The one you'll use most.
let a = [10, 20, 30];
for element in a {
    println!("{element}");
}
for i in 0..5        { println!("{i}"); }   // 0 1 2 3 4
for i in (1..=3).rev() { println!("{i}"); } // 3 2 1
for (i, v) in a.iter().enumerate() {
    println!("index {i} = {v}");
}` },
          note: { html: "Rust has <strong>no C-style <code>for (i = 0; i < n; i++)</code></strong>. Use <code>for i in 0..n</code>. It's shorter, and it can't run off the end of the array." },
          compare: {
            note: "Rust's <code>for</code> is a for-each over iterators — like Python's, not like C's.",
            langs: {
              python: `for element in a: print(element)
for i in range(5): print(i)
for i, v in enumerate(a): print(i, v)`,
              go: `for _, element := range a { fmt.Println(element) }
for i := 0; i < 5; i++ { fmt.Println(i) }`,
              java: `for (int element : a) System.out.println(element);
for (int i = 0; i < 5; i++) { }`,
              c: `for (int i = 0; i < 3; i++) printf("%d\\n", a[i]);
// off-by-one here reads past the array. In Rust, that can't happen.`
            }
          }
        },
        {
          t: "concept",
          kicker: "Nested loops",
          title: "Loop labels: break out of the loop you mean",
          code: { src:
`let mut count = 0;
'outer: loop {
    let mut remaining = 10;
    loop {
        if remaining == 9 { break; }           // breaks the inner loop
        if count == 2     { break 'outer; }    // breaks the OUTER loop
        remaining -= 1;
    }
    count += 1;
}
println!("count = {count}");   // 2` },
          body: [
            "Labels start with a single quote (<code>'outer</code>) — the same syntax you'll later see for lifetimes. Both are \"names for a region of code\"."
          ],
          compare: {
            note: "Python is the odd one out here — it needs a flag variable or an exception.",
            langs: {
              java: `outer:
for (...) { for (...) { break outer; } }`,
              go: `Outer:
for { for { break Outer } }`,
              c: `// no labelled break — you need goto or a flag
goto done;`,
              python: `# no labelled break at all — use a flag, or wrap in a function and return
for i in ...:
    for j in ...:
        if done: break
    else:
        continue
    break`
            }
          }
        },
        {
          t: "quiz",
          q: "What does <code>result</code> hold?",
          code: { src: `let mut i = 0;\nlet result = loop {\n    i += 1;\n    if i == 5 { break i * 3; }\n};` },
          options: ["15", "5", "()", "Compile error — loops don't return values"],
          answer: 0,
          why: "<code>loop</code> is an <strong>expression</strong>, and <code>break value</code> makes that value the result of the loop. It breaks when <code>i == 5</code>, returning <code>5 * 3 = 15</code>. Only <code>loop</code> can do this — <code>while</code> and <code>for</code> always evaluate to <code>()</code>."
        },
        {
          t: "swipe",
          statement: "In Rust you can write <code>if items.len() { ... }</code> to check a collection isn't empty.",
          answer: false,
          why: "No truthiness in Rust. <code>len()</code> returns a <code>usize</code>, not a <code>bool</code>, so that's a type error. Write <code>if !items.is_empty()</code> — which is clearer anyway."
        },
        {
          t: "order",
          prompt: "Build a loop that prints 0, 1, 2, 3, 4",
          pieces: ["for i in 0..5 {", 'println!("{i}");', "}"],
          answer: [0,1,2],
          why: "<code>0..5</code> is an exclusive range giving 0,1,2,3,4. For 0 through 5 inclusive you'd write <code>0..=5</code>."
        },
        {
          t: "summary",
          title: "Chapter 3 complete 🎉",
          points: [
            "<code>if</code> needs a real <code>bool</code>, no parens, mandatory braces — and it's an expression.",
            "<code>loop</code> (can <code>break</code> with a value), <code>while</code>, and <code>for x in iterable</code>.",
            "Ranges: <code>0..5</code> excludes 5, <code>0..=5</code> includes it; <code>.rev()</code>, <code>.enumerate()</code> help.",
            "Labels like <code>'outer</code> let you break the loop you actually mean.",
            "You now know every everyday construct. Next up: the idea that makes Rust <em>Rust</em>."
          ]
        }
      ]
    }
  ]
};
