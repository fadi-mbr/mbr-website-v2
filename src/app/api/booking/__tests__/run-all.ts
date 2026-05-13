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
import chatwootSuite from "./chatwoot.test";
import tokenSuite from "./token.test";
import emailSuite from "./email.test";
import arcSubmitSuite from "./arc-submit.test";
import agentRouteSuite from "./agent-route.test";
import requestRouteSuite from "./request-route.test";
import confirmHelperSuite from "./confirm-helper.test";
import confirmRouteSuite from "./confirm-route.test";
import availabilitySuite from "./availability.test";
import slotsRouteSuite from "./slots-route.test";
import icsSuite from "./ics.test";
import carCatalogSuite from "./car-catalog.test";
import uaePlatesSuite from "./uae-plates.test";

async function main(): Promise<void> {
  await phoneSuite();
  await validateSuite();
  await rateLimitSuite();
  await chatwootSuite();
  await tokenSuite();
  await emailSuite();
  await arcSubmitSuite();
  await agentRouteSuite();
  await requestRouteSuite();
  await confirmHelperSuite();
  await confirmRouteSuite();
  await availabilitySuite();
  await slotsRouteSuite();
  await icsSuite();
  await carCatalogSuite();
  await uaePlatesSuite();
  console.log("\nAll booking unit tests passed.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
