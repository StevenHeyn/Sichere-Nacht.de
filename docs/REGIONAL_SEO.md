# Regional pages and police statistics

Scope: 81 entries from BKA PKS 2025 city T01 plus 38 additional independent cities/stadtkreise from county T01. Pinneberg uses district figures explicitly labelled as such. Tangstedt has editorial service information, no invented city statistics. No fictional branches or national installation promises.

Data provenance, versions, retrieval date, source row numbers, geographic keys and original XLSX SHA-256 hashes are in `lib/regional-statistics.json`. Only crime totals and burglary measures are extracted; suspect demographics are not published. City/district duplicate totals are cross-checked. Period is 2025, not the current year 2026.

To update, download both official files linked in the JSON, review schema/year/version and adapt the importer to the new reporting year explicitly. Run `python scripts/import-regional-pks.py /path/to/cities.xlsx /path/to/counties.xlsx`. Never substitute district totals for city totals. Validate matching geography and record counts before changing the hardcoded expectations. Existing narratives in `lib/regional-content.ts` are preserved.

Checks: `npm run build` then `node scripts/regional-test.mjs`. Production additionally requires verified index/follow, self-canonicals, HTTP 200 and regional sitemap entries. Preview/local builds intentionally use noindex. No Search Console submission is implied by publication.

Future district-seat expansion requires a verified municipality-to-district mapping and explicit geographic labels, or municipality-specific official police data. Districts are not automatically equated with their administrative seat.
