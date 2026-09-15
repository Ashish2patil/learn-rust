export default {
  id: 14,
  title: "More About Cargo and Crates.io",
  emoji: "🚢",
  blurb: "Release profiles, publishing, workspaces, cargo install",
  intro: "Cargo beyond <code>build</code> and <code>run</code>: tuning release builds, documenting and publishing a crate, and organising multi-crate projects.",
  lessons: [
    {
      id: "14.1",
      title: "Release profiles and documentation",
      est: "6 min",
      tags: ["profile","opt-level","docs","publish","doc comment"],
      cards: [
        {
          t: "concept",
          kicker: "Build profiles",
          title: "dev and release, tunable",
          code: { lang: "toml", label: "Cargo.toml", src:
`[profile.dev]
opt-level = 0        # no optimisation -> fast compiles, slow binary

[profile.release]
opt-level = 3        # full optimisation -> slow compiles, fast binary
lto = true           # link-time optimisation: smaller and faster
codegen-units = 1    # less parallelism, better optimisation
strip = true         # drop symbols, much smaller binary
panic = "abort"      # no unwinding machinery

# Common trick: optimise dependencies even in debug builds,
# so your own code still compiles fast but libraries run at speed.
[profile.dev.package."*"]
opt-level = 3` },
          body: [
            "<code>cargo build</code> uses <code>dev</code>; <code>cargo build --release</code> uses <code>release</code>. The defaults are sensible — you only tune when you have a measured reason."
          ],
          note: { html: "A debug build can easily be <b>10–50× slower</b> than a release build. Always benchmark with <code>--release</code>, or you'll draw completely wrong conclusions." }
        },
        {
          t: "concept",
          kicker: "Documentation",
          title: "Doc comments, and the sections readers expect",
          code: { src:
`/// Adds one to the number given.
///
/// # Examples
///
/// \`\`\`
/// let answer = my_crate::add_one(5);
/// assert_eq!(6, answer);
/// \`\`\`
///
/// # Panics
///
/// Panics if the value is \`i32::MAX\`.
///
/// # Errors
///
/// Returns \`Err\` if the input is negative.
///
/// # Safety
///
/// (For \`unsafe\` functions: what the caller must guarantee.)
pub fn add_one(x: i32) -> i32 { x + 1 }` },
          list: [
            "<code># Examples</code> — runnable code, tested by <code>cargo test</code>",
            "<code># Panics</code> — the conditions under which this will panic",
            "<code># Errors</code> — what the <code>Err</code> variants mean",
            "<code># Safety</code> — the invariants a caller of an <code>unsafe</code> function must uphold"
          ],
          note: { html: "<code>cargo doc --open</code> builds documentation for your crate <b>and every dependency</b>, and opens it locally. It works offline — invaluable on a plane or a locked-down network." }
        },
        {
          t: "quiz",
          q: "Why should you benchmark with <code>--release</code>?",
          options: [
            "Debug builds skip optimisation and add runtime checks — often 10× or more slower",
            "Debug builds don't run tests",
            "Release builds use a different allocator",
            "It doesn't matter which you use"
          ],
          answer: 0,
          why: "Debug builds keep overflow checks, skip inlining and don't optimise. Benchmarking them tells you almost nothing about production performance — a classic way to “discover” that Rust is slow."
        },
        {
          t: "summary",
          title: "Profiles & docs",
          points: [
            "<code>[profile.dev]</code> and <code>[profile.release]</code> tune optimisation, LTO and stripping.",
            "Always measure performance with <code>--release</code>.",
            "<code>///</code> doc comments support Markdown and conventional sections.",
            "<code>cargo doc --open</code> gives you offline docs for your whole dependency tree."
          ]
        }
      ]
    },
    {
      id: "14.2",
      title: "Publishing to crates.io",
      est: "5 min",
      tags: ["publish","crates.io","version","semver","yank","license"],
      cards: [
        {
          t: "concept",
          kicker: "Sharing",
          title: "Publishing is four commands",
          code: { lang: "text", label: "Terminal", src:
`cargo login <your-api-token>    # get one from crates.io/me
cargo package                   # build the .crate archive locally
cargo publish --dry-run         # check everything without uploading
cargo publish                   # upload — PERMANENT` },
          code2: { lang: "toml", label: "Required metadata", src:
`[package]
name = "my_unique_crate_name"       # must be globally unique
version = "0.1.0"
edition = "2024"
description = "A short, clear sentence."
license = "MIT OR Apache-2.0"       # the Rust ecosystem convention
repository = "https://github.com/you/my_crate"
keywords = ["cli", "parser"]
categories = ["command-line-utilities"]` },
          note: { warn: true, html: "<b>Publishing is permanent.</b> A version can never be deleted or overwritten, because other people's builds depend on it. <code>cargo yank --version 1.0.1</code> stops <em>new</em> projects depending on it, while existing <code>Cargo.lock</code> files keep working." },
          compare: {
            note: "Crates.io's immutability is a deliberate response to npm's <em>left-pad</em> incident, when an unpublished package broke builds worldwide.",
            langs: {
              python: `python -m build && twine upload dist/*   # PyPI allows deletion`,
              js: `npm publish                              # unpublish allowed within 72h`,
              java: `mvn deploy                               # Maven Central is also immutable`,
              go: `git tag v1.0.0 && git push --tags        # no registry at all — modules come from git`
            }
          }
        },
        {
          t: "concept",
          kicker: "Versioning",
          title: "Semantic versioning, enforced by convention",
          code: { lang: "text", label: "MAJOR.MINOR.PATCH", src:
`1.2.3
│ │ └── PATCH: bug fixes, no API change
│ └──── MINOR: new features, backwards compatible
└────── MAJOR: breaking changes

In Cargo.toml, "0.8.5" means >=0.8.5, <0.9.0
                "1.2"   means >=1.2.0, <2.0.0
Pre-1.0, the MINOR position acts as the breaking-change slot.` },
          body: [
            "Cargo can have <strong>multiple major versions of the same crate</strong> in one dependency graph — <code>rand 0.7</code> and <code>rand 0.8</code> can coexist. That quietly eliminates the dependency-hell that plagues other ecosystems."
          ]
        },
        {
          t: "quiz",
          q: "You published <code>1.0.1</code> with a serious bug. What do you do?",
          options: [
            "<code>cargo yank --version 1.0.1</code> and publish a fixed <code>1.0.2</code>",
            "<code>cargo delete --version 1.0.1</code>",
            "Republish <code>1.0.1</code> with the fix",
            "Contact crates.io support to remove it"
          ],
          answer: 0,
          why: "Versions are <strong>immutable and permanent</strong>. <code>yank</code> prevents new dependents from selecting that version while keeping existing locked builds reproducible. Then publish the fix as a new patch version."
        },
        {
          t: "summary",
          title: "Publishing",
          points: [
            "<code>cargo login</code>, <code>cargo publish --dry-run</code>, then <code>cargo publish</code>.",
            "Required metadata: description, license, repository — plus keywords and categories for discoverability.",
            "Published versions are <strong>permanent</strong>; <code>cargo yank</code> discourages new use.",
            "SemVer, and Cargo can resolve multiple major versions of the same crate simultaneously."
          ]
        }
      ]
    },
    {
      id: "14.3",
      title: "Workspaces and cargo install",
      est: "5 min",
      tags: ["workspace","monorepo","cargo install","binary","custom command"],
      cards: [
        {
          t: "concept",
          kicker: "Multi-crate projects",
          title: "A workspace shares one lock file and one target directory",
          code: { lang: "toml", label: "Top-level Cargo.toml", src:
`[workspace]
resolver = "2"
members = ["adder", "add_one", "cli"]

[workspace.dependencies]     # versions declared once, inherited by members
serde = "1.0"` },
          code2: { lang: "text", label: "Layout", src:
`my_workspace/
├── Cargo.toml         <- the workspace root (no [package] section)
├── Cargo.lock         <- ONE lock file for everything
├── target/            <- ONE build directory, shared
├── adder/
│   ├── Cargo.toml
│   └── src/main.rs
└── add_one/
    ├── Cargo.toml
    └── src/lib.rs

cargo build                  # build every member
cargo test -p add_one        # test just one
cargo run -p adder           # run a specific binary` },
          body: [
            "Workspaces are how large Rust projects are organised. One lock file means every crate agrees on dependency versions; one <code>target/</code> directory means shared compilation artifacts and much faster builds."
          ],
          compare: {
            note: "Same idea as a monorepo elsewhere, but built into the standard tool rather than bolted on.",
            langs: {
              js: `// npm/pnpm/yarn workspaces — the closest analogue`,
              java: `<!-- Maven multi-module project, or a Gradle composite build -->`,
              go: `// go.work files (added in Go 1.18)`,
              python: `# no first-class support; people use uv workspaces or path dependencies`
            }
          }
        },
        {
          t: "concept",
          kicker: "Installing tools",
          title: "cargo install and custom subcommands",
          code: { lang: "text", label: "Terminal", src:
`cargo install ripgrep       # builds from source, installs to ~/.cargo/bin
cargo install --path .      # install the crate in the current directory
cargo install --list        # what have I installed?

# Any binary named cargo-xyz on your PATH becomes "cargo xyz":
cargo install cargo-watch   # -> cargo watch -x test
cargo install cargo-edit    # -> cargo upgrade
cargo install cargo-audit   # -> cargo audit (checks for known CVEs)
cargo install cargo-expand  # -> cargo expand (see what macros generate)` },
          body: [
            "<code>cargo install</code> only works on crates with a binary target. It compiles from source, so the first install of a big tool takes a while — but you get a single static-ish binary with no runtime to install."
          ],
          note: { html: "This is a big part of why Rust CLI tools spread so fast: <code>ripgrep</code>, <code>fd</code>, <code>bat</code>, <code>eza</code>, <code>zoxide</code>, <code>uv</code> — one command, no runtime, no virtualenv." }
        },
        {
          t: "quiz",
          q: "What's the main practical benefit of a Cargo workspace?",
          options: [
            "One <code>Cargo.lock</code> and one shared <code>target/</code> — consistent versions and much faster builds",
            "It merges all crates into a single binary",
            "It lets crates skip the orphan rule",
            "It publishes all members with one command"
          ],
          answer: 0,
          why: "Members share dependency resolution and compiled artifacts, so a dependency used by three crates is compiled once, and they can never disagree on its version. Each member is still published separately."
        },
        {
          t: "swipe",
          statement: "<code>cargo install</code> can install any crate from crates.io.",
          answer: false,
          why: "Only crates that provide a <strong>binary target</strong>. Library-only crates are added to a project with <code>cargo add</code> instead — there'd be nothing to run."
        },
        {
          t: "summary",
          title: "Chapter 14 complete 🎉",
          points: [
            "Tune builds with <code>[profile.dev]</code> / <code>[profile.release]</code>; benchmark in release.",
            "Publish with <code>cargo publish</code> — permanent, so dry-run first; <code>cargo yank</code> to discourage a bad version.",
            "<strong>Workspaces</strong> share one lock file and one target dir across many crates.",
            "<code>cargo install</code> builds and installs command-line tools from source.",
            "<code>cargo-watch</code>, <code>cargo-edit</code>, <code>cargo-audit</code> and <code>cargo-expand</code> are worth having."
          ]
        }
      ]
    }
  ]
};
