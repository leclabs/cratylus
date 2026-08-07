// GATE — every brand-derived identifier is DERIVED from `CLI_BIN`, never re-inlined.
//
// Two identifiers are named after the bin and were independent string literals:
//
//   RUNTIME_CONFIG_NAME  `.cratylus.json` — the host config dotfile
//   EVENT_TAP_ID         `cratylus-event-tap` — written INTO user settings
//
// V5 collapsed thirteen homes of the bin name to one and these two survived it,
// because neither looks like a bin name to a grep for one. `EVENT_TAP_ID` is the one that
// bites: it is PERSISTED, so a drift between it and the bin does not rename a tap, it
// ORPHANS it — `uninstall` searches for an id that `install` no longer writes, and the
// stale entry stays in the user's settings.json forever with nothing to remove it.
//
// A source-text assertion, deliberately: the value being right at runtime is not the
// property under test. The property is that there is no SECOND LITERAL to drift.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CLI_BIN } from '../src/bin-name.js';
import { EVENT_TAP_ID } from '../src/capabilities/event-tap/claude.js';
import { RUNTIME_CONFIG_NAME } from '../src/runtime-config.js';

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const read = (rel: string) => readFileSync(join(srcRoot, rel), 'utf8');

describe('brand-derived literals stay derived', () => {
  it('both values carry the bin name at runtime', () => {
    expect(RUNTIME_CONFIG_NAME).toBe(`.${CLI_BIN}.json`);
    expect(EVENT_TAP_ID).toBe(`${CLI_BIN}-event-tap`);
  });

  it('CONVICTS: neither is written as a bare literal in source', () => {
    // The failure this catches is a future edit re-inlining the string. Assert on the
    // TEXT, because a re-inlined literal would still satisfy the runtime check above
    // — it is equal today and free to drift tomorrow, which is the whole defect.
    const cfg = read('runtime-config.ts');
    const tap = read('capabilities/event-tap/claude.ts');
    expect(cfg).toMatch(/RUNTIME_CONFIG_NAME = `\.\$\{CLI_BIN\}\.json`/);
    expect(tap).toMatch(/EVENT_TAP_ID = `\$\{CLI_BIN\}-event-tap`/);
    expect(cfg).not.toMatch(/RUNTIME_CONFIG_NAME\s*=\s*'/);
    expect(tap).not.toMatch(/EVENT_TAP_ID\s*=\s*'/);
  });

  it('EXONERATES: bin-name.ts is allowed to hold the one literal', () => {
    expect(read('bin-name.ts')).toMatch(/CLI_BIN = '[a-z-]+'/);
  });
});
