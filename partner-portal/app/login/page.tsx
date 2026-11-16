'use client';
import {useEffect,useState} from 'react';
import Link from 'next/link';

export default function Login(){
 const [mode,setMode]=useState('login'),[email,setEmail]=useState(''),[password,setPassword]=useState(''),[privacy,setPrivacy]=useState(false),[message,setMessage]=useState(''),[isError,setIsError]=useState(false),[busy,setBusy]=useState(false),[invite,setInvite]=useState(''),[retryIn,setRetryIn]=useState(0),[confirmationPending,setConfirmationPending]=useState(false);
 const sendsEmail=mode==='signup'||mode==='reset'||mode==='resend_confirmation';
 useEffect(()=>{
  const p=new URLSearchParams(location.search);
  if(p.has('register'))setMode('signup');
  if(p.has('reset'))setMode('reset');
  if(p.has('recovery'))setMode('password');
  const i=p.get('invite');
  if(i&&/^(vp_)?[a-f0-9]{64}$/.test(i)){sessionStorage.setItem('sn-vp-invite',i);setInvite(i);setMode('signup')}
  if(p.has('error')){setIsError(true);setMessage('Der Bestätigungslink ist ungültig, abgelaufen oder wurde in einem anderen Browser geöffnet. Bitte fordere einen neuen Link an und öffne ihn im selben Browser.')}
 },[]);
 useEffect(()=>{if(retryIn<=0)return;const timer=setTimeout(()=>setRetryIn(n=>Math.max(0,n-1)),1000);return()=>clearTimeout(timer)},[retryIn]);
 function changeMode(next:string){setMode(next);setMessage('');setIsError(false);setPassword('');setConfirmationPending(false)}
 async function submit(e:React.FormEvent){
  e.preventDefault();
  if(busy||(sendsEmail&&retryIn>0)||(mode==='signup'&&confirmationPending))return;
  setBusy(true);setMessage('');setIsError(false);
  const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),30000);
  try{
   const r=await fetch(mode==='password'?'/api/command':'/api/auth',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({action:mode,email,password,accountPrivacyAccepted:privacy}),signal:controller.signal});
   const d=await r.json();
   if(sendsEmail&&typeof d.retryAfterSeconds==='number'&&Number.isFinite(d.retryAfterSeconds))setRetryIn(Math.min(3600,Math.max(1,Math.ceil(d.retryAfterSeconds))));
   else if(sendsEmail&&r.status===429)setRetryIn(60);
   if(!r.ok)throw new Error(d.error||'Anfrage fehlgeschlagen. Bitte versuche es erneut.');
   if(mode==='login'||mode==='password'){location.href='/portal';return}
   setMessage(d.message);setPassword('');
   if(sendsEmail)setRetryIn(60);
   if(mode==='signup')setConfirmationPending(true);
  }catch(e){
   if(sendsEmail&&controller.signal.aborted)setRetryIn(60);
   setIsError(true);
   setMessage(controller.signal.aborted?(sendsEmail?'Die Anfrage dauert zu lange. Bitte prüfe zuerst dein Postfach; die E-Mail könnte bereits versendet worden sein.':'Die Anfrage dauert zu lange. Bitte prüfe deine Verbindung und versuche es erneut.'):e instanceof Error?e.message:'Anfrage fehlgeschlagen. Bitte versuche es erneut.');
  }finally{clearTimeout(timer);setBusy(false)}
 }
 return <main className="authPage">
  <div>
   <p className="eyebrow">SICHERE NACHT · PARTNER</p>
   <h1>{mode==='signup'?'Dein Partnerkonto.':mode==='resend_confirmation'?'E-Mail bestätigen.':mode==='reset'?'Zugang wiederherstellen.':mode==='password'?'Neues Passwort.':'Willkommen zurück.'}</h1>
   <p>{mode==='signup'?'Erstelle dein Konto und bestätige anschließend deine E-Mail-Adresse. Danach vervollständigst du deinen Partnerantrag.':mode==='resend_confirmation'?'Fordere einen neuen Bestätigungslink für dein bestehendes Partnerkonto an.':mode==='reset'?'Gib die E-Mail-Adresse deines bestehenden Kontos ein. Wir senden dir einen Link, mit dem du ein neues Passwort festlegen kannst.mode==='password'?'Wähle ein neues Passwort mit mindestens 12 Zeichen.':'Melde dich an, um deine Gebiete, Schulungen und Provisionen zu verwalten.'}</p>
   {invite&&<p className="notice">{invite.startsWith('vp_')?'Du nutzt eine persönliche VP-Einladung. Dein Werber wird beim ersten Partnerantrag zugeordnet.':'Du nutzt eine Agentureinladung.'} Die Zuordnung erfolgt erst nach E-Mail-Bestätigung und eigener Antragstellung.</p>}
  </div>
  <form className="card" onSubmit={submit} aria-busy={busy}>
   {mode==='signup'&&confirmationPending?<div role="status" aria-live="polite">
    <h2>Bitte E-Mail bestätigen</h2>
    <p>Prüfe das Postfach für <strong>{email.trim()}</strong>.</p>
    <p className="notice">{message}</p>
    <p className="muted">Das Konto allein berechtigt noch nicht zum Vertrieb. Die Freigabe erfolgt nach deinem vollständigen Partnerantrag.</p>
    <button className="button full" type="button" onClick={()=>changeMode('login')}>Zur Anmeldung</button>
    <button className="textButton" type="button" onClick={()=>changeMode('resend_confirmation')}>Bestätigungs-E-Mail erneut senden</button>
    <button className="textButton" type="button" onClick={()=>changeMode('signup')}>E-Mail-Adresse korrigieren</button>
   </div>:<>
   {mode!=='password'&&<label>E-Mail-Adresse<input type="email" autoComplete="email" required disabled={busy} value={email} onChange={e=>setEmail(e.target.value)}/></label>}
   {mode!=='reset'&&mode!=='resend_confirmation'&&<label>Passwort<input type="password" required disabled={busy} minLength={mode==='login'?1:12} maxLength={128} autoComplete={mode==='login'?'current-password':'new-password'} value={password} onChange={e=>setPassword(e.target.value)}/></label>}
   {mode==='signup'&&<>
    <label className="check"><input type="checkbox" checked={privacy} onChange={e=>setPrivacy(e.target.checked)} required disabled={busy}/>Ich habe die <Link href="/datenschutz">Hinweise zum Partnerkonto</Link> gelesen.</label>
    <p className="muted">Anschließend: persönliche Angaben, Portrait, Gewerbenachweis und VP-Vertragsannahme. Das Konto allein berechtigt noch nicht zum Vertrieb.</p>
   </>}
   <button className="button full" disabled={busy||(sendsEmail&&retryIn>0)}>{busy?'Bitte warten …':sendsEmail&&retryIn>0?`Erneut anfordern in ${retryIn} s`:mode==='signup'?'Konto erstellen':mode==='resend_confirmation'?'Bestätigungslink erneut senden':mode==='reset'?'Rücksetzlink anfordern':mode==='password'?'Passwort speichern':'Sicher anmelden'}</button>
   {message&&<p className="notice" role={isError?'alert':'status'}>{message}</p>}
   {mode==='reset'&&<p className="muted">Öffne den neuesten E-Mail-Link im selben Browser. Mehrfaches Anfordern kann das Versandlimit erreichen.</p>}
   <div className="row">
    <button className="textButton" type="button" disabled={busy} onClick={()=>changeMode(mode==='login'?'signup':'login')}>{mode==='login'?'Noch kein Konto?':'Zur Anmeldung'}</button>
    {mode!=='resend_confirmation'&&<button className="textButton" type="button" disabled={busy} onClick={()=>changeMode('resend_confirmation')}>Bestätigungs-E-Mail erneut senden</button>}
    {mode!=='reset'&&<button className="textButton" type="button" disabled={busy} onClick={()=>changeMode('reset')}>Passwort vergessen</button>}
   </div>
   </>}
  </form>
 </main>
}
