// THE CLAUDE PERSONA SCOPE — where a persona's stance manifest lands on Claude Code, and
// which personas get one.
//
// Claude registers its mechanism ONCE, in `settings.json`, so its scope is not where a
// hook lives. It is what a worker looks for when the hook payload names the running
// agent (`agent_type`): `<claude home>/personas/<agent>/stance/manifest.json`. Presence
// is enrollment, so the claims worth pinning are WHERE the manifest lands and WHICH
// personas get one — a wrong answer to either leaves a guard that fires from the global
// settings and exits at its scope gate on every call, green throughout. The second is a
// matter of COMPOSITION: a guard is listed for exactly the personas composing what it
// binds, and a cell that binds nothing is never listed.

import { spawnSync } from 'node:child_process';
import {
  existsSync,
  mkdirSync,
  mkdtempSync,
  readFileSync,
  rmSync,
  symlinkSync,
  writeFileSync,
} from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join, posix } from 'node:path';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';
import { personaSkillOutputSize } from '../../src/adapters/claude/persona-launch.js';
import {
  CLAUDE_LAUNCHER_FILE,
  CLAUDE_LAUNCHER_SCRIPT,
  CLAUDE_PERSONA_BADGE_FILE,
  CLAUDE_STATUS_LINE_FILE,
  agentToClaudeMd,
  claudeAgentRel,
  claudeHarnessAdapter,
  claudeLaunchSurface,
  claudeSkillRel,
} from '../../src/adapters/claude/render.js';
import {
  STANCE_MANIFEST,
  personaRootOf,
  stanceManifests,
} from '../../src/core/enrollment.js';
import {
  ENFORCING_STAGE_DIR,
  SESSION_SCOPE,
} from '../../src/core/harness-adapter.js';
import {
  type ProjectablePlugin,
  projectPluginSet,
} from '../../src/project/index.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';
import { bound } from './fixtures-stance/agents/bound.js';
import { unbound } from './fixtures-stance/agents/unbound.js';

const here = new URL('.', import.meta.url).pathname;

describe('claude scopedRel', () => {
  it('places a persona’s stance manifest at personas/<agent>/<file> under .claude', () => {
    expect(claudeHarnessAdapter.scopedRel?.(STANCE_MANIFEST, 'mav')).toBe(
      `personas/mav/${STANCE_MANIFEST}`,
    );
    expect(personaRootOf(claudeHarnessAdapter)).toBe('personas');
  });

  it('keeps the persona scope where purview’s derivation reaches the agent definition', () => {
    // purview goes two directories above the scope, then `agents/<name>.md`. On
    // claude that lands on `agents/<name>.md` only when `personas/` is a DIRECT
    // child of the harness home, as `agents/` is.
    const scope = posix.dirname(
      posix.dirname(
        claudeHarnessAdapter.scopedRel?.(STANCE_MANIFEST, 'mav') ?? '',
      ),
    );
    expect(scope).toBe('personas/mav');
    expect(
      posix.join(posix.dirname(posix.dirname(scope)), 'agents', 'mav.md'),
    ).toBe(claudeAgentRel('mav'));
  });
});

