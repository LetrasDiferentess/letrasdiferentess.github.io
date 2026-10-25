import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const manifest = JSON.parse(fs.readFileSync(path.join(root, "data/unicode-library-96.lock.json"), "utf8"));
const slugs = ["decorative-unicode-text-compatibility", "utf8-byte-sequences", "utf16-surrogate-pairs", "utf32-scalar-value-storage", "byte-order-marks-endianness"];
const entries = manifest.categories.flatMap(cat => cat.articles);

test("batch 4 has exactly five new published registry records without changing earlier 15", () => {
  assert.equal(entries.length, 96);
  assert.deepEqual(entries.slice(15, 20).map(x => x.slug), slugs);
  assert.ok(entries.slice(0, 20).every(x => x.status === "PUBLISHED"));
  assert.ok(entries.slice(20).every(x => x.status === "PLANNED"));
});
test("all five research pages are substantial, semantic and linked in the correct category", () => {
  const hub = fs.readFileSync(path.join(root, "us/library/index.html"), "utf8");
  const sitemap = fs.readFileSync(path.join(root, "sitemap.xml"), "utf8");
  for (const slug of slugs) {
    const file = path.join(root, "us", slug, "index.html");
    assert.ok(fs.existsSync(file), slug);
    const html = fs.readFileSync(file, "utf8");
    const canonical = "https://letrasdiferentess.github.io/us/" + slug + "/";
    assert.ok(html.includes('<link rel="canonical" href="' + canonical + '">'), slug + " canonical");
    assert.ok(html.includes('"@type":"TechArticle"'), slug + " TechArticle");
    assert.ok(html.includes('href="/us/library/article.css"'), slug + " shared stylesheet");
    assert.ok(html.includes('class="toc"'), slug + " table of contents");
    assert.ok((html.match(/<h2 id=/g) || []).length >= 9, slug + " technical sections");
    assert.ok(html.length > 11000, slug + " substantive content");
    assert.ok((html.match(/rel="nofollow"/g) || []).length >= 4, slug + " references");
    assert.ok(hub.includes('href="/us/' + slug + '/"'), slug + " hub link");
    assert.ok(sitemap.includes('<loc>' + canonical + '</loc>'), slug + " sitemap");
  }
  assert.match(hub, /20<\/strong>Published references/);
  assert.match(hub, /76 planned articles/);
});
test("UTF-8 vectors and strict error policy", () => {
  const encode = s => Array.from(new TextEncoder().encode(s), x => x.toString(16).padStart(2, "0")).join(" ");
  assert.equal(encode("Aé€😀𝐀"), "41 c3 a9 e2 82 ac f0 9f 98 80 f0 9d 90 80");
  for (const b of [[0xC0,0xAF],[0xED,0xA0,0x80],[0xF4,0x90,0x80,0x80],[0xE2,0x82]]) {
    assert.throws(() => new TextDecoder("utf-8",{fatal:true}).decode(new Uint8Array(b)), TypeError);
  }
  const bytes = new TextEncoder().encode("😀");
  const decoder = new TextDecoder("utf-8", {fatal:true});
  assert.equal(decoder.decode(bytes.slice(0,2),{stream:true})+decoder.decode(bytes.slice(2),{stream:true})+decoder.decode(),"😀");
});
test("UTF-16 surrogate pairs reconstruct precise supplementary scalars", () => {
  const pair = cp => {
    const v=cp-0x10000; return [0xD800+(v>>10),0xDC00+(v&0x3FF)];
  };
  assert.deepEqual(pair(0x10000),[0xD800,0xDC00]);
  assert.deepEqual(pair(0x1F600),[0xD83D,0xDE00]);
  assert.deepEqual(pair(0x1D400),[0xD835,0xDC00]);
  assert.deepEqual(pair(0x10FFFF),[0xDBFF,0xDFFF]);
  assert.equal("😀".length,2);
  assert.equal("\uD83D".isWellFormed(),false);
  assert.equal("\uD83D".toWellFormed(),"\uFFFD");
});
test("UTF-32LE and UTF-32BE scalar representations", () => {
  const serialize = (value, little) => {
    const b = new ArrayBuffer(4);
    new DataView(b).setUint32(0,value,little);
    return Array.from(new Uint8Array(b),x=>x.toString(16).padStart(2,"0")).join(" ");
  };
  assert.equal(serialize(0x41,false),"00 00 00 41");
  assert.equal(serialize(0x41,true),"41 00 00 00");
  assert.equal(serialize(0x1D400,false),"00 01 d4 00");
  assert.equal(serialize(0x1F600,true),"00 f6 01 00");
  const valid = cp => cp<=0x10FFFF && !(cp>=0xD800&&cp<=0xDFFF);
  assert.ok(valid(0xFFFF)); // Noncharacter remains a valid scalar
  assert.ok(!valid(0xD800));
  assert.ok(!valid(0x110000));
});
test("BOM bytes and decoding behavior", () => {
  const bytes = new Uint8Array([0xEF,0xBB,0xBF,0x41]);
  assert.equal(new TextDecoder("utf-8").decode(bytes),"A");
  assert.equal(new TextDecoder("utf-8",{ignoreBOM:true}).decode(bytes),"\uFEFFA");
  assert.deepEqual([0xFF,0xFE,0x00,0x00].slice(0,2),[0xFF,0xFE]); // UTF-32LE has a UTF-16LE prefix
});
test("NFKC compatibility folding may discard decorative identity", () => {
  assert.equal("𝐀".normalize("NFKC"),"A");
  assert.equal("Ａ".normalize("NFKC"),"A");
  assert.equal("①".normalize("NFKC"),"1");
  assert.equal("𝐀".normalize("NFC"),"𝐀");
});