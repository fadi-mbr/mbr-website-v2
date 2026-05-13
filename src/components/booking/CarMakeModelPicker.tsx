'use client';

/**
 * CarMakeModelPicker — two coupled combobox inputs (Make, Model).
 *
 * - Make and Model each use a minimal in-file combobox primitive (text
 *   input + filtered dropdown). No new npm deps.
 * - The synthetic OTHER option lets the user fall back to a free-text
 *   input when the catalog doesn't cover their vehicle.
 * - Keyboard navigation: ArrowDown / ArrowUp / Enter / Escape.
 *
 * Selection state lives in the parent (BookingFormClient) so the form can
 * read all six related fields (make / customMake / model / customModel)
 * at submit time.
 */

import React, { useEffect, useId, useMemo, useRef, useState } from 'react';
import {
  ALL_MAKES_PLUS_OTHER,
  OTHER_LABEL,
  OTHER_SENTINEL,
  searchMakes,
  searchModels,
} from '@/lib/car-catalog';

interface Props {
  make: string;
  setMake: (v: string) => void;
  customMake: string;
  setCustomMake: (v: string) => void;
  model: string;
  setModel: (v: string) => void;
  customModel: string;
  setCustomModel: (v: string) => void;
  errors?: { make?: string; model?: string };
  onBlur?: (field: 'make' | 'model') => void;
}

/* ------------------------------------------------------------------ */
/* Tiny combobox primitive                                              */
/* ------------------------------------------------------------------ */

interface ComboBoxProps {
  id: string;
  label: string;
  required?: boolean;
  /** Friendly label for the current value (e.g. "Other (type in)"). */
  displayValue: string;
  /** Filter callback: returns the list to show given the typed query. */
  filter: (q: string) => string[];
  /** Called when the user picks an option from the list. */
  onSelect: (value: string) => void;
  /** Called when the input loses focus, after any selection has fired. */
  onBlur?: () => void;
  /** Optional error message to render below. */
  error?: string;
  /** Disable input + dropdown (e.g. Model before Make is picked). */
  disabled?: boolean;
  placeholder?: string;
  /** Format the option label for display in the list. */
  formatOption?: (raw: string) => string;
}

