# MBR-8 — existing staging design with minor adjustments

## Current direction (October 11)

Fadi rejected both redesign drafts: “wrong direction, let's not redesign that much. The current one is alright, needs minor adjustments.” This supersedes the prior design notes and screenshots.

The homepage composition and navigation are restored from selected staging source `ed2292a`: video opening, original logos, service cards, brand carousel, customer stories, about, team and contact sections in their original order. No replacement hero, new typography or new section design is introduced. Rejected draft components are removed from the active tree; their history remains available in previous commits.

Minor changes: semantic h1 using the existing “Expert Car Care in Dubai” text and styling; main landmark and keyboard skip link; visible keyboard focus; anchor offsets; mobile navigation expanded state, Escape dismissal and focus return. Both review consumers use the existing shared hook; unavailable reviews link to Google instead of inventing ratings or testimonials. The existing cookie usability fix remains.

Framework upgrades, flat ESLint, proxy migration, analytics consent fixes, removal of fabricated structured ratings, staging integration isolation and retired booking protections remain. Reviewer repair and strict coverage/severity gates remain. No new AI pass is claimed.

## Validation and handoff

Production build/typecheck and focused lint pass. Browser verification is recorded in the issue review document, including any unresolved limitations. Local environment uses isolated Chromium libraries/fonts and no-zygote, outside repository configuration.

This is a local visual review draft. Do not select refreshed staging until Fadi accepts the minor-adjustment scope and the exact candidate passes required hosted and AI checks. Production release still requires its own authorization. Earlier screenshots and AI results do not approve this candidate.
