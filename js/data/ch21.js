export default {
  id: 21,
  title: "Final Project: A Multithreaded Web Server",
  emoji: "🌐",
  blurb: "TCP, HTTP, and a thread pool built from scratch",
  intro: "The capstone. Build a working web server with no frameworks: raw TCP, hand-parsed HTTP, and a thread pool you write yourself using channels, <code>Arc</code>, <code>Mutex</code> and <code>Drop</code>.",
  lessons: [
    {
      id: "21.1",
      title: "A single-threaded web server",
      est: "8 min",
      tags: ["tcp","listener","http","bufreader","server"],
      cards: [
        {
          t: "concept",
          kicker: "Listening",
          title: "TcpListener accepts connections",
          codeFirst: true,
          code: { label: "src/main.rs", src:
`use std::net::{TcpListener, TcpStream};
use std::io::{BufReader, BufRead, Write};
use std::fs;

fn main() {
    let listener = TcpListener::bind("127.0.0.1:7878").unwrap();

    for stream in listener.incoming() {
        let stream = stream.unwrap();
        handle_connection(stream);
    }
}` },
          body: [
            "<code>bind</code> returns a <code>Result</code> — the port might be in use, or below 1024 and need privileges. <code>incoming()</code> is an iterator of connection attempts that never ends.",
            "Port 7878 is “rust” typed on a phone keypad."
          ]
        },
        {
          t: "concept",
          kicker: "Speaking HTTP",
          title: "Reading a request, writing a response",
          code: { src:
`fn handle_connection(mut stream: TcpStream) {
    let buf_reader = BufReader::new(&stream);
    let request_line = buf_reader.lines().next().unwrap().unwrap();

    // HTTP is a text protocol:
    //   GET /path HTTP/1.1\\r\\n
    //   Header: value\\r\\n
    //   \\r\\n                 <- blank line ends the headers

    let (status_line, filename) = match &request_line[..] {
        "GET / HTTP/1.1"      => ("HTTP/1.1 200 OK", "hello.html"),
        "GET /sleep HTTP/1.1" => {
            std::thread::sleep(std::time::Duration::from_secs(5));
            ("HTTP/1.1 200 OK", "hello.html")
        }
        _ => ("HTTP/1.1 404 NOT FOUND", "404.html"),
    };

    let contents = fs::read_to_string(filename).unwrap();
    let length = contents.len();

    let response = format!(
        "{status_line}\\r\\nContent-Length: {length}\\r\\n\\r\\n{contents}"
    );

    stream.write_all(response.as_bytes()).unwrap();
}` },
          body: [
            "That's genuinely all HTTP/1.1 requires for a basic response: a status line, a <code>Content-Length</code> header, a blank line, and the body.",
            "The <code>/sleep</code> route exists to demonstrate the problem: with a single thread, one slow request blocks <strong>every</strong> other visitor for five seconds."
          ],
          compare: {
            note: "Rust's standard library gives you TCP but no HTTP. Real projects use <code>axum</code>, <code>actix-web</code> or <code>hyper</code> — this exercise is about understanding what those are doing underneath.",
            langs: {
              python: `import socket
s = socket.socket(); s.bind(("127.0.0.1", 7878)); s.listen()
conn, _ = s.accept()
# or just: http.server.HTTPServer — batteries included`,
              go: `// Go ships a production HTTP server in the standard library
http.HandleFunc("/", handler)
http.ListenAndServe(":7878", nil)`,
              java: `ServerSocket server = new ServerSocket(7878);
Socket client = server.accept();`,
              c: `int fd = socket(AF_INET, SOCK_STREAM, 0);
bind(fd, ...); listen(fd, 10); accept(fd, ...);   // and parse HTTP yourself`
            }
          }
        },
        {
          t: "quiz",
          q: "Why does a request to <code>/sleep</code> block every other visitor?",
          options: [
            "The single-threaded loop handles one connection completely before accepting the next",
            "TCP allows only one connection at a time",
            "The OS limits concurrent sockets",
            "<code>BufReader</code> locks the listener"
          ],
          answer: 0,
          why: "<code>for stream in listener.incoming()</code> is strictly sequential: <code>handle_connection</code> must return before the loop accepts another connection. This is exactly the problem the thread pool solves."
        },
        {
          t: "summary",
          title: "Single-threaded server",
          points: [
            "<code>TcpListener::bind</code> then <code>incoming()</code> to accept connections.",
            "HTTP is plain text: status line, headers, blank line, body.",
            "<code>BufReader</code> gives you line-by-line reading over the stream.",
            "One thread means one request at a time — the next lesson fixes that."
          ]
        }
      ]
    },
    {
      id: "21.2",
      title: "Building a thread pool",
      est: "10 min",
      tags: ["thread pool","worker","channel","arc","mutex","graceful shutdown"],
      cards: [
        {
          t: "concept",
          kicker: "Design first",
          title: "Write the API you want, then make it compile",
          code: { src:
`// The interface we're aiming for:
let pool = ThreadPool::new(4);

for stream in listener.incoming() {
    let stream = stream.unwrap();
    pool.execute(|| {
        handle_connection(stream);
    });
}` },
          body: [
            "Spawning a thread per connection would work — until someone sends ten thousand requests and the machine falls over. A <strong>pool</strong> caps concurrency at a fixed number of threads.",
            "This “compiler-driven development” approach — write the call site, then let the errors tell you what to build — is a genuinely effective way to work in Rust."
          ]
        },
        {
          t: "concept",
          kicker: "The implementation",
          title: "Workers pulling jobs from a shared channel",
          code: { label: "src/lib.rs", src:
`use std::sync::{mpsc, Arc, Mutex};
use std::thread;

pub struct ThreadPool {
    workers: Vec<Worker>,
    sender: Option<mpsc::Sender<Job>>,
}

// A boxed closure: send it to a thread, call it once.
type Job = Box<dyn FnOnce() + Send + 'static>;

impl ThreadPool {
    /// # Panics
    /// Panics if size is zero.
    pub fn new(size: usize) -> ThreadPool {
        assert!(size > 0);

        let (sender, receiver) = mpsc::channel();
        // Arc  -> several workers own the receiver
        // Mutex-> only one worker takes a job at a time
        let receiver = Arc::new(Mutex::new(receiver));

        let mut workers = Vec::with_capacity(size);
        for id in 0..size {
            workers.push(Worker::new(id, Arc::clone(&receiver)));
        }

        ThreadPool { workers, sender: Some(sender) }
    }

    pub fn execute<F>(&self, f: F)
    where
        F: FnOnce() + Send + 'static,
    {
        let job = Box::new(f);
        self.sender.as_ref().unwrap().send(job).unwrap();
    }
}

struct Worker {
    id: usize,
    thread: Option<thread::JoinHandle<()>>,
}

impl Worker {
    fn new(id: usize, receiver: Arc<Mutex<mpsc::Receiver<Job>>>) -> Worker {
        let thread = thread::spawn(move || loop {
            // lock, take one job, RELEASE the lock, then run the job.
            // Using 'while let' here would hold the lock for the whole
            // job and serialise the entire pool — a classic subtle bug.
            let message = receiver.lock().unwrap().recv();

            match message {
                Ok(job) => {
                    println!("Worker {id} got a job; executing.");
                    job();
                }
                Err(_) => {
                    println!("Worker {id} disconnected; shutting down.");
                    break;
                }
            }
        });

        Worker { id, thread: Some(thread) }
    }
}` },
          list: [
            "<code>Arc</code> lets every worker <strong>own</strong> the receiver.",
            "<code>Mutex</code> ensures only one worker takes a given job.",
            "<code>Box&lt;dyn FnOnce() + Send + 'static&gt;</code> — a closure that can cross a thread boundary and runs once.",
            "The <code>match</code> rather than <code>while let</code> is deliberate: it drops the lock before running the job."
          ],
          note: { warn: true, html: "That <code>while let</code> trap is worth remembering. <code>while let Ok(job) = receiver.lock().unwrap().recv()</code> holds the <code>MutexGuard</code> for the body of the loop, so your four-thread pool would execute jobs one at a time — and nothing would warn you." }
        },
        {
          t: "concept",
          kicker: "Cleanup",
          title: "Graceful shutdown with Drop",
          code: { src:
`impl Drop for ThreadPool {
    fn drop(&mut self) {
        // 1. Drop the sender -> recv() returns Err -> workers break out
        drop(self.sender.take());

        // 2. Wait for each worker to finish its current job
        for worker in &mut self.workers {
            println!("Shutting down worker {}", worker.id);
            if let Some(thread) = worker.thread.take() {
                thread.join().unwrap();
            }
        }
    }
}` },
          body: [
            "The <code>Option</code> wrappers around <code>sender</code> and <code>thread</code> exist so <code>drop</code> can <em>take</em> them out — you can't move a field out of <code>&amp;mut self</code>, but you can <code>Option::take()</code> it.",
            "The result: when the pool goes out of scope, in-flight requests finish, workers exit cleanly, and no thread is killed mid-response. All of it automatic, triggered by scope."
          ],
          compare: {
            note: "Every language can build a thread pool. Rust's version is notable because the compiler <em>proved</em> there are no data races in it — the <code>Arc</code>, <code>Mutex</code> and <code>Send</code> bounds aren't documentation, they're checked.",
            langs: {
              java: `ExecutorService pool = Executors.newFixedThreadPool(4);
pool.submit(() -> handleConnection(socket));
pool.shutdown();`,
              python: `with ThreadPoolExecutor(max_workers=4) as pool:
    pool.submit(handle_connection, conn)`,
              go: `// Idiomatic Go: a buffered channel as a semaphore
sem := make(chan struct{}, 4)
go func() { sem <- struct{}{}; handle(conn); <-sem }()`,
              cpp: `// No standard thread pool before C++26. Everyone writes their own.`
            }
          }
        },
        {
          t: "quiz",
          q: "Why does the worker use <code>match receiver.lock().unwrap().recv()</code> instead of <code>while let</code>?",
          options: [
            "<code>while let</code> would hold the mutex for the whole job, serialising the entire pool",
            "<code>while let</code> doesn't work with channels",
            "<code>match</code> is faster",
            "To handle the <code>Err</code> case, which <code>while let</code> can't"
          ],
          answer: 0,
          why: "Temporaries in a <code>while let</code> condition live for the entire body, so the <code>MutexGuard</code> wouldn't be released until the job finished. With <code>match</code>, the guard drops at the end of the statement, freeing other workers to grab jobs immediately. A genuinely subtle bug — and a good illustration of why understanding <code>Drop</code> timing matters."
        },
        {
          t: "swipe",
          statement: "The thread pool needs an explicit <code>shutdown()</code> call from the user.",
          answer: false,
          why: "Implementing <code>Drop</code> makes cleanup automatic when the pool goes out of scope — including on a panic. This is RAII: resources are tied to scope, so there's nothing to remember and nothing to leak."
        },
        {
          t: "order",
          prompt: "Order the graceful shutdown steps",
          pieces: ["Drop the sender", "Workers' recv() returns Err", "Each worker breaks out of its loop", "join() each worker thread"],
          answer: [0,1,2,3],
          why: "Closing the channel is the shutdown signal. Workers finish their current job, see the disconnect, and exit; <code>join</code> then waits for each to actually finish. No thread is ever killed mid-request."
        },
        {
          t: "summary",
          title: "🎉🦀 You finished the book!",
          points: [
            "You built a working multithreaded web server with <strong>no frameworks</strong>: TCP, HTTP, and your own thread pool.",
            "It used ownership, traits, closures, channels, <code>Arc</code>, <code>Mutex</code>, <code>Drop</code> and generics — almost everything in the book, together.",
            "<strong>Where next:</strong> build something real. A CLI with <code>clap</code>, a web API with <code>axum</code>, a TUI with <code>ratatui</code>, or WebAssembly with <code>wasm-bindgen</code>.",
            "<strong>Keep practising:</strong> <em>rustlings</em> (small exercises), <em>Exercism</em>, <em>Advent of Code</em>, and reading real crate source on docs.rs.",
            "<strong>Community:</strong> the official forum at users.rust-lang.org, r/rust, and the Rust Discord are all unusually welcoming to beginners."
          ]
        }
      ]
    }
  ]
};
