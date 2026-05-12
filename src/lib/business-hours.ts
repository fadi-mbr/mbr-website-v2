/**
 * Business hours: single source of truth.
 *
 * Used by:
 *   - structured-data.ts  (Schema.org openingHoursSpecification)
 *   - SophisticatedHero    ("Open Now" / "Closed" pill)
 *   - ContactSection       (Working Hours card + weekly grid)
 */

export const BUSINESS_HOURS = {
  /** 24h opening time, used for the isShopOpen check and the schema */
  open: { hours: 8, minutes: 30 },
  /** 24h closing time */
  close: { hours: 19, minutes: 30 },
  /** Days the shop is open (JS Date.getDay() values: 0=Sun, 1=Mon, ...) */
  openDays: [1, 2, 3, 4, 5, 6] as const,
  /** ISO 8601 time strings for Schema.org openingHoursSpecification */
  schemaOpens: '08:30',
  schemaCloses: '19:30',
  /** Day-of-week values for Schema.org openingHoursSpecification */
  schemaDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'] as const,
  /** Display strings for the UI */
  displayHours: '8:30 AM - 7:30 PM',
  displayDayRange: 'Mon - Sat',
  closedNote: 'Sunday: Closed',
  closedDay: 'Sunday',
} as const;

/** Returns true if `now` falls inside business hours. */
export function isShopOpen(now: Date): boolean {
  const day = now.getDay();
  if (!(BUSINESS_HOURS.openDays as readonly number[]).includes(day)) return false;
  const minutes = now.getHours() * 60 + now.getMinutes();
  const open = BUSINESS_HOURS.open.hours * 60 + BUSINESS_HOURS.open.minutes;
  const close = BUSINESS_HOURS.close.hours * 60 + BUSINESS_HOURS.close.minutes;
  return minutes >= open && minutes < close;
}

/** Weekly hours rows for the contact section's day-by-day display. */
export function getWeeklyHours(): Array<{ day: string; hours: string }> {
  return [
    { day: 'Monday', hours: BUSINESS_HOURS.displayHours },
    { day: 'Tuesday', hours: BUSINESS_HOURS.displayHours },
    { day: 'Wednesday', hours: BUSINESS_HOURS.displayHours },
    { day: 'Thursday', hours: BUSINESS_HOURS.displayHours },
    { day: 'Friday', hours: BUSINESS_HOURS.displayHours },
    { day: 'Saturday', hours: BUSINESS_HOURS.displayHours },
    { day: BUSINESS_HOURS.closedDay, hours: 'Closed' },
  ];
}
