// The guided install: what it asks, what it shows before it writes, and what it then
// places — driven through `runInstall` with the prompts injected, over a corpus written
// to a tmp dir at run time and a tmp HOME, so no real host is ever read or written.
//
// The operator's decisions are four (harness, optional personas, launch commands, the
// model each role routes to); each case is a claim about one of them, or about the one
// confirmation before the first byte is written.

import {
  lstatSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  readdirSync,
  readlinkSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { kebabToCamel } from '@cratylus/schema';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import type { InstallPrompts } from '../../src/cli/commands/install-prompts.js';
import { runInstall } from '../../src/cli/commands/install.js';
import { runUninstall } from '../../src/cli/commands/uninstall.js';
import type { ProjectablePlugin } from '../../src/project/index.js';
import { answers } from '../deploy/helpers.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';

const roots: string[] = [];
function tmpRoot(): string {
  const r = mkdtempSync(join(tmpdir(), 'install-'));
  roots.push(r);
  return r;
}
afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllEnvs();
  for (const r of roots) rmSync(r, { recursive: true, force: true });
  roots.length = 0;
});

/** Every file and link under `dir`, keyed by its path from there: a file by its bytes,
 *  a link by its target. */
function snapshot(dir: string, at = ''): Record<string, string> {
  const out: Record<string, string> = {};
  for (const entry of readdirSync(join(dir, at)).sort()) {
    const rel = at === '' ? entry : `${at}/${entry}`;
    const stat = lstatSync(join(dir, rel));
    if (stat.isSymbolicLink()) out[rel] = `-> ${readlinkSync(join(dir, rel))}`;
    else if (stat.isDirectory()) Object.assign(out, snapshot(dir, rel));
    else out[rel] = readFileSync(join(dir, rel), 'utf8');
  }
  return out;
}

/** Roles held by planner, assayer and implementer; nico and kino are optional. */
function corpus(): ProjectablePlugin {
  const agents = join(tmpRoot(), 'agents');
  mkdirSync(agents, { recursive: true });
  const nulls = Object.keys(FIXTURE_MANIFEST)
    .map((k) => `  ${kebabToCamel(k)}: null,`)
    .join('\n');
  const spec: Record<string, { holds?: string; optional?: true }> = {
    planner: { holds: 'planner' },
    assayer: { holds: 'assayer' },
    implementer: { holds: 'implementer' },
    nico: { optional: true },
    kino: { optional: true },
  };
  for (const [name, { holds, optional }] of Object.entries(spec)) {
    writeFileSync(
      join(agents, `${name}.ts`),
      [
        `export const ${name} = {`,
        `  name: '${name}',`,
        `  description: 'fixture agent ${name}',`,
        `  archetype: '${name} probe',`,
        ...(holds ? [`  holds: '${holds}',`] : []),
        ...(optional ? ['  optional: true,'] : []),
        nulls,
        '};',
        '',
      ].join('\n'),
      'utf8',
    );
  }
  return { name: 'install-fixture', manifest: FIXTURE_MANIFEST, agents };
}

