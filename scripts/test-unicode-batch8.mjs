import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const registry=JSON.parse(fs.readFileSync(path.join(root,"data/unicode-library-96.lock.json"),"utf8"));
const articles=registry.categories.flatMap(c=>c.articles);
const slugs=["unicode-word-boundary-rules","unicode-sentence-boundary-rules",
  "unicode-property-escapes-regex","unicode-aware-regex-case-matching","cursor-movement-complex-text"];

test("Batch 8 publishes exactly locked positions 36–40 without altering 96 URLs",()=>{
  assert.equal(articles.length,96);
  assert.equal(registry.canonicalUrlsSha256,"59d5a23d48ee7631c0653afe313444fdea2ff45cd6049b38e4076c7e0aa0e5ec");
  assert.deepEqual(articles.slice(35,40).map(x=>x.slug),slugs);
  assert.ok(articles.slice(0,40).every(x=>x.status==="PUBLISHED"));
  assert.ok(articles.slice(40).every(x=>["PUBLISHED","PLANNED"].includes(x.status)));
  assert.ok(registry.categories[4].articles.slice(0,6).every(x=>x.status==="PUBLISHED"));
});
test("Five deep HTML references have clean canonical, TOC, source attribution, hub and sitemap",()=>{
  const hub=fs.readFileSync(path.join(root,"us/library/index.html"),"utf8");
  const sitemap=fs.readFileSync(path.join(root,"sitemap.xml"),"utf8");
  for (const slug of slugs) {
    const html=fs.readFileSync(path.join(root,"us",slug,"index.html"),"utf8");
    const canonical="https://letrasdiferentess.github.io/us/"+slug+"/";
    assert.ok(html.length>=14000,slug+": substantive length");
    assert.ok(html.includes('<meta name="robots" content="index,follow">'),slug+": robots");
    assert.ok(html.includes('<link rel="canonical" href="'+canonical+'">'),slug+": canonical");
    assert.ok(html.includes('"@type":"TechArticle"'),slug+": TechArticle");
    assert.ok(html.includes('href="/us/library/article.css"'),slug+": shared stylesheet");
    assert.ok(html.includes('class="toc"'),slug+": table of contents");
    assert.ok((html.match(/<h2 id=/g)||[]).length>=10,slug+": technical sections");
    assert.ok((html.match(/rel="nofollow"/g)||[]).length>=4,slug+": official reference links");
    assert.ok(hub.includes('href="/us/'+slug+'/"'),slug+": hub link");
    assert.ok(sitemap.includes("<loc>"+canonical+"</loc>"),slug+": sitemap");
  }
  const published=articles.filter(x=>x.status==="PUBLISHED").length;
  const segmentPublished=registry.categories[4].articles.filter(x=>x.status==="PUBLISHED").length;
  assert.ok(hub.includes("<strong>"+published+"</strong>Published references"));
  assert.ok(hub.includes((96-published)+" planned articles"));
  assert.ok(hub.includes("8 total · "+segmentPublished+" published"));
  assert.equal(new Set(slugs).size,5);
});
test("Word segmentation provides original UTF-16 offsets and word-like markers",()=>{
  const text="Hello world";
  const seg=new Intl.Segmenter("en",{granularity:"word"});
  const parts=[...seg.segment(text)];
  assert.equal(parts.map(x=>x.segment).join(""),text);
  assert.deepEqual(parts.filter(x=>x.isWordLike).map(x=>x.segment),["Hello","world"]);
  assert.equal(parts[0].index,0);
  assert.ok(parts.every(p=>typeof p.index==="number"));
});
test("Sentence segmentation preserves original text and respects ordinary terminal punctuation",()=>{
  const text="Ready. Go now!";
  const parts=[...new Intl.Segmenter("en",{granularity:"sentence"}).segment(text)];
  assert.equal(parts.map(x=>x.segment).join(""),text);
  assert.equal(parts.length,2);
  assert.equal(parts[0].index,0);
  assert.ok(parts[1].index>parts[0].index);
});
test("Unicode property escape categories, scripts and decimal numbers",()=>{
  assert.ok(/\p{Letter}/u.test("Ж"));
  assert.ok(/\p{Script=Greek}/u.test("Ω"));
  assert.ok(!/\p{Script=Greek}/u.test("A"));
  assert.ok(/\p{Decimal_Number}/u.test("٣"));
  assert.ok(/\p{Mark}/u.test("\u0301"));
  assert.deepEqual("A Ω Ж 3".match(/\p{Letter}+/gu),["A","Ω","Ж"]);
});
test("Unicode regex simple case fold differs from legacy matching and full casefold",()=>{
  assert.ok(/k/iu.test("K"));
  assert.ok(/[a-z]/iu.test("K"));
  assert.ok(!/[a-z]/i.test("K"));
  assert.ok(!/ß/iu.test("ss"));
  assert.ok(/σ/iu.test("ς"));
  assert.equal("I".toLocaleLowerCase("tr"),"ı");
});
test("Logical caret positions follow grapheme boundaries rather than code units",()=>{
  const text="e\u0301👩‍💻A";
  const seg=new Intl.Segmenter("en",{granularity:"grapheme"});
  const offsets=[...[...seg.segment(text)].map(x=>x.index),text.length];
  assert.deepEqual(offsets,[0,2,7,8]);
  assert.equal([...text].length,6);
  assert.equal(text.length,8);
  assert.equal("👩‍💻".length,5);
  const prior=at=>offsets.filter(x=>x<at).at(-1)??0;
  const next=at=>offsets.find(x=>x>at)??text.length;
  assert.equal(prior(7),2);
  assert.equal(next(2),7);
  assert.equal([...new Intl.Segmenter("en",{granularity:"grapheme"}).segment("🇺🇸")].length,1);
});
