export default {
  id: 15,
  title: "Smart Pointers",
  emoji: "📦",
  blurb: "Box, Rc, RefCell, Deref and Drop",
  intro: "Pointers with extra powers: heap allocation, shared ownership, and runtime-checked borrowing for the cases the compiler can't prove statically.",
  lessons: [
    {
      id: "15.1",
      title: "Box<T>: pointing to data on the heap",
      est: "7 min",
      tags: ["box","heap","recursive type","dyn","indirection"],
      cards: [
        {
          t: "concept",
          kicker: "The simplest smart pointer",
          title: "Box<T> puts a value on the heap",
          codeFirst: true,
          code: { src:
`let b = Box::new(5);       // the 5 lives on the heap; b is a pointer on the stack
println!("b = {b}");       // deref happens automatically
// b is dropped here -> both the pointer and the heap data are freed` },
          body: [
            "A <code>Box</code> has no runtime overhead beyond the allocation itself. Its single owner means the compiler still knows exactly when to free it. Use it when:"
          ],
          list: [
            "You have a <strong>recursive type</strong> whose size would otherwise be infinite.",
            "You have a large value and want to <strong>move it without copying</strong> the bytes.",
            "You want to own a value only via a trait it implements — <code>Box&lt;dyn Trait&gt;</code>."
          ],
          code2: { label: "The recursive-type case", src:
`// ❌ infinite size: List contains a List contains a List...
// enum List { Cons(i32, List), Nil }

// ✅ Box is a pointer, so its size is known (one machine word)
enum List {
    Cons(i32, Box<List>),
    Nil,
}

use List::{Cons, Nil};
let list = Cons(1, Box::new(Cons(2, Box::new(Cons(3, Box::new(Nil))))));` },
          compare: {
            note: "In garbage-collected languages every object is already a heap pointer, so recursion “just works” — and you pay for that on every single value. Rust makes indirection explicit and optional.",
            langs: {
              java: `class Node { int value; Node next; }   // every reference is already a pointer`,
              python: `class Node:
    def __init__(self, v, nxt=None): self.value, self.next = v, nxt`,
              cpp: `std::unique_ptr<Node> next;   // Box<T> is essentially unique_ptr<T>`,
              go: `type Node struct { value int; next *Node }   // explicit pointer, like Box`,
              c: `struct Node { int value; struct Node *next; };   // and you free() it yourself`
            }
          }
        },
        {
          t: "concept",
          kicker: "Two traits",
          title: "Deref and Drop make smart pointers feel built in",
          code: { src:
`use std::ops::Deref;

struct MyBox<T>(T);

impl<T> MyBox<T> {
    fn new(x: T) -> MyBox<T> { MyBox(x) }
}

impl<T> Deref for MyBox<T> {
    type Target = T;
    fn deref(&self) -> &T { &self.0 }     // *x becomes *(x.deref())
}

fn hello(name: &str) { println!("Hello, {name}!"); }

let m = MyBox::new(String::from("Rust"));
hello(&m);       // &MyBox<String> -> &String -> &str
                 // "deref coercion" chains automatically

// Drop: custom cleanup when the value goes out of scope
struct Connection { id: u32 }

impl Drop for Connection {
    fn drop(&mut self) {
        println!("Closing connection {}", self.id);
    }
}

fn main() {
    let _c = Connection { id: 1 };
    println!("Working...");
}   // prints "Working..." then "Closing connection 1" — automatically` },
          body: [
            "<strong>Deref coercion</strong> is why <code>&amp;String</code> works where <code>&amp;str</code> is wanted, and why <code>Box&lt;T&gt;</code> methods feel like <code>T</code> methods. The compiler inserts <code>deref()</code> calls until the types line up.",
            "<code>Drop</code> is RAII: cleanup is tied to scope, so files close, locks release, and connections shut down without you remembering. You can't call <code>drop()</code> directly — use <code>std::mem::drop(value)</code> to drop early."
          ],
          note: { html: "Rust has <b>no <code>finally</code> block and no <code>defer</code></b> — it doesn't need them. <code>Drop</code> runs on every exit path, including panics." }
        },
        {
          t: "quiz",
          q: "Why does a recursive <code>enum List { Cons(i32, List), Nil }</code> fail to compile?",
          options: [
            "Its size would be infinite — the compiler can't determine how much space it needs",
            "Enums can't be recursive at all",
            "You need <code>#[derive(Recursive)]</code>",
            "<code>i32</code> and <code>List</code> can't be in the same variant"
          ],
          answer: 0,
          why: "To lay out <code>List</code>, the compiler needs its size — but that includes another <code>List</code>, forever. <code>Box&lt;List&gt;</code> is a pointer with a fixed, known size, which breaks the cycle. This is why linked structures need indirection in any language without implicit references."
        },
        {
          t: "swipe",
          statement: "You can call <code>value.drop()</code> yourself to free something early.",
          answer: false,
          why: "Rust forbids calling <code>Drop::drop</code> directly — it would run twice (once by you, once at scope end) and cause a double free. Use <code>std::mem::drop(value)</code>, which takes ownership and lets it fall out of scope immediately."
        },
        {
          t: "summary",
          title: "Box, Deref, Drop",
          points: [
            "<code>Box&lt;T&gt;</code> — single-owner heap allocation, no runtime overhead.",
            "Needed for recursive types, large moves, and <code>Box&lt;dyn Trait&gt;</code>.",
            "<code>Deref</code> enables coercion: <code>&amp;String</code> → <code>&amp;str</code>, <code>&amp;Box&lt;T&gt;</code> → <code>&amp;T</code>.",
            "<code>Drop</code> runs automatic cleanup at end of scope — RAII, no <code>finally</code> needed.",
            "<code>std::mem::drop(x)</code> drops early; you never call <code>x.drop()</code>."
          ]
        }
      ]
    },
    {
      id: "15.2",
      title: "Rc<T>: shared ownership",
      est: "7 min",
      tags: ["rc","reference counting","shared","arc","graph","weak"],
      cards: [
        {
          t: "concept",
          kicker: "When one owner isn't enough",
          title: "Rc<T> counts references and frees at zero",
          code: { src:
`use std::rc::Rc;

let a = Rc::new(String::from("shared data"));
println!("count = {}", Rc::strong_count(&a));    // 1

let b = Rc::clone(&a);     // does NOT deep copy — just increments the counter
println!("count = {}", Rc::strong_count(&a));    // 2

{
    let c = Rc::clone(&a);
    println!("count = {}", Rc::strong_count(&a)); // 3
}                                                 // c dropped
println!("count = {}", Rc::strong_count(&a));    // 2

// The String is freed when the last Rc is dropped.` },
          body: [
            "Sometimes a value genuinely has several owners: a node in a graph, a shared configuration, an item in two lists. <code>Rc&lt;T&gt;</code> (reference counted) allows that.",
            "<code>Rc::clone(&amp;a)</code> is written rather than <code>a.clone()</code> as a convention: it signals <em>“cheap, just a counter bump”</em>, not a deep copy."
          ],
          note: { warn: true, html: "<b><code>Rc&lt;T&gt;</code> is single-threaded only.</b> For sharing across threads, use <code>Arc&lt;T&gt;</code> (atomic reference counting) — same API, slightly slower counter. The compiler enforces this: <code>Rc</code> is not <code>Send</code>, so you literally cannot move one to another thread." },
          compare: {
            note: "<code>Rc</code> is exactly what Python and Swift do for <em>every</em> object. Rust makes you opt in, so you only pay for it where you need it.",
            langs: {
              python: { src:
`a = SomeObject()
b = a          # CPython increments a refcount, invisibly
import sys; sys.getrefcount(a)`, note: "Every Python object is refcounted. Rc is opt-in; this is mandatory." },
              cpp: `std::shared_ptr<std::string> a = std::make_shared<std::string>("x");
auto b = a;    // Rc<T> ≈ shared_ptr<T>, but shared_ptr is always atomic`,
              java: `// The GC handles arbitrary sharing, including cycles`,
              go: `// Same — the GC handles it`
            }
          }
        },
        {
          t: "concept",
          kicker: "The catch",
          title: "Reference cycles leak — use Weak<T>",
          code: { src:
`use std::rc::{Rc, Weak};
use std::cell::RefCell;

// A tree where children know their parent.
// Child -> parent must be Weak, or the counts never reach zero.
struct Node {
    value: i32,
    parent: RefCell<Weak<Node>>,      // weak: does NOT keep the parent alive
    children: RefCell<Vec<Rc<Node>>>, // strong: parent owns its children
}

let leaf = Rc::new(Node {
    value: 3,
    parent: RefCell::new(Weak::new()),
    children: RefCell::new(vec![]),
});

let branch = Rc::new(Node {
    value: 5,
    parent: RefCell::new(Weak::new()),
    children: RefCell::new(vec![Rc::clone(&leaf)]),
});

*leaf.parent.borrow_mut() = Rc::downgrade(&branch);   // strong -> weak

// upgrade() returns Option<Rc<T>>: None if the target is already gone
if let Some(parent) = leaf.parent.borrow().upgrade() {
    println!("leaf's parent value = {}", parent.value);
}` },
          body: [
            "Reference counting cannot free a cycle: A holds B, B holds A, neither count ever reaches zero. This is a <strong>memory leak</strong> — and notably, leaks are <em>safe</em> in Rust. Memory safety means no use-after-free, not no leaks.",
            "<code>Weak&lt;T&gt;</code> is a non-owning reference. It doesn't keep the value alive, and <code>upgrade()</code> returns <code>None</code> once the value is gone. Parent pointers, caches and observers should be <code>Weak</code>."
          ]
        },
        {
          t: "quiz",
          q: "What does <code>Rc::clone(&amp;a)</code> do?",
          options: [
            "Increments the reference count and returns a new pointer to the same data",
            "Deep-copies the underlying data",
            "Moves ownership out of <code>a</code>",
            "Creates a weak reference"
          ],
          answer: 0,
          why: "It's a cheap counter increment — no allocation, no data copy. The convention of writing <code>Rc::clone(&amp;a)</code> rather than <code>a.clone()</code> exists precisely so readers can tell it isn't an expensive deep copy."
        },
        {
          t: "swipe",
          statement: "Memory leaks are impossible in safe Rust.",
          answer: false,
          why: "Leaks are <strong>safe</strong>, just undesirable. <code>Rc</code> cycles leak, and <code>std::mem::forget</code> leaks on purpose. Rust guarantees <em>memory safety</em> — no use-after-free, no data races — not the absence of leaks, which aren't a safety problem."
        },
        {
          t: "summary",
          title: "Rc & Weak",
          points: [
            "<code>Rc&lt;T&gt;</code> = multiple owners, freed when the last one drops. <strong>Single-threaded only.</strong>",
            "<code>Rc::clone(&amp;x)</code> bumps a counter — cheap, and conventionally written that way to say so.",
            "<code>Arc&lt;T&gt;</code> is the thread-safe version (Chapter 16).",
            "<code>Rc</code> gives shared <strong>immutable</strong> access; combine with <code>RefCell</code> to mutate.",
            "Cycles leak — break them with <code>Weak&lt;T&gt;</code> and <code>upgrade()</code>."
          ]
        }
      ]
    },
    {
      id: "15.3",
      title: "RefCell<T> and interior mutability",
      est: "8 min",
      tags: ["refcell","interior mutability","runtime borrow","cell","mutex"],
      cards: [
        {
          t: "concept",
          kicker: "Bending the rules, safely",
          title: "RefCell moves borrow checking to runtime",
          code: { src:
`use std::cell::RefCell;

let data = RefCell::new(5);

// Immutable borrow, checked at RUNTIME
{
    let r1 = data.borrow();
    let r2 = data.borrow();       // multiple readers: fine
    println!("{} {}", r1, r2);
}

// Mutable borrow
{
    let mut w = data.borrow_mut();
    *w += 10;
}

println!("{:?}", data.borrow());  // 15

// Break the rule and you PANIC instead of failing to compile:
// let a = data.borrow();
// let b = data.borrow_mut();     💥 already borrowed: BorrowMutError` },
          body: [
            "The borrow rules are identical — many readers or one writer. The difference is <em>when</em> they're checked. The compiler is conservative: it rejects some programs that would actually be fine. <code>RefCell</code> lets you say <em>“trust me, I'll uphold this,”</em> and verifies it at runtime.",
            "<strong>Interior mutability</strong> means mutating data through an immutable reference — which is fine, as long as something guarantees exclusivity. <code>RefCell</code> is that something."
          ],
          note: { warn: true, html: "You trade a <b>compile error</b> for a <b>runtime panic</b>. Use <code>RefCell</code> only when you genuinely need it — usually inside <code>Rc&lt;RefCell&lt;T&gt;&gt;</code>, or in mock objects for tests." }
        },
        {
          t: "concept",
          kicker: "The classic combination",
          title: "Rc<RefCell<T>>: shared, mutable data",
          code: { src:
`use std::cell::RefCell;
use std::rc::Rc;

let shared = Rc::new(RefCell::new(vec![1, 2, 3]));

let a = Rc::clone(&shared);
let b = Rc::clone(&shared);

a.borrow_mut().push(4);
b.borrow_mut().push(5);

println!("{:?}", shared.borrow());   // [1, 2, 3, 4, 5]

// Reading it: Rc gives SHARING, RefCell gives MUTABILITY.
// The threaded equivalent is Arc<Mutex<T>> — Chapter 16.` },
          compare: {
            note: "In other languages every object is implicitly <code>Rc&lt;RefCell&lt;T&gt;&gt;</code> — shared and mutable, with no protection. Rust makes you name what you're doing.",
            langs: {
              python: `shared = [1, 2, 3]
a = shared; b = shared      # aliased and mutable by default
a.append(4); b.append(5)    # nothing warns you`,
              java: `var shared = new ArrayList<Integer>();
var a = shared; var b = shared;   // same object, no protection`,
              cpp: `auto shared = std::make_shared<std::vector<int>>();
// shared_ptr gives sharing; mutation is unchecked`,
              go: `shared := []int{1,2,3}   // aliased; the race detector may find problems at runtime`
            }
          }
        },
        {
          t: "concept",
          kicker: "Pick the right box",
          title: "The smart pointer decision table",
          code: { lang: "text", label: "Which one do I want?", src:
`Box<T>          one owner, heap allocation          compile-time checks
Rc<T>           many owners, single thread          compile-time checks, immutable
Arc<T>          many owners, many threads           compile-time checks, immutable
RefCell<T>      one owner, interior mutability      RUNTIME checks (panics)
Cell<T>         like RefCell but copies values      no borrows at all, no panic
Mutex<T>        interior mutability, many threads   runtime lock (blocks)
RwLock<T>       many readers or one writer, threads runtime lock (blocks)

Rc<RefCell<T>>  shared + mutable, single thread   <- very common
Arc<Mutex<T>>   shared + mutable, multi-thread    <- very common` },
          note: { html: "Reach for these only when plain ownership and borrowing genuinely can't express what you need — graphs, observer patterns, shared caches. Most Rust code uses none of them." }
        },
        {
          t: "quiz",
          q: "What happens if you call <code>borrow_mut()</code> while an immutable <code>borrow()</code> is still alive?",
          options: [
            "It panics at runtime with BorrowMutError",
            "It's a compile error",
            "It silently waits for the other borrow to end",
            "It works — RefCell removes the borrow rules"
          ],
          answer: 0,
          why: "<code>RefCell</code> enforces exactly the same rules, just at runtime — and it panics on violation. That's the trade: more flexibility about <em>when</em> you prove correctness, at the cost of a possible crash instead of a build failure."
        },
        {
          t: "swipe",
          statement: "<code>Rc&lt;RefCell&lt;T&gt;&gt;</code> is safe to share between threads.",
          answer: false,
          why: "Neither part is thread-safe: <code>Rc</code>'s counter isn't atomic and <code>RefCell</code>'s borrow flag isn't either. The compiler <em>enforces</em> this — <code>Rc</code> isn't <code>Send</code>, so it won't even compile. Use <code>Arc&lt;Mutex&lt;T&gt;&gt;</code> across threads."
        },
        {
          t: "order",
          prompt: "Order these by when borrow rules are checked and how failure shows up",
          pieces: ["&T / &mut T — compile time, build error", "RefCell<T> — runtime, panic", "unsafe raw pointers — never checked"],
          answer: [0,1,2],
          why: "Prefer the leftmost option that works. Ordinary references catch problems before the program runs; <code>RefCell</code> catches them at runtime; raw pointers put the burden entirely on you."
        },
        {
          t: "summary",
          title: "Chapter 15 complete 🎉",
          points: [
            "<strong>Interior mutability</strong>: mutate through an immutable reference, with a runtime guarantee.",
            "<code>RefCell&lt;T&gt;</code> enforces the borrow rules at runtime and <strong>panics</strong> on violation.",
            "<code>Rc&lt;RefCell&lt;T&gt;&gt;</code> = shared and mutable, single-threaded.",
            "<code>Arc&lt;Mutex&lt;T&gt;&gt;</code> is the multi-threaded equivalent.",
            "Use these deliberately — plain ownership handles most code, and it's checked at compile time."
          ]
        }
      ]
    }
  ]
};
