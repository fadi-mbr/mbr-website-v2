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
