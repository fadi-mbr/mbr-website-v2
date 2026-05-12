/**
 * Minimal client-side .ics generator for the booking confirmation step.
 *
 * No external dependency. Produces a single VEVENT inside a VCALENDAR
 * envelope, with UTC timestamps (DTSTART/DTEND/DTSTAMP) so the file
 * imports cleanly into Google Calendar, Apple Calendar, and Outlook.
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
function fmt(ms: number): string {
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
    'BEGIN:VEVENT',
    `UID:${input.uid}`,
    `DTSTAMP:${fmt(Date.now())}`,
    `DTSTART:${fmt(input.startMs)}`,
    `DTEND:${fmt(input.endMs)}`,
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
