"use client";

import React from 'react';
import { FaCheck, FaCalendarPlus, FaWhatsapp } from 'react-icons/fa';
import { t, type Lang } from '@/lib/booking-i18n';
import { formatDateLong, formatSlotTime } from '@/lib/booking-dates';
import { buildIcs, downloadIcs } from '@/lib/booking-ics';
import type { BookingRequest, BookingSuccess } from '@/lib/booking-types';

interface Props {
  lang: Lang;
  request: BookingRequest;
  response: BookingSuccess;
  onBookAnother: () => void;
}

const SHOP_ADDRESS = '16 8 St Al Quoz Industrial 4, Dubai, UAE';

export default function StepConfirmation({ lang, request, response, onBookAnother }: Props) {
  const start = new Date(request.timeStartMs);
  const end = new Date(request.timeStartMs + response.estimatedDuration * 3_600_000);

  const handleIcs = () => {
    const ics = buildIcs({
      uid: `mbr-booking-${response.confirmAt}-${request.ownerPhone}@mbrme.com`,
      title: `MBR · ${response.serviceName}`,
      description: `${response.serviceName} — booked at MBR Auto Services. ` +
        `${request.vehicleYear} ${request.vehicleMake} ${request.vehicleModel}` +
        (request.concern ? `\n\nNote: ${request.concern}` : ''),
      location: SHOP_ADDRESS,
      startMs: request.timeStartMs,
      endMs: request.timeStartMs + response.estimatedDuration * 3_600_000,
      organizerEmail: 'service@mbrme.com',
    });
    downloadIcs(`mbr-booking-${formatDateLong(start, 'en').replace(/[^a-z0-9]/gi, '-').toLowerCase()}.ics`, ics);
  };

  const whatsappModify =
    'https://wa.me/+971565015800?text=' +
    encodeURIComponent(
      `Hello MBR, I would like to modify my booking on ` +
        `${formatDateLong(start, 'en')} at ${formatSlotTime(start.getTime(), 'en')} ` +
        `(${response.serviceName}).`,
    );

  return (
    <section
      aria-labelledby="booking-step-5-heading"
      className="booking-step booking-step--confirmation"
      data-step="5"
    >
      <div className="booking-confirmation__icon" aria-hidden="true">
        <FaCheck />
      </div>
      <h2
        id="booking-step-5-heading"
        className="text-display font-light gradient-text mb-4"
      >
        {t('step5Heading', lang)}
      </h2>
      <p className="text-body text-[var(--text-muted)] max-w-xl mx-auto mb-10">
        {t('confirmedSub', lang)}
      </p>

      <dl className="booking-confirmation__details glass-card-premium p-6 md:p-8">
        <div>
          <dt>{t('yourService', lang)}</dt>
          <dd>{response.serviceName}</dd>
        </div>
        <div>
          <dt>{t('yourDate', lang)}</dt>
          <dd>{formatDateLong(start, lang)}</dd>
        </div>
        <div>
          <dt>{t('yourTime', lang)}</dt>
          <dd>
            {formatSlotTime(start.getTime(), lang)} – {formatSlotTime(end.getTime(), lang)}
          </dd>
        </div>
        <div>
          <dt>{t('yourAddress', lang)}</dt>
          <dd>{t('addressLine', lang)}</dd>
        </div>
      </dl>

      <div className="booking-confirmation__cta">
        <button
          type="button"
          onClick={handleIcs}
          className="liquid-glass-btn liquid-glass-btn-secondary inline-flex items-center justify-center gap-3"
        >
          <FaCalendarPlus className="w-4 h-4" aria-hidden="true" />
          <span>{t('saveToCal', lang)}</span>
        </button>
        <a
          href={whatsappModify}
          target="_blank"
          rel="noopener noreferrer"
          className="liquid-glass-btn liquid-glass-btn-primary inline-flex items-center justify-center gap-3"
        >
          <FaWhatsapp className="w-5 h-5" aria-hidden="true" />
          <span>{t('modifyOnWa', lang)}</span>
        </a>
      </div>

      <p className="text-caption text-[var(--text-muted)] mt-8 max-w-lg mx-auto">
        {t('reminderNote', lang)}
      </p>

      <button
        type="button"
        onClick={onBookAnother}
        className="booking-confirmation__again"
      >
        {t('bookAnother', lang)}
      </button>
    </section>
  );
}
