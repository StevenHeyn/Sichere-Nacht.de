/** Confirmed merchant policy. This is not a supplier inventory feed or a compliance certificate. */
export const deliveryPolicy = {
  seller: 'H & K Projekt UG (haftungsbeschränkt)',
  supplier: 'SECPLAN Technik GmbH',
  supplierAddress: 'Buchenstraße 15, 64385 Reichelsheim, Deutschland',
  country: 'DE', shippingCents: 990,
  deliveryLabel: '2–4 Werktage nach Zahlungseingang für bei SECPLAN vorrätige Artikel',
  returnsAddress: 'H & K Projekt UG (haftungsbeschränkt), Lehmkoppel 7, 25499 Tangstedt, Deutschland',
  contactEmail: 'bestellungen@sichere-nacht.de',
  fulfillmentMode: 'secplan_dropship',
  automaticSupplierTransmission: false,
  supplierInventoryVerified: false,
  supplierPackagingEvidenceVerified: false
} as const;

export const supplierStatusLabels: Record<string,string> = {
  pending:'An SECPLAN noch nicht übermittelt',
  submitted:'Manuell an SECPLAN übermittelt',
  confirmed:'Von SECPLAN bestätigt',
  shipped:'SECPLAN-Versand bestätigt',
  legacy:'Historischer Versand; kein nachträglich erfundener Lieferantenbeleg'
};
