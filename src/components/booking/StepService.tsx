"use client";

import React, { useEffect, useState } from 'react';
import { FaCheck } from 'react-icons/fa';
import { t, formatNumber, type Lang } from '@/lib/booking-i18n';
import type { BookingService } from '@/lib/booking-types';

interface Props {
  lang: Lang;
  selectedId: number | null;
  onSelect: (s: BookingService) => void;
  onContinue: () => void;
}

type LoadState =
  | { kind: 'loading' }
  | { kind: 'ok'; services: BookingService[] }
  | { kind: 'error' };

export default function StepService({ lang, selectedId, onSelect, onContinue }: Props) {
  const [state, setState] = useState<LoadState>({ kind: 'loading' });
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    let cancelled = false;
    setState({ kind: 'loading' });
    fetch('/api/booking/services', { headers: { 'Accept-Language': lang } })
      .then(async (r) => {
        if (!r.ok) throw new Error(`status_${r.status}`);
        const services: BookingService[] = await r.json();
        if (!cancelled) {
          setState({ kind: 'ok', services });
        }
      })
      .catch(() => {
        if (!cancelled) setState({ kind: 'error' });
      });
    return () => {
      cancelled = true;
    };
  }, [lang, reloadKey]);

  return (
    <section
      aria-labelledby="booking-step-1-heading"
      className="booking-step"
      data-step="1"
    >
      <h2 id="booking-step-1-heading" className="text-heading font-light text-white mb-3">
        {t('step1Heading', lang)}
      </h2>
      <p className="text-body text-[var(--text-muted)] mb-8">{t('step1Hint', lang)}</p>

      {state.kind === 'loading' && (
        <div className="booking-loading" role="status" aria-live="polite">
          <span className="booking-spinner" aria-hidden="true" />
          <span>{t('servicesLoading', lang)}</span>
        </div>
      )}

      {state.kind === 'error' && (
        <div className="booking-error glass-card-subtle p-6" role="alert">
          <p className="text-body text-white mb-4">{t('servicesError', lang)}</p>
          <button
            type="button"
            onClick={() => setReloadKey((k) => k + 1)}
            className="liquid-glass-btn liquid-glass-btn-small liquid-glass-btn-secondary"
          >
            {t('retry', lang)}
          </button>
        </div>
      )}

      {state.kind === 'ok' && (
        <div role="radiogroup" aria-labelledby="booking-step-1-heading" className="booking-service-grid">
          {state.services.map((s) => {
            const selected = s.id === selectedId;
            const dur =
              s.duration_h === 1
                ? t('duration1h', lang)
                : t('durationHours', lang, { n: s.duration_h });
            const price =
              s.price != null
                ? t('priceAed', lang, { price: formatNumber(s.price, lang) })
                : '';
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => onSelect(s)}
                className="booking-service-card glass-card glass-content p-6 text-start"
                data-selected={selected}
              >
                <div className="booking-service-card__title">
                  <h3 className="text-subheading text-white font-medium">{s.title}</h3>
                  {selected && (
                    <FaCheck className="booking-service-card__check" aria-hidden="true" />
                  )}
                </div>
                <div className="booking-service-card__meta">
                  <span className="booking-meta-pill">{dur}</span>
                  {price && <span className="booking-meta-pill booking-meta-pill--bronze">{price}</span>}
                </div>
              </button>
            );
          })}
        </div>
      )}

      <div className="booking-step__cta">
        <button
          type="button"
          onClick={onContinue}
          disabled={state.kind !== 'ok' || selectedId == null}
          className="liquid-glass-btn liquid-glass-btn-primary booking-step__continue"
        >
          {t('continue', lang)}
        </button>
      </div>
    </section>
  );
}
