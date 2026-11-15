import {body,client,json,failure} from '../../../lib/server';
export const dynamic='force-dynamic';
export async function POST(request:Request){try{const d=await body(request),db=await client(),action=d.action;
 if(action==='logout'){await db.auth.signOut();return json({ok:true})}
 const email=typeof d.email==='string'?d.email.trim().toLowerCase():'',password=typeof d.password==='string'?d.password:'';
 if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||email.length>200)throw new Error('Gültige E-Mail-Adresse erforderlich.');
 if(action==='signup'){
 if(d.website)return json({ok:true,message:'Bitte prüfe dein E-Mail-Postfach.'});
 if(password.length<12||password.length>128||d.accountPrivacyAccepted!==true)throw new Error('Mindestens 12 Zeichen Passwort und Kenntnisnahme der Kontodatenschutzhinweise erforderlich.');
 const {error}=await db.auth.signUp({email,password,options:{emailRedirectTo:new URL('/auth/callback',request.url).href}});if(error)throw new Error('Kontoregistrierung derzeit nicht möglich. Bitte Angaben und E-Mail-Konfiguration prüfen.');
 return json({ok:true,message:'Bitte bestätige deine E-Mail. Das technische Konto ist noch keine freigeschaltete Vertriebspartnerschaft.'});
 }
 if(action==='login'){if(!password||password.length>128)throw new Error('Zugangsdaten prüfen.');const {error}=await db.auth.signInWithPassword({email,password});if(error)throw new Error('Anmeldung fehlgeschlagen. Bitte Zugangsdaten und E-Mail-Bestätigung prüfen.');return json({ok:true})}
 if(action==='reset'){
 const {error}=await db.auth.resetPasswordForEmail(email,{redirectTo:new URL('/auth/callback?recovery=1',request.url).href});
 if(error){
 if(error.status===429||error.code==='over_email_send_rate_limit'||error.code==='over_request_rate_limit')return json({error:'Das E-Mail-Versandlimit ist erreicht. Es wurde kein neuer Link versendet. Bitte versuche es später erneut oder melde dich mit deinem bisherigen Passwort an.'},429);
 return json({error:'Der Rücksetzlink konnte derzeit nicht angefordert werden. Bitte versuche es später erneut.'},503);
 }
 return json({ok:true,message:'Falls ein passendes Konto besteht, erhältst du einen Link zur Passwortänderung. Prüfe auch den Spamordner und öffne nur den neuesten Link im selben Browser, in dem du ihn angefordert hast.'});
 }
 throw new Error('Unbekannte Anmeldeaktion.');
 }catch(e){return failure(e)}}
