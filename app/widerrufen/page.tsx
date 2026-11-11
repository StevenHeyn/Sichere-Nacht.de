'use client';
import {useState} from 'react';
import Link from 'next/link';
export default function Widerrufen(){
 const [name,setName]=useState(''),[email,setEmail]=useState(''),[reference,setReference]=useState(''),[message,setMessage]=useState('');
 const [ready,setReady]=useState(false),[busy,setBusy]=useState(false),[error,setError]=useState(''),[success,setSuccess]=useState<{reference:string;time:string}|null>(null);
 async function submit(e:React.FormEvent){
  e.preventDefault();if(!ready||busy)return;setBusy(true);setError('');
  try{
   const r=await fetch('/api/widerruf',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({name,email,reference,message})});
   const j=await r.json();if(!r.ok)throw new Error(j.error||'Widerruf derzeit nicht übermittelbar.');
   setSuccess({reference:j.reference,time:j.receivedAt});
  }catch(err){setError(err instanceof Error?err.message:'Übermittlung fehlgeschlagen. Bitte per E-Mail widerrufen.');}
  finally{setBusy(false);}
 }
 return <main className="wrap" style={{maxWidth:760,paddingBottom:80}}>
 <Link href="/" className="accent">← Startseite</Link><p className="accent">WIDERRUFSFUNKTION</p><h1>Vertrag widerrufen</h1>
 <p>Hier können Sie einen über sichere-nacht.de geschlossenen Vertrag widerrufen. Das gesetzliche Widerrufsrecht wird durch diese Funktion nicht eingeschränkt. Alternativ können Sie weiterhin per E-Mail an <a href="mailto:bestellungen@sichere-nacht.de">bestellungen@sichere-nacht.de</a> oder per Brief widerrufen.</p>
 <p><Link href="/widerruf">Widerrufsbelehrung und Musterformular lesen</Link></p>
 {success?<section className="card" role="status"><h2>Widerruf eingegangen</h2><p>Ihre Widerrufserklärung ist am <strong>{new Date(success.time).toLocaleString('de-DE')}</strong> bei uns eingegangen.</p><p>Bestätigungsnummer: <strong>{success.reference}</strong></p><p>Die Eingangsbestätigung wurde an die von Ihnen angegebene E-Mail-Adresse gesendet. Bitte bewahren Sie diese auf.</p></section>:
 <form className="card" onSubmit={submit}>
 <h2>Angaben zum Widerruf</h2>
 <label htmlFor="withdraw-name">Ihr vollständiger Name *</label><input id="withdraw-name" autoComplete="name" value={name} required maxLength={150} onChange={e=>{setName(e.target.value);setReady(false)}}/>
 <label htmlFor="withdraw-email">E-Mail für die Eingangsbestätigung *</label><input id="withdraw-email" type="email" autoComplete="email" value={email} required maxLength={240} onChange={e=>{setEmail(e.target.value);setReady(false)}}/>
 <label htmlFor="withdraw-ref">Bestellnummer oder andere Vertragskennung *</label><input id="withdraw-ref" value={reference} required maxLength={150} onChange={e=>{setReference(e.target.value);setReady(false)}}/>
 <p className="note">Falls Sie keine Bestellnummer haben, geben Sie ein anderes eindeutiges Merkmal Ihres Vertrags an, z. B. Bestelldatum und Produkt.</p>
 <label htmlFor="withdraw-message">Zusätzliche Angaben (freiwillig)</label><textarea id="withdraw-message" value={message} maxLength={1500} rows={3} onChange={e=>{setMessage(e.target.value);setReady(false)}} placeholder="z. B. nur einzelne Positionen widerrufen"/>
 <p>Ihre Erklärung: <strong>Hiermit widerrufe ich den genannten Vertrag beziehungsweise die oben bezeichneten Positionen.</strong></p>
 {!ready?<button className="button" type="button" disabled={!name.trim()||!email.trim()||!reference.trim()} onClick={()=>setReady(true)}>Angaben prüfen</button>:
 <section style={{border:'1px solid #6b7582',borderRadius:10,padding:16,marginTop:12}}>
 <h3>Widerruf prüfen</h3><p><strong>Name:</strong> {name}</p><p><strong>E-Mail:</strong> {email}</p><p><strong>Vertrag:</strong> {reference}</p>{message&&<p><strong>Zusatz:</strong> {message}</p>}
 <div className="row"><button type="submit" className="button" disabled={busy}>{busy?'Wird übermittelt …':'Widerruf bestätigen'}</button><button type="button" className="button secondary" onClick={()=>setReady(false)}>Bearbeiten</button></div>
 </section>}
 {error&&<p role="alert">{error} Alternativ: <a href="mailto:bestellungen@sichere-nacht.de">bestellungen@sichere-nacht.de</a></p>}
 </form>}
 </main>;
}