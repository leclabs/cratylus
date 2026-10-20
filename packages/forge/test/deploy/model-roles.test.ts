// Which model a tier or a persona's role runs on is the operator's choice and the
// host's own setting (decision 0112). An agent's declaration names its own role, then
// its tier and effort, and never a model. Install binds what the operator chooses in
// the host's `modelRoles`, records none of it as its own, and so upgrade and uninstall
// keep it; a role the host binds is never changed; told nothing and unable to ask, it
// names each tier no model is bound to as the next step. An upgrade from the earlier
// layout leaves the bindings that layout seeded, as the host's.

import {
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { runInstall } from '../../src/cli/commands/install.js';
import { runUninstall } from '../../src/cli/commands/uninstall.js';
import { addModelRoles } from '../../src/deploy/model-roles.js';
import type { ProjectablePlugin } from '../../src/project/index.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';
import {
  FIXTURE_PRACTICE,
  fixtureAgentSource,
  fixturePractices,
} from './helpers.js';

const roots: string[] = [];
afterEach(() => {
  vi.restoreAllMocks();
  for (const r of roots) rmSync(r, { recursive: true, force: true });
  roots.length = 0;
});

function scratch(): string {
  const root = mkdtempSync(join(tmpdir(), 'model-roles-'));
  roots.push(root);
  return root;
}

describe('addModelRoles on a JSON document', () => {
  it('adds the entries in the layout the document had, reporting the host’s in order', () => {
    const file = join(scratch(), 'config.yml');
    const doc = {
      theme: 'dark',
      modelRoles: { default: 'a/x:low', smol: 'a/y' },
    };
    writeFileSync(file, `${JSON.stringify(doc, null, 2)}\n`);
    const result = addModelRoles(file, [
      { role: 'default', value: 'ignored' },
      { role: 'frontier', value: 'a/x' },
    ]);
    expect(result.host).toEqual([
      ['default', 'a/x:low'],
      ['smol', 'a/y'],
    ]);
    expect(result.added).toEqual([{ role: 'frontier', value: 'a/x' }]);
    expect(readFileSync(file, 'utf8')).toBe(
      `${JSON.stringify(
        { ...doc, modelRoles: { ...doc.modelRoles, frontier: 'a/x' } },
        null,
        2,
      )}\n`,
    );
  });

  it('refuses a document it could not write back byte for byte', () => {
    const file = join(scratch(), 'config.yml');
    const text = '{ "modelRoles": { "default": "a/x" } }\n';
    writeFileSync(file, text);
    const result = addModelRoles(file, [{ role: 'frontier', value: 'a/x' }]);
    expect(result.refused).toMatch(/layout/);
    expect(readFileSync(file, 'utf8')).toBe(text);
  });
});

describe('install — model roles', () => {
  let root: string;
  let home: string;
  let cwd: string;
  let agents: string;
  let out: string;
  const config = () => join(home, '.omp', 'agent', 'config.yml');
  /** The canon at `efforts`, each version in a directory of its own: a module once
   *  imported is not read again in this process. */
  const design = (efforts: Record<string, string> = {}) => {
    agents = mkdtempSync(join(root, 'agents-'));
    for (const [name, tier, effort] of [
      ['alpha', 'frontier', 'high'],
      ['beta', 'fast', 'medium'],
      ['gamma', 'frontier-other-family', 'high'],
    ] as const) {
      writeFileSync(
        join(agents, `${name}.ts`),
        fixtureAgentSource(name, {
          routing: { tier, effort: efforts[name] ?? effort },
        }),
      );
    }
  };
  const plugin = (): ProjectablePlugin => ({
    name: 'model-roles-fixture',
    manifest: FIXTURE_MANIFEST,
    agents,
    practices: fixturePractices(['alpha', 'beta', 'gamma']),
  });
  const install = (extra: Partial<Parameters<typeof runInstall>[0]> = {}) =>
    runInstall({
      harness: 'omp',
      home,
      cwd,
      canon: plugin() as never,
      practices: FIXTURE_PRACTICE,
      ...extra,
    });
  const host = (text: string) => {
    mkdirSync(dirname(config()), { recursive: true });
    writeFileSync(config(), text);
  };
  const HOST = [
    '# my models',
    'modelRoles:',
    '  default: anthropic/big:low',
    '  smol: "anthropic/small:medium"',
    '  alternate: openai/other:max',
    '',
  ].join('\n');

  beforeEach(() => {
    root = scratch();
    home = join(root, 'home');
    cwd = join(root, 'cwd');
    mkdirSync(cwd, { recursive: true });
    design();
    out = '';
    for (const stream of [process.stdout, process.stderr])
      vi.spyOn(stream, 'write').mockImplementation((s) => {
        out += String(s);
        return true;
      });
    vi.spyOn(console, 'log').mockImplementation((...a) => {
      out += `${a.join(' ')}\n`;
    });
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  const declared = (name: string) =>
    /^model: (.*)$/m.exec(
      readFileSync(join(home, '.cratylus/omp/agents', `${name}.md`), 'utf8'),
    )?.[1];

  it('names each agent’s own role, then its tier and effort, and writes no role into the host’s config (0111)', async () => {
    host(HOST);
    expect(await install()).toBe(0);
    expect(declared('alpha')).toBe('["@alpha", "@frontier:high"]');
    expect(declared('beta')).toBe('["@beta", "@fast:medium"]');
    expect(declared('gamma')).toBe('["@gamma", "@frontier-other-family:high"]');
    expect(readFileSync(config(), 'utf8')).toBe(HOST);
  });

  it('asks nothing about a role the host binds, and says a choice for it is left', async () => {
    host(`${HOST}  alpha: "my/own"\n`);
    expect(await install({ modelRoles: 'alpha=openai/picked' })).toBe(0);
    expect(declared('alpha')).toBe('["@alpha", "@frontier:high"]');
    expect(out).toContain(
      'the host already binds the model role alpha, so it is left as the host set it',
    );
    expect(readFileSync(config(), 'utf8')).toBe(`${HOST}  alpha: "my/own"\n`);
  });

  it('names each tier the host leaves unbound as the next step when it cannot ask', async () => {
    host(`${HOST}  frontier: anthropic/big:high\n`);
    expect(await install()).toBe(0);
    expect(out).toMatch(
      /next:[\s\S]*bind a model to each tier fast, frontier-other-family under modelRoles in /,
    );
    expect(out).not.toMatch(/each tier[^\n]*\bfrontier,/);
  });

  it('binds a chosen tier or agent role as the host’s own setting, which reinstall and uninstall keep', async () => {
    host(HOST);
    expect(
      await install({ modelRoles: 'frontier=openai/picked,beta=x/y' }),
    ).toBe(0);
    expect(declared('alpha')).toBe('["@alpha", "@frontier:high"]');
    expect(declared('beta')).toBe('["@beta", "@fast:medium"]');
    const bound = `${HOST}  frontier: "openai/picked"\n  beta: "x/y"\n`;
    expect(readFileSync(config(), 'utf8')).toBe(bound);
    expect(out).toContain('frontier → openai/picked, beta → x/y');
    expect(
      JSON.stringify(
        JSON.parse(
          readFileSync(join(home, '.cratylus/omp/installation.json'), 'utf8'),
        ),
      ),
    ).not.toContain('openai/picked');
    expect(await install()).toBe(0);
    expect(readFileSync(config(), 'utf8')).toBe(bound);
    expect(runUninstall({ harness: 'omp', home })).toBe(0);
    expect(readFileSync(config(), 'utf8')).toBe(bound);
    out = '';
    expect(await install({ modelRoles: 'builder=x/y' })).toBe(1);
    expect(out).toContain(
      "'builder' is no tier or agent of this install (tiers: fast, frontier, frontier-other-family; agents: alpha, beta, gamma)",
    );
  });

  it('asks each tier the host does not bind, and binds the answer in the host’s settings', async () => {
    host(`${HOST}  fast: anthropic/small\n`);
    let asked: string[] = [];
    expect(
      await install({
        interactive: true,
        modelRoles: undefined,
        prompts: {
          harness: async () => 'omp',
          scope: async () => 'user',
          practices: async (offered) => offered.map((p) => p.name),
          rules: async () => [],
          routes: async (questions) => {
            asked = questions.map((q) => `${q.roleOf}:${q.role}`);
            return { frontier: 'anthropic/big:high' };
          },
          agentStatus: async () => true,
          confirm: async () => true,
        },
      }),
    ).toBe(0);
    expect(asked).toEqual(['tier:frontier', 'tier:frontier-other-family']);
    expect(readFileSync(config(), 'utf8')).toBe(
      `${HOST}  fast: anthropic/small\n  frontier: "anthropic/big:high"\n`,
    );
    expect(declared('alpha')).toBe('["@alpha", "@frontier:high"]');
  });

  it('upgrading from the earlier layout keeps the bindings it seeded, as the host’s, and takes back the rest', async () => {
    const seeded = [
      'modelRoles:\n',
      '  alpha: "@frontier:high"\n',
      '  retired: "@frontier:medium"\n',
    ];
    const status = ['statusLine:\n', '  preset: custom\n'];
    host([...seeded, ...status].join(''));
    mkdirSync(join(home, '.omp/.forge'), { recursive: true });
    writeFileSync(
      join(home, '.omp/.forge/deploy-manifest.json'),
      JSON.stringify({
        version: 1,
        kinds: {},
        hostEdits: {
          'agent/config.yml': {
            created: true,
            hunks: [
              { context: null, before: [], after: seeded },
              { context: seeded[2], before: [], after: status },
            ],
          },
        },
        modelRoleSeeds: {
          alpha: '@frontier:high',
          retired: '@frontier:medium',
        },
      }),
    );
    expect(await install({ modelRoles: 'default' })).toBe(0);
    expect(readFileSync(config(), 'utf8')).toBe(seeded.join(''));
    expect(out).toContain(
      'alpha: "@frontier:high" / retired: "@frontier:medium"',
    );
  });

  it('keeps the bindings an earlier install seeded into a host config kept as JSON, and the comma it ended a host line with', async () => {
    const host_ = [
      '{\n',
      '  "modelRoles": {\n',
      '    "default": "fixture/base",\n',
      '    "alternate": "other/model"\n',
      '  }\n',
      '}\n',
    ];
    const after = [
      host_[0],
      host_[1],
      host_[2],
      '    "alternate": "other/model",\n',
      '    "alpha": "@frontier:high",\n',
      '    "retired": "@frontier:medium"\n',
      host_[4],
      host_[5],
    ].join('');
    host(after);
    mkdirSync(join(home, '.omp/.forge'), { recursive: true });
    writeFileSync(
      join(home, '.omp/.forge/deploy-manifest.json'),
      JSON.stringify({
        version: 1,
        kinds: {},
        hostEdits: {
          'agent/config.yml': {
            created: false,
            hunks: [
              {
                context: host_[2],
                before: [host_[3]],
                after: [
                  '    "alternate": "other/model",\n',
                  '    "alpha": "@frontier:high",\n',
                  '    "retired": "@frontier:medium"\n',
                ],
              },
            ],
          },
        },
        modelRoleSeeds: {
          alpha: '@frontier:high',
          retired: '@frontier:medium',
        },
      }),
    );
    expect(await install({ modelRoles: 'default' })).toBe(0);
    expect(readFileSync(config(), 'utf8')).toBe(after);
  });

  it('follows the agent’s effort on reinstall, and uninstall leaves the host’s file byte for byte', async () => {
    host(HOST);
    expect(await install()).toBe(0);
    design({ alpha: 'xhigh' });
    expect(await install()).toBe(0);
    expect(declared('alpha')).toBe('["@alpha", "@frontier:xhigh"]');
    expect(runUninstall({ harness: 'omp', home })).toBe(0);
    expect(readFileSync(config(), 'utf8')).toBe(HOST);
  });
});
