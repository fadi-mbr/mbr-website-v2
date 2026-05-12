"use client";

import dynamic from 'next/dynamic';

/**
 * Client-side dynamic wrapper around BookingWizard.
 *
 * Next 15 forbids `dynamic(..., { ssr: false })` inside server components.
 * Putting that import behind this thin "use client" file is the documented
 * workaround — the wizard itself still ships as one async chunk.
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
  return <BookingWizard />;
}
