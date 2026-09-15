export default {
  id: 7,
  title: "Managing Growing Projects",
  emoji: "📦",
  blurb: "Packages, crates, modules, paths and use",
  intro: "How Rust code is organised once a project outgrows one file: packages contain crates, crates contain modules, and <code>use</code> ties it together.",
  lessons: [
    {
      id: "7.1",
      title: "Packages and crates",
      est: "5 min",
      tags: ["package","crate","binary","library","cargo"],
      cards: [
        {
          t: "concept",
          kicker: "Vocabulary",
          title: "Package → crate → module → item",
          list: [
            "<strong>Crate</strong> — the smallest unit the compiler sees. Either a <em>binary</em> (has <code>main</code>, becomes an executable) or a <em>library</em> (no <code>main</code>, meant to be used by others).",
            "<strong>Package</strong> — one <code>Cargo.toml</code>. May contain <strong>one</strong> library crate and <strong>any number</strong> of binary crates.",
            "<strong>Module</strong> — a namespace inside a crate. Controls what's public and what's private.",
            "<strong>Path</strong> — how you name an item, like <code>std::collections::HashMap</code>."
          ],
          code: { lang: "text", label: "Cargo's conventions", src:
`my_package/
├── Cargo.toml
├── src/
│   ├── main.rs         -> binary crate, named after the package
│   ├── lib.rs          -> library crate, named after the package
│   └── bin/
│       ├── tool_a.rs   -> an extra binary crate
│       └── tool_b.rs   -> another one
├── tests/              -> integration tests (each file is its own crate)
├── benches/            -> benchmarks
└── examples/           -> example programs` },
          note: { html: "A common pattern: put all the real logic in <code>src/lib.rs</code>, and make <code>src/main.rs</code> a thin wrapper that calls it. That way the logic is testable and reusable. Chapter 12 builds a project exactly this way." },
          compare: {
            note: "Rust's compilation unit is the <strong>crate</strong>, not the file. That's why the compiler can optimise aggressively across your whole library.",
            langs: {
              java: `// package = directory, compilation unit = one .java file
// jar ≈ crate`,
              python: `# module = one .py file, package = directory with __init__.py`,
              go: `// package = directory, module = go.mod (≈ Rust package)`,
              c: `// compilation unit = one .c file; linking is a separate manual step`
            }
          }
        },
        {
          t: "quiz",
          q: "How many <em>library</em> crates can one package contain?",
          options: ["At most one", "Exactly one, always required", "As many as you like", "None — libraries need their own package"],
          answer: 0,
          why: "A package may have <strong>zero or one</strong> library crate (<code>src/lib.rs</code>) and <strong>any number</strong> of binary crates (<code>src/main.rs</code> plus everything in <code>src/bin/</code>). Need several libraries? Use a <em>workspace</em> of several packages."
        },
        {
          t: "summary",
          title: "Packages & crates",
          points: [
            "<strong>Crate</strong> = compilation unit (binary or library).",
            "<strong>Package</strong> = one <code>Cargo.toml</code>; up to one library, many binaries.",
            "<code>src/lib.rs</code> and <code>src/main.rs</code> are the two crate roots Cargo looks for.",
            "Put the logic in the library, keep the binary thin — it makes testing far easier."
          ]
        }
      ]
    },
    {
      id: "7.2",
      title: "Modules, privacy and paths",
      est: "9 min",
      tags: ["mod","pub","private","path","super","self","crate"],
      cards: [
        {
          t: "concept",
          kicker: "Namespaces",
          title: "mod creates a module; everything starts private",
          codeFirst: true,
          code: { label: "src/lib.rs", src:
`mod front_of_house {
    pub mod hosting {
        pub fn add_to_waitlist() {}
        fn seat_at_table() {}          // private to hosting
    }

    mod serving {                      // private to front_of_house
        fn take_order() {}
    }
}

pub fn eat_at_restaurant() {
    // Absolute path — starts from the crate root
    crate::front_of_house::hosting::add_to_waitlist();

    // Relative path — starts from here
    front_of_house::hosting::add_to_waitlist();
}` },
          body: [
            "<strong>Everything is private by default</strong>, including modules, functions, structs, enums and fields. <code>pub</code> opts an item into being visible to the parent module.",
            "Note the asymmetry: a child module can always see its ancestors' private items, but a parent cannot see into a child's private items. Details stay hidden; context stays available."
          ],
          note: { warn: true, html: "Making a module <code>pub</code> doesn't make its contents public. You need <code>pub</code> on <b>each item</b> you want exposed — that's why <code>hosting</code> and <code>add_to_waitlist</code> both have it." }
        },
        {
          t: "concept",
          kicker: "Navigating",
          title: "super, self, and pub on struct fields",
          code: { src:
`fn deliver_order() {}

mod back_of_house {
    fn fix_incorrect_order() {
        cook_order();               // same module
        super::deliver_order();     // go up one level — like ".." in a path
    }
    fn cook_order() {}

    pub struct Breakfast {
        pub toast: String,          // public field
        seasonal_fruit: String,     // PRIVATE field, even though the struct is pub
    }

    impl Breakfast {
        // Because a field is private, outside code can't build one directly —
        // so we must provide a constructor.
        pub fn summer(toast: &str) -> Breakfast {
            Breakfast {
                toast: String::from(toast),
                seasonal_fruit: String::from("peaches"),
            }
        }
    }

    pub enum Appetizer {   // for enums, pub makes ALL variants public
        Soup,
        Salad,
    }
}

pub fn order() {
    let mut meal = back_of_house::Breakfast::summer("Rye");
    meal.toast = String::from("Wheat");     // ✅ public field
    // meal.seasonal_fruit = ...;           // ❌ private field
}` },
          note: { html: "Structs need <code>pub</code> per field; <strong>enums are all-or-nothing</strong> — <code>pub enum</code> makes every variant public. That's because an enum's variants are its whole point, while a struct's fields are often internal detail." },
          compare: {
            note: "Rust's default is the strictest: <em>private unless stated otherwise</em>, with no way to reach in from outside.",
            langs: {
              java: `public / protected / package-private / private
// four levels, default is package-private`,
              python: `# convention only: _name means "please don't", __name mangles the name
# nothing is actually enforced`,
              go: `// Capitalised = exported, lowercase = package-private.
// Just two levels, decided by the first letter.`,
              cpp: `public: / protected: / private:
// plus 'friend' to poke holes`
            }
          }
        },
        {
          t: "concept",
          kicker: "Splitting files",
          title: "One module per file",
          code: { lang: "text", label: "Modern layout (Rust 2018+)", src:
`src/
├── lib.rs                   contains: mod front_of_house;
├── front_of_house.rs        contains: pub mod hosting;
└── front_of_house/
    └── hosting.rs           contains: pub fn add_to_waitlist() {}` },
          body: [
            "<code>mod front_of_house;</code> (with a semicolon, no body) tells the compiler: <em>“load this module's contents from another file.”</em> Cargo looks for <code>front_of_house.rs</code>, or <code>front_of_house/mod.rs</code> in the older style.",
            "Important: <code>mod</code> is <strong>not an import</strong>. It <em>declares</em> that a module exists and is part of your crate. <code>use</code> is what imports names."
          ],
          note: { warn: true, html: "This trips up almost everyone coming from Python or JavaScript: creating a new <code>.rs</code> file does <b>nothing</b> until some parent module declares it with <code>mod</code>." }
        },
        {
          t: "quiz",
          q: "You add <code>src/utils.rs</code> but <code>utils::helper()</code> won't resolve. What's missing?",
          options: [
            "<code>mod utils;</code> in <code>lib.rs</code> or <code>main.rs</code>",
            "<code>use utils;</code> at the top of the file",
            "A <code>[modules]</code> entry in <code>Cargo.toml</code>",
            "The file must be named <code>mod.rs</code>"
          ],
          answer: 0,
          why: "Files aren't picked up automatically. <code>mod utils;</code> declares the module and pulls the file into the crate's tree. Then <code>use</code> (or a full path) lets you name things inside it — and <code>helper</code> itself needs to be <code>pub</code>."
        },
        {
          t: "swipe",
          statement: "Marking a module <code>pub</code> automatically makes everything inside it public.",
          answer: false,
          why: "<code>pub mod hosting</code> only means <em>“you may look at this module”</em>. Each function, struct and field inside still needs its own <code>pub</code>. The one exception is enums: <code>pub enum</code> exposes all variants."
        },
        {
          t: "summary",
          title: "Modules & privacy",
          points: [
            "<strong>Private by default.</strong> <code>pub</code> exposes one item to the parent module.",
            "Paths: <code>crate::</code> (absolute), <code>super::</code> (parent), <code>self::</code> (current).",
            "Struct fields are public individually; <code>pub enum</code> exposes every variant.",
            "<code>mod name;</code> loads <code>name.rs</code> — a new file does nothing until it's declared.",
            "Children can see ancestors' privates; parents cannot see into children."
          ]
        }
      ]
    },
    {
      id: "7.3",
      title: "Bringing paths into scope with use",
      est: "6 min",
      tags: ["use","import","as","pub use","glob","re-export"],
      cards: [
        {
          t: "concept",
          kicker: "Imports",
          title: "use makes a long path short",
          code: { src:
`use std::collections::HashMap;
use crate::front_of_house::hosting;      // bring in the MODULE, not the function

fn main() {
    let mut map = HashMap::new();        // instead of std::collections::HashMap::new()
    hosting::add_to_waitlist();          // reads clearly: it's not local
}

// Idiomatic style:
//   for FUNCTIONS  -> import the parent module, call hosting::add_to_waitlist()
//   for TYPES      -> import the type itself, use HashMap directly` },
          body: [
            "Why the difference? Seeing <code>hosting::add_to_waitlist()</code> tells you instantly the function isn't defined locally. For types, <code>HashMap</code> alone is unambiguous and repeating the path adds nothing."
          ]
        },
        {
          t: "concept",
          kicker: "The other forms",
          title: "as, nested paths, glob, and re-exports",
          code: { src:
`// Rename on import — essential when names collide
use std::fmt::Result;
use std::io::Result as IoResult;

// Nested paths — one line instead of four
use std::{cmp::Ordering, io};
use std::io::{self, Write};       // imports both std::io and std::io::Write

// Glob — pulls in everything. Use sparingly; it hides where names came from.
use std::collections::*;          // mostly for tests and preludes

// Re-export: import AND make it available to YOUR users under your path
pub use crate::front_of_house::hosting;
// now other crates can write my_crate::hosting::add_to_waitlist()` },
          body: [
            "<code>pub use</code> is how libraries present a clean public API that doesn't leak their internal folder structure. Your modules can be deeply nested for your own sanity while users see a flat, tidy surface."
          ],
          note: { html: "Rust automatically imports a small <strong>prelude</strong> into every file — <code>Option</code>, <code>Result</code>, <code>String</code>, <code>Vec</code>, <code>println!</code> and friends. That's why you never <code>use</code> those." },
          compare: {
            note: "The distinctive part is <code>pub use</code>: your import <em>becomes</em> part of your public API.",
            langs: {
              python: `from collections import defaultdict
import numpy as np                 # ≈ use ... as ...
from module import *               # ≈ glob import`,
              java: `import java.util.HashMap;
import java.util.*;                // glob
// no renaming, and no re-export`,
              go: `import (
    "fmt"
    m "math/rand"     // ≈ use ... as ...
)`,
              js: `import { HashMap } from "./collections.js";
import * as utils from "./utils.js";
export { thing } from "./inner.js";   // ≈ pub use`
            }
          }
        },
        {
          t: "quiz",
          q: "What does <code>pub use crate::deep::nested::Thing;</code> accomplish?",
          options: [
            "Re-exports <code>Thing</code> so users of your crate can reach it via a short path",
            "Makes <code>Thing</code> mutable across modules",
            "Imports it for the whole crate at once",
            "Nothing that plain <code>use</code> doesn't already do"
          ],
          answer: 0,
          why: "It's a <strong>re-export</strong>. Your internal layout can be as deep as you like, while users write <code>my_crate::Thing</code>. Most well-designed crates re-export their key types at the root for exactly this reason."
        },
        {
          t: "swipe",
          statement: "Glob imports (<code>use foo::*;</code>) are the recommended default in Rust.",
          answer: false,
          why: "They're discouraged in normal code because you can no longer tell where a name came from — which also makes upgrades riskier. The accepted uses are inside <code>#[cfg(test)]</code> modules (<code>use super::*;</code>) and when importing a crate's designated prelude."
        },
        {
          t: "summary",
          title: "Chapter 7 complete 🎉",
          points: [
            "<code>use</code> shortens paths: import <strong>modules</strong> for functions, <strong>types</strong> directly.",
            "<code>as</code> renames; <code>{}</code> nests; <code>*</code> globs (sparingly).",
            "<code>pub use</code> re-exports, letting you design a clean public API.",
            "<code>mod</code> declares what your crate contains; <code>use</code> only shortens names.",
            "The prelude gives you <code>Option</code>, <code>Result</code>, <code>Vec</code>, <code>String</code> and more for free."
          ]
        }
      ]
    }
  ]
};
