import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "data/unicode-library-96.lock.json"), "utf8"));
const expected = [
  "mojibake-causes-diagnosis",
  "malformed-unicode-encoding-sequences",
  "unicode-escapes-json-javascript",
  "round-trip-text-encoding",
  "unicode-normalization-nfc-nfd"
];
const entries = manifest.categories.flatMap(category => category.articles);

test("batch 5 follows the locked registry and publishes 25 of 96", () => {
  assert.equal(entries.length, 96);
  assert.deepEqual(entries.slice(20,25).map(x => x.slug),expected);
  assert.ok(entries.slice(0,25).every(x => x.status === "PUBLISHED"));
  assert.ok(entries.slice(25).every(x => x.status === "PLANNED"));
  assert.equal(manifest.canonicalUrlsSha256,"59d5a23d48ee7631c0653afe313444fdea2ff45cd6049b38e4076c7e0aa0e5ec");
});
test("all five substantial pages expose canonical, TechArticle, TOC and correct silo hub links", () => {
  const hub = fs.readFileSync(path.join(root, "us/library/index.html"), "utf8");
  const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
  for (const slug of expected) {
    const html = fs.readFileSync(path.join(root,"us",slug,"index.html"),"utf8");
    const canonical="https://letrasdiferentess.github.io/us/"+slug+"/";
    assert.ok(html.length >= 13000,slug+" substantive content");
    assert.ok(html.includes('<link rel="canonical" href="'+canonical+'">'),slug+" canonical");
    assert.ok(html.includes('"@type":"TechArticle"'),slug+" structured data");
    assert.ok(html.includes('<link rel="stylesheet" href="/us/library/article.css">'),slug+" stylesheet");
    assert.ok(html.includes('class="toc"'),slug+" contents");
    assert.ok((html.match(/<h2 id=/g)||[]).length>=10,slug+" technical sections");
    assert.ok((html.match(/rel="nofollow"/g)||[]).length>=4,slug+" references");
    assert.ok(hub.includes('href="/us/'+slug+'/"'),slug+" hub");
    assert.ok(sitemap.includes("<loc>"+canonical+"</loc>"),slug+" sitemap");
  }
  assert.ok(hub.includes("<strong>25</strong>Published references"));
  assert.ok(hub.includes("71 planned articles"));
  assert.ok(hub.includes("8 total · 8 published"));
  assert.ok(hub.includes("10 total · 1 published · 9 planned"));
});
test("real mojibake and reversible codec mismatch fixture", () => {
  const original="café";
  const b=new TextEncoder().encode(original);
  assert.deepEqual([...b],[0x63,0x61,0x66,0xC3,0xA9]);
  assert.equal(new TextDecoder("windows-1252").decode(b),"cafÃ©");
  assert.equal(new TextDecoder("utf-8",{fatal:true}).decode(b),original);
  assert.equal(new TextDecoder("windows-1252").decode(new TextEncoder().encode("😀")),"ðŸ˜€");
});
test("invalid UTF-8 is rejected while chunked complete UTF-8 can be decoded", () => {
  const bad=["c0 af","e0 80 80","ed a0 80","f0 80 80 80","f4 90 80 80","f0 9f 98"];
  for(const hex of bad) {
    const b=new Uint8Array(hex.split(" ").map(x=>parseInt(x,16)));
    assert.throws(()=>new TextDecoder("utf-8",{fatal:true}).decode(b),TypeError);
  }
  const bytes=new Uint8Array([0xF0,0x9F,0x98,0x80]);
  const dec=new TextDecoder("utf-8",{fatal:true});
  assert.equal(dec.decode(bytes.slice(0,2),{stream:true})+dec.decode(bytes.slice(2),{stream:true})+dec.decode(),"😀");
  assert.equal("\uD800".isWellFormed(),false);
});
test("JSON escape forms and lone-surrogate interoperability checks", () => {
  assert.equal(JSON.parse('"\\u0041"'),"A");
  assert.equal(JSON.parse('"\\uD83D\\uDE00"'),"😀");
  assert.throws(()=>JSON.parse('"\\u{1F600}"'),SyntaxError);
  const lone=JSON.parse('"\\uDEAD"');
  assert.equal(lone.isWellFormed(),false);
  assert.equal("\uD835\uDC00",String.fromCodePoint(0x1D400));
  assert.equal(JSON.parse(JSON.stringify({text:"café 😀"})).text,"café 😀");
});
test("UTF-8 scalar sequence survives a strict round trip; NFKC does not preserve styled identity", () => {
  const value="café e\u0301 𝐀 😀";
  const raw=new TextEncoder().encode(value);
  assert.equal(new TextDecoder("utf-8",{fatal:true}).decode(raw),value);
  assert.equal("𝐀".normalize("NFKC"),"A");
  assert.equal("𝐀".normalize("NFC"),"𝐀");
  assert.equal("\u00E9"==="e\u0301",false);
});
test("NFC and NFD follow canonical decomposition, reordering and Hangul", () => {
  assert.equal("\u00E9".normalize("NFD"),"e\u0301");
  assert.equal("e\u0301".normalize("NFC"),"\u00E9");
  assert.equal("\u212B".normalize("NFD"),"A\u030A");
  assert.equal("\u212B".normalize("NFC"),"\u00C5");
  assert.equal("q\u0307\u0323".normalize("NFD"),"q\u0323\u0307");
  assert.equal("q\u0323\u0307".normalize("NFC"),"q\u0323\u0307");
  assert.equal("\uAC00".normalize("NFD"),"\u1100\u1161");
  assert.equal("\u1100\u1161".normalize("NFC"),"\uAC00");
  assert.equal("e".normalize("NFC")+"\u0301".normalize("NFC")==="e\u0301".normalize("NFC"),false);
});
