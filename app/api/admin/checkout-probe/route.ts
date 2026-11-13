import {createHash, timingSafeEqual} from 'node:crypto';
import {NextResponse} from 'next/server';
import products from '../../../../products.json';
import {runCheckoutWriteProbe} from '../../../../lib/checkout-write-probe';
import {applyCheckoutBranding} from '../../../../lib/stripe-shop';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const maxDuration = 60;
const headers = {'cache-control':'no-store', 'referrer-policy':'no-referrer'};
const fail = (error: string, status: number) => NextResponse.json({error}, {status, headers});
function authorized(request: Request): boolean {
  const expected = process.env.ORDERS_ADMIN_TOKEN;
  const auth = request.headers.get('authorization') || '';
  if (!expected || !auth.startsWith('Bearer ') || auth.length > 4096) return false;
  return timingSafeEqual(createHash('sha256').update(expected).digest(),
    createHash('sha256').update(auth.slice(7)).digest());
}
export async function POST(request: Request) {
  if (!authorized(request)) return fail('Nicht autorisiert.', 401);
  if (!['https://sichere-nacht.de', 'https://www.sichere-nacht.de'].includes(request.headers.get('origin') || '')) {
    return fail('Bitte die Bestellverwaltung auf sichere-nacht.de öffnen.', 403);
  }
  if (process.env.VERCEL_ENV !== 'production') return fail('Dieser Test ist nur für die Produktionsanbindung vorgesehen.', 409);
  if (['CHECKOUT_ENABLED','NEXT_PUBLIC_CHECKOUT_ENABLED','PAYMENTS_LIVE_APPROVED','SITE_LIVE_APPROVED'].some(key => process.env[key] === 'true')) {
    return fail('Der öffentliche Checkout und die Verkaufsfreigaben müssen für diesen Prüflauf gesperrt bleiben.', 409);
  }
  if (!(request.headers.get('content-type') || '').toLowerCase().startsWith('application/json')) return fail('JSON erforderlich.', 415);
  if (Number(request.headers.get('content-length') || 0) > 512) return fail('Anfrage zu groß.', 413);
  const raw = await request.text();
  if (raw.length > 512) return fail('Anfrage zu groß.', 413);
  const body = (() => {try {return JSON.parse(raw)} catch {return null}})();
  if (body?.action !== 'run_checkout_write_probe') return fail('Unbekannte Prüfaktion.', 400);
  const key = process.env.STRIPE_SECRET_KEY || '';
  if (!/^(?:rk|sk)_live_/.test(key)) return fail('Kein unterstützter Stripe-Liveschlüssel eingerichtet.', 503);
  const origin = process.env.NEXT_PUBLIC_SITE_URL;
  if (origin !== 'https://sichere-nacht.de') return fail('Produktions-Shopadresse prüfen.', 503);
  const sku = '38198.02.WH1';
  const product = products.find(p => p.sku === sku);
  if (!product || !Number.isInteger(product.priceCents) || product.priceCents <= 0) return fail('Prüfartikel nicht verfügbar.', 503);
  const bucket = Math.floor(Date.now() / 300000);
  const form = new URLSearchParams({
    mode:'payment', ui_mode:'form',
    return_url:origin + '/bestellung?session_id={CHECKOUT_SESSION_ID}',
    billing_address_collection:'required', 'phone_number_collection[enabled]':'false',
    'shipping_address_collection[allowed_countries][0]':'DE', locale:'de',
    'automatic_tax[enabled]':'true', submit_type:'auto',
    integration_identifier:'custom_embedded_web_0001',
    // Deterministic within the five-minute window: repeated clicks reuse one session.
    expires_at:String((bucket + 1) * 300 + 1860),
    'line_items[0][price_data][currency]':'eur',
    'line_items[0][price_data][unit_amount]':String(product.priceCents),
    'line_items[0][price_data][tax_behavior]':'inclusive',
    'line_items[0][price_data][product_data][name]':('[PRÜFLAUF OHNE ZAHLUNG] ' + product.name).slice(0,240),
    'line_items[0][price_data][product_data][metadata][sku]':sku,
    'line_items[0][quantity]':'1',
    'shipping_options[0][shipping_rate_data][type]':'fixed_amount',
    'shipping_options[0][shipping_rate_data][fixed_amount][amount]':'990',
    'shipping_options[0][shipping_rate_data][fixed_amount][currency]':'eur',
    'shipping_options[0][shipping_rate_data][tax_behavior]':'inclusive',
    'shipping_options[0][shipping_rate_data][display_name]':'Standardversand Deutschland',
    'metadata[shop]':'sichere-nacht-diagnostic',
    'metadata[diagnostic]':'checkout-write-probe-v1',
    'metadata[shipping_country]':'DE'
  });
  applyCheckoutBranding(form);
  const digest = createHash('sha256').update(form.toString()).digest('hex');
  const result = await runCheckoutWriteProbe({key, parameters:form,
    idempotencyKey:'sn-checkout-probe-v1-' + digest, expectedSku:sku});
  console.info('Stripe checkout write probe', {passed:result.passed, sessionId:result.sessionId,
    cleanupRequired:result.cleanupRequired, steps:Object.fromEntries(Object.entries(result.checks).map(([name,step]) => [name, {status:step.status, code:step.code}]))});
  return NextResponse.json({...result, keyType:key.startsWith('rk_')?'restricted':'standard',
    note:'Keine Kartendaten, keine Zahlungsbestätigung, keine Kunden-E-Mail und kein Auftrag. Getestet werden Checkout-Erstellung, Ablauf und Lesezugriffe, nicht Steuerberechnung, Webhook-Zustellung oder Verkauf.'
  }, {status:result.passed?200:422, headers});
}
