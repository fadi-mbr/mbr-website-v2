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
import { ALL_MAKES_PLUS_OTHER, getModelsForMake, OTHER_SENTINEL } from '@/lib/car-catalog';
import { FOREIGN_SENTINEL, formatPlate, parsePlate } from '@/lib/uae-plates';

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
    vehicleYear?: number;
    vehicleMake?: string;
    vehicleModel?: string;
    /**
     * Formatted plate string (e.g. `Dubai M 12345`). Decomposed by
     * `parsePlate` into emirate/category/number or foreign/foreignText
     * for the picker.
     */
    vehiclePlate?: string;
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

/**
 * Resolve a free-text vehicle make from Chatwoot to a (make, customMake)
 * pair. If the input matches a catalog entry exactly (case-insensitive),
 * snap to that canonical name; otherwise fall back to the OTHER sentinel
 * with the typed text preserved in `customMake`.
 */
function resolveMakePrefill(raw: string | undefined): {
  make: string;
  customMake: string;
} {
  if (!raw) return { make: '', customMake: '' };
  const q = raw.trim();
  if (!q) return { make: '', customMake: '' };
  const canonical = ALL_MAKES_PLUS_OTHER.find(
    (m) => m !== OTHER_SENTINEL && m.toLowerCase() === q.toLowerCase(),
  );
  if (canonical) return { make: canonical, customMake: '' };
  return { make: OTHER_SENTINEL, customMake: q };
}

/**
 * Resolve a free-text model against the catalog entries for `make`. Exact
 * (case-insensitive) match → snap to canonical, otherwise OTHER + customModel.
 * If `make` is empty / OTHER, treat the model itself as custom.
 */
