"use client";

import dynamic from 'next/dynamic';
import { useEffect, useState } from 'react';
import {
  isEmbedMode,
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
 * This component also collects embed context from:
 *  1. URL params (synchronous, available on mount)
 *  2. parent-frame postMessage `chatwoot:context` (asynchronous, may
 *     arrive after the iframe has loaded)
 * and forwards both into the wizard so the Details step can pre-fill.
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

  // postMessage context arrives async — merge over the URL context once received.
  const [pmContext, setPmContext] = useState<EmbedContext | null>(null);

  useEffect(() => {
    const unsub = setupChatwootListener((ctx) => {
      // postMessage wins because it represents the parent frame's authoritative
      // view of the conversation — but never *clear* a URL value with an
      // undefined postMessage value; only override when the new value is set.
      setPmContext((prev) => ({ ...(prev ?? {}), ...ctx }));
    });
    return unsub;
  }, []);

  const merged: EmbedContext = { ...urlContext, ...(pmContext ?? {}) };

  return <BookingWizard embedMode={embed} initialContext={merged} />;
}
