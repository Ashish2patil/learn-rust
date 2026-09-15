/* Progress persistence. Degrades gracefully when storage is unavailable. */
const KEY = "rustling.v1";
const blank = () => ({ xp:0, done:{}, scores:{}, seenCards:{}, streak:0, lastDay:null, theme:"dark" });

let mem = blank();
let usable = true;

function read(){
  try{
    const raw = localStorage.getItem(KEY);
    if (raw) mem = Object.assign(blank(), JSON.parse(raw));
  }catch(e){ usable = false; }
  return mem;
}
function write(){
  if (!usable) return;
  try{ localStorage.setItem(KEY, JSON.stringify(mem)); }catch(e){ usable = false; }
}
read();

export const store = {
  get state(){ return mem; },
  get xp(){ return mem.xp; },
  addXp(n){ mem.xp += n; write(); },
  isDone(lessonId){ return !!mem.done[lessonId]; },
  score(lessonId){ return mem.scores[lessonId] || null; },
  completeLesson(lessonId, correct, total){
    const prev = mem.scores[lessonId];
    if (!prev || correct > prev.correct) mem.scores[lessonId] = { correct, total };
    mem.done[lessonId] = true;
    touchStreak();
    write();
  },
  reset(){ mem = blank(); write(); },
  get theme(){ return mem.theme; },
  setTheme(t){ mem.theme = t; write(); }
};

function touchStreak(){
  const today = new Date().toISOString().slice(0,10);
  if (mem.lastDay === today) return;
  const y = new Date(Date.now() - 864e5).toISOString().slice(0,10);
  mem.streak = mem.lastDay === y ? mem.streak + 1 : 1;
  mem.lastDay = today;
}
