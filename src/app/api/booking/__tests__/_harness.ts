/**
 * Zero-dependency test harness used by the booking unit-test files.
 *
 * Why hand-rolled? The website repo has no test runner (no vitest, jest,
 * or node:test wired up) and we don't want to add a dependency just for
 * a handful of pure-function tests. Each test file calls `runSuite()` and
 * gets a non-zero exit code on failure.
 *
 * Run all booking tests with:    npm run test:booking
 */

interface TestCase {
  name: string;
  fn: () => void | Promise<void>;
}

const RED = "\x1b[31m";
const GREEN = "\x1b[32m";
const YELLOW = "\x1b[33m";
const RESET = "\x1b[0m";

export function assertEqual<T>(actual: T, expected: T, message?: string): void {
  const ok = deepEqual(actual, expected);
  if (!ok) {
    throw new Error(
      `${message ? message + " — " : ""}expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`
    );
  }
}

export function assert(cond: unknown, message?: string): asserts cond {
  if (!cond) throw new Error("assert failed" + (message ? ": " + message : ""));
}

function deepEqual(a: unknown, b: unknown): boolean {
  if (a === b) return true;
  if (typeof a !== typeof b) return false;
  if (a && b && typeof a === "object") {
    const ka = Object.keys(a as object);
    const kb = Object.keys(b as object);
    if (ka.length !== kb.length) return false;
    return ka.every((k) =>
      deepEqual((a as Record<string, unknown>)[k], (b as Record<string, unknown>)[k])
    );
  }
  return false;
}

export async function runSuite(label: string, tests: TestCase[]): Promise<void> {
  let passed = 0;
  let failed = 0;
  console.log(`${YELLOW}== ${label} (${tests.length} tests)${RESET}`);
  for (const t of tests) {
    try {
      await t.fn();
      console.log(`  ${GREEN}ok${RESET} ${t.name}`);
      passed++;
    } catch (e) {
      console.log(`  ${RED}fail${RESET} ${t.name}`);
      console.log(`       ${e instanceof Error ? e.message : String(e)}`);
      failed++;
    }
  }
  console.log(
    `${YELLOW}-- ${label}: ${passed} passed, ${failed} failed${RESET}\n`
  );
  if (failed > 0) process.exit(1);
}
