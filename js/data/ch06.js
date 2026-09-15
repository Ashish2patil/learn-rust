export default {
  id: 6,
  title: "Enums and Pattern Matching",
  emoji: "🎭",
  blurb: "Sum types, Option, and exhaustive matching",
  intro: "Enums in Rust are far more powerful than in most languages: each variant can carry data. Combined with <code>match</code>, they let the compiler prove you've handled every case.",
  lessons: [
    {
      id: "6.1",
      title: "Defining an enum",
      est: "8 min",
      tags: ["enum","variants","option","null","sum type"],
      cards: [
        {
          t: "concept",
          kicker: "Not your usual enum",
          title: "Each variant can carry its own data",
          codeFirst: true,
          code: { src:
`enum IpAddr {
    V4(u8, u8, u8, u8),     // this variant holds four bytes
    V6(String),             // this one holds a String
}

let home = IpAddr::V4(127, 0, 0, 1);
let loopback = IpAddr::V6(String::from("::1"));

// Variants can hold anything — including structs:
enum Message {
    Quit,                          // no data
    Move { x: i32, y: i32 },       // named fields, like a struct
    Write(String),                 // one String
    ChangeColor(i32, i32, i32),    // three i32s
}

impl Message {
    fn call(&self) { /* enums can have methods too */ }
}` },
          body: [
            "In C, Java or Go, an enum is a list of names for integers. In Rust an enum is a <strong>sum type</strong>: a value that is <em>exactly one of</em> several shapes, each carrying its own payload.",
            "That single upgrade replaces an enormous amount of machinery — class hierarchies, visitor patterns, tagged unions, null checks."
          ],
          compare: {
            note: "The Rust version is one type, not four, and the compiler knows every possible shape.",
            langs: {
              java: { src:
`// Modern Java needs sealed interfaces + records to express this:
sealed interface Message permits Quit, Move, Write, ChangeColor {}
record Quit() implements Message {}
record Move(int x, int y) implements Message {}
record Write(String text) implements Message {}`, note: "Java 17+ finally added this. Rust had it from day one." },
              python: { src:
`# Python: a union of dataclasses, checked only by a type checker
@dataclass
class Move: x: int; y: int
@dataclass
class Write: text: str
Message = Move | Write`, note: "Nothing enforces it at runtime." },
              go: { src:
`// Go has no sum types. You fake it with an interface:
type Message interface { isMessage() }
// ...and nothing checks you handled every implementation.`, note: "This is Go's most-requested missing feature." },
              c: { src:
`// A tagged union: you must keep the tag and the union in sync BY HAND
struct Message {
    enum { QUIT, MOVE, WRITE } tag;
    union { struct { int x, y; } move; char *write; } data;
};`, note: "Read the wrong union member and you get garbage. Rust's enum is a tagged union the compiler keeps honest." },
              cpp: `std::variant<Quit, Move, Write, ChangeColor> msg;   // C++17, clunky but similar`
            }
          }
        },
        {
          t: "concept",
          kicker: "The billion-dollar fix",
          title: "Option<T> — Rust has no null",
          code: { src:
`enum Option<T> {      // this is in the standard library, always in scope
    None,
    Some(T),
}

let some_number = Some(5);
let some_string = Some("a string");
let absent: Option<i32> = None;    // the type annotation is needed here

// The point: Option<i32> and i32 are DIFFERENT TYPES.
let x: i8 = 5;
let y: Option<i8> = Some(5);
// let sum = x + y;   ❌ cannot add Option<i8> to i8` },
          body: [
            "Tony Hoare called inventing null his “billion-dollar mistake”. The problem isn't the concept of absence — it's that in most languages <em>any</em> value might secretly be null, and you find out when it crashes.",
            "Rust encodes absence <strong>in the type</strong>. If a value can be missing, its type is <code>Option&lt;T&gt;</code>, and you cannot use it as a <code>T</code> until you've dealt with the <code>None</code> case. If the type is just <code>T</code>, it's <em>guaranteed</em> to be there."
          ],
          note: { html: "<b>No null-pointer exceptions. Ever.</b> Not through discipline or static analysis — the type system simply doesn't have a null to trip over." },
          compare: {
            note: "Rust's <code>Option</code> costs nothing at runtime: <code>Option&lt;&amp;T&gt;</code> and <code>Option&lt;Box&lt;T&gt;&gt;</code> are the same size as the pointer, using the impossible null value as the <code>None</code> tag.",
            langs: {
              java: { src:
`String s = getName();      // might be null — the type doesn't say
s.length();                // 💥 NullPointerException

Optional<String> o = ...;  // added in Java 8, but null still exists everywhere`, note: "Optional is opt-in, so null keeps hiding in old APIs." },
              python: { src:
`name = get_name()   # might be None
len(name)           # 💥 TypeError: object of type 'NoneType'`, note: "Type hints like Optional[str] help, but nothing enforces them at runtime." },
              go: { src:
`var p *User = findUser()
p.Name   // 💥 nil pointer dereference, at runtime`, note: "Go's most common panic in production." },
              c: { src:
`User *p = find_user();
p->name;   // 💥 segfault, or worse — silent corruption`, note: "Around 70% of Microsoft's CVEs trace back to this family of bug." },
              cpp: `std::optional<std::string> o = get_name();  // C++17 — same idea as Rust`
            }
          }
        },
        {
          t: "quiz",
          q: "Why can't you write <code>let sum = 5 + Some(3);</code>?",
          options: [
            "<code>Option&lt;i32&gt;</code> is a different type from <code>i32</code> — you must unwrap it first",
            "You need to import the Add trait",
            "<code>Some(3)</code> is a function call, not a value",
            "You can, it gives <code>Some(8)</code>"
          ],
          answer: 0,
          why: "That's the entire safety mechanism. <code>Option&lt;i32&gt;</code> means <em>“maybe an i32”</em>, and the compiler won't let you treat a maybe as a definitely. Handle it with <code>match</code>, <code>if let</code>, <code>unwrap_or(0)</code> or <code>map</code>."
        },
        {
          t: "swipe",
          statement: "Rust's <code>Option&lt;T&gt;</code> makes programs slower because of the extra wrapper.",
          answer: false,
          why: "It's a <strong>zero-cost abstraction</strong>. For pointer-like types Rust uses the <em>null pointer optimisation</em>: <code>Option&lt;Box&lt;T&gt;&gt;</code> is exactly the same size as <code>Box&lt;T&gt;</code>, with the null bit pattern meaning <code>None</code>. You get safety with no memory or speed penalty."
        },
        {
          t: "summary",
          title: "Enums & Option",
          points: [
            "Rust enums are <strong>sum types</strong>: each variant may carry different data.",
            "Enums can have <code>impl</code> blocks and methods, just like structs.",
            "<code>Option&lt;T&gt;</code> = <code>Some(T)</code> or <code>None</code>. <strong>Rust has no null.</strong>",
            "Absence is visible in the type, so the compiler forces you to handle it.",
            "<code>Option</code> is free at runtime thanks to niche/null-pointer optimisation."
          ]
        }
      ]
    },
    {
      id: "6.2",
      title: "The match control flow construct",
      est: "8 min",
      tags: ["match","patterns","exhaustive","binding","wildcard"],
      cards: [
        {
          t: "concept",
          kicker: "The workhorse",
          title: "match compares a value against patterns, in order",
          code: { src:
`#[derive(Debug)]
enum UsState { Alabama, Alaska }

enum Coin { Penny, Nickel, Dime, Quarter(UsState) }

fn value_in_cents(coin: Coin) -> u8 {
    match coin {
        Coin::Penny => {
            println!("Lucky penny!");     // arms can be blocks
            1
        }
        Coin::Nickel => 5,
        Coin::Dime => 10,
        Coin::Quarter(state) => {        // bind the inner data to a name
            println!("State quarter from {state:?}!");
            25
        }
    }
}` },
          body: [
            "Patterns can <strong>destructure</strong>: <code>Coin::Quarter(state)</code> both tests the variant and pulls out its payload in one step.",
            "<code>match</code> is an expression, so every arm must produce the same type."
          ]
        },
        {
          t: "concept",
          kicker: "Everyday use",
          title: "Matching on Option<T>",
          code: { src:
`fn plus_one(x: Option<i32>) -> Option<i32> {
    match x {
        None => None,
        Some(i) => Some(i + 1),
    }
}

assert_eq!(plus_one(Some(5)), Some(6));
assert_eq!(plus_one(None), None);

// Forget the None arm and you get:
// error[E0004]: non-exhaustive patterns: None not covered` },
          body: [
            "This is the pattern you'll write a thousand times. And the compiler checking exhaustiveness is exactly what makes missing-null-check bugs impossible."
          ],
          compare: {
            note: "Notice: in the other languages, forgetting the absent case is a <em>runtime</em> problem. In Rust it's a build failure.",
            langs: {
              python: `def plus_one(x):
    return None if x is None else x + 1    # forget the check -> TypeError later`,
              java: `Optional<Integer> plusOne(Optional<Integer> x) {
    return x.map(i -> i + 1);   // nice, but null can still sneak in elsewhere
}`,
              go: `func plusOne(x *int) *int {
    if x == nil { return nil }   // forget this line -> nil dereference panic
    y := *x + 1
    return &y
}`,
              cpp: `std::optional<int> plus_one(std::optional<int> x) {
    return x ? std::optional{*x + 1} : std::nullopt;   // *x on nullopt is UB
}`
            }
          }
        },
        {
          t: "concept",
          kicker: "Catch-alls",
          title: "_ and named catch-all arms",
          code: { src:
`let dice_roll = 9;

match dice_roll {
    3 => add_fancy_hat(),
    7 => remove_fancy_hat(),
    other => move_player(other),     // binds the value — use it
}

match dice_roll {
    3 => add_fancy_hat(),
    7 => remove_fancy_hat(),
    _ => reroll(),                   // ignore the value
}

match dice_roll {
    3 => add_fancy_hat(),
    7 => remove_fancy_hat(),
    _ => (),                         // explicitly do nothing
}` },
          note: { warn: true, html: "A catch-all arm must come <b>last</b> — arms are tried top to bottom, so anything after <code>_</code> is unreachable (and the compiler warns you)." }
        },
        {
          t: "quiz",
          q: "What does the compiler do if you forget an enum variant in a <code>match</code>?",
          options: [
            "Refuses to compile: “non-exhaustive patterns”",
            "Warns you but compiles",
            "Silently does nothing for that variant",
            "Panics at runtime when that variant appears"
          ],
          answer: 0,
          why: "<strong>Exhaustiveness checking</strong> is one of Rust's best features. It also means that when you <em>add</em> a variant to an enum later, the compiler walks you through every place that needs updating. Refactoring becomes mechanical instead of terrifying."
        },
        {
          t: "swipe",
          statement: "You can put <code>_ =&gt; ...</code> as the first arm of a match.",
          answer: false,
          why: "You can write it, but it makes every later arm <strong>unreachable</strong>, and the compiler warns you. Arms are tested top to bottom, so a catch-all always belongs last."
        },
        {
          t: "order",
          prompt: "Order the arms so this match compiles cleanly",
          pieces: ["Some(0) => \"zero\",", "Some(n) => \"some number\",", "None => \"nothing\","],
          answer: [0,1,2],
          why: "Specific patterns first, general ones after. <code>Some(0)</code> is more specific than <code>Some(n)</code>, so it must come first or it would never be reached. <code>None</code> can go anywhere among these since it can't overlap."
        },
        {
          t: "summary",
          title: "match",
          points: [
            "<code>match</code> tests patterns top to bottom and is an <strong>expression</strong>.",
            "Patterns <strong>destructure</strong>: test the shape and bind the data at once.",
            "<strong>Exhaustive</strong> — every possible value must be covered, or it won't build.",
            "<code>_</code> ignores the value; a named binding like <code>other</code> captures it. Catch-alls go last.",
            "Adding an enum variant makes the compiler point at every place you need to update."
          ]
        }
      ]
    },
    {
      id: "6.3",
      title: "Concise control flow with if let",
      est: "5 min",
      tags: ["if let","while let","let else","sugar"],
      cards: [
        {
          t: "concept",
          kicker: "Less ceremony",
          title: "if let: when you only care about one case",
          code: { src:
`let config_max = Some(3u8);

// Verbose: a match with a throwaway arm
match config_max {
    Some(max) => println!("Maximum is {max}"),
    _ => (),
}

// Same thing, less noise
if let Some(max) = config_max {
    println!("Maximum is {max}");
}

// With an else branch
if let Some(max) = config_max {
    println!("Maximum is {max}");
} else {
    println!("No maximum set");
}` },
          body: [
            "<code>if let</code> is sugar for a <code>match</code> with one interesting arm. You trade exhaustiveness checking for brevity — a fine trade when there genuinely is only one case you care about."
          ]
        },
        {
          t: "concept",
          kicker: "Two more",
          title: "while let and let...else",
          code: { src:
`// while let: loop as long as the pattern matches
let mut stack = vec![1, 2, 3];
while let Some(top) = stack.pop() {
    println!("{top}");     // 3, 2, 1 — stops when pop() returns None
}

// let...else: bind or bail out early (Rust 1.65+)
fn describe(maybe_age: Option<u32>) -> String {
    let Some(age) = maybe_age else {
        return String::from("unknown age");   // the else block MUST diverge
    };
    // From here on, age is a plain u32 — no nesting, no rightward drift
    format!("{age} years old")
}` },
          body: [
            "<code>let...else</code> is the antidote to deeply nested <code>if let</code> pyramids. The <code>else</code> block must diverge — <code>return</code>, <code>break</code>, <code>continue</code> or <code>panic!</code> — so afterwards the binding is guaranteed to exist."
          ],
          compare: {
            note: "This is Rust's version of the “early return guard clause” every style guide recommends — but the compiler enforces that you actually leave.",
            langs: {
              go: `age, ok := maybeAge()
if !ok { return "unknown age" }    // Go's comma-ok idiom — very similar`,
              python: `age = maybe_age
if age is None: return "unknown age"`,
              java: `if (maybeAge.isEmpty()) return "unknown age";
int age = maybeAge.get();`,
              js: `const age = maybeAge ?? null;
if (age === null) return "unknown age";`
            }
          }
        },
        {
          t: "quiz",
          q: "What's the trade-off of using <code>if let</code> instead of <code>match</code>?",
          options: [
            "You lose exhaustiveness checking — the compiler no longer verifies you handled every case",
            "It's slower at runtime",
            "It only works with <code>Option</code>",
            "There is no trade-off"
          ],
          answer: 0,
          why: "<code>if let</code> handles one pattern and ignores the rest. That's exactly what you want sometimes, but if you later add an enum variant, <code>if let</code> won't point you at the code that needs updating — <code>match</code> would."
        },
        {
          t: "swipe",
          statement: "In <code>let Some(x) = opt else { ... };</code>, the else block can just print a message and carry on.",
          answer: false,
          why: "The <code>else</code> block must <strong>diverge</strong> — <code>return</code>, <code>break</code>, <code>continue</code>, or <code>panic!</code>. It has to, because if execution continued, <code>x</code> would have no value. The compiler enforces this."
        },
        {
          t: "summary",
          title: "Chapter 6 complete 🎉",
          points: [
            "<code>if let</code> = match with one arm you care about; add <code>else</code> for the rest.",
            "<code>while let</code> loops while a pattern keeps matching — perfect for draining a stack or queue.",
            "<code>let...else</code> binds or bails out early, keeping the happy path unindented.",
            "Reach for <code>match</code> when you want the compiler checking every case; <code>if let</code> when you don't need that."
          ]
        }
      ]
    }
  ]
};
