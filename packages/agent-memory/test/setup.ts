import { beforeEach, vi } from 'vitest';

/**
 * HERMETIC ENV. This suite runs inside a real agent harness, which exports
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
beforeEach(() => {
  vi.stubEnv('AGENT_SESSION_ID', '');
  vi.stubEnv('AGENT_SESSION_ID_FROM', '');
});
