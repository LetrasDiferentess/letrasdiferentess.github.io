import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root,"data/unicode-library-96.lock.json"),"utf8"));
const entries = manifest.categories.flatMap(x => x.articles);
const slugs = ["unicode-normalization-nfkc-nfkd","canonical-combining-class-reordering","normalization-styled-unicode-text","unicode-case-folding","locale-sensitive-case-mapping"];

test("Batch 6 publishes exactly locked positions 26–30",()=>{
  assert.equal(entries.length,96);
  assert.deepEqual(entries.slice(25,30).map(x=>x.slug),slugs);
  assert.ok(entries.slice(0,30).every(x=>x.status==="PUBLISHED"));
  assert.ok(entries.slice(30).every(x=>["PUBLISHED","PLANNED"].includes(x.status)));
  assert.ok(manifest.categories[3].articles.slice(0,6).every(x=>x.status==="PUBLISHED"));
});
test("Every new article has semantic metadata, public canonical and correct virtual-silo link",()=>{
  const hub=fs.readFileSync(path.join(root,"us/library/index.html"),"utf8");
  const sitemap=fs.readFileSync(path.join(root,"sitemap.xml"),"utf8");
  const canonicalBase="https://letrasdiferentess.github.io/us/";
  for(const slug of slugs){
    const html=fs.readFileSync(path.join(root,"us",slug,"index.html"),"utf8");
    const canonical=canonicalBase+slug+"/";
    assert.ok(html.length>12500,slug+": substantial technical reference");
    assert.ok(html.includes('<link rel="canonical" href="'+canonical+'">'),slug+": self canonical");
    assert.ok(html.includes('"@type":"TechArticle"'),slug+": TechArticle JSON-LD");
    assert.ok(html.includes('class="toc"'),slug+": TOC");
    assert.ok(html.includes('href="/us/library/article.css"'),slug+": shared CSS");
    assert.ok((html.match(/<h2 id=/g)||[]).length>=9,slug+": deep technical sections");
    assert.ok((html.match(/rel="nofollow"/g)||[]).length>=4,slug+": outbound references");
    assert.ok(hub.includes('href="/us/'+slug+'/"'),slug+": published silo link");
    assert.ok(sitemap.includes("<loc>"+canonical+"</loc>"),slug+": sitemap");
  }
  assert.ok(hub.includes("<strong>"+entries.filter(x=>x.status==="PUBLISHED").length+"</strong>Published references"));
  assert.ok(hub.includes((96-entries.filter(x=>x.status==="PUBLISHED").length)+" planned articles"));
  assert.ok(hub.includes("10 total · "+manifest.categories[3].articles.filter(x=>x.status==="PUBLISHED").length+" published"));
});
test("NFKC/NFKD compatibility mappings preserve exact fraction slash",()=>{
  assert.equal("𝐀".normalize("NFC"),"𝐀");
  assert.equal("𝐀".normalize("NFKC"),"A");
  assert.equal("𝒜".normalize("NFKC"),"A");
  assert.equal("ℬ".normalize("NFKC"),"B");
  assert.equal("Ａ".normalize("NFKC"),"A");
  assert.equal("①".normalize("NFKC"),"1");
  assert.equal("²".normalize("NFKC"),"2");
  assert.equal("ﬁ".normalize("NFKC"),"fi");
  assert.equal("½".normalize("NFKC"),"1\u20442");
  assert.equal("é".normalize("NFKD"),"e\u0301");
});
test("Canonical ordering is stable for equal CCC values",()=>{
  assert.equal("q\u0307\u0323".normalize("NFD"),"q\u0323\u0307");
  assert.equal("q\u0301\u0300".normalize("NFD"),"q\u0301\u0300");
  assert.equal("e\u0301".normalize("NFC"),"\u00E9");
  assert.equal("x\u0332".normalize("NFKC"),"x\u0332");
});
test("Styled normalization removes only defined compatibility distinctions",()=>{
  const values=["𝐀","𝒜","ℬ","Ａ","ⓐ","²"];
  const folded=values.map(x=>x.normalize("NFKC"));
  assert.deepEqual(folded,["A","A","B","A","a","2"]);
  assert.equal("𝐀".normalize("NFC"),"𝐀");
  assert.equal("x\u0332".normalize("NFKC"),"x\u0332");
});
test("Casefold comparison differs from naive lowercase and contextual sigma",()=>{
  assert.notEqual("Straße".toLowerCase(),"STRASSE".toLowerCase());
  assert.equal("ΟΣ".toLowerCase(),"ος");
  assert.equal("ΟΣΑ".toLowerCase(),"οσα");
  assert.equal("Σ".toLowerCase(),"σ");
  assert.equal("İ".toLowerCase(),"i\u0307");
});
test("JavaScript locale-sensitive casing handles Turkish and Lithuanian",()=>{
  assert.equal("I".toLowerCase(),"i");
  assert.equal("I".toLocaleLowerCase("tr"),"ı");
  assert.equal("i".toLocaleUpperCase("tr"),"İ");
  assert.equal("İ".toLocaleLowerCase("tr"),"i");
  assert.equal("I\u0301".toLocaleLowerCase("lt"),"i\u0307\u0301");
});
