# Sichere Nacht: Freigabe- und Nachweisregister

Stand: 20.11.2026 · Projekt: `prj_9zzzk8nm8vyOsLPfMmOJCnY5ZIIV` · Betreiber: H & K Projekt UG (haftungsbeschränkt), Lehmkoppel 7, 25499 Tangstedt.

**Grundsatz:** Ein veröffentlichter Link, eine Produktbeschreibung, ein Anbieter-DPA-Muster oder ein erfolgreiches Sandbox-Experiment ist **kein Nachweis** für einen tatsächlich abgeschlossenen Vertrag, eine freigeschaltete Händlerfunktion, realen Bestand oder einen echten Versand. Keine Belege oder Freigaben erfinden. Bis zur Prüfung der Pflichtnachweise bleibt `SITE_LIVE_APPROVED=false`. Keine Zahlungen, Kundenmails, Lieferantenbestellungen oder Tarifwechsel zur Beweiserhebung auslösen.

## Statuslegende
- **Bestätigt:** durch genannten projektinternen Befund nachvollziehbar; keine weitergehenden Zusagen.
- **Offen:** Beleg erforderlich. Eine Aussage im Rechtstext ist nicht automatisch ein solcher Beleg.
- **Nicht anwendbar:** nur nach dokumentierter fachlicher Entscheidung und Begründung.

| Thema | Status 20.11.2026 | Bereits nachvollziehbar | Erforderlicher Beleg vor Produktivverkauf |
| --- | --- | --- | --- |
| Bestellkanal SECPLAN | **Bestätigt (nur Kanalwahl)** | Manuelle Bearbeitung über https://www.secplan.de/account/login seit 14.11.2026 vom Betreiber festgelegt; Link im geschützten Bestellbereich; Öffnen darf keinen Status ändern | Nicht erneut nach Portal/E-Mail fragen |
| SECPLAN Händlerzugang | **Offen** | Öffentliche Portal-Loginseite | Händlerkonto-Berechtigung und konkrete Lieferadresse-im-Namen-des-Händlers-/Direktversandfunktion; Vertrags-/Konditionenbestätigung ohne Zugangsdaten in GitHub |
| Lieferantenauftrag | **Offen** | Keine automatische Übermittlung; manuelle Übergabe | Test eines freigegebenen echten Ablaufs nur mit gesonderter Freigabe, Annahmebestätigung und Zuordnung zum Auftrag; niemals aus dieser Prüfung heraus kaufen |
| Bestände / Lieferzeiten | **Offen** | Einmalige kaufmännische Bestätigung vom 15.11.2026, nicht Live-Warenbestand | Artikelbezogene aktuelle Lieferbarkeit und belastbare Versandfristen; Prüfdaten/Fristen festhalten |
| Verpackung / WEEE / Batterie | **Offen** | Direktversandmodell dokumentiert | Wer ist Erstinverkehrbringer, Hersteller/Importeur bzw. Versandverpackungsverantwortlicher? Schriftlicher Rollenabgleich, erforderliche LUCID-/Systembeteiligungs-, ear-/Batterienachweise nach Produktart |
| Produktsicherheit / GPSR | **Offen pro SKU** | Artikelnummer, Produktbild, Katalogdaten, technische Hinweise teils vorhanden | Herstellerfirma, **Postanschrift und elektronische Kontaktadresse**, bei Nicht-EU-Hersteller erforderliche EU-Verantwortlichenangaben, Modell-/Typidentifikation, deutsche Sicherheitshinweise, CE-/Konformitäts-/WEEE-Angaben soweit einschlägig, belegte Zuordnung SKU -> Quelle und Änderungsdatum |
| Impressum | **Teilweise** | Firma, Anschrift, Kontakt, HRB, USt-ID im Repository | Firma/Register/USt-ID/Vertretung mit aktuellen Originalunterlagen abgleichen; rechtliche Endprüfung |
| AGB, Widerruf, Versand | **Teilweise** | B2C/B2B-Text, Widerrufsformular, 9,90 € DE-Versand und Händler-Verantwortung im Repository | Verbraucherrechtliche Endprüfung, tatsächliche Lieferzeiten, gesonderte Montagevereinbarungen |
| Hosting Vercel | **Offen** | Produktionsprojekt erreichbar; Deploymentstatus READY am 20.11. | Gewerblich zulässiger Tarif, Rechnung/Konto- und Vertragsnachweis; keine automatische kostenpflichtige Umstellung |
| Datenschutz Vercel | **Offen** | Hosting und mögliche Zugriffsdaten in Datenschutzerklärung erwähnt | Geltende DPA/AVV, Unterauftragsverarbeiter, Regionen/Transfergrundlage, reale Log-Aufbewahrung und Löschprozess |
| Datenschutz Supabase | **Teilweise** | Projekt `uotcoobumftugaprnhso` am 20.11. ACTIVE_HEALTHY, eu-west-1 | tatsächlich geltender DPA/AVV, Backup-/Log-Speicherdauer, Zugriffsrollen, Lösch-/Exportverfahren, Unterauftragsverarbeiter und mögliche Transfers; Region allein genügt nicht |
| Datenschutz Stripe | **Teilweise** | Erfolgreiche B2C/B2B-Sandboxabnahme SN-B-13/14; Webhook- und Rechnungs-Idempotenz | Vertragliche Rollen, Datenverarbeitungsbedingungen, Transfermechanismen, Speicher- und Löschfristen, Live-Kontoberechtigung separat nachweisen |
| Datenschutz Resend | **Teilweise** | Sandbox-E-Mails und ausschließlich interne Testrechnungen als delivered | DPA/AVV je Rollenverhältnis, Mailinhalts-/Zustellprotokoll-Aufbewahrung, Unterauftragsverarbeiter und mögliche Transfers |
| SECPLAN als Datenempfänger | **Offen** | Übermittlungsentwurf beschränkt Felder; manuelles Dropshipping | Rollenbestimmung: eigenständiger Verantwortlicher/Auftragsverarbeiter, Vertragsgrundlage, Empfängerkategorien, konkrete Feldliste, Retention, Sicherheitsmaßnahmen |
| Löschkonzept | **Offen** | 10-Minuten-Zeitfenster für serverseitige Ratelimits; 30-Tage-Referral-Einwilligung im Browser beschrieben | Datenkategorien (Bestellungen, Rechnungen, Mail-Logs, Logs, Support, Widerruf, VP), Rechtsgrundlage und gesetzliche Aufbewahrung je Kategorie; echte Retentions- und Löschjobs prüfen |
| Drittlandübermittlung | **Offen** | Keine pauschale Zusage „alles EU“ | Für **jeden** Dienst: Empfängerland, Transfergrundlage/Angemessenheit/SCC plus gegebenenfalls zusätzliche Maßnahmen, Unterauftragsverarbeiter und aktuelle Dokumente |
| Checkout Live-Gate | **Offen bis Merge/READY** | PR #21 enthält serverseitige Prüfung `SITE_LIVE_APPROVED`; Produktionsvariable derzeit false | CI/Preview prüfen, Korrektur gezielt mergen/deployen und produktive Sperrwirkung sicher nachweisen |
| Stripe Ablehnungs-/Abbruchfälle | **Offen** | Erfolgreiche Sandbox SN-B-13/14, Original-Webhooks einmalig, Replay idempotent | Negative Browser-Szenarien, asynchrone Sonderfälle und weitere Wiederanläufe **nur** im ausdrücklich autorisierten Testmodus |
| Sandbox-Abnahme | **Bestätigt für den genannten Umfang** | SN-B-13 (B2C) und SN-B-14 (B2B) test/paid, nur simulierte Lieferanten-/Rechnungsfolge, keine echten Bestellungen; Testnummern separiert | Nicht als offenen Erfolgstest führen. `SN_SANDBOX_ACCEPTANCE` disabled lassen |

