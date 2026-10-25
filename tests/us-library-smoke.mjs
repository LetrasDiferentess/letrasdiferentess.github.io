import { chromium } from 'playwright';
import assert from 'node:assert/strict';
const target='http://127.0.0.1:8080/us/library/';
const sizes=[
  {name:'mobile320', width:320, height:720},
  {name:'mobile390', width:390, height:844},
  {name:'tablet768', width:768, height:1024},
  {name:'desktop1366',width:1366,height:900}
];
const browser=await chromium.launch({headless:true,...(process.env.USE_SYSTEM_CHROME==='1'?{channel:'chrome'}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
let failed=false;
for(const size of sizes){
 const context=await browser.newContext({viewport:{width:size.width,height:size.height},locale:'en-US',deviceScaleFactor:1});
 const page=await context.newPage();
 const errors=[];
 page.on('pageerror', e=>errors.push(e.message));
 try{
  const response=await page.goto(target,{waitUntil:'load',timeout:30000});
  assert.equal(response?.status(),200);
  assert.equal(await page.locator('html').getAttribute('lang'),'en');
  assert.equal(await page.locator('h1').count(),1);
  assert.equal(await page.locator('link[rel=canonical]').getAttribute('href'),'https://letrasdiferentess.github.io/us/library/');
  const cards=page.locator('#topic-grid > section.topic');
  assert.equal(await cards.count(),12);
  assert.equal(await page.locator('#topic-nav > a').count(),12);
  const counts=await cards.locator('.topic-count').allTextContents();
  assert.equal(counts.reduce((a,s)=>a+Number(s.match(/\d+/)?.[0]||0),0),96);
  const ids=await cards.evaluateAll(nodes=>nodes.map(n=>n.id));
  assert.equal(new Set(ids).size,12);
  const anchors=await page.locator('#topic-nav > a').evaluateAll(nodes=>nodes.map(n=>n.getAttribute('href')?.slice(1)));
  assert.deepEqual(anchors,ids);
  assert.equal(await page.locator('a[href^="/us/library/"]').count(),1);
  assert.equal(await page.locator('a[href="/us/"]').count()>0,true);
  const bounds=await page.evaluate(()=>({viewport:window.innerWidth,scrollWidth:document.documentElement.scrollWidth}));
  assert.ok(bounds.scrollWidth<=bounds.viewport+2,'horizontal overflow '+JSON.stringify(bounds));
  await page.locator('#topic-search').fill('collation');
  assert.equal(await cards.filter({visible:true}).count(),1);
  assert.equal(await page.locator('#topic-nav > a:visible').count(),1);
  await page.locator('#topic-search').fill('impossiblezzzz');
  assert.equal(await cards.filter({visible:true}).count(),0);
  assert.equal(await page.locator('#empty').isVisible(),true);
  await page.locator('#topic-search').fill('');
  assert.equal(await cards.filter({visible:true}).count(),12);
  await page.locator('#topic-nav a[href="#font-rendering"]').click();
  assert.equal(new URL(page.url()).hash,'#font-rendering');
  const rect=await page.locator('#font-rendering').boundingBox();
  assert.ok(rect&&rect.y>=-5&&rect.y<size.height+40,'anchor target inaccessible');
  assert.deepEqual(errors,[]);
  console.log('PASS LIBRARY '+JSON.stringify({device:size.name,viewport:bounds,areas:12,plannedReferences:96,search:'pass',anchors:'pass',errors:[]}));
 }catch(e){failed=true;console.error('FAIL LIBRARY '+size.name+' '+String(e));}
 await context.close();
}
await browser.close();
if(failed)process.exitCode=1;
