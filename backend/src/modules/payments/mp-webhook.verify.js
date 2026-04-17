'use strict';

const crypto = require('crypto');

/**
 * MercadoPago webhook signature (x-signature) v1 — manifest:
 * id:{dataId};request-id:{x-request-id};ts:{ts};
 * @see https://www.mercadopago.com/developers/en/docs/your-integration/notifications/webhooks/webhooks-configuration
 */
function parseSignatureHeader(xSignature) {
  if (!xSignature || typeof xSignature !== 'string') return null;
  const parts = {};
  for (const chunk of xSignature.split(',')) {
    const [k, v] = chunk.split('=');
    if (k && v) parts[k.trim()] = v.trim();
  }
  return parts;
}

function verifyMercadoPagoWebhook({ dataId, xSignature, xRequestId, secret }) {
  if (!secret) return false;
  const parsed = parseSignatureHeader(xSignature);
  if (!parsed || !parsed.ts || !parsed.v1) return false;
  const manifest = `id:${dataId};request-id:${xRequestId || ''};ts:${parsed.ts};`;
  const expected = crypto.createHmac('sha256', secret).update(manifest).digest('hex');
  try {
    return crypto.timingSafeEqual(Buffer.from(parsed.v1, 'hex'), Buffer.from(expected, 'hex'));
  } catch {
    return false;
  }
}

/**
 * Extract payment notification id from query (preferred) or JSON body.
 */
function extractPaymentDataId(req) {
  const q = req.query || {};
  if (q['data.id']) return String(q['data.id']);
  if (q.id) return String(q.id);
  const body = req.body || {};
  if (body.data && body.data.id) return String(body.data.id);
  return null;
}

module.exports = { verifyMercadoPagoWebhook, extractPaymentDataId };
