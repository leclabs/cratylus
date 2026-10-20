// The start line at install: a completed install whose agents include the architect
// ends with how using cratylus starts, as the command says it; one without the
// architect, or a dry run, does not.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { START } from '@cratylus/runtime';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runInstall } from '../../src/cli/commands/install.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';
import {
  FIXTURE_PRACTICE,
  fixtureAgentSource,
  fixturePractices,
  tmp,
} from './helpers.js';

// One agents directory for the whole file: a module once imported is not read again.
const agents = tmp('install-start-agents-');
for (const name of ['alpha', 'architect'])
  writeFileSync(join(agents, `${name}.ts`), fixtureAgentSource(name));

let home: string;
let out: string;
beforeEach(() => {
  const root = tmp('install-start-');
  home = join(root, 'home');
  mkdirSync(join(root, 'cwd'), { recursive: true });
  mkdirSync(join(home, '.omp', 'agent'), { recursive: true });
  out = '';
  for (const stream of [process.stdout, process.stderr])
    vi.spyOn(stream, 'write').mockImplementation((s) => {
      out += String(s);
      return true;
    });
});
afterEach(() => {
  vi.restoreAllMocks();
});

const install = (practice: readonly string[], dryRun = false) =>
  runInstall({
    harness: 'omp',
    home,
    cwd: join(home, '..', 'cwd'),
    canon: {
      name: 'start-fixture',
      manifest: FIXTURE_MANIFEST,
      agents,
      practices: fixturePractices(practice),
      rulesets: [],
    } as never,
    practices: FIXTURE_PRACTICE,
    interactive: false,
    dryRun,
  });

describe('install — the start line', () => {
  it('ends a completed install that placed the architect with the start line', async () => {
    expect(await install(['alpha', 'architect'])).toBe(0);
    expect(out.trimEnd().split('\n').at(-1)).toBe(`    ${START}`);
  });

  it('says no start line where the architect is not installed, or nothing was', async () => {
    expect(await install(['alpha'])).toBe(0);
    expect(out).not.toContain(START);
    out = '';
    expect(await install(['alpha', 'architect'], true)).toBe(0);
    expect(out).not.toContain(START);
  });
});
