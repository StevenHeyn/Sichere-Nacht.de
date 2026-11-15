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

## Current blockers before Merchant Center submission

`lib/merchant-availability.json` is intentionally empty: no confirmed stock evidence
has been supplied. An empty feed is preparation, not a completed Google listing.
Do not submit the feed until product eligibility and stock are confirmed.

A trusted warehouse/supplier integration can replace the JSON adapter. For manual
confirmation, enter SKU records with `status: "in_stock"`, ISO `confirmedAt` and
`validUntil`; validity must be at most 24 hours. Only use evidence that the item can
be fulfilled under the published 2–4 working-day conditions. Product pages and feed
use the same helper. Other or unknown statuses are omitted, never called out of stock.
The current adapter requires a deployment to refresh evidence; it is not automatic
inventory synchronization. Build that integration before sustained feed operation.

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
