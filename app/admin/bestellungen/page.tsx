'use client';
import {useState} from 'react';
import Link from 'next/link';
type Order={stripe_session_id:string;status:string;amount_total:number;currency:string;customer_email:string|null;customer_name:string|null;shipping_country:string|null;shipping_address:Record<string,string|null>|null;vp_id:string|null;test_mode:boolean;items:Array<{name:string;sku:string|null;quantity:number}>;created_at:string;fulfillment_status:string;shipped_at:string|null;invoice_number:string|null};
export default function Bestellungen(){
 const [token,setToken]=useState('');
 const [orders,setOrders]=useState<Order[]>([]);
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 const [health,setHealth]=useState<null|{environment:string;database:{status:string;httpStatus?:number;note?:string};stripe:{status:string;httpStatus?:number;note?:string};mail:{status:string;httpStatus?:number;note?:string};webhookSecretConfigured:boolean;adminConfigured:boolean;invoiceDetailsConfigured:boolean;gates:{liveCheckout:boolean;siteIndexed:boolean};note:string}>(null);
 async function load(){
  setBusy(true);setMessage('');
  try{
   const r=await fetch('/api/admin/orders',{headers:{Authorization:'Bearer '+token},cache:'no-store'});
   const data=await r.json();
   if(!r.ok)throw new Error(data.error||'Zugriff fehlgeschlagen');
   setOrders(data.orders);
  }catch(e){setOrders([]);setMessage(e instanceof Error?e.message:'Fehler beim Laden')}
  finally{setBusy(false)}
 }
 async function loadHealth(){
  setBusy(true);setMessage('');
  try{
   const r=await fetch('/api/admin/health',{headers:{Authorization:'Bearer '+token},cache:'no-store'});
   const data=await r.json();
   if(!r.ok)throw new Error(data.error||'Systemprüfung fehlgeschlagen');
   setHealth(data);
  }catch(e){setHealth(null);setMessage(e instanceof Error?e.message:'Systemprüfung fehlgeschlagen')}
  finally{setBusy(false)}
 }
 async function action(sessionId:string,operation:string){
  if(operation==='shipped'&&!window.confirm('Bestellung tatsächlich an den Versand übergeben? Dadurch wird die Rechnung vorbereitet.'))return;
  setBusy(true);setMessage('');
  try{
   const r=await fetch('/api/admin/orders',{method:'POST',headers:{Authorization:'Bearer '+token,'content-type':'application/json'},body:JSON.stringify({sessionId,action:operation})});
   const data=await r.json();if(!r.ok)throw new Error(data.error||'Aktion fehlgeschlagen');
   setMessage(operation==='shipped'?'Als versendet markiert. Rechnungs-E-Mail: '+data.invoiceMail:'E-Mail: '+data.status);
   const next=await fetch('/api/admin/orders',{headers:{Authorization:'Bearer '+token},cache:'no-store'});
   if(next.ok)setOrders((await next.json()).orders);
  }catch(e){setMessage(e instanceof Error?e.message:'Aktion fehlgeschlagen')}
  finally{setBusy(false)}
 }
 const money=(n:number,c:string)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:c.toUpperCase()}).format(n/100);
 return <main className="wrap" style={{paddingBottom:80,maxWidth:1050}}>
  <nav className="nav"><Link href="/" className="brand">◈ SICHERE <span className="accent">NACHT</span></Link><Link href="/shop">Shop</Link></nav>
  <p className="accent">VERWALTUNG</p><h1>Bestellungen</h1>
  <p>Bestellbestätigungen werden nach bestätigter Zahlung vorgemerkt. Rechnungen werden erst nach der Versandmarkierung ausgelöst. Fehlende Steuerdaten blockieren die Rechnung.</p>
  <section className="card" style={{maxWidth:550}}>
   <label htmlFor="admin-token">Admin-Zugriffsschlüssel</label>
   <input id="admin-token" type="password" autoComplete="off" value={token} onChange={e=>setToken(e.target.value)} placeholder="Admin-Schlüssel"/>
   <div className="row"><button className="button" type="button" disabled={!token||busy} onClick={load}>{busy?'Bitte warten …':'Bestellungen laden'}</button><button className="button secondary" type="button" disabled={!token||busy} onClick={loadHealth}>Systemcheck</button><button className="button secondary" type="button" onClick={()=>{setToken('');setOrders([]);setHealth(null)}}>Sitzung beenden</button></div>
   {message&&<p role="status">{message}</p>}
  </section>
  {health&&<section className="card" style={{marginTop:22}}>
    <h2>Technischer Systemcheck ({health.environment})</h2>
    <p><strong>Supabase:</strong> {health.database.status}{health.database.httpStatus?' (HTTP '+health.database.httpStatus+')':''} {health.database.note||''}</p>
    <p><strong>Stripe-API:</strong> {health.stripe.status}{health.stripe.httpStatus?' (HTTP '+health.stripe.httpStatus+')':''} {health.stripe.note||''}</p>
    <p><strong>Resend:</strong> {health.mail.status}{health.mail.httpStatus?' (HTTP '+health.mail.httpStatus+')':''} {health.mail.note||''}</p>
    <p><strong>Webhook-Signatur:</strong> {health.webhookSecretConfigured?'Schlüssel hinterlegt':'Fehlt'} · <strong>Admin:</strong> {health.adminConfigured?'Konfiguriert':'Fehlt'}</p>
    <p><strong>Rechnungsdaten:</strong> {health.invoiceDetailsConfigured?'Hinterlegt':'Unvollständig'}</p>
    <p><strong>Echte Zahlungen:</strong> {health.gates.liveCheckout?'FREIGEGEBEN':'Gesperrt'} · <strong>Indexierung:</strong> {health.gates.siteIndexed?'Aktiv':'Deaktiviert'}</p>
    <p className="note">{health.note}</p>
   </section>}
  {orders.length>0?<section style={{marginTop:24}}>
   <p>{orders.length} Bestellungen (neueste zuerst, maximal 100)</p>
   {orders.map(o=><article className="card" key={o.stripe_session_id} style={{marginBottom:14}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
     <strong>{o.customer_name||o.customer_email||'Kunde'}</strong><strong className="accent">{money(o.amount_total,o.currency)}</strong>
    </div>
    <p>{new Date(o.created_at).toLocaleString('de-DE')} · {o.test_mode?'TEST':'LIVE'} · {o.status} · {o.shipping_country||'Land unbekannt'}</p>
    <p>{o.customer_email||'Keine E-Mail'}{o.vp_id?' · Partner '+o.vp_id:''}</p>
    {o.shipping_address&&<p><strong>Lieferadresse:</strong> {[o.shipping_address.line1,o.shipping_address.line2,o.shipping_address.postal_code,o.shipping_address.city,o.shipping_address.country].filter(Boolean).join(', ')}</p>}
    <p>{o.items?.map(i=>i.quantity+'× '+i.name).join(' · ')}</p>
    <p><strong>Versand:</strong> {o.shipped_at?new Date(o.shipped_at).toLocaleString('de-DE'):'Noch nicht versendet'}</p>
    <p><strong>Rechnung:</strong> {o.invoice_number||'Noch nicht erstellt'}</p>
    <div className="row" style={{gap:10,flexWrap:'wrap'}}>
     {!o.shipped_at&&<button type="button" className="button" disabled={busy||!token} onClick={()=>action(o.stripe_session_id,'shipped')}>Als versendet markieren</button>}
     <button type="button" className="button secondary" disabled={busy||!token} onClick={()=>action(o.stripe_session_id,'retry_confirmation')}>Bestätigung prüfen / senden</button>
     {o.shipped_at&&<button type="button" className="button secondary" disabled={busy||!token} onClick={()=>action(o.stripe_session_id,'retry_invoice')}>Rechnung prüfen / senden</button>}
    </div>
    <small>Stripe-Sitzung: {o.stripe_session_id}</small>
   </article>)}
  </section>:null}
 </main>
}
