'use client';
import {useMemo,useState} from 'react';
import {type Row,eur,when} from '../portal-client';

const payment:Record<string,string>={paid:'Bezahlt',pending:'Offen',processing:'In Bearbeitung',failed:'Fehlgeschlagen',expired:'Abgelaufen'};
const shipping:Record<string,string>={pending:'Noch nicht übergeben',submitted:'Manuell übermittelt',confirmed:'Lieferant bestätigt',shipped:'Versandt',legacy:'Historischer Versand'};
const merch:Record<string,string>={requested:'Angefragt',quoted:'Angeboten',accepted:'Angenommen',fulfilled:'Erledigt',cancelled:'Storniert'};
const addr=(value:Row|undefined|null)=>{if(!value||typeof value!=='object')return '';const a=(value.address&&typeof value.address==='object'?value.address:value) as Row;return [a.line1,a.line2,[a.postal_code,a.city].filter(Boolean).join(' '),a.country].filter(Boolean).join(', ')};
const money=(c:unknown)=>Number.isFinite(Number(c))?eur(Number(c)): '–';
export default function AdminOrders({data}:{data:Row}){
 const [kind,setKind]=useState('all'),[showTests,setShowTests]=useState(false),[search,setSearch]=useState('');
 const overview=(data.shop_order_overview||{}) as Row;
 const shop=(Array.isArray(overview.orders)?overview.orders:[]) as Row[];
 const printing=(Array.isArray(data.merch_orders)?data.merch_orders:[]) as Row[];
 const accounts=(Array.isArray(data.accounts)?data.accounts:[]) as Row[];
 const partner=(o:Row)=>o.partner_name||accounts.find(a=>a.referral_code===o.vp_id)?.full_name||o.vp_id||'Keine Zuordnung';
 const q=search.trim().toLocaleLowerCase('de-DE');
 const filteredShop=useMemo(()=>shop.filter(o=>(showTests||!o.test_mode)&&(!q||[o.id,o.customer_name,o.customer_email,o.vp_id,o.partner_name,o.invoice_number].some(v=>String(v||'').toLocaleLowerCase('de-DE').includes(q)))),[shop,showTests,q]);
 const filteredMerch=useMemo(()=>printing.filter(o=>!q||[o.id,o.product_id,o.customer_name,o.customer_email,accounts.find(a=>a.user_id===o.user_id)?.full_name].some(v=>String(v||'').toLocaleLowerCase('de-DE').includes(q))),[printing,accounts,q]);
 const visible:Row[]=[...(kind!=='merch'?filteredShop.map(o=>({...o,_type:'shop'})):[]),...(kind!=='shop'?filteredMerch.map(o=>({...o,_type:'merch'})):[])].sort((a,b)=>String(b.created_at).localeCompare(String(a.created_at)));
 const liveTotal=Number(overview.live_count||0),tests=Number(overview.test_count||0),merchPaid=printing.filter(o=>o.payment_status==='paid').length;
 return <section className="card" id="admin-orders">
 <h2>Bestellübersicht</h2>
 <p>Alarmanlagen-Verkäufe und Werbemittelbestellungen an einem Ort. Echte Verkäufe sind von Sandbox-Simulationen getrennt. Die Anzeige ist ausschließlich für aktive Administratoren bestimmt.</p>
 <div className="metricGrid">
  <article className="metric"><small>Echte Alarmanlagen-Bestellungen</small><strong>{liveTotal.toLocaleString('de-DE')}</strong><span>Gespeichert und bezahlt</span></article>
  <article className="metric"><small>Bruttowert echter Bestellungen</small><strong>{money(overview.live_gross_cents)}</strong><span>Keine Aussage zu Erstattungen oder Auszahlungen</span></article>
  <article className="metric"><small>Werbemittelbestellungen</small><strong>{printing.length}</strong><span>{merchPaid} mit bestätigter Zahlung</span></article>
 </div>
 <div className="formGrid">
  <label>Bestellart<select aria-label="Bestellart filtern" value={kind} onChange={e=>setKind(e.target.value)}><option value="all">Alle Bestellarten</option><option value="shop">Nur Alarmanlagen</option><option value="merch">Nur Werbemittel</option></select></label>
  <label>Bestellung oder Kunde suchen<input type="search" value={search} onChange={e=>setSearch(e.target.value)} placeholder="Bestellnummer, Name, E-Mail oder VP-Code"/></label>
 </div>
 <label className="check"><input type="checkbox" checked={showTests} onChange={e=>setShowTests(e.target.checked)}/>Auch {tests} Sandbox-Testbestellungen anzeigen</label>
 <p className="note">Maximal die 100 neuesten Alarmanlagen-Bestellungen und 100 neuesten Werbemittelbestellungen werden aus der Datenbank geladen. Eine leere Liste nach einem Filter bedeutet nicht automatisch, dass keine älteren Aufträge existieren.</p>
 <div className="tableWrap"><table><thead><tr><th>Bestellung</th><th>Datum</th><th>Kunde / Partner</th><th>Betrag brutto</th><th>Zahlung</th><th>Abwicklung</th></tr></thead><tbody>
 {visible.map(o=><tr key={o._type+':'+o.id}>
  <td><strong>{o._type==='shop'?'Alarmanlage':'Werbemittel'}</strong><div>{o._type==='shop'?'#'+o.id:String(o.id).slice(0,8)}</div>{o.test_mode&&<strong>TEST · kein echter Versand</strong>}{o.invoice_number&&<div>Rechnung {o.invoice_number}</div>}</td>
  <td>{when(o.created_at)}</td>
  <td><strong>{o.customer_name||accounts.find(a=>a.user_id===o.user_id)?.full_name||'Nicht angegeben'}</strong><div>{o.customer_email||''}</div><small>{o._type==='shop'?'VP: '+partner(o):'Besteller: '+(accounts.find(a=>a.user_id===o.user_id)?.full_name||'Unbekannt')}</small>{o.customer_type&&<div>{o.customer_type==='business'?'B2B':o.customer_type==='consumer'?'B2C':o.customer_type}</div>}</td>
  <td>{money(o._type==='shop'?o.amount_total:o.quote_total_cents)}</td>
  <td>{payment[o._type==='shop'?o.status:o.payment_status]||o.payment_status||'Nicht bestätigt'}</td>
  <td>{o._type==='shop'?(shipping[o.fulfillment_status]||o.fulfillment_status||'Offen'):(merch[o.status]||o.status||'Offen')}</td>
 </tr>)}
 </tbody></table></div>
 {!visible.length&&<p role="status">Keine passenden Bestellungen für diese Auswahl.</p>}
 <details><summary>Bestellpositionen und Lieferadressen (nur Administration)</summary><p>Für den Abgleich mit tatsächlichen Aufträgen. Das Öffnen ändert keinen Bestellstatus und überträgt keine Daten an Lieferanten.</p>
 {(kind!=='merch'?filteredShop:[]).map(o=><article className="orderRow" key={'detail-'+o.id}><strong>Alarmanlage #{o.id}{o.test_mode?' · SANDBOX':''}</strong><p>{o.customer_name||'Kunde nicht angegeben'} · {o.customer_email||'Keine E-Mail'} · VP: {partner(o)}</p><p>Lieferanschrift: {addr(o.shipping_address)||'Nicht angegeben'}</p><p>Positionen: {Array.isArray(o.items)?o.items.map((i:Row)=>[i.quantity||1,i.description||i.name||i.sku||'Artikel'].join(' × ')).join('; '):'Keine Positionen hinterlegt'}</p>{o.shipped_at&&<p>Versanddatum: {when(o.shipped_at)}</p>}</article>)}
 {(kind!=='shop'?filteredMerch:[]).map(o=><article className="orderRow" key={'detail-merch-'+o.id}><strong>Werbemittel {String(o.id).slice(0,8)} · {o.quantity} × {o.product_id}</strong><p>{o.customer_name||''} · {o.customer_email||''}</p><p>Lieferanschrift: {addr(o.shipping_details)||'Nicht angegeben'}</p><p>{o.quote_description||''}</p></article>)}
 </details>
 </section>;
}
