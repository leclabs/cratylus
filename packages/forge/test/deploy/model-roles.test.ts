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

  it('keys --model-roles by agent name, puts the choice in the declaration, and refuses a name no agent has', async () => {
    host(HOST);
    expect(await install({ modelRoles: 'beta=openai/picked' })).toBe(0);
    expect(declared('beta')).toBe('["@beta", "openai/picked"]');
    expect(declared('alpha')).toBe('["@alpha", "@frontier:high"]');
    expect(out).toContain('models you chose: beta → openai/picked');
    expect(readFileSync(config(), 'utf8')).toBe(HOST);
    out = '';
    expect(await install({ modelRoles: 'builder=x/y' })).toBe(1);
    expect(out).toContain(
      "'builder' is no agent this install places (agents: alpha, beta, gamma)",
    );
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
