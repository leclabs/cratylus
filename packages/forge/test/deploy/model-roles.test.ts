// Install binds each agent's model through omp's model roles: every tier an agent uses
// as a role named for the tier, seeded from the roles the host already has, and every
// agent's own role as `@<tier>:<effort>`. An entry the host set is never changed; an
// entry install seeded follows what it would seed now; a tier with nothing to seed it
// from is reported; and uninstall takes back exactly what install put in.

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
  /** The corpus at `efforts`, each version in a directory of its own: a module once
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
      corpus: plugin() as never,
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

  it('seeds the tiers from the host’s roles and binds each agent to its tier and effort', async () => {
    host(HOST);
    expect(await install()).toBe(0);
    const added = [
      '  fast: "anthropic/small"',
      '  frontier: "anthropic/big"',
      '  frontier-other-family: "openai/other"',
      '  alpha: "@frontier:high"',
      '  beta: "@fast:medium"',
      '  gamma: "@frontier-other-family:high"',
    ];
    expect(readFileSync(config(), 'utf8')).toContain(
      `${HOST.trimEnd()}\n${added.join('\n')}\n`,
    );
  });

  it('never changes an entry the host set, and says so', async () => {
    host(`${HOST}  alpha: "my/own"\n  frontier: "openai/chosen"\n`);
    expect(await install()).toBe(0);
    const text = readFileSync(config(), 'utf8');
    expect(text).toContain('  alpha: "my/own"\n');
    expect(text).toContain('  frontier: "openai/chosen"\n');
    expect(text).not.toContain('@frontier:high');
    // The other family is read against the frontier the host set.
    expect(text).toContain('  frontier-other-family: "anthropic/big"\n');
    expect(out).toContain('left alone: the model roles frontier, alpha');
  });

  it('leaves a tier it has nothing to seed from unseeded, and says so', async () => {
    host('modelRoles:\n  default: anthropic/big\n');
    expect(await install()).toBe(0);
    const text = readFileSync(config(), 'utf8');
    expect(text).not.toMatch(/^ {2}fast:/m);
    expect(text).not.toMatch(/^ {2}frontier-other-family:/m);
    expect(text).toContain('  beta: "@fast:medium"\n');
    expect(out).toContain('could not seed the model role fast');
    expect(out).toContain(
      'could not seed the model role frontier-other-family',
    );
  });

  it('keys --model-roles by agent name and refuses a name no agent has', async () => {
    host(HOST);
    expect(await install({ modelRoles: 'beta=openai/picked' })).toBe(0);
    expect(readFileSync(config(), 'utf8')).toContain(
      '  beta: "openai/picked"\n',
    );
    expect(out).toContain('models you chose: beta → openai/picked');
    out = '';
    expect(await install({ modelRoles: 'builder=x/y' })).toBe(1);
    expect(out).toContain(
      "'builder' is no agent this install places (agents: alpha, beta, gamma)",
    );
  });

  it('moves its own seed when the agent’s effort changes, and keeps the operator’s choice', async () => {
    host(HOST);
    expect(await install({ modelRoles: 'beta=openai/picked' })).toBe(0);
    design({ alpha: 'xhigh', beta: 'low' });
    expect(await install()).toBe(0);
    const text = readFileSync(config(), 'utf8');
    expect(text).toContain('  alpha: "@frontier:xhigh"\n');
    expect(text).not.toContain('@frontier:high"');
    expect(text).toContain('  beta: "openai/picked"\n');
  });

  it('edits a host config written as one JSON document', async () => {
    const doc = {
      modelRoles: { default: 'anthropic/big:low', smol: 'anthropic/small' },
    };
    host(JSON.stringify(doc));
    expect(await install()).toBe(0);
    expect(JSON.parse(readFileSync(config(), 'utf8')).modelRoles).toEqual({
      ...doc.modelRoles,
      fast: 'anthropic/small',
      frontier: 'anthropic/big',
      alpha: '@frontier:high',
      beta: '@fast:medium',
      gamma: '@frontier-other-family:high',
    });
    expect(runUninstall({ harness: 'omp', home })).toBe(0);
    expect(readFileSync(config(), 'utf8')).toBe(JSON.stringify(doc));
  });

  it('is taken back by uninstall, the host’s file byte for byte', async () => {
    host(HOST);
    expect(await install({ modelRoles: 'beta=openai/picked' })).toBe(0);
    design({ alpha: 'xhigh' });
    expect(await install()).toBe(0);
    expect(runUninstall({ harness: 'omp', home })).toBe(0);
    expect(readFileSync(config(), 'utf8')).toBe(HOST);
  });
});
