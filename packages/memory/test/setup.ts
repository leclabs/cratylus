import { beforeEach, vi } from 'vitest';
import { CONFIG_ENV } from '../src/node.js';

/**
 * HERMETIC ENV — the ONE home for every ambient value this suite must not
 * inherit from the developer's shell. Wired in `vitest.config.ts` via
 * `setupFiles`, so no test file can forget it and none needs to remember.
 */

/**
 * SESSION. This suite runs inside a real agent harness, which exports
 * `AGENT_SESSION_ID` (and any harness value the shim may have bridged into it) into every child process — including vitest. Since
 * `envSessionId()` reads that name, an un-cleared parent value would
 * silently outrank every per-test stub and
 * bind tests to the developer's own live session.
 *
 * Clearing it here makes the default state "no harness session", so each test
 * declares the session env it wants and nothing leaks in from outside. A test
 * that WANTS the harness name stubs it explicitly, which overrides this.
 *
 * This is the seam the original defect hid behind: the package read a name the
 * harness never set, so no test ever had to think about parent-process env, and
 * nothing failed when the read was wrong.
 */

/**
 * CONFIG — and this one is LOAD-BEARING, not belt-and-braces.
 *
 * `''` is a SENTINEL, not an unset var. `resolveConfigPath` reads the env with
 * `??`, so `''` is a value and short-circuits the chain at step 2 — "there is
 * no config" — instead of falling through to the cwd walk and then `$HOME`.
 * Setting the var to `''` and DELETING it are therefore opposite acts; do not
 * "simplify" this to `vi.stubEnv(CONFIG_ENV, undefined)`.
 *
 * WHY IT BECAME LOAD-BEARING (2026-08-05). Resolution used to be bare-cwd, so a
 * test standing in a scratch directory found no config whether or not it
 * cleared the var — the sentinel was redundant, and six test files restated it
 * as ordinary belt-and-braces. Then `resolveConfigPath` widened to walk
 * cwd-ward and fall back to `$HOME/.cratylus.memory.json`. A guard that was
 * redundant became the ONLY thing between a test and the developer's home
 * directory, without anyone deciding it should be.
 *
 * The failure that guard prevents is not a red test. It is a test that reads
 * the operator's own `projects` keys and scope markers and PASSES — differently
 * on their machine than in CI, because the machine that landed the widening had
 * no `~/.cratylus.memory.json` and so could not prove the leak either way.
 *
 * Six restatements were one home too many: a guard in two places is a guard
 * whose absence in a third is invisible. `hermetic-config.test.ts` convicts the
 * leak this line prevents — delete this line and that suite goes red.
 */
beforeEach(() => {
  vi.stubEnv('AGENT_SESSION_ID', '');
  vi.stubEnv('AGENT_SESSION_ID_FROM', '');
  vi.stubEnv(CONFIG_ENV, '');
});
