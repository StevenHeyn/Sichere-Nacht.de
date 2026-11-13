/** Builds a manual supplier draft only. No network requests, prices or payment data. */
export type SupplierDraftOrder = {
  id:number|string; status:string; test_mode:boolean;
  shipping_name:string|null; shipping_country:string|null;
  shipping_address:Record<string,unknown>|null;
  items:Array<{sku:string|null;name:string;quantity:number}>;
};
function line(value:unknown):string {
  return typeof value==='string'?value.replace(/[\r\n\u0000-\u001f\u007f]/g,' ').trim():'';
}
export function supplierOrderReference(id:number|string):string {
  if(!/^[0-9]{1,20}$/.test(String(id)))throw new Error('Ungültige interne Bestellnummer.');
  return 'SN-B-'+id;
}
export function buildSecplanDraft(order:SupplierDraftOrder):string {
  if(order.test_mode)throw new Error('Testbestellungen dürfen nicht als echter SECPLAN-Auftrag exportiert werden.');
  if(order.status!=='paid')throw new Error('Die Bestellung ist nicht bezahlt.');
  if(order.shipping_country!=='DE'||order.shipping_address?.country!=='DE')throw new Error('Nur deutsche Lieferadressen sind freigegeben.');
  const name=line(order.shipping_name),a=order.shipping_address;
  if(!name||!line(a?.line1)||!line(a?.city)||!/^\d{5}$/.test(line(a?.postal_code)))throw new Error('Lieferempfänger oder Lieferadresse unvollständig. Rechnungsdaten werden nicht ersatzweise verwendet.');
  if(!Array.isArray(order.items)||!order.items.length||order.items.some(i=>!line(i.sku)||!Number.isInteger(i.quantity)||i.quantity<1))throw new Error('Artikelnummer oder Menge fehlt.');
  const address=[name,line(a?.line1),line(a?.line2),line(a?.postal_code)+' '+line(a?.city),'Deutschland'].filter(Boolean).join('\n');
  return [
    'ENTWURF – NICHT AUTOMATISCH VERSENDET',
    'Bitte nur über den mit SECPLAN vereinbarten Bestellkanal übermitteln.',
    'Auftraggeber / Rechnungsempfänger: H & K Projekt UG (haftungsbeschränkt)',
    'Lehmkoppel 7, 25499 Tangstedt, Deutschland',
    'Rückfragen an: bestellungen@sichere-nacht.de',
    'Unsere Bestellreferenz: '+supplierOrderReference(order.id),
    '', 'Direktversand an:',address,'','Artikel / Mengen:',
    ...order.items.map(i=>i.quantity+' × '+line(i.sku)+' | '+line(i.name)),
    '', 'Bitte Verfügbarkeit, vollständige Auftragsannahme sowie tatsächlichen Versand mit Versanddatum, Transporteur und ggf. Sendungsnummer an uns bestätigen.',
    'Endkundenrechnung und Kundenservice erfolgen durch H & K Projekt UG. Abweichende Bestände oder Lieferfristen bitte vor Ausführung melden.'
  ].join('\n');
}
