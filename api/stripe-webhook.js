import crypto from 'crypto';

// Closes the visitor -> paid conversion loop. Stripe sends
// `checkout.session.completed`; we verify the signature, then forward a
// `purchase_completed` event to PostHog keyed on the visitor's distinct_id
// (passed through the Payment Link as client_reference_id by analytics.js).
//
// Env vars (set in Vercel): STRIPE_WEBHOOK_SECRET, POSTHOG_PROJECT_KEY
// Zero dependencies — Node `crypto` + global `fetch`, matching api/subscribe.js.

const POSTHOG_HOST = 'https://us.i.posthog.com';
const SIGNATURE_TOLERANCE_SECONDS = 60 * 5;

// Stripe requires the raw, unparsed body to verify the signature.
export const config = { api: { bodyParser: false } };

function readRawBody(req) {
  return new Promise((resolve, reject) => {
    const chunks = [];
    req.on('data', (c) => chunks.push(c));
    req.on('end', () => resolve(Buffer.concat(chunks)));
    req.on('error', reject);
  });
}

// Verify Stripe-Signature: t=<ts>,v1=<hmac>. HMAC-SHA256 of `${t}.${rawBody}`.
function verifyStripeSignature(rawBody, header, secret) {
  if (!header) return false;
  const parts = Object.fromEntries(
    header.split(',').map((kv) => kv.split('=').map((s) => s.trim()))
  );
  const timestamp = parts.t;
  const expected = parts.v1;
  if (!timestamp || !expected) return false;

  if (Math.abs(Math.floor(Date.now() / 1000) - Number(timestamp)) > SIGNATURE_TOLERANCE_SECONDS) {
    return false;
  }

  const signed = `${timestamp}.${rawBody.toString('utf8')}`;
  const computed = crypto.createHmac('sha256', secret).update(signed, 'utf8').digest('hex');

  const a = Buffer.from(computed);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Method not allowed' });
    return;
  }

  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const posthogKey = process.env.POSTHOG_PROJECT_KEY;
  if (!secret || !posthogKey) {
    res.status(500).json({ error: 'Server not configured' });
    return;
  }

  try {
    const rawBody = await readRawBody(req);

    if (!verifyStripeSignature(rawBody, req.headers['stripe-signature'], secret)) {
      res.status(400).json({ error: 'Invalid signature' });
      return;
    }

    const event = JSON.parse(rawBody.toString('utf8'));

    if (event.type === 'checkout.session.completed') {
      const session = event.data.object;
      const distinctId = session.client_reference_id;

      if (distinctId) {
        const amount = typeof session.amount_total === 'number'
          ? session.amount_total / 100
          : undefined;

        await fetch(`${POSTHOG_HOST}/capture/`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            api_key: posthogKey,
            event: 'purchase_completed',
            distinct_id: distinctId,
            properties: {
              price: amount,
              currency: (session.currency || 'usd').toUpperCase(),
              stripe_session_id: session.id
            }
          })
        });
      }
    }

    // Always ack so Stripe stops retrying.
    res.status(200).json({ received: true });
  } catch (err) {
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
