'use client';
import { useEffect, useState } from 'react';

const COOKIE = 'sn_ref';
const CONSENT = 'sn_ref_consent';
const DAYS = 90;
const valid = (value: string) => /^[A-Za-z0-9_-]{3,40}$/.test(value);
const readCookie = () => document.cookie.split('; ').find(x => x.startsWith(COOKIE + '='))?.split('=')[1];

export default function ReferralAttribution() {
  const [pending, setPending] = useState<string | null>(null);
  useEffect(() => {
    const ref = new URLSearchParams(window.location.search).get('ref');
    if (!ref || !valid(ref) || readCookie()) return;
    if (localStorage.getItem(CONSENT) === 'yes') {
      document.cookie = COOKIE + '=' + encodeURIComponent(ref) + '; Max-Age=' + DAYS * 86400 + '; Path=/; SameSite=Lax; Secure';
    } else if (localStorage.getItem(CONSENT) !== 'no') {
      setPending(ref);
    }
  }, []);
  if (!pending) return null;
  return <aside role="dialog" aria-label="Partnerzuordnung" style={{position:'fixed',bottom:16,left:16,right:16,zIndex:1000,maxWidth:520,margin:'auto',padding:18,background:'#fff',color:'#111',border:'1px solid #aaa',borderRadius:12,boxShadow:'0 8px 30px #0003'}}>
    <p>Dieser Link stammt von einem Vertriebspartner. Mit deiner Einwilligung speichern wir die Partnerkennung 90 Tage, um eine spätere Bestellung zuordnen zu können. Du kannst auch ohne Einwilligung einkaufen.</p>
    <div style={{display:'flex',gap:12}}>
      <button type="button" onClick={() => {localStorage.setItem(CONSENT,'yes');document.cookie=COOKIE+'='+encodeURIComponent(pending)+'; Max-Age='+DAYS*86400+'; Path=/; SameSite=Lax; Secure';setPending(null);}}>Einwilligen</button>
      <button type="button" onClick={() => {localStorage.setItem(CONSENT,'no');setPending(null);}}>Ablehnen</button>
    </div>
  </aside>;
}
