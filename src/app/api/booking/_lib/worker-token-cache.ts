/**
 * Per-instance cache for the ARC worker bearer token.
 *
 * The token comes from `GET /auth/worker/login?phone=...&code=...`. ARC
 * doesn't document a TTL, but empirically tokens stay valid for ~30 min
 * after login, so we cache for 25 min and refresh on demand. Any 401 from
 * the caller should trigger `_resetWorkerTokenCacheForTests()`-style
 * invalidation in production code paths (we expose a private invalidator
 * for that case).
 *
 * Server-side only. Credentials come from env vars set at deploy time:
 *   ARC_WORKER_PHONE      (digits-only UAE E.164, e.g. 971566066006)
 *   ARC_WORKER_PASSWORD   (worker login password)
 *
 * If either env var is missing, the cache throws — callers should catch
 * and fall back to candidates-only slot generation rather than 500.
 */

import { workerLogin } from "./arc-client";

type WorkerLoginFn = (
  phone: string,
  password: string
) => Promise<{ token: string }>;

interface Cache {
  token: string;
  expiresAt: number;
}

let cache: Cache | null = null;
let _loginFn: WorkerLoginFn = workerLogin;

const TTL_MS = 25 * 60 * 1000; // 25 minutes
const SAFETY_MS = 60 * 1000; // refresh 1 min before expiry

export async function getWorkerToken(): Promise<string> {
  if (cache && cache.expiresAt > Date.now() + SAFETY_MS) {
    return cache.token;
  }
  const phone = process.env.ARC_WORKER_PHONE;
  const password = process.env.ARC_WORKER_PASSWORD;
  if (!phone || !password) {
    throw new Error(
      "ARC_WORKER_PHONE / ARC_WORKER_PASSWORD not set — cannot fetch worker token"
    );
  }
  const { token } = await _loginFn(phone, password);
  cache = { token, expiresAt: Date.now() + TTL_MS };
  return token;
}

/**
 * Invalidate the cache. Production code can call this after a 401 from a
 * worker-auth endpoint so the next `getWorkerToken()` re-logins.
 */
export function invalidateWorkerToken(): void {
  cache = null;
}

// ---------------------------------------------------------------------------
// Test seams (do not call from production code)
// ---------------------------------------------------------------------------

export function _resetWorkerTokenCacheForTests(): void {
  cache = null;
  _loginFn = workerLogin;
}

export function _setWorkerLoginForTests(fn: WorkerLoginFn): void {
  _loginFn = fn;
}
