/**
 * International phone normalisation + visual mask, defaulting to UAE.
 *
 * The booking server and ARC's `/public/appointment` endpoint both expect
 * E.164 digits-only (no leading `+`), e.g. `971501234567` or `447700900123`.
 * We mirror that normalisation on the client so error states are honest.
 *
 * Default behaviour: if the user types a UAE-local form (`05x...`, `5x...`)
 * we assume +971. If the user explicitly types `+` followed by another
 * country code, we accept that as the country code instead.
 */

/**
 * E.164 max length is 15 digits (excluding the +). Minimum subscriber-number
 * length varies by country, but ITU-T requires the whole national + country
 * portion to be at least 7-8 digits. We accept 8-15 to stay lenient without
 * letting through obvious junk.
 */
const E164_MIN_DIGITS = 8;
const E164_MAX_DIGITS = 15;

/** Matches a normalised UAE mobile: 971 + 9 digits, starting with 5. */
const UAE_E164_RE = /^971\d{9}$/;

/**
 * Normalize phone input to E.164 digits (NO leading +, just digits).
 * Defaults to UAE (+971) when the input doesn't contain a country code.
 *
 * Returns null on invalid input. See spec in module header for rules.
 */
export function normalizeIntlPhone(input: string): string | null {
  if (typeof input !== 'string') return null;
  const trimmed = input.trim();
  if (!trimmed) return null;

  // Reject if anything other than digits / + / common separators is present.
  // Letters / unicode digits / etc. → junk.
  if (!/^[+\d\s\-(). ]+$/.test(trimmed)) return null;

  const hasPlus = trimmed.startsWith('+');
  let digits = trimmed.replace(/\D+/g, '');
  if (!digits) return null;

  if (hasPlus) {
    // Explicit international form: trust the country code as typed.
    // Just length-check.
  } else if (digits.startsWith('00')) {
    // 00 = international dial-out prefix; treat the rest as country-coded.
    digits = digits.slice(2);
  } else if (digits.startsWith('971')) {
    // Already UAE country-coded.
  } else if (digits.startsWith('0')) {
    // UAE local form: 0XXXXXXXXX (typically 10 digits like 0501234567).
    // Drop the trunk 0 and prepend 971.
    digits = '971' + digits.slice(1);
  } else if (/^5\d{8}$/.test(digits)) {
    // UAE mobile shorthand: 9 digits starting with 5.
    digits = '971' + digits;
  } else {
    // Anything else without an explicit + or 00 prefix: we cannot guess a
    // country safely. Reject so the user is forced to type +<cc>.
    return null;
  }

  if (digits.length < E164_MIN_DIGITS) return null;
  if (digits.length > E164_MAX_DIGITS) return null;

  return digits;
}

/**
 * Validate normalised E.164 digits (8-15 digits, no leading +).
 */
export function isValidPhoneE164Digits(digits: string): boolean {
  if (typeof digits !== 'string') return false;
  if (!/^\d+$/.test(digits)) return false;
  return (
    digits.length >= E164_MIN_DIGITS && digits.length <= E164_MAX_DIGITS
  );
}

/**
 * Apply a visible mask to phone input.
 *
 * - Empty input → empty string (so we don't fight the user's focus/blur).
 * - Input that normalises to UAE (971…) → "+971 5X XXX XXXX" canonical.
 * - Input starting with `+` and a non-971 country code → leave the user's
 *   `+CC rest` grouping mostly alone, just collapse whitespace.
 * - Local UAE form that hasn't reached enough digits yet → partial mask
 *   "+971 5X XXX XXXX" forming up as they type.
 */
export function maskIntlPhoneInput(raw: string): string {
  if (typeof raw !== 'string' || !raw.trim()) return '';

  const hasPlus = raw.trimStart().startsWith('+');
  const digits = raw.replace(/\D+/g, '');
  if (!digits) return hasPlus ? '+' : '';

  // International form with explicit +: render as `+<cc> <rest grouped>`.
  // If it's a 971 number we still prefer the canonical UAE grouping.
  if (hasPlus) {
    if (digits.startsWith('971')) {
      return formatUaeFromDigits(digits);
    }
    return formatIntlFromDigits(digits);
  }

  // No leading +: assume UAE and use the canonical UAE grouping.
  // Resolve local forms (0XXX, 5XXX) toward 971 first.
  let local: string;
  if (digits.startsWith('00971')) local = digits.slice(5);
  else if (digits.startsWith('971')) local = digits.slice(3);
  else if (digits.startsWith('0')) local = digits.slice(1);
  else local = digits;

  if (local.length > 9) local = local.slice(0, 9);

  return groupUaeLocal('971', local);
}

/**
 * Group UAE digits in `+971 5X XXX XXXX` shape from a digits-only string
 * known to start with 971.
 */
