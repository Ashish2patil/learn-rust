export default {
  id: 8,
  title: "Common Collections",
  emoji: "🗃️",
  blurb: "Vec, String and HashMap",
  intro: "Three heap-allocated, growable collections you'll use constantly — plus the reason Rust strings are harder than you expect (and why that's honest).",
  lessons: [
    {
      id: "8.1",
      title: "Storing lists with vectors",
      est: "8 min",
      tags: ["vec","vector","push","index","get","iterate","enum"],
      cards: [
        {
          t: "concept",
          kicker: "The growable array",
          title: "Vec<T> — one type, any number of items",
          codeFirst: true,
          code: { src:
`let mut v: Vec<i32> = Vec::new();
v.push(5);
v.push(6);

let v2 = vec![1, 2, 3];        // the vec! macro infers the type

// Two ways to read an element:
let third: &i32 = &v2[2];          // panics if out of range
let third: Option<&i32> = v2.get(2);   // returns None if out of range

match v2.get(100) {
    Some(n) => println!("got {n}"),
    None    => println!("nothing there"),   // ✅ no panic
}

// Other useful methods
v2.len(); v2.is_empty(); v2.contains(&2);
let mut v3 = vec![3, 1, 2];
v3.sort();                 // [1, 2, 3]
v3.reverse();              // [3, 2, 1]
let last = v3.pop();       // Some(1), removes it
v3.insert(0, 9);
v3.remove(0);
v3.retain(|x| *x > 1);     // keep only matching elements` },
          body: [
            "Use <code>[i]</code> when an out-of-range index means your program is broken and should crash. Use <code>.get(i)</code> when it's a normal situation you want to handle."
          ],
          compare: {
            note: "The naming is the main thing to remember: Rust's <code>Vec</code> plays the role of Python's list, Java's ArrayList, Go's slice and C++'s vector.",
            langs: {
              python: `v = [1, 2, 3]
v.append(4)
v[2]        # IndexError if out of range
v[100] if len(v) > 100 else None   # ≈ .get()`,
              java: `var v = new ArrayList<Integer>();
v.add(5);
v.get(2);    // IndexOutOfBoundsException`,
              cpp: `std::vector<int> v{1,2,3};
v.push_back(4);
v[2];        // ⚠️ NO bounds check — undefined behaviour
v.at(2);     // throws, if you remember to use it`,
              go: `v := []int{1, 2, 3}
v = append(v, 4)     // note: you must reassign
v[2]                 // panics if out of range`
            }
          }
        },
        {
          t: "concept",
          kicker: "Borrowing strikes",
          title: "You can't push while holding a reference",
          code: { src:
`let mut v = vec![1, 2, 3, 4, 5];

let first = &v[0];      // immutable borrow starts
v.push(6);              // ❌ needs a mutable borrow — cannot borrow as mutable
println!("{first}");    // ...because 'first' is still used here` },
          body: [
            "This looks over-strict until you know how a <code>Vec</code> works: when it runs out of capacity, <code>push</code> <strong>allocates a new, bigger buffer and moves everything</strong>. Any reference into the old buffer would instantly dangle.",
            "This is a real, common bug in C++ (iterator invalidation) and it's undefined behaviour there. Rust makes it a compile error."
          ],
          note: { html: "Fix it by finishing with the reference before mutating, by copying the value out (<code>let first = v[0];</code> — <code>i32</code> is <code>Copy</code>), or by restructuring the loop." }
        },
        {
          t: "concept",
          kicker: "Iterating",
          title: "Three ways to loop, three levels of access",
          code: { src:
`let mut v = vec![100, 32, 57];

for n in &v        { println!("{n}"); }   // &i32     — read only
for n in &mut v    { *n += 50; }          // &mut i32 — modify in place (* to deref)
for n in v         { println!("{n}"); }   // i32      — CONSUMES the vector

// println!("{v:?}");   ❌ v was moved by the third loop

// Storing mixed types? Use an enum.
#[derive(Debug)]
enum Cell { Int(i32), Float(f64), Text(String) }

let row = vec![
    Cell::Int(3),
    Cell::Text(String::from("blue")),
    Cell::Float(10.12),
];` },
          body: [
            "A <code>Vec&lt;T&gt;</code> holds exactly one type — the compiler needs to know how much space each element takes. To mix types, wrap them in an enum (known variants) or use <code>Box&lt;dyn Trait&gt;</code> (open-ended — Chapter 17)."
          ]
        },
        {
          t: "quiz",
          q: "Why does Rust reject holding <code>&amp;v[0]</code> across a <code>v.push(...)</code>?",
          options: [
            "push may reallocate the buffer, which would leave the reference dangling",
            "Vec is immutable once created",
            "You can only have one reference into a Vec at a time",
            "It's an arbitrary restriction to keep the compiler simple"
          ],
          answer: 0,
          why: "When capacity runs out, <code>push</code> allocates a bigger buffer and moves the elements. Old references would point into freed memory. C++ calls this <em>iterator invalidation</em> and it's undefined behaviour; Rust catches it at compile time."
        },
        {
          t: "swipe",
          statement: "<code>for n in v</code> leaves <code>v</code> usable afterwards.",
          answer: false,
          why: "That form <strong>consumes</strong> the vector — ownership moves into the loop. Use <code>&amp;v</code> to read or <code>&amp;mut v</code> to modify while keeping ownership. This is the most common early mistake when looping in Rust."
        },
        {
          t: "summary",
          title: "Vectors",
          points: [
            "<code>Vec&lt;T&gt;</code> is the growable array: <code>vec![]</code>, <code>push</code>, <code>pop</code>, <code>len</code>, <code>sort</code>, <code>retain</code>.",
            "<code>v[i]</code> panics out of range; <code>v.get(i)</code> gives you an <code>Option</code>.",
            "You can't mutate a vector while a reference into it is alive — this prevents dangling pointers.",
            "<code>for x in &amp;v</code> / <code>&amp;mut v</code> / <code>v</code> — read, modify, or consume.",
            "One element type only; use an enum to hold a mix."
          ]
        }
      ]
    },
    {
      id: "8.2",
      title: "Storing UTF-8 text with strings",
      est: "9 min",
      tags: ["string","str","utf8","unicode","chars","bytes","push_str"],
      cards: [
        {
          t: "concept",
          kicker: "Two string types",
          title: "String owns, &str borrows",
          code: { src:
`let literal: &str = "hello";              // borrowed, in the binary, immutable
let mut owned: String = String::new();    // owned, heap, growable

let s = "hi".to_string();
let s = String::from("hi");               // identical to the line above

// Growing a String
let mut s = String::from("foo");
s.push_str("bar");      // append a &str
s.push('!');            // append a single char

// Concatenation
let a = String::from("Hello, ");
let b = String::from("world!");
let c = a + &b;         // a is MOVED; b is borrowed. c == "Hello, world!"
// println!("{a}");     ❌ a was moved

// format! is usually nicer — it borrows everything and moves nothing
let a = String::from("tic");
let b = String::from("tac");
let s = format!("{a}-{b}-toe");
println!("{a}");        // ✅ still fine` },
          note: { html: "<b>Prefer <code>format!</code> over <code>+</code>.</b> It reads better and doesn't consume its inputs." }
        },
        {
          t: "concept",
          kicker: "The famous frustration",
          title: "You cannot index a String",
          code: { src:
`let s = String::from("hello");
// let h = s[0];     ❌ error: String cannot be indexed by integer

// Why? Because "index" is ambiguous for UTF-8:
let hindi = String::from("नमस्ते");
hindi.len();                      // 18 — BYTES, not characters!
hindi.chars().count();            // 6  — Unicode scalar values
// and a human would say it has 4 visible letters (grapheme clusters)

// So Rust makes you say what you mean:
for c in hindi.chars() { print!("{c} "); }   // न म स ् त े
for b in hindi.bytes() { print!("{b} "); }   // 224 164 168 ...

// Slicing works, but on BYTE indices, and panics mid-character:
let hello = "Здравствуйте";
let s = &hello[0..4];     // "Зд" — each Cyrillic letter is 2 bytes
// let s = &hello[0..1];  💥 panics: byte index 1 is not a char boundary` },
          body: [
            "Most languages let you write <code>s[0]</code> and quietly give you something wrong for non-English text — a half-character, or a UTF-16 surrogate. Rust refuses to pretend the problem doesn't exist.",
            "It's annoying exactly once, when you learn it. After that, your string code just works for every language on earth."
          ],
          compare: {
            note: "Try reversing an emoji-containing string in most languages and watch it break. Rust makes you handle text honestly from the start.",
            langs: {
              python: { src:
`s = "नमस्ते"
len(s)       # 6 — Python counts code points
s[0]         # 'न'
len("👨‍👩‍👧")  # 5! a family emoji is 5 code points joined by ZWJ`, note: "Python hides bytes, but grapheme clusters still surprise you." },
              java: { src:
`"👍".length()    // 2! Java strings are UTF-16, emoji take two chars
s.charAt(0)      // may return half a surrogate pair`, note: "Java's char is 16 bits — too small for modern Unicode." },
              go: { src:
`s := "नमस्ते"
len(s)              // 18 — bytes, exactly like Rust
for _, r := range s // iterates runes (code points)`, note: "Go's model is nearly identical to Rust's — it just allows s[0] to give you a raw byte." },
              c: { src:
`char *s = "नमस्ते";
strlen(s);   // 18 bytes
s[0];        // one byte — meaningless on its own`, note: "C has no concept of Unicode at all." }
            }
          }
        },
        {
          t: "quiz",
          q: "What does <code>\"नमस्ते\".len()</code> return?",
          options: [
            "18 — the number of bytes in the UTF-8 encoding",
            "6 — the number of characters",
            "4 — the number of visible letters",
            "Compile error"
          ],
          answer: 0,
          why: "<code>len()</code> on a Rust string is always <strong>bytes</strong>. Use <code>.chars().count()</code> for Unicode scalar values, or the <code>unicode-segmentation</code> crate for what a human would call letters. The three answers differ, so Rust makes you pick one."
        },
        {
          t: "swipe",
          statement: "<code>&amp;my_string[0..3]</code> is always safe.",
          answer: false,
          why: "Slicing uses <strong>byte</strong> indices and <strong>panics</strong> if the boundary lands in the middle of a multi-byte character. It's safe (no memory corruption, ever) but it can crash. Prefer <code>.chars()</code>, or check with <code>is_char_boundary()</code>."
        },
        {
          t: "summary",
          title: "Strings",
          points: [
            "<code>String</code> = owned, growable, heap. <code>&amp;str</code> = borrowed view. Own a String, pass a <code>&amp;str</code>.",
            "Build with <code>push_str</code>, <code>push</code>, <code>+</code>, or (best) <code>format!</code>.",
            "<strong>No integer indexing</strong> — UTF-8 makes “the nth character” genuinely ambiguous.",
            "<code>.len()</code> is bytes; <code>.chars()</code> is scalar values; graphemes need a crate.",
            "Slicing uses byte offsets and panics on a non-boundary."
          ]
        }
      ]
    },
    {
      id: "8.3",
      title: "Key-value pairs in hash maps",
      est: "8 min",
      tags: ["hashmap","entry","insert","get","ownership","hash"],
      cards: [
        {
          t: "concept",
          kicker: "Dictionaries",
          title: "HashMap<K, V> — not in the prelude",
          codeFirst: true,
          code: { src:
`use std::collections::HashMap;   // must import it

let mut scores = HashMap::new();
scores.insert(String::from("Blue"), 10);
scores.insert(String::from("Yellow"), 50);

// get returns Option<&V>
let team = String::from("Blue");
let score: Option<&i32> = scores.get(&team);
let score: i32 = scores.get(&team).copied().unwrap_or(0);

for (key, value) in &scores {
    println!("{key}: {value}");      // order is NOT guaranteed
}

scores.insert(String::from("Blue"), 25);   // overwrites` },
          body: [
            "<code>HashMap</code> isn't in the prelude, so you always import it. Iteration order is arbitrary by design — Rust's default hasher is randomly seeded to protect against hash-collision denial-of-service attacks. Use <code>BTreeMap</code> if you need sorted keys."
          ]
        },
        {
          t: "concept",
          kicker: "The idiom to learn",
          title: "entry() — insert only if absent, or update in place",
          code: { src:
`use std::collections::HashMap;

let mut scores = HashMap::new();
scores.insert(String::from("Blue"), 10);

// Insert only if the key isn't there
scores.entry(String::from("Yellow")).or_insert(50);   // added
scores.entry(String::from("Blue")).or_insert(50);     // Blue stays 10

// The classic word counter — update based on the old value
let text = "hello world wonderful world";
let mut counts = HashMap::new();
for word in text.split_whitespace() {
    let count = counts.entry(word).or_insert(0);
    *count += 1;                 // or_insert returns &mut V, so deref to write
}
println!("{counts:?}");   // {"hello": 1, "world": 2, "wonderful": 1}

// Other handy forms
counts.entry("x").or_default();
counts.entry("y").or_insert_with(|| expensive_default());
counts.entry("z").and_modify(|c| *c += 1).or_insert(1);` },
          body: [
            "<code>entry()</code> does one hash lookup where the naive “check then insert” does two — and it's impossible to write the race-prone version by accident."
          ],
          compare: {
            note: "Every language has this pattern; Rust's <code>entry</code> API is unusually explicit about doing only one lookup.",
            langs: {
              python: `counts = {}
for word in text.split():
    counts[word] = counts.get(word, 0) + 1
# or: collections.Counter(text.split())`,
              java: `Map<String,Integer> counts = new HashMap<>();
for (String w : text.split(" "))
    counts.merge(w, 1, Integer::sum);`,
              go: `counts := map[string]int{}
for _, w := range strings.Fields(text) {
    counts[w]++      // Go auto-initialises to the zero value
}`,
              cpp: `std::unordered_map<std::string,int> counts;
for (auto& w : words) counts[w]++;   // operator[] default-constructs`
            }
          }
        },
        {
          t: "concept",
          kicker: "Watch out",
          title: "Inserting moves ownership",
          code: { src:
`use std::collections::HashMap;

let field_name = String::from("Favorite color");
let field_value = String::from("Blue");

let mut map = HashMap::new();
map.insert(field_name, field_value);   // both MOVED into the map

// println!("{field_name}");   ❌ moved

// If you need to keep them, clone or store references:
let key = String::from("k");
map.insert(key.clone(), 1);
println!("{key}");             // ✅` },
          note: { html: "For <code>Copy</code> types like <code>i32</code>, values are copied in and the original stays usable. For owned types like <code>String</code>, they move — the ownership rules apply everywhere, uniformly." }
        },
        {
          t: "quiz",
          q: "What's the idiomatic way to increment a counter in a HashMap?",
          options: [
            "<code>*map.entry(key).or_insert(0) += 1;</code>",
            "<code>map[key] += 1;</code>",
            "<code>map.insert(key, map.get(key) + 1);</code>",
            "<code>map.increment(key);</code>"
          ],
          answer: 0,
          why: "<code>entry(key).or_insert(0)</code> returns a <code>&amp;mut V</code> — either to the existing value or to the freshly inserted zero — and <code>*... += 1</code> writes through it. One hash lookup, no <code>Option</code> juggling. (<code>map[key] += 1</code> doesn't work: <code>HashMap</code>'s <code>Index</code> is read-only.)"
        },
        {
          t: "swipe",
          statement: "Iterating a <code>HashMap</code> gives you keys in insertion order.",
          answer: false,
          why: "The order is <strong>arbitrary and may change between runs</strong> — Rust seeds its hasher randomly to defend against algorithmic-complexity attacks. Need order? Use <code>BTreeMap</code> (sorted by key) or sort the pairs yourself. Python's dicts keep insertion order; Rust's don't."
        },
        {
          t: "order",
          prompt: "Order these by cost, cheapest first",
          pieces: ["map.get(&k)", "map.entry(k).or_insert(0)", "map.insert(k.clone(), v)"],
          answer: [0,1,2],
          why: "<code>get</code> is one lookup, no mutation. <code>entry</code> is one lookup that may write. <code>insert</code> with a <code>clone()</code> also allocates and copies the key's heap data. Rust makes the expensive step (<code>clone</code>) visible in the source."
        },
        {
          t: "summary",
          title: "Chapter 8 complete 🎉",
          points: [
            "<code>HashMap&lt;K, V&gt;</code> needs <code>use std::collections::HashMap;</code>.",
            "<code>get</code> returns <code>Option&lt;&amp;V&gt;</code>; <code>insert</code> overwrites and <strong>takes ownership</strong>.",
            "<code>entry(k).or_insert(v)</code> is the idiom for insert-if-absent and update-in-place.",
            "Iteration order is random by design; use <code>BTreeMap</code> for sorted keys.",
            "<code>Vec</code>, <code>String</code> and <code>HashMap</code> cover the overwhelming majority of everyday data needs."
          ]
        }
      ]
    }
  ]
};
