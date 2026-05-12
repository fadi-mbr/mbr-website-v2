/**
 * UAE phone normalisation + visual mask.
 *
 * Server expects E.164 digits with no leading '+', e.g. 971501234567.
 * Mirror that normalisation on the client to keep error states honest.
 */

/**
 * Normalise raw user input to the `971XXXXXXXXX` form.
 * Returns null when the input cannot be coerced into a valid UAE mobile.
 *
 * Rules:
 *   - strip everything but digits
 *   - if it starts with `00`, drop it
 *   - if it starts with `0`, drop the 0 and prepend `971`
 *   - if it has 9 digits and starts with `5`, prepend `971`
 *   - if it has 12 digits and starts with `971`, accept
 *   - otherwise null
 */
export function normalizeUaePhone(raw: string): string | null {
  let digits = raw.replace(/[^\d]/g, '');
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('971')) {
    // already has the country code
  } else if (digits.startsWith('0')) {
    digits = '971' + digits.slice(1);
  } else if (digits.length === 9 && digits.startsWith('5')) {
    digits = '971' + digits;
  } else if (digits.length === 12 && digits.startsWith('971')) {
    // already normalised but lacks any prefix indicator
  } else {
    return null;
  }
  return /^971\d{9}$/.test(digits) ? digits : null;
}

/**
 * Pretty-format a normalised `971XXXXXXXXX` for display.
 * Falls back to the input if it cannot be parsed.
 *
 *   971501234567 → +971 50 123 4567
 */
export function formatUaePhone(value: string): string {
  const n = normalizeUaePhone(value);
  if (!n) return value;
  const cc = n.slice(0, 3);          // 971
  const op = n.slice(3, 5);          // 50
  const a = n.slice(5, 8);           // 123
  const b = n.slice(8);              // 4567
  return `+${cc} ${op} ${a} ${b}`;
}

/**
 * Live-mask user input for the phone field while they type.
 *
 * Strategy: strip non-digits, normalise toward the international form,
 * then re-format. If we cannot normalise yet (still typing) we render
 * a partial mask `+971 5X X…` so the user sees the structure forming.
 */
export function maskUaePhoneInput(raw: string): string {
  const digits = raw.replace(/[^\d]/g, '');
  if (!digits) return '';
  // If we already have a complete number, use the canonical format.
  const norm = normalizeUaePhone(digits);
  if (norm) return formatUaePhone(norm);
  // Else: partial mask — assume UAE 971 prefix.
  let local: string;
  if (digits.startsWith('971')) local = digits.slice(3);
  else if (digits.startsWith('00971')) local = digits.slice(5);
  else if (digits.startsWith('0')) local = digits.slice(1);
  else local = digits;
  if (local.length > 9) local = local.slice(0, 9);
  const parts: string[] = ['+971'];
  if (local.length > 0) parts.push(local.slice(0, 2));
  if (local.length > 2) parts.push(local.slice(2, 5));
  if (local.length > 5) parts.push(local.slice(5, 9));
  return parts.join(' ').trim();
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
