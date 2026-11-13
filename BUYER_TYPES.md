# Privat- und Unternehmenskäufe

Die Auswahl betrifft den konkreten Kaufzweck, nicht pauschal den Kunden. Privatkauf ist vorausgewählt. Geschäftlicher Kauf erfordert Unternehmensname und eine separat aktivierte Erklärung des geschäftlichen Kaufzwecks. Änderungen der Auswahl schließen eine bereits geöffnete Stripe-Sitzung in der Oberfläche; erst eine neue Sitzung darf die neuen Angaben verwenden.

Der Server validiert die Angaben, setzt Zeit/Version und schreibt sie in Stripe-Metadaten. Der signierte Webhook liest die Sitzung erneut bei Stripe und übernimmt ausschließlich vollständige, bekannte Erklärungen. Fehlende oder unvollständige Metadaten werden `unclassified`, niemals automatisch B2B. Bestehende Bestellungen werden nicht rückwirkend umklassifiziert. Gespeicherte Erklärungen und Rechnungssnapshots werden nicht durch wiederholte Webhooks geändert.

B2C: Verbraucherinformationen und vollständige Waren-Widerrufsbelehrung mit Musterformular in der Bestätigung. B2B: keine Verbraucherbelehrung als Vertragsbeilage, sondern ausdrücklicher Hinweis auf fehlendes gesetzliches Verbraucherwiderrufsrecht bei Unternehmenskäufen und kein freiwilliges Widerrufsrecht. Gesetzliche Mängelrechte bleiben bestehen. Firmenname wird für neue B2B-Rechnungs-/Bestätigungsdokumente als Rechnungsempfänger verwendet; Liefername bleibt getrennt.

Die frei zugängliche Widerrufsfunktion bleibt für Verbraucher erreichbar. Eingehende Erklärungen werden gespeichert und quittiert, nicht wegen einer fehlerhaften Auswahl automatisiert abgewiesen. Die Quittung ist keine Gewährung eines Widerrufsrechts. Bei strittigem Kaufzweck ist eine Einzelfallprüfung nötig; eine Checkbox ist keine rechtliche Verifizierung oder ein Verzicht auf zwingende Rechte.

Keine automatische Steuerbefreiung, keine Änderung der 19-%-Prüfung und keine verpflichtende Umsatzsteuer-ID. Keine Änderung an den Live-Freigabeschaltern. Der SECPLAN-Direktversand und die Verkäuferverantwortung der H & K Projekt UG bleiben unverändert.

Quellen, geprüft 13.11.2026: § 13 BGB https://www.gesetze-im-internet.de/bgb/__13.html ; § 14 BGB https://www.gesetze-im-internet.de/bgb/__14.html ; § 312g BGB https://www.gesetze-im-internet.de/bgb/__312g.html ; § 356a BGB https://www.gesetze-im-internet.de/bgb/__356a.html . Vollständige Shop-Endabnahme und Testzahlungen in der Sandbox bleiben erforderlich.
