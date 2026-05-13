/**
 * Minimal client-side .ics generator for the booking confirmation step.
 *
 * No external dependency. Produces a single VEVENT inside a VCALENDAR
 * envelope, with `DTSTART`/`DTEND` referencing a `VTIMEZONE` block for
 * Asia/Dubai so calendar apps render the appointment in the shop's local
 * time (GMT+4) instead of UTC.
 *
 * `DTSTAMP` stays in UTC per RFC 5545 — only the local event times use the
 * floating TZID form.
 */

interface IcsInput {
  uid: string;          // stable booking identifier
  title: string;
  description?: string;
  location?: string;
  startMs: number;      // epoch ms (UTC)
  endMs: number;        // epoch ms (UTC)
  organizerEmail?: string;
}

/** Pad to 2 digits. */
const pad = (n: number): string => String(n).padStart(2, '0');

/** Format an epoch-ms timestamp as `YYYYMMDDTHHMMSSZ` (UTC, basic form). */
function fmtUtc(ms: number): string {
  const d = new Date(ms);
  return (
    String(d.getUTCFullYear()) +
    pad(d.getUTCMonth() + 1) +
    pad(d.getUTCDate()) +
    'T' +
    pad(d.getUTCHours()) +
    pad(d.getUTCMinutes()) +
    pad(d.getUTCSeconds()) +
    'Z'
  );
}

/**
 * Format an epoch-ms timestamp as `YYYYMMDDTHHMMSS` (no Z) wall-clock time
 * in Asia/Dubai. Dubai is a no-DST, fixed-offset +04:00 zone so the math
 * is trivial: shift by 4h and emit the resulting UTC components.
 */
function fmtDubai(ms: number): string {
  const shifted = new Date(ms + 4 * 60 * 60 * 1000);
  return (
    String(shifted.getUTCFullYear()) +
    pad(shifted.getUTCMonth() + 1) +
    pad(shifted.getUTCDate()) +
    'T' +
    pad(shifted.getUTCHours()) +
    pad(shifted.getUTCMinutes()) +
    pad(shifted.getUTCSeconds())
  );
}

/** Escape a free-text field per RFC 5545. */
function esc(s: string): string {
  return s.replace(/\\/g, '\\\\').replace(/\n/g, '\\n').replace(/,/g, '\\,').replace(/;/g, '\\;');
}

/** Build a VCALENDAR string for a single booking event. */
export function buildIcs(input: IcsInput): string {
  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//MBR Auto Services//Booking//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    // Asia/Dubai is a no-DST fixed offset +04:00.
    'BEGIN:VTIMEZONE',
    'TZID:Asia/Dubai',
    'BEGIN:STANDARD',
    'DTSTART:19700101T000000',
    'TZOFFSETFROM:+0400',
    'TZOFFSETTO:+0400',
    'TZNAME:GST',
    'END:STANDARD',
    'END:VTIMEZONE',
    'BEGIN:VEVENT',
    `UID:${input.uid}`,
    `DTSTAMP:${fmtUtc(Date.now())}`,
    `DTSTART;TZID=Asia/Dubai:${fmtDubai(input.startMs)}`,
    `DTEND;TZID=Asia/Dubai:${fmtDubai(input.endMs)}`,
    `SUMMARY:${esc(input.title)}`,
    input.description ? `DESCRIPTION:${esc(input.description)}` : '',
    input.location ? `LOCATION:${esc(input.location)}` : '',
    input.organizerEmail ? `ORGANIZER:mailto:${input.organizerEmail}` : '',
    'END:VEVENT',
    'END:VCALENDAR',
    '',
  ].filter(Boolean);
  // RFC 5545 requires CRLF line endings.
  return lines.join('\r\n');
}

/** Trigger a browser download of the given .ics content. */
export function downloadIcs(filename: string, content: string): void {
  if (typeof window === 'undefined') return;
  const blob = new Blob([content], { type: 'text/calendar;charset=utf-8' });
  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}
