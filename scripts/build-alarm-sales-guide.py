from pathlib import Path
from svglib.svglib import svg2rlg
from reportlab.graphics import renderPDF
from reportlab.pdfgen import canvas
from reportlab.platypus import SimpleDocTemplate,Paragraph,Spacer,PageBreak,Table,TableStyle,KeepTogether
from reportlab.lib.styles import getSampleStyleSheet,ParagraphStyle
from reportlab.lib.colors import HexColor
from reportlab.lib.enums import TA_LEFT
from reportlab.pdfbase import pdfmetrics
from reportlab.pdfbase.ttfonts import TTFont
from reportlab.lib.utils import simpleSplit
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'partner-portal/assets/training/verkaufsleitfaden.pdf'
FONT='/usr/share/fonts/truetype/dejavu/'
pdfmetrics.registerFont(TTFont('Guide',FONT+'DejaVuSans.ttf'))
pdfmetrics.registerFont(TTFont('GuideBold',FONT+'DejaVuSans-Bold.ttf'))
pdfmetrics.registerFontFamily('Guide',normal='Guide',bold='GuideBold',italic='Guide',boldItalic='GuideBold')
navy=HexColor('#081324');mint=HexColor('#8ce6c9');gray=HexColor('#486070')
styles={
 'title':ParagraphStyle('title',fontName='GuideBold',fontSize=23,leading=27,textColor=navy,spaceAfter=10),
 'h':ParagraphStyle('h',fontName='GuideBold',fontSize=12,leading=16,textColor=navy,spaceBefore=9,spaceAfter=4),
 'p':ParagraphStyle('p',fontName='Guide',fontSize=9.5,leading=13,textColor=navy,spaceAfter=6),
 'small':ParagraphStyle('small',fontName='Guide',fontSize=8.3,leading=12,textColor=gray,spaceAfter=6),
 'q':ParagraphStyle('q',fontName='Guide',fontSize=10,leading=14,textColor=navy,spaceAfter=0),
}
story=[]
def p(t,kind='p'):story.append(Paragraph(t,styles[kind]))
def h(t):p(t,'h')
def quote(t):
 box=Table([[Paragraph(t,styles['q'])]],colWidths=[475]);box.setStyle(TableStyle([('BACKGROUND',(0,0),(-1,-1),HexColor('#e9f7f3')),('BOX',(0,0),(-1,-1),.6,mint),('LEFTPADDING',(0,0),(-1,-1),14),('RIGHTPADDING',(0,0),(-1,-1),14),('TOPPADDING',(0,0),(-1,-1),12),('BOTTOMPADDING',(0,0),(-1,-1),12)]));story.extend([box,Spacer(1,10)])
def page(k,title):
 if story:story.append(PageBreak())
 p(k.upper(),'small');p(title,'title')
