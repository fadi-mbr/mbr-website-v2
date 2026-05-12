/**
 * HMAC-SHA256 magic-link token for the public booking flow.
 *
 * Wire format: `<base64url(json)>.<base64url(hmacSha256(json, secret))>`
 *
 * Payload JSON shape:
 *   { v: 1, id: string, exp: number (epoch-ms), iat: number, fp: string }
 *
 * Why Web Crypto (not node:crypto)? This module runs in both Node and Edge
 * runtimes — `crypto.subtle` is the only API available in both. The signing
 * secret is passed as a 64-char hex string (32 bytes) and decoded to raw
 * bytes inside this module.
 *
 * Verify steps:
 *   1) split on `.` → header (b64url JSON) + sig (b64url HMAC)
 *   2) recompute HMAC of header bytes; constant-time compare
 *   3) assert payload.v === 1
 *   4) assert payload.exp > Date.now()
 *   5) caller validates `fp` against the KV-stored intent
 *
 * No dependency on `node:crypto` so this works on the Edge runtime too.
 */

export interface BookingTokenPayload {
  v: 1;
  id: string;
  exp: number;
  iat: number;
  fp: string;
}

export type VerifyResult =
  | { ok: true; payload: BookingTokenPayload }
  | {
      ok: false;
      reason: "malformed" | "bad-signature" | "expired" | "bad-version";
    };

// ---------------------------------------------------------------------------
// base64url helpers (URL-safe, no padding)
// ---------------------------------------------------------------------------

function bytesToBase64Url(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i]);
  // btoa is available in both Node 20+ and Edge runtime.
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function base64UrlToBytes(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? 0 : 4 - (s.length % 4);
  const b64 = s.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat(pad);
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

function utf8Encode(s: string): Uint8Array {
  return new TextEncoder().encode(s);
}

function utf8Decode(b: Uint8Array): string {
  return new TextDecoder().decode(b);
}

function hexToBytes(hex: string): Uint8Array {
  if (hex.length % 2 !== 0) {
    throw new Error("booking-token: secret hex must have even length");
  }
  const out = new Uint8Array(hex.length / 2);
  for (let i = 0; i < out.length; i++) {
    const byte = parseInt(hex.substr(i * 2, 2), 16);
    if (Number.isNaN(byte)) {
      throw new Error("booking-token: secret hex contains non-hex characters");
    }
    out[i] = byte;
  }
  return out;
}

function bytesToHex(bytes: Uint8Array): string {
  let s = "";
  for (let i = 0; i < bytes.length; i++) {
    s += bytes[i].toString(16).padStart(2, "0");
  }
  return s;
}

/** Constant-time byte comparison. Returns true if equal length and contents. */
function constantTimeEqual(a: Uint8Array, b: Uint8Array): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a[i] ^ b[i];
  return diff === 0;
}

// ---------------------------------------------------------------------------
// HMAC primitive
// ---------------------------------------------------------------------------

/** Copy a Uint8Array into a fresh ArrayBuffer so SubtleCrypto types accept it. */
function toBufferSource(b: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(b.byteLength);
  new Uint8Array(out).set(b);
  return out;
}

async function hmacSha256(data: Uint8Array, secretHex: string): Promise<Uint8Array> {
  const keyBytes = hexToBytes(secretHex);
  const key = await crypto.subtle.importKey(
    "raw",
    toBufferSource(keyBytes),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, toBufferSource(data));
  return new Uint8Array(sig);
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Random v4 UUID. */
export function generateTokenId(): string {
  return crypto.randomUUID();
}

/**
 * Stable 8-char SHA-256 hex fingerprint of `phone+email` (raw concatenation,
 * lowercased email — phone is already digits-only at this layer). Used to
 * bind a token to the intent it was issued for: a leaked token can't be
 * replayed if the intent's phone/email were swapped.
 */
export async function fingerprint(phone: string, email: string): Promise<string> {
  const data = utf8Encode(`${phone}${email.toLowerCase()}`);
  const hash = await crypto.subtle.digest("SHA-256", toBufferSource(data));
  return bytesToHex(new Uint8Array(hash)).slice(0, 8);
}

/** Sign a payload and emit the wire-format token. */
export async function signToken(
  payload: BookingTokenPayload,
  secretHex: string,
): Promise<string> {
  if (payload.v !== 1) {
    throw new Error("booking-token: only v:1 payloads are supported");
  }
  const headerJson = JSON.stringify(payload);
  const headerBytes = utf8Encode(headerJson);
  const sigBytes = await hmacSha256(headerBytes, secretHex);
  return `${bytesToBase64Url(headerBytes)}.${bytesToBase64Url(sigBytes)}`;
}

/** Verify a token. See module header for reason-code semantics. */
export async function verifyToken(
  token: string,
  secretHex: string,
  now: number = Date.now(),
): Promise<VerifyResult> {
  if (typeof token !== "string" || token.length === 0) {
    return { ok: false, reason: "malformed" };
  }
  const parts = token.split(".");
  if (parts.length !== 2) return { ok: false, reason: "malformed" };
  const [headerB64, sigB64] = parts;

  let headerBytes: Uint8Array;
  let sigBytes: Uint8Array;
  try {
    headerBytes = base64UrlToBytes(headerB64);
    sigBytes = base64UrlToBytes(sigB64);
  } catch {
    return { ok: false, reason: "malformed" };
  }

  let expected: Uint8Array;
  try {
    expected = await hmacSha256(headerBytes, secretHex);
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (!constantTimeEqual(expected, sigBytes)) {
    return { ok: false, reason: "bad-signature" };
  }

  // Signature verified — now parse and shape-check the payload.
  let parsed: unknown;
  try {
    parsed = JSON.parse(utf8Decode(headerBytes));
  } catch {
    return { ok: false, reason: "malformed" };
  }
  if (
    typeof parsed !== "object" ||
    parsed === null ||
    typeof (parsed as Record<string, unknown>).id !== "string" ||
    typeof (parsed as Record<string, unknown>).exp !== "number" ||
    typeof (parsed as Record<string, unknown>).iat !== "number" ||
    typeof (parsed as Record<string, unknown>).fp !== "string"
  ) {
    return { ok: false, reason: "malformed" };
  }
  const p = parsed as BookingTokenPayload;
  if (p.v !== 1) return { ok: false, reason: "bad-version" };
  if (p.exp <= now) return { ok: false, reason: "expired" };

  return { ok: true, payload: p };
}
