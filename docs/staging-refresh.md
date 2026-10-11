# MBR-8 — confirmed Dev design

Fadi confirmed the May 15 Dev design (`27f7d58`) on October 11. Earlier redesigns and the production-derived restoration are superseded.

The current local candidate restores the Dev homepage composition, Fraunces headings, shield branding, service sections, workshop gallery, Why MBR, team, review masonry, footer, About, Workshop and Privacy pages. It retains the existing Next.js 16.4 / React 19.3 upgrade and reviewer repairs.

Small compatibility and usability changes preserve the design: keyboard menu state and Escape dismissal, server-provided team data, modern React effect handling, shared live-review hook and an honest unavailable state. Hardcoded review ratings/testimonials are not restored. Booking CTAs lead to contact; retired booking routes remain absent. Existing staging isolation, noindex, analytics consent and cookie controls remain. Historical Chatwoot loading and its unavailable live-chat card are not restored; chat CTAs use the existing WhatsApp channel.

Validation and screenshots are recorded in the task document. This is a local visual draft pending Fadi's review. Hosted checks and complete exact-candidate AI coverage/severity gates must pass before refreshed staging selection. Production release requires separate authorization.
