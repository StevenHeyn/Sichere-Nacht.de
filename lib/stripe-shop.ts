/** Shop-local identity. Never changes the shared Stripe account settings. */
export const STRIPE_SHOP_ID = 'sichere-nacht';
export const STRIPE_SHOP_NAME = 'Sichere Nacht';

export function applyCheckoutBranding(parameters: URLSearchParams): void {
  parameters.set('branding_settings[display_name]', STRIPE_SHOP_NAME);
}

/** Apply only after signature verification or an authenticated Stripe API lookup. */
export function isSichereNachtCheckout(value: unknown): boolean {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const metadata = (value as {metadata?: unknown}).metadata;
  if (!metadata || typeof metadata !== 'object' || Array.isArray(metadata)) return false;
  const fields = metadata as Record<string, unknown>;
  return fields.shop === STRIPE_SHOP_ID &&
    (fields.diagnostic === undefined || fields.diagnostic === '');
}
