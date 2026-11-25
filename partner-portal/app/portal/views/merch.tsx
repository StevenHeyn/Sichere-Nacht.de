'use client';

import {useEffect,useRef,useState} from 'react';
import {type Action,type Row,eur,when} from '../portal-client';

type PriceOption = {quantity:number;total_cents:number;net_cents?:number};
const pieces = (quantity:number,workwear=false) => quantity.toLocaleString('de-DE') + (workwear ? (quantity===1?' Set':' Sets') : ' Stück');
const sizeChoices=['XS','S','M','L','XL','XXL','3XL','4XL'];
const sizeFields=[['winter','Winterjacke'],['softshell','Softshelljacke'],['polos','3 Poloshirts'],['sweatshirt','Pullover']] as const;
const net=(option:PriceOption)=>option.net_cents??Math.round(option.total_cents/1.19);
const paymentLabels:Record<string,string>={pending:'Zahlung offen',processing:'Zahlung wird bestätigt',paid:'Bezahlt · Druckfreigabe folgt',failed:'Zahlung fehlgeschlagen',expired:'Zahlungslink abgelaufen'};
const orderLabels:Record<string,string>={requested:'Angefragt',quoted:'Angebot liegt vor',accepted:'Bestellt',fulfilled:'Erledigt',cancelled:'Storniert'};
const safeInvoice=(v:unknown)=>{try{const u=new URL(String(v));return u.protocol==='https:'&&['invoice.stripe.com','pay.stripe.com'].includes(u.hostname)?u.href:null}catch{return null}};
async function paymentRequest(data:Row){const r=await fetch('/api/merch-checkout',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(data)});const result=await r.json();if(!r.ok)throw Error(result.error||'Zahlung nicht verfügbar.');return result}

