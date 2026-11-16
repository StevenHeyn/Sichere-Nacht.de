// Explicit release check only. Opens unpaid diagnostic sessions and expires them.
// Never confirms a PaymentIntent, sends email, or writes partner/customer orders.
import {randomUUID} from 'node:crypto';
import {checkoutForm} from '../lib/merch-payment-model.ts';
const key=process.env.STRIPE_SECRET_KEY||'';
if(process.env.VERCEL_ENV!=='production'||process.env.PAYMENTS_LIVE_APPROVED!=='true'||!/^(sk|rk)_live_/.test(key))throw Error('Approved production payment environment required');
async function api(path,body,idempotency){const r=await fetch('https://api.stripe.com/v1/'+path,{method:body?'POST':'GET',headers:{Authorization:'Bearer '+key,'Stripe-Version':'2026-09-30.endive',...(body?{'content-type':'application/x-www-form-urlencoded'}:{}),...(idempotency?{'Idempotency-Key':idempotency}:{})},body:body?.toString(),signal:AbortSignal.timeout(20000)});const data=await r.json();if(!r.ok)throw Error('Merch release probe: '+path.split('?')[0]+' HTTP '+r.status+' '+(data.error?.code||'')+' '+(data.error?.param||'')+' '+(data.error?.message||'').replace(/[sr]k_(live|test)_\S+/g,'[redacted]'));return data}
const account=await api('account');if(account.id!=='acct_1UZTrE3j5e9NQUeQ'||!account.charges_enabled)throw Error('Unexpected or disabled merchant account');
const rates=await api('tax_rates?active=true&limit=100');let rate=rates.data.find(r=>r.active&&r.inclusive&&r.percentage===19&&r.country==='DE');
if(!rate)rate=await api('tax_rates',new URLSearchParams({display_name:'MwSt.',percentage:'19',inclusive:'true',country:'DE',jurisdiction:'Deutschland',description:'Sichere Nacht Werbemittel · 19 % inklusive'}),'sn-merch-vat-de-inclusive-v1');
for(const [amount,tax,label,product] of [[2908,464,'500 Stück · Visitenkarten','business-card'],[5016,801,'1.000 Stück · DIN-A5-Flyer','qr-flyer'],[48652,7768,'1 Set · Strauss-Arbeitskleidungsset · 6 Teile','strauss-workwear-set']]){
 const form=checkoutForm({id:randomUUID(),user_id:randomUUID(),quote_total_cents:amount,quote_description:label,product_id:product,size:'Winterjacke: L · Softshell: M · 3 Polos: M · Pullover: XL'},'',rate.id);
 form.delete('customer_email');form.set('metadata[diagnostic]','merch-release-probe');
 let session;
 try{session=await api('checkout/sessions',form,'sn-merch-probe-'+randomUUID());
  if(!session.livemode||session.amount_total!==amount||session.total_details?.amount_tax!==tax||session.payment_status!=='unpaid'||!session.url?.startsWith('https://checkout.stripe.com/'))throw Error('Unexpected gross total, VAT or session state');
 }finally{if(session?.id){const expired=await api('checkout/sessions/'+session.id+'/expire',new URLSearchParams());if(expired.status!=='expired')throw Error('Diagnostic checkout was not expired');}}
 console.log('MERCH_CHECKOUT_VERIFIED',JSON.stringify({grossCents:amount,vatCents:tax,status:'unpaid_and_expired',account:'H&K Projekt UG'}));
}
