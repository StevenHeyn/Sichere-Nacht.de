'use client';
import {useEffect,useState} from 'react';
type Portal={label:string;loginUrl:string};
/** Supplier identity is fetched only after server-side admin authorization. */
export default function SupplierPortalLink({testMode,adminToken}:{testMode:boolean;adminToken:string}){
 const [portal,setPortal]=useState<{token:string;data:Portal}|null>(null),[error,setError]=useState('');
 useEffect(()=>{let active=true;const controller=new AbortController();setPortal(null);setError('');
  if(adminToken)fetch('/api/admin/supplier-settings',{headers:{Authorization:'Bearer '+adminToken},cache:'no-store',signal:controller.signal}).then(async response=>{
   if(!response.ok)throw new Error('Interner Lieferantenlink konnte nicht freigegeben werden.');
   const data=await response.json();const url=new URL(data.loginUrl);
   if(url.protocol!=='https:'||url.username||url.password||url.search||url.hash||typeof data.label!=='string')throw new Error('Lieferantenlink nicht verfügbar.');
   if(active)setPortal({token:adminToken,data:{label:data.label,loginUrl:url.href}});
  }).catch(e=>{if(active&&!controller.signal.aborted)setError(e instanceof Error?e.message:'Lieferantenlink nicht verfügbar.')});
  return()=>{active=false;controller.abort()};
 },[adminToken]);
 const details=portal?.token===adminToken?portal.data:null;
 return <section aria-label="Interner manueller Bestellweg" style={{margin:'16px 0',padding:16,border:'1px solid #30445b',borderRadius:10}}>
  <p><strong>Bestellweg: internes Händlerportal</strong></p>
  {details?<><p>{details.label}</p><a className="button secondary" href={details.loginUrl} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">Lieferantenportal öffnen (neuer Tab)</a></>:<p role="status">{error||'Interner Lieferantenlink wird geprüft …'}</p>}
  <p className="note">Der Link öffnet ausschließlich die Anmeldung. Er übermittelt keine Lieferadresse, Artikel, Zugangsdaten oder Admin-Schlüssel und ändert keinen Bestellstatus. Keine API oder automatische Auftragsübermittlung angeschlossen.</p>
  {testMode?<p className="note"><strong>TESTBESTELLUNG:</strong> Diese Daten nicht im Lieferantenportal bestellen. Die internen Testschritte sind nur eine Simulation, kein Lieferantenauftrag.</p>:<ol>
   <li>Im freigeschalteten Händlerkonto anmelden und tatsächliche Artikelverfügbarkeit, Einkaufspreise und Lieferbedingungen prüfen.</li>
   <li>Artikelnummern und Mengen aus dem Auftragsentwurf manuell übernehmen. H &amp; K bleibt Auftraggeber; die abweichende Kundenlieferadresse vor dem Abschluss prüfen. Ist der Direktversand im Konto nicht möglich, zuerst den Lieferanten kontaktieren.</li>
   <li>Erst nach tatsächlich abgeschlossener Portalbestellung den Übermittlungsbeleg erfassen. Auftragsbestätigung und späteren tatsächlichen Versand jeweils gesondert dokumentieren.</li>
  </ol>}
  <p className="note">Zugangsdaten ausschließlich direkt beim Lieferanten eingeben. Diesen Admin-Zugangsschlüssel nicht an Vertriebspartner weitergeben. Die konkrete Kontofreischaltung und der Bestellabschluss sind durch den Link noch nicht geprüft.</p>
 </section>;
}
