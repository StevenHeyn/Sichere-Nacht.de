'use client';
import {useState} from 'react';
import {supplierStatusLabels} from '../../../lib/delivery-policy';
import SupplierPortalLink from './supplier-portal-link';
export type SupplierState={status:string;submission_reference:string|null;supplier_reference:string|null;stock_evidence:string|null;submitted_at:string|null;confirmed_at:string|null;dispatch_evidence:string|null;dispatched_at:string|null;carrier:string|null;tracking_number:string|null};
type Order={stripe_session_id:string;test_mode:boolean;shipping_name?:string|null;supplier_fulfillments?:SupplierState|SupplierState[]|null};
export default function SupplierPanel({order,token,onChanged}:{order:Order;token:string;onChanged:()=>Promise<void>}){
 const state=Array.isArray(order.supplier_fulfillments)?order.supplier_fulfillments[0]:order.supplier_fulfillments;
 const [busy,setBusy]=useState(false),[message,setMessage]=useState(''),[draft,setDraft]=useState('');
 const [reference,setReference]=useState(''),[stock,setStock]=useState(''),[stockChecked,setStockChecked]=useState(false);
 const [complete,setComplete]=useState(false),[when,setWhen]=useState(''),[carrier,setCarrier]=useState(''),[tracking,setTracking]=useState('');
 async function act(action:string){
  if(busy||!token)return;
  if(action==='shipped'&&(!complete||!when)){setMessage('Vollständigen Versand und tatsächliches Versanddatum bestätigen.');return}
  if(action!=='draft'&&!window.confirm(order.test_mode?'Nur Teststatus dokumentieren? Kein Lieferantenauftrag wird gesendet.':'Tatsächlich erfolgten Schritt anhand eines SECPLAN-Belegs dokumentieren? Dieser Button versendet selbst keinen Lieferantenauftrag.'))return;
  setBusy(true);setMessage('');
  try{
   const response=await fetch('/api/admin/supplier',{method:'POST',headers:{Authorization:'Bearer '+token,'content-type':'application/json'},cache:'no-store',body:JSON.stringify({sessionId:order.stripe_session_id,action,reference,stockEvidence:stock,stockConfirmed:stockChecked,complete,dispatchedAt:action==='shipped'?new Date(when).toISOString():undefined,carrier,tracking})});
   const data=await response.json();if(!response.ok)throw new Error(data.error||'Aktion fehlgeschlagen');
   if(action==='draft'){setDraft(data.draft);setMessage('Nur Entwurf erzeugt. Nicht an SECPLAN versendet.')}else{setDraft('');setReference('');setMessage('Status dokumentiert. Kein Lieferantenauftrag automatisch versendet.'+(data.invoiceMail?' Rechnungs-E-Mail: '+data.invoiceMail:'.'));await onChanged()}
  }catch(e){setMessage(e instanceof Error?e.message:'Aktion fehlgeschlagen')}
  finally{setBusy(false)}
 }
 return <section style={{borderTop:'1px solid #30445b',marginTop:18,paddingTop:18}}>
  <h3>SECPLAN-Direktversand</h3>
  <p><strong>Status:</strong> {state?supplierStatusLabels[state.status]||state.status:'Lieferantenstatus noch nicht geladen'}</p>
  <p><strong>Lieferempfänger:</strong> {order.shipping_name||'Fehlt. Nicht mit Rechnungsempfänger gleichsetzen.'}</p>
  <SupplierPortalLink testMode={order.test_mode}/>
  {order.test_mode&&<p className="note">TESTBESTELLUNG: Export als echter Lieferantenauftrag gesperrt.</p>}
  {!order.test_mode&&state?.status==='pending'&&<button type="button" className="button secondary" disabled={busy||!token} onClick={()=>act('draft')}>SECPLAN-Auftragsentwurf anzeigen</button>}
  {draft&&<div><p>Enthält nur Lieferempfänger, Lieferanschrift, Artikelnummern und Mengen. Keine Kundenzahlungsdaten oder Verkaufspreise.</p><textarea aria-label="Manueller SECPLAN-Auftragsentwurf" readOnly rows={16} value={draft}/></div>}
  {state?.submission_reference&&<p>Übermittlung: {state.submission_reference}</p>}
  {state?.supplier_reference&&<p>SECPLAN-Auftrag: {state.supplier_reference}</p>}
  {state&&['pending','submitted','confirmed'].includes(state.status)&&<div>
   <label>Beleg / Referenz des tatsächlichen Schritts<input value={reference} maxLength={240} onChange={e=>setReference(e.target.value)} placeholder={state.status==='pending'?'SECPLAN-Portalbestellung / Übermittlungsbeleg':state.status==='submitted'?'SECPLAN-Auftragsbestätigung':'SECPLAN-Versandbeleg'}/></label>
   {state.status==='pending'&&<><label>Nachweis der SECPLAN-Verfügbarkeit<input value={stock} maxLength={240} onChange={e=>setStock(e.target.value)} placeholder="Bestandsbestätigung / Portalabfrage mit Datum"/></label><label><input type="checkbox" checked={stockChecked} onChange={e=>setStockChecked(e.target.checked)}/> Alle Artikel und Mengen bei SECPLAN geprüft und den Auftrag tatsächlich übermittelt.</label><button type="button" className="button secondary" disabled={busy||!stockChecked||reference.trim().length<3||stock.trim().length<3} onClick={()=>act('submitted')}>Manuelle Übermittlung dokumentieren</button></>}
   {state.status==='submitted'&&<button type="button" className="button secondary" disabled={busy||reference.trim().length<3} onClick={()=>act('confirmed')}>SECPLAN-Auftragsbestätigung erfassen</button>}
   {state.status==='confirmed'&&<><label>Tatsächlicher Versandzeitpunkt (Ortszeit deines Browsers)<input type="datetime-local" value={when} onChange={e=>setWhen(e.target.value)}/></label><label>Transporteur (optional)<input value={carrier} maxLength={80} onChange={e=>setCarrier(e.target.value)}/></label><label>Sendungsnummer (optional)<input value={tracking} maxLength={160} onChange={e=>setTracking(e.target.value)}/></label><label><input type="checkbox" checked={complete} onChange={e=>setComplete(e.target.checked)}/> SECPLAN hat den tatsächlichen Versand aller Artikel bestätigt. Eine reine Auftragsannahme oder Teillieferung reicht nicht.</label><button type="button" className="button" disabled={busy||!complete||!when||reference.trim().length<3} onClick={()=>act('shipped')}>SECPLAN-Versand bestätigen und Rechnung anstoßen</button></>}
  </div>}
  {state?.dispatched_at&&<p>Versand bestätigt: {new Date(state.dispatched_at).toLocaleString('de-DE')} · {state.carrier||'Transporteur nicht hinterlegt'} {state.tracking_number||''}</p>}
  {state?.dispatch_evidence&&<p>Versandbeleg: {state.dispatch_evidence}</p>}
  {message&&<p role="status">{message}</p>}
 </section>;
}
