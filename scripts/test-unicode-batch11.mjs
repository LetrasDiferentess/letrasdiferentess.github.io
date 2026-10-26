import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const manifest=JSON.parse(read("data/unicode-library-96.lock.json"));
const rows=manifest.categories.flatMap(c=>c.articles);
const slugs=[
 "rich-text-plain-text-conversion","contenteditable-unicode-text",
 "markdown-escaping-special-characters","html-entities-vs-unicode-characters",
 "text-selection-grapheme-clusters","unicode-text-spreadsheet-import-export",
 "unicode-bidirectional-algorithm","right-to-left-text-web-interfaces",
 "bcp47-language-tags-unicode","ime-composition-events"
];
const lock="59d5a23d48ee7631c0653afe313444fdea2ff45cd6049b38e4076c7e0aa0e5ec";

test("Locked Batch 11 positions 56-65 are published and all later entries remain planned",()=>{
 assert.equal(rows.length,96);
 assert.deepEqual(rows.slice(55,65).map(x=>x.slug),slugs);
 assert.ok(rows.slice(0,65).every(x=>x.status==="PUBLISHED"));
 assert.ok(rows.slice(65).every(x=>x.status==="PLANNED"));
 assert.equal(manifest.canonicalUrlsSha256,lock);
 assert.equal(crypto.createHash("sha256").update(rows.map(x=>x.url).join("\n")+"\n").digest("hex"),lock);
 assert.equal(manifest.categories[6].articles.filter(x=>x.status==="PUBLISHED").length,9);
 assert.equal(manifest.categories[7].articles.filter(x=>x.status==="PUBLISHED").length,4);
});
test("Every Batch 11 reference has correct canonical, metadata, semantic sections and attribution",()=>{
 const hub=read("us/library/index.html"), sitemap=read("sitemap.xml");
 const titles=new Set();
 for(const slug of slugs){
  const html=read("us/"+slug+"/index.html");
  const url="https://letrasdiferentess.github.io/us/"+slug+"/";
  assert.ok(html.length>15000,slug+": substantive HTML");
  assert.ok(html.includes('<meta name="robots" content="index,follow">'),slug+": robots");
  assert.ok(html.includes('<link rel="canonical" href="'+url+'">'),slug+": self canonical");
  assert.ok(html.includes('"@type":"TechArticle"'),slug+": structured data");
  assert.ok(html.includes('href="/us/library/article.css"'),slug+": CSS");
  assert.ok(html.includes('class="toc"'),slug+": toc");
  assert.ok((html.match(/<h2 id=/g)||[]).length>=12,slug+": thematic sections");
  assert.ok((html.match(/rel="nofollow"/g)||[]).length>=4,slug+": primary references");
  assert.ok(html.includes("<pre><code>")&&html.includes("<table>"),slug+": reproducible code and matrix");
  assert.ok(hub.includes('href="/us/'+slug+'/"'),slug+": hub link");
  assert.ok(sitemap.includes("<loc>"+url+"</loc>"),slug+": sitemap");
  assert.ok(!html.includes("utm_source")&&!html.includes("?ref="),slug+": no tracking");
  const heading=html.match(/<h1>([^<]+)<\/h1>/)?.[1];
  assert.ok(heading&&!titles.has(heading),slug+": unique H1");
  titles.add(heading);
 }
 const n=rows.filter(x=>x.status==="PUBLISHED").length;
 assert.ok(hub.includes("<strong>"+n+"</strong>Published references"));
 assert.ok(hub.includes((96-n)+" planned articles"));
 assert.ok(hub.includes("9 total · 9 published"));
 assert.ok(hub.includes("9 total · 4 published · 5 planned"));
});
test("Unicode editing, normalization and grapheme fixtures remain exact",()=>{
 const s="e\u0301👩\u200D💻";
 const seg=new Intl.Segmenter("en",{granularity:"grapheme"});
 assert.equal(s.length,7);
 assert.equal([...s].length,5);
 assert.equal([...seg.segment(s)].length,2);
 assert.equal("\u00E9".normalize("NFD"),"e\u0301");
 assert.equal("ﬁ".normalize("NFKC"),"fi");
 assert.equal("＊".normalize("NFKC"),"*");
 assert.notEqual("＊","*");
 assert.deepEqual([...("👩\u200D💻")].map(x=>x.codePointAt(0)),[0x1F469,0x200D,0x1F4BB]);
});
test("BCP 47 locale tags parse to their intended components",()=>{
 const l=new Intl.Locale("sr-Latn-RS");
 assert.equal(l.language,"sr");
 assert.equal(l.script,"Latn");
 assert.equal(l.region,"RS");
 assert.equal(new Intl.Locale("en-US-u-nu-latn").numberingSystem,"latn");
});
test("CSV and HTML conversion expectations are exact and differentiated",()=>{
 const csv='"one","two,three"\r\n"emoji","😀"\r\n';
 assert.equal(new TextDecoder("utf-8",{fatal:true}).decode(new TextEncoder().encode(csv)),csv);
 assert.equal(csv.includes('"two,three"'),true);
 assert.notEqual("00123",String(Number("00123")));
 assert.equal("&copy;".normalize("NFC"),"&copy;");
 assert.equal("©".codePointAt(0),0x00A9);
});
test("All new subjects contain their domain-specific requirements",()=>{
 const cases={
  "rich-text-plain-text-conversion":["textContent","innerText","whitespace"],
  "contenteditable-unicode-text":["beforeinput","compositionstart","UTF-16"],
  "markdown-escaping-special-characters":["CommonMark","NFKC","backslash"],
  "html-entities-vs-unicode-characters":["character references","U+00A9","UTF-16"],
  "text-selection-grapheme-clusters":["UAX #29","Range","UTF-16"],
  "unicode-text-spreadsheet-import-export":["CSV","UTF-8","formula"],
  "unicode-bidirectional-algorithm":["UAX #9","LRI","RLI"],
  "right-to-left-text-web-interfaces":["dir","bdi","margin-inline-start"],
  "bcp47-language-tags-unicode":["BCP 47","Unicode locale","sr-Latn"],
  "ime-composition-events":["compositionstart","compositionend","beforeinput"]
 };
 for(const [slug,terms] of Object.entries(cases)){
  const html=read("us/"+slug+"/index.html");
  for(const term of terms)assert.ok(html.includes(term),slug+": missing "+term);
 }
});
