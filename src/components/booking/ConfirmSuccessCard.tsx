/**
 * Success card for the `/book/confirm` flow.
 *
 * Extracted from `src/app/book/confirm/page.tsx` so both the server-rendered
 * fallback and the client `<ConfirmInProgress>` swap-in render identical
 * markup. Pure presentation — receives the `ConfirmResult.ok` payload as
 * props and renders the calendar download + contact CTAs.
 */

import { FaWhatsapp, FaCalendarAlt } from 'react-icons/fa';
import { buildIcs } from '@/lib/booking-ics';
import { BUSINESS_HOURS } from '@/lib/business-hours';
import { MBR_WHATSAPP, MBR_PHONE } from './ConfirmErrorCard';

const MBR_ADDRESS_HUMAN = 'MBR Auto Services, Al Quoz Industrial 4, Dubai, UAE';
const MBR_MAPS_URL = 'https://maps.app.goo.gl/gj9EXG4uchRBtZcE6';
// Operator preference: LOCATION = clickable Maps URL first, then the
// human address on a second line. Most calendar clients turn the first
// URL they see into a tap-to-navigate link.
const MBR_LOCATION = `${MBR_MAPS_URL}\n${MBR_ADDRESS_HUMAN}`;

const BEFORE_YOU_COME = [
  'Before you come:',
  '- Bring your registration card (Mulkiya)',
  '- Clear personal items from the glove box and seats',
  '- If you\'re running late, please call us on +971 56 501 5800',
].join('\n');

export interface ConfirmSuccessCardProps {
  firstName: string;
  serviceName: string;
  arcAppointmentId?: number;
  /** Epoch ms for the appointment start time. */
  timeStartMs: number;
  estimatedDuration: number;
  vehicleYear: number;
  vehicleMake: string;
  vehicleModel: string;
  plate?: string;
  notes?: string;
  tokenId: string;
}

function formatDubai(ms: number): string {
  try {
    return new Intl.DateTimeFormat('en-GB', {
      timeZone: 'Asia/Dubai',
      weekday: 'long',
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(new Date(ms));
  } catch {
    return new Date(ms).toISOString();
  }
}

/** Convert a UTF-8 string to a base64 data URI for inline downloads. */
function icsDataUri(content: string): string {
  // Buffer is available in Node; on the client we fall back to btoa.
  if (typeof Buffer !== 'undefined') {
    const b64 = Buffer.from(content, 'utf8').toString('base64');
    return `data:text/calendar;charset=utf-8;base64,${b64}`;
  }
  const b64 =
    typeof btoa === 'function'
      ? btoa(unescape(encodeURIComponent(content)))
      : '';
  return `data:text/calendar;charset=utf-8;base64,${b64}`;
}

export function ConfirmSuccessCard(props: ConfirmSuccessCardProps) {
  const {
    firstName,
    serviceName,
    arcAppointmentId,
    timeStartMs,
    estimatedDuration,
    vehicleYear,
    vehicleMake,
    vehicleModel,
    plate,
    notes,
    tokenId,
  } = props;

  const endMs = timeStartMs + estimatedDuration * 60 * 60 * 1000;
  const when = formatDubai(timeStartMs);

  const descLines: string[] = [
    `Service: ${serviceName}`,
    `Vehicle: ${vehicleYear} ${vehicleMake} ${vehicleModel}`,
  ];
  if (plate) descLines.push(`Plate: ${plate}`);
  if (notes) descLines.push(`Notes: ${notes}`);
  descLines.push('', BEFORE_YOU_COME);

  const icsContent = buildIcs({
    uid: `mbr-booking-${tokenId}@mbrme.com`,
    title: `MBR — ${serviceName}`,
    description: descLines.join('\n'),
    location: MBR_LOCATION,
    startMs: timeStartMs,
    endMs,
    organizerEmail: 'booking@mbrme.com',
  });
  const icsHref = icsDataUri(icsContent);
  const icsFilename = `mbr-booking-${tokenId.slice(0, 8)}.ics`;

  return (
    <div className="min-h-screen bg-black text-white">
      <main className="mx-auto max-w-[720px] px-4 py-16">
        <div className="rounded-lg border border-[#E30613]/40 bg-neutral-950 p-6">
          <p className="text-xs uppercase tracking-[0.25em] text-[#E30613] mb-2">
            Booking confirmed
          </p>
          <h1 className="text-2xl font-light mb-4">
            We&apos;ll see you on{' '}
            <span className="text-[#E30613]">{when}</span>.
          </h1>
          <p className="text-sm text-neutral-300 leading-relaxed mb-6">
            Hi {firstName}, your booking for{' '}
            <strong className="text-white">{serviceName}</strong> is in our
            calendar.
            {arcAppointmentId !== undefined && (
              <>
                {' '}Reference{' '}
                <span className="font-mono text-[#E30613]">
                  #{arcAppointmentId}
                </span>
                .
              </>
            )}
          </p>

          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-y-3 gap-x-6 text-sm border-t border-neutral-800 pt-4 mb-6">
            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-500">
                Vehicle
              </dt>
              <dd className="text-white">
                {vehicleYear} {vehicleMake} {vehicleModel}
                {plate && (
                  <span className="text-neutral-400"> · {plate}</span>
                )}
              </dd>
            </div>
            <div>
              <dt className="text-xs uppercase tracking-wide text-neutral-500">
                Duration
              </dt>
              <dd className="text-white">
                {estimatedDuration === 1
                  ? '1 hour'
                  : `${estimatedDuration} hours`}
              </dd>
            </div>
            <div className="sm:col-span-2">
              <dt className="text-xs uppercase tracking-wide text-neutral-500">
                Location
              </dt>
              <dd className="text-white">
                <a
                  href={MBR_MAPS_URL}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#E30613] hover:text-white underline-offset-4 hover:underline"
                >
                  {MBR_ADDRESS_HUMAN}
                </a>
              </dd>
            </div>
          </dl>

          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <a
              href={icsHref}
              download={icsFilename}
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 bg-[#E30613] text-black font-medium hover:bg-[#FF1A2E] focus:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:ring-offset-black focus-visible:ring-[#E30613]"
            >
              <FaCalendarAlt className="w-4 h-4" aria-hidden="true" />
              Add to calendar (.ics)
            </a>
            <a
              href={`https://wa.me/${MBR_WHATSAPP.replace(/[^\d]/g, '')}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-2 rounded-lg px-5 py-3 border border-neutral-700 text-white hover:border-[#E30613] focus:outline-none focus-visible:ring-2 focus-visible:ring-[#E30613]"
            >
              <FaWhatsapp className="w-4 h-4" aria-hidden="true" />
              Message us
            </a>
          </div>

          <p className="text-xs text-neutral-500 leading-relaxed">
            Need to change or cancel? Reply to the WhatsApp thread or call{' '}
            <a
              href={`tel:${MBR_PHONE}`}
              className="text-[#E30613] hover:text-white"
            >
              {MBR_PHONE}
            </a>
            . Our hours: {BUSINESS_HOURS.displayDayRange},{' '}
            {BUSINESS_HOURS.displayHours}.
          </p>
        </div>
      </main>
    </div>
  );
}
