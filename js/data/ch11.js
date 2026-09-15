export default {
  id: 11,
  title: "Writing Automated Tests",
  emoji: "🧪",
  blurb: "Unit tests, integration tests, and cargo test",
  intro: "Testing is built into the language and the tool — no framework to choose, no XML to configure. Write <code>#[test]</code> and run <code>cargo test</code>.",
  lessons: [
    {
      id: "11.1",
      title: "How to write tests",
      est: "8 min",
      tags: ["test","assert","should_panic","cfg test","result"],
      cards: [
        {
          t: "concept",
          kicker: "Built in",
          title: "A test is a function with #[test] on it",
          codeFirst: true,
          code: { label: "src/lib.rs", src:
`pub fn add(a: i32, b: i32) -> i32 { a + b }

#[cfg(test)]                  // only compiled when testing
mod tests {
    use super::*;             // bring the outer module into scope

    #[test]
    fn it_adds() {
        let result = add(2, 2);
        assert_eq!(result, 4);
    }

    #[test]
    fn it_handles_negatives() {
        assert_eq!(add(-1, 1), 0);
    }
}` },
          out:
`$ cargo test
running 2 tests
test tests::it_adds ... ok
test tests::it_handles_negatives ... ok

test result: ok. 2 passed; 0 failed; 0 ignored; 0 measured`,
          body: [
            "<code>#[cfg(test)]</code> means the module is compiled <em>only</em> during <code>cargo test</code> — your tests never bloat the shipped binary.",
            "Tests live right next to the code they test, and because they're a child module, they can see <strong>private</strong> functions. No visibility gymnastics needed."
          ],
          compare: {
            note: "No dependency, no config, no annotations to learn beyond <code>#[test]</code>. Test discovery is automatic.",
            langs: {
              python: `# pip install pytest, then:
def test_adds():
    assert add(2, 2) == 4`,
              java: `// add JUnit to your build file, then:
@Test void itAdds() { assertEquals(4, add(2, 2)); }`,
              go: `// built in, like Rust — file must end in _test.go
func TestAdds(t *testing.T) {
    if add(2,2) != 4 { t.Errorf("got %d", add(2,2)) }
}`,
              cpp: `// Pick a framework: GoogleTest, Catch2, doctest...
TEST(AddTest, Works) { EXPECT_EQ(add(2,2), 4); }`
            }
          }
        },
        {
          t: "concept",
          kicker: "The macros",
          title: "assert!, assert_eq!, assert_ne! and custom messages",
          code: { src:
`#[test]
fn assertions() {
    assert!(1 + 1 == 2);                    // must be true
    assert_eq!(2 + 2, 4);                   // equal — prints both sides on failure
    assert_ne!(2 + 2, 5);                   // not equal

    // Custom failure messages take format! arguments
    let name = "Carol";
    let greeting = greet(name);
    assert!(
        greeting.contains(name),
        "Greeting did not contain the name. Got: {greeting}"
    );
}

#[test]
#[should_panic(expected = "between 1 and 100")]   // substring must appear
fn rejects_out_of_range() {
    Guess::new(200);
}

#[test]
fn works_with_result() -> Result<(), String> {
    if 2 + 2 == 4 { Ok(()) } else { Err(String::from("maths broke")) }
    // the ? operator works here, which is very handy
}

#[test]
#[ignore]                                  // skipped unless --ignored is passed
fn expensive_test() { /* ... */ }` },
          note: { html: "<code>assert_eq!</code> requires both values to implement <code>PartialEq</code> and <code>Debug</code> — so put <code>#[derive(Debug, PartialEq)]</code> on any struct you want to compare in tests." }
        },
        {
          t: "quiz",
          q: "What does <code>#[cfg(test)]</code> do?",
          options: [
            "Compiles that module only when running tests, keeping it out of the release binary",
            "Marks a function as a test",
            "Configures the test runner",
            "Runs the module before every test"
          ],
          answer: 0,
          why: "<code>cfg</code> is conditional compilation. <code>#[cfg(test)]</code> on a module means it exists only during <code>cargo test</code>. <code>#[test]</code> is the separate attribute that marks an individual function as a test."
        },
        {
          t: "swipe",
          statement: "Rust tests can call private functions of the module they live in.",
          answer: true,
          why: "The <code>tests</code> module is a <em>child</em> of the module it's testing, and children can see their ancestors' private items. That's why unit tests go inside the file — you can test internals directly, without making them public just for testing."
        },
        {
          t: "summary",
          title: "Writing tests",
          points: [
            "<code>#[test]</code> marks a test; <code>#[cfg(test)] mod tests</code> keeps it out of release builds.",
            "<code>assert!</code>, <code>assert_eq!</code>, <code>assert_ne!</code>, plus custom <code>format!</code>-style messages.",
            "<code>#[should_panic(expected = \"...\")]</code> asserts that code panics for the right reason.",
            "Tests can return <code>Result</code>, so <code>?</code> works inside them.",
            "Unit tests sit beside the code and can reach private items."
          ]
        }
      ]
    },
    {
      id: "11.2",
      title: "Controlling how tests run",
      est: "5 min",
      tags: ["cargo test","parallel","threads","filter","nocapture"],
      cards: [
        {
          t: "concept",
          kicker: "The test runner",
          title: "Flags worth knowing",
          code: { lang: "text", label: "Terminal", src:
`cargo test                      # run everything (in parallel, by default)
cargo test add                  # run tests whose NAME contains "add"
cargo test tests::it_adds       # run exactly one test
cargo test -- --test-threads=1  # run serially — for tests sharing state
cargo test -- --show-output     # show println! output from passing tests
cargo test -- --ignored         # run only the #[ignore]d ones
cargo test -- --include-ignored # run everything, ignored included
cargo test --lib                # unit tests only
cargo test --test integration   # one integration test file
cargo test --doc                # documentation examples only` },
          body: [
            "Tests run <strong>in parallel threads by default</strong>, which is fast but means they must not depend on shared mutable state — a shared file, a fixed port, a global. If they do, either isolate them (temp files, random ports) or pass <code>--test-threads=1</code>.",
            "Output from passing tests is captured and hidden, so a clean run is genuinely clean. Failing tests always show their output."
          ],
          note: { html: "Everything after <code>--</code> goes to the <b>test binary</b>, not to Cargo. That's why it's <code>cargo test -- --show-output</code> with two sets of dashes." }
        },
        {
          t: "quiz",
          q: "Two tests both write to <code>output.txt</code> and fail intermittently. What's the likely cause?",
          options: [
            "They run in parallel and interfere with each other",
            "Rust caches test results",
            "File I/O isn't allowed in tests",
            "The tests run in a random order each time"
          ],
          answer: 0,
          why: "Parallel execution by default. Fix it properly by giving each test its own temp file (the <code>tempfile</code> crate is made for this), or work around it with <code>--test-threads=1</code>. Isolated tests are better tests anyway."
        },
        {
          t: "summary",
          title: "Running tests",
          points: [
            "Tests run in <strong>parallel</strong> unless you pass <code>--test-threads=1</code>.",
            "<code>cargo test &lt;substring&gt;</code> filters by test name.",
            "<code>--show-output</code> reveals <code>println!</code> from passing tests.",
            "<code>#[ignore]</code> plus <code>--ignored</code> keeps slow tests out of the normal run.",
            "Arguments after <code>--</code> go to the test binary, not to Cargo."
          ]
        }
      ]
    },
    {
      id: "11.3",
      title: "Test organisation",
      est: "6 min",
      tags: ["unit test","integration test","tests directory","doc test","common"],
      cards: [
        {
          t: "concept",
          kicker: "Two kinds",
          title: "Unit tests live inside; integration tests live outside",
          code: { lang: "text", label: "Project layout", src:
`my_crate/
├── src/
│   ├── lib.rs           <- unit tests in #[cfg(test)] mod tests
│   └── parser.rs        <- more unit tests, right next to the code
└── tests/               <- integration tests
    ├── api_test.rs      <- each file is its OWN crate
    └── common/
        └── mod.rs       <- shared helpers (NOT a test file, note the subdir)` },
          code2: { label: "tests/api_test.rs", src:
`use my_crate;                 // import it like any external user would
mod common;                   // shared setup helpers

#[test]
fn it_adds_two() {
    common::setup();
    assert_eq!(my_crate::add(2, 2), 4);   // only PUBLIC items are visible
}` },
          list: [
            "<strong>Unit tests</strong> — inside <code>src/</code>, can reach private items, test one piece in isolation.",
            "<strong>Integration tests</strong> — in <code>tests/</code>, each file compiled as a separate crate, sees only your public API. They test your library the way real users will.",
            "<strong>Doc tests</strong> — examples in <code>///</code> comments, run automatically. They keep your documentation honest."
          ],
          note: { warn: true, html: "Shared helpers go in <code>tests/common/mod.rs</code>, <b>not</b> <code>tests/common.rs</code> — anything directly inside <code>tests/</code> is treated as a test crate and would show up as an empty test run." }
        },
        {
          t: "concept",
          kicker: "Binary crates",
          title: "Why logic belongs in lib.rs",
          body: [
            "<code>tests/</code> can only <code>use</code> a <strong>library</strong> crate. If all your code lives in <code>src/main.rs</code>, integration tests can't reach any of it.",
            "That's the practical reason for the usual structure: put everything in <code>src/lib.rs</code>, and let <code>src/main.rs</code> be a few lines that parse arguments and call into the library. Chapter 12 does exactly this."
          ],
          code: { label: "src/main.rs", src:
`use my_crate::{Config, run};
use std::{env, process};

fn main() {
    let config = Config::build(env::args()).unwrap_or_else(|err| {
        eprintln!("Problem parsing arguments: {err}");
        process::exit(1);
    });

    if let Err(e) = run(config) {
        eprintln!("Application error: {e}");
        process::exit(1);
    }
}` },
          compare: {
            note: "Rust's split between “library-under-test” and “thin binary” is a convention the tooling pushes you toward — and it happens to be good architecture anyway.",
            langs: {
              python: `if __name__ == "__main__":
    main()          # same idea: importable module, thin entry point`,
              go: `// package main is thin; real logic lives in importable packages`,
              java: `// public static void main delegates to testable classes`
            }
          }
        },
        {
          t: "quiz",
          q: "Why can't an integration test in <code>tests/</code> call a private function?",
          options: [
            "Each file in <code>tests/</code> is a separate crate, so it only sees your public API",
            "Integration tests run before compilation finishes",
            "Private functions are removed in test builds",
            "They can — with <code>use super::*</code>"
          ],
          answer: 0,
          why: "That's the design intent: integration tests exercise your crate <strong>exactly as a real user would</strong>, through the public API. Testing internals is the unit tests' job, and they live inside <code>src/</code> where they can see everything."
        },
        {
          t: "swipe",
          statement: "Code examples inside <code>///</code> doc comments are executed by <code>cargo test</code>.",
          answer: true,
          why: "They're <strong>doc tests</strong>, and they run on every <code>cargo test</code>. This is why Rust libraries have such reliable documentation: an example that stops compiling breaks the build, so stale docs get caught immediately."
        },
        {
          t: "summary",
          title: "Chapter 11 complete 🎉",
          points: [
            "<strong>Unit tests</strong> in <code>src/</code> see private items; <strong>integration tests</strong> in <code>tests/</code> see only the public API.",
            "Each file in <code>tests/</code> is its own crate; shared helpers go in <code>tests/common/mod.rs</code>.",
            "<strong>Doc tests</strong> run your documentation examples automatically.",
            "Put logic in <code>lib.rs</code> and keep <code>main.rs</code> thin, so everything is testable.",
            "No framework to install — testing is part of the language and of Cargo."
          ]
        }
      ]
    }
  ]
};
