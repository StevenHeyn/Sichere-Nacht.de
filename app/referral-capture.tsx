'use client';
import {useEffect,useState} from 'react';
import {approvedReferral,storeReferral,revokeReferral,validPartner,REFERRAL_DAYS} from '../lib/referral-consent';
export default function ReferralCapture(){
 const [open,setOpen]=useState(false),[candidate,setCandidate]=useState(''),[active,setActive]=useState(''),[message,setMessage]=useState('');
 useEffect(()=>{
  const saved=approvedReferral();setActive(saved?.vpId||'');
  if(!saved){try{revokeReferral()}catch{/* Storage may be blocked. */}}
  const value=new URLSearchParams(location.search).get('vp')?.trim().toUpperCase();
  if(validPartner(value)&&value!==saved?.vpId){setCandidate(value);setOpen(true)}
  const show=()=>{setActive(approvedReferral()?.vpId||'');setOpen(true)};
  const update=()=>setActive(approvedReferral()?.vpId||'');
  window.addEventListener('sn-open-referral-settings',show);window.addEventListener('sn-referral-updated',update);
  return ()=>{window.removeEventListener('sn-open-referral-settings',show);window.removeEventListener('sn-referral-updated',update)};
 },[]);
 function choose(yes:boolean){try{if(yes&&candidate)storeReferral(candidate);else revokeReferral();setMessage(yes?'Empfehlung gespeichert.':'Keine dauerhafte Empfehlungszuordnung.');setOpen(false);const u=new URL(location.href);u.searchParams.delete('vp');history.replaceState({},'',u.pathname+u.search+u.hash)}catch{setMessage('Dein Browser erlaubt die Speicherung nicht. Der Einkauf bleibt möglich.');setOpen(false)}}
 return <>{open&&<section className="consentPanel" aria-label="Empfehlungszuordnung"><h2>Empfehlung merken?</h2><p>Mit deiner Zustimmung speichern wir die Partnerkennung {candidate||active||'eines Empfehlungslinks'} für höchstens {REFERRAL_DAYS} Tage in diesem Browser, um einen späteren Einkauf zuzuordnen. Ohne Zustimmung kannst du genauso einkaufen.</p><p className="note">Keine IP-Personenkennung, kein Fingerprinting. Bei Gerätewechsel oder gelöschten Browserdaten ist keine Wiedererkennung möglich. Eine Provision setzt zusätzlich unsere serverseitige Partnerprüfung voraus.</p><div className="row"><button className="button secondary" onClick={()=>choose(false)}>Nicht speichern / widerrufen</button>{candidate?<button className="button secondary" onClick={()=>choose(true)}>Empfehlung speichern</button>:<button className="button secondary" onClick={()=>setOpen(false)}>Schließen</button>}</div><p className="note">Änderbar über „Empfehlungs-Einstellungen“ im Footer. <a href="/datenschutz">Datenschutz</a></p></section>}{message&&<p className="sr-only" role="status">{message}</p>}</>;
}
