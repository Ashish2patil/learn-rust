export default {
  id: 18,
  title: "Object-Oriented Programming Features",
  emoji: "🧩",
  blurb: "Trait objects, dynamic dispatch, and life without inheritance",
  intro: "Is Rust object-oriented? It has encapsulation and polymorphism, but <strong>no inheritance</strong> — and it turns out you don't miss it.",
  lessons: [
    {
      id: "18.1",
      title: "Trait objects for values of different types",
      est: "8 min",
      tags: ["dyn","trait object","dynamic dispatch","vtable","polymorphism"],
      cards: [
        {
          t: "concept",
          kicker: "Runtime polymorphism",
          title: "Box<dyn Trait>: a heterogeneous collection",
          codeFirst: true,
          code: { src:
`pub trait Draw {
    fn draw(&self);
}

pub struct Button { pub label: String }
pub struct SelectBox { pub options: Vec<String> }

impl Draw for Button    { fn draw(&self) { println!("Button: {}", self.label); } }
impl Draw for SelectBox { fn draw(&self) { println!("Select: {:?}", self.options); } }

pub struct Screen {
    pub components: Vec<Box<dyn Draw>>,    // ANY type implementing Draw
}

impl Screen {
    pub fn run(&self) {
        for component in &self.components {
            component.draw();              // dispatched at runtime
        }
    }
}

let screen = Screen {
    components: vec![
        Box::new(Button { label: String::from("OK") }),
        Box::new(SelectBox { options: vec![String::from("Yes")] }),
    ],
};
screen.run();` },
          body: [
            "A <code>Vec&lt;Box&lt;dyn Draw&gt;&gt;</code> can hold different concrete types at once — something a generic <code>Vec&lt;T&gt;</code> cannot do, because monomorphization fixes <code>T</code> to one type.",
            "The cost: a <strong>vtable</strong> lookup on each call, and the compiler can't inline across it."
          ]
        },
        {
          t: "concept",
          kicker: "The trade-off",
          title: "Static vs dynamic dispatch",
          code: { lang: "text", label: "Two kinds of polymorphism", src:
`STATIC DISPATCH — impl Trait / <T: Trait>
  compiler generates one copy per concrete type
  ✅ fastest: direct calls, fully inlinable
  ❌ bigger binary, longer compiles
  ❌ all values in a collection must be the SAME type

DYNAMIC DISPATCH — &dyn Trait / Box<dyn Trait>
  one copy of the code; a vtable pointer picks the method at runtime
  ✅ mixed types in one collection
  ✅ smaller binary, faster compiles
  ❌ one pointer indirection per call, no inlining` },
          code2: { src:
`fn draw_static(item: &impl Draw) { item.draw(); }   // monomorphized
fn draw_dynamic(item: &dyn Draw)  { item.draw(); }  // vtable lookup

// A Box<dyn Draw> is a "fat pointer": two words wide.
//   [ pointer to data | pointer to vtable ]` },
          note: { html: "<b>Default to static dispatch.</b> Reach for <code>dyn</code> when you genuinely need a mixed collection, a plugin system, or to cut compile times. The runtime cost is small but real." },
          compare: {
            note: "In Java and Python <em>every</em> method call is dynamically dispatched by default. Rust makes it the opt-in, so you only pay where you need it.",
            langs: {
              java: `List<Drawable> components = new ArrayList<>();   // always dynamic dispatch
// final classes and JIT devirtualisation claw some of it back`,
              python: `components = [Button(), SelectBox()]   # duck typing, fully dynamic`,
              cpp: `std::vector<std::unique_ptr<Draw>> components;   // virtual = dynamic
// non-virtual methods are static, same opt-in idea as Rust`,
              go: `var components []Draw   // interface values are fat pointers, like dyn Trait`
            }
          }
        },
        {
          t: "concept",
          kicker: "The rules",
          title: "Object safety: not every trait can be a trait object",
          code: { src:
`// ❌ Not object safe — the return type depends on Self
trait Clone {
    fn clone(&self) -> Self;
}
// Box<dyn Clone> is impossible: how big is the returned Self?

// ❌ Not object safe — a generic method would need infinite vtable entries
trait Container {
    fn get<T>(&self) -> T;
}

// ✅ Object safe
trait Draw {
    fn draw(&self);
    fn area(&self) -> f64;
}` },
          list: [
            "Methods must not return <code>Self</code>.",
            "Methods must not have generic type parameters.",
            "(Methods that break these can still exist if marked <code>where Self: Sized</code> — they're just unavailable on the trait object.)"
          ],
          note: { html: "The reason is mechanical: a vtable is a fixed table of function pointers. A generic method would need one entry per instantiation — unbounded. A <code>-&gt; Self</code> return has no known size at the call site." }
        },
        {
          t: "quiz",
          q: "Why can't you write <code>Vec&lt;T: Draw&gt;</code> to hold both Buttons and SelectBoxes?",
          options: [
            "A generic <code>Vec&lt;T&gt;</code> is monomorphized to one concrete <code>T</code>",
            "Generics don't work with traits",
            "Vec only accepts Copy types",
            "You'd need to derive Draw"
          ],
          answer: 0,
          why: "Generics are resolved at compile time to a single concrete type, so <code>Vec&lt;Button&gt;</code> and <code>Vec&lt;SelectBox&gt;</code> are different types. For a genuinely mixed collection you need <code>Vec&lt;Box&lt;dyn Draw&gt;&gt;</code> and runtime dispatch."
        },
        {
          t: "swipe",
          statement: "Dynamic dispatch with <code>dyn Trait</code> costs about the same as a static call.",
          answer: false,
          why: "There's a vtable indirection on every call, and — more importantly — the compiler can't inline through it, which blocks other optimisations. The cost is small in absolute terms but real in hot loops. Prefer generics unless you need the flexibility."
        },
        {
          t: "summary",
          title: "Trait objects",
          points: [
            "<code>Box&lt;dyn Trait&gt;</code> / <code>&amp;dyn Trait</code> allow mixed types in one collection.",
            "Static dispatch (generics) is faster; dynamic dispatch is more flexible and compiles quicker.",
            "A <code>dyn</code> reference is a <strong>fat pointer</strong>: data pointer plus vtable pointer.",
            "<strong>Object safety</strong>: no <code>-&gt; Self</code> returns, no generic methods.",
            "Default to generics; use <code>dyn</code> for plugins, heterogeneous lists and compile-time savings."
          ]
        }
      ]
    },
    {
      id: "18.2",
      title: "Design patterns without inheritance",
      est: "7 min",
      tags: ["composition","state pattern","typestate","encapsulation","newtype"],
      cards: [
        {
          t: "concept",
          kicker: "The missing feature",
          title: "Rust has no inheritance — on purpose",
          body: [
            "You cannot make <code>struct Dog</code> inherit from <code>struct Animal</code>. Rust offers <strong>composition</strong> (put an <code>Animal</code> field inside <code>Dog</code>) and <strong>traits</strong> (share behaviour, including default implementations) instead.",
            "This isn't an oversight. Inheritance couples subclass to superclass so tightly that changing the parent breaks children in ways nobody predicted — the “fragile base class” problem. Java's own style guides say <em>“favour composition over inheritance”</em>; Rust simply removed the temptation."
          ],
          code: { src:
`// Instead of "Dog extends Animal":
struct Animal { name: String, age: u8 }

struct Dog {
    animal: Animal,     // composition
    breed: String,
}

// Shared behaviour via a trait, with defaults:
trait Speak {
    fn sound(&self) -> String;
    fn speak(&self) {                      // default implementation
        println!("{}", self.sound());
    }
}

impl Speak for Dog {
    fn sound(&self) -> String { String::from("Woof") }
}` },
          compare: {
            note: "Go made the same call — no inheritance, just embedding and interfaces. Both languages arrived there after watching decades of deep class hierarchies age badly.",
            langs: {
              java: `class Dog extends Animal {     // tight coupling to Animal's internals
    @Override void speak() { ... }
}`,
              python: `class Dog(Animal):
    def speak(self): ...       # plus multiple inheritance and the MRO`,
              go: `type Dog struct {
    Animal        // embedding: promotes Animal's fields and methods
    Breed string
}   // no inheritance, exactly like Rust`,
              cpp: `class Dog : public Animal { };   // plus multiple inheritance, virtual bases, diamonds`
            }
          }
        },
        {
          t: "concept",
          kicker: "A better pattern",
          title: "The typestate pattern beats the state pattern",
          code: { src:
`// The classic OO State pattern, in Rust: works, but shuffles Boxes around.
trait State {
    fn request_review(self: Box<Self>) -> Box<dyn State>;
}

// The Rust-idiomatic version: each state is its OWN TYPE.
pub struct Draft { content: String }
pub struct PendingReview { content: String }
pub struct Published { content: String }

impl Draft {
    pub fn new() -> Self { Draft { content: String::new() } }
    pub fn add_text(&mut self, text: &str) { self.content.push_str(text); }
    pub fn request_review(self) -> PendingReview {     // consumes the Draft
        PendingReview { content: self.content }
    }
}

impl PendingReview {
    pub fn approve(self) -> Published {
        Published { content: self.content }
    }
}

impl Published {
    pub fn content(&self) -> &str { &self.content }    // ONLY Published has this
}

// let post = Draft::new();
// post.content();          ❌ compile error — a Draft has no content()
// post.approve();          ❌ compile error — you must request_review() first` },
          body: [
            "Because each transition <strong>consumes</strong> the old state and returns a new type, invalid sequences are <em>unrepresentable</em>. The compiler enforces your state machine.",
            "This is Rust at its best: it turns runtime checks into compile-time guarantees with no runtime cost at all."
          ],
          note: { html: "You'll see this everywhere in real crates — HTTP request builders, typed connection states, embedded pin configuration. Once you've used it, going back to <code>if (state == DRAFT)</code> feels careless." }
        },
        {
          t: "quiz",
          q: "What does the typestate pattern give you over a runtime state field?",
          options: [
            "Invalid transitions become compile errors instead of runtime bugs",
            "Faster state transitions at runtime",
            "Less code to write",
            "Automatic serialisation of state"
          ],
          answer: 0,
          why: "Each state is a distinct type exposing only the operations valid in that state. Calling <code>approve()</code> on a <code>Draft</code> doesn't fail at runtime — it doesn't compile. It's usually a bit more code, and it eliminates a whole category of bug."
        },
        {
          t: "swipe",
          statement: "Because Rust lacks inheritance, you can't share implementation between types.",
          answer: false,
          why: "Trait <strong>default methods</strong> share implementation, and composition shares data. Between them you get everything inheritance offered, without the fragile base class problem. <code>Iterator</code> is the proof: implement one method, inherit seventy."
        },
        {
          t: "summary",
          title: "Chapter 18 complete 🎉",
          points: [
            "Rust has <strong>encapsulation</strong> (private by default) and <strong>polymorphism</strong> (traits), but <strong>no inheritance</strong>.",
            "Share data by <strong>composition</strong>, share behaviour by <strong>trait default methods</strong>.",
            "<code>Box&lt;dyn Trait&gt;</code> gives runtime polymorphism when you need mixed types.",
            "The <strong>typestate pattern</strong> encodes a state machine in the type system — invalid transitions won't compile.",
            "Rust's answer to most OO patterns is “use the type system instead”."
          ]
        }
      ]
    }
  ]
};