describe('the guided install', () => {
  let home: string;
  let cwd: string;
  let plugin: ProjectablePlugin;
  let out: string;
  let err: string;
  const claude = () => join(home, '.claude');
  const omp = () => join(home, '.omp');
  const ompAgent = (name: string) =>
    join(omp(), 'agent', 'agents', `${name}.md`);
  const ompConfig = () => join(omp(), 'agent', 'config.yml');
  const claudeAgent = (name: string) => join(claude(), 'agents', `${name}.md`);
  const modelLine = (path: string) =>
    /^model: (.*)$/m.exec(readFileSync(path, 'utf8'))?.[1];
  const files = (dir: string) => Object.keys(snapshot(dir));

  const install = (extra: Partial<Parameters<typeof runInstall>[0]> = {}) =>
    runInstall({
      home,
      cwd,
      corpus: plugin as never,
      pathEnv: '/usr/bin',
      ...extra,
    });
  /** A terminal run: every question goes to `prompts`, and one that a case does not
   *  expect fails it. */
  const asked = (prompts: Partial<InstallPrompts>) => ({
    interactive: true,
    prompts: answers({
      harness: async () => {
        throw new Error('asked which harness');
      },
      personas: async () => {
        throw new Error('asked which personas');
      },
      linkCommands: async () => {
        throw new Error('asked whether to link');
      },
      routes: async () => {
        throw new Error('asked which models');
      },
      confirm: async () => {
        throw new Error('asked to go ahead');
      },
      ...prompts,
    }),
  });

  beforeEach(() => {
    const root = tmpRoot();
    home = join(root, 'home');
    cwd = join(root, 'cwd');
    mkdirSync(join(home, '.claude'), { recursive: true });
    mkdirSync(join(home, '.omp', 'agent'), { recursive: true });
    mkdirSync(cwd, { recursive: true });
    // The runtime config lives outside the harness home, at the process's own HOME
    // unless told otherwise: an uninstall must find only this run's.
    vi.stubEnv('AGENT_RUNTIME_CONFIG', join(home, '.cratylus.json'));
    plugin = corpus();
    out = '';
    err = '';
    vi.spyOn(process.stdout, 'write').mockImplementation((s) => {
      out += String(s);
      return true;
    });
    vi.spyOn(process.stderr, 'write').mockImplementation((s) => {
      err += String(s);
      return true;
    });
    vi.spyOn(console, 'log').mockImplementation((...a) => {
      out += `${a.join(' ')}\n`;
    });
    vi.spyOn(console, 'error').mockImplementation((...a) => {
      err += `${a.join(' ')}\n`;
    });
  });

  it('asks nothing of a decision given by flag, and nothing at all when every decision is given', async () => {
    expect(
      await install({
        ...asked({}),
        harness: 'omp',
        personas: 'nico',
        linkPersonaCommands: false,
        modelRoles: 'planner=@slow',
      }),
    ).toBe(0);
    expect(snapshot(omp())).toHaveProperty(['agent/agents/nico.md']);
    expect(snapshot(omp())).not.toHaveProperty(['agent/agents/kino.md']);
    expect(readFileSync(ompConfig(), 'utf8')).toMatch(/planner: "@slow"/);
  });

  it('asks the decisions the flags leave open, and only those', async () => {
    const questions: string[] = [];
    expect(
      await install({
        ...asked({
          personas: async (offered, initial) => {
            questions.push(
              `personas ${offered.join('+')} from ${initial.join('+')}`,
            );
            return ['kino'];
          },
          routes: async (roles) => {
            questions.push(`routes ${roles.map((r) => r.role).join('+')}`);
            return {};
          },
          confirm: async () => true,
        }),
        harness: 'omp',
        linkPersonaCommands: false,
      }),
    ).toBe(0);
    expect(questions).toEqual([
      'personas kino+nico from ',
      'routes assayer+implementer+planner',
    ]);
    expect(snapshot(omp())).toHaveProperty(['agent/agents/kino.md']);
    expect(snapshot(omp())).not.toHaveProperty(['agent/agents/nico.md']);
  });

  it('writes nothing before the confirmation, shows what it would place, and writes nothing on a decline', async () => {
    let seenBefore: string[] | undefined;
    const before = snapshot(home);
    expect(
      await install({
        ...asked({
          personas: async () => ['nico'],
          linkCommands: async () => true,
          confirm: async () => {
            seenBefore = files(home);
            expect(out).toContain('cratylus would install');
            expect(out).toContain('optional personas: nico');
            return false;
          },
        }),
        harness: 'omp',
        modelRoles: 'default',
      }),
    ).toBe(0);
    expect(seenBefore).toEqual(Object.keys(before));
    expect(snapshot(home)).toEqual(before);
    expect(out).toContain('Nothing was written.');
  });

  it('places on a yes and then summarises what it did and what to do next', async () => {
    expect(
      await install({
        ...asked({ personas: async () => ['nico'], confirm: async () => true }),
        harness: 'omp',
        modelRoles: 'default',
        linkPersonaCommands: false,
      }),
    ).toBe(0);
    expect(files(omp())).toContain('agent/agents/nico.md');
    expect(out).toContain('cratylus is installed');
    expect(out).toContain('cratylus uninstall --harness omp');
    // The summary is a few lines; the deploy log is verbose's.
    expect(out).not.toContain('=== LOCAL deploy');
    expect(out.split('\n').length).toBeLessThan(16);
  });

  it('asks nothing and places without a confirmation where there is no terminal', async () => {
    expect(
      await install({
        harness: 'omp',
        interactive: false,
        prompts: asked({}).prompts,
      }),
    ).toBe(0);
    expect(files(omp())).toContain('agent/agents/planner.md');
    // A fresh host has no optional persona to keep.
    expect(files(omp())).not.toContain('agent/agents/nico.md');
    expect(files(omp())).not.toContain('agent/agents/kino.md');
    expect(files(home)).not.toContain('.local/bin/planner');
  });

  it('--yes takes every default and asks nothing even on a terminal', async () => {
    expect(await install({ ...asked({}), yes: true, harness: 'omp' })).toBe(0);
    expect(files(omp())).toContain('agent/agents/planner.md');
  });

  it('refuses an ambiguous host without a terminal, and asks which on one', async () => {
    expect(await install({ interactive: false })).toBe(1);
    expect(err).toContain('name one with --harness');
    expect(files(claude())).toEqual([]);

    let offered: readonly string[] = [];
    expect(
      await install({
        ...asked({
          harness: async (found) => {
            offered = found;
            return 'claude';
          },
          personas: async () => [],
          routes: async () => ({}),
          linkCommands: async () => false,
          confirm: async () => false,
        }),
      }),
    ).toBe(0);
    expect(offered).toEqual(['claude', 'omp']);
    expect(files(claude())).toEqual([]);
  });

  it('never asks about, or changes, a role the host already routes, and says so', async () => {
    const host = 'modelRoles:\n  planner: openai/gpt-5:high\n';
    writeFileSync(ompConfig(), host);
    let roles: string[] = [];
    expect(
      await install({
        ...asked({
          routes: async (questions) => {
            roles = questions.map((q) => q.role);
            return {};
          },
          personas: async () => [],
          linkCommands: async () => false,
          confirm: async () => true,
        }),
        harness: 'omp',
      }),
    ).toBe(0);
    expect(roles).toEqual(['assayer', 'implementer']);
    expect(readFileSync(ompConfig(), 'utf8')).toContain(
      'modelRoles:\n  planner: openai/gpt-5:high\n',
    );
    expect(out).toMatch(/left alone: the model of planner/);

    // A flag naming it is left as the host set it, and said so.
    expect(
      await install({ harness: 'omp', modelRoles: 'planner=@slow', yes: true }),
    ).toBe(0);
    expect(readFileSync(ompConfig(), 'utf8')).toContain(
      '  planner: openai/gpt-5:high\n',
    );
    expect(readFileSync(ompConfig(), 'utf8')).not.toContain('@slow');
    expect(out).toMatch(
      /--model-roles planner=@slow: the host already routes planner/,
    );
  });

  it('preselects the personas installed before, and drops one the operator unticks', async () => {
    expect(await install({ harness: 'omp', personas: 'nico', yes: true })).toBe(
      0,
    );
    expect(files(omp())).toContain('agent/agents/nico.md');

    let preselected: readonly string[] = [];
    expect(
      await install({
        ...asked({
          personas: async (_offered, initial) => {
            preselected = initial;
            return [];
          },
          routes: async () => ({}),
          linkCommands: async () => false,
          confirm: async () => true,
        }),
        harness: 'omp',
      }),
    ).toBe(0);
    expect(preselected).toEqual(['nico']);
    expect(files(omp())).not.toContain('agent/agents/nico.md');
    expect(out).toContain('removed nico');
  });

  it('keeps a persona installed before when nothing is asked', async () => {
    expect(await install({ harness: 'omp', personas: 'nico', yes: true })).toBe(
      0,
    );
    expect(await install({ harness: 'omp', yes: true })).toBe(0);
    expect(files(omp())).toContain('agent/agents/nico.md');
  });

  it('writes a role the operator chose to omp as the host would, and uninstall takes it out again', async () => {
    const before = snapshot(home);
    expect(
      await install({
        harness: 'omp',
        modelRoles: 'planner=@slow',
        linkPersonaCommands: false,
      }),
    ).toBe(0);
    expect(readFileSync(ompConfig(), 'utf8')).toMatch(
      /^ {2}planner: "@slow"$/m,
    );
    expect(readFileSync(ompConfig(), 'utf8')).toMatch(
      /^ {2}assayer: "@default"$/m,
    );
    expect(runUninstall({ harness: 'omp', home })).toBe(0);
    expect(snapshot(home)).toEqual(before);
  });

  it('places the chosen models on claude as the host’s from then on, drops a persona on re-install, and uninstall restores the host', async () => {
    writeFileSync(join(claude(), 'settings.json'), '{"theme":"dark"}\n');
    const before = snapshot(home);
    expect(
      await install({
        harness: 'claude',
        personas: 'nico',
        linkPersonaCommands: false,
        modelRoles: 'planner=sonnet,assayer=opus',
      }),
    ).toBe(0);
    expect(files(claude())).toContain('agents/nico.md');
    expect(modelLine(claudeAgent('planner'))).toBe('sonnet');
    expect(modelLine(claudeAgent('assayer'))).toBe('opus');

    // The host deletes a line the operator chose (equal to the role's own tier).
    const assayer = readFileSync(claudeAgent('assayer'), 'utf8');
    writeFileSync(
      claudeAgent('assayer'),
      assayer.replace(/^model: opus\n/m, ''),
    );

    expect(
      await install({ harness: 'claude', personas: 'none', yes: true }),
    ).toBe(0);
    expect(files(claude())).not.toContain('agents/nico.md');
    expect(modelLine(claudeAgent('planner'))).toBe('sonnet');
    expect(modelLine(claudeAgent('assayer'))).toBeUndefined();
    // A role nobody chose still follows the rendering.
    expect(modelLine(claudeAgent('implementer'))).toBe('sonnet');

    expect(runUninstall({ harness: 'claude', home })).toBe(0);
    expect(snapshot(home)).toEqual(before);
  });

  it('does not ask about a claude role whose agent the host gave a model line, and leaves that line', async () => {
    expect(await install({ harness: 'claude', yes: true })).toBe(0);
    const planner = readFileSync(claudeAgent('planner'), 'utf8');
    writeFileSync(
      claudeAgent('planner'),
      planner.replace('model: opus', 'model: haiku'),
    );
    let roles: string[] = [];
    expect(
      await install({
        ...asked({
          routes: async (questions) => {
            roles = questions.map((q) => q.role);
            return { assayer: 'haiku' };
          },
          personas: async () => [],
          linkCommands: async () => false,
          confirm: async () => true,
        }),
        harness: 'claude',
      }),
    ).toBe(0);
    expect(roles).toEqual(['assayer', 'implementer']);
    expect(modelLine(claudeAgent('planner'))).toBe('haiku');
    expect(modelLine(claudeAgent('assayer'))).toBe('haiku');
    expect(modelLine(claudeAgent('implementer'))).toBe('sonnet');
  });

  it('refuses what it cannot honour before writing a byte', async () => {
    const before = snapshot(home);
    expect(await install({ harness: 'omp', personas: 'mav', yes: true })).toBe(
      1,
    );
    expect(err).toContain("--personas: 'mav'");
    expect(
      await install({ harness: 'omp', modelRoles: 'ghost=@slow', yes: true }),
    ).toBe(1);
    expect(err).toContain("--model-roles: 'ghost'");
    expect(
      await install({ harness: 'omp', modelRoles: 'planner', yes: true }),
    ).toBe(1);
    expect(snapshot(home)).toEqual(before);
  });

  it('writes nothing when the operator cancels a question', async () => {
    const before = snapshot(home);
    expect(
      await install({
        ...asked({ personas: async () => undefined }),
        harness: 'omp',
      }),
    ).toBe(1);
    expect(err).toContain('cancelled');
    expect(snapshot(home)).toEqual(before);
  });

  it('--dry-run shows what it would place and stops, whatever was answered', async () => {
    const before = snapshot(home);
    expect(
      await install({
        harness: 'omp',
        personas: 'nico',
        modelRoles: 'planner=@slow',
        dryRun: true,
      }),
    ).toBe(0);
    expect(snapshot(home)).toEqual(before);
    expect(out).toContain('cratylus would install');
    expect(out).toContain('optional personas: nico');
    expect(out).toContain('would edit');
    expect(out).not.toContain('cratylus is installed');
  });

  it('prints the per-file detail only when asked for', async () => {
    expect(await install({ harness: 'omp', yes: true })).toBe(0);
    expect(out).not.toContain('=== LOCAL deploy');
    expect(out).not.toContain('defs copied');
    rmSync(join(omp(), '.forge'), { recursive: true, force: true });
    out = '';
    expect(await install({ harness: 'omp', yes: true, verbose: true })).toBe(0);
    expect(out).toContain('=== LOCAL deploy');
  });
});