def bullet(t):p('• '+t)
page('01 · Einstieg an der Haustür','Verkaufsleitfaden')
p('Verkaufsleitfaden Alarmanlagen | sichere-nacht.de<br/><b>Für Vertriebspartner · Version 1.0 · 15.11.2026</b>','small')
p('Ziel ist ein passendes, freiwilliges Beratungsgespräch. Ein Termin oder eine höflich beendete Ansprache ist ebenfalls ein gutes Ergebnis. „Nachhaltig verkaufen“ bedeutet hier: Bedarf verstehen, belastbar erklären und Zusagen einhalten.')
h('Der 20-Sekunden-Pitch')
quote('„Guten Tag, ich bin [Name], Vertriebspartner von sichere-nacht.de. Ich berate zu Alarmanlagen für Wohnungen und Häuser. Es geht um ein Verkaufsangebot. Darf ich Ihnen in 20 Sekunden erklären, wie Sie prüfen können, welche Absicherung zu Ihrem Zuhause passt?“')
p('Nach einem Ja: „Eine Alarmanlage kann erkannte Ereignisse melden und vorhandene Tür- und Fenstersicherungen ergänzen. Was wäre Ihnen wichtiger: eine einfache Bedienung im Alltag oder eine Meldung, wenn Sie unterwegs sind?“')
h('Vom Interesse zum Beratungstisch')
quote('„Wenn Sie möchten, schauen wir uns in etwa zehn Minuten Ihre Anforderungen und eine erste Konfiguration an - ohne Verpflichtung. Passt das jetzt, oder ist Ihnen ein vereinbarter Termin lieber?“')
p('Erst nach einer ausdrücklichen Einladung eintreten. Nicht an der Tür vorbeigehen, keine Räume ungefragt betreten. Ein Gespräch an der Tür oder ein späterer Termin genügt.')
h('Drei kurze Reaktionen')
bullet('<b>Keine Zeit:</b> „Verstanden. Möchten Sie meine Karte mit dem Konfigurator mitnehmen?“ Nur bei Zustimmung übergeben.')
bullet('<b>Wer sind Sie?</b> Namen, Vertriebspartnerrolle und Anbieter nennen; Identität nachvollziehbar machen. Keine Nähe zu Polizei oder Versicherung behaupten.')
bullet('<b>Kein Interesse:</b> „Danke für die klare Rückmeldung. Einen schönen Tag.“ Gespräch beenden; keine weitere Einwandrunde.')
p('Keine erfundenen Einbrüche in der Nachbarschaft, keine angeblichen Pflichtprüfungen, keine vorgetäuschten Termine. Erkennbare Werbeablehnung und Hausrecht respektieren. [4]','small')
page('02 · Das Beratungsgespräch','Erst verstehen.<br/>Dann konfigurieren.')
h('Rahmen setzen · etwa 1 Minute')
quote('„Ich stelle zuerst ein paar Fragen. Danach zeige ich Ihnen eine passende Möglichkeit, erkläre die Grenzen und nenne die Kosten. Sie entscheiden anschließend in Ruhe, ob der Vorschlag für Sie passt.“')
h('Sieben Fragen, die eine Empfehlung tragen')
for t in [
'Was möchten Sie mit der Anlage erreichen - und was ist Ihnen daran besonders wichtig?',
'Geht es um eine Wohnung, ein Haus oder ein Gewerbeobjekt? Welche Zugänge sollen betrachtet werden?',
'Welche Tür- und Fenstersicherungen oder Alarmtechnik sind bereits vorhanden?',
'Wie soll die Anlage im Alltag genutzt werden? Wer soll sie bedienen können?',
'Gibt es Haustiere oder andere Besonderheiten, die bei der Melderauswahl berücksichtigt werden müssen?',
'Wer soll im Alarmfall benachrichtigt werden, und was soll diese Person dann tun?',
'Welcher Budgetrahmen ist vorgesehen, und wer soll bei der Entscheidung noch dabei sein?']:bullet(t)
p('Keine Abwesenheitspläne, Wertgegenstandslisten oder Zugangscodes sammeln. Grundriss, Fotos und Objektbesichtigung nur mit Zustimmung und nur soweit für die Planung nötig.')
h('Bedarf zusammenfassen · etwa 1 Minute')
quote('„Wenn ich Sie richtig verstanden habe, möchten Sie [Ziel], besonders an [Zugängen], und die Bedienung soll für [Nutzer] einfach sein. Ist das vollständig, oder fehlt etwas Wichtiges?“')
h('Lösung zeigen · etwa 5 Minuten')
p('Im Konfigurator die gewählte Gebäudeart und relevante Zugänge gemeinsam erfassen. Zu jedem vorgeschlagenen Bauteil erklären: Was erkennt es, wo wird es eingesetzt und warum ist es hier sinnvoll? Offene Montage- oder Funkfragen als prüfbedürftig markieren.')
p('Eine bedarfsgerechte Grundlösung und höchstens eine begründete Ergänzung vergleichen. Keine notwendige Absicherung weglassen, nur um einen niedrigen Einstiegspreis zu zeigen. Eine erste Konfiguration ersetzt keine technische Prüfung vor Ort.')
h('Einfache Demonstration')
p('Mit einem Demo-System einen Melder und eine Beispielmeldung erklären. Keine echten Kundendaten zeigen und keinen Alarm an einer Kundenanlage auslösen. Danach fragen: „Wäre diese Bedienung für Sie im Alltag verständlich?“')
page('03 · Tragfähige Verkaufsargumente','Nutzen erklären.<br/>Grenzen mitnennen.')
h('1. Ergänzende Absicherung')
p('<b>Gespräch:</b> „Gute Türen und Fenster bleiben wichtig. Eine passend geplante Alarmanlage ergänzt diese mechanische Sicherung um Erkennung und Alarmierung.“<br/><b>Grenze:</b> Keine Anlage garantiert, dass kein Einbruch stattfindet. [1]')
h('2. Eine verständliche Reaktion auf Ereignisse')
p('<b>Gespräch:</b> „Wir planen nicht nur die Melder, sondern auch: Wer erhält welche Meldung, und was passiert danach?“<br/><b>Prüfung:</b> Gewähltes System, Übertragungswege, App-Berechtigungen und tatsächlicher Empfang. Eine Meldung allein ist noch keine Intervention.')
h('3. Planung statt möglichst vieler Geräte')
p('<b>Gespräch:</b> „Sie sollen nachvollziehen können, warum jeder Melder im Angebot steht. Wir orientieren uns an Ihrem Objekt und Ihrer Nutzung.“<br/><b>Prüfung:</b> Montageort, Erfassungsbereich, Funkverbindung, Gerätekompatibilität und tägliche Bedienung.')
h('4. Fotoverifizierung als passende Option')
p('<b>Gespräch:</b> „Bei geeigneten Meldern und einer kompatiblen Zentrale können Alarmfotos helfen, ein Ereignis einzuordnen.“<br/><b>Grenze:</b> Nicht jeder Melder hat diese Funktion. Foto auf Anfrage ist bei MotionCam (PhOD) gesondert zu berechtigen; Bildzugriffe gemeinsam erklären. Kein pauschales Versprechen einer dauernden Videoüberwachung. [2]')
h('5. Langfristig nutzbare Planung')
p('<b>Gespräch:</b> „Wenn Sie später etwas ergänzen möchten, prüfen wir schon heute, welche Zentrale und welche Geräte dafür geeignet sind.“<br/><b>Grenze:</b> Erweiterbarkeit nur nach konkreter Kompatibilitäts- und Kapazitätsprüfung zusagen. Keine unbegrenzte Zukunftssicherheit oder unbelegte Umweltvorteile behaupten.')
h('6. Transparente Gesamtkosten')
p('<b>Gespräch:</b> „Sie bekommen nachvollziehbar aufgeführt, was zur Anlage gehört, welche Montage vorgesehen ist und welche möglichen laufenden Kosten entstehen.“<br/><b>Prüfung:</b> Aktuelle Shoppreise, Versand, Montageumfang und gegebenenfalls SIM-, Wartungs- oder Dienstleistungskosten getrennt ausweisen.')
p('Für sichere-nacht.de: Selbstmontage und verfügbare Montageleistung verständlich unterscheiden. Montagegebiet, Termin und Umfang vor Zusage prüfen. Die geplante Sicherheitsdienst-Kooperation ist derzeit kein zugesagter Leistungsbestandteil.','small')
page('04 · Einwände im Gespräch','Zuhören. Klären.<br/>Passend antworten.')
p('Einwandfolge: ausreden lassen → nachvollziehen → eine offene Frage → sachliche Antwort → Entscheidungsfreiheit lassen. Ein klares Nein ist keine Einladung zum Überreden.')
for title,answer in [
('„Das ist mir zu teuer.“','„Verstehe ich. Geht es um den Gesamtbetrag oder darum, dass der Nutzen noch nicht klar ist? Wir können die Positionen einzeln durchgehen und prüfen, was notwendig und was optional ist.“ Keine erfundenen Rabatte oder künstliche Frist anbieten.'),
('„Bei uns ist noch nie eingebrochen worden.“','„Das ist gut. Ob Sie zusätzliche Absicherung möchten, hängt von Ihrem Bedarf ab. Möchten Sie wissen, was technisch möglich wäre, oder ist das aktuell kein Thema?“ Keine örtliche Gefahr erfinden.'),
('„Ich habe schon eine Versicherung.“','„Dann sind die Bedingungen Ihres Vertrags eine gute Grundlage. Wir sollten nicht voraussetzen, dass eine Alarmanlage Ihren Beitrag senkt. Das kann nur Ihr Versicherer verbindlich bestätigen.“'),
('„Wir haben einen Hund.“','„Dann gehört das in die Planung. Wir prüfen geeignete Melder, Positionen und Einstellungen. Eine pauschale Zusage, dass es nie zu Fehlalarmen kommt, wäre unseriös.“'),
('„Ich möchte keine Kamera im Haus.“','„Das berücksichtigen wir. Wir prüfen eine Lösung ohne Bildfunktion. Wenn Sie Fotoverifizierung wünschen, erklären wir vorher genau, wann Bilder entstehen und wer sie sehen kann.“'),
('„Was ist bei Strom- oder Internetausfall?“','„Das hängt von der ausgewählten Zentrale, ihrer Notstromversorgung und den eingerichteten Übertragungswegen ab. Ich prüfe das konkrete Datenblatt und die vorgesehene Konfiguration, statt Ihnen pauschale Laufzeiten zu versprechen.“'),
('„Ich muss das mit meinem Partner besprechen.“','„Natürlich. Wollen wir einen gemeinsamen Termin vereinbaren, oder möchten Sie zunächst die Konfiguration mitnehmen?“ Kein Abschluss ohne die gewünschten Mitentscheider erzwingen.')]:
 h(title);p(answer)
