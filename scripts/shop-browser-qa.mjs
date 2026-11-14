import {chromium} from 'playwright';
import AxeBuilder from '@axe-core/playwright';
import assert from 'node:assert/strict';
import {mkdirSync,writeFileSync,readFileSync} from 'node:fs';
const base=process.env.QA_BASE_URL||'http://localhost:3000';
if(!/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(base))throw new Error('This CI test only exercises a local build, never a paid production checkout.');
mkdirSync('quality-qa',{recursive:true});
const browser=await chromium.launch({headless:true});const report={environment:'local production build without payment credentials',viewports:[],functional:{},limitations:['No completed Stripe payment','No supplier API or stock proof','No full legal certification','Automated accessibility scan is not an exhaustive audit']};const failures=[];
const cart={version:1,items:[{sku:'38198.02.WH1',quantity:1}],installation:false,installationZip:'',source:'shop',vpId:'',updatedAt:new Date().toISOString()};
try{
 for(const width of [390,768,1440]){
  const context=await browser.newContext({viewport:{width,height:1000},locale:'de-DE'}),page=await context.newPage(),errors=[],requests=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(r.url()));
  for(const route of ['/','/shop','/konfigurator','/shop/38198.02.WH1','/warenkorb','/alarmanlagen/gewerbe','/ratgeber/jeweller-fibra-vergleich']){
   const response=await page.goto(base+route,{waitUntil:'networkidle'});assert.equal(response.status(),200);
   if(route==='/warenkorb'){await page.evaluate(c=>localStorage.setItem('sichere-nacht-cart-v1',JSON.stringify(c)),cart);await page.reload({waitUntil:'networkidle'})}
   await page.waitForTimeout(250);const layout=await page.evaluate(()=>({viewport:innerWidth,body:document.documentElement.scrollWidth,main:!!document.querySelector('main')}));
   const name=(route==='/'?'home':route.replace(/\//g,'_').slice(1))+'-'+width;
   await page.screenshot({path:'quality-qa/'+name+'.png',fullPage:true});
   const record={route,width,http:response.status(),overflow:layout.body>width+1,documentWidth:layout.body};report.viewports.push(record);
   if(record.overflow)failures.push('Horizontal overflow '+name+' '+layout.body);
   if(width===390&&route==='/'){await page.getByRole('button',{name:'Menü öffnen',exact:true}).click();assert.equal(await page.locator('#primary-menu').isVisible(),true);await page.getByRole('button',{name:'Menü schließen',exact:true}).click()}
  }
  if(requests.some(u=>/js\.stripe\.com/.test(u)))failures.push('Stripe SDK loaded before payment interaction '+width);
  if(errors.length)failures.push(...errors.map(x=>'Browser JS '+width+': '+x));
  if(width===1440){const axe=await new AxeBuilder({page}).withTags(['wcag2a','wcag2aa','wcag21aa']).analyze();writeFileSync('quality-qa/accessibility.json',JSON.stringify({url:page.url(),violations:axe.violations},null,2));report.functional.accessibilitySerious=axe.violations.filter(v=>['critical','serious'].includes(v.impact)).map(v=>({id:v.id,nodes:v.nodes.length}));}
  await context.close();
 }
 const ctx=await browser.newContext({viewport:{width:1440,height:1000}}),p=await ctx.newPage();await p.goto(base+'/shop');await p.getByLabel('Produkt, Artikelnummer oder EAN').fill('38198.02.WH1');assert.equal(await p.locator('.qualityProduct').count(),1);await p.getByLabel('Vergleichen (max. 3)').check();assert.equal(await p.locator('.productCompare').count(),1);report.functional.searchAndCompare=true;
 await p.goto(base+'/warenkorb');await p.evaluate(c=>localStorage.setItem('sichere-nacht-cart-v1',JSON.stringify(c)),cart);await p.reload();await p.locator('input[value="b2b"]').check();assert.equal(await p.locator('#buyer-company').isVisible(),true);assert.ok((await p.locator('body').innerText()).includes('kein freiwilliges Widerrufsrecht'));await p.locator('#buyer-company').fill('Testunternehmen GmbH');report.functional.businessSelection=true;
 await p.goto(base+'/?vp=VP-TEST');assert.equal(await p.evaluate(()=>localStorage.getItem('sichere-nacht-referral-v2')),null);await p.getByRole('button',{name:'Empfehlung speichern',exact:true}).click();assert.ok(await p.evaluate(()=>localStorage.getItem('sichere-nacht-referral-v2')));await p.reload();await p.getByRole('button',{name:'Empfehlungs-Einstellungen',exact:true}).click();await p.getByRole('button',{name:'Nicht speichern / widerrufen',exact:true}).click();assert.equal(await p.evaluate(()=>localStorage.getItem('sichere-nacht-referral-v2')),null);report.functional.referralConsentAndRevocation=true;
 await p.goto(base+'/konfigurator');await p.getByRole('button',{name:'Mengen direkt erfassen',exact:true}).click();await p.getByLabel('Räume mit Bewegungserkennung').fill('6');const item=p.locator('.recProduct').filter({hasText:'MotionCam'});assert.equal(await item.locator('input[type=number]').inputValue(),'6');await item.locator('input[type=number]').fill('4');assert.equal(await item.locator('input[type=number]').inputValue(),'4');report.functional.roomCountsAndManualQuantities=true;
 await p.goto(base+'/');await p.keyboard.press('Tab');assert.equal(await p.locator('.skipLink').evaluate(e=>e===document.activeElement),true);await p.keyboard.press('Enter');report.functional.skipLink=true;
 await ctx.close();
 writeFileSync('quality-qa/public-catalog-prices.json',JSON.stringify(JSON.parse(readFileSync('lib/public-products.generated.json','utf8')).map(({sku,name,priceCents,uvpCents,ean})=>({sku,name,priceCents,uvpCents,ean}))));
}catch(e){failures.push(e instanceof Error?e.message:String(e))}finally{await browser.close();report.failures=failures;writeFileSync('quality-qa/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));}
assert.equal(failures.length,0,failures.join('\n'));