describe('stance manifests are fixed by composition', () => {
  const hook = (id: string, events: string[], timeout?: number) =>
    ({ id, events, command: `sh ${id}.sh`, timeout }) as never;
  const realizing = (...events: string[]) => ({
    realizes: (e: string) => events.includes(e),
  });
  const GUARD = {
    hook: hook('g', ['turn.end', 'git.commit.post'], 60),
    binds: { dimension: 'autonomy', value: 'mission-command' },
  };

  it('lists a guard for the persona composing what it binds, and for no other', () => {
    const out = stanceManifests(
      [GUARD],
      realizing('turn.end'),
      [unbound, bound],
      FIXTURE_MANIFEST,
    );
    // `unbound` projects and composes nothing the guard binds: no manifest at all.
    expect(out.map((m) => m.scope)).toEqual(['bound']);
    expect(out.map((m) => m.scope)).not.toContain(SESSION_SCOPE);
    expect(JSON.parse(out[0]?.content ?? '{}')).toEqual({
      agent: 'bound',
      // The realized moment only: `git.commit.post` is no moment of this cell here.
      gates: { g: { moments: ['turn.end'], timeout: 60 } },
    });
  });

  it('never lists a cell that binds nothing', () => {
    const notice = { hook: hook('drift', ['session.start']) };
    const [m] = stanceManifests(
      [notice, GUARD],
      realizing('turn.end', 'session.start'),
      [bound],
      FIXTURE_MANIFEST,
    );
    expect(Object.keys(JSON.parse(m?.content ?? '{}').gates)).toEqual(['g']);
    // …and a persona whose only candidate is a notice is not enrolled at all.
    expect(
      stanceManifests(
        [notice],
        realizing('session.start'),
        [bound],
        FIXTURE_MANIFEST,
      ),
    ).toEqual([]);
  });

  it('compares the bound value by anchor, so a folded body still binds', () => {
    const folded = {
      ...bound,
      autonomy: ['mission-command ≜ a body a fold rewrote'],
    } as never;
    expect(
      stanceManifests(
        [GUARD],
        realizing('turn.end'),
        [folded],
        FIXTURE_MANIFEST,
      ).map((m) => m.scope),
    ).toEqual(['bound']);
  });

  it('binds on any value of a dimension when the cell names no value', () => {
    const anyAutonomy = {
      hook: hook('any', ['turn.end']),
      binds: { dimension: 'autonomy' },
    };
    expect(
      stanceManifests(
        [anyAutonomy],
        realizing('turn.end'),
        [unbound, bound],
        FIXTURE_MANIFEST,
      ).map((m) => m.scope),
    ).toEqual(['bound']);
  });

  it('enrolls nobody when the adapter realizes nothing the guards name', () => {
    expect(
      stanceManifests([GUARD], realizing(), [bound], FIXTURE_MANIFEST),
    ).toEqual([]);
  });

  it('refuses a guard bound to a dimension no manifest declares', () => {
    expect(() =>
      stanceManifests(
        [{ hook: hook('g', ['turn.end']), binds: { dimension: 'nonesuch' } }],
        realizing('turn.end'),
        [bound],
        FIXTURE_MANIFEST,
      ),
    ).toThrow(/nonesuch/);
  });
});

describe('the claude projection emits the stance manifests', () => {
  const plugin: ProjectablePlugin = {
    name: 'fixture-stance',
    manifest: FIXTURE_MANIFEST,
    hooks: join(here, 'fixtures-stance', 'hooks'),
    agents: join(here, 'fixtures-stance', 'agents'),
  };
  const project = (adapter: typeof claudeHarnessAdapter) => {
    const warnings: string[] = [];
    return projectPluginSet({
      plugins: [plugin],
      adapter,
      warn: (line) => warnings.push(line),
    }).then((tree) => ({ tree, warnings }));
  };
  // The launch spec — launcher, status-line worker, badges — stages beside the stance
  // manifests; these cases are about the manifests.
  const isLaunchSpec = (path: string) =>
    [
      CLAUDE_LAUNCHER_FILE,
      CLAUDE_STATUS_LINE_FILE,
      CLAUDE_PERSONA_BADGE_FILE,
    ].some((file) => path.endsWith(`/${file}`));

  it('stages a stance manifest for the bound persona alone, beside the settings it complements', async () => {
    const { tree } = await project(claudeHarnessAdapter);
    const staged = tree.files.filter(
      (f) =>
        f.path.startsWith(`${ENFORCING_STAGE_DIR}/`) && !isLaunchSpec(f.path),
    );
    expect(staged.map((f) => f.path)).toEqual([
      join(ENFORCING_STAGE_DIR, 'bound', STANCE_MANIFEST),
    ]);
    const parsed = JSON.parse(staged[0]?.content ?? '{}');
    expect(parsed.agent).toBe('bound');
    expect(Object.keys(parsed.gates)).toEqual(['fixture-guard']);
    expect(parsed.gates['fixture-guard'].moments).toEqual(['turn.end']);
    // The registration is unchanged: claude keeps `settings.json`, and registers the
    // notice as well as the guard.
    const settings = JSON.parse(
      tree.files.find((f) => f.path === 'settings.json')?.content ?? '{}',
    );
    expect(Object.keys(settings.hooks).sort()).toEqual([
      'SessionStart',
      'Stop',
    ]);
  });

  it('withholds a guard and warns once per cell where the harness cannot name the running agent', async () => {
    // Claude minus `scopedRel` is the harness that registers hooks but places no
    // manifest a worker could find: the guard would fire for every session and judge
    // none, which reads as coverage.
    const { scopedRel: _named, ...noScope } = claudeHarnessAdapter;
    const { tree, warnings } = await project(noScope);
    const guardWarnings = warnings.filter((w) => w.includes('fixture-guard'));
    expect(guardWarnings).toHaveLength(1);
    expect(guardWarnings[0]).toContain('claude');
    expect(guardWarnings[0]).toContain('cannot name the running agent');
    // The notice binds nothing, so it is neither warned about nor withheld.
    expect(warnings.some((w) => w.includes('fixture-notice'))).toBe(false);
    const paths = tree.files.map((f) => f.path);
    expect(paths).toContain('hooks/fixture-notice/notice.sh');
    expect(paths.some((p) => p.startsWith('hooks/fixture-guard/'))).toBe(false);
    expect(
      paths.filter(
        (p) => p.startsWith(`${ENFORCING_STAGE_DIR}/`) && !isLaunchSpec(p),
      ),
    ).toEqual([]);
    const settings = JSON.parse(
      tree.files.find((f) => f.path === 'settings.json')?.content ?? '{}',
    );
    expect(Object.keys(settings.hooks)).toEqual(['SessionStart']);
  });
});

