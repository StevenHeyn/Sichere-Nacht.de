'use client';
import {useEffect,useMemo,useRef,useState} from 'react';
import Link from 'next/link';
import productsData from '../../products.json';
import {type CartDraft,loadCart,saveCart} from '../../lib/cart';
import BuyerSelector from '../components/buyer-selector';
import {type BuyerInput,B2B_WITHDRAWAL_NOTE,B2C_WITHDRAWAL_NOTE} from '../../lib/buyer-policy';
import {checkSystem} from '../../lib/system-check';
import {approvedReferral} from '../../lib/referral-consent';
import {loadStripeScript} from '../../lib/load-stripe';
type Product=(typeof productsData)[number];
const products=new Map(productsData.map(p=>[p.sku,p]));
const money=(c:number)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:'EUR'}).format(c/100);
type Form={mount:(selector:string)=>void;on:(event:'confirm',handler:(event:unknown)=>void)=>void;unmount?:()=>void};
type Confirm={type:string;error?:{message?:string}};
type Sdk={createForm:(options:{layout:'expanded'})=>Form;loadActions:()=>Promise<{type:string;error?:{message?:string};actions?:{confirm:(options:{formConfirmEvent:unknown})=>Promise<Confirm>}}>};
type StripeJsInstance={initCheckoutFormSdk:(options:{clientSecret:string;appearance:Record<string,unknown>})=>Sdk};
declare global{interface Window{Stripe?:(key:string)=>StripeJsInstance}}
function EmbeddedCheckout({secret,onError}:{secret:string;onError:(error:string)=>void}){
 useEffect(()=>{let active=true;let form:Form|undefined;const key=process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;
 if(!key||!window.Stripe){onError('Zahlungsdienst noch nicht vollständig geladen. Bitte die Zahlungsmaske schließen und erneut öffnen.');return}
 try{const checkout=window.Stripe(key).initCheckoutFormSdk({clientSecret:secret,appearance:{theme:'stripe',variables:{colorPrimary:'#176b5a',borderRadius:'8px',fontFamily:'Arial, sans-serif'}}});form=checkout.createForm({layout:'expanded'});form.mount('#stripe-checkout-form');checkout.loadActions().then(result=>{if(!active)return;if(result.type!=='success'||!result.actions){onError(result.error?.message||'Zahlungsmaske konnte nicht geladen werden.');return}form?.on('confirm',async event=>{try{const r=await result.actions!.confirm({formConfirmEvent:event});if(active&&r.type==='error')onError(r.error?.message||'Zahlung nicht bestätigt. Bitte die Zahlungsangaben prüfen.')}catch{if(active)onError('Zahlung konnte nicht bestätigt werden. Bitte den Zahlungsstatus prüfen, bevor du erneut bestellst.')}})}).catch(()=>{if(active)onError('Zahlungsdienst nicht erreichbar.')})}catch{onError('Zahlungsmaske konnte nicht initialisiert werden.')}
 return()=>{active=false;try{form?.unmount?.()}catch{/* Form already removed. */}};
 },[secret,onError]);return <div style={{background:'#fff',color:'#152433',padding:18,borderRadius:14}}><div id="stripe-checkout-form"/><p style={{fontSize:12}}>Zahlungsdaten werden direkt über Stripe verarbeitet. Maßgeblich ist die serverseitige Zahlungsprüfung.</p></div>;
}
export default function CartPage(){
 const [cart,setCart]=useState<CartDraft|null>(null),[buyer,setBuyer]=useState<BuyerInput>({customerType:'b2c',company:'',businessPurchaseDeclared:false});
 const [checkoutBusy,setBusy]=useState(false),[checkoutError,setCheckoutError]=useState(''),[checkoutSecret,setCheckoutSecret]=useState('');
 const revision=useRef(0),controller=useRef<AbortController|null>(null);
 useEffect(()=>{setCart(loadCart());return()=>{controller.current?.abort();revision.current++}},[]);
 const lines=useMemo(()=>cart?.items.map(l=>({...l,product:products.get(l.sku)}))||[],[cart]);
 const invalid=lines.filter(l=>!l.product||!Number.isInteger(l.product.priceCents)||l.product.priceCents<=0);
 const system=useMemo(()=>checkSystem(lines.filter(l=>l.product).map(l=>({product:l.product as Product,quantity:l.quantity})),cart?.source==='konfigurator'),[lines,cart?.source]);
 const subtotal=lines.reduce((sum,l)=>sum+(l.product?.priceCents||0)*l.quantity,0),shipping=lines.length?990:0,total=subtotal+shipping;
 const buyerValid=buyer.customerType==='b2c'||(buyer.company.trim().length>=2&&buyer.businessPurchaseDeclared);
 function invalidateCheckout(){revision.current++;controller.current?.abort();setCheckoutSecret('');setCheckoutError('');setBusy(false)}
 function changeBuyer(value:BuyerInput){invalidateCheckout();setBuyer(value)}
 function update(items:CartDraft['items']){if(!cart)return;invalidateCheckout();setCart(saveCart({...cart,items}))}
 function installation(value:boolean){if(!cart)return;invalidateCheckout();setCart(saveCart({...cart,installation:value}))}
 async function startCheckout(){
  if(!cart||checkoutBusy||!buyerValid||invalid.length||system.errors.length)return;
  const current=++revision.current;controller.current?.abort();const abort=new AbortController();controller.current=abort;setBusy(true);setCheckoutError('');
  try{await loadStripeScript();if(current!==revision.current)return;const ref=approvedReferral();const r=await fetch('/api/checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({items:cart.items,installation:false,shippingCountry:'DE',source:cart.source,buyer,vpId:ref?.vpId||'',referralConsent:ref?{policy:ref.policy,consentedAt:ref.consentedAt,expiresAt:ref.expiresAt}:null}),signal:abort.signal});const d=await r.json();if(current!==revision.current)return;if(!r.ok)throw new Error(d.error||'Checkout derzeit nicht verfügbar.');if(typeof d.client_secret!=='string')throw new Error('Ungültige Zahlungsmaske.');setCheckoutSecret(d.client_secret)}catch(e){if(current===revision.current&&!abort.signal.aborted)setCheckoutError(e instanceof Error?e.message:'Checkout derzeit nicht möglich.')}finally{if(current===revision.current)setBusy(false)}
 }
 return <main id="main-content" className="wrap editorialPage"><p className="eyebrow">DEINE AUSWAHL</p><h1>Warenkorb</h1><p>Geräte und Deutschlandversand inklusive 19 % Umsatzsteuer. Montage wird ausschließlich separat angefragt.</p>
 {!cart?<p role="status">Warenkorb wird geladen …</p>:!lines.length?<section className="card"><h2>Noch keine Artikel ausgewählt.</h2><div className="row"><Link className="button" href="/konfigurator">Anlage planen</Link><Link className="button secondary" href="/shop">Shop öffnen</Link></div></section>:<><BuyerSelector value={buyer} onChange={changeBuyer}/><div className="planGrid"><section><div className="card"><h2>Deine Komponenten</h2>{lines.map(l=><article className="rec recProduct" key={l.sku}><div className="recImage">{l.product?.image&&<img src={l.product.image} alt="" width={72} height={72}/>}</div><div><Link href={'/shop/'+encodeURIComponent(l.sku)}><strong>{l.product?.name||'Artikel nicht verfügbar'}</strong></Link><p className="note">Artikel {l.sku}</p><label>Menge <input className="planQuantity" type="number" min={1} max={30} value={l.quantity} onChange={e=>update(cart.items.map(i=>i.sku===l.sku?{...i,quantity:Math.max(1,Math.min(30,Math.floor(Number(e.target.value)||1)))}:i))}/></label><button type="button" className="textButton" onClick={()=>update(cart.items.filter(i=>i.sku!==l.sku))}>Entfernen</button></div><strong className="recAmount">{money((l.product?.priceCents||0)*l.quantity)}</strong></article>)}</div>
 {(system.errors.length>0||system.warnings.length>0)&&<div className="planWarnings" role="status"><h3>Systemprüfung</h3>{system.errors.map(x=><p className="planError" key={x}>{x}</p>)}{system.warnings.map(x=><p key={x}>{x}</p>)}<p>Diese Prüfung erkennt ausgewählte technische Konflikte, nicht jede Objekt- oder Produktvariante.</p><Link href="/kontakt">Zusammenstellung fachlich prüfen lassen</Link></div>}
 <section className="card" style={{marginTop:22}}><h2>Montagewunsch separat</h2><label><input type="checkbox" checked={cart.installation} onChange={e=>installation(e.target.checked)}/> Ich interessiere mich für Montage in Hamburg und Umgebung.</label>{cart.installation&&<><p>Der bisherige Preisansatz beträgt 199 € brutto. Standort und Leistungsumfang müssen bestätigt werden. Er ist <strong>nicht im folgenden Zahlbetrag enthalten</strong>.</p><label>Montage-PLZ<input inputMode="numeric" maxLength={5} value={cart.installationZip} onChange={e=>setCart(saveCart({...cart,installationZip:e.target.value.replace(/\D/g,'').slice(0,5)}))}/></label><Link href={'/kontakt?anliegen=montage&plz='+cart.installationZip} className="button secondary">Montage separat anfragen</Link><p className="note">Ein Häkchen oder Warenkauf allein versendet noch keine Montageanfrage und bucht keinen Termin.</p></>}</section></section>
 <aside className="card planAside"><h2>Dein Warenkauf</h2><div className="costRow"><span>Geräte</span><strong>{money(subtotal)}</strong></div><div className="costRow"><span>Versand Deutschland</span><strong>{money(shipping)}</strong></div><hr/><div className="costRow"><span>Gesamt brutto</span><strong className="price">{money(total)}</strong></div><p className="note">Darin 19 % Umsatzsteuer: {money(Math.round(total*19/119))}. SECPLAN-Direktversand; keine automatische Live-Bestandsanzeige. <Link href="/versand">Lieferbedingungen</Link></p>
 <p>{buyer.customerType==='b2b'?B2B_WITHDRAWAL_NOTE:B2C_WITHDRAWAL_NOTE}</p><p className="note"><Link href="/agb">AGB</Link> · <Link href="/datenschutz">Datenschutz</Link>{buyer.customerType==='b2c'&&<> · <Link href="/widerruf">Widerrufsbelehrung</Link></>}</p>
 {invalid.length>0&&<p role="alert">Mindestens ein Artikel hat keinen gültigen Verkaufspreis. Bitte entferne ihn.</p>}
 {!checkoutSecret?<button type="button" className="button" onClick={startCheckout} disabled={process.env.NEXT_PUBLIC_CHECKOUT_ENABLED!=='true'||checkoutBusy||!buyerValid||!!invalid.length||!!system.errors.length} style={{width:'100%'}}>{checkoutBusy?'Zahlungsmaske wird vorbereitet …':process.env.NEXT_PUBLIC_CHECKOUT_ENABLED==='true'?'Sicher mit Stripe bezahlen':'Onlinezahlung noch nicht freigeschaltet'}</button>:<><h3>Sicher bezahlen</h3><EmbeddedCheckout secret={checkoutSecret} onError={setCheckoutError}/><button className="button secondary" type="button" onClick={invalidateCheckout}>Zahlung schließen</button></>}
 {checkoutError&&<p role="alert" className="planError">{checkoutError}</p>}<p className="note">Eine Rückleitung allein bestätigt keine Zahlung. Der Auftrag wird erst nach serverseitiger Prüfung als bezahlt erfasst.</p><Link href="/konfigurator">Konfiguration ändern</Link></aside></div></>}
 </main>;
}
