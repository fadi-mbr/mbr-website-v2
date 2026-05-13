"use client";

/**
 * BookingFormClient — interactive island for the BookingForm RSC shell.
 *
 * Owns:
 *   - all form input state (name/email/phone/vehicle/notes/honeypot)
 *   - service selection (radio tiles)
 *   - slot selection (delegated to <SlotPicker>)
 *   - inline blur validation + submit
 *
 * The submit handler is injected from the server shell so the preview route
 * can wire it to `console.log` while production wires it to a Server Action.
 */

import React, { useMemo, useState } from 'react';
import SlotPicker, { type SlotValue } from './SlotPicker';
import CarMakeModelPicker from './CarMakeModelPicker';
import UaePlatePicker from './UaePlatePicker';
import {
  EMAIL_RE,
  maskIntlPhoneInput,
  normalizeIntlPhone,
} from '@/lib/booking-phone';
import type { BookingService } from '@/lib/booking-types';
import { OTHER_SENTINEL } from '@/lib/car-catalog';
import { FOREIGN_SENTINEL, formatPlate } from '@/lib/uae-plates';

export interface BookingSubmitPayload {
  mode: 'agent' | 'public';
  serviceId: number;
  timeStartMs: number;
  ownerNameFirst: string;
  ownerNameLast: string;
  ownerPhone: string; // normalised E.164 (no '+')
  ownerEmail: string;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  vehiclePlate?: string;
  notes?: string;
}

/**
 * Discriminated result the Server Action returns back to the client form.
 *
 *   ok:true, pending:true   → public flow accepted the request and sent
 *                              the confirmation email; show a generic
 *                              "check your inbox" message. No appointment
 *                              has been created yet.
 *   ok:true, pending:false  → agent flow created an ARC appointment in
 *                              one shot; show confirmation details.
 *   ok:false                → inline error with `message`, allow Retry.
 *
 * Field names mirror the agent-endpoint response so the action can pass it
 * through without remapping.
 */
export type ServerActionResult =
  | {
      ok: true;
      pending?: false;
      arcAppointmentId?: number;
      confirmAt: string;
      serviceName: string;
      estimatedDuration: number;
    }
  | {
      ok: true;
      pending: true;
      message: string;
    }
  | {
      ok: false;
      code?: string;
      message: string;
    };

interface Props {
  mode: 'agent' | 'public';
  services: BookingService[];
  prefill?: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    email?: string;
  };
  /**
   * Optional inline submit handler — used by the preview route to log
   * payloads without hitting any backend. Kept for backwards compatibility
   * with the v2 preview page.
   */
  onSubmit?: (payload: BookingSubmitPayload) => Promise<void> | void;
  /**
   * Server Action — when supplied, takes precedence over `onSubmit` and
   * is awaited on submit. The page-level wrapper provides this so that
   * the agent secret / token never crosses the client boundary.
   */
  serverAction?: (
    payload: BookingSubmitPayload
  ) => Promise<ServerActionResult>;
}

type FieldErrors = Partial<
  Record<
    | 'service'
    | 'slot'
    | 'firstName'
    | 'lastName'
    | 'phone'
    | 'email'
    | 'vehicleYear'
    | 'vehicleMake'
    | 'vehicleModel'
    | 'vehiclePlate',
    string
  >
>;

const CURRENT_YEAR = new Date().getFullYear();