describe('the claude persona launcher', () => {
  const plugin: ProjectablePlugin = {
    name: 'fixture-stance',
    manifest: FIXTURE_MANIFEST,
    hooks: join(here, 'fixtures-stance', 'hooks'),
    agents: join(here, 'fixtures-stance', 'agents'),
  };

  it('is staged once, in the session scope and executable, when the set has agents', async () => {
    const tree = await projectPluginSet({
      plugins: [plugin],
      adapter: claudeHarnessAdapter,
    });
    const staged = tree.files.filter((f) =>
      f.path.endsWith(`/${CLAUDE_LAUNCHER_FILE}`),
    );
    expect(staged.map((f) => [f.path, f.executable])).toEqual([
      [join(ENFORCING_STAGE_DIR, SESSION_SCOPE, CLAUDE_LAUNCHER_FILE), true],
    ]);
    expect(claudeLaunchSurface([])).toEqual([]);
  });

  // Runs the shipped bytes: the launcher is shell, and what matters is what it hands
  // `claude`, so a stub `claude` records its argv and the launcher is invoked the two
  // ways it is documented — by a link named after the persona, and by name as `$1`.
  describe('run under a stub claude', () => {
    let home: string;
    beforeEach(() => {
      home = mkdtempSync(join(tmpdir(), 'claude-launcher-'));
      const launcher = join(
        home,
        '.claude',
        claudeHarnessAdapter.scopedRel?.(CLAUDE_LAUNCHER_FILE, SESSION_SCOPE) ??
          '',
      );
      mkdirSync(dirname(launcher), { recursive: true });
      writeFileSync(launcher, CLAUDE_LAUNCHER_SCRIPT, { mode: 0o755 });
      mkdirSync(join(home, '.claude', 'agents'), { recursive: true });
      writeFileSync(join(home, '.claude', claudeAgentRel('mav')), '# mav\n');
      mkdirSync(join(home, 'bin'), { recursive: true });
      writeFileSync(
        join(home, 'bin', 'claude'),
        '#!/bin/sh\nprintf "%s\\n" "$@" > "$(dirname "$0")/argv"\n',
        { mode: 0o755 },
      );
      for (const name of ['mav', 'nosuch']) {
        symlinkSync(launcher, join(home, 'bin', name));
      }
      symlinkSync(launcher, join(home, 'bin', CLAUDE_LAUNCHER_FILE));
    });
    afterEach(() => rmSync(home, { recursive: true, force: true }));

    const run = (command: string, ...args: string[]) =>
      spawnSync(join(home, 'bin', command), args, {
        encoding: 'utf8',
        env: {
          ...process.env,
          PATH: `${join(home, 'bin')}:${process.env.PATH}`,
        },
      });
    const argv = () =>
      readFileSync(join(home, 'bin', 'argv'), 'utf8')
        .trimEnd()
        .split('\n');

    it('starts the persona a link is named after, passing every other word to claude', () => {
      const r = run('mav', '-p', 'hi', '--model', 'haiku');
      expect(r.status).toBe(0);
      expect(argv()).toEqual([
        '--agent',
        'mav',
        '-p',
        'hi',
        '--model',
        'haiku',
      ]);
    });

    it('starts the persona named as its first argument when invoked by its own name', () => {
      const r = run(CLAUDE_LAUNCHER_FILE, 'mav', '-p', 'hi');
      expect(r.status).toBe(0);
      expect(argv()).toEqual(['--agent', 'mav', '-p', 'hi']);
    });

    it('refuses a name that is no persona with one stderr line naming it, exit 2', () => {
      const r = run('nosuch', '-p', 'hi');
      expect(r.status).toBe(2);
      expect(r.stderr.trimEnd().split('\n')).toHaveLength(1);
      expect(r.stderr).toContain('nosuch');
      expect(existsSync(join(home, 'bin', 'argv'))).toBe(false);
    });

    it('refuses a persona named with a path, and a bare invocation, exit 2', () => {
      const traversal = run(CLAUDE_LAUNCHER_FILE, '../agents/mav');
      expect(traversal.status).toBe(2);
      expect(traversal.stderr).toContain('../agents/mav');
      const bare = run(CLAUDE_LAUNCHER_FILE);
      expect(bare.status).toBe(2);
      expect(bare.stderr).toContain('usage');
      expect(existsSync(join(home, 'bin', 'argv'))).toBe(false);
    });
  });
});

