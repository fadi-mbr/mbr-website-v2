"use client";

import React, { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { readStoredLang, writeStoredLang, isRtl, type Lang } from '@/lib/booking-i18n';
import { trackEvent } from '@/lib/analytics';
import type {
  BookingRequest,
  BookingService,
  BookingSlot,
  BookingSuccess,
} from '@/lib/booking-types';
import { notifyParentBooked, type EmbedContext } from '@/lib/embed-mode';
import Stepper from './Stepper';
import StepService from './StepService';
import StepDate from './StepDate';
import StepTime from './StepTime';
import StepDetails, { type PartialDetails } from './StepDetails';
import StepConfirmation from './StepConfirmation';
import LanguageToggle from './LanguageToggle';
import { nextDays } from '@/lib/booking-dates';

type Step = 1 | 2 | 3 | 4 | 5;

interface State {
  step: Step;
  service: BookingService | null;
  dateIso: string | null;
  slot: BookingSlot | null;
  details: PartialDetails;
  result: { request: BookingRequest; response: BookingSuccess } | null;
}

type Action =
  | { type: 'set_service'; service: BookingService }
  | { type: 'set_date'; dateIso: string }
  | { type: 'set_slot'; slot: BookingSlot }
  | { type: 'set_details'; details: PartialDetails }
  | { type: 'goto'; step: Step }
  | { type: 'success'; request: BookingRequest; response: BookingSuccess }
  | { type: 'reset' };

const EMPTY_DETAILS: PartialDetails = {
  ownerNameFirst: '',
  ownerNameLast: '',
  vehicleMake: '',
  vehicleModel: '',
  vehicleYear: '',
  vehicleTrim: '',
  mileage: '',
  concern: '',
};

const initial: State = {
  step: 1,
  service: null,
  dateIso: null,
  slot: null,
  details: EMPTY_DETAILS,
  result: null,
};

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'set_service':
      return { ...state, service: action.service };
    case 'set_date':
      return state.dateIso === action.dateIso ? state : { ...state, dateIso: action.dateIso, slot: null };
    case 'set_slot':
      return { ...state, slot: action.slot };
    case 'set_details':
      return { ...state, details: action.details };
    case 'goto':
      return { ...state, step: action.step };
    case 'success':
      return { ...state, step: 5, result: { request: action.request, response: action.response } };
    case 'reset':
      return { ...initial, step: 1 };
  }
}

const SESSION_KEY = 'mbr_booking_state_v1';

interface PersistedState {
  step: Step;
  service: BookingService | null;
  dateIso: string | null;
  slot: BookingSlot | null;
  details: PartialDetails;
}

function loadSession(): Partial<State> | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const parsed: PersistedState = JSON.parse(raw);
    return {
      step: parsed.step,
      service: parsed.service,
      dateIso: parsed.dateIso,
      slot: parsed.slot,
      details: parsed.details,
    };
  } catch {
    return null;
  }
}

function saveSession(s: State): void {
  if (typeof window === 'undefined') return;
  const payload: PersistedState = {
    step: s.step,
    service: s.service,
    dateIso: s.dateIso,
    slot: s.slot,
    // Skip phone/email — sensitive enough that we do not re-hydrate it.
    details: s.details,
  };
  try {
    window.sessionStorage.setItem(SESSION_KEY, JSON.stringify(payload));
  } catch {
    // Quota errors etc. — silently ignore; the wizard still works.
  }
}

function clearSession(): void {
  if (typeof window === 'undefined') return;
  try {
    window.sessionStorage.removeItem(SESSION_KEY);
  } catch { /* noop */ }
}

interface BookingWizardProps {
  /** True when rendered inside the Chatwoot Dashboard App iframe. */
  embedMode?: boolean;
  /**
   * Pre-fill context — phone/name/email come from URL params or the parent
   * frame's `chatwoot:context` postMessage. `conversationId` is threaded into
   * the booking request so the server can post a confirmation back into the
   * conversation thread.
   */
  initialContext?: EmbedContext;
}

