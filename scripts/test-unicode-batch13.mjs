import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import {fileURLToPath} from 'node:url';

const root=path.resolve(path.dirname(fileURLToPath(import.meta.url)),'..');
const read=p=>fs.readFileSync(path.join(root,p),'utf8');
const registry=JSON.parse(read('data/unicode-library-96.lock.json'));
const rows=registry.categories.flatMap(c=>c.articles);
const hash='59d5a23d48ee7631c0653afe313444fdea2ff45cd6049b38e4076c7e0aa0e5ec';
const slugs=[
 'emoji-rendering-compatibility','unicode-confusables-lookalikes',
 'unicode-homograph-attacks','mixed-script-identifier-detection',
 'invisible-character-spoofing','unicode-identifier-security-profiles',
 'idna-internationalized-domain-names','displaying-untrusted-unicode-safely',
 'screen-readers-styled-unicode','accessible-alternatives-decorative-text'
];

test('Batch 13 preserves 96 locked URL identities and publishes exactly #76–85',()=>{
 assert.equal(rows.length,96);
 assert.deepEqual(rows.slice(75,85).map(x=>x.slug),slugs);
 assert.ok(rows.slice(0,85).every(x=>x.status==='PUBLISHED'));
 assert.ok(rows.slice(85).every(x=>['PUBLISHED','PLANNED'].includes(x.status)));
 assert.equal(registry.canonicalUrlsSha256,hash);
 assert.equal(crypto.createHash('sha256').update(rows.map(x=>x.url).join('\n')+'\n').digest('hex'),hash);
 assert.equal(registry.categories[8].articles.filter(x=>x.status==='PUBLISHED').length,6);
 assert.equal(registry.categories[9].articles.filter(x=>x.status==='PUBLISHED').length,7);
 assert.ok(registry.categories[10].articles.slice(0,2).every(x=>x.status==='PUBLISHED'));
});
test('All 10 Batch 13 TechArticle pages have published hub links, self canonicals and primary references',()=>{
 const hub=read('us/library/index.html'),sitemap=read('sitemap.xml');
 const names=new Set();
 for(const slug of slugs){
  const html=read('us/'+slug+'/index.html');
  const canonical='https://letrasdiferentess.github.io/us/'+slug+'/';
  assert.ok(html.length>=15500,slug+': substantive long-form technical reference');
  assert.ok(html.includes('<meta name="robots" content="index,follow">'),slug+': robots');
  assert.ok(html.includes('<link rel="canonical" href="'+canonical+'">'),slug+': self-canonical');
  assert.ok(html.includes('"@type":"TechArticle"'),slug+': technical metadata');
  assert.ok(html.includes('href="/us/library/article.css"'),slug+': shared styles');
  assert.ok(html.includes('class="toc"'),slug+': table of contents');
  assert.ok((html.match(/<h2 id=/g)||[]).length>=12,slug+': substantive sections');
  assert.ok((html.match(/rel="nofollow"/g)||[]).length>=4,slug+': authoritative source references');
  assert.ok(html.includes('<pre><code>')&&html.includes('<table>'),slug+': code and evidence matrix');
  assert.ok(hub.includes('href="/us/'+slug+'/"'),slug+': hub category link');
  assert.ok(sitemap.includes('<loc>'+canonical+'</loc>'),slug+': sitemap');
  assert.ok(!html.includes('?utm_source=')&&!html.includes('?ref=chatgpt'),slug+': clean URLs');
  const h1=html.match(/<h1>([^<]+)<\/h1>/)?.[1];
  assert.ok(h1&&!names.has(h1),slug+': unique H1');
  names.add(h1);
 }
 assert.ok(hub.includes('id="topic-grid"') && (hub.match(/class="topic-heading"/g)||[]).length===12);
 const plannedCount=rows.filter(x=>x.status==='PLANNED').length;
 assert.ok(!hub.includes('planned articles'));
 assert.ok(hub.includes('>6 articles</span>'));
 assert.ok(hub.includes('>7 articles</span>'));
 const a=registry.categories[10].articles;
 const published=a.filter(x=>x.status==='PUBLISHED').length;
 const planned=a.length-published;
 assert.ok(hub.includes('>5 articles</span>'));
});
test('Security and Unicode normalization examples distinguish identity from confusability',()=>{
 const latin='a',cyrillic='\u0430',greek='\u03B1';
 assert.equal(latin.codePointAt(0),0x61);
 assert.equal(cyrillic.codePointAt(0),0x430);
 assert.equal(greek.codePointAt(0),0x3B1);
 assert.notEqual(latin,cyrillic);
 assert.notEqual(latin.normalize('NFKC'),cyrillic.normalize('NFKC'));
 assert.equal('𝐀'.codePointAt(0),0x1D400);
 assert.equal('𝐀'.normalize('NFKC'),'A');
 assert.equal('𝐀'.normalize('NFC'),'𝐀');
 assert.ok(/\p{Script_Extensions=Greek}/u.test('α'));
 assert.ok(/^\p{XID_Start}\p{XID_Continue}*$/u.test('alpha'));
});
test('Emoji integrity vectors stay independent of glyph artwork and reading',()=>{
 const s='👩\u200D💻';
 const segmenter=new Intl.Segmenter('en',{granularity:'grapheme'});
 assert.deepEqual([...s].map(x=>x.codePointAt(0)),[0x1F469,0x200D,0x1F4BB]);
 assert.equal(s.length,5);
 assert.equal([...segmenter.segment(s)].length,1);
 assert.deepEqual([...'❤️'].map(x=>x.codePointAt(0)),[0x2764,0xFE0F]);
 assert.deepEqual([...'👍🏻'].map(x=>x.codePointAt(0)),[0x1F44D,0x1F3FB]);
});
test('IDNA example is URL parsing, not evidence of trusted identity',()=>{
 const u=new URL('https://bücher.example/path');
 assert.equal(u.hostname,'xn--bcher-kva.example');
 assert.equal(u.origin,'https://xn--bcher-kva.example');
 assert.notEqual('A','\u0391');
 assert.notEqual('bücher','bucher');
});
test('Each new article covers its actual technical domain, not generic boilerplate',()=>{
 const terms={
  'emoji-rendering-compatibility':['RGI','font fallback','U+200D'],
  'unicode-confusables-lookalikes':['UTS #39','skeleton','U+0430'],
  'unicode-homograph-attacks':['homograph','IDNA2008','U+202E'],
  'mixed-script-identifier-detection':['Script_Extensions','restriction level','UTS #39'],
  'invisible-character-spoofing':['U+200B','U+202E','Default_Ignorable_Code_Point'],
  'unicode-identifier-security-profiles':['XID_Start','UAX #31','UTS #39'],
  'idna-internationalized-domain-names':['UTS #46','A-label','RFC 5890'],
  'displaying-untrusted-unicode-safely':['textContent','bdi','UTS #39'],
  'screen-readers-styled-unicode':['U+1D400','screen reader','NFKC'],
  'accessible-alternatives-decorative-text':['aria-hidden','aria-label','NFKC']
 };
 for(const [slug,required] of Object.entries(terms)){
  const html=read('us/'+slug+'/index.html');
  for(const term of required)assert.ok(html.includes(term),slug+': missing '+term);
 }
});
