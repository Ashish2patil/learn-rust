export default {
  id: 20,
  title: "Advanced Features",
  emoji: "🛠️",
  blurb: "unsafe, advanced traits, types, functions and macros",
  intro: "The escape hatches and power tools. You won't need most of these often — but knowing they exist tells you what's possible, and lets you read library source.",
  lessons: [
    {
      id: "20.1",
      title: "Unsafe Rust",
      est: "7 min",
      tags: ["unsafe","raw pointer","ffi","static","union"],
      cards: [
        {
          t: "concept",
          kicker: "The escape hatch",
          title: "unsafe unlocks exactly five extra powers",
          list: [
            "Dereference a raw pointer (<code>*const T</code>, <code>*mut T</code>)",
            "Call an <code>unsafe</code> function or method",
            "Access or modify a mutable <code>static</code> variable",
            "Implement an <code>unsafe</code> trait (like <code>Send</code> or <code>Sync</code>)",
            "Access fields of a <code>union</code>"
          ],
          code: { src:
`let mut num = 5;

// Creating raw pointers is SAFE — using them is not.
let r1 = &num as *const i32;
let r2 = &mut num as *mut i32;

unsafe {
    println!("r1 is: {}", *r1);      // dereferencing needs unsafe
    *r2 = 10;
}

// Raw pointers may be null, dangling, unaligned, and may alias freely.
// The borrow checker doesn't track them — you're responsible.

unsafe fn dangerous() {}
unsafe { dangerous(); }` },
          body: [
            "<code>unsafe</code> does <strong>not</strong> turn off the borrow checker or any other check. It only permits those five operations, which the compiler cannot verify.",
            "The purpose is to make auditing tractable: if there's a memory-safety bug in a Rust program, it is inside an <code>unsafe</code> block or in a bug in a dependency. You can grep for it."
          ]
        },
        {
          t: "concept",
          kicker: "Why it exists",
          title: "Safe abstractions over unsafe internals",
          code: { src:
`use std::slice;

// split_at_mut returns TWO mutable slices into one slice.
// The borrow checker can't prove the halves don't overlap — but WE can.
fn split_at_mut(values: &mut [i32], mid: usize) -> (&mut [i32], &mut [i32]) {
    let len = values.len();
    let ptr = values.as_mut_ptr();
    assert!(mid <= len);              // check the invariant ourselves

    unsafe {
        (
            slice::from_raw_parts_mut(ptr, mid),
            slice::from_raw_parts_mut(ptr.add(mid), len - mid),
        )
    }
}
// The PUBLIC function is safe: callers cannot misuse it.` },
          after: ["Calling into C is the other big use — this is how Rust talks to the rest of the world:"],
          code2: { src:
`extern "C" {
    fn abs(input: i32) -> i32;
}

fn main() {
    unsafe { println!("Absolute value of -3: {}", abs(-3)); }
}

// And exposing Rust TO C:
#[unsafe(no_mangle)]
pub extern "C" fn call_from_c() {
    println!("Called a Rust function from C!");
}` },
          note: { html: "<code>Vec</code>, <code>String</code>, <code>RefCell</code> and <code>Mutex</code> are all implemented with <code>unsafe</code> inside. The pattern is universal: <b>a small audited unsafe core, wrapped in a safe API</b>." },
          compare: {
            note: "In C every line has C's safety guarantees — which is to say, none. In Rust, unsafety is opt-in, delimited and greppable.",
            langs: {
              c: `int *p = NULL;
*p = 5;    // the entire language is "unsafe Rust", all the time`,
              cpp: `reinterpret_cast<int*>(addr);   // and nothing marks the danger zone`,
              java: `sun.misc.Unsafe  // exists, hidden away, deliberately hard to reach`,
              python: `import ctypes    # the FFI escape hatch, same idea`,
              go: `import "unsafe"    // Go has the same explicit opt-in keyword`
            }
          }
        },
        {
          t: "quiz",
          q: "What does an <code>unsafe</code> block turn off?",
          options: [
            "Nothing — it only permits five specific operations the compiler can't verify",
            "The borrow checker",
            "All memory-safety checks",
            "Bounds checking on arrays"
          ],
          answer: 0,
          why: "A common misconception. Borrow checking, type checking and bounds checking all still apply inside <code>unsafe</code>. It simply allows raw pointer dereferences, unsafe calls, mutable statics, unsafe trait impls and union access."
        },
        {
          t: "swipe",
          statement: "Using <code>unsafe</code> means your public API must also be unsafe.",
          answer: false,
          why: "The opposite is the goal. If you can <em>prove</em> the invariants hold — asserting them at runtime where necessary — you wrap the unsafe core in a safe API. That's exactly what <code>Vec</code> and <code>split_at_mut</code> do."
        },
        {
          t: "summary",
          title: "Unsafe Rust",
          points: [
            "<code>unsafe</code> permits five operations; it disables no checks.",
            "Used for raw pointers, FFI, mutable statics, unsafe traits and unions.",
            "The idiom: a small, audited unsafe core behind a safe public API.",
            "Every memory bug in a Rust program traces back to an <code>unsafe</code> block — which makes review feasible.",
            "Run <code>cargo miri test</code> to detect undefined behaviour in unsafe code."
          ]
        }
      ]
    },
    {
      id: "20.2",
      title: "Advanced traits and types",
      est: "8 min",
      tags: ["associated type","generic default","supertrait","newtype","type alias","never"],
      cards: [
        {
          t: "concept",
          kicker: "Associated types",
          title: "One implementation per type, not many",
          code: { src:
`// Associated type: Iterator can be implemented ONCE per type
pub trait Iterator {
    type Item;
    fn next(&mut self) -> Option<Self::Item>;
}

impl Iterator for Counter {
    type Item = u32;
    fn next(&mut self) -> Option<u32> { /* ... */ }
}

// If it were generic instead...
pub trait IteratorGeneric<T> {
    fn next(&mut self) -> Option<T>;
}
// ...you could implement it many times for one type, and every
// call site would need annotations to say which one you meant.` },
          body: [
            "Rule of thumb: use a <strong>generic parameter</strong> when a type should implement the trait several ways (<code>From&lt;i32&gt;</code> and <code>From&lt;String&gt;</code> for the same type). Use an <strong>associated type</strong> when there's exactly one sensible answer per implementing type."
          ]
        },
        {
          t: "concept",
          kicker: "More trait tools",
          title: "Default generics, supertraits, fully-qualified syntax",
          code: { src:
`use std::ops::Add;

// Operator overloading: Add has a default generic parameter Rhs = Self
impl Add for Point {
    type Output = Point;
    fn add(self, other: Point) -> Point {
        Point { x: self.x + other.x, y: self.y + other.y }
    }
}

// Adding different types — override the default
impl Add<Meters> for Millimeters {
    type Output = Millimeters;
    fn add(self, other: Meters) -> Millimeters { /* ... */ }
}

// Supertrait: OutlinePrint requires Display
use std::fmt;
trait OutlinePrint: fmt::Display {
    fn outline_print(&self) {
        let output = self.to_string();     // available thanks to Display
        println!("* {output} *");
    }
}

// Fully-qualified syntax, when several methods share a name
trait Pilot { fn fly(&self); }
trait Wizard { fn fly(&self); }
struct Human;
impl Pilot  for Human { fn fly(&self) { println!("Captain speaking"); } }
impl Wizard for Human { fn fly(&self) { println!("Up!"); } }
impl Human            { fn fly(&self) { println!("*waves arms*"); } }

let person = Human;
person.fly();               // the inherent method
Pilot::fly(&person);        // disambiguate by trait
Wizard::fly(&person);
<Human as Pilot>::fly(&person);   // fully qualified — needed for
                                  // associated functions with no self` },
          note: { html: "Operator overloading in Rust is just trait implementation: <code>+</code> is <code>Add</code>, <code>*</code> is <code>Mul</code>, <code>[]</code> is <code>Index</code>, <code>==</code> is <code>PartialEq</code>. You can't invent new operators — which keeps code readable." }
        },
        {
          t: "concept",
          kicker: "Type tricks",
          title: "Newtype, aliases, never, and dynamically sized types",
          code: { src:
`// Newtype: get around the orphan rule, or add type safety
struct Wrapper(Vec<String>);
impl std::fmt::Display for Wrapper {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        write!(f, "[{}]", self.0.join(", "))
    }
}

// Type alias: a shorter name for the SAME type (no new type, no safety)
type Kilometers = i32;
type Thunk = Box<dyn Fn() + Send + 'static>;
type Result<T> = std::result::Result<T, std::io::Error>;   // very common

// The never type ! — an expression that never produces a value
fn bar() -> ! { panic!("this never returns") }

// which is why this typechecks: 'continue' has type !, so the match
// arms still agree on u32
let guess: u32 = match text.trim().parse() {
    Ok(num) => num,
    Err(_) => continue,
};

// Dynamically sized types: str, [T] and dyn Trait have no known size,
// so they always appear behind a pointer:  &str, Box<dyn Trait>, &[T]
// Every generic implicitly has a Sized bound:
fn generic<T>(t: T) {}              // really: T: Sized
fn generic<T: ?Sized>(t: &T) {}     // opt out — note the reference` },
          compare: {
            note: "<code>type X = Y</code> is a pure alias (like C's <code>typedef</code>); <code>struct X(Y)</code> is a genuinely new type. Mixing those up is a classic source of unit bugs.",
            langs: {
              c: `typedef int Kilometers;    // alias only — no protection`,
              go: `type Kilometers = int      // alias
type Kilometers int        // new type, actually distinct`,
              python: `Kilometers = int                    # alias
class Kilometers(NamedTuple): v: int  # ≈ newtype`,
              java: `record Kilometers(int value) {}     // ≈ newtype`
            }
          }
        },
        {
          t: "quiz",
          q: "Why does <code>Iterator</code> use an associated type rather than a generic parameter?",
          options: [
            "So each type implements Iterator exactly once, and call sites need no annotations",
            "Associated types are faster",
            "Generic traits can't have methods",
            "To allow multiple Item types per type"
          ],
          answer: 0,
          why: "With <code>Iterator&lt;T&gt;</code>, a type could implement it for <code>u32</code> <em>and</em> <code>String</code>, and every <code>next()</code> call would need a type annotation to disambiguate. An associated type says “each iterator yields exactly one kind of thing.”"
        },
        {
          t: "swipe",
          statement: "<code>type Kilometers = i32;</code> creates a distinct type that can't be mixed with plain <code>i32</code>.",
          answer: false,
          why: "That's a pure <strong>alias</strong> — <code>Kilometers</code> and <code>i32</code> are the same type, and adding them is fine. For real distinction use the newtype pattern: <code>struct Kilometers(i32);</code>."
        },
        {
          t: "summary",
          title: "Advanced traits & types",
          points: [
            "<strong>Associated types</strong>: one impl per type. <strong>Generic parameters</strong>: many impls per type.",
            "Operators are traits — <code>Add</code>, <code>Mul</code>, <code>Index</code>, <code>PartialEq</code>.",
            "<strong>Supertraits</strong> require other traits; fully-qualified syntax disambiguates same-named methods.",
            "<strong>Newtype</strong> = new type (orphan rule, safety); <strong>type alias</strong> = just a shorter name.",
            "<code>!</code> is the never type; <code>str</code>, <code>[T]</code> and <code>dyn Trait</code> are unsized and live behind pointers."
          ]
        }
      ]
    },
    {
      id: "20.3",
      title: "Advanced functions and macros",
      est: "7 min",
      tags: ["function pointer","macro","macro_rules","derive","procedural macro"],
      cards: [
        {
          t: "concept",
          kicker: "Functions as values",
          title: "fn pointers and returning closures",
          code: { src:
`fn add_one(x: i32) -> i32 { x + 1 }

// fn (lowercase) is a TYPE — a function pointer.
fn do_twice(f: fn(i32) -> i32, arg: i32) -> i32 { f(arg) + f(arg) }
do_twice(add_one, 5);      // 12

// fn implements all three of Fn, FnMut and FnOnce,
// so you can pass a function anywhere a closure is expected:
let list = vec![1, 2, 3];
let strings: Vec<String> = list.iter().map(ToString::to_string).collect();

// Enum tuple variants are constructor FUNCTIONS:
enum Status { Value(u32), Stop }
let statuses: Vec<Status> = (0u32..20).map(Status::Value).collect();

// Returning a closure
fn returns_closure() -> impl Fn(i32) -> i32 { |x| x + 1 }
fn returns_boxed() -> Box<dyn Fn(i32) -> i32> { Box::new(|x| x + 1) }` }
        },
        {
          t: "concept",
          kicker: "Code that writes code",
          title: "Declarative macros: macro_rules!",
          code: { src:
`// A simplified version of the real vec! macro
#[macro_export]
macro_rules! my_vec {
    ( $( $x:expr ),* $(,)? ) => {      // match zero or more expressions
        {
            let mut temp_vec = Vec::new();
            $(
                temp_vec.push($x);     // repeat this for each match
            )*
            temp_vec
        }
    };
}

let v = my_vec![1, 2, 3];` },
          body: [
            "Macros run at <strong>compile time</strong> and operate on syntax, not values. That's why they can do things functions can't: take a variable number of arguments, accept arbitrary syntax, and generate whole items.",
            "The cost: they're harder to read, harder to debug, and they must be defined before use. Reach for a function first, always."
          ],
          note: { html: "<code>cargo expand</code> shows you exactly what a macro generated — indispensable when something doesn't work the way you expected." }
        },
        {
          t: "concept",
          kicker: "The other kind",
          title: "Procedural macros: derive, attribute, function-like",
          code: { src:
`// 1. Custom derive — the one you use daily
#[derive(Serialize, Deserialize)]   // from the serde crate
struct Config { name: String }

// 2. Attribute macros — transform the item they're attached to
#[tokio::main]
async fn main() {}

#[get("/users/{id}")]               // actix-web
async fn get_user(id: web::Path<u32>) -> impl Responder { }

// 3. Function-like macros
let q = sqlx::query!("SELECT * FROM users WHERE id = $1", id);
// ^ this one actually connects to your database at COMPILE TIME
//   and verifies the SQL and the column types` },
          body: [
            "Procedural macros live in their own crate type and manipulate a token stream — real Rust code transforming real Rust code.",
            "This is how <code>serde</code> generates serialisation for any struct, how <code>tokio</code> sets up a runtime from one attribute, and how <code>sqlx</code> type-checks your SQL against a live schema before your program ever runs."
          ],
          compare: {
            note: "Rust macros are <strong>hygienic</strong> and operate on parsed syntax. C's preprocessor does blind text substitution — which is why <code>#define SQUARE(x) x*x</code> famously breaks on <code>SQUARE(1+2)</code>.",
            langs: {
              c: { src:
`#define SQUARE(x) x*x
SQUARE(1+2)     // expands to 1+2*1+2 == 5, not 9`, note: "Pure text replacement, no understanding of syntax." },
              python: `# no macros — decorators and metaclasses do some of the job
@dataclass
class Config: name: str`,
              java: `// annotation processors ≈ derive macros
@Data class Config { String name; }   // Lombok`,
              js: `// no macros; Babel plugins and build-time codegen fill the gap`,
              go: `//go:generate — run an external program to write source files`
            }
          }
        },
        {
          t: "quiz",
          q: "What can a macro do that a function cannot?",
          options: [
            "Take a variable number of arguments and generate code at compile time",
            "Return multiple values",
            "Access private fields",
            "Run faster"
          ],
          answer: 0,
          why: "Macros operate on syntax before type checking, so <code>println!</code> can take any number of arguments and validate the format string, and <code>vec!</code> can accept list syntax. Functions have fixed signatures. Macros also generate whole items — you can't write <code>#[derive(Debug)]</code> as a function."
        },
        {
          t: "swipe",
          statement: "Rust macros do simple text substitution like C's <code>#define</code>.",
          answer: false,
          why: "Rust macros work on <strong>parsed token trees</strong> and are <em>hygienic</em> — a variable introduced inside a macro can't accidentally capture or collide with one at the call site. The classic C macro bugs (<code>SQUARE(1+2)</code>, variable capture) simply don't occur."
        },
        {
          t: "summary",
          title: "Chapter 20 complete 🎉",
          points: [
            "<code>fn</code> is a type (function pointer) and implements all the <code>Fn</code> traits.",
            "<code>macro_rules!</code> writes declarative macros by pattern-matching on syntax.",
            "Procedural macros power <code>derive</code>, attributes like <code>#[tokio::main]</code>, and function-like macros.",
            "Macros are <strong>hygienic</strong> and syntax-aware — nothing like C's preprocessor.",
            "Prefer a function. Reach for a macro only when a function genuinely can't do the job."
          ]
        }
      ]
    }
  ]
};
