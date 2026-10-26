import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=relative=>fs.readFileSync(path.join(root,relative),"utf8");
const manifest=JSON.parse(read("data/unicode-library-96.lock.json"));
const rows=manifest.categories.flatMap(category=>category.articles);
const lockedDigest="59d5a23d48ee7631c0653afe313444fdea2ff45cd6049b38e4076c7e0aa0e5ec";
const slugs=[
 "emoji-names-assistive-technology","bidirectional-text-accessibility",
 "visual-vs-accessible-text-meaning","javascript-strings-code-points",
 "javascript-intl-segmenter","python-unicodedata","icu-unicode-text-apis",
 "unicode-safe-string-truncation","unicode-input-validation",
 "unicode-regression-test-cases","text-interoperability-test-checklist"
];

test("Final Batch 14 completes precisely all 96 locked canonical URLs",()=>{
 assert.equal(manifest.categories.length,12);
 assert.equal(rows.length,96);
 assert.deepEqual(rows.slice(85,96).map(r=>r.slug),slugs);
 assert.ok(rows.every(r=>r.status==="PUBLISHED"));
 assert.equal(rows.filter(r=>r.status==="PLANNED").length,0);
 assert.ok(rows.every(r=>r.url==="https://letrasdiferentess.github.io/us/"+r.slug+"/"));
 assert.equal(manifest.canonicalUrlsSha256,lockedDigest);
 assert.equal(crypto.createHash("sha256").update(rows.map(r=>r.url).join("\n")+"\n").digest("hex"),lockedDigest);
 assert.equal(manifest.categories[10].articles.filter(x=>x.status==="PUBLISHED").length,5);
 assert.equal(manifest.categories[11].articles.filter(x=>x.status==="PUBLISHED").length,8);
});

test("All 96 published pages exist with exact canonical, title, H1, hub and sitemap entries",()=>{
 const hub=read("us/library/index.html"),sitemap=read("sitemap.xml");
 const allH1=new Set();
 for(const row of rows){
  const file="us/"+row.slug+"/index.html";
  assert.ok(fs.existsSync(path.join(root,file)),row.slug+": file exists");
  const html=read(file),canonical=row.url;
  assert.ok(html.includes('<link rel="canonical" href="'+canonical+'">'),row.slug+": self-canonical");
  assert.ok(html.includes('<meta name="robots" content="index,follow">'),row.slug+": indexable");
  assert.ok(hub.includes('href="/us/'+row.slug+'/"'),row.slug+": linked from library hub");
  assert.ok(sitemap.includes("<loc>"+canonical+"</loc>"),row.slug+": sitemap inclusion");
  assert.ok(html.includes("<h1>")&&html.includes("<title>"),row.slug+": document identity");
  const head=html.match(/<h1>([^<]+)<\/h1>/)?.[1];
  assert.ok(head&&!allH1.has(head),row.slug+": unique H1");
  allH1.add(head);
 }
 assert.equal(allH1.size,96);
 assert.ok(hub.includes("<strong>96</strong>Published references"));
 assert.ok(hub.includes("All 96 independently referenced technical articles"));
 assert.ok(!hub.includes("11 planned articles"));
 for(const category of manifest.categories){
  assert.ok(category.articles.every(x=>x.status==="PUBLISHED"),category.id+": complete");
  assert.ok(hub.includes('id="'+category.id+'"'),category.id+": category anchor");
 }
 assert.ok(hub.includes("5 total · 5 published"));
 assert.ok(hub.includes("8 total · 8 published"));
});

test("The final 11 long-form references include verifiable technical substance and accessibility metadata",()=>{
 const titles=new Set();
 for(const slug of slugs){
  const html=read("us/"+slug+"/index.html");
  assert.ok(html.length>=16000,slug+": long-form article");
  assert.ok(html.includes('"@type":"TechArticle"'),slug+": TechArticle metadata");
  assert.ok(html.includes('href="/us/library/article.css"'),slug+": shared CSS");
  assert.ok(html.includes('class="toc"'),slug+": TOC");
  assert.ok((html.match(/<h2 id=/g)||[]).length>=13,slug+": topic sections");
  assert.ok((html.match(/rel="nofollow"/g)||[]).length>=4,slug+": authoritative external sources");
  assert.ok(html.includes("<pre><code>")&&html.includes("<table>"),slug+": working example and comparison matrix");
  assert.ok(!html.includes("utm_source=")&&!html.includes("?ref=chatgpt"),slug+": no tracking");
  const title=html.match(/<h1>([^<]+)<\/h1>/)?.[1];
  assert.ok(title&&!titles.has(title),slug+": unique H1");
  titles.add(title);
 }
});

test("JS code points, UTF-16 units, grapheme clusters and UTF-8 byte lengths differ",()=>{
 const sample="A😀e\u0301";
 assert.equal(sample.length,5);
 assert.equal([...sample].length,4);
 assert.equal(new TextEncoder().encode(sample).length,8);
 const seg=new Intl.Segmenter("en",{granularity:"grapheme"});
 assert.equal([...seg.segment(sample)].length,3);
 assert.equal([...seg.segment("👩\u200D💻")].length,1);
 assert.deepEqual([...("👩\u200D💻")].map(c=>c.codePointAt(0)),[0x1F469,0x200D,0x1F4BB]);
 assert.equal(String.fromCodePoint(0x1F600),"😀");
});

test("Normalization and well-formedness must be distinct from glyph appearance",()=>{
 assert.equal("e\u0301".normalize("NFC"),"é");
 assert.equal("é".normalize("NFD"),"e\u0301");
 assert.equal("𝐀".normalize("NFKC"),"A");
 assert.equal("𝐀".normalize("NFC"),"𝐀");
 assert.equal("a"==="\u0430",false);
 assert.equal("👩\u200D💻".normalize("NFC"),"👩\u200D💻");
 if(typeof "".isWellFormed==="function"){
  assert.ok(!"\uD800".isWellFormed());
  assert.equal("\uD800".toWellFormed(),"\uFFFD");
 }
});

test("Every final article covers its distinctive Unicode API or accessibility requirement",()=>{
 const terms={
  "emoji-names-assistive-technology":["CLDR","U+FE0F","screen reader"],
  "bidirectional-text-accessibility":["UAX #9","dir","bdi"],
  "visual-vs-accessible-text-meaning":["accessible name","U+1D400","U+0430"],
  "javascript-strings-code-points":["UTF-16","codePointAt","TextEncoder"],
  "javascript-intl-segmenter":["Intl.Segmenter","isWordLike","UTF-16"],
  "python-unicodedata":["unicodedata.normalize","unidata_version","combining"],
  "icu-unicode-text-apis":["Normalizer2","BreakIterator","Collator"],
  "unicode-safe-string-truncation":["Intl.Segmenter","TextEncoder","UTF-8"],
  "unicode-input-validation":["UAX #31","UTS #39","textContent"],
  "unicode-regression-test-cases":["NormalizationTest.txt","GraphemeBreakTest","BidiTest"],
  "text-interoperability-test-checklist":["UTS #39","Clipboard","UTF-8"]
 };
 for(const [slug,needed] of Object.entries(terms)){
  const html=read("us/"+slug+"/index.html");
  for(const term of needed)assert.ok(html.includes(term),slug+": missing "+term);
 }
});
