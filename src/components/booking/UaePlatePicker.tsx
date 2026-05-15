'use client';

/**
 * UaePlatePicker — emirate + category + digit-number triplet (or foreign
 * free-text fallback). Renders a live preview of the composed plate.
 *
 * Native <select> is fine here: 7 emirates + "Foreign" is short enough
 * that a heavier combobox would be overkill.
 */

import React, { useId } from 'react';
import {
  EMIRATE_NAMES_PLUS_FOREIGN,
  FOREIGN_SENTINEL,
  formatPlate,
  getCategoriesForEmirate,
  getHintForEmirate,
} from '@/lib/uae-plates';

interface Props {
  emirate: string;
  setEmirate: (v: string) => void;
  category: string;
  setCategory: (v: string) => void;
  number: string;
  setNumber: (v: string) => void;
  foreignText: string;
  setForeignText: (v: string) => void;
  error?: string;
  onBlur?: () => void;
}

export default function UaePlatePicker({
  emirate,
  setEmirate,
  category,
  setCategory,
  number,
  setNumber,
  foreignText,
  setForeignText,
  error,
  onBlur,
}: Props) {
  const rid = useId();
  const emirateId = `booking-plate-emirate-${rid}`;
  const categoryId = `booking-plate-category-${rid}`;
  const numberId = `booking-plate-number-${rid}`;
  const foreignId = `booking-plate-foreign-${rid}`;
  const errId = error ? `booking-plate-err-${rid}` : undefined;

  const isForeign = emirate === FOREIGN_SENTINEL;
  const categories = getCategoriesForEmirate(emirate);
  const hint = getHintForEmirate(emirate);

  const preview = formatPlate({ emirate, category, number, foreignText });

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
        {/* Emirate */}
        <div>
          <label
            htmlFor={emirateId}
            className="block text-xs uppercase tracking-wide text-neutral-400 mb-1"
          >
            Emirate
            <span aria-hidden="true" className="text-[#E30613] ml-1">*</span>
          </label>
          <select
            id={emirateId}
            value={emirate}
            onChange={(e) => {
              setEmirate(e.target.value);
              setCategory('');
              setNumber('');
              setForeignText('');
            }}
            onBlur={onBlur}
            aria-invalid={error ? true : undefined}
            aria-describedby={errId}
            className={[
              'w-full rounded border bg-neutral-900 px-3 py-2 text-sm text-white',
              'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E30613]',
              error ? 'border-red-700' : 'border-neutral-700',
            ].join(' ')}
          >
            <option value="">Select…</option>
            {EMIRATE_NAMES_PLUS_FOREIGN.map((e) => (
              <option key={e} value={e}>
                {e}
              </option>
            ))}
          </select>
        </div>

        {/* Category (hidden when foreign) */}
        {!isForeign && (
          <div>
            <label
              htmlFor={categoryId}
              className="block text-xs uppercase tracking-wide text-neutral-400 mb-1"
            >
              Code
              {emirate && (
                <span aria-hidden="true" className="text-[#E30613] ml-1">*</span>
              )}
            </label>
            <select
              id={categoryId}
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              onBlur={onBlur}
              disabled={!emirate}
              aria-invalid={error ? true : undefined}
              aria-describedby={errId}
              className={[
                'w-full rounded border bg-neutral-900 px-3 py-2 text-sm text-white',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E30613]',
                !emirate ? 'opacity-50 cursor-not-allowed' : '',
                error ? 'border-red-700' : 'border-neutral-700',
              ].join(' ')}
            >
              <option value="">{emirate ? 'Select…' : '—'}</option>
              {categories.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
        )}

        {/* Number (hidden when foreign) */}
        {!isForeign && (
          <div>
            <label
              htmlFor={numberId}
              className="block text-xs uppercase tracking-wide text-neutral-400 mb-1"
            >
              Number
              {emirate && (
                <span aria-hidden="true" className="text-[#E30613] ml-1">*</span>
              )}
            </label>
            <input
              id={numberId}
              type="text"
              inputMode="numeric"
              value={number}
              onChange={(e) =>
                setNumber(e.target.value.replace(/[^\d]/g, '').slice(0, 5))
              }
              onBlur={onBlur}
              disabled={!emirate}
              autoComplete="off"
              maxLength={5}
              placeholder="12345"
              aria-invalid={error ? true : undefined}
              aria-describedby={errId}
              className={[
                'w-full rounded border bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-500',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E30613]',
                !emirate ? 'opacity-50 cursor-not-allowed' : '',
                error ? 'border-red-700' : 'border-neutral-700',
              ].join(' ')}
            />
          </div>
        )}

        {/* Foreign free-text (only when foreign) */}
        {isForeign && (
          <div className="col-span-2">
            <label
              htmlFor={foreignId}
              className="block text-xs uppercase tracking-wide text-neutral-400 mb-1"
            >
              Country + plate
              <span aria-hidden="true" className="text-[#E30613] ml-1">*</span>
            </label>
            <input
              id={foreignId}
              type="text"
              value={foreignText}
              onChange={(e) => setForeignText(e.target.value.slice(0, 40))}
              onBlur={onBlur}
              autoComplete="off"
              placeholder="e.g. KSA 1234 XYZ"
              aria-invalid={error ? true : undefined}
              aria-describedby={errId}
              className={[
                'w-full rounded border bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-500',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E30613]',
                error ? 'border-red-700' : 'border-neutral-700',
              ].join(' ')}
            />
          </div>
        )}
      </div>

      {hint && !error && (
        <p className="mt-1 text-xs text-neutral-500">{hint}</p>
      )}

      {preview && (
        <p className="mt-2 text-xs text-neutral-400">
          Plate:{' '}
          <span className="font-mono text-neutral-200">{preview}</span>
        </p>
      )}

      {error && (
        <p
          id={errId}
          role="alert"
          aria-live="polite"
          className="mt-1 text-xs text-red-300"
        >
          {error}
        </p>
      )}
    </div>
  );
}