function ComboBox({
  id,
  label,
  required,
  displayValue,
  filter,
  onSelect,
  onBlur,
  error,
  disabled,
  placeholder,
  formatOption,
}: ComboBoxProps) {
  const inputId = `booking-${id}`;
  const listId = `${inputId}-listbox`;
  const errId = error ? `${inputId}-err` : undefined;
  const [query, setQuery] = useState('');
  const [open, setOpen] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  const options = useMemo(() => filter(query), [filter, query]);

  // Reset the typed query when the externally-selected value changes
  // (e.g. parent resets Model when Make changes).
  useEffect(() => {
    setQuery('');
  }, [displayValue]);

  // Outside-click closes the dropdown without committing the typed text.
  useEffect(() => {
    if (!open) return;
    const onDocClick = (ev: MouseEvent) => {
      if (!wrapperRef.current?.contains(ev.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', onDocClick);
    return () => document.removeEventListener('mousedown', onDocClick);
  }, [open]);

  const handleKeyDown = (ev: React.KeyboardEvent<HTMLInputElement>) => {
    if (disabled) return;
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      if (!open) setOpen(true);
      setActiveIdx((i) => Math.min(options.length - 1, i + 1));
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      setActiveIdx((i) => Math.max(0, i - 1));
    } else if (ev.key === 'Enter') {
      if (open && options[activeIdx] !== undefined) {
        ev.preventDefault();
        onSelect(options[activeIdx]);
        setOpen(false);
        setQuery('');
      }
    } else if (ev.key === 'Escape') {
      setOpen(false);
    }
  };

  const inputValue = open ? query : displayValue;

  return (
    <div ref={wrapperRef} className="relative">
      <label
        htmlFor={inputId}
        className="block text-xs uppercase tracking-wide text-neutral-400 mb-1"
      >
        {label}
        {required && (
          <span aria-hidden="true" className="text-[#b08d57] ml-1">
            *
          </span>
        )}
      </label>
      <input
        ref={inputRef}
        id={inputId}
        type="text"
        role="combobox"
        aria-expanded={open}
        aria-controls={listId}
        aria-autocomplete="list"
        aria-activedescendant={
          open && options[activeIdx] !== undefined
            ? `${inputId}-opt-${activeIdx}`
            : undefined
        }
        aria-invalid={error ? true : undefined}
        aria-describedby={errId}
        autoComplete="off"
        disabled={disabled}
        placeholder={placeholder}
        value={inputValue}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
          setActiveIdx(0);
        }}
        onFocus={() => !disabled && setOpen(true)}
        onBlur={() => {
          // Defer to allow click-on-option to register first.
          setTimeout(() => {
            setOpen(false);
            onBlur?.();
          }, 120);
        }}
        onKeyDown={handleKeyDown}
        className={[
          'w-full rounded border bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-500',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b08d57]',
          disabled ? 'opacity-50 cursor-not-allowed' : '',
          error ? 'border-red-700' : 'border-neutral-700',
        ].join(' ')}
      />
      {open && options.length > 0 && (
        <ul
          id={listId}
          role="listbox"
          className="absolute z-20 mt-1 max-h-60 w-full overflow-auto rounded border border-neutral-700 bg-neutral-900 shadow-lg"
        >
          {options.map((opt, i) => {
            const label = formatOption ? formatOption(opt) : opt;
            const active = i === activeIdx;
            return (
              <li
                key={`${opt}-${i}`}
                id={`${inputId}-opt-${i}`}
                role="option"
                aria-selected={active}
                onMouseDown={(e) => {
                  // Prevent the input blur from beating us to the punch.
                  e.preventDefault();
                  onSelect(opt);
                  setOpen(false);
                  setQuery('');
                }}
                onMouseEnter={() => setActiveIdx(i)}
                className={[
                  'cursor-pointer px-3 py-2 text-sm',
                  active
                    ? 'bg-[#b08d57] text-black'
                    : 'text-white hover:bg-neutral-800',
                  opt === OTHER_SENTINEL ? 'italic text-neutral-300' : '',
                ].join(' ')}
              >
                {label}
              </li>
            );
          })}
        </ul>
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

/* ------------------------------------------------------------------ */
/* Picker                                                              */
/* ------------------------------------------------------------------ */

function makeDisplay(make: string): string {
  if (!make) return '';
  if (make === OTHER_SENTINEL) return OTHER_LABEL;
  return make;
}

function modelDisplay(model: string): string {
  if (!model) return '';
  if (model === OTHER_SENTINEL) return OTHER_LABEL;
  return model;
}

function formatMakeOption(opt: string): string {
  return opt === OTHER_SENTINEL ? OTHER_LABEL : opt;
}

export default function CarMakeModelPicker({
  make,
  setMake,
  customMake,
  setCustomMake,
  model,
  setModel,
  customModel,
  setCustomModel,
  errors,
  onBlur,
}: Props) {
  const reactId = useId();
  const otherMakeId = `booking-customMake-${reactId}`;
  const otherModelId = `booking-customModel-${reactId}`;

  const isMakeOther = make === OTHER_SENTINEL;
  const isModelOther = model === OTHER_SENTINEL;

  // When picking Make, always reset Model so we don't carry stale state.
  const handleSelectMake = (v: string) => {
    setMake(v);
    setModel('');
    setCustomModel('');
    if (v !== OTHER_SENTINEL) setCustomMake('');
  };

  const handleSelectModel = (v: string) => {
    setModel(v);
    if (v !== OTHER_SENTINEL) setCustomModel('');
  };

  // Model filter is keyed on the current make.
  const modelFilter = useMemo(
    () => (q: string) => {
      if (!make || isMakeOther) return [];
      return searchModels(make, q);
    },
    [make, isMakeOther]
  );

  return (
    <>
      <div>
        <ComboBox
          id="vehicleMake"
          label="Make"
          required
          displayValue={makeDisplay(make)}
          filter={(q) => (q ? searchMakes(q) : ALL_MAKES_PLUS_OTHER.slice())}
          onSelect={handleSelectMake}
          onBlur={() => onBlur?.('make')}
          error={errors?.make}
          placeholder="Search makes…"
          formatOption={formatMakeOption}
        />
        {isMakeOther && (
          <div className="mt-2">
            <label
              htmlFor={otherMakeId}
              className="block text-xs uppercase tracking-wide text-neutral-400 mb-1"
            >
              Specify make
              <span aria-hidden="true" className="text-[#b08d57] ml-1">*</span>
            </label>
            <input
              id={otherMakeId}
              type="text"
              value={customMake}
              onChange={(e) => setCustomMake(e.target.value)}
              onBlur={() => onBlur?.('make')}
              autoComplete="off"
              placeholder="Type the make"
              className={[
                'w-full rounded border bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-500',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b08d57]',
                errors?.make ? 'border-red-700' : 'border-neutral-700',
              ].join(' ')}
            />
          </div>
        )}
      </div>
      <div>
        <ComboBox
          id="vehicleModel"
          label="Model"
          required
          displayValue={modelDisplay(model)}
          filter={modelFilter}
          onSelect={handleSelectModel}
          onBlur={() => onBlur?.('model')}
          error={errors?.model}
          disabled={!make || isMakeOther}
          placeholder={
            !make
              ? 'Pick a make first'
              : isMakeOther
                ? 'Use the field below'
                : 'Search models…'
          }
          formatOption={formatMakeOption}
        />
        {(isMakeOther || isModelOther) && (
          <div className="mt-2">
            <label
              htmlFor={otherModelId}
              className="block text-xs uppercase tracking-wide text-neutral-400 mb-1"
            >
              Specify model
              <span aria-hidden="true" className="text-[#b08d57] ml-1">*</span>
            </label>
            <input
              id={otherModelId}
              type="text"
              value={customModel}
              onChange={(e) => setCustomModel(e.target.value)}
              onBlur={() => onBlur?.('model')}
              autoComplete="off"
              placeholder="Type the model"
              className={[
                'w-full rounded border bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-500',
                'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b08d57]',
                errors?.model ? 'border-red-700' : 'border-neutral-700',
              ].join(' ')}
            />
          </div>
        )}
      </div>
    </>
  );
}
