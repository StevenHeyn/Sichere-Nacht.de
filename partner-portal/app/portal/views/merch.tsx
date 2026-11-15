'use client';

import {useState} from 'react';
import {type Action,type Row,eur,when} from '../portal-client';

type PriceOption = {quantity:number;total_cents:number};
const pieces = (quantity:number) => quantity.toLocaleString('de-DE') + ' Stück';

export default function Merch({data,act}:{data:Row;act:Action}) {
  const [qty,setQty] = useState<Record<string,number>>({});
  return <>
    <section className="notice">
      <h2>Materialien mit deinem Empfehlungslink.</h2>
      <p>Wähle dein Druckpaket und frage es zum angezeigten Paketpreis an. Du erhältst ein konkretes Angebot zur Bestätigung. Die persönliche Druckansicht wird vor der Produktion freigegeben. Partnerkleidung bieten wir individuell an.</p>
      <a href="/api/qr" className="button secondary">Eigenen QR-Code herunterladen</a>
    </section>
    <div className="merchGrid">
      {(data.products||[]).map((p:Row) => {
        const options:PriceOption[] = Array.isArray(p.price_options) ? p.price_options : [];
        const quantity = qty[p.id] ?? options[0]?.quantity ?? 1;
        const selected = options.find(option => option.quantity === quantity);
        return <article className="card merchCard" key={p.id}>
          <p className="eyebrow">{p.kind==='flyer'?'PRINT':p.kind==='card'?'PERSÖNLICH':'TEAMWEAR'}</p>
          <h2>{p.title}</h2>
          {p.image_path && <figure className="merchPreview">
            <a href={p.image_path} target="_blank" rel="noopener noreferrer" aria-label={p.title+' – Designvorschau vergrößern'}>
              <img src={p.image_path} alt={'Vorder- und Rückseite: '+p.title+' im Sichere-Nacht-Design'} loading="lazy"/>
            </a>
            <figcaption>Designvorschau · Zum Vergrößern antippen. QR-Code und gegebenenfalls Kontaktdaten werden für dich personalisiert.</figcaption>
          </figure>}
          <p>{p.description}</p>
          <div className="merchPurchase">
            {options.length > 0 ? <>
              <label>Druckpaket
                <select value={quantity} onChange={e=>setQty({...qty,[p.id]:Number(e.target.value)})}>
                  {[...options].sort((a,b)=>a.quantity-b.quantity).map(option=><option key={option.quantity} value={option.quantity}>{pieces(option.quantity)} – {eur(option.total_cents)}</option>)}
                </select>
              </label>
              {selected && <div className="merchPrice" aria-live="polite">
                <strong>{eur(selected.total_cents)}</strong>
                <span>Gesamtpreis für {pieces(quantity)}</span>
                <small>inkl. 19 % MwSt. und Standardversand innerhalb Deutschlands</small>
              </div>}
            </> : <label>Menge (Stück)<input type="number" min={1} max={10000} value={quantity} onChange={e=>setQty({...qty,[p.id]:Number(e.target.value)})}/></label>}
            {p.kind==='clothing'&&<p>Größe: {data.account.clothing_size||'Bitte Profil ergänzen'}</p>}
            <button className="button full" disabled={!Number.isInteger(quantity)||quantity<1||quantity>10000} onClick={()=>act('merch_request',{productId:p.id,quantity}).catch(()=>{})}>
              {selected ? 'Paket anfragen' : 'Angebot anfragen'}
            </button>
          </div>
        </article>;
      })}
    </div>
    <section className="card">
      <h2>Meine Anfragen und Bestellungen</h2>
      {(data.merch_orders||[]).map((o:Row)=><article className="orderRow" key={o.id}>
        <h3>{pieces(o.quantity)} · {data.products?.find((p:Row)=>p.id===o.product_id)?.title||o.product_id}</h3>
        <p>{when(o.created_at)} · {o.status}</p>
        {o.quote_description&&<div className="preline">{o.quote_description}</div>}
        {o.quote_total_cents&&<p><strong>Gesamtpreis brutto inkl. Versand: {eur(o.quote_total_cents)}</strong></p>}
        {o.status==='quoted'&&<button className="button" onClick={()=>{
          if(confirm('Dieses konkrete Angebot für '+eur(o.quote_total_cents)+' kostenpflichtig annehmen?'))
            act('merch_accept',{id:o.id,version:o.quote_version,accept:true}).catch(()=>{});
        }}>Kostenpflichtig bestellen</button>}
      </article>)}
      {!data.merch_orders?.length&&<p>Noch keine Werbemittelanfrage.</p>}
    </section>
  </>;
}