describe('the claude persona badge', () => {
  const NICO = {
    name: 'nico',
    provenance: { mark: { emoji: '📐', hue: 'blue' } },
  } as never;
  const MAV = {
    name: 'mav',
    provenance: { mark: { emoji: '✈️', hue: 'green' } },
  } as never;
  const NAMELESS = { name: 'plain', provenance: null } as never;

  const surface = claudeLaunchSurface([NICO, MAV, NAMELESS]);
  const badgeOf = (scope: string) =>
    surface.find(
      (f) => f.filename === CLAUDE_PERSONA_BADGE_FILE && f.scope === scope,
    )?.content;

  it('emits one badge per persona in that persona’s own scope, and one executable worker in the session', () => {
    expect(
      surface
        .filter((f) => f.filename === CLAUDE_PERSONA_BADGE_FILE)
        .map((f) => f.scope),
    ).toEqual(['mav', 'nico', 'plain']);
    const workers = surface.filter(
      (f) => f.filename === CLAUDE_STATUS_LINE_FILE,
    );
    expect(workers.map((f) => [f.scope, f.executable])).toEqual([
      [SESSION_SCOPE, true],
    ]);
    expect(
      claudeHarnessAdapter.scopedRel?.(CLAUDE_PERSONA_BADGE_FILE, 'nico'),
    ).toBe(`personas/nico/${CLAUDE_PERSONA_BADGE_FILE}`);
    expect(claudeHarnessAdapter.statusLine).toEqual({
      file: CLAUDE_STATUS_LINE_FILE,
      command: `sh "$HOME/.claude/personas/${SESSION_SCOPE}/${CLAUDE_STATUS_LINE_FILE}"`,
    });
  });

  it('bakes the mark emoji and name, the name alone with no provenance, and never a hue or an escape', () => {
    expect(badgeOf('nico')).toBe('📐 nico');
    expect(badgeOf('mav')).toBe('✈️ mav');
    expect(badgeOf('plain')).toBe('plain');
    for (const f of surface.filter(
      (s) => s.filename === CLAUDE_PERSONA_BADGE_FILE,
    )) {
      expect(f.content).not.toMatch(
        /\b(blue|red|white|magenta|green|cyan|yellow)\b/i,
      );
      expect(f.content).not.toContain('\u001b');
    }
  });

  it('stages them through a projection, worker and badges alike, from the composed agents only', async () => {
    const tree = await projectPluginSet({
      plugins: [
        {
          name: 'fixture-stance',
          manifest: FIXTURE_MANIFEST,
          hooks: join(here, 'fixtures-stance', 'hooks'),
          agents: join(here, 'fixtures-stance', 'agents'),
        },
      ],
      adapter: claudeHarnessAdapter,
    });
    const staged = tree.files
      .filter((f) => f.path.startsWith(`${ENFORCING_STAGE_DIR}/`))
      .map((f) => f.path)
      .filter(
        (p) =>
          p.endsWith(`/${CLAUDE_PERSONA_BADGE_FILE}`) ||
          p.endsWith(`/${CLAUDE_STATUS_LINE_FILE}`),
      )
      .sort();
    expect(staged).toEqual(
      [
        join(ENFORCING_STAGE_DIR, SESSION_SCOPE, CLAUDE_STATUS_LINE_FILE),
        join(ENFORCING_STAGE_DIR, 'bound', CLAUDE_PERSONA_BADGE_FILE),
        join(ENFORCING_STAGE_DIR, 'unbound', CLAUDE_PERSONA_BADGE_FILE),
      ].sort(),
    );
  });

  const hasJq = spawnSync('jq', ['--version']).status === 0;

  // Runs the shipped bytes. The worker is shell, and what matters is what it prints
  // for the input the harness hands it, so it is placed where deploy would put it and
  // run as install's own command runs it — `sh <worker>` with the input on stdin.
  describe.skipIf(!hasJq)('run as the status line command', () => {
    let claudeDir: string;
    let worker: string;
    beforeEach(() => {
      claudeDir = mkdtempSync(join(tmpdir(), 'claude-badge-'));
      for (const f of surface) {
        const dest = join(
          claudeDir,
          claudeHarnessAdapter.scopedRel?.(f.filename, f.scope) as string,
        );
        mkdirSync(dirname(dest), { recursive: true });
        writeFileSync(dest, f.content, { mode: 0o755 });
      }
      worker = join(
        claudeDir,
        claudeHarnessAdapter.scopedRel?.(CLAUDE_STATUS_LINE_FILE) as string,
      );
    });
    afterEach(() => rmSync(claudeDir, { recursive: true, force: true }));

    const run = (
      input: string,
      host?: string,
      env: NodeJS.ProcessEnv = process.env,
    ) =>
      spawnSync('sh', host === undefined ? [worker] : [worker, host], {
        input,
        encoding: 'utf8',
        env,
      });
    const agent = (name: string) => JSON.stringify({ agent: { name } });

    it('prints exactly the running persona’s badge file, and nothing for a bare session or a stranger', () => {
      expect(run(agent('nico')).stdout).toBe('📐 nico');
      expect(run(agent('mav')).stdout).toBe('✈️ mav');
      expect(run('{}').stdout).toBe('');
      expect(run(agent('Explore')).stdout).toBe('');
      expect(run(agent('nico')).status).toBe(0);
    });

    it('lets no name that is a path reach the filesystem', () => {
      expect(run(agent('a/../nico')).stdout).toBe('');
      expect(run(agent('..')).stdout).toBe('');
      expect(run(agent('')).stdout).toBe('');
    });

    it('puts the badge and one space before the first line of the host’s output, the rest untouched', () => {
      const r = run(agent('mav'), "printf 'HOST\\nsecond\\n'");
      expect(r.stdout).toBe('✈️ mav HOST\nsecond\n');
    });

    it('passes the host’s output through byte for byte where no badge applies', () => {
      const host = "printf 'HOST\\n\\n  x '";
      expect(run('{}', host).stdout).toBe('HOST\n\n  x ');
      expect(run(agent('Explore'), host).stdout).toBe('HOST\n\n  x ');
    });

    it('shows the badge alone when the host prints nothing, and hands the host the same input', () => {
      expect(run(agent('nico'), 'true').stdout).toBe('📐 nico');
      const input = `${agent('nico')}\n`;
      expect(run(input, 'cat').stdout).toBe(`📐 nico ${input}`);
    });

    it('carries the host’s exit status', () => {
      expect(run(agent('nico'), 'exit 3').status).toBe(3);
    });

    it('fails open without jq: the host’s output and no badge, or nothing', () => {
      const bin = join(claudeDir, 'bin');
      mkdirSync(bin);
      for (const tool of ['sh', 'cat', 'mktemp', 'rm', 'dirname', 'printf']) {
        const found = spawnSync('sh', ['-c', `command -v ${tool}`], {
          encoding: 'utf8',
        }).stdout.trim();
        if (found.startsWith('/')) symlinkSync(found, join(bin, tool));
      }
      const env = { ...process.env, PATH: bin };
      const r = run(agent('nico'), "printf 'HOST'", env);
      expect(r.status).toBe(0);
      expect(r.stdout).toBe('HOST');
      expect(run(agent('nico'), undefined, env).stdout).toBe('');
    });
  });
});

