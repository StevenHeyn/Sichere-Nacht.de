-- Supplier prices transcribed from the operator-provided flyer screenshots (net EUR).
-- All newly offered retail net prices = supplier net price x 1.20, rounded to cents.
-- Gross total = retail net x 1.19, rounded to cents.
-- Keep the existing 1,000-piece tier unchanged and never reprice historical orders.
alter table public.vp_merch_orders
  drop constraint if exists vp_merch_orders_quantity_check;
alter table public.vp_merch_orders
  add constraint vp_merch_orders_quantity_check check(quantity between 1 and 55000);

update public.vp_merch_products
set description = 'Personalisierte DIN-A5-Flyer (148 × 210 mm), 250 g/m² Papier, mit deinem eigenen Empfehlungs-QR. Staffelpreise netto zuzüglich 19 % MwSt.; der angezeigte Gesamtbetrag enthält die MwSt. und Standardversand innerhalb Deutschlands. Vor Produktion ist die persönliche Druckansicht freizugeben.',
    price_options = (
      select jsonb_agg(v.value order by (v.value->>'quantity')::integer)
      from (
        select jsonb_build_object('quantity',1000,'net_cents',4215,'total_cents',5016) as value
        union all
        select value from jsonb_array_elements('[{"quantity":1500,"net_cents":5622,"total_cents":6690},{"quantity":2000,"net_cents":6451,"total_cents":7677},{"quantity":2500,"net_cents":7212,"total_cents":8582},{"quantity":3000,"net_cents":8225,"total_cents":9788},{"quantity":3500,"net_cents":9238,"total_cents":10993},{"quantity":4000,"net_cents":10350,"total_cents":12317},{"quantity":4500,"net_cents":11362,"total_cents":13521},{"quantity":5000,"net_cents":12402,"total_cents":14758},{"quantity":6000,"net_cents":13913,"total_cents":16556},{"quantity":7000,"net_cents":15445,"total_cents":18380},{"quantity":7500,"net_cents":17029,"total_cents":20265},{"quantity":8000,"net_cents":18763,"total_cents":22328},{"quantity":9000,"net_cents":20578,"total_cents":24488},{"quantity":10000,"net_cents":22390,"total_cents":26644},{"quantity":12500,"net_cents":27260,"total_cents":32439},{"quantity":15000,"net_cents":32022,"total_cents":38106},{"quantity":17500,"net_cents":36854,"total_cents":43856},{"quantity":20000,"net_cents":40316,"total_cents":47976},{"quantity":25000,"net_cents":45700,"total_cents":54383},{"quantity":30000,"net_cents":54512,"total_cents":64869},{"quantity":35000,"net_cents":63790,"total_cents":75910},{"quantity":40000,"net_cents":72500,"total_cents":86275},{"quantity":45000,"net_cents":81310,"total_cents":96759},{"quantity":50000,"net_cents":90019,"total_cents":107123},{"quantity":55000,"net_cents":110296,"total_cents":131252}]'::jsonb)
      ) as v
    )
where id = 'qr-flyer';
