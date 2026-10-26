import { chromium } from 'playwright';
import assert from 'node:assert/strict';

const target='http://127.0.0.1:8080/mx/';
const sizes=[{name:'mobile320',width:320,height:720},{name:'mobile390',width:390,height:844},{name:'desktop1366',width:1366,height:900}];
const browser=await chromium.launch({headless:true,...(process.env.USE_SYSTEM_CHROME==='1'?{channel:'chrome'}:{}),args:['--no-sandbox','--disable-dev-shm-usage']});
const failures=[];
for(const s of sizes){
 const page=await browser.newPage({viewport:{width:s.width,height:s.height},locale:'es-MX'});
 const errors=[];page.on('pageerror',e=>errors.push(String(e)));
 try{
  const r=await page.goto(target,{waitUntil:'domcontentloaded',timeout:60000});assert.equal(r?.status(),200);
  await page.locator('#quick-grid .lf-font-item').first().waitFor({state:'attached',timeout:45000});
  assert.equal(await page.locator('html').getAttribute('lang'),'es-MX');
  assert.equal(await page.locator('h1').count(),1);
  assert.ok((await page.locator('h1').textContent()).includes('Letras Bonitas'));
  assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),'https://letrasdiferentess.github.io/mx/');
  assert.equal(await page.locator('link[hreflang="es-MX"]').getAttribute('href'),'https://letrasdiferentess.github.io/mx/');
  assert.equal(await page.locator('link[hreflang="pt-BR"]').getAttribute('href'),'https://letrasdiferentess.github.io/');
  assert.equal(await page.locator('link[hreflang="en-US"]').getAttribute('href'),'https://letrasdiferentess.github.io/us/');
  const state=await page.evaluate(()=>({market:document.documentElement.dataset.fsdMarket,enabled:!!window.FSDMarketFonts,fonts:Array.isArray(window.Fr)?window.Fr.slice(0,9).map(x=>x.name):[]}));
  assert.equal(state.market,'es-bonitas');assert.equal(state.enabled,true);
  assert.equal(await page.locator('.ld-language-nav a').count(),3);
  assert.equal(await page.locator('a.ld-library-link[href="/us/library/"]').count(),1);
  const field=page.locator('#quick-input');await field.fill('México, niño, corazón 2026');
  await page.waitForTimeout(950);
  const preview=await page.locator('#quick-grid .lf-font-item').first().innerText();
  assert.ok(preview.length>8,'font preview missing');
  const inputs=await field.inputValue();assert.equal(inputs,'México, niño, corazón 2026','Spanish ñ and accented input preserved');
  for(const tab of ['bio','pro','writer','quick']){await page.locator('.lf-tab[data-tab="'+tab+'"]').click();assert.equal(await page.locator('#view-'+tab).evaluate(x=>x.classList.contains('active')),true,'tab '+tab);}
  const copyLabel=(await page.locator('#quick-copy').innerText()).toLowerCase();assert.ok(copyLabel.includes('copiar'),'Copy localized to Spanish '+copyLabel);
  const bounds=await page.evaluate(()=>({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,seoTop:document.querySelector('.seo-info')?.getBoundingClientRect().top,toolBottom:document.querySelector('#lf194-root')?.getBoundingClientRect().bottom}));
  assert.ok(bounds.scrollWidth<=bounds.viewport+6,'mobile overflow '+JSON.stringify(bounds));
  assert.ok(bounds.seoTop>=bounds.toolBottom-8,'SEO guide before tool');
  assert.ok((await page.locator('.seo-info h2').allTextContents()).some(t=>t.includes('cursivas')));
  assert.ok(errors.length===0,'console errors '+errors.slice(0,3).join('; '));
  console.log('PASS MX',JSON.stringify({size:s.name,market:state.market,topFonts:state.fonts,preview:preview.slice(0,65),bounds}));
 }catch(e){console.error('FAIL MX '+s.name+': '+String(e));failures.push({size:s.name,error:String(e),pageErrors:errors.slice(0,3)})}
 await page.close();
}
await browser.close();
if(failures.length){console.error(JSON.stringify(failures));process.exitCode=1;}
