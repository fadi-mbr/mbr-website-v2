"use client";

/**
 * SlotPicker — 14-day date strip + slot list for the selected day.
 *
 * Lazy-fetches `/api/booking/slots?date=YYYY-MM-DD&duration_h=N` whenever
 * the selected day or duration changes. Cancels in-flight requests via
 * AbortController when the user picks a different day mid-flight.
 *
 * Times are rendered in Asia/Dubai local using Intl + the explicit IANA tz.
 */

import React, { useEffect, useMemo, useRef, useState } from 'react';

export interface SlotValue {
  dateIso?: string;
  timeStartMs?: number;
}

interface Slot {
  startMs: number;
  endMs: number;
}

interface Props {
  value: SlotValue;
  onChange: (v: SlotValue) => void;
  selectedServiceId?: number;
  selectedDurationH?: number;
}

const DUBAI_TZ = 'Asia/Dubai';
const DUBAI_OFFSET_MS = 4 * 60 * 60 * 1000; // UTC+4, no DST

type LoadState =
  | { kind: 'idle' }
  | { kind: 'loading' }
  | { kind: 'ok'; slots: Slot[] }
  | { kind: 'error'; reason: string };

/** Build the 14 day chip descriptors starting tomorrow (Dubai-local). */
function buildDayChips(): Array<{
  iso: string;
  weekday: string;
  dayNum: string;
  month: string;
}> {
  const now = Date.now();
  const chips: Array<{
    iso: string;
    weekday: string;
    dayNum: string;
    month: string;
  }> = [];
  for (let i = 1; i <= 14; i++) {
    const t = now + i * 24 * 60 * 60 * 1000;
    const d = new Date(t);
    // Format the date in Dubai local — derive YYYY-MM-DD from the parts.
    const parts = new Intl.DateTimeFormat('en-CA', {
      timeZone: DUBAI_TZ,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }).format(d);
    // en-CA gives YYYY-MM-DD already.
    const iso = parts;
    const weekday = new Intl.DateTimeFormat('en-US', {
      timeZone: DUBAI_TZ,
      weekday: 'short',
    }).format(d);
    const dayNum = new Intl.DateTimeFormat('en-US', {
      timeZone: DUBAI_TZ,
      day: 'numeric',
    }).format(d);
    const month = new Intl.DateTimeFormat('en-US', {
      timeZone: DUBAI_TZ,
      month: 'short',
    }).format(d);
    chips.push({ iso, weekday, dayNum, month });
  }
  return chips;
}

