import {NextResponse} from 'next/server';
import products from '../../../products.json';
export const runtime='nodejs';
type OrderLine={sku:string;quantity:number};
const priceBySku=new Map(products.map(p=>[p.sku,p]));
const error=(message:string,status:number)=>NextResponse.json({error:message},{status});
const intIn=(v:unknown,min:number,max:number)=>typeof v==='number'&&Number.isInteger(v)&&v>=min&&v<=max;
export async function POST(request:Request){
 const secret=process.env.STRIPE_SECRET_KEY;
 const isStripeTest=Boolean(secret?.startsWith('sk_test_'));
 const isStripeLive=Boolean(secret?.startsWith('sk_live_'));
 const enabled=process.env.CHECKOUT_ENABLED==='true'&&(
  (isStripeTest&&process.env.VERCEL_ENV==='preview'&&process.env.CHECKOUT_TEST_ENABLED==='true')||
  (isStripeLive&&process.env.VERCEL_ENV==='production'&&process.env.PAYMENTS_LIVE_APPROVED==='true')
 );
 const base=process.env.NEXT_PUBLIC_SITE_URL;
 if(!enabled||!secret||!base||!process.env.STRIPE_WEBHOOK_SECRET){
  return error('Der Bezahlvorgang ist noch nicht freigeschaltet. Bitte später erneut versuchen.',503);
 }
 let origin:string;
 try{origin=new URL(base).origin;if(!origin.startsWith('https://'))throw Error('non-https')}catch{return error('Shop-Adresse noch nicht freigegeben.',503)}
 const body=await request.json().catch(()=>null);
 if(!body||!Array.isArray(body.items)||body.items.length<1||body.items.length>50)return error('Ungültiger Warenkorb.',400);
 const country=body.shippingCountry;
 if(country!=='DE')return error('Der Versand ist derzeit ausschließlich innerhalb Deutschlands möglich.',400);
 const shipping=990;
 if(body.installation===true)return error('Montagebuchungen sind derzeit nur nach individueller Standortprüfung möglich. Bitte die Montageoption entfernen.',409);
 const cart=new Map<string,number>();
 for(const item of body.items as OrderLine[]){
  if(!item||typeof item.sku!=='string'||!intIn(item.quantity,1,30)||!priceBySku.has(item.sku))return error('Ungültige Produktdaten.',400);
  cart.set(item.sku,(cart.get(item.sku)||0)+item.quantity);
  if(cart.get(item.sku)!>30)return error('Maximale Stückzahl überschritten.',400);
 }
 const form=new URLSearchParams();
 form.set('mode','payment');
 form.set('ui_mode','form');
 form.set('return_url',origin+'/bestellung?session_id={CHECKOUT_SESSION_ID}');
 form.set('billing_address_collection','required');
 form.set('phone_number_collection[enabled]','false');
 form.set('shipping_address_collection[allowed_countries][0]',country);
 form.set('locale','de');
 form.set('automatic_tax[enabled]','true');
 form.set('submit_type','auto');
 form.set('integration_identifier','custom_embedded_web_0001');
 let i=0;
 for(const [sku,quantity] of cart){
  const p=priceBySku.get(sku)!;
  if(!intIn(p.priceCents,1,10000000))return error('Ungeprüfter Artikelpreis.',503);
  const prefix='line_items['+i+']';
  form.set(prefix+'[price_data][currency]','eur');
  form.set(prefix+'[price_data][unit_amount]',String(p.priceCents));
  form.set(prefix+'[price_data][tax_behavior]','inclusive');
  form.set(prefix+'[price_data][product_data][name]',p.name.slice(0,240));
  form.set(prefix+'[price_data][product_data][metadata][sku]',sku);
  form.set(prefix+'[quantity]',String(quantity));
  i++;
 }
 form.set('shipping_options[0][shipping_rate_data][type]','fixed_amount');
 form.set('shipping_options[0][shipping_rate_data][fixed_amount][amount]',String(shipping));
 form.set('shipping_options[0][shipping_rate_data][fixed_amount][currency]','eur');
 form.set('shipping_options[0][shipping_rate_data][tax_behavior]','inclusive');
 form.set('shipping_options[0][shipping_rate_data][display_name]','Standardversand Deutschland');
 const vp=typeof body.vpId==='string'?body.vpId.trim().toUpperCase():'';
 const registered=(process.env.VALID_PARTNER_IDS||'').split(',').map(x=>x.trim().toUpperCase()).filter(Boolean);
 if(/^VP-[A-Z0-9]{3,16}$/.test(vp)&&registered.includes(vp))form.set('metadata[vp_id]',vp);
 form.set('metadata[shop]','sichere-nacht');
 form.set('metadata[shipping_country]',country);
 form.set('metadata[attribution_status]',form.has('metadata[vp_id]')?'registered':'none');
 try{
  const response=await fetch('https://api.stripe.com/v1/checkout/sessions',{method:'POST',headers:{Authorization:'Bearer '+secret,'content-type':'application/x-www-form-urlencoded','Stripe-Version':'2026-03-25.dahlia'},body:form.toString(),cache:'no-store'});
  const data=await response.json();
  if(!response.ok||typeof data.client_secret!=='string')return error('Der Zahlungsdienst ist momentan nicht verfügbar.',502);
  return NextResponse.json({client_secret:data.client_secret});
 }catch{return error('Zahlung konnte nicht vorbereitet werden.',502)}
}
