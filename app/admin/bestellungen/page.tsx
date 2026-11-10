'use client';
import {useState} from 'react';
import Link from 'next/link';
type Order={stripe_session_id:string;status:string;amount_total:number;currency:string;customer_email:string|null;customer_name:string|null;shipping_country:string|null;vp_id:string|null;test_mode:boolean;items:Array<{name:string;sku:string|null;quantity:number}>;created_at:string};
export default function Bestellungen(){
 const [token,setToken]=useState('');
 const [orders,setOrders]=useState<Order[]>([]);
 const [message,setMessage]=useState('');
 const [busy,setBusy]=useState(false);
 async function load(){
  setBusy(true);setMessage('');
  try{
   const r=await fetch('/api/admin/orders',{headers:{Authorization:'Bearer '+token},cache:'no-store'});
   const data=await r.json();
   if(!r.ok)throw new Error(data.error||'Zugriff fehlgeschlagen');
   setOrders(data.orders);setToken('');
  }catch(e){setOrders([]);setMessage(e instanceof Error?e.message:'Fehler beim Laden')}
  finally{setBusy(false)}
 }
 const money=(n:number,c:string)=>new Intl.NumberFormat('de-DE',{style:'currency',currency:c.toUpperCase()}).format(n/100);
 return <main className="wrap" style={{paddingBottom:80,maxWidth:1050}}>
  <nav className="nav"><Link href="/" className="brand">◈ SICHERE <span className="accent">NACHT</span></Link><Link href="/shop">Shop</Link></nav>
  <p className="accent">VERWALTUNG</p><h1>Bestellungen</h1>
  <p>Geschützter Bereich. Die Zugangsdaten werden nur für diese Anfrage verwendet und nicht im Browser gespeichert.</p>
  <section className="card" style={{maxWidth:550}}>
   <label htmlFor="admin-token">Admin-Zugriffsschlüssel</label>
   <input id="admin-token" type="password" autoComplete="off" value={token} onChange={e=>setToken(e.target.value)} placeholder="Admin-Schlüssel"/>
   <button className="button" type="button" disabled={!token||busy} onClick={load}>{busy?'Lade …':'Bestellungen laden'}</button>
   {message&&<p role="alert">{message}</p>}
  </section>
  {orders.length>0?<section style={{marginTop:24}}>
   <p>{orders.length} Bestellungen (neueste zuerst, maximal 100)</p>
   {orders.map(o=><article className="card" key={o.stripe_session_id} style={{marginBottom:14}}>
    <div style={{display:'flex',justifyContent:'space-between',gap:12,flexWrap:'wrap'}}>
     <strong>{o.customer_name||o.customer_email||'Kunde'}</strong>
     <strong className="accent">{money(o.amount_total,o.currency)}</strong>
    </div>
    <p style={{margin:'4px 0'}}>{new Date(o.created_at).toLocaleString('de-DE')} · {o.test_mode?'TEST':'LIVE'} · {o.status} · {o.shipping_country||'Lieferland unbekannt'}</p>
    <p>{o.customer_email||'Keine E-Mail'}{o.vp_id?' · Partner '+o.vp_id:''}</p>
    <p>{o.items?.map(i=>i.quantity+'× '+i.name).join(' · ')}</p>
    <small>Stripe-Sitzung: {o.stripe_session_id}</small>
   </article>)}
  </section>:null}
 </main>
}
