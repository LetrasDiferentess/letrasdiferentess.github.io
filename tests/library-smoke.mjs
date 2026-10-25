import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = 'http://127.0.0.1:8080/us/library/';
const viewports = [
  { name: 'mobile-320', width: 320, height: 740, isMobile: true },
  { name: 'mobile-390', width: 390, height: 844, isMobile: true },
  { name: 'desktop', width: 1366, height: 900, isMobile: false }
];
const expected = [
  'unicode-character-model', 'styled-text-special-characters', 'character-encoding',
  'normalization-casing-search', 'segmentation-regex-cursors', 'fonts-shaping-rendering',
  'clipboard-editors-markup', 'multilingual-input', 'emoji-symbol-sequences',
  'identifiers-confusables-security', 'text-accessibility', 'text-apis-implementation'
];
const counts = [8,8,8,10,8,10,9,9,6,7,5,8];
const browser = await chromium.launch({
  headless: true,
  ...(process.env.USE_SYSTEM_CHROME==='1' ? { channel: 'chrome' } : {}),
  args: ['--no-sandbox','--disable-dev-shm-usage']
});
await mkdir('artifacts', { recursive: true });
const results = [], failures = [];

for(const device of viewports){
 const context = await browser.newContext({
   viewport: { width: device.width, height: device.height },
   isMobile: device.isMobile, hasTouch: device.isMobile,
   deviceScaleFactor: 1, locale: 'en-US'
 });
 const page = await context.newPage();
 const errors = [];
 page.on('pageerror', err => errors.push(String(err)));
 try{
  const response = await page.goto(BASE,{waitUntil:'load',timeout:45000});
  if(!response?.ok()) throw Error('HTTP ' + response?.status());
  if(await page.title() !== 'Unicode Text Processing & Interoperability | Research Library') throw Error('Incorrect title');
  if(await page.locator('html').getAttribute('lang') !== 'en-US') throw Error('Wrong lang');
  if(await page.locator('link[rel="canonical"]').getAttribute('href') !== 'https://letrasdiferentess.github.io/us/library/') throw Error('Incorrect canonical');
  if(await page.locator('.topic-card').count() !== 12 || await page.locator('.topic-nav-link').count() !== 12) throw Error('Expected 12 category cards and 12 jump links');
  const slugs = await page.locator('.topic-card').evaluateAll(cards => cards.map(card => card.id));
  if(slugs.join('|') !== expected.join('|')) throw Error('Category anchors mismatch: '+slugs.join(','));
  const published = await page.locator('.card-count').allTextContents();
  const total = published.reduce((sum,label)=>sum+Number(label.match(/^\d+/)?.[0]||0),0);
  if(total!==96 || published.some((x,i)=>Number(x.match(/^\d+/)?.[0])!==counts[i])) throw Error('Planned count incorrect '+total);
  if(await page.locator('a[href^="/us/library/"]').count()) throw Error('Unexpected nested category URL');
  if(await page.locator('a[href="/us/"]').count()<2) throw Error('Missing return to US tool');
  const search = page.locator('#topic-search');
  await search.fill('font fallback');
  if(await page.locator('.topic-card:not([hidden])').count()!==1) throw Error('Search results incorrect');
  if(await page.locator('.topic-nav-link:not([hidden])').count()!==1) throw Error('Sidebar search results incorrect');
  if(!await page.locator('#fonts-shaping-rendering').isVisible()) throw Error('Rendering category hidden during search');
  await page.locator('#clear-search').click();
  if(await page.locator('.topic-card:not([hidden])').count()!==12) throw Error('Clear search did not restore categories');
  await page.locator('.topic-nav-link[href="#character-encoding"]').click();
  if(!page.url().endsWith('#character-encoding')) throw Error('Anchor navigation failed');
  const dimensions=await page.evaluate(()=>({
    viewport:document.documentElement.clientWidth,
    pageWidth:document.documentElement.scrollWidth,
    bodyWidth:document.body.scrollWidth
  }));
  if(dimensions.pageWidth>dimensions.viewport+2 || dimensions.bodyWidth>dimensions.viewport+2) throw Error('Horizontal overflow: '+JSON.stringify(dimensions));
  if(errors.length) throw Error('JavaScript errors '+errors.join(' / '));
  await page.goto(BASE);
  await page.screenshot({path:'artifacts/library-'+device.name+'.png',fullPage:true});
  const result={device:device.name,cardCount:12,totalPlanned:96,search:'passed',anchors:'passed',dimensions};
  console.log('PASS_LIBRARY',JSON.stringify(result));
  results.push(result);
 }catch(err){const failure={device:device.name,error:String(err),errors};failures.push(failure);console.error('FAIL_LIBRARY',JSON.stringify(failure));}
 await context.close();
}
await browser.close();
await writeFile('artifacts/library-report.json',JSON.stringify({results,failures},null,2));
if(failures.length) process.exitCode=1;
