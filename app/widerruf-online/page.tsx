'use client';
import Link from 'next/link';
import {useState} from 'react';
export default function WiderrufOnline(){
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[reference,setReference]=useState('');
 const [step,setStep]=useState(1),[busy,setBusy]=useState(false),[result,setResult]=useState('');
 async function submit(){
  setBusy(true);setResult('');
  try{
   const r=await fetch('/api/widerruf',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name,email,reference})});
   const data=await r.json();
   if(!r.ok)throw new Error(data.error||'Übermittlung nicht möglich');
   setResult(data.receiptSent?'Dein Widerruf wurde übermittelt. Die Eingangsbestätigung wurde an deine E-Mail-Adresse gesendet.':'Dein Widerruf wurde erfasst. Die automatische E-Mail-Bestätigung konnte nicht zugestellt werden. Kontaktiere uns bei Bedarf per E-Mail.');
   setStep(3);
  }catch(e){setResult(e instanceof Error?e.message:'Übermittlung fehlgeschlagen')}
  finally{setBusy(false)}
 }
 return <main className="wrap" style={{maxWidth:760,paddingBottom:90}}>
  <Link href="/widerruf" className="accent">← Widerrufsbelehrung</Link>
  <h1>Vertrag widerrufen</h1>
  <p>Hier kannst du deinen online geschlossenen Vertrag widerrufen, ohne einen Grund anzugeben. Alternativ per E-Mail: <a href="mailto:bestellungen@sichere-nacht.de">bestellungen@sichere-nacht.de</a>.</p>
  {step===1&&<section className="card"><h2>1. Angaben zum Widerruf</h2>
   <form onSubmit={e=>{e.preventDefault();setStep(2)}}>
    <label htmlFor="w-name">Vor- und Nachname</label><input id="w-name" required maxLength={160} value={name} onChange={e=>setName(e.target.value)}/>
    <label htmlFor="w-email">E-Mail für die Eingangsbestätigung</label><input id="w-email" type="email" required maxLength={200} value={email} onChange={e=>setEmail(e.target.value)}/>
    <label htmlFor="w-ref">Bestellnummer oder Angaben zur Bestellung</label><input id="w-ref" required maxLength={240} value={reference} onChange={e=>setReference(e.target.value)} placeholder="Bestellnummer oder Artikel und Bestelldatum"/>
    <p className="note">Informationen zur Verarbeitung: <Link href="/datenschutz">Datenschutz</Link>.</p>
    <button className="button" type="submit">Angaben überprüfen</button>
   </form></section>}
  {step===2&&<section className="card"><h2>2. Widerruf bestätigen</h2>
   <p><strong>Name:</strong> {name}</p><p><strong>E-Mail:</strong> {email}</p><p><strong>Vertrag / Bestellung:</strong> {reference}</p>
   <p>Mit dem nächsten Klick übermittelst du deine Widerrufserklärung.</p>
   <div className="row"><button className="button secondary" type="button" onClick={()=>setStep(1)} disabled={busy}>Zurück</button><button className="button" type="button" onClick={submit} disabled={busy}>{busy?'Wird gesendet …':'Widerruf bestätigen'}</button></div>
   {result&&<p role="alert">{result}</p>}
  </section>}
  {step===3&&<section className="card"><h2>Widerruf übermittelt</h2><p role="status">{result}</p><Link href="/widerruf">Widerrufsbelehrung</Link></section>}
 </main>;
}