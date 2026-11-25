import {test,after} from 'node:test';import assert from 'node:assert/strict';import {readFileSync,writeFileSync,mkdirSync,rmSync} from 'node:fs';import {createRequire} from 'node:module';import path from 'node:path';import ts from 'typescript';
const read=p=>readFileSync(p,'utf8'),dir=path.resolve('.quality-test-'+process.pid);mkdirSync(dir,{recursive:true});for(const name of ['product-advice','system-check','referral-consent'])writeFileSync(path.join(dir,name+'.js'),ts.transpileModule(read('lib/'+name+'.ts'),{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText);const require=createRequire(path.join(dir,'run.cjs'));const {productAdvice}=require('./product-advice.js'),{checkSystem}=require('./system-check.js'),{parseReferral,REFERRAL_POLICY}=require('./referral-consent.js');after(()=>rmSync(dir,{recursive:true,force:true}));
const line=(sku,name,quantity=1)=>({product:{sku,name},quantity});
test('known hub and motion pair passes basic consistency',()=>assert.equal(checkSystem([line('38245.40.WH1','Ajax Hub 2 Plus'),line('38193.09.WH1','Ajax MotionProtect')],true).errors.length,0));
test('Fibra cannot be silently paired to wireless-only hub',()=>assert.ok(checkSystem([line('38245.40.WH1','Ajax Hub 2 Plus'),line('FIBRA','DoorProtect Fibra')]).errors.some(x=>x.includes('Fibra'))));
test('old hub without photo capability rejects MotionCam',()=>assert.ok(checkSystem([line('OLD','Ajax Hub'),line('119282.310.WH1','MotionCam PhOD')]).errors.some(x=>x.includes('Foto'))));
test('G3 mix requires review',()=>assert.ok(checkSystem([line('38245.40.WH1','Ajax Hub 2 Plus'),line('G3','MotionProtect G3')]).errors.some(x=>x.includes('G3'))));
test('new system requires a hub and detector',()=>{assert.ok(checkSystem([line('38193.09.WH1','MotionProtect')],true).errors.length);assert.ok(checkSystem([line('38245.40.WH1','Hub 2 Plus')],true).errors.length)});
test('excessive per-SKU counts rejected not reduced',()=>assert.ok(checkSystem([line('38099.03.WH1','DoorProtect',31)]).errors.some(x=>x.includes('30'))));
test('bracket not misrepresented as a detector',()=>{const a=productAdvice({sku:'BRACKET',name:'AS-SmartBracket DoorProtect white'});assert.equal(a.technology,'Zubehör');assert.equal(a.reviewed,false)});
test('unknown item remains unreviewed',()=>assert.equal(productAdvice({sku:'NEW',name:'New Ajax Thing'}).reviewed,false));
test('referral needs valid bounded consent',()=>{const n=1000000000,good={vpId:'VP-TEST',policy:REFERRAL_POLICY,consentedAt:n-1000,expiresAt:n+1000};assert.ok(parseReferral(good,n));for(const data of [null,{}, {...good,expiresAt:n},{...good,consentedAt:n+1},{...good,expiresAt:n+31*86400000},{...good,vpId:'invalid'},{...good,policy:'old'}])assert.equal(parseReferral(data,n),null)});
test('no global Stripe script and no imaginary customer ratings',()=>{assert.doesNotMatch(read('app/layout.tsx'),/js\.stripe\.com|beforeInteractive/);assert.doesNotMatch(read('app/page.tsx'),/Fiktives Beispiel|reviewStars|aggregateRating/);assert.match(read('app/warenkorb/page.tsx'),/await loadStripeScript/)});
test('live gates and server price source retained',()=>{const r=read('app/api/checkout/route.ts');for(const x of ['PAYMENTS_LIVE_APPROVED','CHECKOUT_TEST_ENABLED','priceBySku','checkSystem','parseReferral','activePortalPartner'])assert.ok(r.includes(x));assert.match(r,/const shipping=990/);assert.match(r,/installation===true/)});
test('room selections not silently downscaled; montage not charged in cart',()=>{const s=read('app/konfigurator/page.tsx');assert.match(s,/rooms\.filter\(r=>r.motion\)\.length/);assert.doesNotMatch(s,/motionRooms\*0\.|rooms\*0\./);assert.match(read('app/warenkorb/page.tsx'),/total=subtotal\+shipping/)});
test('metadata blocks preview and internal indexing',()=>{assert.match(read('lib/seo.ts'),/VERCEL_ENV==='production'/);assert.match(read('app/robots.ts'),/\/admin\//);assert.match(read('app/admin/layout.tsx'),/index:false/);assert.match(read('app/bestellung/layout.tsx'),/index:false/);assert.match(read('app/shop/\[sku\]/page.tsx'),/safeJson/)});

test('catalog cameras and video doorbells can be purchased without an alarm system', () => {
  const products = JSON.parse(read('products.json'));
  const cameras = products.filter(p => /^Ajax (?:BulletCam|DomeCam|TurretCam|IndoorCam|DoorBell)\b/.test(p.name));
  assert.ok(cameras.length > 0);
  for (const camera of cameras) {
    const advice = productAdvice(camera);
    assert.equal(advice.reviewed, true, camera.sku);
    assert.equal(advice.standaloneVideo, true, camera.sku);
    const check = checkSystem([{product: camera, quantity: 1}]);
    assert.deepEqual(check.errors, []);
    assert.deepEqual(check.warnings, []);
  }
  const camera = cameras[0];
  assert.equal(productAdvice({...camera, sku: 'UNREVIEWED-VARIANT'}).reviewed, false);
  for (const sku of ['BMC-003', '134722.125.BL', '168237.371.BL', '135579.214.BL1']) {
    const other = products.find(p => p.sku === sku);
    assert.ok(other);
    assert.equal(productAdvice(other).reviewed, false, other.name);
  }
  const mixedCart = [{product: camera, quantity: 1}, line('38193.09.WH1', 'Ajax MotionProtect')];
  assert.ok(checkSystem(mixedCart).warnings.some(w => w.includes('Zentrale')));
});
