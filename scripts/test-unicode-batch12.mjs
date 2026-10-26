import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import {fileURLToPath} from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const read=p=>fs.readFileSync(path.join(root,p),"utf8");
const registry=JSON.parse(read("data/unicode-library-96.lock.json"));
const rows=registry.categories.flatMap(c=>c.articles);
const lock="59d5a23d48ee7631c0653afe313444fdea2ff45cd6049b38e4076c7e0aa0e5ec";
const slugs=[
 "dead-keys-combining-character-input","transliteration-vs-script-conversion",
 "mixed-script-text-processing","unicode-line-breaking-scripts",
 "vertical-writing-systems-web","emoji-vs-text-presentation",
 "emoji-variation-selectors","emoji-zwj-sequences",
 "emoji-skin-tone-modifiers","regional-indicator-flag-sequences"
];

test("Batch 12 publishes only canonical positions 66–75 and retains the locked hash",()=>{
 assert.equal(rows.length,96);
 assert.deepEqual(rows.slice(65,75).map(x=>x.slug),slugs);
 assert.ok(rows.slice(0,75).every(x=>x.status==="PUBLISHED"));
 assert.ok(rows.slice(75).every(x=>x.status==="PLANNED"));
 assert.equal(registry.canonicalUrlsSha256,lock);
 const digest=crypto.createHash("sha256").update(rows.map(x=>x.url).join("\n")+"\n").digest("hex");
 assert.equal(digest,lock);
 assert.equal(registry.categories.length,12);
 assert.equal(registry.categories[7].articles.filter(x=>x.status==="PUBLISHED").length,9);
 assert.equal(registry.categories[8].articles.filter(x=>x.status==="PUBLISHED").length,5);
});
test("All ten articles include technical structure, standards, new hub links and sitemaps",()=>{
 const hub=read("us/library/index.html"),sitemap=read("sitemap.xml");
 const titles=new Set();
 for(const slug of slugs){
  const html=read("us/"+slug+"/index.html");
  const canonical="https://letrasdiferentess.github.io/us/"+slug+"/";
  assert.ok(html.length>15000,slug+": technical depth");
  assert.ok(html.includes('<meta name="robots" content="index,follow">'),slug+": indexability");
  assert.ok(html.includes('<link rel="canonical" href="'+canonical+'">'),slug+": self-canonical");
  assert.ok(html.includes('"@type":"TechArticle"'),slug+": structured metadata");
  assert.ok(html.includes('href="/us/library/article.css"'),slug+": shared stylesheet");
  assert.ok(html.includes('class="toc"'),slug+": table of contents");
  assert.ok((html.match(/<h2 id=/g)||[]).length>=13,slug+": sections");
  assert.ok((html.match(/rel="nofollow"/g)||[]).length>=4,slug+": sources");
  assert.ok(html.includes("<pre><code>")&&html.includes("<table>"),slug+": executable examples and matrices");
  assert.ok(hub.includes('href="/us/'+slug+'/"'),slug+": virtual silo link");
  assert.ok(sitemap.includes("<loc>"+canonical+"</loc>"),slug+": sitemap canonical");
  assert.ok(!html.includes("?utm_source")&&!html.includes("?ref=chatgpt"),slug+": no tracking");
  const title=html.match(/<h1>([^<]+)<\/h1>/)?.[1];
  assert.ok(title&&!titles.has(title),slug+": distinct H1");
  titles.add(title);
 }
 const published=rows.filter(x=>x.status==="PUBLISHED").length;
 assert.equal(published,75);
 assert.ok(hub.includes("<strong>"+published+"</strong>Published references"));
 assert.ok(hub.includes((96-published)+" planned articles"));
 assert.ok(hub.includes("9 total · 9 published"));
 assert.ok(hub.includes("6 total · 5 published · 1 planned"));
});
test("Dead keys, normalization, compatibility and script properties remain distinct",()=>{
 assert.equal("e\u0301".normalize("NFC"),"é");
 assert.equal("é".normalize("NFD"),"e\u0301");
 assert.equal("Ａ".normalize("NFKC"),"A");
 assert.notEqual("Α","A");
 assert.notEqual("a","\u0430");
 assert.ok(/\p{Script=Greek}/u.test("α"));
 assert.ok(/\p{Script=Cyrillic}/u.test("\u0430"));
 const seq="a\u0323\u0301";
 assert.equal(seq.normalize("NFD"),seq);
});
test("Emoji presentation selectors are encoded scalars preserved under NFC",()=>{
 const forms=["\u2764","\u2764\uFE0E","\u2764\uFE0F"];
 assert.deepEqual(forms.map(s=>[...s].map(c=>c.codePointAt(0))),[
  [0x2764],[0x2764,0xFE0E],[0x2764,0xFE0F]
 ]);
 assert.ok(forms.every(s=>s.normalize("NFC")===s));
 assert.notEqual(forms[1],forms[2]);
});
test("Emoji ZWJ, modifier and flag test vectors distinguish units, scalars and clusters",()=>{
 const seg=new Intl.Segmenter("en",{granularity:"grapheme"});
 const info=s=>({
  units:s.length,
  scalars:[...s].map(c=>c.codePointAt(0)),
  graphemes:[...seg.segment(s)].length
 });
 assert.deepEqual(info("👩\u200D💻"),{units:5,scalars:[0x1F469,0x200D,0x1F4BB],graphemes:1});
 assert.deepEqual(info("👍🏻"),{units:4,scalars:[0x1F44D,0x1F3FB],graphemes:1});
 assert.deepEqual(info("🇺🇸"),{units:4,scalars:[0x1F1FA,0x1F1F8],graphemes:1});
 assert.equal(info("🇺🇸🇨🇦").graphemes,2);
 assert.equal(info("🇺🇸🇨").graphemes,2);
});
test("Subject-specific standards concepts appear in their correct references",()=>{
 const requirements={
  "dead-keys-combining-character-input":["U+0301","NFC","keydown"],
  "transliteration-vs-script-conversion":["transliteration","NFKC","Cyrillic"],
  "mixed-script-text-processing":["Script_Extensions","UTS #39","Script=Cyrillic"],
  "unicode-line-breaking-scripts":["UAX #14","overflow-wrap","Thai"],
  "vertical-writing-systems-web":["vertical-rl","text-orientation","text-combine-upright"],
  "emoji-vs-text-presentation":["Emoji_Presentation","U+FE0E","U+FE0F"],
  "emoji-variation-selectors":["VS15","VS16","U+FE0F"],
  "emoji-zwj-sequences":["U+200D","RGI","U+1F469"],
  "emoji-skin-tone-modifiers":["U+1F3FB","Emoji_Modifier_Base","Fitzpatrick"],
  "regional-indicator-flag-sequences":["U+1F1FA","U+1F1F8","ISO 3166"]
 };
 for(const [slug,terms] of Object.entries(requirements)){
  const html=read("us/"+slug+"/index.html");
  for(const term of terms)assert.ok(html.includes(term),slug+": missing "+term);
 }
});
