// The guided install: what it asks, what it shows before it writes, and what it then
// places — driven through `runInstall` with the prompts injected, over a corpus written
// to a tmp dir at run time and a tmp HOME, so no real host is ever read or written.
//
// The operator's decisions are four (harness, practices, launch commands, the model
// each role routes to); each case is a claim about one of them, or about the one
// confirmation before the first byte is written.

import {
  existsSync,
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

/** Roles held by planner, assayer and implementer, the practice `build`; nico is the
 *  practice `authoring` and kino `films`. `tap` is plumbing: installed with any of
 *  them and offered as none. */
function corpus(): ProjectablePlugin {
  const root = tmpRoot();
  const agents = join(root, 'agents');
  const skills = join(root, 'skills');
  mkdirSync(agents, { recursive: true });
  mkdirSync(join(skills, 'tap'), { recursive: true });
  writeFileSync(
    join(skills, 'tap', 'skill.ts'),
    [
      'export const tap = {',
      "  name: 'tap',",
      "  description: 'fixture plumbing',",
      "  formalBlock: 'tap ≜ ⟨fixture⟩',",
      '  composition: () => [],',
      '};',
      '',
    ].join('\n'),
    'utf8',
  );
  const nulls = Object.keys(FIXTURE_MANIFEST)
    .map((k) => `  ${kebabToCamel(k)}: null,`)
    .join('\n');
  const spec: Record<string, { holds?: string; isolation?: 'worktree' }> = {
    planner: { holds: 'planner' },
    assayer: { holds: 'assayer' },
    implementer: { holds: 'implementer', isolation: 'worktree' },
    nico: {},
    kino: {},
  };
  for (const [name, { holds, isolation }] of Object.entries(spec)) {
    writeFileSync(
      join(agents, `${name}.ts`),
      [
        `export const ${name} = {`,
        `  name: '${name}',`,
        `  description: 'fixture agent ${name}',`,
        `  archetype: '${name} probe',`,
        ...(holds ? [`  holds: '${holds}',`] : []),
        ...(isolation ? [`  isolation: '${isolation}',`] : []),
        nulls,
        '};',
        '',
      ].join('\n'),
      'utf8',
    );
  }
  return {
    name: 'install-fixture',
    manifest: FIXTURE_MANIFEST,
    agents,
    skills,
    practices: [
      {
        name: 'build',
        description: 'plans, builds and judges',
        agents: ['planner', 'assayer', 'implementer'],
        preselected: true,
      },
      {
        name: 'authoring',
        description: 'writes the corpus',
        agents: ['nico'],
      },
      { name: 'films', description: 'makes films', agents: ['kino'] },
    ],
    plumbing: { skills: ['tap'] },
  };
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

  /** A run naming its practices (`build`) unless a case says otherwise, since a run
   *  that is not told them and has no terminal to ask is refused. */
  const install = (extra: Partial<Parameters<typeof runInstall>[0]> = {}) =>
    runInstall({
      home,
      cwd,
      corpus: plugin as never,
      pathEnv: '/usr/bin',
      practices: 'build',
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
      practices: async () => {
        throw new Error('asked which practices');
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
        practices: 'build,authoring',
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
          practices: async (offered, initial) => {
            questions.push(
              `practices ${offered.map((p) => p.name).join('+')} from ${initial.join('+')}`,
            );
            return ['build', 'films'];
          },
          routes: async (roles) => {
            questions.push(`routes ${roles.map((r) => r.role).join('+')}`);
            return {};
          },
          confirm: async () => true,
        }),
        practices: undefined,
        harness: 'omp',
        linkPersonaCommands: false,
      }),
    ).toBe(0);
    expect(questions).toEqual([
      'practices build+authoring+films from build',
      'routes assayer+implementer+planner',
    ]);
    expect(snapshot(omp())).toHaveProperty(['agent/agents/kino.md']);
    expect(snapshot(omp())).not.toHaveProperty(['agent/agents/nico.md']);
  });

  it('offers the declared practices each with its description, and never the plumbing they are all installed with', async () => {
    let offered: readonly { name: string; description: string }[] = [];
    expect(
      await install({
        ...asked({
          practices: async (o) => {
            offered = o;
            return ['films'];
          },
          confirm: async () => true,
        }),
        practices: undefined,
        harness: 'omp',
        modelRoles: 'default',
        linkPersonaCommands: false,
      }),
    ).toBe(0);
    expect(
      offered.map(({ name, description }) => ({ name, description })),
    ).toEqual([
      { name: 'build', description: 'plans, builds and judges' },
      { name: 'authoring', description: 'writes the corpus' },
      { name: 'films', description: 'makes films' },
    ]);
    // The plumbing was placed all the same.
    expect(files(join(home, '.agents'))).toContain('skills/tap/SKILL.md');
  });

  it('writes nothing before the confirmation, shows what it would place, and writes nothing on a decline', async () => {
    let seenBefore: string[] | undefined;
    const before = snapshot(home);
    expect(
      await install({
        ...asked({
          practices: async () => ['build', 'authoring'],
          linkCommands: async () => true,
          confirm: async () => {
            seenBefore = files(home);
            expect(out).toContain('cratylus would install');
            expect(out).toContain('practices: build, authoring');
            return false;
          },
        }),
        practices: undefined,
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
        ...asked({
          practices: async () => ['build', 'authoring'],
          confirm: async () => true,
        }),
        practices: undefined,
        harness: 'omp',
        modelRoles: 'default',
        linkPersonaCommands: false,
      }),
    ).toBe(0);
    expect(files(omp())).toContain('agent/agents/nico.md');
    expect(out).toContain('cratylus is installed');
    expect(out).toContain('cratylus uninstall --harness omp');
    // The summary is a few lines; the deploy log is verbose's.
    expect(out.split('\n').length).toBeLessThan(24);
  });

  it('asks nothing and places without a confirmation where there is no terminal, the practices named', async () => {
    expect(
      await install({
        harness: 'omp',
        practices: 'build',
        interactive: false,
        prompts: asked({}).prompts,
      }),
    ).toBe(0);
    expect(files(omp())).toContain('agent/agents/planner.md');
    expect(files(omp())).not.toContain('agent/agents/nico.md');
    expect(files(omp())).not.toContain('agent/agents/kino.md');
    expect(files(home)).not.toContain('.local/bin/planner');
  });

  it('installs every practice, without a terminal, when told --all', async () => {
    expect(
      await install({
        harness: 'omp',
        practices: undefined,
        all: true,
        interactive: false,
        prompts: asked({}).prompts,
      }),
    ).toBe(0);
    for (const name of ['planner', 'nico', 'kino']) {
      expect(files(omp())).toContain(`agent/agents/${name}.md`);
    }
  });

  it('with no terminal and neither --practices nor --all refuses on one line before writing, under --yes and over an existing install', async () => {
    const check = async (extra: Partial<Parameters<typeof install>[0]>) => {
      const before = snapshot(home);
      err = '';
      out = '';
      expect(
        await install({
          harness: 'omp',
          practices: undefined,
          interactive: false,
          prompts: asked({}).prompts,
          ...extra,
        }),
      ).toBe(1);
      expect(out).toBe('');
      expect(err.trim().split('\n')).toHaveLength(1);
      expect(err).toMatch(/^cratylus install: /);
      expect(err).toContain('--practices <build,authoring,films>');
      expect(err).toContain('--all');
      expect(snapshot(home)).toEqual(before);
    };
    await check({});
    await check({ yes: true });
    await check({ dryRun: true });

    expect(
      await install({ harness: 'omp', practices: 'build,authoring' }),
    ).toBe(0);
    await check({});
    await check({ yes: true });
  });

  it('--yes takes every default and asks nothing even on a terminal', async () => {
    expect(await install({ ...asked({}), yes: true, harness: 'omp' })).toBe(0);
    expect(files(omp())).toContain('agent/agents/planner.md');
  });

  it('refuses an unknown harness on one line naming the known ones, never with a stack', async () => {
    expect(await install({ yes: true, harness: 'nope' })).toBe(1);
    expect(err.trim().split('\n')).toEqual([
      "cratylus install: unknown harness 'nope'; pass one of --harness <claude|omp>",
    ]);
    expect(files(claude())).toEqual([]);
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

  it('on omp asks again for the routes install seeded itself, and moves them to the choice', async () => {
    expect(await install({ harness: 'omp', yes: true })).toBe(0);
    expect(readFileSync(ompConfig(), 'utf8')).toMatch(/planner: "@plan"/);

    // A rerun by flag moves the seed to the model now chosen; the host was never
    // credited with the seed.
    out = '';
    expect(
      await install({ harness: 'omp', modelRoles: 'planner=@slow', yes: true }),
    ).toBe(0);
    expect(readFileSync(ompConfig(), 'utf8')).toMatch(/planner: "@slow"/);
    expect(readFileSync(ompConfig(), 'utf8')).not.toContain('@plan"');
    expect(out).not.toMatch(/already routes/);
    expect(out).not.toMatch(/left alone: the model of/);

    // A guided rerun asks every role but the one chosen, which is now the host's.
    let roles: string[] = [];
    expect(
      await install({
        ...asked({
          routes: async (questions) => {
            roles = questions.map((q) => q.role);
            return { assayer: '@slow' };
          },
          linkCommands: async () => false,
          confirm: async () => true,
        }),
        harness: 'omp',
      }),
    ).toBe(0);
    expect(roles).toEqual(['assayer', 'implementer']);
    expect(readFileSync(ompConfig(), 'utf8')).toMatch(/assayer: "@slow"/);

    // What was chosen stands: a later flag for it is left as it is, and said so.
    out = '';
    expect(
      await install({ harness: 'omp', modelRoles: 'assayer=@fast', yes: true }),
    ).toBe(0);
    expect(readFileSync(ompConfig(), 'utf8')).toMatch(/assayer: "@slow"/);
    expect(out).toMatch(/--model-roles assayer=@fast: the host already routes/);

    // The uninstall takes out every line install put there, moved ones included.
    expect(runUninstall({ harness: 'omp', home })).toBe(0);
    expect(files(omp())).toEqual([]);
  });

  it("on omp a choice equal to the seed is still the operator's, and a seed the host edited is the host's", async () => {
    expect(
      await install({ harness: 'omp', modelRoles: 'planner=@plan', yes: true }),
    ).toBe(0);
    expect(
      await install({ harness: 'omp', modelRoles: 'planner=@slow', yes: true }),
    ).toBe(0);
    expect(readFileSync(ompConfig(), 'utf8')).toMatch(/planner: "@plan"/);

    // The host changes a seed by hand: it is the host's from then on.
    const text = readFileSync(ompConfig(), 'utf8');
    writeFileSync(
      ompConfig(),
      text.replace('assayer: "@', 'assayer: "openai/'),
    );
    expect(
      await install({ harness: 'omp', modelRoles: 'assayer=@slow', yes: true }),
    ).toBe(0);
    expect(readFileSync(ompConfig(), 'utf8')).toMatch(/assayer: "openai\//);
    expect(readFileSync(ompConfig(), 'utf8')).not.toContain('assayer: "@slow"');
  });

  it("on omp a choice equal to the seed it finds is the operator's from then on", async () => {
    expect(await install({ harness: 'omp', yes: true })).toBe(0);
    out = '';
    expect(
      await install({
        harness: 'omp',
        modelRoles: 'implementer=@task',
        yes: true,
      }),
    ).toBe(0);
    expect(out).toMatch(/implementer → @task/);
    expect(readFileSync(ompConfig(), 'utf8')).toMatch(/implementer: "@task"/);

    // A later choice does not move it; it is said to be the host's.
    out = '';
    expect(
      await install({
        harness: 'omp',
        modelRoles: 'implementer=@smol',
        yes: true,
      }),
    ).toBe(0);
    expect(readFileSync(ompConfig(), 'utf8')).toMatch(/implementer: "@task"/);
    expect(readFileSync(ompConfig(), 'utf8')).not.toContain('@smol');
    expect(out).toMatch(
      /--model-roles implementer=@smol: the host already routes/,
    );

    // What install put there still goes with the uninstall.
    expect(runUninstall({ harness: 'omp', home })).toBe(0);
    expect(files(omp())).toEqual([]);
  });

  it('preselects the practices installed before, and drops one the operator unticks', async () => {
    expect(
      await install({
        harness: 'omp',
        practices: 'build,authoring',
        yes: true,
      }),
    ).toBe(0);
    expect(files(omp())).toContain('agent/agents/nico.md');

    let preselected: readonly string[] = [];
    expect(
      await install({
        ...asked({
          practices: async (_offered, initial) => {
            preselected = initial;
            return ['build'];
          },
          routes: async () => ({}),
          linkCommands: async () => false,
          confirm: async () => true,
        }),
        practices: undefined,
        harness: 'omp',
      }),
    ).toBe(0);
    expect(preselected).toEqual(['build', 'authoring']);
    expect(files(omp())).not.toContain('agent/agents/nico.md');
    expect(out).toContain('removed authoring');
  });

  it('takes the launch commands of a practice it drops out with it, the last agent’s included', async () => {
    const withQuiet = {
      corpus: {
        ...plugin,
        practices: [
          ...(plugin.practices ?? []),
          { name: 'quiet', description: 'no agent at all', agents: [] },
        ],
      } as never,
    };
    expect(
      await install({
        ...withQuiet,
        harness: 'omp',
        practices: 'build,authoring',
        linkPersonaCommands: true,
      }),
    ).toBe(0);
    expect(files(home)).toContain('.local/bin/nico');
    expect(files(home)).toContain('.local/bin/planner');

    out = '';
    expect(
      await install({
        ...withQuiet,
        harness: 'omp',
        practices: 'build',
        linkPersonaCommands: false,
      }),
    ).toBe(0);
    expect(files(home)).not.toContain('.local/bin/nico');
    expect(files(home)).toContain('.local/bin/planner');
    expect(out).toContain('unlinked the command of nico');

    expect(
      await install({
        ...withQuiet,
        harness: 'omp',
        practices: 'quiet',
        linkPersonaCommands: false,
      }),
    ).toBe(0);
    expect(files(home)).not.toContain('.local/bin/planner');
    expect(files(omp())).not.toContain('agent/agents/planner.md');
  });

  it('--yes on a terminal takes the practices installed before, and on a fresh host the preselected ones', async () => {
    expect(
      await install({
        ...asked({}),
        practices: undefined,
        yes: true,
        harness: 'omp',
      }),
    ).toBe(0);
    expect(files(omp())).toContain('agent/agents/planner.md');
    expect(files(omp())).not.toContain('agent/agents/nico.md');

    expect(
      await install({
        harness: 'omp',
        practices: 'build,authoring',
        yes: true,
      }),
    ).toBe(0);
    expect(files(omp())).toContain('agent/agents/nico.md');
    expect(
      await install({
        ...asked({}),
        practices: undefined,
        yes: true,
        harness: 'omp',
      }),
    ).toBe(0);
    expect(files(omp())).toContain('agent/agents/nico.md');
    expect(files(omp())).toContain('agent/agents/planner.md');
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

  it('places the chosen models on claude as the host’s from then on, drops a practice on re-install, and uninstall restores the host', async () => {
    writeFileSync(join(claude(), 'settings.json'), '{"theme":"dark"}\n');
    const before = snapshot(home);
    expect(
      await install({
        harness: 'claude',
        practices: 'build,authoring',
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
      await install({ harness: 'claude', practices: 'build', yes: true }),
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
    expect(await install({ harness: 'omp', practices: 'mav', yes: true })).toBe(
      1,
    );
    expect(err).toContain("--practices: 'mav'");
    expect(
      await install({ harness: 'omp', modelRoles: 'ghost=@slow', yes: true }),
    ).toBe(1);
    expect(err).toContain("--model-roles: 'ghost'");
    expect(
      await install({ harness: 'omp', modelRoles: 'planner', yes: true }),
    ).toBe(1);
    expect(snapshot(home)).toEqual(before);
  });

  it('refuses a name that is no declared practice on one line naming the declared ones, and writes nothing', async () => {
    const before = snapshot(home);
    expect(
      await install({ harness: 'omp', practices: 'build,bogus', yes: true }),
    ).toBe(1);
    expect(err.trim().split('\n')).toEqual([
      "cratylus install: --practices: 'bogus' is no practice of this corpus (declared: build, authoring, films); name only declared practices",
    ]);
    expect(snapshot(home)).toEqual(before);
  });

  it('refuses --practices and --all together, and writes nothing', async () => {
    const before = snapshot(home);
    expect(
      await install({ harness: 'omp', practices: 'build', all: true }),
    ).toBe(1);
    expect(err.trim().split('\n')).toHaveLength(1);
    expect(err).toMatch(/^cratylus install: --practices and --all/);
    expect(snapshot(home)).toEqual(before);
  });

  it('never takes no practice for every practice: an empty choice is refused, saying how to remove it all', async () => {
    const before = snapshot(home);
    for (const practices of ['', ' , ']) {
      err = '';
      expect(await install({ harness: 'omp', practices, yes: true })).toBe(1);
      expect(err.trim().split('\n')).toHaveLength(1);
      expect(err).toMatch(/^cratylus install: no practice was chosen/);
      expect(err).toContain('cratylus uninstall --harness omp');
      expect(snapshot(home)).toEqual(before);
    }

    // The same on a terminal: the question is answered with none.
    err = '';
    expect(
      await install({
        ...asked({ practices: async () => [] }),
        practices: undefined,
        harness: 'omp',
      }),
    ).toBe(1);
    expect(err).toMatch(/^cratylus install: no practice was chosen/);
    expect(snapshot(home)).toEqual(before);
  });

  it('writes nothing when the operator cancels a question', async () => {
    const before = snapshot(home);
    expect(
      await install({
        ...asked({ practices: async () => undefined }),
        practices: undefined,
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
        practices: 'build,authoring',
        modelRoles: 'planner=@slow',
        dryRun: true,
      }),
    ).toBe(0);
    expect(snapshot(home)).toEqual(before);
    expect(out).toContain('cratylus would install');
    expect(out).toContain('practices: build, authoring');
    expect(out).toContain('would edit');
    expect(out).not.toContain('cratylus is installed');
  });

  it('says in its summary, dry or not, that omp runs the implementer in an isolated copy and not in a worktree off the line, and keeps the warning', async () => {
    const said =
      "not realized: the implementer is not started in a worktree of its own on omp; it runs in an isolated copy of its dispatcher's checkout, never writing the main checkout, cut from the dispatcher's HEAD and not from the plan's line, so the land gate refuses the work until it is moved onto the line";
    const before = snapshot(home);
    expect(
      await install({ harness: 'omp', practices: 'build', dryRun: true }),
    ).toBe(0);
    expect(out).toContain(said);
    expect(out).toContain(
      `would edit ${ompConfig()}: task.isolation sets enabled: true, apply: false, merge: branch`,
    );
    expect(err).toContain("agent 'implementer' runs in a git worktree");
    expect(err).toContain('isolated copy');
    expect(snapshot(home)).toEqual(before);
    out = '';
    expect(
      await install({ harness: 'omp', practices: 'build', yes: true }),
    ).toBe(0);
    expect(out).toContain(said);
  });

  it('sets the host settings an isolated task needs, where the host keeps its own, and lets an uninstall put them back', async () => {
    const host = [
      '# host config',
      'task:',
      '  disabledAgents:',
      '    []',
      '  isolation:',
      '    apply: true # keep what the copy built',
      '    backend: auto',
      'theme: dark',
      '',
    ].join('\n');
    writeFileSync(ompConfig(), host);
    expect(
      await install({ harness: 'omp', practices: 'build', yes: true }),
    ).toBe(0);
    const set = readFileSync(ompConfig(), 'utf8');
    expect(set).toContain(
      '  isolation:\n    apply: false\n    backend: auto\n    enabled: true\n    merge: branch\n',
    );
    expect(set).not.toContain('apply: true');
    expect(set).toContain('theme: dark');
    // The module that sets `isolated` is placed where a bare session and a persona's
    // own session each load it.
    expect(files(omp())).toEqual(
      expect.arrayContaining([
        'agent/extensions/cratylus-isolation.ts',
        'agent/personas/implementer/extensions/cratylus-isolation.ts',
      ]),
    );
    expect(runUninstall({ harness: 'omp', home })).toBe(0);
    expect(readFileSync(ompConfig(), 'utf8')).toBe(host);
  });

  it('leaves a config it cannot edit safely as it is, and says which lines to write', async () => {
    const host = 'task: { isolation: { enabled: false } }\n';
    writeFileSync(ompConfig(), host);
    expect(
      await install({ harness: 'omp', practices: 'build', yes: true }),
    ).toBe(0);
    expect(readFileSync(ompConfig(), 'utf8').startsWith(host)).toBe(true);
    expect(err).toContain(`did not edit ${ompConfig()}`);
    expect(err).toContain(
      'task.isolation.enabled: true, task.isolation.apply: false, task.isolation.merge: branch',
    );
  });

  it('leaves the worktree shortfall out of the summary where the harness starts the agent in one', async () => {
    expect(
      await install({ harness: 'claude', practices: 'build', dryRun: true }),
    ).toBe(0);
    expect(out).not.toContain('not realized');
    expect(err).not.toContain('worktree');
  });

  it('prints the per-file detail only when asked for', async () => {
    expect(await install({ harness: 'omp', yes: true })).toBe(0);
    expect(out).not.toContain('defs copied');
    rmSync(join(omp(), '.forge'), { recursive: true, force: true });
    out = '';
    expect(await install({ harness: 'omp', yes: true, verbose: true })).toBe(0);
    expect(out).toContain('defs copied');
  });

  it('names the runtime config it writes outside the harness, in the preview and in the summary', async () => {
    const config = join(home, '.cratylus.json');
    // The runtime config is emitted for a corpus that declares events.
    const withEvents = {
      corpus: { ...plugin, events: ['session.start'] } as never,
    };
    expect(
      await install({
        ...withEvents,
        harness: 'claude',
        yes: true,
        dryRun: true,
      }),
    ).toBe(0);
    expect(out).toContain(`would write the runtime config ${config}`);
    expect(existsSync(config)).toBe(false);
    out = '';
    expect(await install({ ...withEvents, harness: 'claude', yes: true })).toBe(
      0,
    );
    expect(out).toContain(`wrote the runtime config ${config}`);
    expect(existsSync(config)).toBe(true);
  });

  it('writes the runtime config under the home it is given, and creates none under the process’s', async () => {
    const processHome = join(tmpRoot(), 'process-home');
    mkdirSync(processHome, { recursive: true });
    vi.stubEnv('HOME', processHome);
    vi.stubEnv('AGENT_RUNTIME_CONFIG', undefined);
    expect(
      await install({
        corpus: { ...plugin, events: ['session.start'] } as never,
        harness: 'claude',
        yes: true,
      }),
    ).toBe(0);
    expect(existsSync(join(home, '.cratylus.json'))).toBe(true);
    expect(existsSync(join(processHome, '.cratylus.json'))).toBe(false);
    expect(out).toContain(
      `wrote the runtime config ${join(home, '.cratylus.json')}`,
    );
  });

  it('writes it at $AGENT_RUNTIME_CONFIG wherever that is set, whatever the home', async () => {
    const set = join(tmpRoot(), 'elsewhere.json');
    vi.stubEnv('AGENT_RUNTIME_CONFIG', set);
    expect(
      await install({
        corpus: { ...plugin, events: ['session.start'] } as never,
        harness: 'claude',
        yes: true,
      }),
    ).toBe(0);
    expect(existsSync(set)).toBe(true);
    expect(existsSync(join(home, '.cratylus.json'))).toBe(false);
  });

  describe('where Claude Code reads', () => {
    let processHome: string;
    let configDir: string;
    beforeEach(() => {
      processHome = join(tmpRoot(), 'process-home');
      configDir = join(tmpRoot(), 'claude-config');
      mkdirSync(processHome, { recursive: true });
      mkdirSync(configDir, { recursive: true });
      vi.stubEnv('HOME', processHome);
      vi.stubEnv('CLAUDE_CONFIG_DIR', configDir);
    });
    /** A claude run given no home, as the command line gives it. */
    const unhomed = () =>
      runInstall({
        cwd,
        corpus: plugin as never,
        pathEnv: '/usr/bin',
        practices: 'build',
        harness: 'claude',
        yes: true,
      });

    it('places its files under CLAUDE_CONFIG_DIR when no home is given, nothing under $HOME/.claude, and uninstall removes them from there', async () => {
      expect(await unhomed()).toBe(0);
      expect(existsSync(join(configDir, 'agents', 'planner.md'))).toBe(true);
      expect(files(configDir).some((f) => f.endsWith('manifest.json'))).toBe(
        true,
      );
      const settings = readFileSync(join(configDir, 'settings.json'), 'utf8');
      expect(settings).toContain('statusLine');
      expect(existsSync(join(processHome, '.claude'))).toBe(false);

      expect(runUninstall({ harness: 'claude', verbose: true })).toBe(0);
      expect(existsSync(join(configDir, 'agents', 'planner.md'))).toBe(false);
      expect(files(configDir).filter((f) => f !== 'settings.json')).toEqual([]);
      expect(existsSync(join(processHome, '.claude'))).toBe(false);
    });

    it('finds the harness to install into where CLAUDE_CONFIG_DIR is, when none is named', async () => {
      expect(
        await runInstall({
          cwd,
          corpus: plugin as never,
          pathEnv: '/usr/bin',
          practices: 'build',
          yes: true,
        }),
      ).toBe(0);
      expect(existsSync(join(configDir, 'agents', 'planner.md'))).toBe(true);
      expect(existsSync(join(processHome, '.claude'))).toBe(false);
    });

    it('puts a run given a home under that home’s .claude, whatever CLAUDE_CONFIG_DIR says', async () => {
      expect(await install({ harness: 'claude', yes: true })).toBe(0);
      expect(claudeAgent('planner')).toSatisfy(existsSync);
      expect(files(configDir)).toEqual([]);
      expect(runUninstall({ harness: 'claude', home })).toBe(0);
      expect(existsSync(claudeAgent('planner'))).toBe(false);
    });
  });

  it('takes the status line an earlier install recorded placing, spelled as a former release wrote it, for its own: the worker becomes the current one, never wrapped, and uninstall removes it', async () => {
    expect(await install({ harness: 'claude', yes: true })).toBe(0);
    const settingsFile = join(claude(), 'settings.json');
    const manifestFile = join(claude(), '.forge', 'deploy-manifest.json');
    const current = JSON.parse(readFileSync(settingsFile, 'utf8')).statusLine
      .command as string;
    // The host as an install from before the change left it.
    const former =
      'sh "$HOME/.claude/personas/_session/cratylus-status-line.sh"';
    expect(current).not.toBe(former);
    const settings = JSON.parse(readFileSync(settingsFile, 'utf8'));
    settings.statusLine.command = former;
    writeFileSync(settingsFile, JSON.stringify(settings, null, 2));
    const manifest = JSON.parse(readFileSync(manifestFile, 'utf8'));
    manifest.statusLine = { placed: former, host: null };
    writeFileSync(manifestFile, JSON.stringify(manifest, null, 2));

    out = '';
    expect(await install({ harness: 'claude', yes: true })).toBe(0);
    expect(JSON.parse(readFileSync(settingsFile, 'utf8')).statusLine).toEqual({
      ...settings.statusLine,
      command: current,
    });
    expect(out).not.toContain('wrapped in the persona badge');
    expect(JSON.parse(readFileSync(manifestFile, 'utf8')).statusLine).toEqual({
      placed: current,
      host: null,
    });

    expect(runUninstall({ harness: 'claude', home })).toBe(0);
    expect(existsSync(settingsFile)).toBe(false);
  });

  it.each([
    ['not valid JSON', 'not json', 'is not valid JSON'],
    ['a JSON array', '[1]', 'is not a JSON object'],
  ])(
    'refuses a runtime config holding %s in one line, leaving its bytes and placing nothing',
    async (_case, held, said) => {
      const config = join(home, '.cratylus.json');
      writeFileSync(config, held);
      const before = snapshot(home);
      for (const dryRun of [false, true]) {
        err = '';
        out = '';
        expect(
          await install({
            corpus: { ...plugin, events: ['session.start'] } as never,
            harness: 'claude',
            yes: true,
            dryRun,
          }),
        ).toBe(1);
        expect(out).toBe('');
        const lines = err.trimEnd().split('\n');
        expect(lines).toHaveLength(1);
        expect(lines[0]).toMatch(/^cratylus install: /);
        expect(lines[0]).toContain(`${config} ${said}`);
        expect(lines[0]).toContain(
          'repair the file or move it away, then run cratylus install again',
        );
        expect(readFileSync(config, 'utf8')).toBe(held);
        expect(snapshot(home)).toEqual(before);
      }
    },
  );

  it('ends in one line, writing nothing, where the cwd config names a package that is not installed', async () => {
    // What `cratylus init` writes, before its package is installed: the loader's
    // MissingPackageError, not a stack trace, and no fallback to the bundled corpus.
    writeFileSync(
      join(cwd, 'cratylus.config.ts'),
      "import canon from 'not-installed-corpus-package';\nexport default { extends: [canon], patches: [] };\n",
    );
    expect(
      await install({ harness: 'claude', all: true, practices: undefined }),
    ).toBe(1);
    expect(out).toBe('');
    const lines = err.trimEnd().split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^cratylus install: /);
    expect(lines[0]).toContain('not-installed-corpus-package');
    expect(files(claude())).toEqual([]);
  });

  it('ends in one line where the cwd config does not parse', async () => {
    writeFileSync(join(cwd, 'cratylus.config.ts'), 'export default {{\n');
    expect(await install({ harness: 'claude', all: true })).toBe(1);
    expect(out).toBe('');
    const lines = err.trimEnd().split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(
      /^cratylus install: .*cratylus\.config\.ts( failed to load| does not parse)/,
    );
    expect(files(claude())).toEqual([]);
  });

  it.each([
    [
      'extends nothing',
      'export default { extends: [], patches: [] };\n',
      'extends no plugins',
    ],
    [
      'extends a plugin carrying no manifest',
      "export default { extends: [{ name: 'bare' }], patches: [] };\n",
      'declares a dimension manifest (bare)',
    ],
  ])(
    'ends in one line where the cwd config %s',
    async (_case, source, said) => {
      writeFileSync(join(cwd, 'cratylus.config.ts'), source);
      expect(await install({ harness: 'claude', all: true })).toBe(1);
      expect(out).toBe('');
      const lines = err.trimEnd().split('\n');
      expect(lines).toHaveLength(1);
      expect(lines[0]).toMatch(/^cratylus install: .*cratylus\.config\.ts/);
      expect(lines[0]).toContain(said);
      expect(files(claude())).toEqual([]);
    },
  );

  it('ends in one line where the cwd config exports no config', async () => {
    writeFileSync(join(cwd, 'cratylus.config.ts'), 'export default 3;\n');
    expect(await install({ harness: 'claude', all: true })).toBe(1);
    const lines = err.trimEnd().split('\n');
    expect(lines).toHaveLength(1);
    expect(lines[0]).toMatch(/^cratylus install: .*not a valid/);
    expect(files(claude())).toEqual([]);
  });

  it('refuses, naming a config and not a flag, where no corpus was given at all', async () => {
    expect(
      await install({ harness: 'claude', all: true, corpus: undefined }),
    ).toBe(1);
    expect(err).toContain('cratylus install: no corpus; write a');
    expect(err).not.toContain('--plugin');
    expect(files(claude())).toEqual([]);
  });
});
