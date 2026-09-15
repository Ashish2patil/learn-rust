export default {
  id: 5,
  title: "Using Structs to Structure Related Data",
  emoji: "🏗️",
  blurb: "Custom types with named fields, and methods on them",
  intro: "Structs group related values under one name. Add methods, and you have the closest thing Rust has to a class — minus the inheritance.",
  lessons: [
    {
      id: "5.1",
      title: "Defining and instantiating structs",
      est: "7 min",
      tags: ["struct","fields","tuple struct","unit struct","update syntax"],
      cards: [
        {
          t: "concept",
          kicker: "Your own types",
          title: "A struct is a named bundle of named fields",
          codeFirst: true,
          code: { src:
`struct User {
    active: bool,
    username: String,
    email: String,
    sign_in_count: u64,
}

fn main() {
    let mut user1 = User {
        active: true,
        username: String::from("ferris"),
        email: String::from("ferris@rust-lang.org"),
        sign_in_count: 1,
    };

    user1.email = String::from("new@example.com");   // needs the whole struct to be mut
    println!("{}", user1.username);
}` },
          body: [
            "Unlike a tuple, every piece has a name, so order doesn't matter and the code documents itself.",
            "<strong>Mutability is all-or-nothing.</strong> Rust has no per-field <code>mut</code> — either the whole instance is mutable or none of it is."
          ],
          compare: {
            note: "The big difference: a Rust struct holds only <em>data</em>. Behaviour goes in a separate <code>impl</code> block — and there's no inheritance anywhere.",
            langs: {
              python: `@dataclass
class User:
    active: bool
    username: str
    email: str
    sign_in_count: int`,
              go: `type User struct {
    Active      bool
    Username    string
    Email       string
    SignInCount uint64
}   // Go structs are almost identical to Rust's`,
              java: `record User(boolean active, String username,
            String email, long signInCount) {}`,
              cpp: `struct User {
    bool active;
    std::string username;
    std::string email;
    uint64_t sign_in_count;
};`,
              c: `struct User {
    bool active;
    char *username;    // and you manage that memory yourself
    char *email;
    uint64_t sign_in_count;
};`
            }
          }
        },
        {
          t: "concept",
          kicker: "Shortcuts",
          title: "Field init shorthand and struct update syntax",
          code: { src:
`fn build_user(email: String, username: String) -> User {
    User {
        active: true,
        username,          // shorthand for username: username
        email,             // shorthand for email: email
        sign_in_count: 1,
    }
}

// Struct update syntax: take the rest from another instance
let user2 = User {
    email: String::from("another@example.com"),
    ..user1              // must come LAST
};

// ⚠️ user1.username was MOVED into user2, so user1 is partially moved.
// user1.active and user1.sign_in_count are still readable (they're Copy).` },
          note: { warn: true, html: "<code>..user1</code> <b>moves</b> any non-Copy fields it takes. If you still need <code>user1</code> afterwards, clone the fields you need instead." }
        },
        {
          t: "concept",
          kicker: "Two variations",
          title: "Tuple structs and unit structs",
          code: { src:
`// Tuple struct: fields have types but no names. Great for newtypes.
struct Color(i32, i32, i32);
struct Point(i32, i32, i32);

let black = Color(0, 0, 0);
let origin = Point(0, 0, 0);
println!("{}", black.0);

// These are DIFFERENT types, even though the shapes match:
// fn paint(c: Color) {}
// paint(origin);   ❌ expected Color, found Point

// Unit struct: no fields at all. Useful for implementing a trait
// on something that carries no data.
struct AlwaysEqual;
let subject = AlwaysEqual;` },
          body: [
            "The <strong>newtype pattern</strong> — wrapping a value in a one-field tuple struct — is very common in Rust. <code>struct Meters(f64);</code> and <code>struct Feet(f64);</code> can never be confused, even though both are just an <code>f64</code> at runtime. Zero cost, real safety."
          ],
          compare: {
            note: "In Python, Java or C you'd pass a bare float and hope. Rust's newtype makes mixing up units a <em>compile error</em> — a NASA orbiter was lost to exactly that bug.",
            langs: {
              python: `Meters = float   # a type alias — provides no protection at all
def travel(d: Meters): ...
travel(feet_value)   # no complaint`,
              go: `type Meters float64   // Go named types give similar protection
type Feet float64`,
              java: `record Meters(double value) {}   // records make this bearable
record Feet(double value) {}`
            }
          }
        },
        {
          t: "quiz",
          q: "Can you make a single field of a struct mutable while the rest stay immutable?",
          options: [
            "No — mutability applies to the whole instance",
            "Yes, mark the field <code>mut</code> in the definition",
            "Yes, with <code>let mut self.field</code>",
            "Only for Copy fields"
          ],
          answer: 0,
          why: "Rust has no per-field mutability: the binding is either <code>mut</code> or it isn't. If you genuinely need interior mutability on one field, that's <code>Cell</code> / <code>RefCell</code> — coming in Chapter 15."
        },
        {
          t: "swipe",
          statement: "<code>struct Meters(f64)</code> and <code>struct Feet(f64)</code> can be passed interchangeably.",
          answer: false,
          why: "They're <strong>distinct types</strong>. The compiler rejects passing one where the other is expected, even though both are just an <code>f64</code> in memory with zero runtime overhead. This is the <em>newtype pattern</em>, and it's one of Rust's cheapest wins."
        },
        {
          t: "summary",
          title: "Structs",
          points: [
            "<code>struct Name { field: Type, ... }</code> — named fields, self-documenting.",
            "Mutability is <strong>per instance</strong>, never per field.",
            "Field init shorthand (<code>username,</code>) and update syntax (<code>..other</code>) cut boilerplate — but <code>..other</code> moves.",
            "<strong>Tuple structs</strong> give you the newtype pattern: distinct types, zero cost.",
            "Unit structs carry no data and exist to hang trait implementations on."
          ]
        }
      ]
    },
    {
      id: "5.2",
      title: "An example program using structs",
      est: "5 min",
      tags: ["refactor","derive","debug","dbg"],
      cards: [
        {
          t: "concept",
          kicker: "Refactoring",
          title: "From loose variables to a meaningful type",
          code: { src:
`// v1: what do these numbers mean?
fn area(width: u32, height: u32) -> u32 { width * height }
area(30, 50);          // easy to swap them by mistake

// v2: a tuple groups them, but .0 and .1 say nothing
fn area(dims: (u32, u32)) -> u32 { dims.0 * dims.1 }

// v3: a struct says exactly what it is
struct Rectangle { width: u32, height: u32 }
fn area(rect: &Rectangle) -> u32 { rect.width * rect.height }   // borrow, don't consume` },
          body: [
            "Note the <code>&amp;</code>: <code>area</code> only needs to <em>read</em> the rectangle, so it borrows. Taking <code>Rectangle</code> by value would consume it and the caller couldn't use it again."
          ]
        },
        {
          t: "concept",
          kicker: "Printing your types",
          title: "derive(Debug) and the dbg! macro",
          code: { src:
`#[derive(Debug)]                     // auto-implement the Debug trait
struct Rectangle { width: u32, height: u32 }

fn main() {
    let rect = Rectangle { width: 30, height: 50 };

    println!("{rect:?}");     // Rectangle { width: 30, height: 50 }
    println!("{rect:#?}");    // pretty-printed across multiple lines

    // dbg! prints file, line, expression AND value to stderr,
    // then returns the value so you can leave it inline.
    let scale = 2;
    let rect2 = Rectangle {
        width: dbg!(30 * scale),
        height: 50,
    };
    dbg!(&rect2);
}` },
          out:
`Rectangle { width: 30, height: 50 }
Rectangle {
    width: 30,
    height: 50,
}
[src/main.rs:14:16] 30 * scale = 60
[src/main.rs:18:5] &rect2 = Rectangle {
    width: 60,
    height: 50,
}`,
          note: { html: "Without <code>#[derive(Debug)]</code>, <code>{:?}</code> is a compile error. Rust makes you opt in to printability — which means a type never accidentally leaks its internals into logs." },
          compare: {
            note: "<code>#[derive(...)]</code> generates the implementation at compile time. You can derive <code>Debug</code>, <code>Clone</code>, <code>Copy</code>, <code>PartialEq</code>, <code>Eq</code>, <code>Hash</code>, <code>PartialOrd</code>, <code>Ord</code> and <code>Default</code>.",
            langs: {
              python: `@dataclass          # gives __repr__, __eq__ for free
class Rectangle:
    width: int
    height: int`,
              java: `record Rectangle(int width, int height) {}
// records auto-generate toString, equals, hashCode`,
              go: `fmt.Printf("%+v\\n", rect)   // works on any struct, no opt-in needed`,
              cpp: `// You write operator<< by hand. Every time.
std::ostream& operator<<(std::ostream& os, const Rectangle& r) { ... }`
            }
          }
        },
        {
          t: "quiz",
          q: "Why does <code>println!(\"{rect:?}\")</code> fail without <code>#[derive(Debug)]</code>?",
          options: [
            "<code>{:?}</code> requires the <code>Debug</code> trait, and Rust never implements traits for you implicitly",
            "You must use <code>{}</code> for structs",
            "Structs can't be printed at all",
            "You need to import the Debug module"
          ],
          answer: 0,
          why: "<code>{:?}</code> is powered by the <code>Debug</code> trait; <code>{}</code> is powered by <code>Display</code>. <code>Debug</code> can be derived in one line; <code>Display</code> must be written by hand, because how a type should look to <em>end users</em> is a design decision."
        },
        {
          t: "summary",
          title: "Structs in practice",
          points: [
            "Group related values into a struct — the names become the documentation.",
            "Borrow (<code>&amp;Rectangle</code>) when a function only needs to read.",
            "<code>#[derive(Debug)]</code> unlocks <code>{:?}</code> and <code>{:#?}</code>.",
            "<code>dbg!(expr)</code> prints file, line, expression and value, then hands the value back."
          ]
        }
      ]
    },
    {
      id: "5.3",
      title: "Method syntax",
      est: "7 min",
      tags: ["impl","methods","self","associated function","constructor"],
      cards: [
        {
          t: "concept",
          kicker: "Behaviour",
          title: "impl blocks attach methods to a type",
          codeFirst: true,
          code: { src:
`#[derive(Debug)]
struct Rectangle { width: u32, height: u32 }

impl Rectangle {
    // &self  — borrow immutably (most common)
    fn area(&self) -> u32 {
        self.width * self.height
    }

    fn can_hold(&self, other: &Rectangle) -> bool {
        self.width > other.width && self.height > other.height
    }

    // &mut self — borrow mutably, to change the instance
    fn scale(&mut self, factor: u32) {
        self.width *= factor;
        self.height *= factor;
    }

    // self — consume the instance (it's gone after the call)
    fn into_square(self) -> Rectangle {
        let side = self.width.max(self.height);
        Rectangle { width: side, height: side }
    }
}

fn main() {
    let mut rect = Rectangle { width: 30, height: 50 };
    println!("{}", rect.area());
    rect.scale(2);
    let sq = rect.into_square();   // rect is consumed here
    println!("{sq:?}");
}` },
          body: [
            "The first parameter is always some form of <code>self</code>, and which one you pick <strong>is the API contract</strong>:"
          ],
          list: [
            "<code>&amp;self</code> — “I'll read your data.” Use this by default.",
            "<code>&amp;mut self</code> — “I'll modify you.” The caller's variable must be <code>mut</code>.",
            "<code>self</code> — “I'll consume you.” Used for conversions, like <code>into_square</code>."
          ],
          note: { html: "You can spot a consuming method by convention: names starting with <code>into_</code> take <code>self</code>, names starting with <code>to_</code> take <code>&amp;self</code> and copy." }
        },
        {
          t: "concept",
          kicker: "Constructors",
          title: "Associated functions: no self, called with ::",
          code: { src:
`impl Rectangle {
    // No self -> an "associated function", not a method.
    // This is how Rust does constructors.
    fn new(width: u32, height: u32) -> Self {
        Self { width, height }      // Self is an alias for Rectangle
    }

    fn square(size: u32) -> Self {
        Self { width: size, height: size }
    }
}

let r = Rectangle::new(30, 50);    // :: for associated functions
let s = Rectangle::square(20);
let a = s.area();                  // .  for methods` },
          body: [
            "Rust has <strong>no special constructor syntax</strong> and no <code>new</code> keyword. <code>new</code> is just a conventional name for an associated function that returns <code>Self</code>. You can have as many differently-named constructors as you like — which is nicer than overloading."
          ],
          compare: {
            note: "Rust splits data (<code>struct</code>) from behaviour (<code>impl</code>). Go does exactly the same; Python, Java and C++ merge them into a class.",
            langs: {
              python: `class Rectangle:
    def __init__(self, w, h):     # one constructor...
        self.width, self.height = w, h
    @classmethod
    def square(cls, s): return cls(s, s)   # ...plus classmethods
    def area(self): return self.width * self.height`,
              go: `func NewRectangle(w, h uint32) Rectangle { return Rectangle{w, h} }
func (r Rectangle) Area() uint32 { return r.Width * r.Height }
func (r *Rectangle) Scale(f uint32) { r.Width *= f }
// value receiver ≈ &self, pointer receiver ≈ &mut self`,
              java: `class Rectangle {
    private final int width, height;
    Rectangle(int w, int h) { width = w; height = h; }
    static Rectangle square(int s) { return new Rectangle(s, s); }
    int area() { return width * height; }
}`,
              cpp: `struct Rectangle {
    uint32_t width, height;
    uint32_t area() const { return width * height; }   // const ≈ &self
    void scale(uint32_t f) { width *= f; height *= f; } // non-const ≈ &mut self
};`
            }
          }
        },
        {
          t: "concept",
          kicker: "Nice touch",
          title: "Automatic referencing — no arrow operator",
          code: { src:
`let rect = Rectangle { width: 30, height: 50 };
let boxed = Box::new(rect);

rect.area();     // Rust inserts &rect automatically
boxed.area();    // Rust dereferences the Box automatically

// In C++ you'd have to know which to write:
//   rect.area();     for a value
//   ptr->area();     for a pointer` },
          body: [
            "When you write <code>x.method()</code>, Rust automatically adds <code>&amp;</code>, <code>&amp;mut</code> or <code>*</code> as needed to make the receiver match. This is called <strong>automatic referencing and dereferencing</strong>, and it's why Rust has no <code>-&gt;</code> operator."
          ]
        },
        {
          t: "quiz",
          q: "You want a method that changes the struct's fields. What should its first parameter be?",
          options: ["<code>&amp;mut self</code>", "<code>&amp;self</code>", "<code>self</code>", "<code>mut self</code>"],
          answer: 0,
          why: "<code>&amp;mut self</code> mutably borrows the instance: you can change it, and the caller keeps it afterwards. <code>self</code> would consume it entirely, and <code>&amp;self</code> is read-only."
        },
        {
          t: "swipe",
          statement: "<code>Rectangle::new()</code> is special constructor syntax built into Rust.",
          answer: false,
          why: "There's nothing special about it — <code>new</code> is an ordinary associated function that happens to return <code>Self</code>, and the name is pure convention. You could call it <code>make</code>, <code>create</code>, or have five differently-named constructors. Rust has no constructor keyword and no function overloading."
        },
        {
          t: "order",
          prompt: "Order these by how much access they give the method",
          pieces: ["&self", "&mut self", "self"],
          answer: [0,1,2],
          why: "<code>&amp;self</code> reads; <code>&amp;mut self</code> reads and writes; <code>self</code> takes ownership and consumes the value. Always pick the least powerful one that does the job — it makes your API usable in more situations."
        },
        {
          t: "summary",
          title: "Chapter 5 complete 🎉",
          points: [
            "Data lives in <code>struct</code>; behaviour lives in <code>impl</code>. No inheritance.",
            "<code>&amp;self</code> / <code>&amp;mut self</code> / <code>self</code> declare exactly what a method does to the value.",
            "Associated functions have no <code>self</code> and are called with <code>::</code> — that's how you write constructors.",
            "<code>Self</code> (capital S) is shorthand for the type you're implementing.",
            "Rust auto-references on method calls, so there's no <code>-&gt;</code> operator to remember."
          ]
        }
      ]
    }
  ]
};