// A `--agent` MAIN session preloads none of an agent's `skills` (Claude does that for a
// dispatched subagent only), so the definition carries a `SessionStart` hook that prints
// them. What matters is what those commands emit on a host: each skill's body, in the
// agent's order, its front matter never reaching the model — and a skill that is not
// there degrading to a named requirement, not to a session that will not start. Claude
// caps each hook's output on its own at 10,000 characters, so each skill is its own hook.
describe('the claude persona launch — skills into a --agent main session', () => {
  const agentDef = (skills?: readonly string[]) =>
    agentToClaudeMd(
      {
        name: 'mav',
        description: 'd',
        archetype: 'a',
        guardrails: ['honesty ≜ assert from evidence'],
        ...(skills ? { skills } : {}),
      } as never,
      { manifest: FIXTURE_MANIFEST },
    );
  const commandsOf = (md: string) =>
    md
      .split('\n')
      .filter((l) => /^ +command: /.test(l))
      .map((l) => JSON.parse(l.replace(/^ +command: /, '')) as string);

  it('carries one SessionStart entry, on the sources that start a context without the skills', () => {
    const md = agentDef(['design', 'note']);
    expect(md.match(/^hooks:$/gm)).toHaveLength(1);
    expect(md.match(/^ {2}SessionStart:$/gm)).toHaveLength(1);
    expect(md.match(/^ {4}- /gm)).toHaveLength(1);
    expect(md).toContain('    - matcher: "startup|clear|compact"\n');
    expect(md).toContain('\nskills:\n  - "design"\n  - "note"\n');
  });

  it('gives each skill its own hook, since Claude caps a hook’s output and not the event’s', () => {
    expect(commandsOf(agentDef(['design', 'deliver', 'plan']))).toHaveLength(3);
  });

  it('keeps the front matter closing where it should: no command holds a `---` to cut it early', () => {
    const md = agentDef(['design']);
    for (const c of commandsOf(md)) expect(c).not.toContain('---');
    expect(md.split('---')[1]).toContain('SessionStart:');
  });

  it('gives an agent with no skills no SessionStart entry and no hooks block', () => {
    expect(agentDef()).not.toContain('SessionStart');
    expect(agentDef([])).not.toContain('hooks:');
  });

  describe('run against a skills root', () => {
    let home: string;
    beforeEach(() => {
      home = mkdtempSync(join(tmpdir(), 'claude-persona-skills-'));
    });
    afterEach(() => rmSync(home, { recursive: true, force: true }));

    const install = (name: string, text: string) => {
      const dir = join(home, '.claude', claudeSkillRel(name));
      mkdirSync(dir, { recursive: true });
      writeFileSync(join(dir, 'SKILL.md'), text);
    };
    // The handlers of one entry, in the order Claude lists them.
    const runAll = (skills: readonly string[]) => {
      const runs = commandsOf(agentDef(skills)).map((command) =>
        spawnSync('sh', ['-c', command], {
          encoding: 'utf8',
          env: { ...process.env, HOME: home },
        }),
      );
      return {
        statuses: runs.map((r) => r.status),
        stdout: runs.map((r) => r.stdout).join(''),
        stderr: runs.map((r) => r.stderr).join(''),
      };
    };
    const skillDir = (name: string) =>
      join(home, '.claude', claudeSkillRel(name));

    it('prints each skill in the agent’s order: its base directory, then its body without front matter', () => {
      install(
        'note',
        '---\nname: note\ndescription: n\n---\n\n# Note\n\nlast\n',
      );
      install('design', '---\nname: design\n---\n# Design\n\nfirst\n');
      const r = runAll(['design', 'note']);
      expect(r.statuses).toEqual([0, 0]);
      expect(r.stderr).toBe('');
      expect(r.stdout).toBe(
        `Base directory for this skill: ${skillDir('design')}\n\n# Design\n\nfirst\n` +
          `Base directory for this skill: ${skillDir('note')}\n\n# Note\n\nlast\n`,
      );
      expect(runAll(['note', 'design']).stdout).toMatch(
        /^Base directory for this skill: [^\n]+\/note\n/,
      );
    });

    it('keeps a body that holds its own `---` rule, and a skill with no front matter whole', () => {
      install('rule', '---\nname: rule\n---\nabove\n---\nbelow\n');
      install('bare', '# Bare\n');
      const r = runAll(['rule', 'bare']);
      expect(r.stdout).toContain('\n\nabove\n---\nbelow\n');
      expect(r.stdout).toContain(
        `Base directory for this skill: ${skillDir('bare')}\n\n# Bare\n`,
      );
    });

    it('names an absent skill under Required reading, says so once on stderr, and still exits 0', () => {
      install('plan', '---\nname: plan\n---\n# Plan\n');
      const r = runAll(['plan', 'note', 'design']);
      expect(r.statuses).toEqual([0, 0, 0]);
      expect(r.stdout).toContain('# Plan\n');
      expect(r.stdout).toMatch(/\n## Required reading\n[\s\S]*\n- `note`\n/);
      expect(r.stdout).toMatch(/\n## Required reading\n[\s\S]*\n- `design`\n$/);
      expect(r.stderr.trimEnd().split('\n')).toEqual([
        `mav: no skill note at ${skillDir('note')}; naming it as required reading instead`,
        `mav: no skill design at ${skillDir('design')}; naming it as required reading instead`,
      ]);
    });

    it('prints no Required reading when every skill is there', () => {
      install('plan', '---\nname: plan\n---\n# Plan\n');
      expect(runAll(['plan']).stdout).not.toContain('Required reading');
    });

    // The cap is weighed at projection, without a shell, so the size it weighs must be
    // the size the shell prints — for every shape a SKILL.md takes.
    it.each([
      [
        'a front matter and a blank line before the body',
        '---\nn: x\n---\n\n\n# T\n\nbody\n',
      ],
      ['no trailing newline', '---\nn: x\n---\nbody'],
      ['no front matter', '\n  \n# T\n'],
      ['a rule inside the body', '---\nn: x\n---\na\n---\nb\n'],
      ['an unclosed front matter', '---\nn: x\nbody\n'],
      [
        'multibyte text',
        '---\nn: x\n---\n⟨names natural ¬conventional⟩ · σ*\n',
      ],
    ])('weighs what the shell prints: %s', (_, md) => {
      install('probe', md);
      const printed = runAll(['probe']).stdout;
      expect(personaSkillOutputSize(skillDir('probe'), md)).toBe(
        printed.length,
      );
      const hook = claudeHarnessAdapter.mainSessionSkillHook;
      const expr = `$HOME/.claude/${claudeSkillRel('probe')}`;
      expect(hook?.size('probe', md)).toBe(
        printed.length - skillDir('probe').length + expr.length,
      );
    });
  });
});
