/** Public delivery policy; supplier identity is never part of the browser bundle. */
export const deliveryPolicy = {
  seller: 'H & K Projekt UG (haftungsbeschränkt)',
  country: 'DE', shippingCents: 990,
  deliveryLabel: '2–4 Werktage nach Zahlungseingang für Artikel mit bestätigter Verfügbarkeit',
  returnsAddress: 'H & K Projekt UG (haftungsbeschränkt), Lehmkoppel 7, 25499 Tangstedt, Deutschland',
  contactEmail: 'bestellungen@sichere-nacht.de',
  fulfillmentMode: 'partner_dropship',
  automaticSupplierTransmission: false,
  supplierInventoryVerified: false,
  supplierPackagingEvidenceVerified: false
} as const;
export const supplierStatusLabels: Record<string,string> = {
  pending:'An den Lieferanten noch nicht übermittelt',
  submitted:'Manuell an den Lieferanten übermittelt',
  confirmed:'Vom Lieferanten bestätigt',
  shipped:'Lieferantenversand bestätigt',
  legacy:'Historischer Versand; kein nachträglich erfundener Lieferantenbeleg'
};
