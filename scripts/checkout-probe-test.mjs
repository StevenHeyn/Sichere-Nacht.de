import assert from 'node:assert/strict';
import {test} from 'node:test';
import {runCheckoutWriteProbe} from '../lib/checkout-write-probe.ts';
const id='cs_live_mockOnlyNeverARealSession123456789';
const sku='38198.02.WH1';
const session={id,livemode:true,status:'expired',payment_status:'unpaid',client_secret:'DO_NOT_RETURN_ME'};
const items={data:[{quantity:1,price:{product:{metadata:{sku}}}}],has_more:false};
function fixture(overrides={}) {
  const calls=[];
  const sequence=[
    {status:200,json:{...session,status:'open',url:'https://checkout.stripe.com/DO_NOT_RETURN_ME'}},
    {status:200,json:session},
    {status:200,json:session},
    {status:200,json:items}
  ];
  for (const [index,value] of Object.entries(overrides)) sequence[Number(index)]=value;
  const fetchImpl=async(url,init)=>{
    calls.push({url,method:init.method,body:init.body,headers:init.headers});
    const next=sequence[calls.length-1];
    assert.ok(next,'Unexpected additional Stripe call');
    if(next.throws) throw new Error('Deliberately simulated network failure');
    return new Response(JSON.stringify(next.json),{status:next.status,headers:{'content-type':'application/json','request-id':'req_mock'}});
  };
  return {calls,fetchImpl};
}
function options(fetchImpl) {
  return {key:'rk_live_mock_not_a_credential',parameters:new URLSearchParams({mode:'payment'}),
    idempotencyKey:'sn-probe-test-only',expectedSku:sku,fetchImpl};
}
test('create, expire, retrieve and expanded SKU succeed; secrets stay server-side',async()=>{
 const f=fixture();const r=await runCheckoutWriteProbe(options(f.fetchImpl));
 assert.equal(r.passed,true);assert.equal(r.paymentAttempted,false);assert.equal(r.cleanupRequired,false);
 assert.equal(r.sessionStatus,'expired');assert.equal(r.paymentStatus,'unpaid');
 assert.equal(f.calls.length,4);assert.ok(f.calls[1].url.endsWith('/expire'));
 assert.ok(f.calls[3].url.includes('expand%5B%5D=data.price.product'));
 assert.equal(f.calls[0].headers['Idempotency-Key'],'sn-probe-test-only');
 for(const call of f.calls)assert.ok(!/\/confirm|\/capture|\/charges/.test(call.url));
 assert.ok(!JSON.stringify(r).includes('DO_NOT_RETURN_ME'));
 assert.ok(!JSON.stringify(r).includes('rk_live_'));
});
test('missing write permission stops before other operations and redacts keys',async()=>{
 const f=fixture({0:{status:403,json:{error:{type:'invalid_request_error',code:'permission_missing',message:'Denied rk_live_DoNotExposeThisValue'}}}});
 const r=await runCheckoutWriteProbe(options(f.fetchImpl));
 assert.equal(r.passed,false);assert.equal(r.checks.create.httpStatus,403);assert.equal(f.calls.length,1);
 assert.ok(r.checks.create.message.includes('[REDACTED]'));assert.ok(!JSON.stringify(r).includes('rk_live_'));
});
test('failed expiration with still-open session is never marked as a pass',async()=>{
 const f=fixture({1:{status:403,json:{error:{code:'permission_missing'}}},2:{status:200,json:{...session,status:'open'}}});
 const r=await runCheckoutWriteProbe(options(f.fetchImpl));assert.equal(r.passed,false);assert.equal(r.cleanupRequired,true);
});
test('failed expanded product read does not undo confirmed expiration',async()=>{
 const f=fixture({3:{status:403,json:{error:{code:'permission_missing'}}}});
 const r=await runCheckoutWriteProbe(options(f.fetchImpl));assert.equal(r.passed,false);assert.equal(r.cleanupRequired,false);
 assert.equal(r.checks.lineItems.httpStatus,403);
});
test('repeated idempotent run accepts independently verified already-expired session',async()=>{
 const f=fixture({1:{status:400,json:{error:{code:'checkout_session_not_open'}}}});
 const r=await runCheckoutWriteProbe(options(f.fetchImpl));assert.equal(r.passed,true);assert.equal(r.cleanupRequired,false);
});
test('wrong API mode is rejected even though cleanup is attempted',async()=>{
 const f=fixture({0:{status:200,json:{...session,livemode:false,status:'open'}}});
 const r=await runCheckoutWriteProbe(options(f.fetchImpl));assert.equal(r.passed,false);
 assert.equal(r.checks.create.code,'unexpected_stripe_mode');assert.equal(f.calls[1].method,'POST');
});
test('network ambiguity on creation is explicitly reported, never as safe success',async()=>{
 const f=fixture({0:{throws:true}});const r=await runCheckoutWriteProbe(options(f.fetchImpl));
 assert.equal(r.passed,false);assert.equal(r.cleanupRequired,true);assert.equal(f.calls.length,1);
});
test('a paid status is an alarm rather than a successful no-charge test',async()=>{
 const f=fixture({2:{status:200,json:{...session,payment_status:'paid'}}});
 const r=await runCheckoutWriteProbe(options(f.fetchImpl));assert.equal(r.passed,false);
 assert.equal(r.checks.retrieve.code,'unexpected_session_state');
});
