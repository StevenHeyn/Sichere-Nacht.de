-- Calculation verified 2026-11-16, EUR net, first pooled batch of TWO sets:
-- 1 winter jacket #65638 104.90 (124.83 gross)
-- 1 softshell jacket #65562 56.90 (67.71 gross)
-- 3 cotton polos #89901 at 15.90 = 47.70 (18.92 gross each; six polos in batch)
-- 1 poly-cotton sweatshirt #89331 20.90 (24.87 gross)
-- Clothing per set: 230.40.
-- 6 white transfers <=600 cm2 at 12.15 = 72.90 (12 identical prints in batch).
-- Artwork 49.90 + one screen 24.90, shared equally: 37.40 per set.
-- Cost 340.70 + 20% MARKUP 68.14 = 408.84 net; VAT 77.68; gross 486.52.
-- Retail policy updated by user: individual sets can be ordered immediately at 408.84 net.
-- Supplier batching and setup allocation are internal procurement assumptions, not a customer minimum.
-- Do not apply the 10-print rate to a standalone six-print order.
-- Sources (live pages, not stale search snippets):
-- https://www.strauss.com/de/de/winter-arbeitsjacken/winter-softshelljacke-e-s-motion-2020-herren-3130980-65638-962.html
-- https://www.strauss.com/de/de/arbeits-softshelljacken/softshelljacke-e-s-motion-2020-3130390-65562-1.html
-- https://www.strauss.com/de/de/arbeits-polo-shirts/e-s-polo-shirt-cotton-3100690-89901-1.html
-- https://www.strauss.com/de/de/sweats-hoodies/e-s-sweatshirt-poly-cotton-3100070-89331-1.html
-- https://www.strauss.com/de/de/Service/Logoservice/Transferdruck

-- Six-piece Strauss set. Catalog text contains the NET reference price.
-- Current retail price includes standard delivery in Germany and all six back prints.
-- Individual online checkout collects and freezes each garment size.
-- Existing generic clothing requests and historical quotes remain unchanged.
-- Catalog presentation and user-authorized single-set retail policy.
-- Preserve all historical requests, quotes and payment amounts.
update public.vp_merch_products set active=false where id='team-clothing';
update public.vp_merch_products set description='500 Visitenkarten · 85 × 55 mm
Beidseitig farbig · 350 g/m² matt
Deine Kontaktdaten und dein persönlicher Empfehlungs-QR
Persönliche Druckansicht vor Produktion zur Freigabe
Standardversand Deutschland inklusive' where id='business-card';
update public.vp_merch_products set description='1.000 Flyer · DIN A5 (148 × 210 mm)
250 g/m² Papier
Mit deinem persönlichen Empfehlungs-QR
Persönliche Druckansicht vor Produktion zur Freigabe
Standardversand Deutschland inklusive' where id='qr-flyer';
update public.vp_merch_products set
 title='Strauss-Arbeitskleidungsset · 6 Teile',description='1 × Winter Softshelljacke e.s.motion 2020 · schwarz/platin
1 × Softshelljacke e.s.motion 2020 · schwarz
3 × e.s. Polo-Shirt cotton · schwarz
1 × e.s. Sweatshirt poly cotton · Rundhals, schwarz
Weißes Sichere-Nacht-Logo auf dem Rücken aller sechs Teile
Bereits ab 1 Set bestellbar · Größen je Kleidungsart wählbar
Standardversand innerhalb Deutschlands inklusive
Druckansicht zur Freigabe; Liefertermin wird separat bestätigt',active=true,
 price_options='[{"quantity":1,"net_cents":40884,"total_cents":48652}]'::jsonb,
 image_path='/images/merch/strauss-arbeitskleidungsset.webp'
where id='strauss-workwear-set';
