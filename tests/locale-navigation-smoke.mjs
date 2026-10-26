import assert from 'node:assert/strict';
import { chromium } from 'playwright';

const origin = 'http://127.0.0.1:8080';
const cases = [
  {name:'Brazil',path:'/',lang:'pt-BR',canonical:'https://letrasdiferentess.github.io/',other:'/us/'},
  {name:'US',path:'/us/',lang:'en-US',canonical:'https://letrasdiferentess.github.io/us/',other:'/'}
];
const devices = [
  {name:'mobile320',width:320,height:720},
  {name:'mobile390',width:390,height:844},
  {name:'desktop1366',width:1366,height:900}
];
const browser = await chromium.launch({
  headless:true,
  ...(process.env.USE_SYSTEM_CHROME==='1'?{channel:'chrome'}:{}),
  args:['--no-sandbox','--disable-dev-shm-usage']
});
const failures = [];
for(const device of devices){
  const page=await browser.newPage({viewport:{width:device.width,height:device.height}});
  try{
    for(const entry of cases){
      const resp=await page.goto(origin+entry.path,{waitUntil:'domcontentloaded',timeout:60000});
      assert.equal(resp?.status(),200,entry.name+' HTTP');
      assert.equal(await page.locator('html').getAttribute('lang'),entry.lang);
      assert.equal(await page.locator('link[rel="canonical"]').getAttribute('href'),entry.canonical);
      assert.equal(await page.locator('h1').count(),1,entry.name+' H1');
      const nav=page.locator('.ld-resource-panel');
      assert.equal(await nav.count(),1,entry.name+' navigation section');
      assert.ok(await nav.isVisible(),entry.name+' navigation visible');
      assert.equal(await nav.locator('.ld-language-nav a').count(),2,'only verified tool locales');
      assert.equal(await nav.locator('a[href="'+entry.other+'"]').count(),1,'cross-locale link');
      assert.equal(await nav.locator('a[href="/us/library/"]').count(),1,'library backlink');
      assert.equal(await nav.locator('a[aria-current="page"]').getAttribute('href'),entry.path,'active locale');
      assert.ok(await nav.evaluate(el => el.getBoundingClientRect().bottom <= document.querySelector('.seo-info').getBoundingClientRect().top + 2),'navigation precedes SEO');
      const style=await page.evaluate(()=>getComputedStyle(document.querySelector('.ld-resource-panel')).backgroundColor);
      assert.notEqual(style,'rgba(0, 0, 0, 0)','stylesheet was loaded');
      const size=await page.evaluate(()=>({viewport:innerWidth,scrollWidth:document.documentElement.scrollWidth}));
      assert.ok(size.scrollWidth<=size.viewport+6,'horizontal overflow '+JSON.stringify(size));
    }
    const response=await page.goto(origin+'/us/library/',{waitUntil:'load',timeout:30000});
    assert.equal(response?.status(),200,'library HTTP');
    const mark=page.locator('.library-brand .brand-symbol');
    assert.equal((await mark.textContent()).trim(),'U','logo letter U exists');
    const foreground=await mark.evaluate(el=>getComputedStyle(el).color);
    assert.equal(foreground,'rgb(255, 255, 255)','logo letter readable against teal');
    await page.locator('.tool-menu > summary').click();
    assert.ok(await page.locator('.tool-panel').isVisible(),'tool locale dropdown');
    assert.equal(await page.locator('.tool-languages a').count(),2,'only two live language links');
    assert.equal(await page.locator('#topic-grid > section.topic').count(),12);
    console.log('PASS locale library navigation '+device.name);
  }catch(err){
    failures.push({device:device.name,error:String(err)});
    console.error('FAIL locale library navigation '+device.name+': '+String(err));
  }finally{await page.close()}
}
await browser.close();
if(failures.length)process.exitCode=1;
