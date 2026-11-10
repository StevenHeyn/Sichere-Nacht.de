'use client';
import {useEffect,useMemo,useState} from 'react';
import Link from 'next/link';
import productsData from '../../products.json';
import {CartDraft,loadCart,saveCart} from '../../lib/cart';
type Product={sku:string;name:string;priceCents:number;image:string|null};
const products=new Map((productsData as Product[]).map(p=>[p.sku,p]));
const money=(c:number)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(c/100);
type CheckoutFormInstance={mount:(selector:string)=>void;on:(event:'confirm',handler:(event:unknown)=>void)=>void;unmount?:()=>void;destroy?:()=>void};
type StripeConfirmResult={type:'success';session?:unknown}|{type:'error';error?:{message?:string;code?:string}};
type CheckoutFormSDK={createForm:(options:{layout:'expanded'})=>CheckoutFormInstance;loadActions:()=>Promise<{type:string;error?:{message?:string};actions?:{confirm:(options:{formConfirmEvent:unknown;returnUrl:string})=>Promise<StripeConfirmResult>}} >};
type StripeJsInstance={initCheckoutFormSdk:(options:{clientSecret:string;appearance:Record<string,unknown>})=>CheckoutFormSDK};
declare global { interface Window {Stripe?: (key:string)=>StripeJsInstance} }
function EmbeddedCheckout({secret,onError}:{secret:string;onError:(error:string)=>void}){
 useEffect(()=>{
  let active=true;let form:CheckoutFormInstance|undefined;
  const publishableKey=process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
  if(!publishableKey||!window.Stripe){onError('Stripe ist noch nicht vollständig eingerichtet. Bitte später erneut versuchen.');return;}
  try{
   const stripe=window.Stripe(publishableKey);
   const checkout=stripe.initCheckoutFormSdk({clientSecret:secret,appearance:{theme:'stripe',labels:'auto',inputs:'spaced',variables:{borderRadius:'4px',colorBackground:'#ffffff',colorDanger:'#df1b41',colorPrimary:'#0570de',colorSuccess:'#00c853',colorText:'#30313d',fontFamily:'default',fontSizeBase:'16px',spacingUnit:'4px'}}});
   form=checkout.createForm({layout:'expanded'});
   form.mount('#stripe-checkout-form');
   checkout.loadActions().then(result=>{
    if(!active)return;
    if(result.type!=='success'||!result.actions){onError(result.error?.message||'Die Zahlungsmaske konnte nicht geladen werden.');return;}
    form?.on('confirm',async event=>{
     try{
      const resultConfirm=await result.actions!.confirm({formConfirmEvent:event,returnUrl:window.location.origin+'/bestellung'});
      if(resultConfirm.type==='error'&&active)onError(resultConfirm.error?.message||'Stripe konnte die Zahlung nicht bestätigen.');
     }catch(err){
      if(!active)return;
      const e=err as {message?:unknown;code?:unknown;type?:unknown}|null;
      const message=e&&typeof e.message==='string'&&e.message.trim()?e.message.trim():null;
      const code=e&&typeof e.code==='string'?e.code:null;
      const kind=e&&typeof e.type==='string'?e.type:null;
      console.error('Stripe-Checkout-Bestätigung fehlgeschlagen',err);
      onError([message||'Die Stripe-Bestätigung ist fehlgeschlagen.',code?'Fehlercode: '+code:null,kind?'Typ: '+kind:null].filter(Boolean).join(' '));
     }
    });
   }).catch(()=>{if(active)onError('Die Zahlungsmaske ist zurzeit nicht erreichbar.')});
  }catch{onError('Die Zahlungsmaske konnte nicht initialisiert werden.')}
  return ()=>{active=false;try{form?.unmount?.()}catch{/* Stripe form is already gone */}}
 },[secret,onError]);
 return <div style={{background:'#fff',borderRadius:14,padding:16,color:'#152433'}}><div id="stripe-checkout-form"/><p style={{fontSize:12,color:'#465868',marginTop:12}}>Die Zahlungsdaten werden direkt über Stripe verarbeitet. Deine Bestellung gilt erst nach bestätigter Zahlung als bezahlt.</p></div>
}
export default function CartPage(){
 const [cart,setCart]=useState<CartDraft|null>(null);
 const [checkoutBusy,setCheckoutBusy]=useState(false);
 const [checkoutError,setCheckoutError]=useState('');
 const [checkoutSecret,setCheckoutSecret]=useState('');
 const [shippingCountry,setShippingCountry]=useState<'DE'|'AT'>('DE');
 useEffect(()=>{setCart(loadCart())},[]);
 const lines=useMemo(()=>cart?.items.map(line=>({...line,product:products.get(line.sku)}))||[],[cart]);
 const invalid=lines.filter(l=>!l.product);
 const subtotal=lines.reduce((sum,l)=>sum+(l.product?.priceCents||0)*l.quantity,0);
 const montage=cart?.installation?19900:0;
 const shipping=lines.length>0?(shippingCountry==='AT'?1990:990):0;
 const total=subtotal+montage+shipping;
 async function startCheckout(){
  if(!cart||checkoutBusy)return;
  setCheckoutBusy(true);setCheckoutError('');
  try{const response=await fetch('/api/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({items:cart.items,installation:cart.installation,vpId:cart.vpId,shippingCountry})});const payload=await response.json();if(!response.ok)throw new Error(payload.error||'Checkout derzeit nicht verfügbar');if(typeof payload.client_secret!=='string'||!payload.client_secret)throw new Error('Ungültige Zahlungsfreigabe');setCheckoutSecret(payload.client_secret);setCheckoutBusy(false);}catch(e){setCheckoutError(e instanceof Error?e.message:'Checkout derzeit nicht möglich');setCheckoutBusy(false);}
 }
 function update(items:CartDraft['items']){if(!cart)return;setCheckoutSecret('');setCart(saveCart({items,installation:cart.installation,installationZip:cart.installationZip,source:cart.source}));}
 function setInstallation(installation:boolean){if(!cart)return;setCheckoutSecret('');setCart(saveCart({items:cart.items,installation,installationZip:cart.installationZip,source:cart.source}));}
 function setZip(zip:string){if(!cart)return;setCheckoutSecret('');setCart(saveCart({items:cart.items,installation:cart.installation,installationZip:zip.replace(/\D/g,'').slice(0,5),source:cart.source}));}
 return <main className="wrap" style={{paddingBottom:80}}><nav className="nav"><Link href="/" className="brand">◈ SICHERE <span className="accent">NACHT</span></Link><Link href="/shop">Zum Shop</Link></nav><p className="accent">DEINE ZUSAMMENSTELLUNG</p><h1>Warenkorb</h1><p>Alle Preise inklusive 19 % Mehrwertsteuer. In dieser Testversion werden keine echten Zahlungen verarbeitet.</p>
 {!cart?<p>Warenkorb wird geladen …</p>:lines.length===0?<div className="card"><h2>Dein Warenkorb ist leer.</h2><p>Stelle deine Alarmanlage im Konfigurator zusammen oder wähle einzelne Artikel aus.</p><div className="row"><Link className="button" href="/konfigurator">Zum Konfigurator</Link><Link className="button secondary" href="/shop">Ajax-Produkte ansehen</Link></div></div>:<div className="grid" style={{gridTemplateColumns:'repeat(auto-fit,minmax(300px,1fr))',alignItems:'start'}}>
 <section className="card"><h2>Produkte ({lines.reduce((n,l)=>n+l.quantity,0)})</h2>{lines.map(l=><div key={l.sku} style={{display:'grid',gridTemplateColumns:'68px 1fr',gap:14,borderBottom:'1px solid #30445b',padding:'16px 0'}}>
 <div style={{width:68,height:68,background:'#f4f6f8',borderRadius:10,display:'grid',placeItems:'center'}}>{l.product?.image?<img src={l.product.image} alt="" width={65} height={65} style={{width:65,height:65,objectFit:'contain'}}/>:<span style={{color:'#456'}}>AJAX</span>}</div>
 <div><strong>{l.product?.name||'Unbekannte Artikelnummer'}</strong><p style={{fontSize:12,margin:'4px 0'}}>Art. {l.sku}</p><div className="row" style={{alignItems:'center'}}><label style={{margin:0}}>Anzahl <select aria-label={'Anzahl '+l.sku} value={l.quantity} style={{width:76,marginLeft:7}} onChange={e=>update(cart.items.map(i=>i.sku===l.sku?{...i,quantity:Number(e.target.value)}:i))}>{Array.from({length:30},(_,i)=><option key={i+1} value={i+1}>{i+1}</option>)}</select></label><button className="button secondary" onClick={()=>update(cart.items.filter(i=>i.sku!==l.sku))}>Entfernen</button></div><strong className="accent">{l.product?money(l.product.priceCents*l.quantity):'Preis nicht verfügbar'}</strong></div></div>)}</section>
 <aside className="card"><h2>Preisübersicht</h2><div style={{display:'flex',justifyContent:'space-between',gap:12}}><span>Ajax-Komponenten</span><strong>{money(subtotal)}</strong></div>
 <label style={{marginTop:22}}><input type="checkbox" checked={cart.installation} onChange={e=>setInstallation(e.target.checked)}/> Optionale Montage (+199,00 € brutto)</label>
 {cart.installation&&<><label htmlFor="plz">Montage-PLZ (Hamburg und Umgebung)</label><input id="plz" inputMode="numeric" value={cart.installationZip} maxLength={5} placeholder="z. B. 20095" onChange={e=>setZip(e.target.value)}/><p className="note">Die Montage ist nur nach Prüfung von Standort und Leistungsumfang buchbar. Ein PLZ-Check wird noch ergänzt.</p></>}

 <label htmlFor="shipping-country" style={{marginTop:16}}>Lieferland</label><select id="shipping-country" value={shippingCountry} onChange={e=>{setShippingCountry(e.target.value as 'DE'|'AT');setCheckoutSecret('');setCheckoutError('')}}><option value="DE">Deutschland</option><option value="AT">Österreich</option></select>
 <div style={{display:'flex',justifyContent:'space-between',gap:12,marginTop:16}}><span>Versand {shippingCountry==='AT'?'Österreich':'Deutschland'} (inkl. MwSt.)</span><strong>{money(shipping)}</strong></div><hr/><div style={{display:'flex',justifyContent:'space-between',gap:12}}> <span>Gesamt inkl. MwSt.</span><strong className="price">{money(total)}</strong></div><p>Darin enthaltene MwSt.: {money(Math.round(total*19/119))}</p><p className="note">Inklusive {money(shipping)} Versandpauschale nach {shippingCountry==='AT'?'Österreich':'Deutschland'}. Das Lieferland in der Zahlungsmaske ist entsprechend festgelegt.</p>
 {invalid.length>0&&<p style={{color:'#ffb38a'}}>Einige Artikel sind nicht mehr im aktuellen Katalog. Bitte prüfe die Auswahl.</p>}
 {!checkoutSecret&&<button type="button" className="button" onClick={startCheckout} disabled={process.env.NEXT_PUBLIC_CHECKOUT_ENABLED!=='true'||checkoutBusy||invalid.length>0||cart.installation} style={{width:'100%',cursor:process.env.NEXT_PUBLIC_CHECKOUT_ENABLED==='true'?'pointer':'not-allowed'}}>{checkoutBusy?'Zahlungsmaske wird vorbereitet …':process.env.NEXT_PUBLIC_CHECKOUT_ENABLED==='true'?'Sicher mit Stripe bezahlen':'Onlinezahlung noch nicht freigeschaltet'}</button>}{checkoutSecret&&<><h3>Sicher bezahlen</h3><EmbeddedCheckout secret={checkoutSecret} onError={setCheckoutError}/><button type="button" className="button secondary" onClick={()=>{setCheckoutSecret('');setCheckoutError('')}}>Zahlung schließen</button></>}{checkoutError&&<p role="alert" style={{color:'#ffb38a'}}>{checkoutError}</p>}<p className="note">Testbetrieb: Nur Stripe-Testzahlungen. Montagebuchungen benötigen eine separate Bestätigung.</p><Link href="/konfigurator">Konfiguration anpassen</Link></aside></div>}
 </main>;
}