function formatSlotTime(ms: number): string {
  return new Intl.DateTimeFormat('en-US', {
    timeZone: DUBAI_TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(ms));
}

export default function SlotPicker({
  value,
  onChange,
  selectedServiceId,
  selectedDurationH,
}: Props) {
  const dayChips = useMemo(buildDayChips, []);
  const [state, setState] = useState<LoadState>({ kind: 'idle' });
  const [retryKey, setRetryKey] = useState(0);
  const abortRef = useRef<AbortController | null>(null);

  const selectedDate = value.dateIso;
  const durationH = selectedDurationH;

  useEffect(() => {
    // Cancel any prior in-flight request.
    abortRef.current?.abort();
    if (!selectedDate || !durationH) {
      setState({ kind: 'idle' });
      return;
    }
    const ctrl = new AbortController();
    abortRef.current = ctrl;
    setState({ kind: 'loading' });
    fetch(
      `/api/booking/slots?date=${encodeURIComponent(selectedDate)}&duration_h=${durationH}`,
      { signal: ctrl.signal }
    )
      .then(async (r) => {
        if (!r.ok) throw new Error(`status_${r.status}`);
        const slots: Slot[] = await r.json();
        if (!ctrl.signal.aborted) {
          setState({ kind: 'ok', slots });
        }
      })
      .catch((err: unknown) => {
        if (ctrl.signal.aborted) return;
        const msg = err instanceof Error ? err.message : String(err);
        setState({ kind: 'error', reason: msg });
      });
    return () => {
      ctrl.abort();
    };
  }, [selectedDate, durationH, retryKey]);

  // If the user changes the service (different duration), wipe the chosen
  // slot timestamp; the previously valid slot may no longer fit.
  useEffect(() => {
    if (value.timeStartMs != null) {
      onChange({ dateIso: value.dateIso, timeStartMs: undefined });
    }
    // We intentionally depend only on serviceId/duration here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedServiceId, durationH]);

  const needsService = !selectedServiceId || !durationH;

  return (
    <div className="space-y-4">
      <div>
        <p className="text-sm text-neutral-400 mb-2">Pick a day</p>
        <div
          className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 snap-x snap-mandatory"
          role="group"
          aria-label="Booking day"
        >
          {dayChips.map((chip) => {
            const isSelected = chip.iso === selectedDate;
            return (
              <button
                key={chip.iso}
                type="button"
                onClick={() =>
                  onChange({ dateIso: chip.iso, timeStartMs: undefined })
                }
                aria-pressed={isSelected}
                className={[
                  'snap-start shrink-0 flex flex-col items-center justify-center',
                  'w-16 h-20 rounded-lg border transition-all duration-150',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E30613] focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                  isSelected
                    ? 'border-[#E30613] bg-gradient-to-b from-[#E30613]/20 to-[#E30613]/5 text-white shadow-[0_0_0_1px_rgba(227,6,19,0.4)]'
                    : 'border-white/10 bg-white/[0.02] text-white hover:border-[#E30613]/60 hover:bg-white/[0.04]',
                ].join(' ')}
              >
                <span className="text-[10px] uppercase tracking-wide opacity-80">
                  {chip.weekday}
                </span>
                <span className="text-lg font-semibold leading-none mt-1">
                  {chip.dayNum}
                </span>
                <span className="text-[10px] uppercase tracking-wide opacity-80 mt-1">
                  {chip.month}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-sm text-neutral-400 mb-2">Pick a time</p>
        <div className="max-h-72 overflow-y-auto pr-1">
          {needsService && (
            <p className="text-sm text-neutral-500 py-6 text-center">
              Choose a service first.
            </p>
          )}
          {!needsService && !selectedDate && (
            <p className="text-sm text-neutral-500 py-6 text-center">
              Choose a day above.
            </p>
          )}
          {!needsService && selectedDate && state.kind === 'loading' && (
            <p
              className="text-sm text-neutral-500 py-6 text-center"
              role="status"
              aria-live="polite"
            >
              Loading available times…
            </p>
          )}
          {!needsService && selectedDate && state.kind === 'error' && (
            <div
              className="text-sm text-red-300 py-4 px-3 rounded border border-red-900/60 bg-red-950/30"
              role="alert"
              aria-live="polite"
            >
              <p>Couldn’t load available times.</p>
              <button
                type="button"
                onClick={() => setRetryKey((k) => k + 1)}
                className="mt-2 px-3 py-1 rounded border border-[#E30613] text-[#E30613] hover:bg-[#E30613] hover:text-black focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E30613]"
              >
                Try again
              </button>
            </div>
          )}
          {!needsService &&
            selectedDate &&
            state.kind === 'ok' &&
            state.slots.length === 0 && (
              <p className="text-sm text-neutral-500 py-6 text-center">
                No slots available on this day. Try another date.
              </p>
            )}
          {!needsService &&
            selectedDate &&
            state.kind === 'ok' &&
            state.slots.length > 0 && (
              <ul
                className="grid grid-cols-2 sm:grid-cols-3 gap-2"
                aria-label="Available times"
              >
                {state.slots.map((s) => {
                  const isSelected = s.startMs === value.timeStartMs;
                  return (
                    <li key={s.startMs}>
                      <button
                        type="button"
                        onClick={() =>
                          onChange({
                            dateIso: selectedDate,
                            timeStartMs: s.startMs,
                          })
                        }
                        aria-pressed={isSelected}
                        className={[
                          'w-full px-3 py-2 rounded-lg border text-sm transition-all duration-150',
                          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E30613] focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                          isSelected
                            ? 'border-[#E30613] bg-gradient-to-br from-[#E30613]/20 to-[#E30613]/5 text-white font-medium shadow-[0_0_0_1px_rgba(227,6,19,0.4)]'
                            : 'border-white/10 bg-white/[0.02] text-white hover:border-[#E30613]/60 hover:bg-white/[0.04]',
                        ].join(' ')}
                      >
                        {formatSlotTime(s.startMs)}
                      </button>
                    </li>
                  );
                })}
              </ul>
            )}
        </div>
      </div>
    </div>
  );
}

// Suppress unused warning when this util ever becomes useful elsewhere.
void DUBAI_OFFSET_MS;
