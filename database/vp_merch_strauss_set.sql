-- Calculation verified 2026-11-16, EUR net, first pooled batch of TWO sets:
-- 1 winter jacket #65638 104.90 (124.83 gross)
-- 1 softshell jacket #65562 56.90 (67.71 gross)
-- 3 cotton polos #89901 at 15.90 = 47.70 (18.92 gross each; six polos in batch)
-- 1 poly-cotton sweatshirt #89331 20.90 (24.87 gross)
-- Clothing per set: 230.40.
-- 6 white transfers <=600 cm2 at 12.15 = 72.90 (12 identical prints in batch).
-- Artwork 49.90 + one screen 24.90, shared equally: 37.40 per set.
-- Cost 340.70 + 20% MARKUP 68.14 = 408.84 net; VAT 77.68; gross 486.52.
-- This is a conditional quotation reference, not a confirmed supplier order.
-- Do not apply the 10-print rate to a standalone six-print order.
-- Sources (live pages, not stale search snippets):
-- https://www.strauss.com/de/de/winter-arbeitsjacken/winter-softshelljacke-e-s-motion-2020-herren-3130980-65638-962.html
-- https://www.strauss.com/de/de/arbeits-softshelljacken/softshelljacke-e-s-motion-2020-3130390-65562-1.html
-- https://www.strauss.com/de/de/arbeits-polo-shirts/e-s-polo-shirt-cotton-3100690-89901-1.html
-- https://www.strauss.com/de/de/sweats-hoodies/e-s-sweatshirt-poly-cotton-3100070-89331-1.html
-- https://www.strauss.com/de/de/Service/Logoservice/Transferdruck

-- Six-piece Strauss set. Catalog text contains the NET reference price.
-- Keep price_options empty: batch size, sizes and freight need a confirmed quote.
-- Do not enable immediate checkout for a conditional pooled-production price.
-- Existing generic clothing requests and historical quotes remain unchanged.
insert into public.vp_merch_products (id,title,description,kind,active,price_options,image_path)
values ('strauss-workwear-set','Strauss-Arbeitskleidungsset · 6 Teile','408,84 € netto pro Set zzgl. 19 % MwSt. (486,52 € brutto), inkl. Rückendruck und anteiliger Einrichtung. Enthalten: 1 × Winter Softshelljacke e.s.motion 2020, Herren, schwarz/platin (Art. 65638); 1 × Softshelljacke e.s.motion 2020, schwarz (Art. 65562); 3 × e.s. Polo-Shirt cotton, schwarz (Art. 89901); 1 × e.s. Sweatshirt poly cotton mit Rundhals, schwarz (Art. 89331). Alle sechs Teile mit dem Sichere-Nacht-Logo als einfarbig weißem Transferdruck mittig auf dem Rücken, maximal 600 cm² je Motiv. Preisbasis: gemeinsame Erstproduktion von zwei Sets mit identischem Motiv und identischer Druckgröße; Strauss-Mindestmenge zehn Drucke, hier zwölf Drucke. Du kannst ein einzelnes Set anfragen; produziert wird, sobald insgesamt zwei Sets zusammenkommen und das Angebot bestätigt ist. Eine Mengenangabe von 1 entspricht einem vollständigen Set. Größen und Verfügbarkeit werden vor der Bestellung bestätigt; abweichende Größen je Teil sind im Angebot abzustimmen. Druckansicht vor Produktion zur Freigabe. Lieferzeit voraussichtlich 2–3 Wochen ab vollständiger Sammelbestellung und Druckfreigabe. Versandkosten werden im Angebot ausgewiesen. Preisstand 16.11.2026.','clothing',true,'[]'::jsonb,null)
on conflict (id) do update set title=excluded.title,description=excluded.description,
kind=excluded.kind,active=excluded.active,price_options=excluded.price_options;
