/**
 * Booking-specific date helpers.
 *
 * UAE local-time semantics — the shop is in Dubai (UTC+4). We treat
 * dates as YYYY-MM-DD strings keyed to Asia/Dubai. Slots come back from
 * the API as epoch ms so we can render them with Intl.DateTimeFormat
 * pinned to that zone.
 */

import { BUSINESS_HOURS } from './business-hours';

export const SHOP_TZ = 'Asia/Dubai';

/** Returns a YYYY-MM-DD string for the given Date in shop-local time. */
export function isoDate(d: Date): string {
  // Use sv-SE — yields ISO 8601 dates natively.
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: SHOP_TZ,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/** Day of week (0=Sun..6=Sat) for a Date as observed in the shop tz. */
export function shopDayOfWeek(d: Date): number {
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: SHOP_TZ,
    weekday: 'short',
  }).format(d);
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };
  return map[parts] ?? d.getDay();
}

/**
 * Generate the next N dates starting at `today` in the shop tz.
 * Each item is annotated with whether the shop is open that day
 * (Sundays closed per BUSINESS_HOURS.openDays).
 */
export interface BookableDate {
  iso: string;        // YYYY-MM-DD
  date: Date;         // anchored to noon UTC of that calendar day, safe for formatting
  isToday: boolean;
  isOpen: boolean;
}

export function nextDays(count: number, from: Date = new Date()): BookableDate[] {
  const todayIso = isoDate(from);
  const out: BookableDate[] = [];
  for (let i = 0; i < count; i += 1) {
    // anchor at noon UTC of the next calendar day to avoid DST/zone wobbles
    const base = new Date(from.getTime());
    base.setUTCHours(12, 0, 0, 0);
    base.setUTCDate(base.getUTCDate() + i);
    const iso = isoDate(base);
    const dow = shopDayOfWeek(base);
    const openDays = BUSINESS_HOURS.openDays as readonly number[];
    out.push({
      iso,
      date: base,
      isToday: iso === todayIso,
      isOpen: openDays.includes(dow),
    });
  }
  return out;
}

/** Format a slot's start time as a short human label, e.g. "10:00 AM". */
export function formatSlotTime(startMs: number, lang: 'en' | 'ar'): string {
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-AE' : 'en-US', {
    timeZone: SHOP_TZ,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  }).format(new Date(startMs));
}

/** Format a calendar date as "Mon, May 12" / "الإثنين، ١٢ مايو". */
export function formatDateLabel(d: Date, lang: 'en' | 'ar'): string {
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-AE' : 'en-US', {
    timeZone: SHOP_TZ,
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(d);
}

/** Format a long, human-friendly date for the confirmation screen. */
export function formatDateLong(d: Date, lang: 'en' | 'ar'): string {
  return new Intl.DateTimeFormat(lang === 'ar' ? 'ar-AE' : 'en-US', {
    timeZone: SHOP_TZ,
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }).format(d);
}

/** Day-of-week + day-of-month for the 14-day strip pills. */
export function formatPill(d: Date, lang: 'en' | 'ar'): { dow: string; dom: string } {
  const dow = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-AE' : 'en-US', {
    timeZone: SHOP_TZ,
    weekday: 'short',
  }).format(d);
  const dom = new Intl.DateTimeFormat(lang === 'ar' ? 'ar-AE' : 'en-US', {
    timeZone: SHOP_TZ,
    day: 'numeric',
  }).format(d);
  return { dow, dom };
}
