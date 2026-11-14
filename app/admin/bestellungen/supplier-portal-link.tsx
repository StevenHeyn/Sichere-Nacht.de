import {secplanPortal} from '../../../lib/secplan-portal';

/** Navigation only: never uploads order data or changes a fulfillment status. */
export default function SupplierPortalLink({testMode}:{testMode:boolean}){
 return <section aria-label="Manueller SECPLAN-Bestellweg" style={{margin:'16px 0',padding:16,border:'1px solid #30445b',borderRadius:10}}>
  <p><strong>Bestellweg: SECPLAN-Händlerportal</strong></p>
  <a className="button secondary" href={secplanPortal.loginUrl} target="_blank" rel="noopener noreferrer" referrerPolicy="no-referrer">SECPLAN-Portal öffnen (neuer Tab)</a>
  <p className="note">Der Link öffnet ausschließlich die Anmeldung. Er übermittelt keine Lieferadresse, Artikel, Zugangsdaten oder Admin-Schlüssel und ändert keinen Bestellstatus. Keine API oder automatische Auftragsübermittlung angeschlossen.</p>
  {testMode?<p className="note"><strong>TESTBESTELLUNG:</strong> Diese Daten nicht im SECPLAN-Portal bestellen. Die internen Testschritte sind nur eine Simulation, kein Lieferantenauftrag.</p>:<ol>
   <li>Im freigeschalteten Händlerkonto anmelden und tatsächliche Artikelverfügbarkeit, Einkaufspreise und Lieferbedingungen prüfen.</li>
   <li>Die Artikelnummern und Mengen aus dem Auftragsentwurf manuell übernehmen. H &amp; K bleibt Auftraggeber; die abweichende Kundenlieferadresse vor dem Abschluss prüfen. Falls dieser Direktversand im Konto nicht möglich ist, zuerst SECPLAN kontaktieren.</li>
   <li>Erst nach tatsächlich abgeschlossener Portalbestellung den Übermittlungsbeleg hier erfassen. Eine separate SECPLAN-Auftragsbestätigung und den späteren tatsächlichen Versand jeweils gesondert dokumentieren.</li>
  </ol>}
  <p className="note">Anmeldedaten ausschließlich direkt bei SECPLAN eingeben, nicht in Sichere Nacht. Die Freischaltung eures konkreten Händlerkontos und der Dropshipping-Abschluss sind durch diesen Link noch nicht geprüft.</p>
 </section>;
}
