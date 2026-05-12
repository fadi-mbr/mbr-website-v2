/**
 * EN-only string table for the booking v2 single-screen form.
 *
 * v2.0 is EN-only by user decision (2026-05-12) — Arabic deferred to v2.1.
 * A flat `as const` map keeps the import surface dead-simple and dodges
 * a runtime i18n dependency.
 *
 * Used by `BookingForm`, `BookingFormClient`, the confirm landing, and the
 * agent flow.
 */

export const bookingStrings = {
  // Service step
  "service.title": "Choose your service",
  "service.subtitle": "Tap a service to see available times.",

  // When step
  "when.title": "Pick a date & time",
  "when.dateHeader": "Date",
  "when.timeHeader": "Available times",
  "when.noSlots": "No times available — try another day.",

  // You step
  "you.title": "Your details",
  "you.firstName": "First name",
  "you.lastName": "Last name",
  "you.phone": "Phone (UAE)",
  "you.email": "Email",

  // Vehicle step
  "vehicle.title": "Vehicle",
  "vehicle.year": "Year",
  "vehicle.make": "Make",
  "vehicle.model": "Model",
  "vehicle.plate": "Plate",

  // Notes step
  "notes.title": "Notes (optional)",
  "notes.placeholder": "Anything we should know in advance?",

  // Submit
  "submit.label": "Request booking",
  "submit.busy": "Sending…",
  "submit.agentLabel": "Confirm booking",
  "submit.agentBusy": "Confirming…",

  // Confirmation states (public flow)
  "confirm.checkEmail.title": "Check your email",
  "confirm.checkEmail.body":
    "We sent a confirmation link to your inbox. Click it within 30 minutes to lock in your appointment.",
  "confirm.success.title": "Booking confirmed",
  "confirm.success.body":
    "We've got you in the calendar. We'll be in touch if anything changes.",
  "confirm.expired.title": "Link expired",
  "confirm.expired.body":
    "This confirmation link has expired. Please submit a new booking request.",
  "confirm.used.title": "Already confirmed",
  "confirm.used.body":
    "This booking has already been confirmed. Check your email for the calendar invite.",

  // Errors
  "error.generic": "Something went wrong. Please try again.",
  "error.rateLimit":
    "Only one booking per phone per hour. Please call us if this is urgent.",
  "error.slotTaken":
    "That slot was just booked — please pick another time.",
  "error.phoneProblem":
    "We can't reach this phone number — please double-check or try another.",
  "error.unknownService": "Please choose a service from the list.",
  "error.arcDown": "Booking system unavailable. Please retry shortly.",
} as const;

export type BookingStringKey = keyof typeof bookingStrings;

export function s(key: BookingStringKey): string {
  return bookingStrings[key];
}
