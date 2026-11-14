// Read-only checks, strictly restricted to our staging branch. Never prints credentials or customer records.
if(process.env.VERCEL_ENV==='preview'&&process.env.VERCEL_GIT_COMMIT_REF==='feature/combined-shop-preview'){
 const key=process.env.STRIPE_SECRET_KEY||'';
 if(!key.startsWith('sk_test_'))throw new Error('Staging requires a Stripe test secret, never a live secret');
 const headers={Authorization:'Bearer '+key,'Stripe-Version':'2026-03-25.dahlia'};
 for(const path of ['webhook_endpoints?limit=20','tax/settings']){
  try{
   const r=await fetch('https://api.stripe.com/v1/'+path,{headers,signal:AbortSignal.timeout(10000)});const d=await r.json();
   if(!r.ok){console.log('STAGING_PREFLIGHT',JSON.stringify({resource:path,status:r.status,code:d.error?.code,type:d.error?.type}));continue}
   if(path.startsWith('webhook'))console.log('STAGING_PREFLIGHT',JSON.stringify({resource:'test_webhooks',entries:d.data.map(e=>{const u=new URL(e.url);return {id:e.id,url:u.origin+u.pathname,enabled:e.status,livemode:e.livemode,events:e.enabled_events}})}));
   else console.log('STAGING_PREFLIGHT',JSON.stringify({resource:'tax_settings',status:d.status,country:d.head_office?.address?.country,defaultTaxCode:d.defaults?.tax_code}));
  }catch{console.log('STAGING_PREFLIGHT',JSON.stringify({resource:path,error:'unavailable'}))}
 }
 console.log('STAGING_PREFLIGHT',JSON.stringify({mailConfigured:!!process.env.RESEND_API_KEY&&!!process.env.ORDER_EMAIL_FROM,internalTestRecipientConfigured:!!process.env.ORDER_EMAIL_TEST_TO,databaseConfigured:!!process.env.SUPABASE_URL&&!!process.env.SUPABASE_SERVICE_ROLE_KEY,liveGate:process.env.PAYMENTS_LIVE_APPROVED==='true'}));
}
