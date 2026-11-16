'use client';
import {useId,useState} from 'react';
import {checkTaxNumber,taxStates} from '../../../lib/tax-number.mjs';
export default function TaxNumberCheck(){
 const id=useId(),[number,setNumber]=useState(''),[state,setState]=useState('');
 const result=checkTaxNumber(number,state);
 return <details className="card"><summary>Steuernummer auf Plausibilität prüfen (optional)</summary>
 <p>Lokale Prüfhilfe: Die Nummer wird nicht gespeichert oder an einen Prüfdienst gesendet. Bitte die betriebliche Steuernummer verwenden, nicht die persönliche Steuer-ID oder USt-IdNr.</p>
 <div className="formGrid"><label>Bundesland des Finanzamts<select value={state} onChange={e=>setState(e.target.value)}><option value="">Bitte auswählen</option>{taxStates.map(s=><option key={String(s[0])} value={String(s[0])}>{s[1]}</option>)}</select></label>
 <label>Steuernummer<input type="text" inputMode="text" autoComplete="off" maxLength={40} value={number} aria-describedby={id} onChange={e=>setNumber(e.target.value)}/></label></div>
 <p id={id} role="status" aria-live="polite" style={{color:result.status==='plausible'?'#8cdec4':undefined}}>{result.status==='plausible'?'✓ ':''}{result.message}</p>
 <p className="muted">Keine amtliche Bestätigung und keine automatische Partnerfreigabe. Grundlage: ELSTER-Prüfregeln, Stand September 2026.</p></details>;
}
