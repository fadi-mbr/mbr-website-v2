# Booking parked — 2026-10-10

Owner direction: remove online booking and preserve it for future resumption.

Archive: `archive/booking-paused-2026-10-10`, commit `d285994`. The remote branch contains public/agent booking, APIs, integrations, tests and unfinished safeguards. Do not merge it wholesale to resume: port selected changes onto current main and revalidate integrations, persistence, idempotency, rate limits and browser coverage. The last booking browser CI was failing; live ARC readiness was unverified.

The active candidate removes /book, /book/agent, /book/confirm, /book/faq and every /api/booking endpoint. Old URLs return 404 and cannot create appointments or confirm tokens. Existing WhatsApp and telephone contact options remain. No customer records or service credentials were deleted. External Chatwoot dashboard links will become unavailable after publication and should be retired by their operator.

CI keeps the required test:booking check name temporarily as an alias for the retained reviews-cron unit suite, so branch protection remains enforced. Browser CI verifies retired routes, homepage contact links, sitemap and preview noindex. Booking-specific mail, ARC, token, cross-instance confirmation and rate-limit work is parked. General review storage, operational alerts, stable staging and release/rollback evidence remain separate unfinished safeguards.

This is a source-code candidate, not a production deployment. Fadi must approve a concrete reviewed release before the public site changes. Main and dev remain untouched.
