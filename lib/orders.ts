/* Server-only order storage via Supabase PostgREST. Never import into a client component. */
import 'server-only';

export type StoredOrder={
 stripe_session_id:string;
 stripe_payment_intent_id:string|null;
 stripe_event_id:string;
 status:'paid';
 amount_total:number;
 amount_subtotal:number|null;
 amount_tax:number|null;
 shipping_amount:number|null;
 currency:string;
 customer_email:string|null;
 customer_name:string|null;
 shipping_address:Record<string,unknown>|null;
 billing_address:Record<string,unknown>|null;
 items:Array<{sku:string|null;name:string;quantity:number;amount_total:number|null}>;
 shipping_country:string|null;
 vp_id:string|null;
 test_mode:boolean;
};

function settings(){
 const url=process.env.SUPABASE_URL;
 const key=process.env.SUPABASE_SERVICE_ROLE_KEY;
 if(!url||!key)throw new Error('Bestelldatenbank nicht konfiguriert');
 const u=new URL(url);
 if(u.protocol!=='https:')throw new Error('Ungültige Datenbankadresse');
 return {base:u.origin,key};
}
async function query(path:string,init:RequestInit){
 const {base,key}=settings();
 const response=await fetch(base+'/rest/v1/'+path,{
  ...init,
  headers:{apikey:key,Authorization:'Bearer '+key,'content-type':'application/json',...(init.headers||{})},
  cache:'no-store'
 });
 if(!response.ok){
  console.error('Bestelldatenbank-Anfrage fehlgeschlagen',response.status);
  throw new Error('Bestelldatenbank nicht erreichbar');
 }
 return response;
}
export function ordersConfigured(){
 return Boolean(process.env.SUPABASE_URL&&process.env.SUPABASE_SERVICE_ROLE_KEY);
}
export async function savePaidOrder(order:StoredOrder){
 // stripe_session_id is UNIQUE: a repeated webhook updates the same record.
 await query('orders?on_conflict=stripe_session_id',{
  method:'POST',
  headers:{Prefer:'resolution=merge-duplicates,return=minimal'},
  body:JSON.stringify(order)
 });
}
export async function listOrders(){
 const r=await query('orders?select=stripe_session_id,status,amount_total,currency,customer_email,customer_name,shipping_country,shipping_address,vp_id,test_mode,items,created_at&order=created_at.desc&limit=100',{method:'GET'});
 return r.json();
}
