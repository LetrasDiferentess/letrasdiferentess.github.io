import { chromium } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE = 'http://127.0.0.1:8080/us/';
const tests = [
  {name:'mobile', viewport:{width:390,height:844}, mobile:true},
  {name:'desktop', viewport:{width:1366,height:900}, mobile:false}
];
await mkdir('artifacts',{recursive:true});
const results=[],failures=[];
const browser=await chromium.launch({headless:true,...(process.env.USE_SYSTEM_CHROME==='1'?{channel:'chrome'}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
for(const t of tests){
 const context=await browser.newContext({viewport:t.viewport,deviceScaleFactor:1,isMobile:t.mobile,hasTouch:t.mobile,locale:'en-US'});
 const page=await context.newPage();
 const errors=[]; page.on('pageerror', e=>errors.push(String(e).slice(0,500)));
 const begin=Date.now();
 try{
  const response=await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:60000});
  if(!response?.ok())throw Error('HTTP '+response?.status());
  await page.locator('#quick-grid .lf-font-item').first().waitFor({state:'attached',timeout:45000});
  const title=await page.title();
  const headings=await page.locator('h1').allTextContents();
  const canonical=await page.locator('link[rel="canonical"]').getAttribute('href');
  const language=await page.locator('html').getAttribute('lang');
  if(!/Fancy Text Generator/.test(title)||headings.length!==1||!/Fancy Text Generator/.test(headings[0]))throw Error('Title/H1 not English Fancy Text');
  if(canonical!=='https://letrasdiferentess.github.io/us/'||language!=='en-US')throw Error('Canonical/HTML locale mismatch');
  if(await page.locator('.language-us-link,.seo-top-links,a[href="#fancy-text-guide"]').count())throw Error('Content navigation above tool returned');
  if(!await page.locator('#view-quick').evaluate(e=>e.classList.contains('active')))throw Error('Generator not initially visible');
  const firstTab=await page.locator('.lf-tab.lf-active').first().getAttribute('data-tab');
  if(firstTab!=='quick')throw Error('Quick generator must be primary tab');
  const engine=await page.evaluate(()=>({market:document.documentElement.dataset.fsdMarket,enabled:!!window.FSDMarketFonts}));
  if(engine.market!=='en'||!engine.enabled)throw Error('US font engine not localized '+JSON.stringify(engine));
  const input=page.locator('#quick-input');
  await input.fill('Fancy Text 2026');
  await page.waitForTimeout(900);
  const preview=await page.locator('#quick-grid .lf-font-item').first().innerText();
  if(!preview||!preview.toLowerCase().includes('fancy')&&!/[𝐀-𝟿]/u.test(preview))throw Error('Generator preview not updated: '+preview.slice(0,120));
  for(const tab of ['bio','pro','writer','quick']){
   await page.locator('.lf-tab[data-tab="'+tab+'"]').click();
   if(!await page.locator('#view-'+tab).evaluate(e=>e.classList.contains('active')))throw Error('Broken '+tab+' tab');
  }
  const bounds=await page.evaluate(()=>({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight,seoTop:document.querySelector('.seo-info')?.getBoundingClientRect().top,toolBottom:document.querySelector('#lf194-root')?.getBoundingClientRect().bottom}));
  if(bounds.scrollWidth>bounds.viewport+6)throw Error('Horizontal overflow '+JSON.stringify(bounds));
  if(!(bounds.seoTop>=bounds.toolBottom-8))throw Error('SEO content overlaps/precedes tool '+JSON.stringify(bounds));
  const headingsCount=await page.locator('.seo-info h2').count();
  if(headingsCount<5)throw Error('Missing bottom SEO section');
  await page.screenshot({path:'artifacts/us-'+t.name+'.png'});
  const row={device:t.name,domReadyMs:Date.now()-begin,title,canonical,headingsCount,preview:preview.slice(0,90),engine,bounds,pageErrors:errors};
  if(errors.length)throw Error('Runtime errors: '+errors.join('; ').slice(0,800));
  results.push(row);console.log('PASS US',JSON.stringify(row));
 }catch(error){
  const item={device:t.name,error:String(error),pageErrors:errors};failures.push(item);console.error('FAIL US',JSON.stringify(item));
 }
 await context.close();
}
await browser.close();
await writeFile('artifacts/us-smoke-report.json',JSON.stringify({results,failures},null,2));
if(failures.length)process.exitCode=1;