export default function BookingWizard({
  embedMode = false,
  initialContext,
}: BookingWizardProps = {}) {
  const [lang, setLang] = useState<Lang>('en');
  const [state, dispatch] = useReducer(reducer, initial, (i) => {
    const persisted = loadSession();
    if (!persisted) return i;
    // Don't restore past step 4 — the result blob isn't persisted.
    const step = (persisted.step && persisted.step < 5 ? persisted.step : 1) as Step;
    return { ...i, ...persisted, step, result: null };
  });
  const startedTrackedRef = useRef(false);

  // Initial language hydration from localStorage.
  useEffect(() => {
    setLang(readStoredLang());
  }, []);

  // Persist on every state change (except success blob).
  useEffect(() => {
    saveSession(state);
  }, [state]);

  // RTL handling — apply to the wizard container only, not <html>.
  const containerLang = lang;
  const containerDir = isRtl(lang) ? 'rtl' : 'ltr';

  // Telemetry — booking_started, fired once when the user first interacts.
  useEffect(() => {
    if (!startedTrackedRef.current) {
      startedTrackedRef.current = true;
      trackEvent('booking_started', { lang });
    }
  }, [lang]);

  /* Derived: the Date object matching the selected dateIso (for formatting). */
  const dateLabelDate = useMemo(() => {
    if (!state.dateIso) return null;
    const days = nextDays(14);
    return days.find((d) => d.iso === state.dateIso)?.date ?? null;
  }, [state.dateIso]);

  const handleLang = (next: Lang) => {
    setLang(next);
    writeStoredLang(next);
  };

  const goto = useCallback((step: Step) => dispatch({ type: 'goto', step }), []);

  const handleServiceSelect = (s: BookingService) => {
    dispatch({ type: 'set_service', service: s });
    trackEvent('booking_service_selected', { service_id: s.id, duration_h: s.duration_h });
  };

  const handleDateSelect = (iso: string) => {
    dispatch({ type: 'set_date', dateIso: iso });
    trackEvent('booking_date_selected', { date: iso });
  };

  const handleSlotSelect = (slot: BookingSlot) => {
    dispatch({ type: 'set_slot', slot });
    trackEvent('booking_slot_selected', { start_ms: slot.startMs });
  };

  const handleSuccess = (response: BookingSuccess, request: BookingRequest) => {
    dispatch({ type: 'success', request, response });
    trackEvent('booking_success', {
      service_id: request.serviceId,
      duration_h: response.estimatedDuration,
    });
    clearSession();
    // Notify parent frame (Chatwoot Dashboard App). No-op when not embedded.
    notifyParentBooked({
      serviceName: response.serviceName,
      confirmAt: new Date(request.timeStartMs).toISOString(),
      durationH: typeof response.estimatedDuration === 'number'
        ? response.estimatedDuration
        : Number(response.estimatedDuration) || 0,
      customerFirstName: request.ownerNameFirst,
      conversationId: initialContext?.conversationId,
    });
  };

  const handleSlotTaken = () => {
    trackEvent('booking_failed', { reason: 'slot_taken' });
    dispatch({ type: 'goto', step: 3 });
  };

  const handleReset = () => {
    clearSession();
    dispatch({ type: 'reset' });
  };

  // Track booking_submitted at the moment user hits the confirm button —
  // we hook it via a wrapper around submit that runs before fetch.
  // (Doing it here keeps the StepDetails component focused on the form.)
  // The actual event fires inside StepDetails' submit handler via this prop.

  return (
    <div
      className="booking-wizard"
      lang={containerLang}
      dir={containerDir}
      data-lang={containerLang}
      data-embed={embedMode ? '1' : undefined}
    >
      <div className="booking-wizard__head">
        <Stepper current={state.step} lang={lang} />
        <LanguageToggle lang={lang} onChange={handleLang} />
      </div>

      {state.step === 1 && (
        <StepService
          lang={lang}
          selectedId={state.service?.id ?? null}
          onSelect={handleServiceSelect}
          onContinue={() => goto(2)}
        />
      )}

      {state.step === 2 && (
        <StepDate
          lang={lang}
          selectedIso={state.dateIso}
          onSelect={handleDateSelect}
          onContinue={() => goto(3)}
          onBack={() => goto(1)}
        />
      )}

      {state.step === 3 && state.dateIso && state.service && dateLabelDate && (
        <StepTime
          lang={lang}
          dateIso={state.dateIso}
          dateLabelDate={dateLabelDate}
          durationH={state.service.duration_h}
          selectedStartMs={state.slot?.startMs ?? null}
          onSelect={handleSlotSelect}
          onContinue={() => goto(4)}
          onBack={() => goto(2)}
        />
      )}

      {state.step === 4 && state.service && state.slot && (
        <StepDetails
          lang={lang}
          service={state.service}
          slot={state.slot}
          initial={state.details}
          contextPrefill={{
            phone: initialContext?.phone,
            email: initialContext?.email,
            firstName: initialContext?.name,
          }}
          conversationId={initialContext?.conversationId}
          onPersist={(d) => dispatch({ type: 'set_details', details: d })}
          onSubmitStart={(req) =>
            trackEvent('booking_submitted', { service_id: req.serviceId })
          }
          onSuccess={handleSuccess}
          onSubmitFail={(reason) =>
            trackEvent('booking_failed', { reason })
          }
          onSlotTaken={handleSlotTaken}
          onBack={() => goto(3)}
        />
      )}

      {state.step === 5 && state.result && (
        <StepConfirmation
          lang={lang}
          request={state.result.request}
          response={state.result.response}
          onBookAnother={handleReset}
        />
      )}
    </div>
  );
}
