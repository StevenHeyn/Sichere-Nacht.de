import {createHash,timingSafeEqual} from 'node:crypto';
import {NextResponse} from 'next/server';
export const runtime='nodejs';
export const dynamic='force-dynamic';
type Check={status:'ok'|'missing'|'error'|'not_verified';httpStatus?:number;note?:string};
const checkEnv=(name:string)=>Boolean(process.env[name]);
function validToken(request:Request){
 const expected=process.env.ORDERS_ADMIN_TOKEN;
 const header=request.headers.get('authorization')||'';
 if(!expected||!header.startsWith('Bearer '))return false;
 const a=createHash('sha256').update(expected).digest();
 const b=createHash('sha256').update(header.slice(7)).digest();
 return timingSafeEqual(a,b);
}
async function checkSupabase():Promise<Check>{
 const base=process.env.SUPABASE_URL,secret=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!base||!secret)return {status:'missing'};
 try{
  const r=await fetch(new URL('/rest/v1/orders?select=id&limit=1',base),{
   headers:{apikey:secret,Authorization:'Bearer '+secret},cache:'no-store',
   signal:AbortSignal.timeout(9000)
  });
  return {status:r.ok?'ok':'error',httpStatus:r.status};
 }catch{return {status:'error',note:'Datenbank nicht erreichbar'}}
}
async function checkStripe():Promise<Check>{
 const key=process.env.STRIPE_SECRET_KEY;
 if(!key)return {status:'missing'};
 const live=key.startsWith('sk_live_')||key.startsWith('rk_live_');
 const test=key.startsWith('sk_test_')||key.startsWith('rk_test_');
 if(!live&&!test)return {status:'error',note:'Unbekannter Schlüsseltyp'};
 try{
  const r=await fetch('https://api.stripe.com/v1/checkout/sessions?limit=1',{
   headers:{Authorization:'Bearer '+key,'Stripe-Version':'2026-03-25.dahlia'},
   cache:'no-store',signal:AbortSignal.timeout(9000)
  });
  return {status:r.ok?'ok':'error',httpStatus:r.status,note:r.status===403?'Lesezugriff auf Checkout Sessions prüfen':undefined};
 }catch{return {status:'error',note:'Stripe nicht erreichbar'}}
}
async function checkMail():Promise<Check>{
 const key=process.env.RESEND_API_KEY,from=process.env.ORDER_EMAIL_FROM;
 if(!key||!from)return {status:'missing'};
 const domain=from.match(/@([a-z\d.-]+)/i)?.[1]?.toLowerCase();
 if(!domain)return {status:'error',note:'Absenderadresse prüfen'};
 try{
  const r=await fetch('https://api.resend.com/domains',{
   headers:{Authorization:'Bearer '+key},cache:'no-store',
   signal:AbortSignal.timeout(9000)
  });
  if(!r.ok)return {status:'error',httpStatus:r.status};
  const response=await r.json() as {data?:Array<{name?:string;status?:string}>};
  const found=response.data?.find(x=>x.name?.toLowerCase()===domain);
  return found?{status:found.status==='verified'?'ok':'not_verified',note:'Absenderdomain-Status: '+(found.status||'unbekannt')}:{status:'not_verified',note:'Absenderdomain nicht in Resend-Domainliste'};
 }catch{return {status:'error',note:'E-Mail-Dienst nicht erreichbar'}}
}
export async function GET(request:Request){
 if(!validToken(request))return NextResponse.json({error:'Nicht autorisiert'},{status:401,headers:{'cache-control':'no-store'}});
 const [database,stripe,mail]=await Promise.all([checkSupabase(),checkStripe(),checkMail()]);
 const gates={
  liveCheckout:process.env.CHECKOUT_ENABLED==='true'&&process.env.NEXT_PUBLIC_CHECKOUT_ENABLED==='true'&&process.env.PAYMENTS_LIVE_APPROVED==='true',
  siteIndexed:process.env.SITE_LIVE_APPROVED==='true'
 };
 return NextResponse.json({
  environment:process.env.VERCEL_ENV||'unknown',
  database,stripe,mail,
  webhookSecretConfigured:checkEnv('STRIPE_WEBHOOK_SECRET'),
  adminConfigured:checkEnv('ORDERS_ADMIN_TOKEN'),
  invoiceDetailsConfigured:['INVOICE_COMPANY_NAME','INVOICE_COMPANY_STREET','INVOICE_COMPANY_CITY','INVOICE_VAT_ID','INVOICE_REGISTRY','INVOICE_CONTACT_EMAIL'].every(checkEnv),
  gates,
  note:'Technischer Read-only-Test. Kein Beweis für Webhook-Zustellung, Steuern, Vertragsrecht oder erfolgreiche Zahlung.'
 },{headers:{'cache-control':'no-store'}});
}
