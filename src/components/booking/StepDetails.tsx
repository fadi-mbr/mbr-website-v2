"use client";

import React, { useState } from 'react';
import { FaWhatsapp } from 'react-icons/fa';
import { t, type Lang } from '@/lib/booking-i18n';
import {
  EMAIL_RE,
  maskUaePhoneInput,
  normalizeUaePhone,
} from '@/lib/booking-phone';
import type {
  BookingRequest,
  BookingService,
  BookingSlot,
  BookingError,
  BookingSuccess,
} from '@/lib/booking-types';

interface Props {
  lang: Lang;
  service: BookingService;
  slot: BookingSlot;
  initial: PartialDetails;
  onPersist: (partial: PartialDetails) => void;
  onSubmitStart: (req: BookingRequest) => void;
  onSuccess: (resp: BookingSuccess, req: BookingRequest) => void;
  onSubmitFail: (reason: string) => void;
  onSlotTaken: () => void;     // jump back to step 3
  onBack: () => void;
}

export interface PartialDetails {
  ownerNameFirst: string;
  ownerNameLast: string;
  vehicleMake: string;
  vehicleModel: string;
  vehicleYear: string;
  vehicleTrim: string;
  mileage: string;
  concern: string;
}

type FieldErrors = Partial<Record<
  | 'ownerNameFirst'
  | 'ownerNameLast'
  | 'ownerPhone'
  | 'ownerEmail'
  | 'vehicleMake'
  | 'vehicleModel'
  | 'vehicleYear',
  string
>>;

const CURRENT_YEAR = new Date().getFullYear();
const WHATSAPP_FALLBACK =
  'https://wa.me/+971565015800?text=' +
  encodeURIComponent('Hello MBR, I would like to book a service appointment.');