p('<b>„Schicken Sie mir etwas“:</b> Inhalt und gewünschten Kontaktweg konkret vereinbaren. Eine übergebene Telefonnummer ist keine pauschale Zustimmung zu Werbeanrufen. [4]','small')
page('05 · Angebot und Abschluss','Ein klarer nächster Schritt.<br/>Kein Abschlussdruck.')
h('Vor dem Angebot')
bullet('Bedarf in den Worten des Kunden bestätigen; offene technische Fragen kenntlich machen.')
bullet('Produkte, Mengen, Funktionsumfang und Montageart nachvollziehbar benennen.')
bullet('Aktuellen Gesamtpreis einschließlich Umsatzsteuer, Versand und vereinbarter Zusatzleistungen zeigen; optionale und laufende Kosten getrennt erläutern.')
bullet('Lieferbarkeit, Montagegebiet und Termine prüfen. Keine Garantie, Zertifizierung, Förderung oder Versicherungsersparnis ohne belastbaren Nachweis nennen.')
h('Abschlussfrage')
quote('„Passt diese Zusammenstellung zu dem, was Ihnen wichtig ist? Wenn ja, gehen wir den Gesamtpreis und die Bestellunterlagen gemeinsam durch. Wenn noch etwas offen ist, klären wir das zuerst.“')
h('Wenn noch keine Entscheidung fällt')
quote('„Was brauchen Sie noch für eine gute Entscheidung? Ich kann Ihnen die besprochene Konfiguration über den von Ihnen gewünschten Weg bereitstellen. Möchten Sie danach selbst auf uns zukommen oder einen konkreten Rückruf vereinbaren?“')
p('Rückruf nur mit dokumentierter Zustimmung zu Zweck, Kontaktweg und vereinbartem Zeitpunkt. Keine zusätzlichen Werbekanäle voraussetzen. Einen abgelehnten Rückruf nicht erneut auslösen. [4]')
h('Haustürgeschäft und Verbraucherunterlagen')
p('Bei außerhalb von Geschäftsräumen geschlossenen Verbraucherverträgen besteht grundsätzlich ein Widerrufsrecht; die gesetzliche Regelfrist beträgt 14 Tage. Fristbeginn, Belehrung und Ausnahmen hängen vom Vertrag ab. Deshalb ausschließlich die dafür freigegebenen Bestellunterlagen und Abläufe verwenden. [3]')
p('Nicht behaupten, dass ein online angeklickter Abschluss während des Hausbesuchs diese Pflichten automatisch beseitigt. Einen vorzeitigen Montagebeginn nicht eigenmächtig zusagen. Vor Einsatz muss der Anbieter den Vertriebsprozess einschließlich der Vertragsunterlagen rechtlich prüfen lassen.')
h('Im Portal dokumentieren')
p('Nur tatsächlich besprochene Fakten erfassen: Bearbeitungsstatus, Gebäudetyp, relevante Anforderungen, vereinbarter nächster Schritt sowie erforderliche Kontaktfreigaben. Keine Gesundheits-, Vermögens- oder Abwesenheitsprofile. Keine Unterschrift, Zustimmung oder Bestellung für den Kunden simulieren.')
page('06 · Praxisblatt','Der Ablauf auf einen Blick.')
for title,body in [
('1 · Vor dem Klingeln','Werbeablehnung beachten. Eigene Identität und Rolle klar. Karte, Konfigurator und aktuelle Angebotsinformationen griffbereit.'),
('2 · Erlaubnis holen','„Darf ich Ihnen in 20 Sekunden erklären, worum es geht?“ Ein Nein beendet den Versuch.'),
('3 · Relevanz klären','Eine offene Frage zu gewünschter Absicherung oder Bedienung stellen; keine Bedrohung inszenieren.'),
('4 · Einladung statt Eindringen','„Passt ein kurzes Gespräch jetzt, oder lieber ein Termin?“ Nur nach ausdrücklicher Einladung eintreten.'),
('5 · Bedarf und Lösung verbinden','Gebäude, Zugänge, Nutzer, Haustiere, Alarmreaktion und Budget besprechen. Anforderungen zusammenfassen.'),
('6 · Kosten und Grenzen nennen','Positionen erklären, offene Prüfungen notieren, keine nicht bestätigten Leistungen verkaufen.'),
('7 · Freiwilligen nächsten Schritt vereinbaren','Angebot, Termin oder Bestellung mit korrekten Unterlagen. Kontaktaufnahme nur wie vereinbart.')]:h(title);p(body)
h('Training zu zweit · 12 Minuten')
p('Runde 1: 20-Sekunden-Pitch und ein Nein respektvoll beenden. Runde 2: Interessierter Kunde mit Haustier und kleinem Budget. Runde 3: Einwand „zu teuer“ und freiwilligen nächsten Schritt vereinbaren. Danach Rollen tauschen.')
p('<b>Bewertung:</b> War die Verkaufsabsicht klar? Wurde zugehört? War die Empfehlung aus dem Bedarf ableitbar? Wurden Grenzen und Kosten genannt? War ein Nein jederzeit möglich? Jeder Punkt 0 oder 1; anschließend den schwächsten Punkt erneut üben.')
p('<b>Erfolg messen:</b> qualifizierte Gespräche, eingehaltene Termine, nachvollziehbare Angebote, Rückfragen, Stornos und Kundenzufriedenheit. Reine Klingel- oder Abschlusszahlen sagen wenig über Beratungsqualität aus.','small')
page('07 · Quellen und Verwendung','Faktenbasis<br/>und Aktualisierung.')
p('Die Gesprächsformulierungen sind eigens für sichere-nacht.de erstellt. Sie sind keine Abschlussgarantie. „Sicherheitsberater“ bezeichnet hier die Tätigkeit im Vertrieb und belegt keine besondere Zertifizierung. Produktmerkmale und Vertragsabläufe vor jeder verbindlichen Zusage aktuell prüfen.')
for label,url,note in [
('[1] Polizeiliche Kriminalprävention: Technische Sicherheit','https://www.polizei-beratung.de/themen-und-tipps/einbruch/technische-sicherheit/','Mechanische Sicherung und ergänzende Alarmtechnik. Abruf: 15.11.2026.'),
('[2] Ajax: MotionCam (PhOD) Jeweller, Herstellerhandbuch','https://media.secplan.de/public/media/ee/c0/8e/1718083404/benutzerhandbuch-motioncam-phod-jeweller-ajax-systems-support.pdf','Herstellerdokument über SECPLAN, Dokumentstand 25.07.2023. Nur für die hier genannten Grundfunktionen verwendet; aktuelle Geräte- und Firmwarekompatibilität gesondert prüfen.'),
('[3] BGB: §§ 312b, 312g, 355 und 356','https://www.gesetze-im-internet.de/bgb/__312g.html','Außerhalb von Geschäftsräumen geschlossene Verträge, Widerrufsrecht und Fristen. Gesetzestexte am 15.11.2026 recherchiert.'),
('§ 355 BGB','https://www.gesetze-im-internet.de/bgb/__355.html','Gesetzliche Regelfrist und Widerrufserklärung.'),
('§ 356 BGB','https://www.gesetze-im-internet.de/bgb/__356.html','Besondere Regeln zum Beginn und Erlöschen des Widerrufsrechts.'),
('[4] UWG: §§ 7 und 7a','https://www.gesetze-im-internet.de/uwg_2004/__7.html','Werbeablehnung sowie Anforderungen an Telefon- und elektronische Werbung.'),
('Bundesnetzagentur: Telefonwerbung','https://www.bundesnetzagentur.de/DE/Fachthemen/Telekommunikation/Unternehmenspflichten/Telefonwerbung/start.html','Einwilligung und Dokumentation bei Telefonwerbung. Abruf: 15.11.2026.')]:
 h(label);p(note,'small');p(f'<link href="{url}" color="#16705d">Quelle öffnen</link>','small')
