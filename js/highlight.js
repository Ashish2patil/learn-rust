/* Tiny multi-language syntax highlighter (no dependencies). */
const KW = {
  rust: ["as","async","await","break","const","continue","crate","dyn","else","enum","extern","false","fn","for","if","impl","in","let","loop","match","mod","move","mut","pub","ref","return","self","Self","static","struct","super","trait","true","type","unsafe","use","where","while","union"],
  python: ["and","as","assert","async","await","break","class","continue","def","del","elif","else","except","False","finally","for","from","global","if","import","in","is","lambda","None","nonlocal","not","or","pass","raise","return","True","try","while","with","yield","match","case","self"],
  c: ["auto","break","case","char","const","continue","default","do","double","else","enum","extern","float","for","goto","if","int","long","register","return","short","signed","sizeof","static","struct","switch","typedef","union","unsigned","void","volatile","while","NULL","bool","true","false"],
  cpp: ["auto","break","case","catch","class","const","constexpr","continue","default","delete","do","double","else","enum","explicit","export","extern","false","float","for","friend","goto","if","inline","int","long","mutable","namespace","new","nullptr","operator","private","protected","public","return","short","signed","sizeof","static","struct","switch","template","this","throw","true","try","typedef","typename","union","unsigned","using","virtual","void","volatile","while","bool","char"],
  go: ["break","case","chan","const","continue","default","defer","else","fallthrough","for","func","go","goto","if","import","interface","map","package","range","return","select","struct","switch","type","var","nil","true","false","string","int","int32","int64","float64","bool","byte","rune","error","make","append","len","cap"],
  java: ["abstract","boolean","break","byte","case","catch","char","class","const","continue","default","do","double","else","enum","extends","final","finally","float","for","if","implements","import","instanceof","int","interface","long","native","new","null","package","private","protected","public","return","short","static","super","switch","synchronized","this","throw","throws","transient","true","false","try","void","volatile","while","var","record","sealed","yield"],
  js: ["async","await","break","case","catch","class","const","continue","default","delete","do","else","export","extends","false","finally","for","from","function","if","import","in","instanceof","let","new","null","of","return","super","switch","this","throw","true","try","typeof","undefined","var","void","while","yield"],
  toml: ["true","false"],
  text: []
};
const ALIAS = { rs:"rust", py:"python", "c++":"cpp", cxx:"cpp", golang:"go", sh:"text", bash:"text", output:"text", console:"text", err:"text", toml:"toml", js:"js", ts:"js" };

const esc = (s) => s.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");

export function normLang(lang){
  const l = String(lang || "rust").toLowerCase();
  return ALIAS[l] || (KW[l] ? l : "text");
}

export function highlight(code, lang){
  const L = normLang(lang);
  if (L === "text") return esc(code);
  const kws = new Set(KW[L]);
  const hashComment = L === "python" || L === "toml";
  const parts = [
    hashComment ? "(#[^\\n]*)" : "(\\/\\/[^\\n]*|\\/\\*[\\s\\S]*?\\*\\/)",
    "(\"(?:\\\\.|[^\"\\\\\\n])*\"|'(?:\\\\.|[^'\\\\\\n])*'|`(?:\\\\.|[^`\\\\])*`)",
    "(^[ \\t]*#\\w+)",                       // C/C++ preprocessor, Rust attributes handled below
    "(#!?\\[[^\\]]*\\])",                    // rust attribute
    "([A-Za-z_]\\w*!)",                      // macro!
    "(\\b\\d[\\w.]*\\b)",                    // numbers
    "([A-Za-z_]\\w*)(?=\\s*\\()",            // function call
    "(\\b[A-Za-z_]\\w*\\b)"                  // identifier / keyword
  ];
  const re = new RegExp(parts.join("|"), "gm");
  let out = "", last = 0, m;
  while ((m = re.exec(code)) !== null){
    out += esc(code.slice(last, m.index));
    last = re.lastIndex;
    const [full, com, str, pre, attr, mac, num, fn, id] = m;
    if (com) out += `<span class="tok-c">${esc(com)}</span>`;
    else if (str) out += `<span class="tok-s">${esc(str)}</span>`;
    else if (pre) out += `<span class="tok-m">${esc(pre)}</span>`;
    else if (attr) out += `<span class="tok-m">${esc(attr)}</span>`;
    else if (mac) out += `<span class="tok-m">${esc(mac)}</span>`;
    else if (num) out += `<span class="tok-n">${esc(num)}</span>`;
    else if (fn) out += kws.has(fn) ? `<span class="tok-k">${esc(fn)}</span>` : `<span class="tok-f">${esc(fn)}</span>`;
    else if (id){
      if (kws.has(id)) out += `<span class="tok-k">${esc(id)}</span>`;
      else if (/^[A-Z]/.test(id)) out += `<span class="tok-t">${esc(id)}</span>`;
      else out += esc(id);
    } else out += esc(full);
  }
  out += esc(code.slice(last));
  return out;
}

export const LANG_LABEL = {
  rust:"Rust", python:"Python", c:"C", cpp:"C++", go:"Go", java:"Java", js:"JavaScript",
  toml:"TOML", text:"Output"
};
