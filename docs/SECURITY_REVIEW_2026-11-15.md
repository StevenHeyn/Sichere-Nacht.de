# Shop security hardening — 2026-11-15

## Verified and changed
- Checkout uses server catalogue prices and limits quantities. Stripe event signatures and timestamp tolerance are checked; paid state is fetched from Stripe before fulfilment.
- Added byte limits during request streaming and 10-second read deadlines to checkout, contact, withdrawal and Stripe webhook. Webhook raw text is unchanged before signature validation and does not require browser Origin.
- Browser JSON endpoints reject foreign/opaque origins, cross-site Fetch Metadata and non-JSON form posts. This mitigates cross-site browser abuse, not automated bots that forge headers.
- Added frame-ancestors none and X-Frame-Options DENY; object-src none and base-uri self. This intentionally does not restrict Stripe script/frame sources or inline Next hydration scripts. It is not a complete XSS CSP.
- Replaced vulnerable transitive PostCSS with pinned 8.5.33 and added a package lock. npm audit --omit=dev returned zero reported vulnerabilities after installation. This is a point-in-time dependency check, not proof of exploit absence.
- Revoked anonymous/partner grants on order_mail_jobs and its trigger function. RLS was already enabled with no public policies. Verified anon/partner no access, service role access preserved. Orders and supplier tables already deny direct anon/partner SELECT.

## Validation
41 request-security, Stripe branding/scope, checkout compatibility and buyer-policy tests passed. Production build checked. No real payment, mail or order was created for verification. No destructive scans or load tests.

## Remaining security work
- Vercel currently has default firewall protection, no custom rules. Stage targeted rate-limit observation for POST checkout/contact/withdrawal and admin API; exclude Stripe webhooks. Review legitimate traffic before enforcement.
- Supabase leaked-password protection is reported disabled. Review enabling it with account signup/password flows.
- Confirm MFA and recovery access for GitHub, Vercel, Supabase, Stripe and mailbox owners. Their settings were not changed or verified by this code review.
- Verify backup retention and a restore drill; monitoring/alert delivery; review portal uploads, authenticated roles and IDOR with dedicated test users.
- Shared shop admin bearer secret remains a limitation versus individual admin accounts plus MFA. No token rotation was performed; no evidence of token theft was established.
- Adviser function warnings need per-function authorization review; a callable SECURITY DEFINER function is not automatically an exploit. vp_is_admin checks auth.uid(), active state and role. Private RLS tables without policies intentionally deny browser access.

Not a full penetration test or a guarantee against compromise.
