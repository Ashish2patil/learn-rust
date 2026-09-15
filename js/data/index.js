import ch0  from "./ch00.js";
import ch1  from "./ch01.js";
import ch2  from "./ch02.js";
import ch3  from "./ch03.js";
import ch4  from "./ch04.js";
import ch5  from "./ch05.js";
import ch6  from "./ch06.js";
import ch7  from "./ch07.js";
import ch8  from "./ch08.js";
import ch9  from "./ch09.js";
import ch10 from "./ch10.js";
import ch11 from "./ch11.js";
import ch12 from "./ch12.js";
import ch13 from "./ch13.js";
import ch14 from "./ch14.js";
import ch15 from "./ch15.js";
import ch16 from "./ch16.js";
import ch17 from "./ch17.js";
import ch18 from "./ch18.js";
import ch19 from "./ch19.js";
import ch20 from "./ch20.js";
import ch21 from "./ch21.js";

export const course = [ch0,ch1,ch2,ch3,ch4,ch5,ch6,ch7,ch8,ch9,ch10,ch11,ch12,ch13,ch14,ch15,ch16,ch17,ch18,ch19,ch20,ch21];

export const PARTS = [
  { label: "Before you start",            chapters: [0] },
  { label: "Getting going",               chapters: [1,2,3] },
  { label: "The big idea: ownership",     chapters: [4,5,6] },
  { label: "Organising & handling data",  chapters: [7,8,9] },
  { label: "Writing reusable, safe code", chapters: [10,11,12] },
  { label: "Thinking in Rust",            chapters: [13,14,15] },
  { label: "Concurrency & abstraction",   chapters: [16,17,18] },
  { label: "Advanced Rust",               chapters: [19,20] },
  { label: "Final project",               chapters: [21] }
];

export function allLessons(){
  return course.flatMap(c => c.lessons.map(l => ({ ...l, chapterId: c.id, chapterTitle: c.title })));
}

export function findLesson(id){
  for (const chapter of course){
    const lesson = chapter.lessons.find(l => l.id === id);
    if (lesson) return { chapter, lesson };
  }
  return null;
}
