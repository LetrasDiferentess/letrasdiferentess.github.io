import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

const manifest = JSON.parse(fs.readFileSync('data/tool-locales.json','utf8'));
const {canonicalOrigin,hubPath,locales} = manifest;
const getFile = pathname => pathname==='/' ? 'index.html' : path.join(pathname.slice(1),'index.html');
const href = (tag,name) => tag.match(new RegExp('\\b'+name+'="([^"]*)"'))?.[1];
const anchors = html => [...html.matchAll(/<a\s+([^>]+)>([\s\S]*?)<\/a>/g)]
  .map(m=>({tag:m[0],attributes:m[1],label:m[2].replace(/<[^>]*>/g,'').trim(),
    path:href(m[1],'href'),lang:href(m[1],'lang'),current:href(m[1],'aria-current')}));
const url = locale => canonicalOrigin+locale.path;
const files = locales.map(x=>({locale:x,filename:getFile(x.path),body:fs.readFileSync(getFile(x.path),'utf8')}));
const sitemap=fs.readFileSync('sitemap.xml','utf8');
const hub=fs.readFileSync(getFile(hubPath),'utf8');

test('Locale manifest is unique, valid, and lists ALL actual tool pages',()=>{
  assert.equal(manifest.version,1);
  assert.ok(/^https:\/\/[^/]+$/.test(canonicalOrigin),'absolute origin');
  assert.equal(new Set(locales.map(x=>x.path)).size,locales.length,'unique URL paths');
  assert.equal(new Set(locales.map(x=>x.lang)).size,locales.length,'unique BCP47 locales');
  assert.ok(locales.length>=2,'a tool must have published locales');
  for(const item of locales){
    assert.match(item.lang,/^[a-z]{2}-[A-Z]{2}$/);
    assert.match(item.path,/^\/(?:[a-z0-9-]+\/)?$/);
    assert.ok(item.label.trim().length>2);
    assert.ok(fs.existsSync(getFile(item.path)),item.path+' must have published HTML');
  }
  // New top-level generator directories MUST be registered.
  const candidates=['index.html',...fs.readdirSync('.',{withFileTypes:true})
    .filter(d=>d.isDirectory()&&!d.name.startsWith('.'))
    .map(d=>path.join(d.name,'index.html')).filter(x=>fs.existsSync(x))];
  const discovered=candidates.filter(filename=>{
    const body=fs.readFileSync(filename,'utf8');
    const graphs=[...body.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)];
    return graphs.some(m=>{
      try{const obj=JSON.parse(m[1]);return [obj,...(obj['@graph']||[])].some(z=>
        z['@type']==='WebApplication'||z['@type']==='SoftwareApplication');}catch{return false;}
    });
  }).sort();
  assert.deepEqual(files.map(x=>x.filename).sort(),discovered,'each deployed generator needs a locale registry entry');
});

test('Every money page links to every locale, the library, and every reciprocal hreflang',()=>{
  for(const {locale,filename,body} of files){
    assert.ok(body.includes('<html lang="'+locale.lang+'">'),filename+' HTML language');
    assert.ok(body.includes('<link rel="canonical" href="'+url(locale)+'">'),filename+' canonical');
    assert.ok(body.includes('href="'+hubPath+'"'),filename+' library link');
    const block=body.match(/<div class="ld-locale-list">([\s\S]*?)<\/div>/);
    assert.ok(block,filename+' localized tool chooser exists');
    const links=anchors(block[1]);
    assert.equal(links.length,locales.length,filename+' every locale exactly once');
    assert.deepEqual(links.map(x=>x.path),locales.map(x=>x.path),filename+' locale order');
    for(let i=0;i<locales.length;i++){
      assert.equal(links[i].lang,locales[i].lang,filename+' BCP47 nav language');
      assert.equal(links[i].label,locales[i].label,filename+' reader-facing label');
      assert.equal(links[i].current,links[i].path===locale.path?'page':undefined,filename+' current page highlight');
    }
    const alternates=[...body.matchAll(/<link\s+rel="alternate"\s+hreflang="([^"]+)"\s+href="([^"]+)"\s*\/?>/g)]
      .map(x=>({lang:x[1],url:x[2]}));
    assert.equal(alternates.length,locales.length+1,filename+' one hreflang per active locale plus x-default');
    for(const item of locales){
      assert.equal(alternates.filter(x=>x.lang===item.lang&&x.url===url(item)).length,1,filename+' '+item.lang+' reciprocal hreflang');
    }
    assert.equal(alternates.filter(x=>x.lang==='x-default'&&x.url===canonicalOrigin+'/').length,1,filename+' x-default');
  }
});

test('Research library Text tools menu reflects every published locale exactly',()=>{
  const block=hub.match(/<div class="tool-languages">([\s\S]*?)<\/div>/);
  assert.ok(block,'reader-facing library tool dropdown');
  const links=anchors(block[1]);
  assert.equal(links.length,locales.length,'library must list every locale exactly once');
  assert.deepEqual(new Set(links.map(x=>x.path)),new Set(locales.map(x=>x.path)));
  for(const item of locales){
    const link=links.find(x=>x.path===item.path);
    assert.ok(link,'missing locale '+item.lang);
    assert.equal(link.lang,item.lang,'correct menu language '+item.lang);
    assert.ok(link.attributes.includes('data-locale='),'menu entry searchable '+item.lang);
  }
});

test('Sitemap includes every published tool exactly once',()=>{
  const locs=[...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map(x=>x[1]);
  for(const item of locales){
    assert.equal(locs.filter(x=>x===url(item)).length,1,'sitemap '+item.path);
  }
});
