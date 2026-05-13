/**
 * Unit tests for `normalisePhone` (now international, UAE-default).
 *
 * `normalisePhone` is the booking server's phone normaliser. It delegates
 * to `normalizeIntlPhone` from `@/lib/booking-phone` and accepts:
 *
 *   - UAE local forms (`05x...`, `5x...`, `971...`)
 *   - International forms starting with `+<cc>` or `00<cc>`
 *
 * Returns E.164 digits-only (no leading `+`).
 */

import { normalisePhone } from "../_lib/arc-client";
import {
  isValidPhoneE164Digits,
  maskIntlPhoneInput,
  normalizeIntlPhone,
} from "@/lib/booking-phone";
import { assert, assertEqual, runSuite } from "./_harness";

export default () => runSuite("normalisePhone (intl)", [
  // --- UAE successes ---
  {
    name: "UAE international with + and spaces",
    fn: () => assertEqual(normalisePhone("+971 50 123 4567"), "971501234567"),
  },
  {
    name: "UAE international with dashes",
    fn: () => assertEqual(normalisePhone("+971-50-123-4567"), "971501234567"),
  },
  {
    name: "UAE international without + (12 digits)",
    fn: () => assertEqual(normalisePhone("971501234567"), "971501234567"),
  },
  {
    name: "UAE local with leading 0 (10 digits)",
    fn: () => assertEqual(normalisePhone("0501234567"), "971501234567"),
  },
  {
    name: "UAE local with parens",
    fn: () => assertEqual(normalisePhone("(050) 123-4567"), "971501234567"),
  },
  {
    name: "UAE 9-digit form starting with 5",
    fn: () => assertEqual(normalisePhone("501234567"), "971501234567"),
  },
  {
    name: "UAE 9-digit form with spaces",
    fn: () => assertEqual(normalisePhone("50 1234567"), "971501234567"),
  },
  {
    name: "UAE double-zero international prefix",
    fn: () => assertEqual(normalisePhone("00971501234567"), "971501234567"),
  },
  {
    name: "UAE 00971 with spaces",
    fn: () => assertEqual(normalisePhone("00971 50 1234567"), "971501234567"),
  },
  {
    name: "tabbed and weird whitespace",
    fn: () => assertEqual(normalisePhone("\t+971 50 123 4567\n"), "971501234567"),
  },

  // --- International successes ---
  {
    name: "UK number with + and spaces",
    fn: () => assertEqual(normalisePhone("+44 7700 900123"), "447700900123"),
  },
  {
    name: "US number with + and spaces",
    fn: () => assertEqual(normalisePhone("+1 555 123 4567"), "15551234567"),
  },
  {
    name: "US number with 00 prefix",
    fn: () => assertEqual(normalisePhone("00 1 415 555 1234"), "14155551234"),
  },
  {
    name: "Saudi +966 number",
    fn: () => assertEqual(normalisePhone("+966 50 123 4567"), "966501234567"),
  },
  {
    name: "Indian +91 number",
    fn: () => assertEqual(normalisePhone("+91 98765 43210"), "919876543210"),
  },

  // --- failures ---
  {
    name: "empty string",
    fn: () => assertEqual(normalisePhone(""), null),
  },
  {
    name: "whitespace only",
    fn: () => assertEqual(normalisePhone("   "), null),
  },
  {
    name: "garbage letters",
    fn: () => assertEqual(normalisePhone("not-a-phone"), null),
  },
  {
    name: "contains letters mid-string",
    fn: () => assertEqual(normalisePhone("+971 50abc 1234"), null),
  },
  {
    name: "too short (7 digits, no + or 0)",
    fn: () => assertEqual(normalisePhone("1234567"), null),
  },
  {
    name: "too long (>15 digits)",
    fn: () => assertEqual(normalisePhone("+9715012345678901"), null),
  },
  {
    name: "naked 411234567 (UAE-shape but landline, no country code) is rejected",
    fn: () => assertEqual(normalisePhone("411234567"), null),
  },

  // --- isValidPhoneE164Digits ---
  {
    name: "isValidPhoneE164Digits accepts 8 digits",
    fn: () => assertEqual(isValidPhoneE164Digits("12345678"), true),
  },
  {
    name: "isValidPhoneE164Digits accepts 15 digits",
    fn: () => assertEqual(isValidPhoneE164Digits("123456789012345"), true),
  },
  {
    name: "isValidPhoneE164Digits rejects 7 digits",
    fn: () => assertEqual(isValidPhoneE164Digits("1234567"), false),
  },
  {
    name: "isValidPhoneE164Digits rejects 16 digits",
    fn: () => assertEqual(isValidPhoneE164Digits("1234567890123456"), false),
  },
  {
    name: "isValidPhoneE164Digits rejects + prefix",
    fn: () => assertEqual(isValidPhoneE164Digits("+12345678"), false),
  },

  // --- maskIntlPhoneInput ---
  {
    name: "mask empty input → empty string",
    fn: () => assertEqual(maskIntlPhoneInput(""), ""),
  },
  {
    name: "mask UAE partial '5' → '+971 5'",
    fn: () => assertEqual(maskIntlPhoneInput("5"), "+971 5"),
  },
  {
    name: "mask UAE local '0501234567' → '+971 50 123 4567'",
    fn: () => assertEqual(maskIntlPhoneInput("0501234567"), "+971 50 123 4567"),
  },
  {
    name: "mask UAE complete '971501234567' → '+971 50 123 4567'",
    fn: () => assertEqual(maskIntlPhoneInput("971501234567"), "+971 50 123 4567"),
  },
  {
    name: "mask UK '+44 7700 900123' returns intl-shaped",
    fn: () => {
      const masked = maskIntlPhoneInput("+44 7700 900123");
      // Must start with +44 and contain digits.
      assert(masked.startsWith("+44 "), `got ${JSON.stringify(masked)}`);
      assertEqual(masked.replace(/\D+/g, ""), "447700900123");
    },
  },

  // --- normalizeIntlPhone is the same surface as normalisePhone (alias check) ---
  {
    name: "normalizeIntlPhone alias agrees with normalisePhone",
    fn: () => assertEqual(
      normalizeIntlPhone("050 1234567"),
      normalisePhone("050 1234567")
    ),
  },
]);
