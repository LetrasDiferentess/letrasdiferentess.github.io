import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const load=p=>fs.readFileSync(path.join(root,p),"utf8");
const manifest=JSON.parse(load("data/unicode-library-96.lock.json"));
const rows=manifest.categories.flatMap(c=>c.articles);
const slugs=[
"text-shaping-vs-glyph-rendering","ligatures-opentype-features","harfbuzz-text-shaping",
"unicode-range-font-subsetting","cross-platform-text-rendering","font-metrics-line-height",
"combining-mark-placement-fonts","clipboard-text-plain-vs-text-html",
"unicode-copy-paste-round-trips","invisible-characters-text-editors"
];
test("Batch 10 publishes exactly locked positions 46-55 and does not change 96 URL identities",()=>{
 assert.equal(rows.length,96);
 assert.deepEqual(rows.slice(45,55).map(x=>x.slug),slugs);
 assert.ok(rows.slice(0,55).every(x=>x.status==="PUBLISHED"));
 assert.ok(rows.slice(55).every(x=>x.status==="PLANNED"));
 const digest=crypto.createHash("sha256").update(rows.map(x=>x.url).join("\n")+"\n").digest("hex");
 assert.equal(digest,"59d5a23d48ee7631c0653afe313444fdea2ff45cd6049b38e4076c7e0aa0e5ec");
 assert.equal(manifest.canonicalUrlsSha256,digest);
 assert.equal(manifest.categories[5].articles.filter(x=>x.status==="PUBLISHED").length,10);
 assert.equal(manifest.categories[6].articles.filter(x=>x.status==="PUBLISHED").length,3);
});
test("Batch 10 articles are long-form technical references with unique metadata and citations",()=>{
 const hub=load("us/library/index.html"),sitemap=load("sitemap.xml");
 const titles=new Set();
 for (const slug of slugs){
  const h=load("us/"+slug+"/index.html");
  const canonical="https://letrasdiferentess.github.io/us/"+slug+"/";
  assert.ok(h.length>=15000,slug+": long-form technical reference");
  assert.ok(h.includes('<meta name="robots" content="index,follow">'),slug+": index");
  assert.ok(h.includes('<link rel="canonical" href="'+canonical+'">'),slug+": self canonical");
  assert.ok(h.includes('"@type":"TechArticle"'),slug+": structured data");
  assert.ok(h.includes('href="/us/library/article.css"'),slug+": CSS");
  assert.ok(h.includes('class="toc"'),slug+": on-page TOC");
  assert.ok((h.match(/<h2 id=/g)||[]).length>=12,slug+": technical subsections");
  assert.ok((h.match(/rel="nofollow"/g)||[]).length>=4,slug+": normative sources");
  assert.ok(h.includes('<pre><code>') && h.includes('<table>'),slug+": code and matrix");
  assert.ok(hub.includes('href="/us/'+slug+'/"'),slug+": clickable hub");
  assert.ok(sitemap.includes("<loc>"+canonical+"</loc>"),slug+": sitemap");
  assert.ok(!h.includes("utm_source")&&!h.includes("?ref="),slug+": clean links");
  const heading=h.match(/<h1>([^<]+)<\/h1>/)?.[1];
  assert.ok(heading&&!titles.has(heading),slug+": unique H1");
  titles.add(heading);
 }
 const published=rows.filter(x=>x.status==="PUBLISHED").length;
 const planned=rows.filter(x=>x.status==="PLANNED").length;
 const clipboardPublished=manifest.categories[6].articles.filter(x=>x.status==="PUBLISHED").length;
 const clipboardPlanned=manifest.categories[6].articles.length-clipboardPublished;
 assert.ok(hub.includes("<strong>"+published+"</strong>Published references"));
 assert.ok(hub.includes(planned+" planned articles"));
 assert.ok(hub.includes("10 total · 10 published"));
 assert.ok(hub.includes("9 total · "+clipboardPublished+" published"+(clipboardPlanned?" · "+clipboardPlanned+" planned":"")));
});
test("Rendering and clipboard data examples distinguish scalar identity and glyph presentation",()=>{
 assert.equal("fi".length,2);
 assert.equal("ﬁ".normalize("NFKC"),"fi");
 assert.equal("ﬁ".normalize("NFC"),"ﬁ");
 assert.equal("é".normalize("NFD"),"e\u0301");
 assert.equal("e\u0301".normalize("NFC"),"é");
 assert.equal("𝐀".normalize("NFKC"),"A");
 assert.equal("𝐀".normalize("NFC"),"𝐀");
 assert.deepEqual([...("👩\u200D💻")].map(x=>x.codePointAt(0)),[0x1F469,0x200D,0x1F4BB]);
});
test("Text inspector differentiates relevant invisible scalar values",()=>{
 const values=["\u200B","\u200C","\u200D","\u2060","\u2066","\u2067","\u2069","\uFE0F"];
 assert.deepEqual(values.map(x=>x.codePointAt(0)),[0x200B,0x200C,0x200D,0x2060,0x2066,0x2067,0x2069,0xFE0F]);
 assert.notEqual("a\u200Bb","ab");
 assert.notEqual("a\u00A0b","a b");
 const segmenter=new Intl.Segmenter("en",{granularity:"grapheme"});
 assert.equal([...segmenter.segment("e\u0301")].length,1);
});
test("Subject-specific primary terms are included in the correct article",()=>{
 const expected={
  "text-shaping-vs-glyph-rendering":["GSUB","rasterization","glyph IDs"],
  "ligatures-opentype-features":["liga","rlig","NFKC"],
  "harfbuzz-text-shaping":["hb_shape","hb_buffer","cluster"],
  "unicode-range-font-subsetting":["unicode-range","WOFF2","cmap"],
  "cross-platform-text-rendering":["HarfBuzz","pixel","fallback"],
  "font-metrics-line-height":["line-height","ascent-override","sTypoAscender"],
  "combining-mark-placement-fonts":["MarkToBase","MarkToMark","GPOS"],
  "clipboard-text-plain-vs-text-html":["text/plain","text/html","sanitiz"],
  "unicode-copy-paste-round-trips":["NFC","NFKC","U+200D"],
  "invisible-characters-text-editors":["U+200B","U+2060","U+FE0F"]
 };
 for(const [slug,terms] of Object.entries(expected)){
  const html=load("us/"+slug+"/index.html");
  for(const term of terms)assert.ok(html.includes(term),slug+" missing "+term);
 }
});
