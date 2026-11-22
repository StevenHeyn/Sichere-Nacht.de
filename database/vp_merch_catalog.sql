-- Published product catalog. Existing order and quote totals remain unchanged.
alter table public.vp_merch_products
  add column if not exists price_options jsonb not null default '[]'::jsonb
    check (jsonb_typeof(price_options) = 'array'),
  add column if not exists image_path text;

update public.vp_merch_products set
  title = 'Visitenkarten',
  description = 'Visitenkarten mit deinen Kontaktdaten und persönlichem Empfehlungs-QR. 85 × 55 mm, beidseitig farbig, 350 g/m² matt. Paketpreise inklusive 19 % MwSt. und Standardversand innerhalb Deutschlands. Ohne Express und zusätzliche Druckdatenprüfung. Vor Produktion ist die persönliche Druckansicht freizugeben.',
  price_options = '[{"quantity":500,"total_cents":2444},{"quantity":100,"total_cents":1163},{"quantity":250,"total_cents":1549}]'::jsonb,
  image_path = '/images/merch/visitenkarten-vorschau.png'
where id = 'business-card';

update public.vp_merch_products set
  title = 'DIN-A5-Flyer',
  description = '1.000 personalisierte Flyer im Format DIN A5 (148 × 210 mm), 250 g/m² Papier, mit deinem eigenen Empfehlungs-QR. Paketpreis inklusive 19 % MwSt. und Standardversand innerhalb Deutschlands. Vor Produktion ist die persönliche Druckansicht freizugeben.',
  price_options = '[{"quantity":1000,"total_cents":4215}]'::jsonb,
  image_path = '/images/merch/flyer-din-a5-vorschau.png'
where id = 'qr-flyer';
