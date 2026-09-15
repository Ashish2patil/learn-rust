export default {
  id: 4,
  title: "Understanding Ownership",
  emoji: "🔐",
  blurb: "The idea that makes Rust different from everything else",
  intro: "This is <em>the</em> chapter. Ownership is how Rust guarantees memory safety with no garbage collector. Go slowly — everything after this builds on it.",
  lessons: [
    {
      id: "4.1",
      title: "What is ownership?",
      est: "10 min",
      tags: ["ownership","move","stack","heap","drop","clone","copy"],
      cards: [
        {
          t: "concept",
          kicker: "First, memory",
          title: "The stack and the heap",
          body: [
            "<strong>The stack</strong> is fast and orderly: values are pushed and popped in order, and every value must have a known, fixed size. Your function's local <code>i32</code>s and <code>bool</code>s live here.",
            "<strong>The heap</strong> is for data whose size isn't known at compile time or can grow — like a <code>String</code>. You ask the allocator for space, it finds a spot and hands you a pointer. That pointer lives on the stack; the data lives on the heap.",
            "Heap allocation is slower, and the hard question is always: <strong>when do we free it?</strong> Free too early and you have a dangling pointer. Free twice and you corrupt the allocator. Never free and you leak."
          ],
          code: { lang: "text", label: "A String in memory", src:
`STACK                          HEAP
┌───────────┬───────┐          ┌───┬───┬───┬───┬───┐
│ ptr       │  ────────────────▶│ h │ e │ l │ l │ o │
│ len       │   5   │          └───┴───┴───┴───┴───┘
│ capacity  │   5   │
└───────────┴───────┘
let s = String::from("hello");` },
          note: { html: "Every language answers “when do we free it?” somehow. C says <em>you do it manually</em>. Java, Go and Python say <em>a garbage collector does it</em>. Rust says <em>the compiler works it out from the code you already wrote</em>." }
        },
        {
          t: "concept",
          kicker: "The three rules",
          title: "Ownership in three sentences",
          body: [
            "Memorise these. Everything else in the chapter follows from them."
          ],
          list: [
            "<strong>1.</strong> Each value in Rust has an <em>owner</em>.",
            "<strong>2.</strong> There can be only <strong>one</strong> owner at a time.",
            "<strong>3.</strong> When the owner goes out of scope, the value is <strong>dropped</strong> (freed)."
          ],
          code: { src:
`fn main() {
    {                                   // s is not valid here
        let s = String::from("hello");  // s is valid from here
        println!("{s}");
    }                                   // scope ends -> drop(s) runs automatically,
                                        // the heap memory is freed. No GC involved.
}` },
          compare: {
            note: "Rust's automatic <code>drop</code> at end of scope is exactly C++ RAII — but the compiler <em>enforces</em> it, so you can't accidentally use the value afterwards.",
            langs: {
              c: { src:
`char *s = malloc(6);
strcpy(s, "hello");
free(s);          // you must remember. Forget = leak.
printf("%s", s);  // 💥 use-after-free — compiles fine!`, note: "All on you. The compiler helps not at all." },
              cpp: { src:
`{
    std::string s = "hello";
}   // destructor runs automatically — RAII`, note: "Same automatic cleanup, but nothing stops use-after-move." },
              python: { src:
`s = "hello"
# freed when the reference count hits zero, whenever that is`, note: "Reference counting + a cycle collector, at runtime cost." },
              java: { src:
`String s = "hello";
// freed eventually, by the GC, at a time you don't control`, note: "Safe, but with GC pauses and memory overhead." },
              go: { src:
`s := "hello"
// GC frees it later`, note: "Same tradeoff as Java." }
            }
          }
        },
        {
          t: "concept",
          kicker: "The surprising part",
          title: "Assignment MOVES ownership — it does not copy",
          codeFirst: true,
          code: { src:
`let s1 = String::from("hello");
let s2 = s1;                    // ownership MOVES from s1 to s2

println!("{s1}");               // ❌ error: borrow of moved value: s1` },
          body: [
            "In most languages this would either copy the string or make two references to it. Rust does neither: <code>s1</code> is <strong>invalidated</strong>.",
            "Why? If both were valid, both would be freed at end of scope — a <strong>double free</strong>, one of the nastiest bugs in C. Rust sidesteps it by ruling that there's only ever one owner.",
            "This is called a <strong>move</strong>. It costs nothing at runtime: only the pointer, length and capacity are copied (a few bytes on the stack). The heap data isn't touched."
          ],
          note: { html: "<b>Want an actual copy?</b> Ask for one: <code>let s2 = s1.clone();</code> — now both are valid, and you can see in the code that you paid for a deep copy. Expensive operations are always visible in Rust." },
          compare: {
            note: "This is the trade: Rust makes you say whether you want a cheap move or an expensive copy. Other languages decide for you — and the decision is often the expensive one.",
            langs: {
              python: { src:
`s1 = ["hello"]
s2 = s1        # both names point to the SAME list
s2.append("x")
print(s1)      # ['hello', 'x'] — surprise! aliasing bug`, note: "The classic Python gotcha Rust makes impossible." },
              java: { src:
`var s1 = new ArrayList<String>();
var s2 = s1;      // same object, two references
s2.add("x");      // s1 sees it too`, note: "Shared mutable references — the source of countless bugs." },
              cpp: { src:
`std::string s1 = "hello";
std::string s2 = s1;         // deep COPY (silently, could be expensive)
std::string s3 = std::move(s1);  // explicit move; s1 now valid-but-unspecified
std::cout << s1;             // compiles, prints garbage — no error!`, note: "C++ has moves too, but using a moved-from value is legal. In Rust it's a compile error." },
              go: { src:
`s1 := []string{"hello"}
s2 := s1          // both share the same backing array`, note: "Go shares silently, just like Java and Python." }
            }
          }
        },
        {
          t: "quiz",
          q: "What happens here?",
          code: { src: `let s1 = String::from("hi");\nlet s2 = s1;\nprintln!("{s1}");` },
          options: [
            "Compile error — <code>s1</code> was moved into <code>s2</code>",
            "Prints “hi” — both variables point at the same string",
            "Prints “hi” — <code>s1</code> was deep-copied into <code>s2</code>",
            "Runtime panic"
          ],
          answer: 0,
          why: "<code>String</code> owns heap data, so assignment <strong>moves</strong> it. <code>s1</code> is no longer usable. Fix it with <code>s1.clone()</code> (deep copy) or by borrowing: <code>let s2 = &amp;s1;</code>."
        },
        {
          t: "concept",
          kicker: "The exception",
          title: "Copy types: small, stack-only values just copy",
          codeFirst: true,
          code: { src:
`let x = 5;
let y = x;
println!("{x} {y}");   // ✅ 5 5 — integers implement Copy

let s1 = String::from("hi");
let s2 = s1;
println!("{s1}");      // ❌ String does NOT implement Copy` },
          body: [
            "If a type is entirely on the stack with a known fixed size, copying it is trivially cheap — so Rust just copies and both stay valid. Such types implement the <code>Copy</code> trait."
          ],
          list: [
            "✅ <strong>Copy</strong>: all integers, <code>f32</code>/<code>f64</code>, <code>bool</code>, <code>char</code>, shared references <code>&amp;T</code>, and tuples/arrays whose members are all Copy",
            "❌ <strong>Not Copy</strong>: <code>String</code>, <code>Vec&lt;T&gt;</code>, <code>Box&lt;T&gt;</code>, <code>HashMap</code> — anything owning heap data or needing custom cleanup"
          ],
          note: { html: "Simple rule: <b>if it touches the heap, it moves. If it's just bytes on the stack, it copies.</b>" }
        },
        {
          t: "concept",
          kicker: "Functions",
          title: "Passing a value to a function moves it too",
          code: { src:
`fn main() {
    let s = String::from("hello");
    takes_ownership(s);          // s MOVES into the function
    // println!("{s}");          // ❌ s is gone

    let x = 5;
    makes_copy(x);               // i32 is Copy, so x is copied
    println!("{x}");             // ✅ still fine

    let s2 = gives_ownership();          // the return value moves OUT to s2
    let s3 = takes_and_gives_back(s2);   // moves in, then moves back out
    println!("{s3}");
}

fn takes_ownership(text: String) {   // text owns the data now
    println!("{text}");
}                                    // text dropped here — memory freed

fn makes_copy(n: i32) { println!("{n}"); }

fn gives_ownership() -> String { String::from("yours") }

fn takes_and_gives_back(t: String) -> String { t }` },
          note: { warn: true, html: "Handing a value back and forth like <code>takes_and_gives_back</code> gets tedious fast. That's exactly why <strong>references</strong> exist — that's the next lesson." }
        },
        {
          t: "swipe",
          statement: "Moving a <code>String</code> copies all its characters in memory, so it's slow for big strings.",
          answer: false,
          why: "A move copies only the <strong>three stack words</strong> — pointer, length, capacity — regardless of whether the string holds 5 bytes or 5 megabytes. The heap data never moves. That's why it's cheap, and why <code>.clone()</code> (which <em>does</em> copy the heap data) must be written explicitly."
        },
        {
          t: "order",
          prompt: "What does the compiler do when a String variable's scope ends?",
          pieces: ["scope ends", "drop() is called automatically", "heap memory is freed", "no garbage collector runs"],
          answer: [0,1,2,3],
          why: "Rust inserts the <code>drop</code> call at compile time, exactly where the owner's scope ends. There's no runtime bookkeeping, no reference counting, no collector — just a free() the compiler placed for you."
        },
        {
          t: "summary",
          title: "Ownership 🔑",
          points: [
            "<strong>One owner per value.</strong> When the owner leaves scope, the value is dropped.",
            "Assigning or passing a heap-owning value <strong>moves</strong> it — the old variable is invalidated.",
            "A move is cheap: only stack metadata is copied. <code>.clone()</code> is the explicit expensive deep copy.",
            "Small stack-only types are <strong>Copy</strong>, so they're duplicated instead of moved.",
            "This single rule eliminates double-frees, use-after-free and dangling pointers <em>at compile time</em>."
          ]
        }
      ]
    },
    {
      id: "4.2",
      title: "References and borrowing",
      est: "9 min",
      tags: ["references","borrowing","mutable reference","aliasing","dangling"],
      cards: [
        {
          t: "concept",
          kicker: "Lending instead of giving",
          title: "A reference lets you use a value without owning it",
          codeFirst: true,
          code: { src:
`fn main() {
    let s1 = String::from("hello");
    let len = calculate_length(&s1);    // lend it out
    println!("'{s1}' is {len} chars");  // ✅ s1 is still ours
}

fn calculate_length(s: &String) -> usize {   // s BORROWS the String
    s.len()
}                                             // s goes out of scope, but it
                                              // doesn't own anything, so nothing drops` },
          body: [
            "<code>&amp;s1</code> creates a <strong>reference</strong>: a pointer to the value that doesn't own it. We call this <strong>borrowing</strong>.",
            "When the reference goes out of scope, nothing is freed — the owner is still <code>s1</code> back in <code>main</code>."
          ],
          note: { html: "References are always <strong>guaranteed valid</strong>. Unlike C pointers, a Rust reference can never be null and can never point at freed memory. The compiler proves it." }
        },
        {
          t: "concept",
          kicker: "Borrowing to change",
          title: "&mut lets you modify what you borrowed",
          code: { src:
`fn main() {
    let mut s = String::from("hello");   // must be mut to lend mutably
    change(&mut s);
    println!("{s}");                     // "hello, world"
}

fn change(s: &mut String) {
    s.push_str(", world");
}` },
          body: [
            "Three things must line up: the variable is <code>mut</code>, you pass <code>&amp;mut</code>, and the parameter type is <code>&amp;mut</code>. Rust never hides mutation."
          ],
          compare: {
            note: "Rust's <code>&amp;</code> / <code>&amp;mut</code> distinction is visible at the call site too — you can tell a function may modify its argument just by reading the call.",
            langs: {
              c: { src:
`void change(char **s) { /* ... */ }
change(&s);   // pointers — but nothing stops NULL or a freed pointer`, note: "Same shape, none of the guarantees." },
              cpp: { src:
`void change(std::string& s) { s += ", world"; }
change(s);    // call site looks identical to a by-value call!`, note: "In C++ you can't tell from the call whether s will be modified. In Rust, &mut is right there." },
              python: { src:
`def change(lst): lst.append("world")   # mutates the caller's list
change(items)   # nothing at the call site warns you`, note: "Everything mutable is passed by reference implicitly." },
              java: { src:
`void change(List<String> l) { l.add("world"); }  // mutates caller's list
change(items);`, note: "Same implicit aliasing as Python." },
              go: { src:
`func change(s *string) { *s += ", world" }
change(&s)   // Go also shows & at the call site — closest to Rust`, note: "But Go won't stop two goroutines doing this at once." }
            }
          }
        },
        {
          t: "concept",
          kicker: "THE borrowing rule",
          title: "Many readers, or one writer — never both",
          body: [
            "At any given time, for any given piece of data, you may have <strong>either</strong>:"
          ],
          list: [
            "any number of <strong>immutable</strong> references <code>&amp;T</code>, <strong>or</strong>",
            "exactly one <strong>mutable</strong> reference <code>&amp;mut T</code>"
          ],
          code: { src:
`let mut s = String::from("hello");

let r1 = &s;      // ✅ fine
let r2 = &s;      // ✅ fine — many readers
println!("{r1} {r2}");

let r3 = &mut s;  // ✅ fine HERE, because r1 and r2 are no longer used
r3.push_str("!");
println!("{r3}");

// But this would fail:
// let a = &s;
// let b = &mut s;       // ❌ cannot borrow as mutable — already borrowed as immutable
// println!("{a} {b}");` },
          after: [
            "This single rule prevents <strong>data races</strong> at compile time. A data race needs two pointers accessing the same data, at least one writing, with no synchronisation — and the rule makes that combination unrepresentable.",
            "A reference's borrow ends at its <strong>last use</strong>, not at the end of the block. That's why the example above works — the compiler is smarter than it looks (this is called <em>non-lexical lifetimes</em>)."
          ],
          note: { warn: true, html: "This is the rule you'll fight early on. When the compiler complains, the question to ask is: <b>“who else is looking at this data right now?”</b>" }
        },
        {
          t: "quiz",
          q: "Which of these is rejected by the borrow checker?",
          options: [
            "One <code>&amp;mut</code> and one <code>&amp;</code> to the same value, both used afterwards",
            "Three <code>&amp;</code> references to the same value",
            "One <code>&amp;mut</code> reference used alone",
            "A <code>&amp;</code> reference, finished with, then a <code>&amp;mut</code> reference"
          ],
          answer: 0,
          why: "Mixing a mutable and an immutable borrow that are <em>both still live</em> is exactly what the rule forbids: the reader could see the data change underneath it. Multiple readers are fine; one writer alone is fine; sequential borrows are fine."
        },
        {
          t: "concept",
          kicker: "Impossible by construction",
          title: "Dangling references can't be written",
          code: { src:
`fn dangle() -> &String {          // ❌ won't compile
    let s = String::from("hello");
    &s                             // returning a reference to s...
}                                  // ...but s is dropped here!

// error[E0106]: missing lifetime specifier
// help: consider returning an owned String instead

fn no_dangle() -> String {         // ✅ just move it out
    String::from("hello")
}` },
          body: [
            "In C this is an everyday bug: return a pointer to a local, and the caller reads freed stack memory. The result is “works on my machine” and a crash in production.",
            "Rust simply won't compile it. The compiler tracks how long every reference must stay valid — those are <strong>lifetimes</strong>, and you'll meet them properly in Chapter 10."
          ]
        },
        {
          t: "swipe",
          statement: "You can have two <code>&amp;mut</code> references to the same value as long as you only use one at a time.",
          answer: false,
          why: "Only <strong>one</strong> mutable reference may exist for a given value at a time — the compiler enforces existence, not just use. The upside is enormous: it's what makes Rust's “fearless concurrency” possible, since data races are structurally impossible."
        },
        {
          t: "order",
          prompt: "Order these from least to most access granted",
          pieces: ["&T (shared borrow)", "&mut T (exclusive borrow)", "T (ownership)"],
          answer: [0,1,2],
          why: "<code>&amp;T</code> = read only, many at once. <code>&amp;mut T</code> = read and write, exactly one. <code>T</code> = you own it, you can move it, mutate it, or drop it. Always take the least you need — that's the Rust API design rule."
        },
        {
          t: "summary",
          title: "Borrowing 🤝",
          points: [
            "<code>&amp;x</code> borrows immutably (read); <code>&amp;mut x</code> borrows mutably (read + write).",
            "<strong>Many readers XOR one writer</strong> — never both at the same time.",
            "A borrow ends at its <strong>last use</strong>, which is more permissive than it first appears.",
            "References are never null and never dangling — guaranteed at compile time.",
            "Borrow instead of moving whenever you just need to look at or tweak a value."
          ]
        }
      ]
    },
    {
      id: "4.3",
      title: "The slice type",
      est: "7 min",
      tags: ["slice","str","string slice","&str","borrow"],
      cards: [
        {
          t: "concept",
          kicker: "A view into a sequence",
          title: "A slice borrows a contiguous run of elements",
          codeFirst: true,
          code: { src:
`let s = String::from("hello world");

let hello = &s[0..5];     // "hello"
let world = &s[6..11];    // "world"
let whole = &s[..];       // the whole thing

let nums = [1, 2, 3, 4, 5];
let middle = &nums[1..4];  // [2, 3, 4] — type is &[i32]` },
          body: [
            "A slice is a <strong>reference plus a length</strong>. It owns nothing and copies nothing — it's a window onto someone else's data.",
            "<code>&amp;str</code> is a string slice. That's what a string literal already is: <code>let s = \"hello\";</code> gives you a <code>&amp;'static str</code> pointing into your program's binary."
          ],
          note: { html: "Slice bounds must land on <strong>character boundaries</strong> for strings. <code>&amp;\"héllo\"[0..2]</code> panics, because <code>é</code> is two bytes. More on this in Chapter 8." }
        },
        {
          t: "concept",
          kicker: "Why it matters",
          title: "Slices keep your indices honest",
          code: { src:
`// Without slices: this index can silently go stale
fn first_word_bad(s: &String) -> usize {
    let bytes = s.as_bytes();
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' { return i; }
    }
    s.len()
}

fn main() {
    let mut s = String::from("hello world");
    let word = first_word_bad(&s);   // word == 5
    s.clear();                       // s is now "" — but word is still 5! 💀
    // nothing stops you using that meaningless 5
}` },
          after: ["Return a slice instead, and the borrow checker ties the two together:"],
          code2: { src:
`fn first_word(s: &str) -> &str {
    let bytes = s.as_bytes();
    for (i, &item) in bytes.iter().enumerate() {
        if item == b' ' { return &s[0..i]; }
    }
    &s[..]
}

fn main() {
    let mut s = String::from("hello world");
    let word = first_word(&s);   // word borrows s
    // s.clear();                // ❌ cannot borrow s as mutable —
                                 //    it is borrowed as immutable by word
    println!("first word: {word}");
}` },
          note: { html: "<b>This is the whole point.</b> A bare index is a fact about the past. A slice is a live borrow — so the compiler knows the data must not change while the slice exists." }
        },
        {
          t: "concept",
          kicker: "API design tip",
          title: "Take &str, not &String",
          code: { src:
`fn first_word(s: &str) -> &str { /* ... */ }   // ✅ flexible

let owned = String::from("hello world");
first_word(&owned);       // works — &String coerces to &str (deref coercion)
first_word("hello world"); // works — a literal is already a &str
first_word(&owned[..]);    // works — an explicit slice` },
          body: [
            "Writing <code>&amp;str</code> instead of <code>&amp;String</code> costs nothing and makes your function usable with literals, Strings and slices alike. Same rule for collections: prefer <code>&amp;[T]</code> over <code>&amp;Vec&lt;T&gt;</code>."
          ],
          compare: {
            note: "Most languages either copy on substring (Java used to, and Python still does) or hand you a raw pointer with no safety. Rust's slice is a zero-copy view that the compiler keeps valid.",
            langs: {
              python: { src:
`s = "hello world"
hello = s[0:5]     # creates a NEW string — copies the bytes`, note: "Simple, but allocates every time." },
              java: { src:
`String hello = s.substring(0, 5);   // copies since Java 7`, note: "Java 6 shared the buffer, which caused memory leaks — so they switched to copying." },
              go: { src:
`hello := s[0:5]     // a slice header — no copy. Very close to Rust!`, note: "Go slices are the nearest equivalent, but Go can't stop you mutating the backing array while a slice is alive." },
              cpp: { src:
`std::string_view hello(s.data(), 5);   // no copy — added in C++17`, note: "Same idea, but nothing stops the string_view outliving the string it points into." },
              c: { src:
`const char *hello = s;   // and you track the length yourself, somehow`, note: "Length and pointer travel separately — the classic C bug factory." }
            }
          }
        },
        {
          t: "quiz",
          q: "Why does returning a <code>&amp;str</code> slice prevent the stale-index bug?",
          options: [
            "The slice borrows the String, so the compiler forbids mutating it while the slice is alive",
            "The slice copies the characters, so it can't go stale",
            "Slices are immutable values with no connection to the original",
            "It doesn't — it's just nicer to read"
          ],
          answer: 0,
          why: "The slice holds an <strong>immutable borrow</strong> of the String. The borrowing rule then makes <code>s.clear()</code> (which needs <code>&amp;mut s</code>) a compile error while the slice lives. A plain <code>usize</code> index carries no such relationship."
        },
        {
          t: "swipe",
          statement: "<code>&amp;str</code> and <code>String</code> are two names for the same type.",
          answer: false,
          why: "<code>String</code> is a <strong>growable, owned, heap-allocated</strong> string. <code>&amp;str</code> is a <strong>borrowed view</strong> of some string data — which might live in a String, in a static binary, or on the stack. Rule of thumb: <strong>own a <code>String</code>, pass a <code>&amp;str</code></strong>."
        },
        {
          t: "summary",
          title: "Chapter 4 complete 🎉 The hard part is behind you",
          points: [
            "A <strong>slice</strong> (<code>&amp;str</code>, <code>&amp;[T]</code>) is a borrowed view — pointer plus length, zero copies.",
            "Because slices borrow, the compiler stops the underlying data changing under them.",
            "Accept <code>&amp;str</code> and <code>&amp;[T]</code> in function signatures; return or store <code>String</code> and <code>Vec&lt;T&gt;</code>.",
            "Ownership + borrowing + slices are the foundation of every Rust API you'll ever read.",
            "If this felt hard: that's normal. It clicks after you've argued with the borrow checker a few times."
          ]
        }
      ]
    }
  ]
};
