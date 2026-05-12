import { NextResponse } from 'next/server';
import { createHmac, timingSafeEqual } from 'node:crypto';

/**
 * QuickBooks Online disconnect notification endpoint.
 *
 * Intuit pings this URL when a QuickBooks admin disconnects the MBR
 * integration from inside their QBO company (Settings -> Apps -> My Apps ->
 * Disconnect). Required by Intuit's app-readiness checklist.
 *
 * Compliance contract:
 *   - Returns 200 to GET and POST so Intuit's verifier accepts the URL and
 *     so retries from Intuit's side don't queue indefinitely.
 *   - Optionally verifies the `intuit-signature` header against
 *     QBO_WEBHOOK_VERIFIER_TOKEN if that env var is set. Intuit signs
 *     webhook payloads with HMAC-SHA256(verifier_token, raw_body) and
 *     base64-encodes the result. The disconnect notification is not
 *     consistently signed across all Intuit dispatch paths, so we treat
 *     signature verification as best-effort: invalid-but-present
 *     signatures are rejected, missing signatures are logged-and-accepted.
 *   - Captures realmId and Intuit's `intuit-tid` trace header into the
 *     audit log so a disconnect event can be correlated with a later
 *     "missing QBO_MBR_REFRESH_TOKEN" error during routine ops.
 *   - Does NOT itself purge tokens from Infisical — Vercel's runtime is
 *     not provisioned with write credentials to the MBR Infisical project,
 *     and minting a write-scoped machine identity for one webhook is more
 *     attack surface than the privacy-policy commitment requires. Token
 *     purge is performed by an operator within 24 hours of the disconnect
 *     log entry, per the documented retention policy. The companion
 *     operator script is at
 *     mbr-brain/skills/mbr-qbo/scripts/qbo (`qbo purge`).
 */

interface DisconnectAuditEntry {
  ts: string;
  method: string;
  realmId: string | null;
  event: string | null;
  intuitTid: string | null;
  signaturePresent: boolean;
  signatureValid: boolean | null;
  bodyBytes: number;
  userAgent: string | null;
}

function verifySignature(rawBody: string, signature: string | null): boolean | null {
  if (!signature) return null;
  const verifierToken = process.env.QBO_WEBHOOK_VERIFIER_TOKEN;
  if (!verifierToken) return null; // verification disabled — accept

  const expected = createHmac('sha256', verifierToken).update(rawBody).digest('base64');
  const a = Buffer.from(expected);
  const b = Buffer.from(signature);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

async function handle(request: Request): Promise<NextResponse> {
  const { searchParams } = new URL(request.url);
  const realmId = searchParams.get('realmId') ?? searchParams.get('realm_id');
  const event = searchParams.get('event');
  const intuitTid = request.headers.get('intuit-tid');
  const signature = request.headers.get('intuit-signature');

  // Read raw body for signature verification (POST/PUT only)
  let rawBody = '';
  if (request.method !== 'GET' && request.method !== 'HEAD') {
    try {
      rawBody = await request.text();
    } catch {
      rawBody = '';
    }
  }

  const signatureValid = verifySignature(rawBody, signature);

  const audit: DisconnectAuditEntry = {
    ts: new Date().toISOString(),
    method: request.method,
    realmId,
    event,
    intuitTid,
    signaturePresent: signature !== null,
    signatureValid,
    bodyBytes: rawBody.length,
    userAgent: request.headers.get('user-agent'),
  };

  console.log('[qbo:disconnect]', JSON.stringify(audit));

  // If a signature was supplied AND we have a verifier token AND it didn't
  // match, reject — this catches forged disconnect attempts.
  if (signature !== null && signatureValid === false) {
    return NextResponse.json(
      { ok: false, error: 'invalid signature' },
      { status: 401 },
    );
  }

  return NextResponse.json({
    ok: true,
    message: 'disconnect notification acknowledged',
    realmId,
  });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