## Nachweiserfassung ohne Zugangsdaten

Für jeden offenen Posten intern eintragen:
- Dokumentname und eindeutige Version, Vertragspartei, Vertragsdatum, Gültigkeit und zuständige prüfende Person.
- Verifizierbare Fundstelle **im geschützten** Firmenablagesystem, niemals geheime Zugangsdaten, Kundendaten, Tokens oder Verträge im öffentlichen Repository.
- Welche konkreten Datenkategorien betroffen sind, Rechtsgrundlagen, Empfängerrolle, Transfers und Aufbewahrungs-/Löschfristen.
- SKU-bezogene Sicherheitsnachweise je Produkt: Hersteller, postalische und elektronische Adresse, EU-Verantwortlicher falls nötig, Warnhinweise und offizielle Dokument-URL mit Versions-/Prüfdatum.
- Ergebnis: bestätigt / abgelehnt / offen; Datum und verantwortliche prüfende Person. Fehlt ein Beleg, Status offen.

## Verbot von Scheinbelegen
- Vercel-/Stripe-/Supabase-/Resend-Standardseiten sind Hilfsquellen, **keine Bestätigung**, dass ein individueller Vertrag akzeptiert wurde.
- Öffentliche SECPLAN-Loginseite bestätigt **nicht** die Händlerfreischaltung.
- Ein bestätigter Stripe-Zahlungseingang bestätigt **nicht** die Annahme durch den Lieferanten, echten Versand, Lagerbestand oder korrekte Produktkennzeichnung.
- Der Anbieter kann über jede Auftragsverarbeitung je nach Dienst unterschiedliche rechtliche Rollen haben. Eine pauschale AVV-Pflicht für ausnahmslos jeden Dienst darf nicht unterstellt werden.
- Vercel Hobby ist nach Anbieterbedingungen für persönliche, nichtkommerzielle Nutzung. Vor einem kommerziellen Echtverkauf ist ein erlaubter Tarif nachzuweisen, **ohne automatisch umzubuchen**.

## Prüfreihenfolge bis Go-live
1. PR #21 erfolgreich testen und Produktionssperre nach Veröffentlichung verifizieren. Keine Freigabevariablen verändern.
2. Anbieter-Verträge, aktuelle Subprozessoren/Transfers/Fristen sowie internes Lösch- und Berechtigungskonzept sichern und abgleichen.
3. Lieferantenkonto, Direktversandbedingungen, Verpackungs-/WEEE-Rollen und SKU-Sicherheitsangaben anhand von Originalbelegen prüfen.
4. Rechtstexte an **tatsächlich** dokumentierte Prozesse angleichen; fachlich abnehmen.
5. Vor separater Live-Freigabe abschließende technische Negativtests und Produktionskonfiguration prüfen.

## Öffentliche maßgebliche Quellen (nicht Vertragsnachweise)
- DSGVO Informationspflichten: https://www.bfdi.bund.de/SharedDocs/Downloads/DE/Broschueren/INFO5.pdf
- EU-Kommission zur GPSR / Fernabsatz: https://eur-lex.europa.eu/eli/C/2025/6233/oj
- Vercel Nutzungsbedingungen: https://vercel.com/legal/terms
- Vercel Tarife: https://vercel.com/pricing
