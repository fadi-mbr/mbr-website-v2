"use client";

import React, { useEffect, useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { t, type Lang } from '@/lib/booking-i18n';
import { formatSlotTime, formatDateLabel } from '@/lib/booking-dates';
import type { BookingSlot } from '@/lib/booking-types';

interface Props {
  lang: Lang;
  dateIso: string;
  dateLabelDate: Date;
  durationH: number;
  selectedStartMs: number | null;
  onSelect: (slot: BookingSlot) => void;
  onContinue: () => void;
  onBack: () => void;
}

type State =
  | { kind: 'loading' }
  | { kind: 'ok'; slots: BookingSlot[] }
  | { kind: 'empty' }
  | { kind: 'error' };

const WHATSAPP_FALLBACK =
  'https://wa.me/+971565015800?text=' +
  encodeURIComponent('Hello MBR, I would like to book a service appointment.');

export default function StepTime({
  lang,
  dateIso,
  dateLabelDate,
  durationH,
  selectedStartMs,
  onSelect,
  onContinue,
  onBack,
}: Props) {
  const [state, setState] = useState<State>({ kind: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    const url = `/api/booking/slots?date=${encodeURIComponent(dateIso)}&duration_h=${durationH}`;
    fetch(url, { headers: { 'Accept-Language': lang } })
      .then(async (r) => {
        if (!r.ok) throw new Error(`status_${r.status}`);
        const slots: BookingSlot[] = await r.json();
        if (cancelled) return;
        if (slots.length === 0) setState({ kind: 'empty' });
        else setState({ kind: 'ok', slots });
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [dateIso, durationH, lang, reloadKey]);

  return (
    <section
      aria-labelledby="booking-step-3-heading"
      className="booking-step"
      data-step="3"
    >
      <h2 id="booking-step-3-heading" className="text-heading font-light text-white mb-3">
        {t('step3Heading', lang)}
      </h2>
      <p className="text-body text-[var(--text-muted)] mb-6">
        {formatDateLabel(dateLabelDate, lang)}
      </p>

      {state.kind === 'loading' && (
        <div
          className="booking-loading"
          role="status"
          aria-live="polite"
          aria-busy="true"
        >
          <span className="booking-spinner" aria-hidden="true" />
          <span>{t('slotsLoading', lang, { date: formatDateLabel(dateLabelDate, lang) })}</span>
        </div>
      )}

      {state.kind === 'empty' && (
        <div className="booking-empty glass-card-subtle p-6" role="status">
          <p className="text-body text-white mb-4">{t('slotsEmpty', lang)}</p>
          <button
            type="button"
            onClick={onBack}
            className="liquid-glass-btn liquid-glass-btn-small liquid-glass-btn-secondary"
          >
            {t('changeDate', lang)}
          </button>
        </div>
      )}

      {state.kind === 'error' && (
        <div className="booking-error glass-card-subtle p-6" role="alert">
          <p className="text-body text-white mb-4">{t('slotsError', lang)}</p>
          <div className="booking-error__actions">
            <button
              type="button"
              onClick={() => setReloadKey((k) => k + 1)}
              className="liquid-glass-btn liquid-glass-btn-small liquid-glass-btn-secondary"
            >
              {t('retry', lang)}
            </button>
            <a
              href={WHATSAPP_FALLBACK}
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-glass-btn liquid-glass-btn-small liquid-glass-btn-primary booking-wa-link"
            >
              <FaWhatsapp className="w-4 h-4" aria-hidden="true" />
              <span>{t('chatToBook', lang)}</span>
            </a>
          </div>
        </div>
      )}

      {state.kind === 'ok' && (
        <div
          role="radiogroup"
          aria-labelledby="booking-step-3-heading"
          className="booking-slot-grid"
        >
          {state.slots.map((slot) => {
            const selected = slot.startMs === selectedStartMs;
            return (
              <button
                key={`${slot.startMs}-${slot.workerName}`}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onSelect(slot)}
                className="booking-slot-pill"
                data-selected={selected}
              >
                {formatSlotTime(slot.startMs, lang)}
              </button>
            );
          })}
        </div>
      )}

      <div className="booking-step__cta">
        <button
          type="button"
          onClick={onBack}
          className="liquid-glass-btn liquid-glass-btn-secondary liquid-glass-btn-small"
        >
          {t('back', lang)}
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={state.kind !== 'ok' || selectedStartMs == null}
          className="liquid-glass-btn liquid-glass-btn-primary booking-step__continue"
        >
          {t('continue', lang)}
        </button>
      </div>
    </section>
  );
}
