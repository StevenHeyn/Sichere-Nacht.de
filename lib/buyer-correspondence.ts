import {B2B_WITHDRAWAL_NOTE,B2C_WITHDRAWAL_NOTE,BUYER_PURPOSE_NOTE,documentedBuyerType,type BuyerRecord} from './buyer-policy';
export const CONSUMER_WITHDRAWAL_TEXT=`Widerrufsbelehrung für Verbraucher – Warenkauf bei Sichere Nacht
Stand: 13.11.2026

Diese Belehrung gilt für Verbraucher (§ 13 BGB). Für Käufe als Unternehmer (§ 14 BGB) wird kein freiwilliges Widerrufsrecht eingeräumt.

Widerrufsrecht
Sie haben das Recht, binnen vierzehn Tagen ohne Angabe von Gründen diesen Vertrag zu widerrufen.
Die Widerrufsfrist beträgt vierzehn Tage ab dem Tag, an dem Sie oder ein von Ihnen benannter Dritter, der nicht der Beförderer ist, die Waren in Besitz genommen haben bzw. hat. Bei mehreren getrennt gelieferten Waren einer einheitlichen Bestellung beginnt die Frist mit Erhalt der letzten Ware.
Um Ihr Widerrufsrecht auszuüben, müssen Sie uns (H & K Projekt UG (haftungsbeschränkt), Lehmkoppel 7, 25499 Tangstedt, Deutschland, Telefon +49 176 60826082, E-Mail bestellungen@sichere-nacht.de) mittels einer eindeutigen Erklärung (zum Beispiel Brief oder E-Mail) über Ihren Entschluss informieren. Sie können das beigefügte Muster-Widerrufsformular verwenden, das jedoch nicht vorgeschrieben ist.
Sie können Ihren Widerruf auch über https://sichere-nacht.de/widerruf-online erklären. Die Funktion „Vertrag widerrufen“ ist im Fußbereich der Website verlinkt. Sie überprüfen dort Ihre Angaben und übermitteln die Erklärung mit „Widerruf bestätigen“. Wir bestätigen den Eingang unverzüglich elektronisch.
Zur Wahrung der Frist reicht es aus, dass Sie die Mitteilung vor Ablauf der Widerrufsfrist absenden.

Folgen des Widerrufs
Wenn Sie diesen Vertrag widerrufen, zahlen wir Ihnen alle Zahlungen, die wir von Ihnen erhalten haben, einschließlich der Lieferkosten (mit Ausnahme zusätzlicher Kosten für eine andere als die von uns angebotene günstigste Standardlieferung), unverzüglich und spätestens binnen vierzehn Tagen ab dem Tag zurück, an dem Ihre Widerrufsmitteilung bei uns eingegangen ist.
Für die Rückzahlung verwenden wir dasselbe Zahlungsmittel wie bei der ursprünglichen Transaktion, sofern nicht ausdrücklich etwas anderes vereinbart wurde. Ihnen werden deswegen keine Entgelte berechnet.
Wir können die Rückzahlung verweigern, bis wir die Waren zurückerhalten haben oder bis Sie nachgewiesen haben, dass Sie die Waren zurückgesandt haben, je nachdem, welcher Zeitpunkt früher liegt.
Sie haben die Waren unverzüglich und jedenfalls spätestens binnen vierzehn Tagen ab dem Tag, an dem Sie uns über den Widerruf unterrichten, an H & K Projekt UG (haftungsbeschränkt), Lehmkoppel 7, 25499 Tangstedt, Deutschland, zurückzusenden oder zu übergeben. Die Frist ist gewahrt, wenn Sie die Waren vor Ablauf der vierzehn Tage absenden.
Sie tragen die unmittelbaren Kosten der Rücksendung der Waren.
Für einen etwaigen Wertverlust müssen Sie nur aufkommen, wenn dieser auf einen zur Prüfung der Beschaffenheit, Eigenschaften und Funktionsweise nicht notwendigen Umgang zurückzuführen ist.

Direktversand
SECPLAN versendet die Ware. Ihr Vertragspartner bleibt H & K Projekt UG. Die Rücksendeadresse oben bleibt maßgeblich; eine vorherige Genehmigung oder SECPLAN-RMA-Nummer ist keine Voraussetzung des Verbraucherwiderrufs.

Muster-Widerrufsformular
Wenn Sie den Vertrag widerrufen wollen, füllen Sie bitte dieses Formular aus und senden Sie es zurück:
An H & K Projekt UG (haftungsbeschränkt), Lehmkoppel 7, 25499 Tangstedt, E-Mail bestellungen@sichere-nacht.de
Hiermit widerrufe(n) ich/wir (*) den von mir/uns (*) abgeschlossenen Vertrag über den Kauf der folgenden Waren:
Waren: ___________________
Bestellt am (*) / erhalten am (*): ___________________
Name des/der Verbraucher(s): ___________________
Anschrift des/der Verbraucher(s): ___________________
Unterschrift (nur auf Papier): ___________________
Datum: ___________________
(*) Unzutreffendes streichen.
`;
export function buyerCorrespondence(row:Partial<BuyerRecord>):{notice:string;attachment:{filename:string;text:string}|null}{
 const type=documentedBuyerType(row);
 if(type==='b2b')return {notice:B2B_WITHDRAWAL_NOTE+' '+BUYER_PURPOSE_NOTE,attachment:{filename:'Unternehmenskauf-Sichere-Nacht.txt',text:'Unternehmenskauf bei Sichere Nacht\nUnternehmen: '+row.buyer_company+'\nErklärung erfasst: '+row.buyer_declared_at+'\nHinweisversion: '+row.buyer_policy_version+'\n\n'+B2B_WITHDRAWAL_NOTE+'\n'+BUYER_PURPOSE_NOTE+'\n\nVerkäufer und Ansprechpartner: H & K Projekt UG (haftungsbeschränkt), Lehmkoppel 7, 25499 Tangstedt, bestellungen@sichere-nacht.de.\n'}};
 if(type==='b2c')return {notice:B2C_WITHDRAWAL_NOTE+' Die Widerrufsbelehrung und das Musterformular sind dieser Bestätigung als Datei beigefügt.',attachment:{filename:'Widerrufsbelehrung-Sichere-Nacht.txt',text:CONSUMER_WITHDRAWAL_TEXT}};
 return {notice:'Die Kaufart wurde bei dieser älteren oder unvollständig zugeordneten Bestellung nicht erfasst. Bestehende gesetzliche Rechte bleiben unberührt. Eine Einstufung als Unternehmenskauf erfolgt nicht allein anhand einer Firmenadresse.',attachment:null};
}
