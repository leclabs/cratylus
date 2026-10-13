// The host runtime config — what the projection told this host: each capability's
// configuration. A config carrying none says nothing.

import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, afterEach, describe, expect, it } from 'vitest';
import { loadRuntimeConfig } from '../src/runtime-config.js';

const ENV = 'AGENT_RUNTIME_CONFIG';
afterEach(() => {
  delete process.env[ENV];
});

const scratch: string[] = [];
function tmp(): string {
  const d = mkdtempSync(join(tmpdir(), 'rt-cfg-'));
  scratch.push(d);
  return d;
}
afterAll(() => {
  for (const d of scratch) rmSync(d, { recursive: true, force: true });
});

describe('the host runtime config', () => {
  it('an absent config reads as null', () => {
    process.env[ENV] = join(tmpdir(), 'definitely-absent-runtime.json');
    expect(loadRuntimeConfig()).toBeNull();
  });

  it('a configuration block is a real config, each capability’s entry intact', () => {
    // Corpus meaning a capability acts on arrives as its configuration entry.
    const root = tmp();
    const cfg = join(root, 'runtime.json');
    const entry = { lifecycle: { states: ['a', 'b'], final: 'b' } };
    writeFileSync(cfg, JSON.stringify({ configuration: { someCap: entry } }));
    process.env[ENV] = cfg;

    const loaded = loadRuntimeConfig();
    expect(loaded).toEqual({ configuration: { someCap: entry } });
  });

  it('a malformed or empty configuration block says nothing, without wedging the load', () => {
    const root = tmp();
    const cfg = join(root, 'runtime.json');
    process.env[ENV] = cfg;
    for (const malformed of [['someCap'], 'someCap', 7, null, {}]) {
      writeFileSync(cfg, JSON.stringify({ configuration: malformed }));
      expect(loadRuntimeConfig()).toBeNull();
    }
  });

  it('a malformed config reads as null rather than wedging', () => {
    const root = tmp();
    const cfg = join(root, 'runtime.json');
    writeFileSync(cfg, '{ not json');
    process.env[ENV] = cfg;
    expect(loadRuntimeConfig()).toBeNull();
  });
});
