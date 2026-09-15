export default {
  id: 1,
  title: "Getting Started",
  emoji: "🚀",
  blurb: "Install Rust, write Hello World, meet Cargo",
  intro: "Install the toolchain, print your first line, and meet Cargo — the tool you'll use every single day.",
  lessons: [
    {
      id: "1.1",
      title: "Installation",
      est: "4 min",
      tags: ["install","rustup","cargo","toolchain"],
      cards: [
        {
          t: "concept",
          kicker: "Setup",
          title: "One command installs everything",
          body: [
            "Rust is installed with <code>rustup</code>, a version manager that hands you the compiler (<code>rustc</code>), the build tool (<code>cargo</code>), and the docs — all at once.",
            "On macOS or Linux, paste this into a terminal. On Windows, download the installer from <em>rustup.rs</em> (you'll also need the Visual Studio C++ build tools)."
          ],
          code: { lang: "text", label: "Terminal", src:
`curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh` },
          after: ["Then restart your terminal and check it worked:"],
          out:
`$ rustc --version
rustc 1.90.0 (1159e78c4 2025-09-14)

$ cargo --version
cargo 1.90.0 (840b83a10 2025-07-30)`,
          compare: {
            note: "One toolchain, one version manager, one build tool — for everyone. That uniformity is a genuine feature.",
            langs: {
              python: { src:
`# pyenv? conda? venv? uv? poetry? homebrew python?
# ...pick your adventure, then fight PATH`, note: "Python's ecosystem has many competing tools for this job." },
              java: { src:
`# Install a JDK (which vendor? which version?)
# Then pick Maven or Gradle for builds` , note: "Toolchain and build tool are separate decisions in Java." },
              go: { src:
`# Install Go, and you are done.
go version`, note: "Go is the closest match — batteries included, one way to do it." },
              c: { src:
`# gcc? clang? msvc?
# make? cmake? autotools? meson? ninja?`, note: "C has no standard build tool at all. This is why C projects are hard to build." }
            }
          }
        },
        {
          t: "quiz",
          q: "Which tool do you use to <em>update</em> your Rust version later?",
          options: [
            "<code>rustup update</code>",
            "<code>cargo upgrade</code>",
            "<code>rustc --update</code>",
            "Reinstall from the website each time"
          ],
          answer: 0,
          why: "<code>rustup</code> manages toolchain versions: <code>rustup update</code> pulls the latest stable. It can also install <code>nightly</code> or pin an old version per project. <code>cargo</code> manages your <em>project</em>; <code>rustup</code> manages your <em>Rust</em>."
        },
        {
          t: "swipe",
          statement: "You need an IDE or special editor to write Rust.",
          answer: false,
          why: "Any text editor works. That said, <strong>rust-analyzer</strong> (the official language server, available for VS Code, Neovim, JetBrains, Zed, Helix) gives you inline types and error messages as you type — with Rust's strict compiler, that feedback loop is worth a lot."
        },
        {
          t: "summary",
          title: "Installed",
          points: [
            "<code>rustup</code> installs and updates the toolchain; <code>cargo</code> builds your projects.",
            "<code>rustup update</code> upgrades Rust; <code>rustup doc</code> opens the full docs <em>offline</em>.",
            "Install <strong>rust-analyzer</strong> in your editor — it makes learning dramatically faster.",
            "Rust releases a new stable version every 6 weeks, and it never breaks your old code."
          ]
        }
      ]
    },
    {
      id: "1.2",
      title: "Hello, World!",
      est: "4 min",
      tags: ["hello world","main","println","macro"],
      cards: [
        {
          t: "concept",
          kicker: "Your first program",
          title: "Four lines, and three things to notice",
          codeFirst: true,
          code: { label: "main.rs", src:
`fn main() {
    println!("Hello, world!");
}` },
          body: [
            "<strong>1.</strong> <code>fn main()</code> is the entry point of every executable Rust program — it always runs first, and it takes no arguments here.",
            "<strong>2.</strong> <code>println!</code> ends with a <code>!</code>, which means it's a <em>macro</em>, not a function. Macros are code that writes code at compile time; this one type-checks your format string before the program even runs.",
            "<strong>3.</strong> Statements end in a semicolon, and Rust indents with <strong>four spaces</strong>. Don't sweat formatting — <code>rustfmt</code> does it for you."
          ],
          note: { html: "Compile and run it directly with <code>rustc main.rs</code> then <code>./main</code> — though from the next lesson on you'll use Cargo instead." },
          compare: {
            note: "Rust's <code>main</code> will feel familiar if you've written C, Java or Go. The <code>!</code> on <code>println!</code> is the one genuinely new thing.",
            langs: {
              python: { src:
`print("Hello, world!")`, note: "No main needed — the file itself is the program." },
              c: { src:
`#include <stdio.h>

int main(void) {
    printf("Hello, world!\\n");
    return 0;
}`, note: "Rust needs no include and no explicit return 0, and adds the newline for you." },
              cpp: { src:
`#include <iostream>

int main() {
    std::cout << "Hello, world!" << std::endl;
}` },
              go: { src:
`package main

import "fmt"

func main() {
    fmt.Println("Hello, world!")
}` },
              java: { src:
`public class Main {
    public static void main(String[] args) {
        System.out.println("Hello, world!");
    }
}`, note: "Java needs a class wrapper; Rust functions live freely at the top level." }
            }
          }
        },
        {
          t: "quiz",
          q: "What does the <code>!</code> in <code>println!</code> mean?",
          options: [
            "It's a macro, not a function",
            "It means the call can never fail",
            "It's how Rust marks output functions",
            "It negates the result"
          ],
          answer: 0,
          why: "<code>!</code> always marks a <strong>macro invocation</strong>. Macros can do things functions can't — like accepting a variable number of arguments and checking your format string at compile time. <code>vec!</code>, <code>format!</code> and <code>panic!</code> are other macros you'll meet soon."
        },
        {
          t: "concept",
          kicker: "Formatting",
          title: "Printing values",
          body: [
            "Curly braces are placeholders. You can name the variable inline, or pass arguments positionally."
          ],
          code: { src:
`fn main() {
    let name = "Ferris";
    let legs = 10;

    println!("{name} has {legs} legs");        // inline (preferred)
    println!("{} has {} legs", name, legs);    // positional
    println!("{0} {0} {1}", name, legs);       // reuse by index
    println!("{legs:>5}|");                    // width 5, right-aligned
    println!("{:.3}", 3.14159_f64);            // 3 decimal places
    println!("{:?}", (1, "two", 3.0));         // debug formatting
}` },
          out:
`Ferris has 10 legs
Ferris has 10 legs
Ferris Ferris 10
   10|
3.142
(1, "two", 3.0)`,
          compare: {
            langs: {
              python: `print(f"{name} has {legs} legs")
print(f"{legs:>5}|")
print(f"{3.14159:.3f}")`,
              java: `System.out.printf("%s has %d legs%n", name, legs);
System.out.println(STR."\\{name} has \\{legs} legs"); // newer Java`,
              go: `fmt.Printf("%s has %d legs\\n", name, legs)
fmt.Printf("%5d|\\n", legs)`,
              c: `printf("%s has %d legs\\n", name, legs);
printf("%5d|\\n", legs);`
            },
            note: "Like Python f-strings — but checked at <strong>compile time</strong>. A mismatched placeholder is a build error, not a runtime surprise."
          }
        },
        {
          t: "order",
          prompt: "Assemble a program that prints a greeting",
          pieces: ['fn main() {', 'let who = "Rustacean";', 'println!("Hi, {who}!");', '}'],
          answer: [0,1,2,3],
          why: "Declare <code>main</code>, bind the variable, print it, close the block. Rust runs statements top to bottom, just like the languages you already know."
        },
        {
          t: "summary",
          title: "Hello, world — done",
          points: [
            "<code>fn main()</code> is where every Rust program begins.",
            "<code>println!</code> is a <strong>macro</strong> (the <code>!</code> gives it away) and checks your format string at compile time.",
            "<code>{}</code> is a placeholder; <code>{name}</code> captures a variable directly; <code>{:?}</code> prints debug output.",
            "Four-space indentation, semicolons at the end of statements — and <code>cargo fmt</code> handles the rest."
          ]
        }
      ]
    },
    {
      id: "1.3",
      title: "Hello, Cargo!",
      est: "5 min",
      tags: ["cargo","crates","build","toml","package manager"],
      cards: [
        {
          t: "concept",
          kicker: "The tool you'll live in",
          title: "Cargo is build tool + package manager + test runner + doc generator",
          body: [
            "Almost nobody calls <code>rustc</code> directly. You use <strong>Cargo</strong>, which comes with Rust and handles building, dependencies, testing, benchmarks and documentation with one consistent set of commands."
          ],
          code: { lang: "text", label: "Terminal", src:
`cargo new hello_cargo     # create a project
cd hello_cargo
cargo run                  # build and run it
cargo build                # just build (debug, fast to compile)
cargo build --release      # optimised build (slow to compile, fast to run)
cargo check                # type-check only — much faster, use it constantly
cargo test                 # run all tests
cargo fmt                  # auto-format the code
cargo clippy               # lint: catches mistakes and unidiomatic code
cargo doc --open           # build and open docs for your project + deps` },
          note: { html: "<b>Tip:</b> <code>cargo check</code> is the command you'll run most while learning. It answers “does this compile?” in a fraction of the time of a full build." }
        },
        {
          t: "concept",
          kicker: "Project layout",
          title: "Every Cargo project looks the same",
          code: { lang: "text", label: "Directory tree", src:
`hello_cargo/
├── Cargo.toml       # project metadata + dependencies
├── Cargo.lock       # exact versions used (commit this for apps)
└── src/
    └── main.rs      # entry point for a binary` },
          after: ["<code>Cargo.toml</code> is where you declare what your project is and what it depends on:"],
          note: { html: "Adding a dependency is one command: <code>cargo add serde</code>. Cargo edits <code>Cargo.toml</code> and fetches it from <em>crates.io</em>, the community package registry." },
          compare: {
            note: "A <strong>crate</strong> is Rust's word for a package/library. The registry is <em>crates.io</em>.",
            langs: {
              rust: `[package]
name = "hello_cargo"
version = "0.1.0"
edition = "2024"

[dependencies]
rand = "0.8"`,
              python: { src:
`# pyproject.toml
[project]
name = "hello"
dependencies = ["requests"]`, note: "pip / uv / poetry ≈ cargo; PyPI ≈ crates.io." },
              java: { src:
`<!-- pom.xml -->
<dependency>
  <groupId>com.google.guava</groupId>
  <artifactId>guava</artifactId>
</dependency>`, note: "Maven/Gradle ≈ cargo; Maven Central ≈ crates.io." },
              go: { src:
`// go.mod
module hello
go 1.22
require github.com/google/uuid v1.6.0`, note: "go.mod ≈ Cargo.toml; Go pulls straight from git URLs." },
              js: { src:
`// package.json
{ "dependencies": { "lodash": "^4.17.21" } }`, note: "npm ≈ cargo; npmjs.com ≈ crates.io." }
            }
          }
        },
        {
          t: "quiz",
          q: "You changed some code and just want to know whether it compiles, as fast as possible. Which command?",
          options: [
            "<code>cargo check</code>",
            "<code>cargo build --release</code>",
            "<code>cargo run</code>",
            "<code>rustc src/main.rs</code>"
          ],
          answer: 0,
          why: "<code>cargo check</code> runs the full type- and borrow-check but skips generating machine code — often <strong>3–5× faster</strong> than a build. It's the tightest possible feedback loop while you're learning."
        },
        {
          t: "swipe",
          statement: "<code>cargo build --release</code> should be your default while developing.",
          answer: false,
          why: "Release builds turn on heavy optimisation, which makes compiling much slower. Use the default debug profile while developing (it also keeps overflow checks and useful panic messages on), and <code>--release</code> only when you ship or benchmark."
        },
        {
          t: "summary",
          title: "Chapter 1 complete 🎉",
          points: [
            "<code>rustup</code> manages Rust itself; <strong>Cargo</strong> manages your projects.",
            "<code>cargo new</code>, <code>cargo run</code>, <code>cargo check</code>, <code>cargo test</code>, <code>cargo fmt</code>, <code>cargo clippy</code> — that's 90% of daily use.",
            "<code>Cargo.toml</code> declares dependencies; <code>Cargo.lock</code> pins exact versions.",
            "Libraries are called <strong>crates</strong> and live on <em>crates.io</em>. Add one with <code>cargo add &lt;name&gt;</code>."
          ]
        }
      ]
    }
  ]
};
