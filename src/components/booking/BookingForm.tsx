/**
 * BookingForm — server-component shell for the v2 booking experience.
 *
 * Renders the static page chrome (brand bar, max-width container) and
 * defers all interactive concerns to <BookingFormClient>. The page wrapper
 * is responsible for fetching `services` server-side and passing them in.
 */

import React from 'react';
import BookingFormClient, {
  type BookingSubmitPayload,
  type ServerActionResult,
} from './BookingFormClient';
import type { BookingService } from '@/lib/booking-types';

interface Props {
  mode: 'agent' | 'public';
  services: BookingService[];
  prefill?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  };
  /**
   * Optional Server Action — when present, the client form awaits this on
   * submit instead of running its default preview-mode no-op. The action is
   * responsible for hitting the appropriate backend (agent or public) with
   * any secrets that must stay server-side.
   */
  serverAction?: (
    payload: BookingSubmitPayload
  ) => Promise<ServerActionResult>;
}

export default function BookingForm({
  mode,
  services,
  prefill,
  serverAction,
}: Props) {
  return (
    <div className="min-h-screen bg-black text-white">
      <header className="border-b border-neutral-900">
        <div className="mx-auto max-w-[720px] px-4 py-4 flex items-center justify-between">
          <span className="text-sm tracking-[0.2em] uppercase text-[#b08d57]">
            MBR
          </span>
          <span className="text-xs text-neutral-500">
            {mode === 'agent' ? 'Advisor booking' : 'Book an appointment'}
          </span>
        </div>
      </header>

      <main className="mx-auto max-w-[720px] px-4 py-6 pb-24 md:pb-10">
        <BookingFormClient
          mode={mode}
          services={services}
          prefill={prefill}
          serverAction={serverAction}
        />
      </main>
    </div>
  );
}
