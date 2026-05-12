/**
 * Unit tests for the HMAC magic-link token (src/lib/booking-token.ts).
 */

import {
  signToken,
  verifyToken,
  fingerprint,
  generateTokenId,
  type BookingTokenPayload,
} from "@/lib/booking-token";
import { assert, assertEqual, runSuite } from "./_harness";

const SECRET_A =
  "0123456789abcdef0123456789abcdef0123456789abcdef0123456789abcdef";
const SECRET_B =
  "fedcba9876543210fedcba9876543210fedcba9876543210fedcba9876543210";

function makePayload(overrides: Partial<BookingTokenPayload> = {}): BookingTokenPayload {
  return {
    v: 1,
    id: "11111111-2222-3333-4444-555555555555",
    iat: 1_700_000_000_000,
    exp: 1_700_000_000_000 + 30 * 60 * 1000,
    fp: "deadbeef",
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

export default () =>
  runSuite("booking-token", [
    {
      name: "signToken + verifyToken — happy path",
      fn: async () => {
        const payload = makePayload();
        const tok = await signToken(payload, SECRET_A);
        const result = await verifyToken(tok, SECRET_A, payload.iat + 1000);
        assert(result.ok, "verify should succeed");
        if (result.ok) {
          assertEqual(result.payload.id, payload.id);
          assertEqual(result.payload.v, 1);
          assertEqual(result.payload.fp, "deadbeef");
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
      name: "verifyToken — bad version",
      fn: async () => {
        // Hand-craft a v:2 payload but sign correctly with secret A so the
        // signature passes but version check fails.
        const payload = { ...makePayload(), v: 2 } as unknown as BookingTokenPayload;
        const headerJson = JSON.stringify(payload);
        const headerBytes = new TextEncoder().encode(headerJson);
        // We can re-use signToken by faking the v:1 check — instead, mint
        // raw HMAC here.
        const keyBytes = new Uint8Array(SECRET_A.length / 2);
        for (let i = 0; i < keyBytes.length; i++) {
          keyBytes[i] = parseInt(SECRET_A.substr(i * 2, 2), 16);
        }
        const key = await crypto.subtle.importKey(
          "raw",
          keyBytes,
          { name: "HMAC", hash: "SHA-256" },
          false,
          ["sign"],
        );
        const sig = new Uint8Array(
          await crypto.subtle.sign("HMAC", key, headerBytes),
        );
        const b64url = (b: Uint8Array) => {
          let s = "";
          for (let i = 0; i < b.length; i++) s += String.fromCharCode(b[i]);
          return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
        };
        const tok = `${b64url(headerBytes)}.${b64url(sig)}`;
        const result = await verifyToken(tok, SECRET_A, payload.iat + 1000);
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
          // either malformed or bad-signature is acceptable; we strict to malformed
          assert(
            result.reason === "malformed" || result.reason === "bad-signature",
            "expected malformed or bad-signature, got " + result.reason,
          );
        }
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
        // Caller flow: sign with fp_for(phone1,email1); later compare against
        // fingerprint(phone2,email2). This module doesn't enforce that — the
        // route does — but we sanity-check the building block.
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
