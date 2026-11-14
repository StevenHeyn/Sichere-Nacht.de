# Stripe: shop-local checkout identity and fulfillment isolation

The restricted-key no-charge production probe was reported successful by the operator on 13 November 2026. An independent Stripe read confirmed an expired, unpaid session with no PaymentIntent. The same read showed the account's inherited checkout display name was dein-snackautomat.de. No payment was made.

## Changes
- Normal checkout and the protected probe set `branding_settings[display_name]` to `Sichere Nacht` per session. No account-wide brand settings, statement descriptors, tax registrations or credentials are changed.
- After signature verification, the webhook accepts only exact `metadata.shop=sichere-nacht` and rejects diagnostic sessions. Other-shop and unmarked sessions receive an ignored acknowledgment before database or email access.
- The session retrieved from Stripe is checked against the same policy again before order creation. Signature, paid status and preview/live environment checks remain required.
- Missing shop metadata is not guessed. Existing sessions produced by this shop already carry the exact marker.

## Verification
Ten policy/wiring tests are added alongside the existing eight mocked checkout-probe tests. A passing build is not a real payment or a real webhook-delivery test.

## Open acceptance work
The public sale switches remain disabled. A completed payment through the actual checkout, signed event delivery, order persistence, confirmation email and invoice still need a coordinated end-to-end acceptance run. The previous failed/unfinished historical tax trials are not repeated by this change. The no-address write probe is not a tax calculation test.

Official references:
- https://docs.stripe.com/api/checkout/sessions/create?query=branding_settings
- https://docs.stripe.com/checkout/fulfillment
