import { chromium, devices } from 'playwright';
import { mkdir, writeFile } from 'node:fs/promises';

const BASE='http://127.0.0.1:8080/';
await mkdir('artifacts',{recursive:true});
const cases=[
  {name:'mobile',viewport:{width:390,height:844},deviceScaleFactor:1,isMobile:true,hasTouch:true},
  {name:'desktop',viewport:{width:1366,height:900},deviceScaleFactor:1,isMobile:false,hasTouch:false}
];
const failures=[];
const observations=[];
const browser=await chromium.launch({headless:true,args:['--no-sandbox','--disable-dev-shm-usage']});
for(const device of cases){
 const context=await browser.newContext({viewport:device.viewport,deviceScaleFactor:device.deviceScaleFactor,isMobile:device.isMobile,hasTouch:device.hasTouch,locale:'pt-BR'});
 const page=await context.newPage();
 const pageErrors=[];
 page.on('pageerror',e=>pageErrors.push(String(e).slice(0,400)));
 const t0=Date.now();
 try{
   const response=await page.goto(BASE,{waitUntil:'domcontentloaded',timeout:60000});
   if(!response?.ok()) throw Error('Homepage HTTP status '+response?.status());
   await page.locator('#quick-grid .lf-font-item').first().waitFor({state:'attached',timeout:35000});
   const loadMs=Date.now()-t0;
   const title=await page.title();
   const h1=await page.locator('h1').allTextContents();
   const canonical=await page.locator('link[rel="canonical"]').getAttribute('href');
   const gridBefore=await page.locator('#quick-grid .lf-font-item').count();
   if(h1.length!==1||!h1[0].includes('Letras Diferentes'))throw Error('Incorrect H1');
   if(!title.includes('Letras Diferentes'))throw Error('Incorrect page title');
   if(canonical!=='https://letrasdiferentess.github.io/')throw Error('Incorrect canonical');
   if(await page.locator('.seo-top-links').count())throw Error('Redundant SEO top navigation is back');
   if(!await page.locator('#view-quick').evaluate(el=>el.classList.contains('active')))throw Error('Generator not initially active');
   await page.locator('#quick-input').fill('Teste Brasil 2026');
   await page.waitForTimeout(750);
   const preview=await page.locator('#quick-grid .lf-font-item').first().innerText();
   if(!preview||preview.includes('Duy quang')||preview.includes('Digite seu texto acima'))throw Error('Live generator did not update preview');
   await page.locator('.lf-tab[data-tab="bio"]').click();
   if(!await page.locator('#view-bio').evaluate(el=>el.classList.contains('active')))throw Error('Bio tab broken');
   await page.locator('.lf-tab[data-tab="pro"]').click();
   if(!await page.locator('#view-pro').evaluate(el=>el.classList.contains('active')))throw Error('Games tab broken');
   await page.locator('.lf-tab[data-tab="writer"]').click();
   if(!await page.locator('#view-writer').evaluate(el=>el.classList.contains('active')))throw Error('Handwriting tab broken');
   await page.locator('.lf-tab[data-tab="quick"]').click();
   const dimensions=await page.evaluate(()=>({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth,scrollHeight:document.documentElement.scrollHeight}));
   if(dimensions.scrollWidth>dimensions.viewport+6)throw Error('Horizontal overflow '+JSON.stringify(dimensions));
   const seoPresent=await page.locator('.seo-info h2').count();
   if(seoPresent<6)throw Error('Missing substantive SEO sections');
   await page.screenshot({path:'artifacts/'+device.name+'.png',fullPage:false});
   observations.push({device:device.name,loadMs,gridBefore,preview:preview.slice(0,70),dimensions,seoHeadings:seoPresent,pageErrors});
   console.log('PASS',device.name,JSON.stringify(observations.at(-1)));
 }catch(e){failures.push({device:device.name,error:String(e),pageErrors});console.error('FAIL',device.name,String(e));}
 await context.close();
}
await browser.close();
await writeFile('artifacts/smoke-report.json',JSON.stringify({observations,failures},null,2));
if(failures.length)process.exitCode=1;
