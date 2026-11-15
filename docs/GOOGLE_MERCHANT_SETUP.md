# Google product visibility

The production feed is `/feeds/google.xml`. It is dynamic and must not be cached:
expired availability evidence must stop publication. Preview environments return 404.

Production search indexing is separately enabled using `SEO_INDEXING_APPROVED=true`.
This does not assert legal approval or alter payment gates. Previews remain noindex.

## Implemented

- Reviewed product pages: Product/Offer markup with gross EUR price, valid GTIN,
  image, German shipping charge and breadcrumbs. Unreviewed products have no Offer.
- Product metadata includes the actual product name and sharing image.
- Canonical URLs allow Google to consolidate referral/query URLs; robots no longer
  prevents Google from reading their canonical tags. Internal routes remain excluded.
- Sitemap uses actual positive-price, reviewed catalog entries.
- Optional `GOOGLE_SITE_VERIFICATION` environment variable renders Google's meta tag.
- RSS feed exports only reviewed, priced, imaged, valid-GTIN products with fresh
  confirmed availability. No fake stock, reviews, delivery dates or identifiers.

## Availability confirmed by the merchant

On 2026-11-15 the merchant confirmed all 901 current catalog SKUs as deliverable
through the supplier in 2–4 working days. `lib/merchant-availability.json` records
that explicit SKU list and confirmation timestamp. `lib/availability.ts` treats
this as manually maintained availability until changed; it is not live inventory.
New SKUs are not automatically included. Remove a SKU from the confirmed list if
its delivery promise no longer holds. Timestamped warehouse evidence may still use
`validUntil` (maximum 24 hours) through the same helper.

Product pages, category listings and Google feed use the shared availability helper.
Technical review remains separate: unreviewed products stay inquiry-only, with no
Offer and no merchant feed item. Stock confirmation does not approve their sale.

## Remaining Merchant Center setup

Set up or access the merchant's own Google Merchant Center account, verify and claim
`sichere-nacht.de`, configure German shipping (9.90 EUR) and the actual returns policy,
then add the feed URL as a scheduled source and select free listings. No paid campaign
is authorized or enabled by this change. Google's review and inclusion are not guaranteed.
Confirm actual manufacturer/product safety data and distribution eligibility before
submission. This change does not supply missing compliance records.

Submit `https://sichere-nacht.de/sitemap.xml` in Search Console after property verification.
Validate a reviewed product URL in Google's Rich Results Test and URL Inspection.

Sources:
- https://developers.google.com/search/docs/appearance/structured-data/merchant-listing
- https://support.google.com/merchants/answer/7052112
- https://support.google.com/merchants/answer/6324448
- https://support.google.com/merchants/answer/11586344

Validation: `node --test scripts/merchant-test.mjs scripts/shop-quality-test.mjs`
and `npm run build`.
