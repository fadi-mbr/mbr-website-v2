import { NextResponse } from 'next/server';

/**
 * QuickBooks Online disconnect notification endpoint.
 *
 * Intuit pings this URL when a QuickBooks admin disconnects the MBR integration
 * from inside their QBO company (Settings -> Apps -> My Apps -> Disconnect).
 *
 * Required by Intuit's app-readiness checklist. Must be a public HTTPS endpoint
 * that returns 200 to GET. We accept both GET and POST since Intuit's exact
 * dispatch shape has varied across versions.
 *
 * The handler is intentionally minimal:
 *   - No tokens or PII are persisted on this endpoint, so there is nothing to
 *     erase server-side. Token invalidation happens automatically on Intuit's
 *     side, and our QBO client treats subsequent 401s as "needs reconnect".
 *   - We log the realmId (and a few non-sensitive query params) for auditing
 *     so we can correlate a disconnect event with a later "missing
 *     QBO_MBR_REFRESH_TOKEN" error during routine ops.
 *   - We return 200 unconditionally so Intuit's verifier accepts the URL.
 *
 * Future hardening: validate Intuit's webhook signature header
 * (intuit-signature) once we publish the app — Intuit only signs production
 * webhooks for distributed apps.
 */
function handle(request: Request): NextResponse {
  const { searchParams } = new URL(request.url);
  const realmId = searchParams.get('realmId') ?? searchParams.get('realm_id');
  const event = searchParams.get('event') ?? request.method;

  console.log('[qbo:disconnect]', {
    method: request.method,
    realmId,
    event,
    userAgent: request.headers.get('user-agent'),
  });

  return NextResponse.json({ ok: true, message: 'disconnect acknowledged' });
}

export async function GET(request: Request) {
  return handle(request);
}

export async function POST(request: Request) {
  return handle(request);
}