export default function Merch({data,act,reload}:{data:Row;act:Action;reload:()=>Promise<void>}) {
  const [sizes,setSizes]=useState<Record<string,string>>({});
  const [qty,setQty] = useState<Record<string,number>>({});
  const [custom,setCustom]=useState<Record<string,boolean>>({}),[busy,setBusy]=useState(false),[notice,setNotice]=useState('');
  const locked=useRef(false),keys=useRef<Record<string,string>>({}),reloadRef=useRef(reload);reloadRef.current=reload;
  useEffect(()=>{
    const params=new URLSearchParams(location.search),id=params.get('order');if(!id)return;
    if(params.get('payment')==='cancelled'){setNotice('Zahlung abgebrochen. Du kannst sie unten bei deiner Bestellung fortsetzen.');return;}
    if(params.get('payment')!=='return')return;
    let stopped=false,timer:ReturnType<typeof setTimeout>,attempt=0;
    const check=async()=>{try{const result=await paymentRequest({action:'status',orderId:id});if(stopped)return;
      setNotice(result.state==='paid'?'Zahlung bestätigt. Deine Bestellung ist gespeichert; die persönliche Druckfreigabe folgt.':paymentLabels[result.state]||'Zahlungsbestätigung ausstehend.');
      await reloadRef.current();if(!stopped&&['pending','processing'].includes(result.state)&&++attempt<10)timer=setTimeout(check,3000);
    }catch(e){if(!stopped)setNotice(e instanceof Error?e.message:'Zahlungsstatus momentan nicht abrufbar.');}};
    void check();return()=>{stopped=true;clearTimeout(timer)};
  },[]);
  async function pay(fields:Row){if(locked.current)return;locked.current=true;setBusy(true);setNotice('Zahlung wird vorbereitet …');try{
    const key=fields.productId+':'+fields.quantity+':'+JSON.stringify(fields.sizes||{});if(!fields.orderId)keys.current[key]??=crypto.randomUUID();
    const result=await paymentRequest({action:'checkout',...fields,requestKey:keys.current[key]});
    if(result.url){const u=new URL(result.url);if(u.protocol!=='https:'||u.hostname!=='checkout.stripe.com')throw Error('Ungültiger Zahlungslink.');location.assign(u.href);return;}
    setNotice(paymentLabels[result.state]||'Zahlungsstatus wird geprüft.');await reload();
  }catch(e){setNotice(e instanceof Error?e.message:'Zahlung konnte nicht vorbereitet werden.');await reload().catch(()=>{});}finally{locked.current=false;setBusy(false)}}
  async function refresh(id:string){if(locked.current)return;locked.current=true;setBusy(true);try{const r=await paymentRequest({action:'status',orderId:id});setNotice(paymentLabels[r.state]||'Status aktualisiert.');await reload()}catch(e){setNotice(e instanceof Error?e.message:'Status nicht verfügbar.')}finally{locked.current=false;setBusy(false)}}
  return <>
    <section className="notice">
      <h2>Dein Auftritt. Deine Werbemittel.</h2>
      <ul className="merchFeatures"><li>Flyer und Visitenkarten mit deinem persönlichen Empfehlungs-QR.</li><li>Strauss-Komplettset bereits ab einem Set bestellbar.</li><li>Nettopreise für Vertriebspartner; MwSt. und Gesamtbetrag stehen direkt am Produkt.</li><li>Sichere Onlinezahlung, Lieferadresse und Rechnung im Checkout.</li></ul>
      <a href="/api/qr" className="button secondary">Eigenen QR-Code herunterladen</a>
    </section>
    {notice&&<p className="notice" role="status" aria-live="polite">{notice}</p>}
    <div className="merchGrid">
      {(data.products||[]).filter((p:Row)=>p.id!=='team-clothing').map((p:Row) => {
        const workwear=p.id==='strauss-workwear-set';
        const flyer=p.id==='qr-flyer';
        const previewPath=flyer?'/api/merch-flyer-preview':p.image_path;
        const chosenSizes=Object.fromEntries(sizeFields.map(([key])=>[key,sizes[key]??(sizeChoices.includes(data.account.clothing_size)?data.account.clothing_size:'')]));
        const sizesReady=!workwear||sizeFields.every(([key])=>sizeChoices.includes(chosenSizes[key]));
        const options:PriceOption[] = Array.isArray(p.price_options) ? p.price_options : [];
        const quantity = qty[p.id] ?? options[0]?.quantity ?? 1;
        const quantityLimit = p.id==='qr-flyer' ? 55000 : 10000;
        const selected = custom[p.id]?undefined:options.find(option => option.quantity === quantity);
        return <article className="card merchCard" key={p.id}>
          <p className="eyebrow">{p.kind==='flyer'?'PRINT':p.kind==='card'?'PERSÖNLICH':'TEAMWEAR'}</p>
          <h2>{p.title}</h2>
          {previewPath && <figure className="merchPreview">
            <a href={previewPath} target="_blank" rel="noopener noreferrer" aria-label={p.title+' – Designvorschau vergrößern'}>
              <img src={previewPath} alt={workwear?'Sechs Teile: eine Winterjacke, eine Softshelljacke, ein Pullover und drei Poloshirts':flyer?'Personalisierte Flyer-Vorschau mit Name, Telefonnummer und Empfehlungs-QR':p.title+' – Vorder- und Rückseite im Sichere-Nacht-Design'} loading="lazy"/>
            </a>
            <figcaption>{workwear?'Set-Visualisierung · Alle sechs Teile mit Rückenlogo. Die genaue Druckansicht folgt vor Produktion.':flyer?'Persönliche Vorschau mit Name, Telefonnummer und Empfehlungs-QR. Die finale Druckansicht wird vor Produktion freigegeben.':'Designvorschau · QR-Code und Kontaktdaten werden für dich personalisiert.'}</figcaption>
          </figure>}
          <ul className="merchFeatures">{String(p.description).split(/\n+/).filter(Boolean).map((line,i)=><li key={i}>{line.replace(/^[•\-]\s*/,'')}</li>)}</ul>
          {flyer&&<p className="merchFeatures">Auf deinem Flyer: <strong>{data.account.full_name}</strong> · <strong>{data.account.phone}</strong>. Diese Kontaktdaten werden bei der Bestellung automatisch gespeichert. Bitte prüfe sie vor dem Bestellen.</p>}
          <div className="merchPurchase">
            {options.length > 0 && !custom[p.id] ? <>
              <label>{workwear?'Komplettset':'Druckpaket'}
                <select value={quantity} onChange={e=>setQty({...qty,[p.id]:Number(e.target.value)})}>
                  {[...options].sort((a,b)=>a.quantity-b.quantity).map(option=><option key={option.quantity} value={option.quantity}>{pieces(option.quantity,workwear)} – {eur(net(option))} netto</option>)}
                </select>
              </label>
              {selected && <div className="merchPrice" aria-live="polite">
                <strong>{eur(net(selected))} <span>netto</span></strong>
                <span>Gesamtpreis für {pieces(quantity,workwear)}</span>
                <small>zzgl. 19 % MwSt. · Standardversand Deutschland inklusive</small>
                <small>{eur(selected.total_cents-net(selected))} MwSt. · <b>{eur(selected.total_cents)} Gesamtbetrag</b></small>
              </div>}
            </> : <label>Menge (Stück)<input type="number" min={1} max={quantityLimit} value={quantity} onChange={e=>setQty({...qty,[p.id]:Number(e.target.value)})}/></label>}
            {workwear&&<fieldset className="merchSizes"><legend>Deine Größen</legend><div className="merchSizeGrid">{sizeFields.map(([key,label])=><label key={key}>{label}<select value={chosenSizes[key]} onChange={e=>setSizes({...sizes,[key]:e.target.value})}><option value="">Größe wählen</option>{sizeChoices.map(size=><option key={size}>{size}</option>)}</select></label>)}</div><small>Die drei Poloshirts werden in derselben gewählten Größe geliefert.</small></fieldset>}
            <button className="button full" disabled={busy||(!!selected&&!sizesReady)||!Number.isInteger(quantity)||quantity<1||quantity>quantityLimit} onClick={()=>selected?pay({productId:p.id,quantity,sizes:workwear?chosenSizes:{}}):act('merch_request',{productId:p.id,quantity}).catch(()=>{})}>
              {selected ? (workwear?'Einzelset bestellen':'Paket bestellen')+' · '+eur(selected.total_cents) : 'Angebot anfragen'}
            </button>
            {!!options.length&&<button className="textButton" disabled={busy} onClick={()=>{setCustom({...custom,[p.id]:!custom[p.id]});setQty({...qty,[p.id]:options[0].quantity})}}>{custom[p.id]?'Zurück zur Auswahl':workwear?'Andere Größe oder mehrere Sets anfragen':'Andere Stückzahl anfragen'}</button>}
          </div>
        </article>;
      })}
    </div>
    <section className="card">
      <h2>Meine Anfragen und Bestellungen</h2>
      {(data.merch_orders||[]).map((o:Row)=><article className="orderRow" key={o.id}>
        <h3>{pieces(o.quantity,o.product_id==='strauss-workwear-set')} · {data.products?.find((p:Row)=>p.id===o.product_id)?.title||(o.product_id==='team-clothing'?'Partnerkleidung':o.product_id)}</h3>
        <p>{when(o.created_at)} · {o.status==='fulfilled'?'Erledigt':paymentLabels[o.payment_status]||orderLabels[o.status]||o.status}</p>
        {o.quote_description&&<div className="preline">{o.quote_description}</div>}
        {o.quote_total_cents&&<p><strong>Gesamtpreis brutto inkl. Versand: {eur(o.quote_total_cents)}</strong></p>}
        {o.payment_status==='paid'&&<p>Deine Zahlung ist eingegangen. Vor dem Druck erhältst du deine persönliche Druckansicht zur Freigabe.</p>}
        {safeInvoice(o.invoice_url)&&<a className="button secondary" href={safeInvoice(o.invoice_url)!} target="_blank" rel="noopener noreferrer">Rechnung ansehen</a>}
        {o.payment_status==='pending'&&<button className="button" disabled={busy} onClick={()=>pay({orderId:o.id})}>Zahlung fortsetzen</button>}
        {o.stripe_session_id&&['pending','processing','paid'].includes(o.payment_status)&&<button className="textButton" disabled={busy} onClick={()=>refresh(o.id)}>Zahlungsstatus aktualisieren</button>}
        {o.status==='quoted'&&!o.payment_status&&<button className="button" onClick={()=>{
          if(confirm('Dieses konkrete Angebot für '+eur(o.quote_total_cents)+' kostenpflichtig annehmen?'))
            act('merch_accept',{id:o.id,version:o.quote_version,accept:true}).catch(()=>{});
        }}>Kostenpflichtig bestellen</button>}
      </article>)}
      {!data.merch_orders?.length&&<p>Noch keine Werbemittelanfrage.</p>}
    </section>
  </>;
}
