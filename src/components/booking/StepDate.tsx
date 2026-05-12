"use client";

import React, { useMemo } from 'react';
import { t, type Lang } from '@/lib/booking-i18n';
import { nextDays, formatPill } from '@/lib/booking-dates';

interface Props {
  lang: Lang;
  selectedIso: string | null;
  onSelect: (iso: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

/**
 * Step 2 — 14-day horizontally-scrollable date strip. Closed days
 * (Sunday) are rendered disabled with a faint "Closed" label so the
 * weekly rhythm is still visible.
 */
export default function StepDate({ lang, selectedIso, onSelect, onContinue, onBack }: Props) {
  const days = useMemo(() => nextDays(14), []);
  return (
    <section
      aria-labelledby="booking-step-2-heading"
      className="booking-step"
      data-step="2"
    >
      <h2 id="booking-step-2-heading" className="text-heading font-light text-white mb-3">
        {t('step2Heading', lang)}
      </h2>
      <p className="text-body text-[var(--text-muted)] mb-8">{t('step2Hint', lang)}</p>

      <div
        role="radiogroup"
        aria-labelledby="booking-step-2-heading"
        className="booking-date-strip"
      >
        {days.map((d) => {
          const selected = d.iso === selectedIso;
          const { dow, dom } = formatPill(d.date, lang);
          const disabled = !d.isOpen;
          return (
            <button
              key={d.iso}
              type="button"
              role="radio"
              aria-checked={selected}
              aria-disabled={disabled}
              disabled={disabled}
              onClick={() => !disabled && onSelect(d.iso)}
              className="booking-date-pill"
              data-selected={selected}
              data-closed={disabled}
              data-today={d.isToday}
            >
              <span className="booking-date-pill__dow">{dow}</span>
              <span className="booking-date-pill__dom">{dom}</span>
              {disabled && (
                <span className="booking-date-pill__closed">{t('closedSunday', lang)}</span>
              )}
              {d.isToday && !disabled && (
                <span className="booking-date-pill__badge">{t('today', lang)}</span>
              )}
            </button>
          );
        })}
      </div>

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
          disabled={!selectedIso}
          className="liquid-glass-btn liquid-glass-btn-primary booking-step__continue"
        >
          {t('continue', lang)}
        </button>
      </div>
    </section>
  );
}
