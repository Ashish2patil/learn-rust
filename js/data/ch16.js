export default {
  id: 16,
  title: "Fearless Concurrency",
  emoji: "🧵",
  blurb: "Threads, channels, mutexes — with data races impossible",
  intro: "Rust's ownership rules turn out to prevent <strong>data races at compile time</strong>. Concurrency stops being terrifying and becomes just another thing the compiler checks.",
  lessons: [
    {
      id: "16.1",
      title: "Threads",
      est: "7 min",
      tags: ["thread","spawn","join","move","closure"],
      cards: [
        {
          t: "concept",
          kicker: "Spawning",
          title: "thread::spawn takes a closure",
          codeFirst: true,
          code: { src:
`use std::thread;
use std::time::Duration;

fn main() {
    let handle = thread::spawn(|| {
        for i in 1..10 {
            println!("hi number {i} from the spawned thread!");
            thread::sleep(Duration::from_millis(1));
        }
    });

    for i in 1..5 {
        println!("hi number {i} from the main thread!");
        thread::sleep(Duration::from_millis(1));
    }

    handle.join().unwrap();    // wait for the spawned thread to finish
}` },
          body: [
            "Rust threads are <strong>1:1 with OS threads</strong> — no green threads, no runtime. That keeps the standard library small and predictable, and makes Rust usable for embedded and kernel work.",
            "Without <code>join()</code>, the spawned thread is killed when <code>main</code> returns, mid-work. Where you put the <code>join</code> changes everything: put it before the second loop and the two won't interleave at all."
          ]
        },
        {
          t: "concept",
          kicker: "Ownership across threads",
          title: "move is mandatory, and the compiler explains why",
          code: { src:
`use std::thread;

let v = vec![1, 2, 3];

// ❌ The closure borrows v, but the thread may outlive this scope.
// let handle = thread::spawn(|| println!("{v:?}"));
//   error: closure may outlive the current function, but it borrows v
//   help: to force the closure to take ownership, use the 'move' keyword

// ✅ move transfers ownership into the thread
let handle = thread::spawn(move || println!("{v:?}"));
handle.join().unwrap();

// println!("{v:?}");   ❌ v now belongs to the thread` },
          body: [
            "In most languages you can hand a thread a reference to a local, and if the creating function returns first you get a use-after-free — undefined behaviour, usually intermittent and impossible to reproduce.",
            "Rust simply doesn't allow it. The error message even tells you the fix. This is the ownership system doing concurrency safety for free."
          ],
          compare: {
            note: "Same API shape everywhere. The difference is that in Rust the dangerous version <em>does not compile</em>.",
            langs: {
              python: `t = threading.Thread(target=lambda: print(v))
t.start(); t.join()
# and the GIL means real parallelism needs multiprocessing`,
              java: `Thread t = new Thread(() -> System.out.println(v));
t.start(); t.join();   // captured vars must be effectively final`,
              go: `go func() { fmt.Println(v) }()   // easy to capture a loop variable by mistake
// (Go 1.22 finally changed loop-variable semantics because of this)`,
              cpp: `std::thread t([&v]{ std::cout << v[0]; });
t.join();   // ⚠️ capture by reference + thread outliving scope = UB, compiles fine`
            }
          }
        },
        {
          t: "quiz",
          q: "Why does <code>thread::spawn</code> usually require a <code>move</code> closure?",
          options: [
            "The thread may outlive the scope, so it must own everything it uses",
            "<code>move</code> makes the thread faster",
            "Closures can't capture variables otherwise",
            "It's required for all closures in Rust"
          ],
          answer: 0,
          why: "The compiler can't prove the spawned thread finishes before the current function returns, so borrowing a local would risk a dangling reference. <code>move</code> transfers ownership, making the lifetime question disappear. (<code>thread::scope</code> is the escape hatch when you <em>can</em> guarantee it.)"
        },
        {
          t: "swipe",
          statement: "Rust uses lightweight green threads like Go's goroutines.",
          answer: false,
          why: "<code>std::thread</code> maps 1:1 to OS threads. Rust deliberately keeps no runtime, so it works in kernels and on microcontrollers. Lightweight tasks come from async runtimes like <strong>tokio</strong>, which you add as a dependency when you want them."
        },
        {
          t: "summary",
          title: "Threads",
          points: [
            "<code>thread::spawn(closure)</code> starts an OS thread; <code>handle.join()</code> waits for it.",
            "Closures passed to threads almost always need <code>move</code>.",
            "Rust threads are <strong>1:1 with OS threads</strong> — no runtime, no green threads.",
            "Use-after-free across threads is a <strong>compile error</strong>, not a heisenbug.",
            "<code>thread::scope</code> allows borrowing when threads are guaranteed to finish first."
          ]
        }
      ]
    },
    {
      id: "16.2",
      title: "Message passing with channels",
      est: "7 min",
      tags: ["channel","mpsc","send","recv","communicate"],
      cards: [
        {
          t: "concept",
          kicker: "Don't share, send",
          title: "mpsc: multiple producers, single consumer",
          code: { src:
`use std::sync::mpsc;
use std::thread;

fn main() {
    let (tx, rx) = mpsc::channel();

    // Clone the transmitter for each producer
    let tx1 = tx.clone();
    thread::spawn(move || {
        for val in ["hi", "from", "the", "thread"] {
            tx1.send(String::from(val)).unwrap();
        }
    });

    thread::spawn(move || {
        for val in ["more", "messages"] {
            tx.send(String::from(val)).unwrap();
        }
    });

    // rx is an iterator — it ends when ALL transmitters are dropped
    for received in rx {
        println!("Got: {received}");
    }
}` },
          body: [
            "<code>send</code> <strong>moves ownership</strong> of the value into the channel. Afterwards you can't touch it — which makes it impossible to modify data another thread is now reading.",
            "That one rule is what makes message passing safe by construction, not just by convention."
          ],
          note: { html: "Channels come in two flavours: <code>mpsc::channel()</code> is unbounded (send never blocks) and <code>mpsc::sync_channel(n)</code> is bounded (send blocks when full, giving you backpressure)." },
          compare: {
            note: "“Do not communicate by sharing memory; share memory by communicating” is Go's slogan — and Rust enforces it with the type system rather than trusting you.",
            langs: {
              go: { src:
`ch := make(chan string)
go func() { ch <- "hi" }()
msg := <-ch`, note: "Go's channels are more central to the language, but nothing stops you also sharing the underlying data." },
              python: `q = queue.Queue()
threading.Thread(target=lambda: q.put("hi")).start()
print(q.get())`,
              java: `BlockingQueue<String> q = new LinkedBlockingQueue<>();
q.put("hi"); q.take();`,
              cpp: `// No standard channel. Build one from std::queue + mutex + condition_variable.`
            }
          }
        },
        {
          t: "quiz",
          q: "What happens to a value after you <code>send</code> it down a channel?",
          options: [
            "Ownership moves into the channel — the sender can no longer use it",
            "It's cloned, so both sides have a copy",
            "The sender keeps a reference to it",
            "It becomes read-only for the sender"
          ],
          answer: 0,
          why: "<code>send</code> takes the value by value. Trying to use it afterwards is a compile error. This makes “I sent it and then kept modifying it” — a genuinely common concurrency bug elsewhere — impossible to express."
        },
        {
          t: "swipe",
          statement: "The <code>for received in rx</code> loop ends when all transmitters have been dropped.",
          answer: true,
          why: "The receiver iterator yields values until the channel is closed, which happens when every <code>Sender</code> (including clones) is dropped. A common bug: keeping the original <code>tx</code> alive in scope, so the loop hangs forever waiting for a message that will never come."
        },
        {
          t: "summary",
          title: "Channels",
          points: [
            "<code>mpsc::channel()</code> gives a <code>(tx, rx)</code> pair; clone <code>tx</code> for multiple producers.",
            "<code>send</code> <strong>moves ownership</strong> — you cannot touch the value afterwards.",
            "<code>rx</code> is an iterator that finishes when all senders are dropped.",
            "<code>sync_channel(n)</code> is bounded and provides backpressure.",
            "Message passing avoids locks entirely for many problems."
          ]
        }
      ]
    },
    {
      id: "16.3",
      title: "Shared state, Send and Sync",
      est: "9 min",
      tags: ["mutex","arc","send","sync","deadlock","atomic"],
      cards: [
        {
          t: "concept",
          kicker: "Locks",
          title: "Mutex<T> wraps the data it protects",
          code: { src:
`use std::sync::{Arc, Mutex};
use std::thread;

fn main() {
    let counter = Arc::new(Mutex::new(0));
    let mut handles = vec![];

    for _ in 0..10 {
        let counter = Arc::clone(&counter);
        let handle = thread::spawn(move || {
            let mut num = counter.lock().unwrap();   // blocks until acquired
            *num += 1;
        });                                          // lock released HERE, automatically
        handles.push(handle);
    }

    for handle in handles { handle.join().unwrap(); }

    println!("Result: {}", *counter.lock().unwrap());   // always 10
}` },
          body: [
            "The crucial design decision: in Rust the mutex <strong>owns</strong> the data. There is no way to reach the value without locking, because <code>lock()</code> is what hands you the reference.",
            "And you can't forget to unlock: <code>lock()</code> returns a <code>MutexGuard</code>, and dropping it releases the lock — even if the thread panics."
          ],
          note: { html: "<code>lock()</code> returns a <code>Result</code> because a mutex becomes <em>poisoned</em> if a thread panics while holding it. <code>.unwrap()</code> propagates that panic; in production you may want to handle it." },
          compare: {
            note: "Everywhere else, the lock and the data are separate things you must remember to pair up. Rust ties them together in the type.",
            langs: {
              java: { src:
`synchronized (lock) { counter++; }
// The lock and the data are unrelated. Access counter without the lock
// and it still compiles.`, note: "The single biggest source of concurrency bugs in Java." },
              cpp: { src:
`std::mutex m;
int counter = 0;
{ std::lock_guard<std::mutex> g(m); counter++; }
counter++;   // ⚠️ compiles fine, races anyway`, note: "lock_guard gives RAII unlocking, but nothing binds m to counter." },
              go: { src:
`var mu sync.Mutex
mu.Lock(); counter++; mu.Unlock()
// or just forget the lock — go test -race might catch it`, note: "Go's race detector finds these at runtime, if the race happens to occur during the test." },
              python: `with lock:
    counter += 1     # the GIL hides many races, but not all`
            }
          }
        },
        {
          t: "concept",
          kicker: "The two marker traits",
          title: "Send and Sync are why all this works",
          list: [
            "<strong><code>Send</code></strong> — this type can be <em>moved</em> to another thread. Nearly everything is.",
            "<strong><code>Sync</code></strong> — <code>&amp;T</code> can be <em>shared</em> with another thread. Equivalently, <code>T</code> is <code>Sync</code> if <code>&amp;T</code> is <code>Send</code>."
          ],
          code: { src:
`// Automatically implemented when all your fields qualify:
struct MyData { x: i32, s: String }     // Send + Sync, derived for free

// Deliberately NOT thread-safe:
//   Rc<T>      — non-atomic counter    -> not Send, not Sync
//   RefCell<T> — non-atomic borrow flag -> Send but not Sync
//   *const T   — raw pointers           -> neither

// So this simply does not compile:
// let rc = Rc::new(5);
// thread::spawn(move || println!("{rc}"));
//   error: Rc<i32> cannot be sent between threads safely

// Whereas the Arc version is fine:
let arc = Arc::new(5);
thread::spawn(move || println!("{arc}")).join().unwrap();` },
          body: [
            "You almost never implement these yourself — the compiler derives them structurally. Their real job is to make thread-unsafe types <em>unusable</em> across threads, with a clear error message.",
            "That's the entire mechanism behind “fearless concurrency”: not a clever runtime, just two marker traits and the ownership rules you already learned in Chapter 4."
          ]
        },
        {
          t: "concept",
          kicker: "Still on you",
          title: "What Rust does NOT prevent",
          list: [
            "<strong>Deadlocks</strong> — lock A then B in one thread, B then A in another, and you're stuck. Rust can't catch this.",
            "<strong>Race conditions</strong> (logical) — correct locking, wrong order of operations. Still a bug.",
            "<strong>Livelock and starvation</strong> — threads running but making no progress.",
            "<strong>Leaks</strong> — <code>Arc</code> cycles still leak."
          ],
          note: { warn: true, html: "Rust eliminates <b>data races</b> — two threads touching the same memory with at least one writing, unsynchronised. That's the class of bug that produces impossible-to-reproduce corruption. The logic bugs above are still yours to design away." },
          code: { src:
`// Other tools in std::sync:
use std::sync::{RwLock, Barrier, Condvar, OnceLock};
use std::sync::atomic::{AtomicUsize, Ordering};

let counter = AtomicUsize::new(0);
counter.fetch_add(1, Ordering::SeqCst);   // lock-free increment

// RwLock: many concurrent readers, or one writer
let data = RwLock::new(vec![1, 2, 3]);
{ let r = data.read().unwrap(); }       // several of these at once
{ let mut w = data.write().unwrap(); }  // exclusive

// For real concurrent work, the ecosystem offers:
//   rayon  — parallel iterators: par_iter() and you're done
//   tokio  — async runtime for network servers
//   crossbeam — better channels and scoped threads` }
        },
        {
          t: "quiz",
          q: "Why is <code>Rc&lt;T&gt;</code> rejected when moved into a thread?",
          options: [
            "It isn't <code>Send</code> — its reference count isn't atomic, so concurrent updates would corrupt it",
            "<code>Rc</code> is too slow for threads",
            "Threads can't take ownership of pointers",
            "It would create a memory leak"
          ],
          answer: 0,
          why: "Two threads incrementing a non-atomic counter can lose an update, leading to a premature free and a use-after-free. Rather than trusting you to notice, the compiler refuses: <code>Rc</code> isn't <code>Send</code>. Use <code>Arc</code>, which pays for atomic operations."
        },
        {
          t: "swipe",
          statement: "Rust's compiler prevents deadlocks.",
          answer: false,
          why: "Rust prevents <strong>data races</strong>, not deadlocks. Acquiring two locks in inconsistent orders still hangs your program. Deadlock freedom needs design discipline — consistent lock ordering, or avoiding shared locks via channels."
        },
        {
          t: "order",
          prompt: "Order these from most to least preferred for sharing work between threads",
          pieces: ["Channels (send owned values)", "Arc<Mutex<T>> (shared state with a lock)", "unsafe with raw pointers"],
          answer: [0,1,2],
          why: "Message passing avoids locks and deadlocks entirely. <code>Arc&lt;Mutex&lt;T&gt;&gt;</code> is the right tool when state genuinely must be shared. Raw pointers are the last resort, and then you're responsible for everything."
        },
        {
          t: "summary",
          title: "Chapter 16 complete 🎉",
          points: [
            "<code>Mutex&lt;T&gt;</code> <strong>owns</strong> the data — you cannot access it without locking, and the guard unlocks on drop.",
            "<code>Arc&lt;Mutex&lt;T&gt;&gt;</code> is the standard shared-mutable-state pattern across threads.",
            "<code>Send</code> = movable between threads; <code>Sync</code> = shareable by reference. Derived automatically.",
            "Data races are <strong>compile errors</strong>. Deadlocks and logic races are still your responsibility.",
            "Reach for <code>rayon</code> for data parallelism and <code>tokio</code> for async I/O."
          ]
        }
      ]
    }
  ]
};
