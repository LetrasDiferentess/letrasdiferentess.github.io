import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),"..");
const manifest=JSON.parse(fs.readFileSync(path.join(root,"data/unicode-library-96.lock.json"),"utf8"));
const rows=manifest.categories.flatMap(c=>c.articles);
const slugs=["deleting-grapheme-clusters","string-length-bytes-units-codepoints-graphemes",
  "font-coverage-unicode-support","font-fallback-mechanisms","missing-glyphs-tofu-boxes"];

test("Batch 9 preserves 96 canonical URLs and publishes locked positions 41–45",()=>{
  assert.equal(rows.length,96);
  assert.equal(manifest.canonicalUrlsSha256,"59d5a23d48ee7631c0653afe313444fdea2ff45cd6049b38e4076c7e0aa0e5ec");
  assert.deepEqual(rows.slice(40,45).map(x=>x.slug),slugs);
  assert.ok(rows.slice(0,45).every(x=>x.status==="PUBLISHED"));
  assert.ok(rows.slice(45).every(x=>["PUBLISHED","PLANNED"].includes(x.status)));
  assert.ok(manifest.categories[4].articles.every(x=>x.status==="PUBLISHED"));
  assert.ok(manifest.categories[5].articles.slice(0,3).every(x=>x.status==="PUBLISHED"));
});
test("Five deep reference articles have semantic HTML, index signals, sources and virtual-silo links",()=>{
  const hub=fs.readFileSync(path.join(root,"us/library/index.html"),"utf8");
  const sitemap=fs.readFileSync(path.join(root,"sitemap.xml"),"utf8");
  for(const slug of slugs){
    const html=fs.readFileSync(path.join(root,"us",slug,"index.html"),"utf8");
    const canonical="https://letrasdiferentess.github.io/us/"+slug+"/";
    assert.ok(html.length>=15000,slug+" substantive reference length");
    assert.ok(html.includes('<meta name="robots" content="index,follow">'),slug+" robots");
    assert.ok(html.includes('<link rel="canonical" href="'+canonical+'">'),slug+" canonical");
    assert.ok(html.includes('"@type":"TechArticle"'),slug+" TechArticle");
    assert.ok(html.includes('href="/us/library/article.css"'),slug+" shared stylesheet");
    assert.ok(html.includes('class="toc"'),slug+" article toc");
    assert.ok((html.match(/<h2 id=/g)||[]).length>=10,slug+" technical sections");
    assert.ok((html.match(/rel="nofollow"/g)||[]).length>=4,slug+" attributed external references");
    assert.ok(hub.includes('href="/us/'+slug+'/"'),slug+" linked from library");
    assert.ok(sitemap.includes("<loc>"+canonical+"</loc>"),slug+" sitemap");
  }
  const published=rows.filter(x=>x.status==="PUBLISHED").length;
  assert.ok(hub.includes('id="topic-grid"') && (hub.match(/class="topic-heading"/g)||[]).length===12);
  assert.ok(!hub.includes('planned articles'));
  assert.ok(hub.includes('>8 articles</span>'));
  const f=manifest.categories[5].articles.filter(x=>x.status==="PUBLISHED").length;
  assert.ok(hub.includes('>10 articles</span>'));
});
test("Grapheme-aware Backspace does not leave orphan marks or broken surrogate pairs",()=>{
  const segmenter=new Intl.Segmenter("en",{granularity:"grapheme"});
  const removeLastCluster=s=>{
    const parts=[...segmenter.segment(s)];
    return parts.length?s.slice(0,parts.at(-1).index):s;
  };
  assert.equal(removeLastCluster("e\u0301"),"");
  assert.equal(removeLastCluster("😀"),"");
  assert.equal(removeLastCluster("Ae\u0301🇺🇸👩‍💻"),"Ae\u0301🇺🇸");
  assert.equal(removeLastCluster("\r\n"),"");
  assert.equal(removeLastCluster("A"),"");
});
test("UTF-8 bytes, UTF-16 units, scalars and grapheme counts are different",()=>{
  const seg=new Intl.Segmenter("en",{granularity:"grapheme"});
  const tuple=s=>[new TextEncoder().encode(s).length,s.length,[...s].length,[...seg.segment(s)].length];
  assert.deepEqual(tuple("A"),[1,1,1,1]);
  assert.deepEqual(tuple("é"),[2,1,1,1]);
  assert.deepEqual(tuple("e\u0301"),[3,2,2,1]);
  assert.deepEqual(tuple("漢"),[3,1,1,1]);
  assert.deepEqual(tuple("😀"),[4,2,1,1]);
  assert.deepEqual(tuple("𝐀"),[4,2,1,1]);
  assert.deepEqual(tuple("🇺🇸"),[8,4,2,1]);
  assert.deepEqual(tuple("👩‍💻"),[11,5,3,1]);
  assert.deepEqual(tuple("\r\n"),[2,2,2,1]);
});
test("Separate font coverage and decoder replacement examples",()=>{
  assert.deepEqual([...new TextEncoder().encode("𝐀")],[0xF0,0x9D,0x90,0x80]);
  const broken=Uint8Array.of(0xC0,0xAF);
  assert.throws(()=>new TextDecoder("utf-8",{fatal:true}).decode(broken),TypeError);
  assert.ok(new TextDecoder("utf-8").decode(broken).includes("\uFFFD"));
  assert.equal("𝐀".codePointAt(0),0x1D400);
  assert.equal("𝐀".normalize("NFKC"),"A");
  assert.equal("𝐀".normalize("NFC"),"𝐀");
});
