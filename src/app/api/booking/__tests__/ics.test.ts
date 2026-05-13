/**
 * Tests for `src/lib/booking-ics.ts` — the ICS file generator used by the
 * confirmation success card.
 *
 * Covers:
 *   - VTIMEZONE block present, TZID:Asia/Dubai, offset +0400
 *   - DTSTART/DTEND carry `;TZID=Asia/Dubai`, NOT a `Z` UTC suffix
 *   - LOCATION renders the Google Maps URL the operator picked
 *   - DESCRIPTION carries the "Before you come" reminders
 *   - RFC 5545 escaping is honoured (comma, semicolon, newline)
 *   - CRLF line endings
 */

import { buildIcs } from '@/lib/booking-ics';
import { runSuite, assert, assertEqual } from './_harness';

const MAPS_URL = 'https://maps.app.goo.gl/gj9EXG4uchRBtZcE6';
const HUMAN_ADDR = 'MBR Auto Services\\, Al Quoz Industrial 4\\, Dubai\\, UAE';

function rawAddress(): string {
  return 'MBR Auto Services, Al Quoz Industrial 4, Dubai, UAE';
}

function makeIcs(
  overrides: {
    description?: string;
    location?: string;
    startMs?: number;
    endMs?: number;
  } = {},
): string {
  // 2026-05-16 09:00 Dubai = 2026-05-16 05:00 UTC = 1747371600000
  const start = overrides.startMs ?? Date.UTC(2026, 4, 16, 5, 0, 0);
  const end = overrides.endMs ?? Date.UTC(2026, 4, 16, 6, 0, 0);
  return buildIcs({
    uid: 'mbr-booking-test@mbrme.com',
    title: 'MBR — Pre-purchase inspection',
    description:
      overrides.description ??
      [
        'Service: Pre-purchase inspection',
        'Vehicle: 2022 Toyota Land Cruiser',
        'Plate: A 12345',
        '',
        'Before you come:',
        '- Bring your registration card (Mulkiya)',
        '- Clear personal items from the glove box and seats',
        "- If you're running late, please call us on +971 56 501 5800",
      ].join('\n'),
    location:
      overrides.location ?? `${MAPS_URL}\n${rawAddress()}`,
    startMs: start,
    endMs: end,
    organizerEmail: 'booking@mbrme.com',
  });
}

