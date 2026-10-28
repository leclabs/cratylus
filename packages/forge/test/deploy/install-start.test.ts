// The start line at install: a completed install whose agents include the business
// analyst ends with how using cratylus starts, as the command says it; one without the
// business analyst, or a dry run, does not.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { START } from '@cratylus/runtime';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runInstall } from '../../src/cli/commands/install.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';
import { fixtureAgentSource, tmp } from './helpers.js';

// One agents directory per canon for the whole file: a module once imported is not
// read again.
const agentsDir = (names: readonly string[]): string => {
  const dir = tmp('install-start-agents-');
  for (const name of names)
    writeFileSync(join(dir, `${name}.ts`), fixtureAgentSource(name));
  return dir;
};
const withAnalyst = agentsDir(['alpha', 'business-analyst']);
const withoutAnalyst = agentsDir(['alpha']);

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

const install = (agents: string, dryRun = false) =>
  runInstall({
    harness: 'omp',
    home,
    cwd: join(home, '..', 'cwd'),
    canon: {
      name: 'start-fixture',
      manifest: FIXTURE_MANIFEST,
      agents,
      rulesets: [],
    } as never,
    interactive: false,
    dryRun,
  });

describe('install — the start line', () => {
  it('ends a completed install that placed the business analyst with the start line', async () => {
    expect(await install(withAnalyst)).toBe(0);
    expect(out.trimEnd().split('\n').at(-1)).toBe(`    ${START}`);
  });

  it('says no start line where the business analyst is not installed, or nothing was', async () => {
    expect(await install(withoutAnalyst)).toBe(0);
    expect(out).not.toContain(START);
    out = '';
    expect(await install(withAnalyst, true)).toBe(0);
    expect(out).not.toContain(START);
  });
});
