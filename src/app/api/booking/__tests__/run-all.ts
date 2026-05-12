/**
 * Entry point for `npm run test:booking`.
 *
 * Each test file's default export is a thunk that returns the `runSuite()`
 * promise — we invoke them sequentially so output stays grouped per suite
 * and we fail-fast on the first suite that calls `process.exit(1)`.
 */

import phoneSuite from "./phone.test";
import validateSuite from "./validate.test";
import rateLimitSuite from "./rate-limit.test";
import embedModeSuite from "./embed-mode.test";
import chatwootSuite from "./chatwoot.test";
import embedContextSuite from "./embed-context.test";
import tokenSuite from "./token.test";
import kvSuite from "./kv.test";
import emailSuite from "./email.test";
import rateLimitKvSuite from "./rate-limit-kv.test";
import arcSubmitSuite from "./arc-submit.test";

async function main(): Promise<void> {
  await phoneSuite();
  await validateSuite();
  await rateLimitSuite();
  await embedModeSuite();
  await chatwootSuite();
  await embedContextSuite();
  await tokenSuite();
  await kvSuite();
  await emailSuite();
  await rateLimitKvSuite();
  await arcSubmitSuite();
  console.log("\nAll booking unit tests passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
