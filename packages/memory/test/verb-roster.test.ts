// The two homes for one set. `cli.ts` decides what `main` dispatches; the runtime
// dispatches only what `MEMORY_VERBS` lists. They diverge SILENTLY — a verb in one
// and not the other typechecks, passes every other test, and is unreachable through
// the runtime. `get` and `rollover` shipped that way and were caught only by
// invoking the deployed shim by hand. This is that check, made automatic.

import { describe, expect, it } from 'vitest';
import { CLI_VERBS } from '../src/cli.js';
import { MEMORY_VERBS } from '../src/verb-port.js';

describe('verb roster — cli.ts and the runtime dispatch the same set', () => {
  it('every CLI verb is dispatchable through the runtime', () => {
    expect([...MEMORY_VERBS].sort()).toEqual([...CLI_VERBS].sort());
  });

  it('is non-vacuous — both sets are populated', () => {
    expect(CLI_VERBS.length).toBeGreaterThan(10);
    expect(MEMORY_VERBS.length).toBe(CLI_VERBS.length);
  });
});
