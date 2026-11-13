'use client';
import {useState} from 'react';
import type {CheckoutProbeReport} from '../../../lib/checkout-write-probe';
type Report = CheckoutProbeReport & {keyType:string;note:string};
const labels = {create:'Checkout-Sitzung anlegen', expire:'Sitzung sofort schließen', retrieve:'Status bei Stripe nachlesen', lineItems:'Artikel und SKU abrufen'};
export default function CheckoutWriteProbe({adminToken}:{adminToken:string}) {
  const [busy,setBusy] = useState(false);
  const [report,setReport] = useState<Report|null>(null);
  const [error,setError] = useState('');
  async function run() {
    if (busy || !adminToken) return;
    setBusy(true);setError('');setReport(null);
    try {
      const response = await fetch('/api/admin/checkout-probe', {method:'POST',
        headers:{authorization:'Bearer ' + adminToken, 'content-type':'application/json'},
        body:JSON.stringify({action:'run_checkout_write_probe'}), cache:'no-store'});
      const data = await response.json();
      if (!data.checks) throw new Error(data.error || 'Prüflauf konnte nicht gestartet werden.');
      setReport(data);
    } catch(e) {setError(e instanceof Error?e.message:'Prüflauf nicht erreichbar.');}
    finally {setBusy(false);}
  }
  return <section className="card" style={{marginTop:22}}>
    <h2>Stripe-Schreibtest ohne Zahlung</h2>
    <p>Prüft den tatsächlich hinterlegten Liveschlüssel: Eine nicht bezahlte Checkout-Sitzung wird angelegt und sofort wieder geschlossen. Es werden keine Kartendaten eingegeben und kein Zahlungslink angezeigt. Der öffentliche Verkauf bleibt gesperrt.</p>
    <p className="note">Die technisch angelegte Sitzung kann als abgelaufen in Stripe erscheinen. Wiederholte Klicks innerhalb desselben Fünf-Minuten-Fensters verwenden denselben Prüflauf.</p>
    <button type="button" className="button secondary" disabled={busy||!adminToken} onClick={run}>{busy?'Prüfe und schließe Sitzung …':'Stripe-Schreibtest starten (ohne Zahlung)'}</button>
    {error&&<p role="alert">{error}</p>}
    {report&&<div role="status" style={{marginTop:18}}>
      <h3>{report.passed?'Schreibtest bestanden':'Schreibtest noch nicht bestanden'}</h3>
      {Object.entries(report.checks).map(([name,step])=><p key={name}>
        <strong>{labels[name as keyof typeof labels]}:</strong> {step.status==='ok'?'OK':step.status==='not_run'?'Nicht ausgeführt':'Fehlgeschlagen'}
        {step.httpStatus?' (HTTP '+step.httpStatus+')':''}{step.code?' · '+step.code:''}
        {step.param?' · Parameter: '+step.param:''}{step.message?' · '+step.message:''}
        {step.requestId&&<small style={{display:'block'}}>Stripe-Anfrage: {step.requestId}</small>}
      </p>)}
      <p><strong>Sitzung:</strong> {report.sessionStatus||'Nicht bestätigt'} · <strong>Zahlungsstatus:</strong> {report.paymentStatus||'Nicht bestätigt'}</p>
      {report.sessionId&&<p style={{overflowWrap:'anywhere'}}><strong>Stripe-Referenz:</strong> {report.sessionId}</p>}
      {report.cleanupRequired&&<p role="alert"><strong>Schließen der Sitzung noch nicht bestätigt.</strong> Bitte diese Referenz in Stripe prüfen. Der Test gibt keinen Zahlungslink frei; die Sitzung hat zusätzlich eine kurze Ablaufzeit.</p>}
      <p className="note">{report.note}</p>
    </div>}
  </section>;
}
