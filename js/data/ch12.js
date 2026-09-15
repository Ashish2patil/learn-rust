export default {
  id: 12,
  title: "An I/O Project: Building a CLI",
  emoji: "⌨️",
  blurb: "Build a mini grep with args, files, errors and TDD",
  intro: "Everything from chapters 1–11, applied: command-line arguments, reading files, separating concerns, proper error handling, and test-driven development.",
  lessons: [
    {
      id: "12.1",
      title: "Accepting arguments and reading a file",
      est: "6 min",
      tags: ["args","env","fs","cli","read_to_string"],
      cards: [
        {
          t: "concept",
          kicker: "The project",
          title: "minigrep: search a file for a string",
          code: { lang: "text", label: "Terminal", src:
`$ cargo run -- searchstring example-filename.txt` },
          after: ["Arguments come from <code>std::env::args()</code>:"],
          code2: { label: "src/main.rs", src:
`use std::env;
use std::fs;

fn main() {
    let args: Vec<String> = env::args().collect();

    // args[0] is always the program's own path
    let query = &args[1];
    let file_path = &args[2];

    println!("Searching for {query} in {file_path}");

    let contents = fs::read_to_string(file_path)
        .expect("Should have been able to read the file");

    println!("With text:\\n{contents}");
}` },
          note: { warn: true, html: "<code>env::args()</code> <b>panics</b> on invalid Unicode in an argument. Use <code>env::args_os()</code> if you need to handle that — filenames on Linux aren't required to be valid UTF-8." },
          compare: {
            note: "For real CLIs, the <code>clap</code> crate gives you flags, subcommands, help text and completions from a struct definition. This chapter does it by hand to show the underlying mechanics.",
            langs: {
              python: `import sys
query, path = sys.argv[1], sys.argv[2]
contents = open(path).read()`,
              go: `query, path := os.Args[1], os.Args[2]
data, err := os.ReadFile(path)`,
              java: `String query = args[0], path = args[1];   // note: no program name in args!
String contents = Files.readString(Path.of(path));`,
              c: `int main(int argc, char **argv) {
    char *query = argv[1];   // no bounds check — argc < 2 reads garbage
}`
            }
          }
        },
        {
          t: "quiz",
          q: "What is <code>args[0]</code>?",
          options: [
            "The path of the running program",
            "The first user-supplied argument",
            "The name of the crate",
            "Always an empty string"
          ],
          answer: 0,
          why: "By convention, argument zero is the program's own path — same as C and Python, but unlike Java, where <code>args[0]</code> is the first real argument. So user arguments start at <code>args[1]</code>."
        },
        {
          t: "summary",
          title: "Args & files",
          points: [
            "<code>std::env::args()</code> gives an iterator of arguments; <code>args[0]</code> is the program path.",
            "<code>fs::read_to_string(path)</code> reads a whole file into a <code>String</code>, returning a <code>Result</code>.",
            "<code>args_os()</code> handles non-UTF-8 arguments without panicking.",
            "In real projects, reach for <code>clap</code> — but knowing the raw version is worth it."
          ]
        }
      ]
    },
    {
      id: "12.2",
      title: "Refactoring for modularity and errors",
      est: "8 min",
      tags: ["separation of concerns","config","struct","error","eprintln","lib.rs"],
      cards: [
        {
          t: "concept",
          kicker: "The problem",
          title: "Four smells in the first draft",
          list: [
            "<code>main</code> does everything — parsing, reading, printing. Hard to test, hard to follow.",
            "<code>query</code> and <code>file_path</code> are loose variables that clearly belong together.",
            "<code>expect</code> produces useless messages (“Should have been able to read the file”) for real users.",
            "Error handling is scattered instead of being in one place."
          ],
          body: [
            "The standard fix, and the one the Rust community converged on: <strong>main handles the program's plumbing, and everything else lives in <code>lib.rs</code></strong>."
          ],
          code: { label: "src/lib.rs", src:
`use std::error::Error;
use std::fs;

pub struct Config {
    pub query: String,
    pub file_path: String,
    pub ignore_case: bool,
}

impl Config {
    // Returns Result instead of panicking, and takes an iterator
    // so it can consume the Strings instead of cloning them.
    pub fn build(mut args: impl Iterator<Item = String>) -> Result<Config, &'static str> {
        args.next();   // skip the program name

        let query = match args.next() {
            Some(arg) => arg,
            None => return Err("Didn't get a query string"),
        };
        let file_path = match args.next() {
            Some(arg) => arg,
            None => return Err("Didn't get a file path"),
        };

        let ignore_case = std::env::var("IGNORE_CASE").is_ok();

        Ok(Config { query, file_path, ignore_case })
    }
}

// Box<dyn Error> means "any type that implements Error" —
// so ? works with io::Error, ParseError, anything.
pub fn run(config: Config) -> Result<(), Box<dyn Error>> {
    let contents = fs::read_to_string(&config.file_path)?;

    let results = if config.ignore_case {
        search_case_insensitive(&config.query, &contents)
    } else {
        search(&config.query, &contents)
    };

    for line in results {
        println!("{line}");
    }
    Ok(())
}` },
          code2: { label: "src/main.rs — now tiny", src:
`use minigrep::Config;
use std::{env, process};

fn main() {
    let config = Config::build(env::args()).unwrap_or_else(|err| {
        eprintln!("Problem parsing arguments: {err}");
        process::exit(1);
    });

    if let Err(e) = minigrep::run(config) {
        eprintln!("Application error: {e}");
        process::exit(1);
    }
}` }
        },
        {
          t: "concept",
          kicker: "Unix manners",
          title: "eprintln! writes to stderr",
          code: { lang: "text", label: "Terminal", src:
`$ cargo run > output.txt
Problem parsing arguments: Didn't get a query string
# ^ the error appears on screen, NOT in output.txt — exactly right.
# Results go to stdout and can be piped; errors go to stderr and stay visible.` },
          body: [
            "<code>println!</code> → stdout (the program's actual output, meant for piping). <code>eprintln!</code> → stderr (diagnostics, meant for humans). Getting this right is what makes a CLI composable."
          ],
          compare: {
            langs: {
              python: `print(msg, file=sys.stderr)`,
              go: `fmt.Fprintln(os.Stderr, msg)`,
              java: `System.err.println(msg);`,
              c: `fprintf(stderr, "%s\\n", msg);`
            }
          }
        },
        {
          t: "quiz",
          q: "Why does <code>run</code> return <code>Result&lt;(), Box&lt;dyn Error&gt;&gt;</code> rather than calling <code>expect</code>?",
          options: [
            "So <code>main</code> decides how to report failure — and <code>?</code> works with any error type",
            "Because <code>expect</code> doesn't work in library code",
            "To make the function faster",
            "Because <code>run</code> returns nothing on success"
          ],
          answer: 0,
          why: "Two wins. <strong>Separation of concerns</strong>: the library reports what went wrong, and <code>main</code> chooses the message and exit code. And <code>Box&lt;dyn Error&gt;</code> lets <code>?</code> accept any error type in one function, thanks to the automatic <code>From</code> conversion."
        },
        {
          t: "swipe",
          statement: "Error messages should be printed with <code>println!</code> so users definitely see them.",
          answer: false,
          why: "Use <code>eprintln!</code>. Errors on stdout get swallowed when the user pipes output to a file, and they corrupt the data stream for whatever comes next in the pipeline. Output to stdout, diagnostics to stderr."
        },
        {
          t: "summary",
          title: "Refactoring",
          points: [
            "Group related arguments into a <code>Config</code> struct with a validating <code>build</code>.",
            "Move logic into <code>lib.rs</code>; leave <code>main.rs</code> handling arguments, errors and exit codes.",
            "<code>Box&lt;dyn Error&gt;</code> lets <code>?</code> propagate any error type from one function.",
            "<code>eprintln!</code> for errors, <code>println!</code> for output, <code>process::exit(1)</code> for a failing exit code."
          ]
        }
      ]
    },
    {
      id: "12.3",
      title: "Test-driven development",
      est: "6 min",
      tags: ["tdd","test first","search","env var","case insensitive"],
      cards: [
        {
          t: "concept",
          kicker: "Red, green, refactor",
          title: "Write the failing test first",
          code: { label: "The test", src:
`#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn one_result() {
        let query = "duct";
        let contents = "\\
Rust:
safe, fast, productive.
Pick three.";

        assert_eq!(vec!["safe, fast, productive."], search(query, contents));
    }
}` },
          after: ["Now the smallest implementation that makes it pass:"],
          code2: { label: "The implementation", src:
`// The lifetime says: the returned slices borrow from 'contents',
// not from 'query'. Without it the compiler can't tell which.
pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    let mut results = Vec::new();
    for line in contents.lines() {
        if line.contains(query) {
            results.push(line);
        }
    }
    results
}

// Once it passes, refactor to the iterator version (Chapter 13):
pub fn search<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    contents.lines().filter(|line| line.contains(query)).collect()
}` },
          note: { html: "That lifetime annotation is doing real work: it tells the compiler the returned string slices point into <code>contents</code>. Try removing it and you'll get exactly the “missing lifetime specifier” error from Chapter 10." }
        },
        {
          t: "concept",
          kicker: "Configuration",
          title: "Environment variables",
          code: { src:
`pub fn search_case_insensitive<'a>(query: &str, contents: &'a str) -> Vec<&'a str> {
    let query = query.to_lowercase();     // shadowing: now it's a String
    contents
        .lines()
        .filter(|line| line.to_lowercase().contains(&query))
        .collect()
}

// In Config::build:
let ignore_case = std::env::var("IGNORE_CASE").is_ok();` },
          out:
`$ IGNORE_CASE=1 cargo run -- to poem.txt
Are you nobody, too?
How dreary to be somebody!`,
          body: [
            "<code>env::var</code> returns a <code>Result</code>, so <code>.is_ok()</code> means “the variable is set to anything at all”. Real applications usually let a command-line flag override the environment variable."
          ]
        },
        {
          t: "quiz",
          q: "Why does <code>search&lt;'a&gt;(query: &amp;str, contents: &amp;'a str) -> Vec&lt;&amp;'a str&gt;</code> need that lifetime?",
          options: [
            "The returned slices point into <code>contents</code>, and the compiler must be told which input they borrow from",
            "Vec always requires a lifetime parameter",
            "To make the function generic over string types",
            "Because <code>query</code> could be dropped early"
          ],
          answer: 0,
          why: "With two reference parameters, elision rule 2 doesn't apply — the compiler can't guess whether the output borrows from <code>query</code> or <code>contents</code>. Annotating only <code>contents</code> with <code>'a</code> states exactly where the results come from."
        },
        {
          t: "order",
          prompt: "Put the TDD cycle in order",
          pieces: ["Write a failing test", "Write the simplest code that passes", "Refactor with the test as a safety net"],
          answer: [0,1,2],
          why: "Red, green, refactor. Rust makes the refactor step unusually safe: if your restructuring breaks a type or a borrow, the compiler stops you before the tests even run."
        },
        {
          t: "summary",
          title: "Chapter 12 complete 🎉 You built a real CLI",
          points: [
            "Test first, implement second, refactor third.",
            "Lifetimes matter the moment a function returns a reference derived from one of several inputs.",
            "<code>env::var(\"NAME\")</code> reads configuration from the environment.",
            "Structure: logic in <code>lib.rs</code>, plumbing in <code>main.rs</code>, results to stdout, errors to stderr.",
            "This pattern — <code>Config::build</code> + <code>run</code> + thin <code>main</code> — is a genuinely good template for your own CLI tools."
          ]
        }
      ]
    }
  ]
};
