/**
 * Unit tests for `normalisePhone` (UAE E.164 normaliser).
 */

import { normalisePhone } from "../_lib/arc-client";
import { assertEqual, runSuite } from "./_harness";

export default () => runSuite("normalisePhone", [
  // --- successes ---
  {
    name: "international with + and spaces",
    fn: () => assertEqual(normalisePhone("+971 50 123 4567"), "971501234567"),
  },
  {
    name: "international with dashes",
    fn: () => assertEqual(normalisePhone("+971-50-123-4567"), "971501234567"),
  },
  {
    name: "international without + (12 digits)",
    fn: () => assertEqual(normalisePhone("971501234567"), "971501234567"),
  },
  {
    name: "local with leading 0 (10 digits)",
    fn: () => assertEqual(normalisePhone("0501234567"), "971501234567"),
  },
  {
    name: "local with parens",
    fn: () => assertEqual(normalisePhone("(050) 123-4567"), "971501234567"),
  },
  {
    name: "9-digit form starting with 5",
    fn: () => assertEqual(normalisePhone("501234567"), "971501234567"),
  },
  {
    name: "double-zero international prefix",
    fn: () => assertEqual(normalisePhone("00971501234567"), "971501234567"),
  },
  {
    name: "tabbed and weird whitespace",
    fn: () => assertEqual(normalisePhone("\t+971 50 123 4567\n"), "971501234567"),
  },

  // --- failures ---
  {
    name: "non-UAE country code (US)",
    fn: () => assertEqual(normalisePhone("+1 415 555 1234"), null),
  },
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
    name: "too short (8 digits)",
    fn: () => assertEqual(normalisePhone("12345678"), null),
  },
  {
    name: "too long",
    fn: () => assertEqual(normalisePhone("971501234567999"), null),
  },
  {
    name: "starts with 9 digits but not 5 (landline-shaped, rejected)",
    fn: () => assertEqual(normalisePhone("411234567"), null),
  },
]);
