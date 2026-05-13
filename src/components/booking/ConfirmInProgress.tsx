'use client';

/**
 * Client-side "we're confirming your booking" view.
 *
 * Mounted by the `/book/confirm` Server Component once the token's
 * signature is verified. On mount we POST the (already-validated) token
 * to `/api/booking/confirm` so the slow ARC submit happens async and
 * the customer sees a spinner inside ~100ms instead of waiting 3-5s on
 * a blank server-rendered page.
 *
 * The response shape mirrors `ConfirmResult` from
 * `src/lib/booking-confirm.ts` 1:1, so we can just dispatch on `kind`.
 */

import { useEffect, useRef, useState } from 'react';
import {
  ConfirmErrorCard,
  invalidTokenCopy,
  submitFailedCopy,
} from './ConfirmErrorCard';
import { ConfirmSuccessCard } from './ConfirmSuccessCard';

interface OkResponse {
  kind: 'ok';
  intent: {
    firstName: string;
    vehicleYear: number;
    vehicleMake: string;
    vehicleModel: string;
    plate?: string;
    notes?: string;
    timeStartMs: number;
    serviceId: number;
    serviceName: string;
  };
  tokenId: string;
  arcAppointmentId?: number;
  serviceName: string;
  estimatedDuration: number;
}

interface InvalidTokenResponse {
  kind: 'invalid-token';
  reason: 'malformed' | 'bad-signature' | 'expired' | 'bad-version';
}

interface SubmitFailedResponse {
  kind: 'submit-failed';
  code: string;
  message: string;
}

type ConfirmResponse = OkResponse | InvalidTokenResponse | SubmitFailedResponse;

interface State {
  status: 'loading' | 'done';
  result?: ConfirmResponse;
  /** Network / parse error if the route itself was unreachable. */
  networkError?: string;
}

export function ConfirmInProgress({ token }: { token: string }) {
  const [state, setState] = useState<State>({ status: 'loading' });
  // React 18+ StrictMode (and accidental re-fires) can run this effect twice.
  // The first run kicks off the POST, then cleanup runs and a SECOND run
  // fires another POST before the first network call has returned. The
  // server creates the ARC record on call 1, then call 2 sees NO_TIME (slot
  // now taken by call 1) and the UI shows an error even though the booking
  // succeeded. Use a ref so the network call only ever fires once per
  // component instance. (Page reload still hits the server again, which is
  // why the server is ALSO idempotent on tokenId — see /api/booking/confirm.)
  const triggered = useRef(false);

  useEffect(() => {
    if (triggered.current) return;
    triggered.current = true;
    (async () => {
      try {
        const res = await fetch('/api/booking/confirm', {
          method: 'POST',
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ token }),
        });
        const json = (await res.json()) as ConfirmResponse;
        setState({ status: 'done', result: json });
      } catch (e) {
        setState({
          status: 'done',
          networkError: e instanceof Error ? e.message : 'Network error',
        });
      }
    })();
  }, [token]);

  if (state.status === 'loading') {
    return (
      <div className="min-h-screen bg-black text-white">
        <main className="mx-auto max-w-[720px] px-4 py-16">
          <div className="rounded-lg border border-[#b08d57]/40 bg-neutral-950 p-6 flex items-center gap-4">
            <span
              className="inline-block h-6 w-6 rounded-full border-2 border-[#b08d57] border-t-transparent animate-spin"
              aria-hidden="true"
            />
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#b08d57] mb-1">
                One moment
              </p>
              <p className="text-base text-white">
                Confirming your booking with the workshop…
              </p>
              <p className="text-xs text-neutral-400 mt-1">
                This usually takes a few seconds.
              </p>
            </div>
          </div>
        </main>
      </div>
    );
  }

  if (state.networkError) {
    return (
      <ConfirmErrorCard
        heading="Something went wrong"
        body={`We couldn't reach the booking service (${state.networkError}). Please try again or contact us.`}
      />
    );
  }

  const result = state.result;
  if (!result) {
    // Defensive — shouldn't hit. Treat as generic failure.
    return (
      <ConfirmErrorCard
        heading="Something went wrong"
        body="We couldn't process your confirmation. Please try again or contact us."
      />
    );
  }

  if (result.kind === 'invalid-token') {
    const copy = invalidTokenCopy(result.reason);
    return <ConfirmErrorCard heading={copy.heading} body={copy.body} />;
  }
  if (result.kind === 'submit-failed') {
    const copy = submitFailedCopy(result.code, result.message);
    return <ConfirmErrorCard heading={copy.heading} body={copy.body} />;
  }

  // ok
  return (
    <ConfirmSuccessCard
      firstName={result.intent.firstName}
      serviceName={result.serviceName}
      arcAppointmentId={result.arcAppointmentId}
      timeStartMs={result.intent.timeStartMs}
      estimatedDuration={result.estimatedDuration}
      vehicleYear={result.intent.vehicleYear}
      vehicleMake={result.intent.vehicleMake}
      vehicleModel={result.intent.vehicleModel}
      plate={result.intent.plate}
      notes={result.intent.notes}
      tokenId={result.tokenId}
    />
  );
}
