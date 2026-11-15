// Read-only deployment gate. No payments, messages or customer records are created.
if(process.env.VERCEL_ENV==='production'&&process.env.PAYMENTS_LIVE_APPROVED==='true'){
 const key=process.env.STRIPE_SECRET_KEY||'';
 if(!/^(sk|rk)_live_/.test(key)||!process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY?.startsWith('pk_live_'))throw Error('Live Stripe keys missing');
 for(const name of ['STRIPE_WEBHOOK_SECRET','SUPABASE_URL','SUPABASE_SERVICE_ROLE_KEY','RESEND_API_KEY','ORDER_EMAIL_FROM'])if(!process.env[name])throw Error('Live configuration missing: '+name);
 const headers={Authorization:'Bearer '+key,'Stripe-Version':'2026-03-25.dahlia'};
 async function get(path){const r=await fetch('https://api.stripe.com/v1/'+path,{headers,signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Live Stripe verification failed: '+path+' HTTP '+r.status);return r.json();}
 const account=await get('account');
 console.log('LIVE_PREFLIGHT',JSON.stringify({account:account.id,chargesEnabled:account.charges_enabled,payoutsEnabled:account.payouts_enabled,disabledReason:account.requirements?.disabled_reason||null}));
 if(account.id!=='acct_1UZTrE3j5e9NQUeQ'||!account.charges_enabled)throw Error('Stripe live charges not enabled for expected account');
 const hooks=await get('webhook_endpoints?limit=100');
 if(!hooks.data.some(h=>h.url==='https://sichere-nacht.de/api/stripe/webhook'&&h.livemode&&h.status==='enabled'&&['checkout.session.completed','checkout.session.async_payment_succeeded'].every(e=>h.enabled_events.includes(e)||h.enabled_events.includes('*'))))throw Error('Live payment webhook missing');
 const tax=await get('tax/registrations?status=active&limit=100');if(!tax.data.some(t=>t.country==='DE'&&t.status==='active'))throw Error('Active DE Stripe Tax registration missing');
 const db=await fetch(new URL('/rest/v1/orders?select=id&limit=0',process.env.SUPABASE_URL),{headers:{apikey:process.env.SUPABASE_SERVICE_ROLE_KEY,Authorization:'Bearer '+process.env.SUPABASE_SERVICE_ROLE_KEY},signal:AbortSignal.timeout(15000)});if(!db.ok)throw Error('Live order storage unavailable');
 console.log('LIVE_PREFLIGHT: account, webhook, tax and order storage verified');
}
