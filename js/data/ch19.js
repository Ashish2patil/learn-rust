export default {
  id: 19,
  title: "Patterns and Matching",
  emoji: "🧿",
  blurb: "Everywhere patterns appear, and everything they can do",
  intro: "You've used patterns since Chapter 2. Here's the full catalogue: where they're allowed, which ones must be exhaustive, and every piece of syntax they support.",
  lessons: [
    {
      id: "19.1",
      title: "Where patterns can be used",
      est: "6 min",
      tags: ["pattern","irrefutable","refutable","destructuring","let"],
      cards: [
        {
          t: "concept",
          kicker: "More places than you think",
          title: "Patterns appear in eight places",
          code: { src:
`// 1. match arms
match x { Some(n) => n, None => 0 }

// 2. if let
if let Some(color) = favorite_color { }

// 3. while let
while let Some(top) = stack.pop() { }

// 4. for loops — (index, value) is a pattern!
for (index, value) in v.iter().enumerate() { }

// 5. let statements — every 'let' destructures a pattern
let (x, y, z) = (1, 2, 3);
let Point { x, y } = point;

// 6. function parameters
fn print_coordinates(&(x, y): &(i32, i32)) {
    println!("({x}, {y})");
}

// 7. closure parameters
points.iter().map(|&(x, y)| x + y);

// 8. let ... else
let Some(v) = opt else { return };` },
          body: [
            "Even <code>let x = 5;</code> is a pattern match — <code>x</code> is just a pattern that matches anything and binds it. Once you see that, the rest of the system falls into place."
          ]
        },
        {
          t: "concept",
          kicker: "Two categories",
          title: "Refutable vs irrefutable",
          code: { src:
`// IRREFUTABLE — always matches. Required by let, for, fn params.
let x = 5;
let (a, b) = (1, 2);

// REFUTABLE — might not match. Allowed by if let, while let, match arms.
if let Some(x) = a_value { }

// ❌ let requires irrefutable:
// let Some(x) = a_value;
//   error: refutable pattern in local binding
//   help: you might want to use 'let else' or 'if let'

// ✅ Either of these:
let Some(x) = a_value else { return; };
if let Some(x) = a_value { }

// ❌ if let with an irrefutable pattern is pointless — and warns:
// if let x = 5 { }   warning: irrefutable if-let pattern` },
          body: [
            "The distinction is simply: <em>can this pattern fail to match?</em> Constructs with nowhere to go on failure (like <code>let</code>) demand patterns that always succeed."
          ]
        },
        {
          t: "quiz",
          q: "Why is <code>let Some(x) = maybe_value;</code> an error?",
          options: [
            "<code>Some(x)</code> is refutable — it fails to match when the value is <code>None</code>, and <code>let</code> has no fallback",
            "You can't destructure enums with <code>let</code>",
            "You need <code>mut</code>",
            "<code>Option</code> must be matched with <code>match</code>"
          ],
          answer: 0,
          why: "If the value were <code>None</code>, there'd be no value to bind to <code>x</code> and no branch to take. Use <code>if let</code> (do something when it matches) or <code>let ... else</code> (bind, or bail out)."
        },
        {
          t: "summary",
          title: "Where patterns live",
          points: [
            "Patterns appear in <code>match</code>, <code>if let</code>, <code>while let</code>, <code>for</code>, <code>let</code>, <code>let else</code>, and function and closure parameters.",
            "<strong>Irrefutable</strong> patterns always match — required by <code>let</code>, <code>for</code> and parameters.",
            "<strong>Refutable</strong> patterns may fail — allowed in <code>if let</code>, <code>while let</code> and match arms.",
            "Even <code>let x = 5;</code> is pattern matching."
          ]
        }
      ]
    },
    {
      id: "19.2",
      title: "Pattern syntax, end to end",
      est: "9 min",
      tags: ["match guard","binding","range","struct pattern","rest","ignore"],
      cards: [
        {
          t: "concept",
          kicker: "Literals, ranges, alternatives",
          title: "Matching values",
          code: { src:
`let x = 5;

match x {
    1 => println!("one"),
    2 | 3 => println!("two or three"),        // alternatives with |
    4..=9 => println!("four through nine"),   // inclusive range
    _ => println!("something else"),
}

match some_char {
    'a'..='j' => println!("early letter"),
    'k'..='z' => println!("late letter"),
    _ => println!("something else"),
}

// Matching Option and named constants
match config {
    None => use_default(),
    Some(0) => println!("explicitly zero"),
    Some(n) if n < 0 => println!("negative"),   // match guard
    Some(n) => println!("{n}"),
}` },
          note: { html: "Ranges in patterns only work for <code>char</code> and integer types, because those are the types where the compiler can reason about exhaustiveness." }
        },
        {
          t: "concept",
          kicker: "Taking things apart",
          title: "Destructuring structs, enums, tuples and nesting",
          code: { src:
`struct Point { x: i32, y: i32 }

let p = Point { x: 0, y: 7 };

let Point { x: a, y: b } = p;      // rename while binding
let Point { x, y } = p;            // shorthand: same names

match p {
    Point { x, y: 0 } => println!("on the x axis at {x}"),
    Point { x: 0, y } => println!("on the y axis at {y}"),
    Point { x, y }    => println!("at ({x}, {y})"),
}

enum Message {
    Quit,
    Move { x: i32, y: i32 },
    Write(String),
    ChangeColor(Color),
}
enum Color { Rgb(i32, i32, i32), Hsv(i32, i32, i32) }

match msg {
    Message::Quit => println!("quit"),
    Message::Move { x, y } => println!("move to ({x}, {y})"),
    Message::Write(text) => println!("write {text}"),
    // Nested patterns go as deep as you like:
    Message::ChangeColor(Color::Rgb(r, g, b)) => println!("rgb {r} {g} {b}"),
    Message::ChangeColor(Color::Hsv(h, s, v)) => println!("hsv {h} {s} {v}"),
}

// Mixed nesting
let ((feet, inches), Point { x, y }) = ((3, 10), Point { x: 3, y: -10 });` },
          compare: {
            note: "Python's structural pattern matching (3.10+) was directly inspired by languages like Rust. JavaScript has destructuring but no matching.",
            langs: {
              python: `match msg:
    case Move(x=x, y=y): print(f"move to ({x}, {y})")
    case Write(text):    print(f"write {text}")
    case _:              pass
# no exhaustiveness checking`,
              js: `const { x, y } = point;          // destructuring, but no match
const [a, b] = pair;`,
              java: `switch (msg) {                     // Java 21 pattern matching
    case Move(int x, int y) -> ...;
    case Write(String text) -> ...;
}`,
              go: `// No destructuring at all. Read the fields one by one.
switch m := msg.(type) { case Move: fmt.Println(m.X, m.Y) }`
            }
          }
        },
        {
          t: "concept",
          kicker: "Ignoring and binding",
          title: "_, .., and the @ operator",
          code: { src:
`// _ ignores one value
match (1, 2, 3) {
    (first, _, third) => println!("{first} {third}"),
}

// _name suppresses the unused-variable warning but still binds
let _unused = compute();

// _ alone does NOT bind — so it doesn't move the value
let s = Some(String::from("hi"));
if let Some(_) = s { }
println!("{s:?}");   // ✅ still valid — nothing was moved

// .. ignores the remaining parts
struct Point3 { x: i32, y: i32, z: i32 }
match origin {
    Point3 { x, .. } => println!("x is {x}"),
}
match numbers {
    (first, .., last) => println!("{first} {last}"),
}

// @ binds a value AND tests it against a pattern
enum Msg { Hello { id: i32 } }

match msg {
    Msg::Hello { id: id_var @ 3..=7 } => println!("in range: {id_var}"),
    Msg::Hello { id: 10..=12 }        => println!("in another range"),
    Msg::Hello { id }                 => println!("other: {id}"),
}` },
          note: { warn: true, html: "<code>_</code> and <code>_name</code> differ: <code>_name</code> <b>binds</b> (and can move the value), while bare <code>_</code> doesn't bind at all. That difference matters when the value is a non-<code>Copy</code> type." }
        },
        {
          t: "concept",
          kicker: "Extra conditions",
          title: "Match guards",
          code: { src:
`let num = Some(4);

match num {
    Some(x) if x % 2 == 0 => println!("{x} is even"),
    Some(x) => println!("{x} is odd"),
    None => (),
}

// Guards solve the shadowing problem:
let y = 5;
match Some(5) {
    Some(n) if n == y => println!("matched the outer y"),   // ✅ compares
    Some(n) => println!("got {n}"),                         // Some(n) alone
    None => (),                                             // would SHADOW y
}

// A guard applies to the whole | alternation:
match x {
    4 | 5 | 6 if y => println!("yes"),     // reads as (4|5|6) if y
    _ => println!("no"),
}` },
          note: { warn: true, html: "The compiler cannot reason about guard conditions, so a guarded arm never counts toward exhaustiveness. You'll still need a catch-all." }
        },
        {
          t: "quiz",
          q: "What does <code>id_var @ 3..=7</code> do?",
          options: [
            "Tests that the value is between 3 and 7, and binds it to <code>id_var</code>",
            "Creates a range variable called <code>id_var</code>",
            "Compares <code>id_var</code> against the range",
            "Assigns 3 to <code>id_var</code>"
          ],
          answer: 0,
          why: "The <code>@</code> operator does both jobs at once: test against a pattern <em>and</em> keep the value. Without it you'd have to choose — test the range and lose the value, or bind it and test separately in a guard."
        },
        {
          t: "swipe",
          statement: "Adding a match guard can let you skip the catch-all arm.",
          answer: false,
          why: "The compiler can't evaluate arbitrary guard expressions, so a guarded arm is never treated as covering its pattern. <code>Some(x) if x &gt; 0</code> doesn't prove all <code>Some</code> values are handled — you still need the unguarded case."
        },
        {
          t: "order",
          prompt: "Order these arms so none is unreachable",
          pieces: ["Some(0) =>", "Some(n) if n < 10 =>", "Some(n) =>", "None =>"],
          answer: [0,1,2,3],
          why: "Most specific first. <code>Some(0)</code> is a single value, then the guarded range, then any <code>Some</code>, then <code>None</code>. Put <code>Some(n)</code> earlier and everything after it becomes unreachable — the compiler will warn."
        },
        {
          t: "summary",
          title: "Chapter 19 complete 🎉",
          points: [
            "<code>|</code> alternatives, <code>..=</code> ranges, and nested destructuring of structs, enums and tuples.",
            "<code>_</code> ignores without binding; <code>_name</code> binds but suppresses the warning; <code>..</code> skips the rest.",
            "<code>name @ pattern</code> tests <em>and</em> binds in one step.",
            "<strong>Match guards</strong> add arbitrary conditions — but don't count toward exhaustiveness.",
            "Arms are tried in order: specific first, catch-all last."
          ]
        }
      ]
    }
  ]
};
