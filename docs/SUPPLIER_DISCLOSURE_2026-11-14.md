# Lieferantenneutrale Kundendarstellung – 14.11.2026

## Betreiberauftrag
Die Bezugsquelle soll nicht als Marketinghinweis auf öffentlichen Seiten, im Warenkorb oder in zukünftigen Kundenunterlagen erscheinen. Die interne Lieferantenabwicklung bleibt erhalten. Datenschutzrechte und zwingende Hersteller-/Produktpflichtangaben werden nicht unterdrückt.

## Umgesetzt im Änderungszweig
- Öffentliche Start-, Shop-, Produkt-, Konfigurator-, Montage-, Versand-, AGB-, Widerrufs- und Datenschutztexte verwenden keine konkrete Lieferantenidentität mehr. H & K Projekt UG bleibt Verkäufer, Rechnungsaussteller und Kundenansprechpartner.
- Versandkosten, Liefergebiet, nur bei bestätigter Verfügbarkeit geltende Fristen sowie Montagebedingungen bleiben unverändert. Kein eigenes Lager wird vorgetäuscht.
- Künftige Bestätigungs-/Rechnungsmailtexte und Verbraucher-Widerrufsanhänge sind neutral. Bereits versandte Nachrichten und bestehende Bestell-/Rechnungssnapshots wurden weder zurückgerufen noch verändert.
- Die öffentliche Datenschutzerklärung beschreibt konkret die Empfängerkategorien (deutsche Großhändler/Distributoren für Sicherheits- und Alarmtechnik mit Direktversand, eingesetzte Paket-/Transportdienstleister), Zweck, erforderliche Daten und Vertragsrechtsgrundlage. Keine pauschale Erlaubnis zur beliebigen Weitergabe und keine erfundene Einwilligung.
- Das Recht auf Auskunft über tatsächliche Empfänger bleibt ausdrücklich bestehen. Andere noch offene Datenschutzverträge/Fristen werden durch diese Formulierung nicht als erledigt behandelt.
- Lieferantenname und Portaladresse werden erst nach serverseitiger Prüfung des internen Admin-Bearer-Tokens über einen nicht cachebaren Endpunkt ausgegeben. Weder die anonyme Admin-Seite noch ihre herunterladbaren JavaScript-Dateien enthalten den Lieferanten. Eine VP-Kennung gewährt keinen Adminzugang. Es wurden keine neuen Partnerrollen oder Kundenkonten erfunden.
- Eine kundenspezifische Frontplatte mit aufgedrucktem Lieferantenlogo ist aus dem öffentlichen Katalog und Checkout ausgeschlossen; sie wurde nicht irreführend als neutrale Variante umbenannt. Ihr Originaldatensatz und Bild bleiben für die interne Nachvollziehbarkeit erhalten, das Bild liegt nicht mehr im öffentlichen Webverzeichnis. Alle anderen Katalogpreise, Bezeichnungen und Artikelnummern bleiben unverändert.

## Technische Prüfungen
Im isolierten Entwicklungsbuild bestanden: 29 Quell-/Rechte-/Lieferantenablaufprüfungen, Next.js-Build sowie 7 Prüfungen einschließlich Scan aller browserseitigen JS/CSS/JSON/Source-map-Dateien. Der HTTP-Test prüft 15 Seiten ohne Lieferantenidentität, die ausgeschlossene Produkt- und Bildadresse auf 404, fehlende/falsche/VP-Kennung auf 401 sowie den zulässigen Zugriff mit einem synthetischen lokalen Admin-Schlüssel auf 200. Kein echter Schlüssel, kein Lieferantenauftrag, keine Zahlung und keine Kundenmail werden durch diese Tests benutzt. Endgültige CI-/Deploymentnachweise werden im Pull Request dokumentiert.

## Grenzen des Bezugsquellenschutzes
1. Das GitHub-Repository wurde beim Audit als PUBLIC bestätigt. Dokumente, Quellcode, Pull Requests und ältere Commits enthalten frühere Lieferantenhinweise. Die öffentliche Repository-Sichtbarkeit wurde nicht geändert; dafür ist eine gesonderte Umstellung auf privat erforderlich. Bereits existierende Kopien/Forks lassen sich dadurch nicht zurückrufen.
2. Alte unveränderliche Deployments, schon ausgelieferte Browserdateien, Downloads und bereits versandte E-Mails werden durch einen neuen Produktionsbuild nicht rückwirkend gelöscht. Bestehende Vorschau-/Sharelinks sind gegebenenfalls gesondert zu prüfen.
3. Absenderetiketten, Lieferscheine, Verpackung und physischer Versand können eine Bezugsquelle offenlegen. Neutraler Versand ist nicht allein durch Website-Code nachgewiesen und muss mit dem Versandpartner vereinbart werden.
4. Gesetzliche Empfängerauskunft und verpflichtende Hersteller-/EU-Verantwortlichen-/Produktsicherheitsangaben dürfen nicht zum Schutz einer Bezugsquelle pauschal verweigert werden. Keine Garantie vollständiger Geheimhaltung oder umfassender Rechtskonformität.
5. Der interne Admin-Schlüssel darf nicht an Vertriebspartner weitergegeben werden. Wer den internen Adminzugang besitzt, ist für die Lieferantenabwicklung autorisiert.

## Offizielle Rechtsquellen
- DSGVO Art. 13 Abs. 1 lit. c/e und Art. 6 Abs. 1 lit. b: https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX%3A32016R0679
- EuGH C-154/21 zur tatsächlichen Empfängeridentität bei Auskunft nach Art. 15: https://eur-lex.europa.eu/legal-content/DE/TXT/?uri=CELEX%3A62021CJ0154
- EDSA/WP29 Transparenzleitlinien zur Spezifität von Empfängerkategorien: https://www.edpb.europa.eu/system/files/2023-09/wp260rev01_en.pdf

Zahlungs-/Indexfreigaben, Bestelldatenbank, Lieferantenstatus-RPCs und vorhandene B2C/B2B-/Referral-Regeln werden nicht geändert.
