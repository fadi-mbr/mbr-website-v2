"use client";

import React from 'react';
import { t, type Lang } from '@/lib/booking-i18n';

interface StepperProps {
  current: number; // 1..5
  lang: Lang;
}

/**
 * Five-dot progress indicator. Mobile-first: dots only on phone,
 * dots + label on tablet+. Selected step gets the bronze accent.
 */
export default function Stepper({ current, lang }: StepperProps) {
  const steps: Array<{ n: number; key: 'stepLabelService' | 'stepLabelDate' | 'stepLabelTime' | 'stepLabelDetails' | 'stepLabelDone' }> = [
    { n: 1, key: 'stepLabelService' },
    { n: 2, key: 'stepLabelDate' },
    { n: 3, key: 'stepLabelTime' },
    { n: 4, key: 'stepLabelDetails' },
    { n: 5, key: 'stepLabelDone' },
  ];
  return (
    <ol
      aria-label={t('stepIndicator', lang, { n: current })}
      className="booking-stepper"
      data-current={current}
    >
      {steps.map((s) => {
        const state =
          s.n < current ? 'done' : s.n === current ? 'active' : 'upcoming';
        return (
          <li key={s.n} data-state={state} className="booking-stepper__item">
            <span className="booking-stepper__dot" aria-hidden="true">
              {s.n}
            </span>
            <span className="booking-stepper__label">{t(s.key, lang)}</span>
          </li>
        );
      })}
    </ol>
  );
}
