/**
 * Unit tests for the HMAC magic-link token (src/lib/booking-token.ts).
 *
 * v:2 — payload carries the full BookingIntent inline; no KV lookup needed
 * at confirm time. Legacy v:1 tokens are no longer honored and must fail
 * verification with reason `bad-version`.
 */

import {
  signToken,
  verifyToken,
  fingerprint,
  generateTokenId,
  type TokenPayload,
  type TokenIntent,
} from "@/lib/booking-token";
import { assert, assertEqual, runSuite } from "./_harness";

const SECRET_A =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const SECRET_B =
  "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";

function makeIntent(overrides: Partial<TokenIntent> = {}): TokenIntent {
  return {
    serviceId: 42,
    serviceName: "Major service",
    timeStartMs: 1_700_086_400_000,
    durationH: 2,
    firstName: "Fadi",
    lastName: "Kelzia",
    phone: "971500000088",
    email: "fadi@example.com",
    vehicleYear: 2021,
    vehicleMake: "Porsche",
    vehicleModel: "Cayenne",
    plate: "A12345",
    notes: "Please check the brakes — they squeal at low speed.",
    ...overrides,
  };
}

function makePayload(overrides: Partial<TokenPayload> = {}): TokenPayload {
  return {
    v: 2,
    id: "11111111-2222-3333-4444-555555555555",
    iat: 1_700_000_000_000,
    exp: 1_700_000_000_000 + 30 * 60 * 1000,
    fp: "deadbeef",
    intent: makeIntent(),
    ...overrides,
  };
}

function base64UrlEncode(s: string): string {
  return Buffer.from(s, "utf8")
    .toString("base64")
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/, "");
}

function toBuf(u8: Uint8Array): ArrayBuffer {
  const out = new ArrayBuffer(u8.byteLength);
  new Uint8Array(out).set(u8);
  return out;
}