export default function BookingFormClient({
  mode,
  services,
  prefill,
  onSubmit,
  serverAction,
}: Props) {
  // ----- state -----
  const [serviceId, setServiceId] = useState<number | null>(null);
  const [slot, setSlot] = useState<SlotValue>({});
  const [firstName, setFirstName] = useState(prefill?.firstName ?? '');
  const [lastName, setLastName] = useState(prefill?.lastName ?? '');
  const [phone, setPhone] = useState(
    prefill?.phone ? maskIntlPhoneInput(prefill.phone) : ''
  );
  const [email, setEmail] = useState(prefill?.email ?? '');
  const [vehicleYear, setVehicleYear] = useState('');
  // Make/Model: when the picker selects "Other", the sentinel `__OTHER__`
  // is stored here and the actual user-typed name goes into customMake /
  // customModel. At submit time we resolve to the real string.
  const [vehicleMake, setVehicleMake] = useState('');
  const [customMake, setCustomMake] = useState('');
  const [vehicleModel, setVehicleModel] = useState('');
  const [customModel, setCustomModel] = useState('');
  // Plate: composed from emirate + category + number, or from foreignText
  // when emirate === FOREIGN_SENTINEL.
  const [plateEmirate, setPlateEmirate] = useState('');
  const [plateCategory, setPlateCategory] = useState('');
  const [plateNumber, setPlateNumber] = useState('');
  const [plateForeign, setPlateForeign] = useState('');
  const [notes, setNotes] = useState('');
  const [honeypot, setHoneypot] = useState('');
  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [success, setSuccess] = useState<{
    serviceTitle: string;
    when: string;
    arcAppointmentId?: number;
    isPreview?: boolean;
    /** Public flow: email sent, waiting for the user to click the magic link. */
    pendingMessage?: string;
  } | null>(null);
  const [lastPayload, setLastPayload] = useState<BookingSubmitPayload | null>(
    null
  );

  const selectedService = useMemo(
    () => services.find((s) => s.id === serviceId) ?? null,
    [services, serviceId]
  );

  // ----- validators (per-field, called on blur) -----
  const checkFirstName = (v: string) =>
    v.trim() ? undefined : 'Please enter your first name.';
  const checkLastName = (v: string) =>
    v.trim() ? undefined : 'Please enter your last name.';
  const checkPhone = (v: string) =>
    normalizeIntlPhone(v) ? undefined : 'Enter a valid phone number.';
  const checkEmail = (v: string) =>
    EMAIL_RE.test(v.trim()) ? undefined : 'Enter a valid email address.';
  const checkVehicleMake = (make: string, custom: string) => {
    if (!make) return 'Please select the vehicle make.';
    if (make === OTHER_SENTINEL && !custom.trim()) {
      return 'Please type the make.';
    }
    return undefined;
  };
  const checkVehicleModel = (
    make: string,
    model: string,
    custom: string
  ) => {
    if (!make) return 'Please select a make first.';
    if (make === OTHER_SENTINEL) {
      return custom.trim() ? undefined : 'Please type the model.';
    }
    if (!model) return 'Please select the vehicle model.';
    if (model === OTHER_SENTINEL && !custom.trim()) {
      return 'Please type the model.';
    }
    return undefined;
  };
  const checkVehicleYear = (v: string) => {
    const y = Number(v);
    if (!Number.isFinite(y) || y < 1980 || y > CURRENT_YEAR + 1) {
      return `Enter a year between 1980 and ${CURRENT_YEAR + 1}.`;
    }
    return undefined;
  };
  const checkPlate = (
    emirate: string,
    category: string,
    number: string,
    foreignText: string
  ) => {
    if (!emirate) return 'Please pick the emirate (or Foreign plate).';
    if (emirate === FOREIGN_SENTINEL) {
      return foreignText.trim()
        ? undefined
        : 'Please type the country + plate.';
    }
    if (!category) return 'Please pick the plate code.';
    if (!number.trim()) return 'Please enter the plate number.';
    if (!/^\d{1,5}$/.test(number.trim())) {
      return 'Plate number must be 1–5 digits.';
    }
    return undefined;
  };

  const validateAll = (): FieldErrors => {
    const e: FieldErrors = {};
    if (!serviceId) e.service = 'Please pick a service.';
    if (!slot.timeStartMs) e.slot = 'Please pick a time slot.';
    e.firstName = checkFirstName(firstName);
    e.lastName = checkLastName(lastName);
    e.phone = checkPhone(phone);
    e.email = checkEmail(email);
    e.vehicleMake = checkVehicleMake(vehicleMake, customMake);
    e.vehicleModel = checkVehicleModel(vehicleMake, vehicleModel, customModel);
    e.vehicleYear = checkVehicleYear(vehicleYear);
    e.vehiclePlate = checkPlate(
      plateEmirate,
      plateCategory,
      plateNumber,
      plateForeign
    );
    // Strip undefined values so Object.keys() works as expected.
    for (const k of Object.keys(e) as (keyof FieldErrors)[]) {
      if (!e[k]) delete e[k];
    }
    return e;
  };

  const formatWhen = (ms: number): string =>
    new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dubai',
      weekday: 'short',
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(ms));

  /**
   * Submit the prepared payload through whichever handler is wired up.
   * Extracted from `handleSubmit` so the Retry button can call it directly
   * with the cached `lastPayload`.
   */
  const runSubmit = async (payload: BookingSubmitPayload): Promise<void> => {
    setBanner(null);
    setSubmitting(true);
    try {
      if (serverAction) {
        const result = await serverAction(payload);
        if (result.ok) {
          if (result.pending === true) {
            setSuccess({
              serviceTitle: selectedService?.title ?? 'Your booking',
              when: formatWhen(payload.timeStartMs),
              pendingMessage: result.message,
            });
          } else {
            setSuccess({
              serviceTitle: result.serviceName || selectedService?.title || 'Your booking',
              when: formatWhen(payload.timeStartMs),
              arcAppointmentId: result.arcAppointmentId,
            });
          }
        } else {
          setBanner(
            result.message ||
              'We could not complete the booking. Please try again.'
          );
        }
      } else if (onSubmit) {
        await onSubmit(payload);
        setSuccess({
          serviceTitle: selectedService?.title ?? 'Your booking',
          when: formatWhen(payload.timeStartMs),
          isPreview: true,
        });
      } else {
        // Default preview behaviour: log payload + fake-success.
        console.log('[BookingForm preview] submit payload', payload);
        setSuccess({
          serviceTitle: selectedService?.title ?? 'Your booking',
          when: formatWhen(payload.timeStartMs),
          isPreview: true,
        });
      }
    } catch (err) {
      console.error('[BookingForm] submit failed', err);
      setBanner('Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleSubmit = async (ev: React.FormEvent) => {
    ev.preventDefault();
    setBanner(null);

    // Honeypot: silent success without doing anything.
    if (honeypot.trim()) {
      setSuccess({ serviceTitle: '—', when: '—', isPreview: true });
      return;
    }

    const e = validateAll();
    setErrors(e);
    if (Object.keys(e).length > 0) {
      const firstKey = Object.keys(e)[0];
      setBanner('Please fix the highlighted fields and try again.');
      // Move focus to the first error for keyboard users where possible.
      requestAnimationFrame(() => {
        document.getElementById(`booking-${firstKey}`)?.focus();
      });
      return;
    }

    const normPhone = normalizeIntlPhone(phone)!;
    const resolvedMake =
      vehicleMake === OTHER_SENTINEL ? customMake.trim() : vehicleMake;
    const resolvedModel =
      vehicleMake === OTHER_SENTINEL || vehicleModel === OTHER_SENTINEL
        ? customModel.trim()
        : vehicleModel;
    const resolvedPlate = formatPlate({
      emirate: plateEmirate,
      category: plateCategory,
      number: plateNumber,
      foreignText: plateForeign,
    });
    const payload: BookingSubmitPayload = {
      mode,
      serviceId: serviceId!,
      timeStartMs: slot.timeStartMs!,
      ownerNameFirst: firstName.trim(),
      ownerNameLast: lastName.trim(),
      ownerPhone: normPhone,
      ownerEmail: email.trim(),
      vehicleYear: Number(vehicleYear),
      vehicleMake: resolvedMake,
      vehicleModel: resolvedModel,
      vehiclePlate: resolvedPlate || undefined,
      notes: notes.trim() || undefined,
    };
    setLastPayload(payload);
    await runSubmit(payload);
  };

  const handleRetry = async () => {
    if (lastPayload) await runSubmit(lastPayload);
  };

  if (success) {
    const heading = success.pendingMessage
      ? 'Check your email'
      : success.isPreview
        ? 'Booking request received'
        : 'Booking confirmed';
    return (
      <div
        className="rounded-lg border border-[#b08d57]/40 bg-neutral-900 p-6 text-white"
        role="status"
        aria-live="polite"
      >
        <h2 className="text-xl font-light mb-2">{heading}</h2>
        {success.pendingMessage ? (
          <p className="text-sm text-neutral-300">{success.pendingMessage}</p>
        ) : (
          <p className="text-sm text-neutral-300">
            {success.serviceTitle} — {success.when}
          </p>
        )}
        {success.arcAppointmentId !== undefined && (
          <p className="text-xs text-neutral-500 mt-2">
            Reference #{success.arcAppointmentId}
          </p>
        )}
        {success.isPreview && (
          <p className="text-xs text-neutral-500 mt-4">
            This is a preview screen. No appointment was created.
          </p>
        )}
        {success.pendingMessage && (
          <p className="text-xs text-neutral-500 mt-4">
            The link in the email expires in 30 minutes. If you don&apos;t see
            it, check your spam folder.
          </p>
        )}
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      method="post"
      noValidate
      aria-label="MBR Booking"
      className="space-y-8 text-white"
    >
      {banner && (
        <div
          role="alert"
          aria-live="polite"
          className="rounded border border-red-800 bg-red-950/40 text-red-200 px-3 py-2 text-sm flex items-center justify-between gap-3"
        >
          <span>{banner}</span>
          {lastPayload && !submitting && (
            <button
              type="button"
              onClick={handleRetry}
              className="shrink-0 rounded border border-red-700 px-2 py-1 text-xs text-red-100 hover:bg-red-900/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b08d57]"
            >
              Retry
            </button>
          )}
        </div>
      )}

      {/* Service */}
      <section aria-labelledby="booking-service-heading" className="space-y-3">
        <h2
          id="booking-service-heading"
          className="text-lg font-light text-white"
        >
          Service
        </h2>
        <div
          role="radiogroup"
          aria-labelledby="booking-service-heading"
          aria-describedby={errors.service ? 'booking-service-err' : undefined}
          className="grid grid-cols-1 sm:grid-cols-2 gap-3"
          id="booking-service"
        >
          {services.map((s) => {
            const selected = s.id === serviceId;
            return (
              <button
                key={s.id}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  setServiceId(s.id);
                  setErrors((p) => ({ ...p, service: undefined }));
                }}
                className={[
                  'text-left rounded-lg border p-4 transition-colors',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b08d57]',
                  selected
                    ? 'bg-[#b08d57] border-[#b08d57] text-black shadow-md'
                    : 'border-neutral-700 bg-neutral-900 text-white hover:border-[#b08d57] hover:bg-neutral-800',
                ].join(' ')}
              >
                <div className="font-medium">{s.title}</div>
                <div
                  className={[
                    'mt-1 text-xs',
                    selected ? 'text-black/70' : 'text-neutral-400',
                  ].join(' ')}
                >
                  {s.duration_h === 1
                    ? '1 hour'
                    : `${s.duration_h} hours`}
                  {s.price != null && (
                    <span
                      className={[
                        'ml-2',
                        selected
                          ? 'text-black/80 font-medium'
                          : 'text-[#b08d57]',
                      ].join(' ')}
                    >
                      AED {s.price.toLocaleString('en-US')}
                    </span>
                  )}
                </div>
              </button>
            );
          })}
        </div>
        {errors.service && (
          <p
            id="booking-service-err"
            role="alert"
            aria-live="polite"
            className="text-xs text-red-300"
          >
            {errors.service}
          </p>
        )}
      </section>

      {/* When */}
      <section aria-labelledby="booking-when-heading" className="space-y-3">
        <h2
          id="booking-when-heading"
          className="text-lg font-light text-white"
        >
          When
        </h2>
        <div id="booking-slot">
          <SlotPicker
            value={slot}
            onChange={(v) => {
              setSlot(v);
              if (v.timeStartMs) {
                setErrors((p) => ({ ...p, slot: undefined }));
              }
            }}
            selectedServiceId={serviceId ?? undefined}
            selectedDurationH={selectedService?.duration_h}
          />
        </div>
        {errors.slot && (
          <p
            id="booking-slot-err"
            role="alert"
            aria-live="polite"
            className="text-xs text-red-300"
          >
            {errors.slot}
          </p>
        )}
      </section>

      {/* You */}
      <section aria-labelledby="booking-you-heading" className="space-y-3">
        <h2 id="booking-you-heading" className="text-lg font-light text-white">
          You
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <Field
            id="firstName"
            name="given-name"
            label="First name"
            value={firstName}
            onChange={setFirstName}
            onBlur={() =>
              setErrors((p) => ({ ...p, firstName: checkFirstName(firstName) }))
            }
            error={errors.firstName}
            required
            autoComplete="section-contact given-name"
            enterKeyHint="next"
          />
          <Field
            id="lastName"
            name="family-name"
            label="Last name"
            value={lastName}
            onChange={setLastName}
            onBlur={() =>
              setErrors((p) => ({ ...p, lastName: checkLastName(lastName) }))
            }
            error={errors.lastName}
            required
            autoComplete="section-contact family-name"
            enterKeyHint="next"
          />
        </div>
        <Field
          id="phone"
          name="tel"
          label="Phone"
          value={phone}
          onChange={(v) => setPhone(maskIntlPhoneInput(v))}
          onFocus={() => {
            if (!phone.trim()) setPhone('+971 ');
          }}
          onBlur={() => {
            // If the user focused, didn't type anything beyond the default
            // prefix, and tabbed away — clear back to empty so the field
            // doesn't look pre-filled. Otherwise validate.
            const stripped = phone.replace(/\s+/g, '');
            if (stripped === '+971' || stripped === '+') {
              setPhone('');
              setErrors((p) => ({ ...p, phone: undefined }));
              return;
            }
            setErrors((p) => ({ ...p, phone: checkPhone(phone) }));
          }}
          error={errors.phone}
          required
          type="tel"
          inputMode="tel"
          autoComplete="section-contact tel"
          enterKeyHint="next"
          placeholder="+971 50 123 4567"
          hint="We'll text you the confirmation. UAE +971 by default — type +country code for other numbers."
        />
        <Field
          id="email"
          name="email"
          label="Email"
          value={email}
          onChange={setEmail}
          onBlur={() =>
            setErrors((p) => ({ ...p, email: checkEmail(email) }))
          }
          error={errors.email}
          required
          type="email"
          inputMode="email"
          autoComplete="section-contact email"
          enterKeyHint="next"
        />
      </section>

      {/* Vehicle */}
      <section aria-labelledby="booking-vehicle-heading" className="space-y-3">
        <h2
          id="booking-vehicle-heading"
          className="text-lg font-light text-white"
        >
          Vehicle
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
          <Field
            id="vehicleYear"
            label="Year"
            value={vehicleYear}
            onChange={(v) =>
              setVehicleYear(v.replace(/[^\d]/g, '').slice(0, 4))
            }
            onBlur={() =>
              setErrors((p) => ({
                ...p,
                vehicleYear: checkVehicleYear(vehicleYear),
              }))
            }
            error={errors.vehicleYear}
            required
            inputMode="numeric"
            autoComplete="off"
            enterKeyHint="next"
            placeholder="2023"
          />
          <CarMakeModelPicker
            make={vehicleMake}
            setMake={setVehicleMake}
            customMake={customMake}
            setCustomMake={setCustomMake}
            model={vehicleModel}
            setModel={setVehicleModel}
            customModel={customModel}
            setCustomModel={setCustomModel}
            errors={{
              make: errors.vehicleMake,
              model: errors.vehicleModel,
            }}
            onBlur={(field) => {
              if (field === 'make') {
                setErrors((p) => ({
                  ...p,
                  vehicleMake: checkVehicleMake(vehicleMake, customMake),
                }));
              } else {
                setErrors((p) => ({
                  ...p,
                  vehicleModel: checkVehicleModel(
                    vehicleMake,
                    vehicleModel,
                    customModel
                  ),
                }));
              }
            }}
          />
        </div>
        <div>
          <h3 className="text-xs uppercase tracking-wide text-neutral-400 mb-2">
            Licence plate
          </h3>
          <UaePlatePicker
            emirate={plateEmirate}
            setEmirate={setPlateEmirate}
            category={plateCategory}
            setCategory={setPlateCategory}
            number={plateNumber}
            setNumber={setPlateNumber}
            foreignText={plateForeign}
            setForeignText={setPlateForeign}
            error={errors.vehiclePlate}
            onBlur={() =>
              setErrors((p) => ({
                ...p,
                vehiclePlate: checkPlate(
                  plateEmirate,
                  plateCategory,
                  plateNumber,
                  plateForeign
                ),
              }))
            }
          />
        </div>
      </section>

      {/* Notes */}
      <section aria-labelledby="booking-notes-heading" className="space-y-3">
        <h2
          id="booking-notes-heading"
          className="text-lg font-light text-white"
        >
          Notes
        </h2>
        <div>
          <label htmlFor="booking-notes" className="sr-only">
            Anything we should know?
          </label>
          <textarea
            id="booking-notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value.slice(0, 500))}
            rows={4}
            maxLength={500}
            placeholder="Anything we should know? (optional)"
            autoComplete="off"
            enterKeyHint="done"
            className="w-full rounded border border-neutral-700 bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b08d57]"
            aria-describedby="booking-notes-count"
          />
          <p
            id="booking-notes-count"
            aria-live="polite"
            className="mt-1 text-xs text-neutral-500"
          >
            {notes.length}/500
          </p>
        </div>
      </section>

      {/* Honeypot — invisible to humans, visible to dumb bots. */}
      <div className="sr-only" aria-hidden="true">
        <label htmlFor="booking-_website">Website (leave blank)</label>
        <input
          id="booking-_website"
          name="_website"
          type="text"
          tabIndex={-1}
          autoComplete="off"
          value={honeypot}
          onChange={(e) => setHoneypot(e.target.value)}
        />
      </div>

      {/* Submit — sticky-bottom on mobile, static on desktop. */}
      <div className="md:static sticky bottom-0 z-10 -mx-4 px-4 py-3 md:p-0 md:bg-transparent bg-black/95 backdrop-blur supports-[backdrop-filter]:bg-black/80 border-t border-neutral-800 md:border-0">
        <button
          type="submit"
          disabled={submitting}
          className={[
            'w-full rounded-lg px-5 py-3 font-medium transition-colors',
            'focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-[#b08d57]',
            submitting
              ? 'bg-[#b08d57]/60 text-black/70 cursor-not-allowed'
              : 'bg-[#b08d57] text-black hover:bg-[#c79c63]',
          ].join(' ')}
        >
          {submitting ? 'Submitting…' : mode === 'agent' ? 'Book appointment' : 'Request booking'}
        </button>
      </div>
    </form>
  );
}

