"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import {
  fetchContactPrefill,
  isEmbedMode,
  readContactIdFromUrl,
  readContextFromUrl,
  setupChatwootListener,
  type EmbedContext,
} from '@/lib/embed-mode';

/**
 * Client-side dynamic wrapper around BookingWizard.
 *
 * Next 15 forbids `dynamic(..., { ssr: false })` inside server components.
 * Putting that import behind this thin "use client" file is the documented
 * workaround — the wizard itself still ships as one async chunk.
 *
 * This component collects embed context from three sources, in precedence
 * order (later wins):
 *
 *   1. Chatwoot server-side lookup via `/api/booking/embed-context`
 *      (asynchronous, fired on mount when `?contact_id=` is present)
 *   2. URL params (synchronous, available on mount) — phone / name / email
 *      / conversation_id / channel directly in the iframe URL
 *   3. parent-frame postMessage `chatwoot:context` (asynchronous)
 *
 * The order matters: URL params and postMessage represent EXPLICIT intent
 * (an advisor typed the URL, or the parent frame is actively pushing the
 * authoritative contact). The Chatwoot fetch is a best-guess fallback when
 * the URL only carries a contact_id — it must never override a value the
 * advisor or parent already set.
 *
 * Failure mode: the Chatwoot fetch returns `{}` on any error. The wizard
 * always renders; the advisor can type the customer's details manually.
 */
const BookingWizard = dynamic(() => import('./BookingWizard'), {
  loading: () => (
    <div className="booking-loading" role="status" aria-live="polite">
      <span className="booking-spinner" aria-hidden="true" />
      <span>Loading booking…</span>
    </div>
  ),
  ssr: false,
});

export default function BookingWizardClient() {
  // Snapshot the initial URL-derived context. Stable across renders.
  const [urlContext] = useState<EmbedContext>(() =>
    typeof window === 'undefined' ? {} : readContextFromUrl()
  );
  const [embed] = useState<boolean>(() =>
    typeof window === 'undefined' ? false : isEmbedMode()
  );

  // Chatwoot server-side prefill (resolves after a `/api/booking/embed-context`
  // POST). Stays at null until the fetch completes; lowest precedence so URL
  // params + postMessage win.
  const [chatwootContext, setChatwootContext] = useState<Partial<EmbedContext> | null>(null);

  // postMessage context arrives async — highest precedence (parent's
  // authoritative view of the current conversation).
  const [pmContext, setPmContext] = useState<EmbedContext | null>(null);

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Fire the Chatwoot lookup if the iframe URL carries a contact_id. Only
    // in embed mode — the public /book page shouldn't make this call.
    if (isEmbedMode()) {
      const contactId = readContactIdFromUrl();
      if (contactId !== null) {
        fetchContactPrefill(contactId).then(
          (ctx) => {
            if (Object.keys(ctx).length > 0) {
              setChatwootContext((prev) => ({ ...(prev ?? {}), ...ctx }));
            }
          },
          () => undefined // fetchContactPrefill already swallows errors
        );
      }
    }

    const unsub = setupChatwootListener((ctx) => {
      // postMessage wins because it represents the parent frame's
      // authoritative view of the conversation — but never *clear* a
      // value with an undefined postMessage value; only override when
      // the new value is set.
      setPmContext((prev) => ({ ...(prev ?? {}), ...ctx }));
    });
    return unsub;
  }, []);

  // Merge order: Chatwoot (lowest) → URL params → postMessage (highest).
  // Each later source overrides only the fields it actually provides.
  const merged: EmbedContext = {
    ...(chatwootContext ?? {}),
    ...urlContext,
    ...(pmContext ?? {}),
  };

  return <BookingWizard embedMode={embed} initialContext={merged} />;
}
