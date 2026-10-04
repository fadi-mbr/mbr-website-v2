# Environment variable inventory

Names only; obtain values through the authorized service credential loader. Never copy production credentials into local development, CI, or previews. CI requires no service credentials. Isolated staging mocks and runtime fail-closed guards are still pending; do not enable automatic previews from this branch yet.

- `ARC_WORKER_PASSWORD`
- `ARC_WORKER_PHONE`
- `BOOKING_AGENT_SECRET`
- `BOOKING_FROM_EMAIL`
- `BOOKING_SMTP_HOST`
- `BOOKING_SMTP_PASSWORD`
- `BOOKING_SMTP_PORT`
- `BOOKING_SMTP_USER`
- `BOOKING_TOKEN_SECRET`
- `CRON_SECRET`
- `GOOGLE_AI_STUDIO_API_KEY`
- `GOOGLE_PLACES_API_KEY`
- `GOOGLE_PLACE_ID`
- `MBR_ARC_BASE`
- `MBR_ARC_SHOP_ID`
- `MBR_ARC_SHOP_TOKEN`
- `NEXT_PUBLIC_SITE_URL`
- `NODE_ENV`
- `OPENAI_API_KEY`
- `VERCEL_URL`

## Deployment isolation (MBR-7)

`VERCEL_ENV=production` selects live integrations on Vercel. Other Vercel
values always select isolated fixtures, even with `MBR_RUNTIME_ENV=production`.
Outside Vercel only an explicit `MBR_RUNTIME_ENV=production` enables live
integrations. `NODE_ENV=production` alone never enables them.

Preview/development use `BOOKING_TEST_TOKEN_SECRET` (a separate random hex
secret, never equal to `BOOKING_TOKEN_SECRET`) and `BOOKING_TEST_AGENT_SECRET`.
No ARC, SMTP or Chatwoot credentials are required. ARC catalogue, availability
and submission use in-process fixtures; SMTP renders through nodemailer JSON
transport and discards the result after completion, without opening a socket.
Tests can inspect rendered mail through the existing test-only transport seam.
There is no public mail/token inspection endpoint or durable staging inbox yet.
Chatwoot calls fail closed with `staging_delivery_disabled`.

Confirmation links and server-action destinations ignore copied production
site configuration in nonproduction: they use `VERCEL_URL` or localhost:3005.
All nonproduction responses carry `X-Robots-Tag: noindex, nofollow, noarchive`;
GA and Vercel Analytics are omitted, and pages identify simulated bookings.

Run `npm run test:browser` after `npx playwright install --with-deps chromium`.
It starts an isolated Next server on port 3005 and uses only synthetic data.
The browser suite does not establish live ARC readiness or cross-instance
idempotency. Keep automatic branch deployment disabled until the remaining
staging integration and protected-host acceptance checks are complete.

## Review cron monitoring

Preview/development cron requests are rejected before any Google request or storage write, even with copied credentials. Production requires the existing cron authorization. Google fetches time out after 15 seconds. Structured `reviews_cron_failed` events include a generated correlation ID, timestamp and bounded stage (`google_fetch` or `persistence`); upstream error text, request URLs, credentials and review contents are omitted. The HTTP failure response carries the same correlation ID. Successful persistence emits `reviews_cron_succeeded`.

These events provide log evidence only. Durable last-success tracking, freshness alerts and alert delivery are still pending; no operational alerting claim is made.