export default function StepDetails({
  lang,
  service,
  slot,
  initial,
  onPersist,
  onSubmitStart,
  onSuccess,
  onSubmitFail,
  onSlotTaken,
  onBack,
}: Props) {
  const [firstName, setFirstName] = useState(initial.ownerNameFirst);
  const [lastName, setLastName] = useState(initial.ownerNameLast);
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [make, setMake] = useState(initial.vehicleMake);
  const [model, setModel] = useState(initial.vehicleModel);
  const [year, setYear] = useState(initial.vehicleYear);
  const [trim, setTrim] = useState(initial.vehicleTrim);
  const [mileage, setMileage] = useState(initial.mileage);
  const [concern, setConcern] = useState(initial.concern);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [banner, setBanner] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  /** Persist non-sensitive fields whenever they change. */
  const persist = (next: Partial<PartialDetails>) => {
    onPersist({
      ownerNameFirst: next.ownerNameFirst ?? firstName,
      ownerNameLast: next.ownerNameLast ?? lastName,
      vehicleMake: next.vehicleMake ?? make,
      vehicleModel: next.vehicleModel ?? model,
      vehicleYear: next.vehicleYear ?? year,
      vehicleTrim: next.vehicleTrim ?? trim,
      mileage: next.mileage ?? mileage,
      concern: next.concern ?? concern,
    });
  };

  const validate = (): FieldErrors => {
    const e: FieldErrors = {};
    if (!firstName.trim()) e.ownerNameFirst = t('required', lang);
    if (!lastName.trim()) e.ownerNameLast = t('required', lang);
    const normPhone = normalizeUaePhone(phone);
    if (!normPhone) e.ownerPhone = t('invalidPhone', lang);
    if (!EMAIL_RE.test(email.trim())) e.ownerEmail = t('invalidEmail', lang);
    if (!make.trim()) e.vehicleMake = t('required', lang);
    if (!model.trim()) e.vehicleModel = t('required', lang);
    const y = Number(year);
    if (!Number.isFinite(y) || y < 1980 || y > CURRENT_YEAR + 1) {
      e.vehicleYear = t('invalidYear', lang);
    }
    return e;
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setBanner(null);
    const e = validate();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      // Focus the first error field for keyboard users.
      const first = Object.keys(e)[0];
      requestAnimationFrame(() => {
        document.getElementById(`booking-${first}`)?.focus();
      });
      return;
    }
    const normPhone = normalizeUaePhone(phone)!;
    const description =
      service.title + (concern.trim() ? ` — ${concern.trim()}` : '');
    const req: BookingRequest = {
      ownerEmail: email.trim(),
      ownerNameFirst: firstName.trim(),
      ownerNameLast: lastName.trim(),
      ownerPhone: normPhone,
      serviceId: service.id,
      description,
      timeStartMs: slot.startMs,
      vehicleYear: Number(year),
      vehicleModel: model.trim(),
      vehicleMake: make.trim(),
      vehicleTrim: trim.trim() || undefined,
      mileage: mileage.trim() ? Number(mileage) : undefined,
      concern: concern.trim() || undefined,
      preferredLanguage: lang,
    };
    setSubmitting(true);
    onSubmitStart(req);
    try {
      const r = await fetch('/api/booking', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(req),
      });
      const data: BookingSuccess | BookingError = await r.json();
      if (r.ok && 'ok' in data && data.ok) {
        onSuccess(data, req);
        return;
      }
      const err = data as BookingError;
      onSubmitFail(err.code || 'unknown');
      switch (err.code) {
        case 'SLOT_TAKEN':
          setBanner(t('errSlotTaken', lang));
          onSlotTaken();
          break;
        case 'RATE_LIMIT':
          setBanner(t('errRateLimit', lang));
          break;
        case 'ARC_DOWN':
          setBanner(t('errArcDown', lang));
          break;
        case 'PHONE_PROBLEM':
          setErrors((prev) => ({ ...prev, ownerPhone: t('errPhoneProblem', lang) }));
          break;
        case 'VALIDATION':
          if (err.field) {
            setErrors((prev) => ({ ...prev, [err.field as string]: err.message || t('required', lang) }));
          } else {
            setBanner(err.message || t('errGeneric', lang));
          }
          break;
        default:
          setBanner(t('errGeneric', lang));
      }
    } catch {
      onSubmitFail('network');
      setBanner(t('errGeneric', lang));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section
      aria-labelledby="booking-step-4-heading"
      className="booking-step"
      data-step="4"
    >
      <h2 id="booking-step-4-heading" className="text-heading font-light text-white mb-6">
        {t('step4Heading', lang)}
      </h2>

      {banner && (
        <div className="booking-banner glass-card-subtle p-4 mb-6" role="alert">
          <p className="text-body text-white">{banner}</p>
          {banner === t('errArcDown', lang) && (
            <a
              href={WHATSAPP_FALLBACK}
              target="_blank"
              rel="noopener noreferrer"
              className="liquid-glass-btn liquid-glass-btn-small liquid-glass-btn-primary booking-wa-link mt-3"
            >
              <FaWhatsapp className="w-4 h-4" aria-hidden="true" />
              <span>{t('chatToBook', lang)}</span>
            </a>
          )}
        </div>
      )}

      <form onSubmit={handleSubmit} noValidate className="booking-form">
        <div className="booking-form__row">
          <Field
            id="ownerNameFirst"
            label={t('firstName', lang)}
            value={firstName}
            onChange={(v) => { setFirstName(v); persist({ ownerNameFirst: v }); }}
            error={errors.ownerNameFirst}
            required
            autoComplete="given-name"
          />
          <Field
            id="ownerNameLast"
            label={t('lastName', lang)}
            value={lastName}
            onChange={(v) => { setLastName(v); persist({ ownerNameLast: v }); }}
            error={errors.ownerNameLast}
            required
            autoComplete="family-name"
          />
        </div>

        <Field
          id="ownerPhone"
          label={t('phone', lang)}
          value={phone}
          onChange={(v) => setPhone(maskUaePhoneInput(v))}
          error={errors.ownerPhone}
          required
          inputMode="tel"
          placeholder={t('phonePlaceholder', lang)}
          hint={t('phoneHint', lang)}
          autoComplete="tel"
        />

        <Field
          id="ownerEmail"
          label={t('email', lang)}
          value={email}
          onChange={setEmail}
          error={errors.ownerEmail}
          required
          type="email"
          inputMode="email"
          autoComplete="email"
        />

        <div className="booking-form__row booking-form__row--triplet">
          <Field
            id="vehicleMake"
            label={t('vehicleMake', lang)}
            value={make}
            onChange={(v) => { setMake(v); persist({ vehicleMake: v }); }}
            error={errors.vehicleMake}
            required
          />
          <Field
            id="vehicleModel"
            label={t('vehicleModel', lang)}
            value={model}
            onChange={(v) => { setModel(v); persist({ vehicleModel: v }); }}
            error={errors.vehicleModel}
            required
          />
          <Field
            id="vehicleYear"
            label={t('vehicleYear', lang)}
            value={year}
            onChange={(v) => { setYear(v.replace(/[^\d]/g, '').slice(0, 4)); persist({ vehicleYear: v }); }}
            error={errors.vehicleYear}
            required
            inputMode="numeric"
            type="text"
          />
        </div>

        <div className="booking-form__row">
          <Field
            id="vehicleTrim"
            label={t('vehicleTrim', lang)}
            value={trim}
            onChange={(v) => { setTrim(v); persist({ vehicleTrim: v }); }}
          />
          <Field
            id="mileage"
            label={t('mileage', lang)}
            value={mileage}
            onChange={(v) => { setMileage(v.replace(/[^\d]/g, '')); persist({ mileage: v }); }}
            inputMode="numeric"
          />
        </div>

        <div className="booking-field">
          <label htmlFor="booking-concern" className="booking-field__label">
            {t('concernLabel', lang)}
          </label>
          <textarea
            id="booking-concern"
            value={concern}
            onChange={(e) => { setConcern(e.target.value.slice(0, 500)); persist({ concern: e.target.value.slice(0, 500) }); }}
            placeholder={t('concernPlaceholder', lang)}
            rows={4}
            maxLength={500}
            className="booking-field__textarea"
            aria-describedby="booking-concern-count"
          />
          <p
            id="booking-concern-count"
            className="booking-field__count"
            aria-live="polite"
          >
            {t('charsCount', lang, { n: concern.length })}
          </p>
        </div>

        <div className="booking-step__cta">
          <button
            type="button"
            onClick={onBack}
            className="liquid-glass-btn liquid-glass-btn-secondary liquid-glass-btn-small"
            disabled={submitting}
          >
            {t('back', lang)}
          </button>
          <button
            type="submit"
            disabled={submitting}
            className="liquid-glass-btn liquid-glass-btn-primary booking-step__continue"
          >
            {submitting ? (
              <>
                <span className="booking-spinner booking-spinner--small" aria-hidden="true" />
                <span>{t('submitting', lang)}</span>
              </>
            ) : (
              t('confirmBooking', lang)
            )}
          </button>
        </div>
      </form>
    </section>
  );
}

/* ----- field primitives ----- */

interface FieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  error?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'tel';
  inputMode?: 'text' | 'tel' | 'email' | 'numeric';
  placeholder?: string;
  hint?: string;
  autoComplete?: string;
}

function Field({
  id,
  label,
  value,
  onChange,
  error,
  required,
  type = 'text',
  inputMode,
  placeholder,
  hint,
  autoComplete,
}: FieldProps) {
  const fieldId = `booking-${id}`;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errId = error ? `${fieldId}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined;
  return (
    <div className="booking-field" data-has-error={!!error}>
      <label htmlFor={fieldId} className="booking-field__label">
        {label} {required && <span aria-hidden="true" className="booking-field__req">*</span>}
      </label>
      <input
        id={fieldId}
        name={id}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        aria-invalid={!!error}
        aria-describedby={describedBy}
        className="booking-field__input"
      />
      {hint && !error && (
        <p id={hintId} className="booking-field__hint">{hint}</p>
      )}
      {error && (
        <p id={errId} className="booking-field__error" role="alert">{error}</p>
      )}
    </div>
  );
}
