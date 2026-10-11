# MBR Auto Services website

Next.js App Router website for MBR in Dubai. Node 22 (`.nvmrc`), React 19 and Tailwind 4. Public production: https://www.mbrme.com. Protected staging: https://mbr-website-staging.vercel.app.

## Develop and verify

```sh
npm ci
npm run dev -- --port 3005
npm run lint
npm run typecheck
npm run test:unit
npm run build
npm run test:browser
```

Install Playwright Chromium and its OS libraries before browser tests (`npx playwright install --with-deps chromium`). Tests start an isolated local server. `STAGING_URL` optionally tests a deployed preview; any temporary bypass token belongs only in the runner environment.

Local and preview environments use synthetic review/location data and block integration writes. Do not copy production credentials locally. See [environment rules](docs/environment.md), [parked booking](docs/booking-parked.md), [required AI review](docs/tm-code-review.md) and [refresh implementation](docs/staging-refresh.md).

Homepage components: `src/components/site`; shared content: `src/lib/site-content.ts`; environment boundary: `src/proxy.ts`. Old `PHASE_TRACKING.md` and portions of `CLAUDE.md` describe historical design experiments, not the current release process.

Work in isolated feature branches, pass required CI and AI review, then prepare a protected staging candidate. Main and public-domain promotion require their applicable release gates and owner authorization. Historical dev and booking archive are preserved.
