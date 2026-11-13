import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {applyCheckoutBranding,isSichereNachtCheckout} from '../lib/stripe-shop.ts';
const read=p=>readFileSync(new URL('../'+p,import.meta.url),'utf8');

test('exact Sichere Nacht marker is accepted for test and live sessions',()=>{
 for(const livemode of [false,true])assert.equal(isSichereNachtCheckout({livemode,metadata:{shop:'sichere-nacht'}}),true);
});
test('another shop in the same Stripe account is not our order',()=>{
 assert.equal(isSichereNachtCheckout({metadata:{shop:'dein-snackautomat'}}),false);
});
test('shop marker is exact, not substring-based or guessed from a name',()=>{
 for(const shop of ['sichere-nacht-diagnostic','Sichere Nacht','sichere-nacht.de','sichere-nacht ',true,123]){
  assert.equal(isSichereNachtCheckout({metadata:{shop}}),false);
 }
});
test('missing or malformed metadata is ignored',()=>{
 for(const value of [null,undefined,{},[],{metadata:null},{metadata:[]},{metadata:'sichere-nacht'},{metadata:{}}])assert.equal(isSichereNachtCheckout(value),false);
});
test('diagnostics cannot be fulfilled even with an accidentally copied shop marker',()=>{
 assert.equal(isSichereNachtCheckout({metadata:{shop:'sichere-nacht',diagnostic:'checkout-write-probe-v1'}}),false);
 assert.equal(isSichereNachtCheckout({metadata:{shop:'sichere-nacht',diagnostic:true}}),false);
});
test('ordinary attribution fields do not break shop identification',()=>{
 assert.equal(isSichereNachtCheckout({metadata:{shop:'sichere-nacht',shipping_country:'DE',vp_id:'VP-TEST'}}),true);
});
test('branding overrides only session display name and preserves diagnostics',()=>{
 const form=new URLSearchParams({'branding_settings[display_name]':'dein-snackautomat.de','metadata[shop]':'sichere-nacht-diagnostic','metadata[diagnostic]':'checkout-write-probe-v1'});
 const originalKeys=[...form.keys()];
 applyCheckoutBranding(form);
 assert.equal(form.get('branding_settings[display_name]'),'Sichere Nacht');
 assert.equal(form.get('metadata[shop]'),'sichere-nacht-diagnostic');
 assert.equal(form.get('metadata[diagnostic]'),'checkout-write-probe-v1');
 assert.deepEqual([...form.keys()],originalKeys);
});
test('public checkout and protected probe both apply session branding',()=>{
 for(const path of ['app/api/checkout/route.ts','app/api/admin/checkout-probe/route.ts'])assert.match(read(path),/applyCheckoutBranding\(form\)/);
});
test('signed event scope is checked before database and fulfillment',()=>{
 const route=read('app/api/stripe/webhook/route.ts');
 const handler=route.slice(route.indexOf('export async function POST'));
 const signature=handler.indexOf('if(!validSignature(');
 const scope=handler.indexOf('if(!isSichereNachtCheckout(object))');
 const db=handler.indexOf('if(!ordersConfigured())');
 const save=handler.indexOf('await savePaidOrder(order)');
 assert.ok(signature>=0&&scope>signature&&db>scope&&save>db);
 assert.match(handler,/if\(order==='ignored'\)return NextResponse\.json\(\{received:true,ignored:true\}\)/);
});
test('authoritative session is scoped again before order data are built',()=>{
 const route=read('app/api/stripe/webhook/route.ts');
 const verify=route.slice(route.indexOf('async function verifiedPaidOrder'),route.indexOf('export async function POST'));
 assert.match(verify,/if\(!isSichereNachtCheckout\(session\)\)return 'ignored'/);
 assert.ok(verify.indexOf('isSichereNachtCheckout(session)')<verify.indexOf('stripe_session_id:session.id'));
 assert.match(verify,/PAYMENTS_LIVE_APPROVED/);
});
