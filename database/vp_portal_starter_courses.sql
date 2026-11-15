-- Idempotent operational onboarding materials; no invented dates or certificates.
insert into public.vp_courses(title,body,masterclass,published)
select v.title,v.body,false,true from (values
('Start als Sichere-Nacht-Vertriebspartner', $body$1. Eigenes Konto erstellen und E-Mail bestätigen. Anschließend Name, Geschäftsadresse, Telefon und Konfektionsgröße ergänzen. Portrait und Gewerbenachweis als Bild oder PDF hochladen.

2. Die veröffentlichte VP-Vertragsfassung vollständig lesen und selbst akzeptieren. Die Zusammenarbeit beginnt erst nach interner Freischaltung. Eine Agentureinladung ersetzt weder deine Zustimmung noch die Prüfung.

3. Den persönlichen Empfehlungslink in der Übersicht kopieren oder den eigenen QR-Code herunterladen. Der Shop ordnet Empfehlungen nach Zustimmung im gleichen Browser zu. Ein Gerätewechsel oder gelöschte Browserdaten können die Zuordnung unterbrechen; deshalb keine geräteübergreifende Garantie versprechen.

4. Preise und Leistungen aus dem aktuellen Shop verwenden. Keine unbestätigten Rabatte, Liefertermine oder Sicherheitsgarantien zusagen. Montagewünsche und den tatsächlichen Bedarf aufnehmen und zur Prüfung weitergeben.

5. In der Akademie einen tatsächlich verfügbaren Termin buchen. Bei Verhinderung die Buchung rechtzeitig stornieren. Eine bestandene Monteur-Masterclass und die zusätzliche Adminfreigabe sind Voraussetzung für die Monteurrolle.$body$),
('D2D: Gebiet übernehmen und Kontakte sauber erfassen', $body$1. Ein freigegebenes Einsatzgebiet auswählen und reservieren. Reservierungen anderer Partner beachten. Adresspunkte aus der angeschlossenen Quelle laden; den angezeigten Importstand kontrollieren. Ein Adresspunkt sagt nichts Verlässliches über Bewohner oder Haushaltszahl aus.

2. Vor jedem Besuch den aktuellen Adressstatus und bestehende Sperren prüfen. Vor der Bearbeitung die Adresse für dich reservieren. Nur tatsächlich bekannte Haushaltszahlen eintragen.

3. Das Ergebnis mit dem passenden Status dokumentieren: nicht angetroffen, kein Interesse, Termin, qualifiziert oder Kunde. Ein ausdrücklicher Kontaktwiderspruch ist zu respektieren. Im Portal sperren „Kein Interesse“ und „Nicht erneut kontaktieren“ weitere Ansprache dauerhaft.

4. Namen, Telefonnummern, E-Mail-Adressen und Gesprächsnotizen ausschließlich im privaten Kontaktformular speichern. Öffentliche Gebietsbezeichnungen und gemeinsam sichtbare Adressdaten dürfen keine Bewohnerdaten enthalten. Private Kontakte sind ausschließlich für dich und die Administration sichtbar, auch deine Agentur erhält keinen Zugriff.

5. Den konkreten Kontaktwunsch, die erteilte Datenschutzinformation und eine sachlich passende Prüf-/Löschfrist dokumentieren. Telefon- und E-Mail-Freigaben nur bei tatsächlich vorliegendem, dokumentiertem Kontaktwunsch setzen. Frühere Angaben eines anderen Kontakts niemals übernehmen. Keine sensiblen Informationen oder Ausweiskopien zu Bewohnern hinterlegen.

6. Fehlzuordnungen, unberechtigte Zugriffe und widersprüchliche Sperren an die Administration melden. Das Portal erteilt keine Zutrittsrechte und ersetzt keine freigegebenen Einsatz- und Datenschutzhinweise.$body$),
('Provisionen, Agenturzuordnung und Werbemittel', $body$Die im Portal vorbereitete Provisionsstruktur beträgt 15 % für direkte Vertriebspartner und insgesamt 20 % auf Agenturebene. Bei einem Agentur-VP sind dessen 15 Prozentpunkte in den 20 % enthalten. Die Agentur erhält die Abrechnung und übernimmt die Weiterabrechnung an ihre VP.

Rechenbeispiel: 1.000 € freigegebener Nettowarenumsatz ergeben für einen direkten VP 150 € Provision. Bei der vorgesehenen Reserve von 5 % der Provision werden 7,50 € zurückbehalten und 142,50 € verbleiben vor einer gegebenenfalls gesonderten Umsatzsteuerbehandlung. Die Reserve wächst höchstens bis 2.500 €. Maßgeblich bleibt die tatsächlich vereinbarte Vertragsfassung.

Ein Abrechnungszeitraum ist ein vollständiger Kalendermonat. Der Monatsabschluss erfolgt zum Ende des Folgemonats nach Zahlungs- und Stornoprüfung. Testkäufe erzeugen keine Provision. Spätere Erstattungen erscheinen als nachvollziehbare Korrekturpositionen. Eine Reservefreigabe wird zwölf Kalendermonate nach dem letzten provisionsrelevanten Auftrag geprüft; im Portal verbuchte Auszahlungen ersetzen keinen Bankvorgang.

Für Flyer, Visitenkarten und Kleidung zunächst Menge und Ausführung anfragen. Der eigene Empfehlungslink wird der Anfrage zugeordnet. Das konkrete Angebot einschließlich Gesamtpreis, Ausführung und Lieferbedingungen prüfen und erst danach kostenpflichtig annehmen. Die Anfrage allein löst keinen Druckauftrag aus.$body$)
) v(title,body) where not exists(select 1 from public.vp_courses c where c.title=v.title);
