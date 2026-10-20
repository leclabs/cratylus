// Rules at install: each ruleset the canon offers is taken whole, rule by rule, or not
// at all, none by default. A flag tells install the choice, a terminal is asked it, and
// the choice is recorded by rule name, kept by every later install not told otherwise;
// a rule no longer offered is dropped from it and named. Uninstall takes the rules out
// with the owned root, and the host's own rules stay.

import {
  existsSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import type { Ruleset } from '@cratylus/schema';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runInstall } from '../../src/cli/commands/install.js';
import { runUninstall } from '../../src/cli/commands/uninstall.js';
import type {
  OfferedRuleset,
  ProjectablePlugin,
} from '../../src/project/index.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';
import {
  FIXTURE_PRACTICE,
  answers,
  fixtureAgentSource,
  fixturePractices,
  tmp,
} from './helpers.js';

const rule = (name: string) => ({
  name,
  description: `the ${name} rule`,
  convention: `Follow ${name}.`,
  why: `${name} holds.`,
});
const branching: Ruleset = {
  name: 'branching',
  description: 'a fixture branching convention',
  rules: [rule('branching-trunk'), rule('branching-short')],
};
const commits: Ruleset = {
  name: 'commits',
  description: 'a fixture commit convention',
  rules: [rule('commits-small')],
};

// One agents directory for the whole file: a module once imported is not read again.
const agents = tmp('install-rules-agents-');
writeFileSync(join(agents, 'alpha.ts'), fixtureAgentSource('alpha'));

let home: string;
let cwd: string;
let out: string;
beforeEach(() => {
  const root = tmp('install-rules-');
  home = join(root, 'home');
  cwd = join(root, 'cwd');
  mkdirSync(cwd, { recursive: true });
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

const plugin = (
  rulesets: readonly Ruleset[] = [branching, commits],
): ProjectablePlugin => ({
  name: 'rules-fixture',
  manifest: FIXTURE_MANIFEST,
  agents,
  practices: fixturePractices(['alpha']),
  rulesets,
});
const install = (
  extra: Partial<Parameters<typeof runInstall>[0]> = {},
  rulesets?: readonly Ruleset[],
) =>
  runInstall({
    harness: 'omp',
    home,
    cwd,
    canon: plugin(rulesets) as never,
    practices: FIXTURE_PRACTICE,
    interactive: false,
    ...extra,
  });
const owned = () => join(home, '.cratylus', 'omp');
const placed = (): string[] =>
  existsSync(join(owned(), 'rules'))
    ? readdirSync(join(owned(), 'rules')).sort()
    : [];
const record = () =>
  JSON.parse(readFileSync(join(owned(), 'installation.json'), 'utf8')) as {
    rules?: string[];
  };

describe('install — rules', () => {
  it('places exactly the rules a flag names, a ruleset whole or a rule alone, and records them by name', async () => {
    expect(await install({ rules: 'commits, branching-short' })).toBe(0);
    expect(placed()).toEqual(['branching-short.md', 'commits-small.md']);
    expect(record().rules).toEqual(['branching-short', 'commits-small']);
    expect(
      readFileSync(join(owned(), 'installation.json'), 'utf8'),
    ).not.toContain('Follow');
    expect(out).toContain('rules: branching-short, commits-small');
  });

  it('places none by default where it cannot ask, records no choice, and names choosing as the next step', async () => {
    expect(await install()).toBe(0);
    expect(placed()).toEqual([]);
    expect(record().rules).toBeUndefined();
    expect(out).toMatch(
      /next:[\s\S]*rulesets: branching, commits[\s\S]*--rules none/,
    );
  });

  it('takes the default, none, under --yes on a terminal, asking nothing', async () => {
    const asked: string[] = [];
    expect(
      await install({
        interactive: true,
        yes: true,
        prompts: answers({
          rules: async () => {
            asked.push('rules');
            return ['commits-small'];
          },
        }),
      }),
    ).toBe(0);
    expect(asked).toEqual([]);
    expect(placed()).toEqual([]);
  });

  it('records --rules none as a choice of none', async () => {
    expect(await install({ rules: 'none' })).toBe(0);
    expect(placed()).toEqual([]);
    expect(record().rules).toEqual([]);
    expect(out).not.toContain('--rules none');
  });

  it('refuses a name that is no ruleset or rule, and an empty list, writing nothing', async () => {
    expect(await install({ rules: 'branching,nope' })).toBe(1);
    expect(out).toContain(
      "--rules: 'nope' is no ruleset or rule of this canon (branching: branching-trunk, branching-short; commits: commits-small)",
    );
    expect(await install({ rules: ' , ' })).toBe(1);
    expect(out).toContain('--rules: no rule was named');
    expect(existsSync(owned())).toBe(false);
  });

  it('offers each ruleset on a terminal, places the answer, and keeps it on reinstall without asking', async () => {
    let offered: readonly OfferedRuleset[] = [];
    let asks = 0;
    const prompts = answers({
      rules: async (o) => {
        asks += 1;
        offered = o;
        return ['branching-trunk', 'commits-small'];
      },
    });
    expect(await install({ interactive: true, prompts })).toBe(0);
    expect(offered.map((s) => [s.name, s.rules.map((r) => r.name)])).toEqual([
      ['branching', ['branching-trunk', 'branching-short']],
      ['commits', ['commits-small']],
    ]);
    expect(placed()).toEqual(['branching-trunk.md', 'commits-small.md']);
    expect(record().rules).toEqual(['branching-trunk', 'commits-small']);
    expect(await install({ interactive: true, prompts })).toBe(0);
    expect(await install()).toBe(0);
    expect(asks).toBe(1);
    expect(placed()).toEqual(['branching-trunk.md', 'commits-small.md']);
    expect(record().rules).toEqual(['branching-trunk', 'commits-small']);
  });

  it('lets a flag change the recorded choice on reinstall', async () => {
    expect(await install({ rules: 'branching' })).toBe(0);
    expect(await install({ rules: 'commits' })).toBe(0);
    expect(placed()).toEqual(['commits-small.md']);
    expect(record().rules).toEqual(['commits-small']);
    expect(await install({ rules: 'none' })).toBe(0);
    expect(placed()).toEqual([]);
  });

  it('drops a recorded rule no longer offered, and names it', async () => {
    expect(await install({ rules: 'branching,commits' })).toBe(0);
    out = '';
    const shrunk: Ruleset = { ...branching, rules: [rule('branching-trunk')] };
    expect(await install({}, [shrunk])).toBe(0);
    expect(placed()).toEqual(['branching-trunk.md']);
    expect(record().rules).toEqual(['branching-trunk']);
    expect(out).toContain(
      'rules: branching-trunk; dropped branching-short, commits-small, no longer offered',
    );
  });

  it('uninstall removes the rules it placed and leaves the host’s own rules', async () => {
    const mine = join(home, '.omp', 'agent', 'rules', 'mine.md');
    mkdirSync(join(mine, '..'), { recursive: true });
    writeFileSync(mine, '# my rule\n');
    expect(await install({ rules: 'branching' })).toBe(0);
    expect(placed()).toEqual(['branching-short.md', 'branching-trunk.md']);
    expect(readFileSync(mine, 'utf8')).toBe('# my rule\n');
    expect(runUninstall({ harness: 'omp', home })).toBe(0);
    expect(existsSync(owned())).toBe(false);
    expect(readFileSync(mine, 'utf8')).toBe('# my rule\n');
  });
});