h('Pflege im Partnerportal')
p('Leitfaden bei Änderungen an Sortiment, Montageangebot, Bestellprozess oder Rechtslage aktualisieren. Dieser Leitfaden ersetzt keine technische Installationsschulung und keine geprüften Vertragsunterlagen. Preise und Provisionssätze sind bewusst nicht Bestandteil des Kundengesprächsleitfadens.')
def furniture(c,doc):
 c.setFillColor(navy);c.rect(0,808,595.28,34,fill=1,stroke=0);c.setFillColor(mint);c.setFont('GuideBold',9);logo=svg2rlg(str(ROOT/'public/sichere-nacht-logo.svg'));logo.scale(21/80,23/88);renderPDF.draw(logo,c,48,812);c.drawString(78,821,'SICHERE NACHT  /  PARTNER-AKADEMIE');c.setStrokeColor(mint);c.line(48,42,547,42);c.setFont('Guide',8);c.setFillColor(gray);c.drawString(48,28,'Verkaufsleitfaden Alarmanlagen · v1.0 · 15.11.2026');c.drawRightString(547,28,str(doc.page))
OUT.parent.mkdir(parents=True,exist_ok=True)
SimpleDocTemplate(str(OUT),pagesize=(595.28,841.89),rightMargin=60,leftMargin=60,topMargin=57,bottomMargin=54,title='Verkaufsleitfaden',author='sichere-nacht.de').build(story,onFirstPage=furniture,onLaterPages=furniture)
print(OUT)
