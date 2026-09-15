export default {
  id: 13,
  title: "Functional Features: Iterators and Closures",
  emoji: "⚡",
  blurb: "Closures, iterator chains, and why they're free",
  intro: "Rust borrows heavily from functional languages. Closures capture their environment; iterators compose into pipelines — and both compile down to code as fast as a hand-written loop.",
  lessons: [
    {
      id: "13.1",
      title: "Closures: anonymous functions that capture",
      est: "9 min",
      tags: ["closure","fn","fnmut","fnonce","move","capture","lambda"],
      cards: [
        {
          t: "concept",
          kicker: "Inline functions",
          title: "A closure remembers the scope it was defined in",
          codeFirst: true,
          code: { src:
`let x = 4;
let equal_to_x = |z| z == x;      // captures x from the surrounding scope
assert!(equal_to_x(4));

// Increasingly explicit forms of the same thing:
fn  add_one_v1   (x: u32) -> u32 { x + 1 }      // a plain function
let add_one_v2 = |x: u32| -> u32 { x + 1 };     // fully annotated closure
let add_one_v3 = |x|             { x + 1 };     // types inferred
let add_one_v4 = |x|               x + 1  ;     // braces optional for one expression

// Common use: lazy defaults and iterator adapters
let value = some_option.unwrap_or_else(|| expensive_default());
let doubled: Vec<i32> = nums.iter().map(|n| n * 2).collect();` },
          body: [
            "Unlike functions, closures can use variables from where they're written — no need to pass everything as a parameter. And their types are usually inferred."
          ],
          compare: {
            note: "Every modern language has closures now. Rust's difference: it tracks <em>how</em> the closure uses what it captures, which is what keeps them memory-safe.",
            langs: {
              python: `equal_to_x = lambda z: z == x
doubled = [n * 2 for n in nums]`,
              java: `Predicate<Integer> equalToX = z -> z == x;   // captured vars must be effectively final`,
              go: `equalToX := func(z int) bool { return z == x }`,
              cpp: `auto equal_to_x = [x](int z) { return z == x; };     // capture by value
auto by_ref     = [&x](int z) { return z == x; };     // capture by reference
// ⚠️ by-reference capture outliving x is UB. Rust catches this.`,
              js: `const equalToX = z => z === x;`
            }
          }
        },
        {
          t: "concept",
          kicker: "Three ways to capture",
          title: "Fn, FnMut, FnOnce — chosen automatically",
          code: { src:
`let list = vec![1, 2, 3];

// 1. Fn — borrows immutably. Can be called many times.
let only_borrows = || println!("{list:?}");
only_borrows();
only_borrows();

// 2. FnMut — borrows mutably. Can be called many times, changes things.
let mut list = vec![1, 2, 3];
let mut borrows_mutably = || list.push(7);
borrows_mutably();
println!("{list:?}");         // [1, 2, 3, 7]

// 3. FnOnce — takes ownership. Can only be called once.
let list = vec![1, 2, 3];
let consumes = move || {      // 'move' forces ownership transfer
    println!("{list:?}");
    drop(list);
};
consumes();
// consumes();   ❌ value used after move

// 'move' is essential for threads: the closure must own its data,
// because the thread may outlive the scope that created it.
std::thread::spawn(move || println!("{list:?}")).join().unwrap();` },
          body: [
            "Rust picks the <em>least restrictive</em> option that works, based on what the closure body actually does. You rarely write these trait names — except in function signatures that accept a closure."
          ],
          note: { html: "<code>FnOnce</code> ⊃ <code>FnMut</code> ⊃ <code>Fn</code>. Every <code>Fn</code> can be used where <code>FnOnce</code> is wanted, but not the reverse. When writing an API that takes a closure, ask for the <b>weakest</b> trait that does the job." }
        },
        {
          t: "concept",
          kicker: "Accepting closures",
          title: "Closures as parameters",
          code: { src:
`// impl Trait — simple and monomorphized (fast)
fn apply<F: Fn(i32) -> i32>(f: F, v: i32) -> i32 { f(v) }
fn apply2(f: impl Fn(i32) -> i32, v: i32) -> i32 { f(v) }

// Box<dyn Fn> — for storing closures in a struct or returning varied ones
struct Cacher {
    calculation: Box<dyn Fn(u32) -> u32>,
}

fn make_adder(n: i32) -> impl Fn(i32) -> i32 {
    move |x| x + n      // must 'move', since n is local to make_adder
}

let add_five = make_adder(5);
assert_eq!(add_five(10), 15);` },
          body: [
            "Every closure has a <strong>unique anonymous type</strong>, so you can't write it out. You refer to closures via the <code>Fn</code> traits: generically (fast, monomorphized) or boxed (flexible, one pointer indirection)."
          ]
        },
        {
          t: "quiz",
          q: "What does the <code>move</code> keyword do to a closure?",
          options: [
            "Forces it to take ownership of everything it captures",
            "Moves the closure to the heap",
            "Makes the closure callable only once",
            "Lets the closure modify captured variables"
          ],
          answer: 0,
          why: "<code>move</code> transfers ownership of captured variables into the closure. It's essential when the closure outlives the current scope — spawning a thread, or returning a closure from a function. It doesn't by itself make the closure <code>FnOnce</code>; what the <em>body</em> does decides that."
        },
        {
          t: "swipe",
          statement: "A closure that only reads a captured variable can be called multiple times.",
          answer: true,
          why: "It implements <code>Fn</code> (immutable borrow), so calling it doesn't consume or change anything. Only closures that move a captured value <em>out</em> become <code>FnOnce</code> and are limited to one call."
        },
        {
          t: "summary",
          title: "Closures",
          points: [
            "<code>|args| body</code> — anonymous functions that capture their environment.",
            "Types are usually inferred; parameter types are optional (unlike functions).",
            "<code>Fn</code> (borrows) / <code>FnMut</code> (borrows mutably) / <code>FnOnce</code> (takes ownership) — chosen for you.",
            "<code>move</code> forces ownership transfer — required for threads and returned closures.",
            "Accept them as <code>impl Fn(...)</code> generically, or <code>Box&lt;dyn Fn&gt;</code> when you need to store them."
          ]
        }
      ]
    },
    {
      id: "13.2",
      title: "Iterators: processing a series of items",
      est: "10 min",
      tags: ["iterator","map","filter","collect","lazy","fold","zip"],
      cards: [
        {
          t: "concept",
          kicker: "One method, endless power",
          title: "The Iterator trait",
          code: { src:
`pub trait Iterator {
    type Item;                                   // an associated type
    fn next(&mut self) -> Option<Self::Item>;    // the ONLY required method

    // ...plus 70+ provided methods built on next()
}

let v = vec![1, 2, 3];
let mut it = v.iter();
assert_eq!(it.next(), Some(&1));
assert_eq!(it.next(), Some(&2));
assert_eq!(it.next(), Some(&3));
assert_eq!(it.next(), None);      // exhausted` },
          body: [
            "Implement <code>next()</code> for your own type and you inherit <code>map</code>, <code>filter</code>, <code>zip</code>, <code>take</code>, <code>sum</code>, <code>collect</code> and dozens more. It's the best demonstration of default trait methods in the whole language."
          ],
          code2: { label: "Three ways to iterate", src:
`let v = vec![1, 2, 3];

v.iter()        // Iterator<Item = &i32>      — borrow each item
v.iter_mut()    // Iterator<Item = &mut i32>  — mutably borrow each item
v.into_iter()   // Iterator<Item = i32>       — consume the vector

// for loops call into_iter() for you:
for x in &v     { }   // == v.iter()
for x in &mut v { }   // == v.iter_mut()
for x in v      { }   // == v.into_iter(), consumes v` }
        },
        {
          t: "concept",
          kicker: "Lazy by default",
          title: "Adapters build a pipeline; consumers run it",
          code: { src:
`let v = vec![1, 2, 3, 4, 5, 6];

// ADAPTERS — lazy. Nothing happens yet.
let pipeline = v.iter().map(|x| x * 2).filter(|x| x % 3 == 0);
// warning: unused Map that must be used — iterators are lazy

// CONSUMERS — this is what actually runs the pipeline.
let result: Vec<i32> = v.iter().map(|x| x * 2).filter(|x| x % 3 == 0).collect();
// [6, 12]

let total: i32      = v.iter().sum();
let count           = v.iter().filter(|x| **x > 3).count();
let max             = v.iter().max();
let found           = v.iter().find(|x| **x > 3);          // Option<&i32>
let pos             = v.iter().position(|x| *x == 4);      // Option<usize>
let all_positive    = v.iter().all(|x| *x > 0);            // bool
let any_even        = v.iter().any(|x| x % 2 == 0);        // bool
let product: i32    = v.iter().product();
let folded          = v.iter().fold(0, |acc, x| acc + x);  // general reduce

// More adapters worth knowing
v.iter().enumerate();                  // (index, item) pairs
v.iter().zip(other.iter());            // pair up two iterators
v.iter().rev();                        // reverse
v.iter().take(3);                      // first 3
v.iter().skip(2);                      // drop the first 2
v.iter().chain(other.iter());          // concatenate
v.iter().flat_map(|x| vec![*x; 2]);    // map then flatten
v.iter().filter_map(|x| x.checked_mul(2));  // filter and map in one
v.iter().peekable();                   // lets you look ahead
(1..).take(5);                         // infinite range, lazily truncated` },
          note: { warn: true, html: "Forgetting the consumer is the classic mistake: <code>v.iter().map(|x| println!(\"{x}\"))</code> prints <b>nothing</b>. Use a <code>for</code> loop, or <code>.for_each(...)</code>." },
          compare: {
            note: "Same ideas everywhere — but Rust's compile down to plain loops with no allocations and no virtual calls.",
            langs: {
              python: `result = [x * 2 for x in v if x * 2 % 3 == 0]
total = sum(v)
# itertools + generators are the lazy equivalent`,
              java: `var result = v.stream().map(x -> x * 2)
               .filter(x -> x % 3 == 0).toList();   // also lazy until a terminal op`,
              js: `const result = v.map(x => x * 2).filter(x => x % 3 === 0);
// ⚠️ eager: allocates an intermediate array at every step`,
              go: { src:
`// Go has no iterator chaining — you write the loop.
var result []int
for _, x := range v {
    y := x * 2
    if y % 3 == 0 { result = append(result, y) }
}`, note: "Go 1.23 added range-over-func iterators, but there's still no standard map/filter." },
              cpp: `auto result = v | std::views::transform([](int x){ return x*2; })
                | std::views::filter([](int x){ return x%3==0; });  // C++20 ranges`
            }
          }
        },
        {
          t: "concept",
          kicker: "The payoff",
          title: "Zero-cost: chains compile to the same code as loops",
          code: { src:
`// This...
let total: u32 = buffer.iter()
    .filter(|s| s.is_valid())
    .map(|s| s.weight)
    .sum();

// ...compiles to essentially this:
let mut total = 0;
for s in &buffer {
    if s.is_valid() { total += s.weight; }
}` },
          body: [
            "No intermediate vectors, no virtual dispatch, no allocations. The optimiser inlines every closure and fuses the whole chain into a single loop — and it can then unroll and vectorise it.",
            "The Rust Book's own benchmark: an iterator-based audio decoder beat the hand-written loop version, because the compiler had enough information to unroll it fully."
          ],
          note: { html: "This is what <strong>zero-cost abstraction</strong> means in practice: use the expressive version. It is not slower. In JavaScript the equivalent chain allocates an array per step; in Rust it allocates nothing." }
        },
        {
          t: "quiz",
          q: "What does <code>v.iter().map(|x| x * 2);</code> do on its own?",
          options: [
            "Nothing — iterator adapters are lazy until a consumer runs them",
            "Doubles every element in place",
            "Returns a new doubled Vec",
            "Panics"
          ],
          answer: 0,
          why: "Adapters like <code>map</code> and <code>filter</code> just build a description of the work. Nothing happens until a <strong>consuming adapter</strong> — <code>collect</code>, <code>sum</code>, <code>count</code>, <code>for_each</code>, <code>fold</code> — drives it. The compiler even warns you about the unused result."
        },
        {
          t: "swipe",
          statement: "Iterator chains are slower than equivalent <code>for</code> loops in Rust.",
          answer: false,
          why: "They compile to the same machine code, and sometimes faster code — the compiler can see the iteration count and the absence of aliasing, which enables unrolling and vectorisation. Write the clear version."
        },
        {
          t: "order",
          prompt: "Order this pipeline so it collects doubled even numbers",
          pieces: ["v.iter()", ".filter(|x| *x % 2 == 0)", ".map(|x| x * 2)", ".collect::<Vec<i32>>()"],
          answer: [0,1,2,3],
          why: "Source → adapters (lazy) → consumer. Filtering before mapping is also the efficient order: you do less work in <code>map</code>. Both orders are valid Rust; this one does fewer multiplications."
        },
        {
          t: "summary",
          title: "Chapter 13 complete 🎉",
          points: [
            "Implement <code>next()</code> and you get 70+ iterator methods for free.",
            "<code>iter()</code> borrows, <code>iter_mut()</code> borrows mutably, <code>into_iter()</code> consumes.",
            "<strong>Adapters are lazy</strong>; consumers (<code>collect</code>, <code>sum</code>, <code>count</code>, <code>fold</code>) do the work.",
            "Chains are <strong>zero-cost</strong> — the same machine code as a hand-written loop.",
            "This style is idiomatic Rust: prefer <code>filter</code>/<code>map</code>/<code>collect</code> over manual index loops."
          ]
        }
      ]
    }
  ]
};
