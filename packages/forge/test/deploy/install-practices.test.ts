// A practice renamed since an earlier install (decision 0332): a former name the
// installation record, or an earlier deploy record, holds counts as the practice that
// now holds it, so install keeps it, records the current name only, says it carried it
// over, and removes nothing of it. A former name given to --practices is no declared
// practice, refused as any is.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runInstall } from '../../src/cli/commands/install.js';
import type { ProjectablePlugin } from '../../src/project/index.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';
import { answers, fixtureAgentSource, tmp } from './helpers.js';

const agents = tmp('install-practices-agents-');
for (const name of ['alpha', 'beta'])
  writeFileSync(join(agents, `${name}.ts`), fixtureAgentSource(name));
// The renamed practice is not preselected and the other one is, so keeping it can
// only come from the record.
const corpus: ProjectablePlugin = {
  name: 'practices-fixture',
  manifest: FIXTURE_MANIFEST,
  agents,
  practices: [
    {
      name: 'renamed',
      formerNames: ['former'],
      description: 'the practice renamed since the earlier install',
      agents: ['alpha'],
    },
    {
      name: 'other',
      description: 'a practice the earlier install did not take',
      agents: ['beta'],
      preselected: true,
    },
  ],
};

let home: string;
let out: string;
beforeEach(() => {
  home = tmp('install-practices-');
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

const install = (extra: Partial<Parameters<typeof runInstall>[0]> = {}) =>
  runInstall({
    harness: 'omp',
    home,
    cwd: home,
    corpus: corpus as never,
    interactive: false,
    version: '1.0.0',
    ...extra,
  });
const recordPath = () => join(home, '.cratylus', 'omp', 'installation.json');
const record = () =>
  JSON.parse(readFileSync(recordPath(), 'utf8')) as { practices?: string[] };

/** An installation whose record names the practice by its former name. */
async function installedUnderFormerName(): Promise<void> {
  expect(await install({ practices: 'renamed' })).toBe(0);
  writeFileSync(
    recordPath(),
    JSON.stringify({ ...record(), practices: ['former'] }, null, 2),
  );
  out = '';
}

describe('an install over a record naming a former practice name', () => {
  it('under --yes on a terminal keeps it, records the current name only, reports the carry-over and removes nothing', async () => {
    await installedUnderFormerName();
    expect(
      await install({ interactive: true, yes: true, prompts: answers() }),
    ).toBe(0);
    expect(record().practices).toEqual(['renamed']);
    expect(out).toContain(
      '  practices: renamed; carried over former as renamed\n',
    );
    expect(out).not.toMatch(/removed/);
    expect(out).toContain('  1 agent,');
  });

  it('asked on a terminal, offers it ticked under its current name', async () => {
    await installedUnderFormerName();
    let initial: readonly string[] = [];
    const prompts = answers({
      practices: async (_offered, given) => {
        initial = given;
        return [...given];
      },
    });
    expect(await install({ interactive: true, prompts })).toBe(0);
    expect(initial).toEqual(['renamed']);
    expect(record().practices).toEqual(['renamed']);
    expect(out).toContain('carried over former as renamed');
    expect(out).not.toMatch(/removed/);
  });
});

describe('a user install over an earlier deploy record naming a former practice name', () => {
  /** No installation record: the earlier layout's deploy record alone names it. */
  const earlierDeployRecord = (): void => {
    mkdirSync(join(home, '.omp', '.forge'), { recursive: true });
    writeFileSync(
      join(home, '.omp', '.forge', 'deploy-manifest.json'),
      JSON.stringify({ version: 1, kinds: {}, practices: ['former'] }),
    );
  };

  it('under --yes on a terminal keeps it, records the current name only, reports the carry-over and removes nothing', async () => {
    earlierDeployRecord();
    expect(
      await install({ interactive: true, yes: true, prompts: answers() }),
    ).toBe(0);
    expect(record().practices).toEqual(['renamed']);
    expect(out).toContain(
      '  practices: renamed; carried over former as renamed\n',
    );
    expect(out).not.toMatch(/removed/);
    expect(out).toContain('  1 agent,');
  });

  it('asked on a terminal, offers it ticked under its current name', async () => {
    earlierDeployRecord();
    let initial: readonly string[] = [];
    const prompts = answers({
      practices: async (_offered, given) => {
        initial = given;
        return [...given];
      },
    });
    expect(await install({ interactive: true, prompts })).toBe(0);
    expect(initial).toEqual(['renamed']);
    expect(record().practices).toEqual(['renamed']);
    expect(out).toContain('carried over former as renamed');
    expect(out).not.toMatch(/removed/);
  });
});

it('refuses a former name given to --practices, listing the declared practices', async () => {
  expect(await install({ practices: 'former' })).toBe(1);
  expect(out).toContain(
    "--practices: 'former' is no practice of this corpus (declared: renamed, other)",
  );
});
