# Stripe Checkout-Schreibtest ohne Zahlung

Start über `/admin/bestellungen`, mit bestehendem Admin-Zugriffsschlüssel. Der öffentliche Checkout und alle Verkaufsfreigaben müssen deaktiviert bleiben.

Der geschützte POST-Endpunkt `/api/admin/checkout-probe` verwendet den tatsächlichen Production-Schlüssel aus `STRIPE_SECRET_KEY`, nicht die Stripe-ChatGPT-Verbindung. Er erstellt eine Checkout-Session mit einem festen Katalogartikel, Deutschlandversand 9,90 EUR, inklusiven Preisen und aktivierter automatischer Steuerberechnung. Ein Kauf oder Zahlungsvorgang wird NICHT bestätigt. Es werden keine Kunden-, Karten- oder Kontodaten eingetragen.

Die Sitzung wird sofort per Stripe-API abgelaufen gesetzt, danach werden Status und Positionen inklusive Produkt-SKU gelesen. Weder Checkout-URL noch client_secret gelangen zum Browser. Wiederholungen im selben Fünf-Minuten-Fenster sind idempotent. Als Rückfallebene hat die Session eine kurze Ablaufzeit. Falls das sofortige Schließen oder eine Antwort nicht nachweisbar ist, zeigt die Oberfläche ausdrücklich einen fehlgeschlagenen/unvollständigen Prüflauf an.

Erfolg erfordert vier erfolgreiche Prüfschritte und den unabhängig abgefragten Status `expired` / `unpaid`. Ein erfolgreicher Test belegt Checkout-Schreib- und notwendige Leserechte, aber weder den endgültigen Steuerbetrag (ohne Lieferadresse), eine tatsächliche Zahlung, Webhook-Zustellung, Bestellpersistenz noch Mailversand.

Acht isolierte Tests prüfen Erfolgs- und Fehlerfälle ohne Stripe-Aufruf. Die Produktionsprüfung muss über den geschützten Adminbereich ausgelöst werden. Öffentliche Freigabeschalter werden nicht verändert.

Offizielle API-Referenz: https://docs.stripe.com/api/checkout/sessions/expire
