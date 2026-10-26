import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const registry = JSON.parse(fs.readFileSync(path.join(root,"data/unicode-library-96.lock.json"),"utf8"));
const entries = registry.categories.flatMap(c => c.articles);
const slugs = ["unicode-collation-algorithm", "accent-insensitive-text-search",
  "canonical-equivalence-text-matching", "unicode-normalization-data-consistency",
  "extended-grapheme-cluster-boundaries"];

test("Batch 7 matches positions 31–35 in 96 canonical locked URLs", () => {
  assert.equal(registry.canonicalUrlsSha256,"59d5a23d48ee7631c0653afe313444fdea2ff45cd6049b38e4076c7e0aa0e5ec");
  assert.equal(entries.length,96);
  assert.deepEqual(entries.slice(30,35).map(x=>x.slug),slugs);
  assert.ok(entries.slice(0,35).every(x=>x.status==="PUBLISHED"));
  assert.ok(entries.slice(35).every(x=>["PUBLISHED","PLANNED"].includes(x.status)));
  assert.ok(registry.categories[3].articles.every(x=>x.status==="PUBLISHED"));
  assert.equal(registry.categories[4].articles[0].slug,"extended-grapheme-cluster-boundaries");
});
test("Five reference pages: substantial, semantic, canonical, sourced, indexed, linked",() => {
  const hub=fs.readFileSync(path.join(root,"us/library/index.html"),"utf8");
  const sitemap=fs.readFileSync(path.join(root,"sitemap.xml"),"utf8");
  for(const slug of slugs) {
    const html=fs.readFileSync(path.join(root,"us",slug,"index.html"),"utf8");
    const url="https://letrasdiferentess.github.io/us/"+slug+"/";
    assert.ok(html.length>13000,slug+" research depth");
    assert.ok(html.includes('<link rel="canonical" href="'+url+'">'),slug+" canonical");
    assert.ok(html.includes('<meta name="robots" content="index,follow">'),slug+" robots");
    assert.ok(html.includes('"@type":"TechArticle"'),slug+" structured data");
    assert.ok(html.includes('href="/us/library/article.css"'),slug+" shared CSS");
    assert.ok((html.match(/<h2 id=/g)||[]).length>=10,slug+" sections");
    assert.ok(html.includes('class="toc"'),slug+" table of contents");
    assert.ok((html.match(/rel="nofollow"/g)||[]).length>=4,slug+" official sources");
    assert.ok(hub.includes('href="/us/'+slug+'/"'),slug+" correct hub link");
    assert.ok(sitemap.includes("<loc>"+url+"</loc>"),slug+" sitemap");
  }
  const num=entries.filter(x=>x.status==="PUBLISHED").length;
  assert.ok(hub.includes("<strong>"+num+"</strong>Published references"));
  if(entries.some(x=>x.status==="PLANNED"))assert.ok(hub.includes((96-num)+" planned articles"));
  assert.ok(hub.includes("10 total · 10 published"));
  assert.ok(hub.includes("8 total · 1 published · 7 planned") ||
    registry.categories[4].articles.filter(x=>x.status==="PUBLISHED").length>1);
});
test("Canonical equality differs from code-unit equality, compatibility and accent folding",()=>{
  const a="\u00E9",b="e\u0301";
  assert.notEqual(a,b);
  assert.equal(a.normalize("NFC"),b.normalize("NFC"));
  assert.equal("q\u0307\u0323".normalize("NFD"),"q\u0323\u0307");
  assert.equal("\uAC00".normalize("NFD"),"\u1100\u1161");
  assert.notEqual("𝐀".normalize("NFC"),"A");
  assert.equal("𝐀".normalize("NFKC"),"A");
  assert.notEqual("café".normalize("NFC"),"cafe");
});
test("Case and accent search require explicit sensitivity, not destructive storage",()=>{
  const base=new Intl.Collator("en",{usage:"search",sensitivity:"base"});
  const accent=new Intl.Collator("en",{usage:"search",sensitivity:"accent"});
  assert.equal(base.compare("café","cafe"),0);
  assert.notEqual(accent.compare("café","cafe"),0);
  const num=new Intl.Collator("en",{numeric:true});
  assert.deepEqual(["item10","item2"].sort(num.compare),["item2","item10"]);
  const latinKey=x=>x.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
  assert.equal(latinKey("café"),"cafe");
  assert.equal(latinKey("łódź"),"łodz");
});
test("Normalization per chunk is not globally safe",()=>{
  const pieces=["e".normalize("NFC"),"\u0301".normalize("NFC")];
  assert.equal(pieces.join(""),"e\u0301");
  assert.notEqual(pieces.join(""),pieces.join("").normalize("NFC"));
});
test("Extended grapheme segmentation handles marks, ZWJ, flags, CRLF and Hangul",()=>{
  const seg=new Intl.Segmenter("en",{granularity:"grapheme"});
  const segments=s=>[...seg.segment(s)].map(x=>x.segment);
  assert.equal(segments("e\u0301").length,1);
  assert.equal(segments("\r\n").length,1);
  assert.equal(segments("\u1100\u1161").length,1);
  assert.equal(segments("🇺🇸").length,1);
  assert.equal(segments("🇺🇸🇨").length,2);
  assert.equal(segments("👩‍💻").length,1);
  assert.equal(segments("e\u0301🇺🇸👩‍💻").length,3);
  assert.equal([...("e\u0301🇺🇸👩‍💻")].length,7);
  assert.equal(segments("AB").length,2);
});