async function rawHmacB64Url(headerBytes: Uint8Array, secretHex: string): Promise<string> {
  const keyBytes = new Uint8Array(secretHex.length / 2);
  for (let i = 0; i < keyBytes.length; i++) {
    keyBytes[i] = parseInt(secretHex.substr(i * 2, 2), 16);
  }
  const key = await crypto.subtle.importKey(
    "raw",
    toBuf(keyBytes),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = new Uint8Array(await crypto.subtle.sign("HMAC", key, toBuf(headerBytes)));
  let s = "";
  for (let i = 0; i < sig.length; i++) s += String.fromCharCode(sig[i]);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export default () =>
  runSuite("booking-token", [
    {
      name: "signToken + verifyToken — happy path (v:2 carries intent)",
      fn: async () => {
        const payload = makePayload();
        const tok = await signToken(payload, SECRET_A);
        const result = await verifyToken(tok, SECRET_A, payload.iat + 1000);
        assert(result.ok, "verify should succeed");
        if (result.ok) {
          assertEqual(result.payload.id, payload.id);
          assertEqual(result.payload.v, 2);
          assertEqual(result.payload.fp, "deadbeef");
          assertEqual(result.payload.intent.serviceId, 42);
          assertEqual(result.payload.intent.serviceName, "Major service");
          assertEqual(result.payload.intent.phone, "971500000088");
          assertEqual(result.payload.intent.vehicleMake, "Porsche");
          assertEqual(result.payload.intent.plate, "A12345");
        }
      },
    },
    {
      name: "verifyToken — tampered payload fails (bad-signature)",
      fn: async () => {
        const payload = makePayload();
        const tok = await signToken(payload, SECRET_A);
        const [, sig] = tok.split(".");
        const tampered =
          base64UrlEncode(JSON.stringify({ ...payload, id: "evil" })) + "." + sig;
        const result = await verifyToken(tampered, SECRET_A);
        assert(!result.ok, "tampered should fail");
        if (!result.ok) assertEqual(result.reason, "bad-signature");
      },
    },
    {
      name: "verifyToken — expired",
      fn: async () => {
        const payload = makePayload({ exp: 1_000 });
        const tok = await signToken(payload, SECRET_A);
        const result = await verifyToken(tok, SECRET_A, 9_999_999);
        assert(!result.ok);
        if (!result.ok) assertEqual(result.reason, "expired");
      },
    },
    {
      name: "verifyToken — wrong secret",
      fn: async () => {
        const payload = makePayload();
        const tok = await signToken(payload, SECRET_A);
        const result = await verifyToken(tok, SECRET_B, payload.iat + 1000);
        assert(!result.ok);
        if (!result.ok) assertEqual(result.reason, "bad-signature");
      },
    },
    {
      name: "verifyToken — v:1 legacy token is rejected (bad-version)",
      fn: async () => {
        // Hand-craft a legacy v:1 payload (no intent), signed correctly with
        // SECRET_A so the signature passes but version check fails.
        const v1payload = {
          v: 1,
          id: "00000000-0000-0000-0000-000000000001",
          iat: 1_700_000_000_000,
          exp: 1_700_000_000_000 + 30 * 60 * 1000,
          fp: "cafebabe",
        };
        const headerBytes = new TextEncoder().encode(JSON.stringify(v1payload));
        const sigB64 = await rawHmacB64Url(headerBytes, SECRET_A);
        let s = "";
        for (let i = 0; i < headerBytes.length; i++) s += String.fromCharCode(headerBytes[i]);
        const headerB64 = btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        const tok = `${headerB64}.${sigB64}`;
        const result = await verifyToken(tok, SECRET_A, v1payload.iat + 1000);
        assert(!result.ok, "v:1 must be rejected");
        if (!result.ok) assertEqual(result.reason, "bad-version");
      },
    },
    {
      name: "verifyToken — unknown version (v:3) is rejected (bad-version)",
      fn: async () => {
        const future = { ...makePayload(), v: 3 } as unknown as TokenPayload;
        const headerBytes = new TextEncoder().encode(JSON.stringify(future));
        const sigB64 = await rawHmacB64Url(headerBytes, SECRET_A);
        let s = "";
        for (let i = 0; i < headerBytes.length; i++) s += String.fromCharCode(headerBytes[i]);
        const headerB64 = btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        const tok = `${headerB64}.${sigB64}`;
        const result = await verifyToken(tok, SECRET_A, future.iat + 1000);
        assert(!result.ok);
        if (!result.ok) assertEqual(result.reason, "bad-version");
      },
    },
    {
      name: "verifyToken — malformed (no dot)",
      fn: async () => {
        const result = await verifyToken("notatoken", SECRET_A);
        assert(!result.ok);
        if (!result.ok) assertEqual(result.reason, "malformed");
      },
    },
    {
      name: "verifyToken — malformed (empty string)",
      fn: async () => {
        const result = await verifyToken("", SECRET_A);
        assert(!result.ok);
        if (!result.ok) assertEqual(result.reason, "malformed");
      },
    },
    {
      name: "verifyToken — malformed (bad base64 in payload)",
      fn: async () => {
        const result = await verifyToken("!!!.!!!", SECRET_A);
        assert(!result.ok);
        if (!result.ok) {
          assert(
            result.reason === "malformed" || result.reason === "bad-signature",
            "expected malformed or bad-signature, got " + result.reason,
          );
        }
      },
    },
    {
      name: "verifyToken — v:2 without intent is malformed",
      fn: async () => {
        // Sign a v:2 header missing the intent field.
        const broken = {
          v: 2,
          id: "00000000-0000-0000-0000-000000000002",
          iat: 1_700_000_000_000,
          exp: 1_700_000_000_000 + 30 * 60 * 1000,
          fp: "deadbeef",
        };
        const headerBytes = new TextEncoder().encode(JSON.stringify(broken));
        const sigB64 = await rawHmacB64Url(headerBytes, SECRET_A);
        let s = "";
        for (let i = 0; i < headerBytes.length; i++) s += String.fromCharCode(headerBytes[i]);
        const headerB64 = btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        const tok = `${headerB64}.${sigB64}`;
        const result = await verifyToken(tok, SECRET_A, broken.iat + 1000);
        assert(!result.ok);
        if (!result.ok) assertEqual(result.reason, "malformed");
      },
    },
    {
      name: "signToken — realistic full intent encodes to < 1.5KB",
      fn: async () => {
        const payload = makePayload({
          intent: makeIntent({
            // worst-case-ish: long notes field
            notes:
              "Please check the brakes — they squeal at low speed, especially after rain. " +
              "Also the AC fan rattles when set to 4 or higher. " +
              "Tyres rotated last service; please note any uneven wear.",
          }),
        });
        const tok = await signToken(payload, SECRET_A);
        assert(
          tok.length < 1500,
          `token length must be < 1500, got ${tok.length}`,
        );
        // URL-safe characters only (base64url alphabet + the single '.' separator)
        assert(
          /^[A-Za-z0-9_\-]+\.[A-Za-z0-9_\-]+$/.test(tok),
          "token must contain only URL-safe characters",
        );
        // Roundtrip
        const verified = await verifyToken(tok, SECRET_A, payload.iat + 1000);
        assert(verified.ok);
      },
    },
    {
      name: "fingerprint — stable 8-char hex",
      fn: async () => {
        const fp1 = await fingerprint("971500000088", "test@example.com");
        const fp2 = await fingerprint("971500000088", "TEST@example.com");
        const fp3 = await fingerprint("971500000099", "test@example.com");
        assertEqual(fp1.length, 8);
        assertEqual(fp1, fp2, "email case must not change fingerprint");
        assert(fp1 !== fp3, "different phone → different fingerprint");
      },
    },
    {
      name: "fingerprint mismatch use case",
      fn: async () => {
        const fpA = await fingerprint("971500000088", "a@example.com");
        const fpB = await fingerprint("971500000088", "b@example.com");
        assert(fpA !== fpB, "different email → different fingerprint");
      },
    },
    {
      name: "generateTokenId — looks like a v4 UUID",
      fn: () => {
        const id = generateTokenId();
        assert(
          /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(
            id,
          ),
          "expected UUID shape, got " + id,
        );
      },
    },
  ]);