function resolveModelPrefill(
  make: string,
  raw: string | undefined,
): { model: string; customModel: string } {
  if (!raw) return { model: '', customModel: '' };
  const q = raw.trim();
  if (!q) return { model: '', customModel: '' };
  if (!make || make === OTHER_SENTINEL) {
    return { model: OTHER_SENTINEL, customModel: q };
  }
  const models = getModelsForMake(make);
  const canonical = models.find((m) => m.toLowerCase() === q.toLowerCase());
  if (canonical) return { model: canonical, customModel: '' };
  return { model: OTHER_SENTINEL, customModel: q };
}

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
  const [vehicleYear, setVehicleYear] = useState(
    prefill?.vehicleYear ? String(prefill.vehicleYear) : ''
  );
  // Make/Model: when the picker selects "Other", the sentinel `__OTHER__`
  // is stored here and the actual user-typed name goes into customMake /
  // customModel. At submit time we resolve to the real string.
  //
  // Prefill (from Chatwoot custom_attributes): if the supplied make/model
  // matches a catalog entry exactly, hydrate the combobox with the canonical
  // name; otherwise fall back to OTHER + customMake/customModel.
  const _initMake = useMemo(
    () => resolveMakePrefill(prefill?.vehicleMake),
    [prefill?.vehicleMake]
  );
  const _initModel = useMemo(
    () => resolveModelPrefill(_initMake.make, prefill?.vehicleModel),
    [_initMake.make, prefill?.vehicleModel]
  );
  const [vehicleMake, setVehicleMake] = useState(_initMake.make);
  const [customMake, setCustomMake] = useState(_initMake.customMake);
  const [vehicleModel, setVehicleModel] = useState(_initModel.model);
  const [customModel, setCustomModel] = useState(_initModel.customModel);
  // Plate: composed from emirate + category + number, or from foreignText
  // when emirate === FOREIGN_SENTINEL. Prefill via `parsePlate` if a stored
  // plate string is supplied; unrecognised formats fall back to empty.
  const _initPlate = useMemo(
    () => parsePlate(prefill?.vehiclePlate),
    [prefill?.vehiclePlate]
  );
  const [plateEmirate, setPlateEmirate] = useState(_initPlate.emirate);
  const [plateCategory, setPlateCategory] = useState(_initPlate.category);
  const [plateNumber, setPlateNumber] = useState(_initPlate.number);
  const [plateForeign, setPlateForeign] = useState(_initPlate.foreignText);
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
    // Heading + body branch on three states:
    //   - public pending     → "Check your email" + magic-link instructions
    //   - agent confirmed    → "Booking submitted ✓" + ARC awaiting-approval
    //   - preview/legacy     → "Booking request received" / "Booking confirmed"
    const isPublicPending = !!success.pendingMessage;
    const isAgent = !isPublicPending && mode === 'agent' && !success.isPreview;
    const heading = isPublicPending
      ? 'Check your email'
      : isAgent
        ? 'Booking submitted ✓'
        : success.isPreview
          ? 'Booking request received'
          : 'Booking confirmed';
    return (
      <div
        className="relative overflow-hidden rounded-xl border border-[#E30613]/30 bg-gradient-to-br from-[#1a0306] via-neutral-950 to-black p-6 text-white shadow-[0_20px_60px_-30px_rgba(227,6,19,0.6)]"
        role="status"
        aria-live="polite"
      >
        <span
          aria-hidden="true"
          className="pointer-events-none absolute -top-12 -right-12 h-40 w-40 rounded-full bg-[#E30613]/20 blur-3xl"
        />
        <div className="relative">
        <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-full bg-[#E30613]/15 ring-1 ring-[#E30613]/40">
          <span aria-hidden="true" className="text-lg text-[#FF4757]">✓</span>
        </div>
        <h2 className="text-xl font-light tracking-wide mb-2">{heading}</h2>
        {isPublicPending ? (
          <p className="text-sm text-neutral-300">{success.pendingMessage}</p>
        ) : isAgent ? (
          <>
            <p className="text-sm text-neutral-300">
              The booking is now in ARC awaiting team approval. The customer
              doesn&apos;t need to do anything — once a teammate approves it in
              ARC (Notifications inbox), it lands in the calendar.
            </p>
            <p className="text-xs text-neutral-400 mt-3">
              {success.serviceTitle} — {success.when}
            </p>
          </>
        ) : (
          <p className="text-sm text-neutral-300">
            {success.serviceTitle} — {success.when}
          </p>
        )}
        {success.arcAppointmentId !== undefined && (
          <p className="text-xs text-neutral-500 mt-2">
            Reference: apt #{success.arcAppointmentId}
          </p>
        )}
        {success.isPreview && (
          <p className="text-xs text-neutral-500 mt-4">
            This is a preview screen. No appointment was created.
          </p>
        )}
        {isPublicPending && (
          <p className="text-xs text-neutral-500 mt-4">
            The link in the email expires in 30 minutes. If you don&apos;t see
            it, check your spam folder. The booking will only appear in ARC
            after you click the link.
          </p>
        )}
        </div>
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
      {/* Mode banner: makes the agent vs public flow obvious before submit. */}
      <div
        className={[
          'flex items-start gap-3 rounded-lg border px-4 py-3 text-sm backdrop-blur',
          mode === 'agent'
            ? 'border-[#E30613]/40 bg-[#E30613]/10 text-[#FFB3B3]'
            : 'border-white/10 bg-white/[0.03] text-neutral-300',
        ].join(' ')}
        role="note"
      >
        <span
          aria-hidden="true"
          className={[
            'mt-0.5 inline-flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold',
            mode === 'agent'
              ? 'bg-[#E30613]/20 text-[#FFB3B3]'
              : 'bg-white/10 text-neutral-200',
          ].join(' ')}
        >
          {mode === 'agent' ? 'A' : 'i'}
        </span>
        <span className="leading-snug">
          {mode === 'agent'
            ? 'Agent booking — sent to ARC immediately for team approval. No email step for the customer.'
            : "We'll email you a confirmation link to finalize this booking — no account needed."}
        </span>
      </div>

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
              className="shrink-0 rounded border border-red-700 px-2 py-1 text-xs text-red-100 hover:bg-red-900/60 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E30613]"
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
          className="flex items-center gap-3 text-lg font-light tracking-wide text-white"
        >
          <span
            aria-hidden="true"
            className="h-px w-8 bg-gradient-to-r from-[#E30613] to-[#E30613]/0"
          />
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
                  'group relative text-left rounded-xl border p-4 transition-all duration-200',
                  'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E30613] focus-visible:ring-offset-2 focus-visible:ring-offset-black',
                  selected
                    ? 'border-[#E30613] bg-gradient-to-br from-[#E30613]/15 via-[#1a0306] to-neutral-950 shadow-[0_0_0_1px_rgba(227,6,19,0.3),0_8px_24px_-12px_rgba(227,6,19,0.6)]'
                    : 'border-white/10 bg-white/[0.02] hover:border-[#E30613]/60 hover:bg-white/[0.04]',
                ].join(' ')}
              >
                {selected && (
                  <span
                    aria-hidden="true"
                    className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[#E30613] text-[10px] font-bold text-white shadow"
                  >
                    ✓
                  </span>
                )}
                <div className="font-medium tracking-wide text-white pr-7">
                  {s.title}
                </div>
                <div className="mt-1.5 flex items-baseline gap-2 text-xs">
                  <span className="text-neutral-400">
                    {s.duration_h === 1 ? '1 hour' : `${s.duration_h} hours`}
                  </span>
                  {s.price != null && (
                    <>
                      <span aria-hidden className="text-neutral-700">·</span>
                      <span className="font-semibold text-[#FF4757]">
                        AED {s.price.toLocaleString('en-US')}
                      </span>
                    </>
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
          className="flex items-center gap-3 text-lg font-light tracking-wide text-white"
        >
          <span
            aria-hidden="true"
            className="h-px w-8 bg-gradient-to-r from-[#E30613] to-[#E30613]/0"
          />
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
            autoComplete="given-name"
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
            autoComplete="family-name"
            enterKeyHint="next"
          />
        </div>
        <Field
          id="phone"
          name="tel"
          label="Phone"
          value={phone}
          onChange={(v) => setPhone(maskIntlPhoneInput(v))}
          onBlur={() => {
            // If the user only typed the dial prefix and tabbed away,
            // clear it so the field doesn't look pre-filled. Otherwise
            // validate. We do NOT inject "+971 " on focus — Safari only
            // offers Contacts autofill when the field starts empty.
            const stripped = phone.replace(/\s+/g, '');
            if (!stripped || stripped === '+971' || stripped === '+') {
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
          autoComplete="tel"
          enterKeyHint="next"
          placeholder="+971 50 123 4567"
          hint="UAE numbers default to +971. For other countries, type the + and country code."
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
          autoComplete="email"
          enterKeyHint="next"
        />
      </section>

      {/* Vehicle */}
      <section aria-labelledby="booking-vehicle-heading" className="space-y-3">
        <h2
          id="booking-vehicle-heading"
          className="flex items-center gap-3 text-lg font-light tracking-wide text-white"
        >
          <span
            aria-hidden="true"
            className="h-px w-8 bg-gradient-to-r from-[#E30613] to-[#E30613]/0"
          />
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
          className="flex items-center gap-3 text-lg font-light tracking-wide text-white"
        >
          <span
            aria-hidden="true"
            className="h-px w-8 bg-gradient-to-r from-[#E30613] to-[#E30613]/0"
          />
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
            placeholder="e.g. dropping off in the morning, parking pass needed, low-clearance car — optional"
            autoComplete="off"
            enterKeyHint="done"
            className="w-full rounded-lg border border-white/10 bg-white/[0.02] px-3 py-2.5 text-sm text-white placeholder:text-neutral-500 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E30613] focus-visible:border-[#E30613]/50 transition-colors"
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
          aria-busy={submitting || undefined}
          className={[
            'liquid-glass-btn liquid-glass-btn-primary w-full justify-center rounded-lg px-5 py-3 text-base font-medium tracking-wide',
            submitting ? 'opacity-70 cursor-not-allowed' : '',
          ].join(' ')}
        >
          {submitting ? (
            <span className="inline-flex items-center gap-2">
              <span
                aria-hidden="true"
                className="inline-block h-4 w-4 rounded-full border-2 border-white/70 border-t-transparent animate-spin"
              />
              Submitting…
            </span>
          ) : mode === 'agent' ? (
            'Book appointment now'
          ) : (
            'Email me the confirmation link'
          )}
        </button>
        {mode === 'public' && !submitting && (
          <p className="mt-2 text-center text-[11px] text-neutral-500">
            No account required. Confirmation link expires in 30 minutes.
          </p>
        )}
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
          <span aria-hidden="true" className="text-[#E30613] ml-1">
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
          'w-full rounded-lg border bg-white/[0.02] px-3 py-2.5 text-sm text-white placeholder:text-neutral-500',
          'focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E30613] focus-visible:border-[#E30613]/50 transition-colors',
          error ? 'border-red-700/70' : 'border-white/10',
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
