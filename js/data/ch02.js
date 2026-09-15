export default {
  id: 2,
  title: "Programming a Guessing Game",
  emoji: "🎲",
  blurb: "Build a real program and meet half of Rust at once",
  intro: "A hands-on project that throws you in the deep end: input, crates, randomness, matching, shadowing and error handling — all in about 25 lines.",
  lessons: [
    {
      id: "2.1",
      title: "Reading user input",
      est: "6 min",
      tags: ["stdin","input","mutable","references","io"],
      cards: [
        {
          t: "concept",
          kicker: "The project",
          title: "What we're building",
          body: [
            "The program picks a secret number between 1 and 100, asks you to guess, tells you <em>too small</em> or <em>too big</em>, and loops until you get it.",
            "It's a small program that touches an unusual amount of Rust. Don't worry about understanding every line yet — later chapters explain all of it. Today is about <strong>feel</strong>."
          ],
          code: { lang: "text", label: "Terminal", src:
`$ cargo new guessing_game
$ cd guessing_game` }
        },
        {
          t: "concept",
          kicker: "Step 1",
          title: "Taking a guess from stdin",
          code: { label: "src/main.rs", src:
`use std::io;

fn main() {
    println!("Guess the number!");
    println!("Please input your guess.");

    let mut guess = String::new();

    io::stdin()
        .read_line(&mut guess)
        .expect("Failed to read line");

    println!("You guessed: {guess}");
}` },
          list: [
            "<code>use std::io;</code> — brings the input/output library into scope, like an import.",
            "<code>let mut guess</code> — variables are <strong>immutable by default</strong> in Rust. <code>mut</code> opts in to mutation.",
            "<code>String::new()</code> — creates a new, empty, growable string.",
            "<code>&amp;mut guess</code> — passes a <em>mutable reference</em>: <code>read_line</code> writes into your string rather than returning a new one.",
            "<code>.expect(...)</code> — <code>read_line</code> returns a <code>Result</code> that might be an error. <code>expect</code> says “crash with this message if it failed”."
          ],
          note: { warn: true, html: "Leave off <code>.expect(...)</code> and the compiler <b>warns you</b> that you're ignoring a possible failure. Rust does not let errors go quietly unnoticed." },
          compare: {
            note: "Notice what's different: Rust makes the possibility of failure <em>visible in the type</em>, and makes mutation explicit.",
            langs: {
              python: { src:
`guess = input("Please input your guess. ")
print(f"You guessed: {guess}")`, note: "Far shorter — but an I/O failure raises an exception you may not have thought about." },
              java: { src:
`Scanner sc = new Scanner(System.in);
String guess = sc.nextLine();
System.out.println("You guessed: " + guess);` },
              go: { src:
`reader := bufio.NewReader(os.Stdin)
guess, err := reader.ReadString('\\n')
if err != nil { panic(err) }
fmt.Println("You guessed:", guess)`, note: "Closest to Rust: Go also returns errors as values. Rust just makes ignoring them harder." },
              c: { src:
`char guess[100];
if (fgets(guess, sizeof guess, stdin) == NULL) { /* handle */ }
printf("You guessed: %s", guess);`, note: "You must pick the buffer size in advance — and overflowing it is the classic C security bug." }
            }
          }
        },
        {
          t: "quiz",
          q: "Why does <code>read_line</code> take <code>&amp;mut guess</code> rather than just <code>guess</code>?",
          options: [
            "So it can write into your existing String without taking ownership of it",
            "Because Strings are too big to copy",
            "Because <code>guess</code> is a constant",
            "It's just a style convention"
          ],
          answer: 0,
          why: "<code>&amp;mut</code> is a <strong>mutable borrow</strong>: the function gets temporary permission to modify your String, and you still own it afterwards. If you passed <code>guess</code> directly, ownership would move into the function and you couldn't use it on the next line. Chapter 4 makes this click properly."
        },
        {
          t: "swipe",
          statement: "In Rust, <code>let x = 5;</code> creates a variable you can later reassign.",
          answer: false,
          why: "Variables are <strong>immutable by default</strong>. <code>let x = 5; x = 6;</code> is a compile error. You need <code>let mut x = 5;</code>. This default is the opposite of nearly every other language — and it prevents a whole class of accidental-mutation bugs."
        },
        {
          t: "summary",
          title: "Input, handled",
          points: [
            "<code>use</code> brings items into scope; <code>String::new()</code> makes an empty growable string.",
            "<strong>Immutable by default</strong> — add <code>mut</code> when you genuinely need to change something.",
            "<code>&amp;mut x</code> lends something out for modification without giving it away.",
            "Fallible operations return <code>Result</code>; <code>.expect(\"msg\")</code> is the quick-and-dirty way to handle one."
          ]
        }
      ]
    },
    {
      id: "2.2",
      title: "Adding a crate and randomness",
      est: "5 min",
      tags: ["crates.io","rand","dependency","cargo add","semver"],
      cards: [
        {
          t: "concept",
          kicker: "Step 2",
          title: "Rust's standard library has no random number generator",
          body: [
            "That's deliberate: Rust keeps <code>std</code> small and stable, and lets the ecosystem move fast. Randomness lives in the <code>rand</code> crate, downloaded from <em>crates.io</em>."
          ],
          code: { lang: "text", label: "Terminal", src:
`$ cargo add rand
    Updating crates.io index
      Adding rand v0.8.5 to dependencies` },
          after: ["That writes into your <code>Cargo.toml</code>:"],
          note: { html: "<code>rand = \"0.8.5\"</code> means <em>“at least 0.8.5, but below 0.9”</em> — semantic versioning. <code>Cargo.lock</code> records the exact version actually used, so your build is reproducible on every machine." }
        },
        {
          t: "concept",
          kicker: "Step 3",
          title: "Generating the secret number",
          code: { label: "src/main.rs", src:
`use rand::Rng;   // trait: brings .gen_range() into scope
use std::io;

fn main() {
    let secret_number = rand::thread_rng().gen_range(1..=100);
    println!("The secret number is: {secret_number}");
}` },
          list: [
            "<code>1..=100</code> is an <strong>inclusive range</strong> — 1 through 100. Without the <code>=</code>, <code>1..100</code> stops at 99.",
            "<code>use rand::Rng</code> imports a <strong>trait</strong>. In Rust you must import a trait to use its methods — Chapter 10 explains why that's a good thing."
          ],
          compare: {
            note: "Rust's range syntax (<code>1..=100</code>) is unusually explicit about whether the end is included — no more off-by-one guessing.",
            langs: {
              python: `import random
secret = random.randint(1, 100)   # inclusive both ends`,
              java: `int secret = new Random().nextInt(1, 101);  // upper bound exclusive`,
              go: `secret := rand.Intn(100) + 1   // Intn is exclusive`,
              cpp: `std::uniform_int_distribution<int> d(1, 100);  // inclusive
int secret = d(gen);`,
              c: `int secret = rand() % 100 + 1;  // biased, and needs srand()`
            }
          }
        },
        {
          t: "quiz",
          q: "What does <code>1..=100</code> produce?",
          options: [
            "The numbers 1 through 100, including 100",
            "The numbers 1 through 99",
            "The numbers 0 through 100",
            "A comparison between 1 and 100"
          ],
          answer: 0,
          why: "<code>..=</code> is <strong>inclusive</strong> on the right. <code>1..100</code> (with two dots) is exclusive and gives 1 through 99. Being able to see the difference in the syntax kills a lot of off-by-one bugs."
        },
        {
          t: "summary",
          title: "Dependencies, handled",
          points: [
            "Third-party libraries are <strong>crates</strong>, added with <code>cargo add &lt;name&gt;</code>.",
            "<code>Cargo.toml</code> states what you want; <code>Cargo.lock</code> pins what you got.",
            "<code>a..b</code> excludes <code>b</code>; <code>a..=b</code> includes it.",
            "Trait methods only exist once the trait is in scope — hence <code>use rand::Rng;</code>."
          ]
        }
      ]
    },
    {
      id: "2.3",
      title: "Comparing, looping, and handling bad input",
      est: "7 min",
      tags: ["match","loop","shadowing","parse","ordering","result"],
      cards: [
        {
          t: "concept",
          kicker: "Step 4",
          title: "match: like switch, but it must cover every case",
          code: { src:
`use std::cmp::Ordering;

match guess.cmp(&secret_number) {
    Ordering::Less    => println!("Too small!"),
    Ordering::Greater => println!("Too big!"),
    Ordering::Equal   => println!("You win!"),
}` },
          body: [
            "<code>.cmp()</code> returns an <code>Ordering</code>, an enum with exactly three possible values. <code>match</code> compares against each <em>arm</em> and runs the first that fits.",
            "The killer feature: <strong>match is exhaustive</strong>. Delete one arm and your program won't compile. The compiler literally will not let you forget a case."
          ],
          compare: {
            note: "This exhaustiveness is why Rust programmers rave about <code>match</code>: forgetting a case becomes a build error rather than a silent bug at 3am.",
            langs: {
              python: { src:
`if guess < secret:    print("Too small!")
elif guess > secret:  print("Too big!")
else:                 print("You win!")`, note: "Nothing checks that you covered everything — forget the else and it silently does nothing." },
              java: { src:
`switch (Integer.compare(guess, secret)) {
    case -1 -> System.out.println("Too small!");
    case  1 -> System.out.println("Too big!");
    default -> System.out.println("You win!");
}`, note: "Newer Java switch expressions over sealed types do get exhaustiveness checking — the idea is spreading." },
              go: { src:
`switch {
case guess < secret:  fmt.Println("Too small!")
case guess > secret:  fmt.Println("Too big!")
default:              fmt.Println("You win!")
}`, note: "Go's switch never requires a default — missing cases pass silently." },
              c: { src:
`if (guess < secret) puts("Too small!");
else if (guess > secret) puts("Too big!");
else puts("You win!");`, note: "C's switch even falls through by default if you forget a break." }
            }
          }
        },
        {
          t: "concept",
          kicker: "Step 5",
          title: "Shadowing: converting a String into a number",
          code: { src:
`let mut guess = String::new();
io::stdin().read_line(&mut guess).expect("Failed to read line");

// Same name, new variable, new type. This is "shadowing".
let guess: u32 = guess.trim().parse().expect("Please type a number!");` },
          body: [
            "<code>read_line</code> gives you a <code>String</code>, but you need a number to compare. Rust will never convert types implicitly, so you <code>parse()</code>.",
            "Declaring <code>guess</code> a second time <strong>shadows</strong> the first. This is idiomatic in Rust — it saves you inventing names like <code>guess_str</code> and <code>guess_num</code>.",
            "<code>.trim()</code> matters: pressing Enter puts a newline in the string, and <code>\"42\\n\"</code> won't parse."
          ],
          note: { html: "The type annotation <code>: u32</code> is what tells <code>parse()</code> what to parse <em>into</em>. Rust infers most types, but here it genuinely needs the hint." },
          compare: {
            note: "Rust never coerces silently. Every type change is something you wrote on purpose.",
            langs: {
              python: `guess = int(input())          # raises ValueError on bad input`,
              java: `int guess = Integer.parseInt(line.trim());  // throws NumberFormatException`,
              go: `guess, err := strconv.Atoi(strings.TrimSpace(line))
if err != nil { /* handle */ }`,
              c: `int guess = atoi(line);   // returns 0 on garbage — no error at all!`
            }
          }
        },
        {
          t: "quiz",
          q: "What is <em>shadowing</em>?",
          options: [
            "Declaring a new variable with the same name, possibly of a different type",
            "Mutating a variable without <code>mut</code>",
            "Hiding a variable from other modules",
            "Copying a variable into a new scope"
          ],
          answer: 0,
          why: "<code>let x = x.trim();</code> creates a <strong>brand-new variable</strong> that happens to reuse the name — the old one becomes inaccessible. Unlike <code>mut</code>, shadowing can change the type, and the result is still immutable."
        },
        {
          t: "concept",
          kicker: "Step 6",
          title: "Looping, and recovering from bad input",
          code: { label: "The finished game", src:
`use rand::Rng;
use std::cmp::Ordering;
use std::io;

fn main() {
    println!("Guess the number!");
    let secret_number = rand::thread_rng().gen_range(1..=100);

    loop {
        println!("Please input your guess.");

        let mut guess = String::new();
        io::stdin().read_line(&mut guess).expect("Failed to read line");

        // Instead of crashing on bad input, skip this round.
        let guess: u32 = match guess.trim().parse() {
            Ok(num)  => num,
            Err(_)   => {
                println!("That is not a number, try again.");
                continue;
            }
        };

        println!("You guessed: {guess}");

        match guess.cmp(&secret_number) {
            Ordering::Less    => println!("Too small!"),
            Ordering::Greater => println!("Too big!"),
            Ordering::Equal   => {
                println!("You win! 🎉");
                break;
            }
        }
    }
}` },
          body: [
            "<code>loop</code> repeats forever until <code>break</code>. <code>continue</code> skips to the next iteration.",
            "The big idea here: swapping <code>.expect()</code> for a <code>match</code> on <code>Result</code> turns a <strong>crash</strong> into <strong>graceful recovery</strong>. Same value, different handling — and the compiler made sure you thought about it."
          ],
          note: { html: "<code>Err(_)</code> uses <code>_</code> as a wildcard: “any error, I don't care which”. You'll see <code>_</code> everywhere in Rust as “ignore this”." }
        },
        {
          t: "swipe",
          statement: "If you delete the <code>Ordering::Equal</code> arm, the program still compiles but silently does nothing when you win.",
          answer: false,
          why: "It <strong>will not compile</strong>: <em>“non-exhaustive patterns: <code>Ordering::Equal</code> not covered”</em>. This is one of the best things about Rust — whole categories of “forgot a case” bugs simply cannot be written."
        },
        {
          t: "order",
          prompt: "Put the guess-handling steps in the order the program does them",
          pieces: ["read_line(&mut guess)", "guess.trim().parse()", "guess.cmp(&secret_number)", "match on Ordering"],
          answer: [0,1,2,3],
          why: "Read raw text → convert it to a number (recovering if that fails) → compare it → branch on the result. Notice how the type changes at each step, and how the compiler tracks it for you."
        },
        {
          t: "summary",
          title: "Chapter 2 complete 🎉 You built a real program",
          points: [
            "<strong>match</strong> is exhaustive — the compiler proves you handled every case.",
            "<strong>Shadowing</strong> lets you reuse a name for a new value, even at a new type.",
            "<code>Result</code> is either <code>Ok(value)</code> or <code>Err(e)</code>: <code>.expect()</code> crashes, <code>match</code> recovers.",
            "<code>loop</code> / <code>break</code> / <code>continue</code> work as you'd expect.",
            "You just used: immutability, references, crates, traits, enums, pattern matching and error handling. Everything from here is explaining what you already touched."
          ]
        }
      ]
    }
  ]
};
