# Environment variable inventory

Booking is parked; see [resumption notes](booking-parked.md). This candidate needs no booking, SMTP, ARC or Chatwoot credentials. Existing production secrets are retained for rollback and must never be copied into previews.

Website variables (names only): `CRON_SECRET`, `GOOGLE_AI_STUDIO_API_KEY`, `GOOGLE_PLACES_API_KEY`, `GOOGLE_PLACE_ID`, `NEXT_PUBLIC_SITE_URL`, `OPENAI_API_KEY`, `VERCEL_ENV`, `VERCEL_URL`, `MBR_RUNTIME_ENV`.

Nonproduction pages carry noindex headers and omit GA/Vercel analytics. Review cron rejects nonproduction calls. Run `npm run test:unit` and `npm run test:browser`; browser tests require Playwright Chromium. The historical required CI name `test:booking` now aliases the website unit suite while branch protection remains intact.

## Review cron monitoring

Preview/development cron requests are rejected before any Google request or storage write, even with copied credentials. Production requires the existing cron authorization. Google fetches time out after 15 seconds. Structured `reviews_cron_failed` events include a generated correlation ID, timestamp and bounded stage (`google_fetch` or `persistence`); upstream error text, request URLs, credentials and review contents are omitted. The HTTP failure response carries the same correlation ID. Successful persistence emits `reviews_cron_succeeded`.

These events provide log evidence only. Durable last-success tracking, freshness alerts and alert delivery are still pending; no operational alerting claim is made.
