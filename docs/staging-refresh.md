# Staging refresh — MBR-8

Development source: `chore/mbr-7-website-safeguards` at `ed2292a`. The protected staging alias uses this candidate; historical `dev` is a separate, unselected redesign. This branch brings selected MBR brand assets forward without merging its stale booking implementation.

## Review and changes

The earlier homepage is a client component composed from several overlapping design experiments. It starts with an autoplay video and distributes contact actions, brand marks and service content across animation-heavy sections. The refresh uses a static workshop image, a clear headline and one primary contact action, followed by service cards, workshop process, reviews and contact details. The near-black, red and warm neutral palette preserves MBR's identity. Real existing photographs and logos are reused; no synthetic workshop or customer claims are introduced.

The homepage shell, services and contact content render on the server. Only mobile navigation and review loading require client state. Contact links and service copy have a shared data source. Three unused hero experiments are removed. Navigation is shared with existing legal and integration pages. Mobile menu supports expanded state, selection dismissal and Escape; a skip link, landmarks, visible focus, responsive layouts and reduced-motion support are included.

Next.js and its first-party packages use 16.4.0; React/React DOM use 19.3.0, the stable npm releases verified on 2026-10-11. ESLint uses Next's flat config; middleware migrates to proxy; TypeScript follows the framework's generated settings. The unused deprecated Vercel KV dependency is removed. Build-time packages were patched where compatible. Production dependencies have no reported npm audit vulnerabilities. The remaining dev-only advisory is the braces/fast-glob ESLint dependency chain; npm currently offers no patched braces release. Do not downgrade Next's ESLint configuration or force incompatible packages to conceal this.

Hardcoded aggregate review structured data is removed. Review-fetch failures show a Google link without an invented rating/count. Preview continues to show clearly labelled synthetic reviews, blocks external integrations, omits analytics and sends noindex headers. Booking retirement remains intact.

## Verification and boundaries

Run `npm ci`, `npm run lint`, `npm run typecheck`, `npm run test:unit`, `npm run build`, `npm run test:browser` on Node 22 (`.nvmrc`). Browser coverage includes 390/768/1440 widths, overflow, menu keyboard behavior, skip link, review failure, no booking URLs and existing staging isolation checks. CI retains screenshots from all runs. Required AI review remains fail-closed; model coverage and findings must be checked at the exact submitted SHA.

This candidate targets the safeguards branch while its PR remains unmerged. Never overwrite the legacy dev or booking archive. Do not merge into main or promote a preview into production. Publication requires the completed release evidence and Fadi's approval. Durable Google review storage and operational alerting remain owned by MBR-7 and are not solved by this presentation refresh.

## Local results, 2026-10-11

- Next.js production build and TypeScript pass; lint has zero errors and 11 existing unused-variable warnings.
- Six unit tests pass, including provider isolation with copied credentials.
- Eleven Chromium tests pass at 390, 768 and 1440 pixels. No horizontal overflow or page errors; menu, Escape, skip link, unavailable-review state, retired booking routes and preview isolation verified.
- Desktop/mobile screenshots reviewed by MBR CTO. Corrected opaque brand logos (removed destructive brightness filter), selected the dark McLaren mark for the light strip, loaded Fraunces explicitly, and corrected exterior-photo alternative text.
- Current protected staging was accessed with a temporary bypass; the bypass was revoked after each capture. Its legacy homepage has no h1 and depends on client animations to reveal major sections; the refresh supplies server-rendered content with one h1 and a main landmark.
- Local runtime is Node 24.21.0; repository/hosted verification remains Node 22.22.0. Hosted CI and exact-head AI review must still pass before release eligibility.

## Hosted visual follow-up

The first deployed capture exposed poor contrast in the inherited translucent cookie banner on the new light sections. Replaced it with an opaque dark panel, bounded mobile scrolling and explicit toggle state. Replaced the skip-link hiding transform with offscreen positioning. Added a mobile consent preferences/rejection test. Browser CI now exercises the built production bundle rather than the development server, so optimized CSS is covered. Final screenshot/test evidence supersedes the first deployed capture.

After the hosted corrections, all 12 Chromium tests pass against the production bundle, including consent customization/rejection and mobile panel bounds. Build and lint pass (existing warnings unchanged). Deployed candidate and AI-review SHA must be updated after this correction; prior 627f46b results are superseded.

## Homepage visual revision — October 11, owner feedback

The owner rejected the first design. Their answer “yes” to returning to the original staging look is interpreted as refining that dark direction, not approval to promote the rejected candidate. A revised homepage draft uses neutral black, restrained red, a full-width real workshop photograph, the Making Better Rides headline, and on-demand workshop film. Services, reviews and contact remain accessible server-rendered content; mobile navigation and the honest review fallback are retained. Brand names replace the SVG strip after visual verification exposed opaque embedded logo backgrounds.

This is a local review draft, not a deployed candidate. Desktop and mobile screenshots are saved on MBR-8 for visual review before wider styling or staging selection. The framework and reviewer work are preserved. Build/typecheck and focused lint pass. Twelve existing browser checks pass at 390/768/1440; the added film fallback check passes after scoping its status selector to main. The run environment needed isolated Chromium libraries/fonts and a no-zygote browser option, recorded outside repository configuration. No exact-head AI review or release approval is claimed for this draft.