function formatUaeFromDigits(digits: string): string {
  const cc = '971';
  let local = digits.startsWith('971') ? digits.slice(3) : digits;
  if (local.length > 9) local = local.slice(0, 9);
  return groupUaeLocal(cc, local);
}

function groupUaeLocal(cc: string, local: string): string {
  const parts: string[] = [`+${cc}`];
  if (local.length > 0) parts.push(local.slice(0, 2));
  if (local.length > 2) parts.push(local.slice(2, 5));
  if (local.length > 5) parts.push(local.slice(5, 9));
  return parts.join(' ').trim();
}

/**
 * Group non-UAE international digits with a best-effort split:
 *   +<cc> <chunk1> <chunk2> ...
 * We don't know per-country grouping rules so we just split the national
 * portion into 3-4 digit chunks for readability.
 */
function formatIntlFromDigits(digits: string): string {
  // Try common country code lengths: 1, 2, 3.
  // Heuristic: the well-known 1- and 7-prefixed CCs are NANP/Russia.
  // Otherwise use 2 by default and fall back to 3 for known long CCs.
  let cc: string;
  if (digits.startsWith('1') || digits.startsWith('7')) {
    cc = digits.slice(0, 1);
  } else if (
    digits.startsWith('44') ||
    digits.startsWith('33') ||
    digits.startsWith('49') ||
    digits.startsWith('34') ||
    digits.startsWith('39') ||
    digits.startsWith('20') ||
    digits.startsWith('27') ||
    digits.startsWith('30') ||
    digits.startsWith('31') ||
    digits.startsWith('32') ||
    digits.startsWith('36') ||
    digits.startsWith('40') ||
    digits.startsWith('41') ||
    digits.startsWith('43') ||
    digits.startsWith('45') ||
    digits.startsWith('46') ||
    digits.startsWith('47') ||
    digits.startsWith('48') ||
    digits.startsWith('51') ||
    digits.startsWith('52') ||
    digits.startsWith('53') ||
    digits.startsWith('54') ||
    digits.startsWith('55') ||
    digits.startsWith('56') ||
    digits.startsWith('57') ||
    digits.startsWith('58') ||
    digits.startsWith('60') ||
    digits.startsWith('61') ||
    digits.startsWith('62') ||
    digits.startsWith('63') ||
    digits.startsWith('64') ||
    digits.startsWith('65') ||
    digits.startsWith('66') ||
    digits.startsWith('81') ||
    digits.startsWith('82') ||
    digits.startsWith('84') ||
    digits.startsWith('86') ||
    digits.startsWith('90') ||
    digits.startsWith('91') ||
    digits.startsWith('92') ||
    digits.startsWith('93') ||
    digits.startsWith('94') ||
    digits.startsWith('95') ||
    digits.startsWith('98')
  ) {
    cc = digits.slice(0, 2);
  } else {
    cc = digits.slice(0, 3);
  }
  const rest = digits.slice(cc.length);
  // Cap total to E164 max for cosmetic purposes.
  const restCapped = rest.slice(0, E164_MAX_DIGITS - cc.length);
  // Chunk 'rest' into groups of 3-4 digits.
  const chunks: string[] = [];
  let i = 0;
  while (i < restCapped.length) {
    const remaining = restCapped.length - i;
    // Prefer 4-digit final chunk, 3-digit middle chunks.
    const take = remaining <= 4 ? remaining : 3;
    chunks.push(restCapped.slice(i, i + take));
    i += take;
  }
  return [`+${cc}`, ...chunks].join(' ').trim();
}

/**
 * Pretty-format normalised digits for display (best-effort).
 *   971501234567   → +971 50 123 4567
 *   447700900123   → +44 770 090 0123
 */
export function formatIntlPhone(value: string): string {
  const n = normalizeIntlPhone(value);
  if (!n) return value;
  if (n.startsWith('971')) return formatUaeFromDigits(n);
  return formatIntlFromDigits(n);
}

/* -------------------------------------------------------------------------
 * Backwards-compat aliases. The old UAE-only helpers delegate to the new
 * international ones. Existing call sites that strictly want UAE numbers
 * can still rely on `normalizeUaePhone` returning `null` for non-UAE input,
 * because we re-check the 971-prefix shape before returning.
 * ----------------------------------------------------------------------- */

/** @deprecated use `normalizeIntlPhone` */
export function normalizeUaePhone(raw: string): string | null {
  const n = normalizeIntlPhone(raw);
  if (!n) return null;
  return UAE_E164_RE.test(n) ? n : null;
}

/** @deprecated use `formatIntlPhone` */
export function formatUaePhone(value: string): string {
  const n = normalizeUaePhone(value);
  if (!n) return value;
  return formatUaeFromDigits(n);
}

/** @deprecated use `maskIntlPhoneInput` */
export function maskUaePhoneInput(raw: string): string {
  return maskIntlPhoneInput(raw);
}

export const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