/* ----- field primitive ----- */

interface FieldProps {
  id: string;
  /**
   * Browser autofill name. Defaults to `id` when not provided. We override
   * this for contact fields so the `name` matches the browser autofill
   * conventions (`given-name`, `family-name`, `tel`, `email`) — Safari and
   * Chrome use the name attribute as a hint when scoring autofill matches.
   */
  name?: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
  onFocus?: () => void;
  onBlur?: () => void;
  error?: string;
  required?: boolean;
  type?: 'text' | 'email' | 'tel';
  inputMode?: 'text' | 'tel' | 'email' | 'numeric';
  placeholder?: string;
  hint?: string;
  autoComplete?: string;
  enterKeyHint?: 'enter' | 'done' | 'go' | 'next' | 'previous' | 'search' | 'send';
}

function Field({
  id,
  name,
  label,
  value,
  onChange,
  onFocus,
  onBlur,
  error,
  required,
  type = 'text',
  inputMode,
  placeholder,
  hint,
  autoComplete,
  enterKeyHint,
}: FieldProps) {
  const fieldId = `booking-${id}`;
  const hintId = hint ? `${fieldId}-hint` : undefined;
  const errId = error ? `${fieldId}-err` : undefined;
  const describedBy = [hintId, errId].filter(Boolean).join(' ') || undefined;
  return (
    <div>
      <label
        htmlFor={fieldId}
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
        id={fieldId}
        name={name ?? id}
        type={type}
        inputMode={inputMode}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onFocus={onFocus}
        onBlur={onBlur}
        placeholder={placeholder}
        required={required}
        autoComplete={autoComplete}
        enterKeyHint={enterKeyHint}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={[
          'w-full rounded border bg-neutral-900 px-3 py-2 text-sm text-white placeholder:text-neutral-500',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#b08d57]',
          error ? 'border-red-700' : 'border-neutral-700',
        ].join(' ')}
      />
      {hint && !error && (
        <p id={hintId} className="mt-1 text-xs text-neutral-500">
          {hint}
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
