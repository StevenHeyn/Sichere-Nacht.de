/** Server-side diagnostic. No payment confirmation and no client secret is returned. */
export type ProbeStep = {
  status: 'not_run' | 'ok' | 'failed';
  httpStatus?: number;
  code?: string;
  param?: string;
  requestId?: string;
  message?: string;
};
export type CheckoutProbeReport = {
  passed: boolean;
  paymentAttempted: false;
  cleanupRequired: boolean;
  sessionId?: string;
  sessionStatus?: string;
  paymentStatus?: string;
  checks: { create: ProbeStep; expire: ProbeStep; retrieve: ProbeStep; lineItems: ProbeStep };
};
export type ProbeOptions = {
  key: string;
  parameters: URLSearchParams;
  idempotencyKey: string;
  expectedSku: string;
  fetchImpl?: typeof fetch;
};

type Json = Record<string, unknown>;
function object(value: unknown): Json {
  return value !== null && typeof value === 'object' && !Array.isArray(value)
    ? value as Json : {};
}
function safeText(value: unknown): string | undefined {
  if (typeof value !== 'string') return undefined;
  return value.replace(/(?:sk|rk|pk)_(?:live|test)_[A-Za-z0-9_]+|whsec_[A-Za-z0-9_]+|cs_(?:live|test)_[A-Za-z0-9]+_secret_[A-Za-z0-9]+/g, '[REDACTED]')
    .replace(/[\r\n]/g, ' ').slice(0, 360);
}

export async function runCheckoutWriteProbe(options: ProbeOptions): Promise<CheckoutProbeReport> {
  const result: CheckoutProbeReport = {
    passed: false, paymentAttempted: false, cleanupRequired: false,
    checks: { create: {status:'not_run'}, expire: {status:'not_run'}, retrieve: {status:'not_run'}, lineItems: {status:'not_run'} }
  };
  const fetchImpl = options.fetchImpl || fetch;
  async function call(path: string, method: 'GET' | 'POST', body?: string, idempotencyKey?: string) {
    try {
      const headers: Record<string, string> = {
        Authorization: 'Bearer ' + options.key,
        'Stripe-Version': '2026-03-25.dahlia'
      };
      if (method === 'POST') headers['content-type'] = 'application/x-www-form-urlencoded';
      if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;
      const response = await fetchImpl('https://api.stripe.com/v1/' + path, {
        method, headers, ...(body !== undefined ? {body} : {}),
        cache: 'no-store', signal: AbortSignal.timeout(9000)
      });
      const data = object(await response.json());
      const error = object(data.error);
      const step: ProbeStep = {
        status: response.ok ? 'ok' : 'failed', httpStatus: response.status,
        ...(response.headers.get('request-id') ? {requestId: response.headers.get('request-id')!} : {}),
        ...(!response.ok ? {
          code: safeText(error.code) || safeText(error.type) || 'stripe_error',
          param: safeText(error.param), message: safeText(error.message)
        } : {})
      };
      return {data, step, ok: response.ok};
    } catch {
      return {data: {} as Json, ok: false, step: {
        status: 'failed', code: 'network_or_response_error',
        message: 'Stripe-Antwort nicht sicher feststellbar. Nicht als erfolgreichen Prüflauf werten.'
      } as ProbeStep};
    }
  }

  const created = await call('checkout/sessions', 'POST', options.parameters.toString(), options.idempotencyKey);
  result.checks.create = created.step;
  if (!created.ok) {
    result.cleanupRequired = created.step.code === 'network_or_response_error';
    return result;
  }
  const id = typeof created.data.id === 'string' ? created.data.id : '';
  if (!/^cs_(?:live|test)_[A-Za-z0-9]+$/.test(id)) {
    result.checks.create = {...created.step, status:'failed', code:'invalid_session_response'};
    result.cleanupRequired = true;
    return result;
  }
  result.sessionId = id;
  result.cleanupRequired = true;
  if (created.data.livemode !== true || !id.startsWith('cs_live_')) {
    result.checks.create = {...created.step, status:'failed', code:'unexpected_stripe_mode'};
  }

  // Clean up immediately, before any optional read/expansion checks.
  const expired = await call('checkout/sessions/' + id + '/expire', 'POST', '');
  result.checks.expire = expired.step;
  if (expired.ok && expired.data.status === 'expired') {
    result.cleanupRequired = false;
  } else if (expired.ok) {
    result.checks.expire = {...expired.step, status:'failed', code:'expiration_not_confirmed'};
  }

  const retrieved = await call('checkout/sessions/' + id, 'GET');
  result.checks.retrieve = retrieved.step;
  if (retrieved.ok) {
    const session = retrieved.data;
    result.sessionStatus = safeText(session.status);
    result.paymentStatus = safeText(session.payment_status);
    if (session.id !== id || session.livemode !== true || session.payment_status !== 'unpaid') {
      result.checks.retrieve = {...retrieved.step, status:'failed', code:'unexpected_session_state'};
    }
    if (session.id === id && session.status === 'expired') {
      result.cleanupRequired = false;
      // Repeating the same idempotent probe can return an already-expired session.
      if (result.checks.expire.status !== 'ok') {
        result.checks.expire = {status:'ok', httpStatus:retrieved.step.httpStatus,
          message:'Abgelaufener Status durch separate Abfrage bestätigt.'};
      }
    } else {
      result.cleanupRequired = true;
      result.checks.expire = {...result.checks.expire, status:'failed', code:'session_not_expired'};
    }
  }

  const lines = await call('checkout/sessions/' + id + '/line_items?limit=100&expand%5B%5D=data.price.product', 'GET');
  result.checks.lineItems = lines.step;
  if (lines.ok) {
    const entries = Array.isArray(lines.data.data) ? lines.data.data : [];
    const first = object(entries[0]);
    const metadata = object(object(object(first.price).product).metadata);
    if (entries.length !== 1 || lines.data.has_more === true || first.quantity !== 1 || metadata.sku !== options.expectedSku) {
      result.checks.lineItems = {...lines.step, status:'failed', code:'sku_expansion_unverified',
        message:'Artikelposition und expandierte Produkt-SKU konnten nicht vollständig geprüft werden.'};
    }
  }
  result.passed = Object.values(result.checks).every(step => step.status === 'ok') &&
    !result.cleanupRequired && result.sessionStatus === 'expired' && result.paymentStatus === 'unpaid';
  return result;
}
