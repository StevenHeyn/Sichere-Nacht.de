// Explicitly gated, temporary acceptance runner. Never an application route.
// Operates only on two already-paid sandbox orders and the internal test inbox.
import assert from 'node:assert/strict';
import {createHmac} from 'node:crypto';
import {readFileSync,writeFileSync,mkdtempSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';
import path from 'node:path';
import {createRequire} from 'node:module';
import ts from 'typescript';
const active=process.env.SN_SANDBOX_ACCEPTANCE==='orders-13-14-20261114';
if(active){
 const print=(step,result)=>console.log('SANDBOX_ACCEPTANCE '+JSON.stringify({step,...result}));
 const sleep=ms=>new Promise(r=>setTimeout(r,ms));
 const nativeFetch=globalThis.fetch;
 let stage='guard',temp;
 try{
  assert.equal(process.env.VERCEL_ENV,'preview');
  assert.equal(process.env.VERCEL_GIT_COMMIT_REF,'feature/combined-shop-preview');
  assert.equal(process.env.PAYMENTS_LIVE_APPROVED,'false');
  assert.ok((process.env.STRIPE_SECRET_KEY||'').startsWith('sk_test_'));
  assert.equal(process.env.SUPABASE_URL,'https://uotcoobumftugaprnhso.supabase.co');
  assert.equal(process.env.ORDER_EMAIL_TEST_TO,'sh@dein-snackautomat.de');
  assert.equal(new Date().toISOString().slice(0,10),'2026-11-14');
  for(const name of ['SUPABASE_SERVICE_ROLE_KEY','RESEND_API_KEY','STRIPE_WEBHOOK_SECRET'])assert.ok(process.env[name]);
  const base='https://sichere-nacht-de-git-featu-a4a9fd-dein-snackautomatdes-projects.vercel.app';
  async function json(url,init={}){const r=await nativeFetch(url,{...init,signal:AbortSignal.timeout(12000)});if(!r.ok)throw new Error('HTTP '+r.status+' at '+new URL(url).hostname);return r.json()}
  async function db(route,body){return json(process.env.SUPABASE_URL+'/rest/v1/'+route,{method:body?'POST':'GET',headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY,'content-type':'application/json'},...(body?{body:JSON.stringify(body)}:{})})}
  async function stripe(route){return json('https://api.stripe.com/v1/'+route,{headers:{Authorization:'Bearer '+process.env.STRIPE_SECRET_KEY,'Stripe-Version':'2026-03-25.dahlia'}})}
  async function mail(route){await sleep(700);return json('https://api.resend.com/'+route,{headers:{Authorization:'Bearer '+process.env.RESEND_API_KEY}})}
  stage='verify_original_test_orders';
  const orders=await db('orders?id=in.(13,14)&select=*&order=id.asc');assert.equal(orders.length,2);
  for(const [i,o] of orders.entries()){
   assert.equal(o.id,13+i);assert.equal(o.test_mode,true);assert.equal(o.status,'paid');assert.equal(o.customer_type,i?'b2b':'b2c');assert.ok(o.stripe_session_id.startsWith('cs_test_'));
   const s=await stripe('checkout/sessions/'+o.stripe_session_id);assert.equal(s.livemode,false);assert.equal(s.status,'complete');assert.equal(s.payment_status,'paid');assert.equal(s.metadata?.shop,'sichere-nacht');assert.equal(s.metadata?.customer_type,o.customer_type);assert.equal(s.amount_total,o.amount_total);assert.equal(s.total_details?.amount_tax,o.amount_tax);assert.equal(o.shipping_amount,990);assert.equal(Math.round(o.amount_total*19/119),o.amount_tax);
   print('stripe_order_verified',{orderId:o.id,buyerType:o.customer_type,total:o.amount_total,tax:o.amount_tax,shipping:o.shipping_amount,mode:'test',payment:'paid'});
  }
  stage='provider_confirmation_evidence';
  try{
   const listed=await mail('emails?limit=30');
   for(const o of orders){
    const matches=(listed.data||[]).filter(e=>e.subject==='Sichere Nacht: Deine Bestellbestätigung'&&Array.isArray(e.to)&&e.to.length===1&&e.to[0].toLowerCase()===process.env.ORDER_EMAIL_TEST_TO&&Math.abs(Date.parse(e.created_at)-Date.parse(o.created_at))<15000);
    if(matches.length!==1){print('confirmation_provider',{orderId:o.id,result:'no_unique_match',matches:matches.length});continue;}
    const sent=await mail('emails/'+matches[0].id),html=sent.html||'';
    const attachments=await mail('emails/'+matches[0].id+'/attachments');
    const names=(attachments.data||[]).map(a=>a.filename);
    const expected=o.customer_type==='b2b'?'Unternehmenskauf-Sichere-Nacht.txt':'Widerrufsbelehrung-Sichere-Nacht.txt';
    const wrong=o.customer_type==='b2b'?'Widerrufsbelehrung-Sichere-Nacht.txt':'Unternehmenskauf-Sichere-Nacht.txt';
    const textAttachment=(attachments.data||[]).find(a=>a.filename===expected);let attachmentTextChecked=false;
    if(textAttachment?.download_url){const u=new URL(textAttachment.download_url);if(u.protocol==='https:'&&u.hostname==='outbound-cdn.resend.com'){const r=await nativeFetch(u,{signal:AbortSignal.timeout(10000)});if(r.ok){const text=await r.text();attachmentTextChecked=o.customer_type==='b2b'?text.includes('kein freiwilliges Widerrufsrecht')&&!text.includes('Muster-Widerrufsformular'):text.includes('Muster-Widerrufsformular')&&text.includes('vierzehn Tagen');}}}
    print('confirmation_provider',{orderId:o.id,lastEvent:sent.last_event,attachments:names,correctAttachments:names.includes(expected)&&!names.includes(wrong)&&names.includes('Auftragsbestaetigung-Sichere-Nacht.pdf'),attachmentTextChecked,correctBuyerNotice:o.customer_type==='b2b'?html.includes('kein freiwilliges Widerrufsrecht'):html.includes('Verbraucher')&&!html.includes('kein freiwilliges Widerrufsrecht')});
   }
  }catch(e){print('confirmation_provider',{result:'not_verified',reason:e.message?.startsWith('HTTP ')?e.message:'provider inspection unavailable'});}
  stage='signed_test_event_replay';
  const endpoints=await stripe('webhook_endpoints?limit=50');const endpoint=endpoints.data?.find(e=>e.livemode===false&&e.status==='enabled'&&new URL(e.url).origin===base&&new URL(e.url).pathname==='/api/stripe/webhook');
  if(endpoint){
   for(const o of orders){
    const event=await stripe('events/'+o.stripe_event_id);assert.equal(event.livemode,false);assert.equal(event.data?.object?.id,o.stripe_session_id);assert.ok(['checkout.session.completed','checkout.session.async_payment_succeeded'].includes(event.type));
    const payload=JSON.stringify(event),t=Math.floor(Date.now()/1000).toString(),sig=createHmac('sha256',process.env.STRIPE_WEBHOOK_SECRET).update(t+'.'+payload).digest('hex');
    const r=await nativeFetch(endpoint.url,{method:'POST',headers:{'content-type':'application/json','stripe-signature':'t='+t+',v1='+sig},body:payload,signal:AbortSignal.timeout(15000)});const response=await r.json().catch(()=>({}));
    const rows=await db('orders?stripe_session_id=eq.'+encodeURIComponent(o.stripe_session_id)+'&select=id');const jobs=await db('order_mail_jobs?order_id=eq.'+o.id+'&kind=eq.confirmation&select=status,attempts');
    print('replay',{orderId:o.id,kind:'locally signed replay of original Stripe TEST event',http:r.status,stored:response.stored===true,orders:rows.length,confirmationJobs:jobs.length,confirmationAttempts:jobs[0]?.attempts,confirmationStatus:jobs[0]?.status});
    assert.equal(r.status,200);assert.equal(response.stored,true);assert.equal(rows.length,1);assert.equal(jobs.length,1);assert.equal(jobs[0].status,'sent');assert.equal(jobs[0].attempts,1);
   }
  }else print('replay',{result:'not_executed',reason:'matching test endpoint not found'});
  // Transpile the existing server mail pipeline for this private CLI only.
  // This removes only the bundler sentinel; no application authorization is bypassed.
  temp=mkdtempSync(path.join(tmpdir(),'sn-test-invoices-'));
  for(const module of ['buyer-policy','buyer-correspondence','invoice-pdf','order-notifications']){
   const src=readFileSync('lib/'+module+'.ts','utf8').replace("import 'server-only';",'');
   writeFileSync(path.join(temp,module+'.js'),ts.transpileModule(src,{compilerOptions:{target:ts.ScriptTarget.ES2022,module:ts.ModuleKind.CommonJS}}).outputText);
  }
  const require=createRequire(path.join(temp,'runner.cjs'));const {dispatchOrderMail}=require('./order-notifications.js');
  const captured=new Map();let currentId=null;
  globalThis.fetch=async(url,init={})=>{
   if(String(url)==='https://api.resend.com/emails'&&init.method==='POST'){
    assert.ok([13,14].includes(currentId));const payload=JSON.parse(init.body);assert.deepEqual(payload.to,[process.env.ORDER_EMAIL_TEST_TO]);
    assert.equal(payload.subject,'Sichere Nacht: Deine Rechnung');assert.equal(payload.attachments?.length,1);
    assert.match(payload.attachments[0].filename,/^Rechnung-SN-TEST-2026-00001[34]\.pdf$/);
    const pdf=Buffer.from(payload.attachments[0].content,'base64').toString('latin1');assert.ok(pdf.includes('TESTDOKUMENT - KEIN ORIGINAL'));assert.ok(pdf.includes('nicht f'));assert.ok(pdf.includes(currentId===14?'ViaCash GmbH':'B2C / Privatkauf'));
    payload.subject='[TEST] '+payload.subject;payload.html='<p><strong>SANDBOX-TEST: kein echter Versand, keine echte Rechnung, nicht buchen.</strong></p>'+payload.html;
    await sleep(700);const r=await nativeFetch(url,{...init,body:JSON.stringify(payload),signal:AbortSignal.timeout(15000)});const info=await r.clone().json().catch(()=>({}));if(r.ok)captured.set(currentId,{id:info.id,filename:payload.attachments[0].filename});return r;
   }
   return nativeFetch(url,init);
  };
  stage='simulate_supplier_and_invoice';
  for(const o of orders){
   currentId=o.id;let [s]=await db('supplier_fulfillments?order_id=eq.'+o.id+'&select=status');
   const reference='SANDBOX-TEST '+o.id+' - keine echte Beauftragung';
   if(s.status==='pending')s=await db('rpc/record_secplan_progress',{p_session_id:o.stripe_session_id,p_action:'submitted',p_reference:reference,p_stock_confirmed:true,p_stock_evidence:'SIMULIERTER TEST - kein SECPLAN-Bestand nachgewiesen'});
   if(s.status==='submitted')s=await db('rpc/record_secplan_progress',{p_session_id:o.stripe_session_id,p_action:'confirmed',p_reference:'SANDBOX-TEST '+o.id+' - simulierte Annahme'});
   if(s.status==='confirmed')s=await db('rpc/record_secplan_progress',{p_session_id:o.stripe_session_id,p_action:'shipped',p_reference:'SANDBOX-TEST '+o.id+' - kein echter Versand',p_complete:true,p_dispatched_at:new Date().toISOString()});
   assert.equal(s.status,'shipped');const result=await dispatchOrderMail(o.stripe_session_id,'invoice');const repeated=await dispatchOrderMail(o.stripe_session_id,'invoice');
   const [record]=await db('orders?id=eq.'+o.id+'&select=test_mode,invoice_number,customer_type,invoice_snapshot');assert.equal(record.test_mode,true);assert.match(record.invoice_number,/^SN-TEST-/);assert.equal(record.invoice_snapshot.customer_type,o.customer_type);
   const jobs=await db('order_mail_jobs?order_id=eq.'+o.id+'&kind=eq.invoice&select=status,attempts');assert.equal(jobs.length,1);assert.equal(jobs[0].status,'sent');assert.equal(jobs[0].attempts,1);
   print('invoice',{orderId:o.id,result:result.status,repeated:repeated.status,number:record.invoice_number,test:true,supplier:'simulated only',buyerSnapshotMatches:true,mailStatus:jobs[0].status,attempts:jobs[0].attempts});
  }
  globalThis.fetch=nativeFetch;stage='invoice_provider_delivery';await sleep(2500);
  for(const [orderId,info] of captured){try{const email=await mail('emails/'+info.id);print('invoice_provider',{orderId,lastEvent:email.last_event,attachment:info.filename,internalRecipientOnly:email.to?.length===1&&email.to[0]===process.env.ORDER_EMAIL_TEST_TO})}catch{print('invoice_provider',{orderId,result:'delivery_not_verified'})}}
  print('complete',{processedTestOrders:2,livePayments:0,supplierOrdersSent:0,notice:'Recipient-server acceptance is not proof the user read the email.'});
 }catch(e){print('stopped',{stage,error:e.message?.startsWith('HTTP ')?e.message:(e.code||'acceptance_check_failed')});throw new Error('Sandbox acceptance stopped at '+stage)}
 finally{globalThis.fetch=nativeFetch;if(temp)rmSync(temp,{recursive:true,force:true})}
}
