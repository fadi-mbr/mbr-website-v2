"use client";

import React from 'react';
import { t, type Lang } from '@/lib/booking-i18n';

interface Props {
  lang: Lang;
  onChange: (next: Lang) => void;
}

/**
 * Two-button language toggle. Renders the "other" language label so the
 * affordance is "switch to X" rather than "current is Y".
 */
export default function LanguageToggle({ lang, onChange }: Props) {
  const next: Lang = lang === 'en' ? 'ar' : 'en';
  return (
    <button
      type="button"
      onClick={() => onChange(next)}
      className="booking-lang-toggle"
      aria-label={`Switch to ${next === 'ar' ? 'Arabic' : 'English'}`}
    >
      <span aria-hidden="true">{t('langLabel', lang)}</span>
    </button>
  );
}
