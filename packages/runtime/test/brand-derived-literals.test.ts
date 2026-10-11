// GATE — every brand-derived identifier is DERIVED from `CLI_BIN`, never re-inlined.
//
// One identifier is named after the bin and was an independent string literal:
//
//   RUNTIME_CONFIG_NAME  `.cratylus.json` — the host config dotfile
//
// V5 collapsed thirteen homes of the bin name to one and this one survived it,
// because it does not look like a bin name to a grep for one. It names a file on
// every host, so a drift between it and the bin does not rename the config, it
// ORPHANS it: the runtime looks for a file deploy no longer writes.
//
// A source-text assertion, deliberately: the value being right at runtime is not the
// property under test. The property is that there is no SECOND LITERAL to drift.

import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { CLI_BIN } from '../src/bin-name.js';
import { RUNTIME_CONFIG_NAME } from '../src/runtime-config.js';

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const read = (rel: string) => readFileSync(join(srcRoot, rel), 'utf8');

describe('brand-derived literals stay derived', () => {
  it('the value carries the bin name at runtime', () => {
    expect(RUNTIME_CONFIG_NAME).toBe(`.${CLI_BIN}.json`);
  });

  it('CONVICTS: it is not written as a bare literal in source', () => {
    // The failure this catches is a future edit re-inlining the string. Assert on the
    // TEXT, because a re-inlined literal would still satisfy the runtime check above
    // — it is equal today and free to drift tomorrow, which is the whole defect.
    const cfg = read('runtime-config.ts');
    expect(cfg).toMatch(/RUNTIME_CONFIG_NAME = `\.\$\{CLI_BIN\}\.json`/);
    expect(cfg).not.toMatch(/RUNTIME_CONFIG_NAME\s*=\s*'/);
  });

  it('EXONERATES: bin-name.ts is allowed to hold the one literal', () => {
    expect(read('bin-name.ts')).toMatch(/CLI_BIN = '[a-z-]+'/);
  });
});
