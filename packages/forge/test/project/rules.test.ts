// Rules: a plugin set offers rulesets; projection renders exactly the rules named,
// none by default, each to `rules/<name>.md` in omp's always-applied form, and the
// owned root places each at that path.

import { mkdtempSync, readFileSync, readdirSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import type { Ruleset } from '@cratylus/schema';
import { afterEach, describe, expect, it } from 'vitest';
import { ompHarnessAdapter } from '../../src/adapters/omp/render.js';
import {
  ownedRootIn,
  placeOwnedRoot,
  rootFiles,
} from '../../src/deploy/owned-root.js';
import {
  type ProjectablePlugin,
  projectPluginSet,
} from '../../src/project/index.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';

const tmp: string[] = [];
afterEach(() => {
  for (const dir of tmp.splice(0))
    rmSync(dir, { recursive: true, force: true });
});

const branching: Ruleset = {
  name: 'branching',
  description: 'a fixture branching convention',
  rules: [
    {
      name: 'branching-trunk',
      description: 'one trunk: "main"',
      statement: 'Integrate on one trunk.',
      why: 'One line to integrate on.',
    },
    {
      name: 'branching-short',
      description: 'short branches',
      statement: 'Keep branches short-lived.',
      why: 'Short branches merge cleanly.',
    },
  ],
};
const commits: Ruleset = {
  name: 'commits',
  description: 'a fixture commit convention',
  rules: [
    {
      name: 'commits-small',
      description: 'small commits',
      statement: 'Commit small steps.',
      why: 'Small steps review and revert cleanly.',
    },
  ],
};

const plugin = (
  rulesets: readonly Ruleset[],
  name = 'fixture',
): ProjectablePlugin => ({ name, manifest: FIXTURE_MANIFEST, rulesets });

const project = (
  plugins: readonly ProjectablePlugin[],
  rules?: readonly string[],
) =>
  projectPluginSet({
    plugins,
    adapter: ompHarnessAdapter,
    warn: () => {},
    ...(rules !== undefined ? { rules } : {}),
  });

const ruleFiles = (files: readonly { path: string }[]) =>
  files.map((f) => f.path).filter((p) => p.startsWith('rules/'));

describe('projecting rules', () => {
  it('renders none when no rule is named, or an empty set is', async () => {
    const plugins = [plugin([branching, commits])];
    expect(ruleFiles((await project(plugins)).files)).toEqual([]);
    expect(ruleFiles((await project(plugins, [])).files)).toEqual([]);
  });

  it('renders each named rule to rules/<name>.md, always applied, in declaration order', async () => {
    const tree = await project(
      [plugin([branching, commits])],
      ['commits-small', 'branching-trunk'],
    );
    expect(ruleFiles(tree.files)).toEqual([
      'rules/branching-trunk.md',
      'rules/commits-small.md',
    ]);
    expect(
      tree.files.find((f) => f.path === 'rules/branching-trunk.md')?.content,
    ).toBe(
      [
        '---',
        'description: "one trunk: \\"main\\""',
        'alwaysApply: true',
        '---',
        '',
        'Integrate on one trunk.',
        '',
        'Why: One line to integrate on.',
        '',
      ].join('\n'),
    );
  });

  it('reports the declared rulesets with their rules, whether or not any is named', async () => {
    const tree = await project([plugin([branching, commits])]);
    expect(tree.rulesets).toEqual([
      {
        name: 'branching',
        description: 'a fixture branching convention',
        rules: [
          { name: 'branching-trunk', description: 'one trunk: "main"' },
          { name: 'branching-short', description: 'short branches' },
        ],
      },
      {
        name: 'commits',
        description: 'a fixture commit convention',
        rules: [{ name: 'commits-small', description: 'small commits' }],
      },
    ]);
  });

  it('lets a later plugin replace a ruleset of the same name', async () => {
    const replaced: Ruleset = { ...commits, rules: [] };
    const tree = await project([
      plugin([branching, commits], 'base'),
      plugin([replaced], 'consumer'),
    ]);
    expect(tree.rulesets.find((r) => r.name === 'commits')?.rules).toEqual([]);
  });

  it('refuses a name that is no declared rule', async () => {
    await expect(
      project([plugin([branching])], ['branching-trunk', 'nope']),
    ).rejects.toThrow(/'nope' is no rule of the plugin set/);
  });

  it('refuses a rule name two rulesets both carry', async () => {
    const twin: Ruleset = {
      ...commits,
      rules: [{ ...(branching.rules[0] as Ruleset['rules'][number]) }],
    };
    await expect(project([plugin([branching, twin])])).rejects.toThrow(
      /'branching-trunk' is in both the 'branching' and the 'commits' rulesets/,
    );
  });
});

describe('projecting the practice rulesets', () => {
  const withPractice = (practiceRulesets: readonly Ruleset[]) => ({
    ...plugin([branching]),
    practiceRulesets,
  });

  it('renders every practice rule whatever the rules named, and reports it apart from the rulesets offered', async () => {
    const none = await project([withPractice([commits])]);
    expect(ruleFiles(none.files)).toEqual(['rules/commits-small.md']);
    expect(none.practiceRules).toEqual(['commits-small']);
    expect(none.rulesets.map((r) => r.name)).toEqual(['branching']);
    const chosen = await project(
      [withPractice([commits])],
      ['branching-short'],
    );
    expect(ruleFiles(chosen.files)).toEqual([
      'rules/commits-small.md',
      'rules/branching-short.md',
    ]);
  });

  it('refuses a practice rule named among the offered ones', async () => {
    await expect(
      project([withPractice([commits])], ['commits-small']),
    ).rejects.toThrow(/'commits-small' is no rule of the plugin set/);
  });

  it('refuses a rule name a practice ruleset and an offered one both carry', async () => {
    const twin: Ruleset = { ...commits, rules: [...branching.rules] };
    await expect(project([withPractice([twin])])).rejects.toThrow(
      /'branching-trunk' is in both the 'commits' and the 'branching' rulesets/,
    );
  });
});

describe('placing rules in the owned root', () => {
  it('places each rendered rule at rules/<name>.md under the root', async () => {
    const tree = await project(
      [plugin([branching, commits])],
      ['branching-short'],
    );
    const home = mkdtempSync(join(tmpdir(), 'rules-root-'));
    tmp.push(home);
    const root = ownedRootIn(ompHarnessAdapter, home);
    placeOwnedRoot({
      adapter: ompHarnessAdapter,
      root,
      files: rootFiles(ompHarnessAdapter, tree.files),
      configuration: {},
      record: { references: [] },
      dry: false,
    });
    expect(readdirSync(join(root, 'rules'))).toEqual(['branching-short.md']);
    expect(readFileSync(join(root, 'rules/branching-short.md'), 'utf8')).toBe(
      tree.files.find((f) => f.path === 'rules/branching-short.md')?.content,
    );
  });
});
