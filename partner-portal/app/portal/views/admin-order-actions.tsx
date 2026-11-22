'use client';
import {useState} from 'react';
import {type Row,type Action,when} from '../portal-client';
const labels:Record<string,string>={pending:'Noch nicht an SECPLAN übergeben',submitted:'Manuell an SECPLAN übermittelt',confirmed:'SECPLAN-Auftrag bestätigt',shipped:'Versandt',legacy:'Historischer Versand'};
export default function OrderFulfillment({order,act,reload}:{order:Row;act:Action;reload:()=>Promise<void>}){
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[error,setError]=useState(false);
 const [reference,setReference]=useState(''),[stockEvidence,setStockEvidence]=useState(''),[stockConfirmed,setStockConfirmed]=useState(false);
 const [complete,setComplete]=useState(false),[dispatchedAt,setDispatchedAt]=useState(''),[carrier,setCarrier]=useState(''),[tracking,setTracking]=useState('');
 const [draft,setDraft]=useState('');
 const status=order.supplier_status||'pending';
 async function submit(operation:string){
  if(busy||order.test_mode)return;
  if(operation!=='draft'){
   const warning=operation==='shipped'?
    'SECPLAN hat nachweislich alle Artikel vollständig versandt? Dies dokumentiert den Versand und löst die Rechnungs-E-Mail an den Kunden aus.':
    operation==='retry_invoice'?'Rechnungsstatus erneut prüfen? Eine bereits versandte Rechnung wird nicht erneut verschickt.':
    operation==='processing'?'Bestellung als in Bearbeitung markieren? Dies ist keine Lieferantenübermittlung.':
    'Tatsächlich erfolgten Lieferantenschritt mit Beleg dokumentieren? Dieser Button erteilt keine Bestellung bei SECPLAN.';
   if(!window.confirm(warning))return;
  }
  setBusy(true);setError(false);setMessage('');
  try{
   const result=await act('admin_order_fulfillment',{sessionId:order.stripe_session_id,operation,reference:reference.trim(),
      stockEvidence:stockEvidence.trim(),stockConfirmed,complete,
      dispatchedAt:operation==='shipped'?new Date(dispatchedAt).toISOString():undefined,
      carrier:carrier.trim(),tracking:tracking.trim()});
   if(operation==='draft')setDraft(String(result?.draft||''));
   else{
    setDraft('');setReference('');
    const invoice=result?.invoiceMail;
    setMessage(operation==='shipped'?
      (invoice==='sent'?'Versand gespeichert; Rechnungs-E-Mail vom Anbieter angenommen.':
       invoice==='already_sent_or_locked'?'Versand gespeichert; Rechnung bereits versandt oder gerade in Bearbeitung.':
       'Versand gespeichert. Rechnungsmail nicht bestätigt ('+(invoice||'unbekannt')+'). Bitte Status und Pflichtangaben prüfen.'):
      operation==='retry_invoice'?
      (invoice==='sent'?'Rechnungs-E-Mail vom Anbieter angenommen.':invoice==='already_sent_or_locked'?'Rechnung bereits versandt oder gerade in Bearbeitung.':'Rechnungsversand: '+invoice):
      'Status gespeichert. Keine automatische Übermittlung an SECPLAN.');
    await reload();
   }
  }catch(e){setError(true);setMessage(e instanceof Error?e.message:'Aktion nicht bestätigt. Bitte erneut Status prüfen.')}
  finally{setBusy(false)}
 }
 if(order.test_mode)return <p className="note">SANDBOX: echte Lieferantenaktionen und Kundenmails sind hier gesperrt.</p>;
 return <div style={{borderTop:'1px solid #54606d',paddingTop:12,marginTop:12}}>
  <h3>Bearbeitung und Versand</h3>
  <p><strong>Lieferantenstatus:</strong> {labels[status]||status} · <strong>Bearbeitung:</strong> {order.fulfillment_status==='processing'?'In Bearbeitung':order.fulfillment_status==='shipped'?'Versendet':'Offen'}</p>
  <p><strong>Rechnung:</strong> {order.invoice_number||'Noch nicht erstellt'} · <strong>E-Mail:</strong> {order.invoice_mail_status==='sent'?'Versendet '+when(order.invoice_mail_sent_at):order.invoice_mail_status||'Noch nicht versendet'}</p>
  {order.submission_reference&&<p>Übermittlungsbeleg: {order.submission_reference}</p>}
  {order.supplier_reference&&<p>SECPLAN-Auftragsbestätigung: {order.supplier_reference}</p>}
  {order.dispatch_evidence&&<p>Versandbeleg: {order.dispatch_evidence}{order.tracking_number?' · Tracking '+order.tracking_number:''}</p>}
  {order.fulfillment_status==='pending'&&<button type="button" className="button secondary" disabled={busy} onClick={()=>void submit('processing')}>Als in Bearbeitung markieren</button>}
  {status==='pending'&&<><p><a href="https://www.secplan.de/account/login" target="_blank" rel="noopener noreferrer">SECPLAN-Händlerportal öffnen</a> (nur manuelle Übergabe, kein Statuswechsel)</p>
    <button className="button secondary" disabled={busy} onClick={()=>void submit('draft')}>Auftragsentwurf anzeigen</button>
    {draft&&<label>Lieferantenentwurf, nicht versandt<textarea readOnly rows={10} value={draft}/></label>}
  </>}
  {['pending','submitted','confirmed'].includes(status)&&<label>Beleg / Referenz des tatsächlichen Schritts<input value={reference} maxLength={240} onChange={e=>setReference(e.target.value)} placeholder={status==='pending'?'Beleg der manuellen SECPLAN-Übermittlung':status==='submitted'?'SECPLAN-Auftragsbestätigung':'Versandbestätigung'}/></label>}
  {status==='pending'&&<><label>Aktueller Bestandsnachweis<input value={stockEvidence} maxLength={240} onChange={e=>setStockEvidence(e.target.value)}/></label><label className="check"><input type="checkbox" checked={stockConfirmed} onChange={e=>setStockConfirmed(e.target.checked)}/> SECPLAN-Bestand geprüft und Bestellung tatsächlich manuell übermittelt</label><button type="button" className="button secondary" disabled={busy||reference.trim().length<3||stockEvidence.trim().length<3||!stockConfirmed} onClick={()=>void submit('submitted')}>Manuelle Übermittlung dokumentieren</button></>}
  {status==='submitted'&&<button type="button" className="button secondary" disabled={busy||reference.trim().length<3} onClick={()=>void submit('confirmed')}>Auftragsbestätigung dokumentieren</button>}
  {status==='confirmed'&&<>
   <label>Tatsächliches Versanddatum<input type="datetime-local" value={dispatchedAt} onChange={e=>setDispatchedAt(e.target.value)}/></label>
   <label>Transporteur<input maxLength={80} value={carrier} onChange={e=>setCarrier(e.target.value)}/></label>
   <label>Sendungsnummer<input maxLength={160} value={tracking} onChange={e=>setTracking(e.target.value)}/></label>
   <label className="check"><input type="checkbox" checked={complete} onChange={e=>setComplete(e.target.checked)}/> Tatsächlicher vollständiger Versand aller Artikel vom Lieferanten bestätigt</label>
   <button type="button" className="button" disabled={busy||!complete||!dispatchedAt||reference.trim().length<3} onClick={()=>void submit('shipped')}>Als versendet markieren und Rechnung senden</button>
  </>}
  {order.shipped_at&&order.invoice_mail_status!=='sent'&&<button type="button" className="button secondary" disabled={busy} onClick={()=>void submit('retry_invoice')}>Rechnungsversand prüfen / erneut anstoßen</button>}
  {message&&<p role={error?'alert':'status'}>{message}</p>}
 </div>;
}
