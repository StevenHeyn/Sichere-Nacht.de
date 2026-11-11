'use client';
import {useEffect,useState} from 'react';
import {loadCart,saveCart,normalizeVpId} from '../lib/cart';
const KEY='sn_partner_first_touch';
const CONSENT='sn_partner_tracking_consent';
const DAYS=90;
type Attribution={id:string;expires:number};
function stored():Attribution|null {
 try {const a=JSON.parse(localStorage.getItem(KEY)||'null') as Attribution|null;
 if(a && a.expires>Date.now() && /^VP-[A-Z0-9]{3,16}$/.test(a.id))return a;
 localStorage.removeItem(KEY);
 }catch{} return null;
}
function assign(id:string){
 try {
  const a={id,expires:Date.now()+DAYS*86400000};
  localStorage.setItem(KEY,JSON.stringify(a));
  const cart=loadCart();
  saveCart({...cart,vpId:id});
 }catch{}
}
export default function ReferralCapture(){
 const [pending,setPending]=useState<string|null>(null);
 useEffect(()=>{
  const existing=stored();
  if(existing){assign(existing.id);return;}
  const raw=new URLSearchParams(window.location.search).get('vp');
  if(!raw)return;
  const id=normalizeVpId(raw);
  if(!/^VP-[A-Z0-9]{3,16}$/.test(id)||id!==raw.trim().toUpperCase())return;
  try {
   const choice=localStorage.getItem(CONSENT);
   if(choice==='yes')assign(id);
   else if(choice!== 'no')setPending(id);
  }catch{}
 },[]);
 if(!pending)return null;
 return <aside role="dialog" aria-label="Einwilligung zur Partnerzuordnung" style={{position:'fixed',bottom:16,left:16,right:16,maxWidth:520,margin:'auto',zIndex:1000,padding:20,background:'#fff',color:'#111',border:'1px solid #aaa',borderRadius:12,boxShadow:'0 6px 30px #0004'}}>
 <p>Du bist über einen Vertriebspartner zu uns gekommen. Dürfen wir seine Kennung für 90 Tage auf diesem Gerät speichern, damit wir eine spätere Bestellung zuordnen können? Ohne Einwilligung kannst du normal einkaufen.</p>
 <div style={{display:'flex',gap:12}}>
 <button type="button" onClick={()=>{localStorage.setItem(CONSENT,'yes');assign(pending);setPending(null);}}>Einwilligen</button>
 <button type="button" onClick={()=>{localStorage.setItem(CONSENT,'no');setPending(null);}}>Ablehnen</button>
 </div></aside>;
}