export default function suite() {
  return runSuite('booking-ics', [
    {
      name: 'has a VTIMEZONE block with TZID:Asia/Dubai and offset +0400',
      fn: () => {
        const ics = makeIcs();
        assert(/BEGIN:VTIMEZONE/.test(ics), 'VTIMEZONE block missing');
        assert(/TZID:Asia\/Dubai/.test(ics), 'TZID:Asia/Dubai missing');
        assert(/TZOFFSETFROM:\+0400/.test(ics), 'TZOFFSETFROM:+0400 missing');
        assert(/TZOFFSETTO:\+0400/.test(ics), 'TZOFFSETTO:+0400 missing');
        assert(/TZNAME:GST/.test(ics), 'TZNAME:GST missing');
        assert(/END:VTIMEZONE/.test(ics), 'VTIMEZONE end missing');
      },
    },
    {
      name: 'event DTSTART/DTEND reference Asia/Dubai TZID and are NOT UTC-Z',
      fn: () => {
        const ics = makeIcs();
        // Isolate the VEVENT block — the VTIMEZONE block has its own
        // (anchor) DTSTART:19700101... that we must not match against.
        const eventStart = ics.indexOf('BEGIN:VEVENT');
        const eventEnd = ics.indexOf('END:VEVENT');
        assert(eventStart >= 0 && eventEnd > eventStart, 'VEVENT block missing');
        const eventBlock = ics.slice(eventStart, eventEnd);
        const dtStartLine = eventBlock
          .split('\r\n')
          .find((l) => l.startsWith('DTSTART'));
        const dtEndLine = eventBlock
          .split('\r\n')
          .find((l) => l.startsWith('DTEND'));
        assert(dtStartLine !== undefined, 'event DTSTART missing');
        assert(dtEndLine !== undefined, 'event DTEND missing');
        assert(
          /^DTSTART;TZID=Asia\/Dubai:/.test(dtStartLine ?? ''),
          `DTSTART must carry TZID — got: ${dtStartLine}`,
        );
        assert(
          /^DTEND;TZID=Asia\/Dubai:/.test(dtEndLine ?? ''),
          `DTEND must carry TZID — got: ${dtEndLine}`,
        );
        assert(
          !/Z$/.test(dtStartLine ?? ''),
          'event DTSTART must not be UTC-Z form',
        );
        assert(
          !/Z$/.test(dtEndLine ?? ''),
          'event DTEND must not be UTC-Z form',
        );
      },
    },
    {
      name: 'event DTSTART wall-clock time matches Dubai local (09:00 expected)',
      fn: () => {
        const ics = makeIcs();
        const eventStart = ics.indexOf('BEGIN:VEVENT');
        const eventEnd = ics.indexOf('END:VEVENT');
        const eventBlock = ics.slice(eventStart, eventEnd);
        const dtStartLine =
          eventBlock.split('\r\n').find((l) => l.startsWith('DTSTART')) ?? '';
        assertEqual(
          dtStartLine,
          'DTSTART;TZID=Asia/Dubai:20260516T090000',
        );
        const dtEndLine =
          eventBlock.split('\r\n').find((l) => l.startsWith('DTEND')) ?? '';
        assertEqual(
          dtEndLine,
          'DTEND;TZID=Asia/Dubai:20260516T100000',
        );
      },
    },
    {
      name: 'DTSTAMP stays in UTC (Z suffix) per RFC 5545',
      fn: () => {
        const ics = makeIcs();
        const dtStampLine =
          ics.split('\r\n').find((l) => l.startsWith('DTSTAMP')) ?? '';
        assert(
          /^DTSTAMP:\d{8}T\d{6}Z$/.test(dtStampLine),
          `DTSTAMP must be UTC-Z — got: ${dtStampLine}`,
        );
      },
    },
    {
      name: 'LOCATION contains the Google Maps URL',
      fn: () => {
        const ics = makeIcs();
        const locationLine =
          ics.split('\r\n').find((l) => l.startsWith('LOCATION:')) ?? '';
        assert(
          locationLine.includes('https://maps.app.goo.gl/gj9EXG4uchRBtZcE6'),
          `LOCATION must include the Maps URL — got: ${locationLine}`,
        );
        // ICS comma escaping must have run on the human address half.
        assert(
          locationLine.includes(HUMAN_ADDR),
          `LOCATION must include the escaped human address — got: ${locationLine}`,
        );
      },
    },
    {
      name: 'DESCRIPTION includes all three "Before you come" reminders',
      fn: () => {
        const ics = makeIcs();
        const descLine =
          ics.split('\r\n').find((l) => l.startsWith('DESCRIPTION:')) ?? '';
        assert(
          descLine.includes('Before you come'),
          'DESCRIPTION must have the "Before you come" header',
        );
        assert(
          descLine.includes('Bring your registration card (Mulkiya)'),
          'DESCRIPTION must mention Mulkiya',
        );
        assert(
          descLine.includes(
            'Clear personal items from the glove box and seats',
          ),
          'DESCRIPTION must mention clearing personal items',
        );
        assert(
          descLine.includes(
            "If you're running late\\, please call us on +971 56 501 5800",
          ),
          'DESCRIPTION must mention the late-arrival phone line (escaped)',
        );
      },
    },
    {
      name: 'free-text fields are RFC 5545 escaped (\\n, \\,, \\;)',
      fn: () => {
        const ics = buildIcs({
          uid: 'esc-test@mbrme.com',
          title: 'MBR; Inspection, fast',
          description: 'line1\nline2; with, commas',
          location: 'a, b; c',
          startMs: Date.UTC(2026, 4, 16, 5, 0, 0),
          endMs: Date.UTC(2026, 4, 16, 6, 0, 0),
        });
        assert(
          ics.includes('SUMMARY:MBR\\; Inspection\\, fast'),
          'semicolon + comma must be escaped in SUMMARY',
        );
        assert(
          ics.includes('DESCRIPTION:line1\\nline2\\; with\\, commas'),
          'newline, semicolon, comma must be escaped in DESCRIPTION',
        );
        assert(
          ics.includes('LOCATION:a\\, b\\; c'),
          'comma + semicolon must be escaped in LOCATION',
        );
      },
    },
    {
      name: 'output uses CRLF line endings (RFC 5545)',
      fn: () => {
        const ics = makeIcs();
        // Every line break must be \r\n, never bare \n inside the wire form.
        // The escaped \n inside DESCRIPTION/LOCATION is a literal backslash-n,
        // not a real line break — so a check on bare \n that isn't preceded
        // by \r is the right invariant.
        const lines = ics.split('\r\n');
        assert(lines.length > 5, 'ICS must contain multiple CRLF lines');
        const hasBareLF = /(?<!\r)\n/.test(ics);
        assert(!hasBareLF, 'ICS must not contain bare LF outside CRLF');
      },
    },
  ]);
}
