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

import { join, posix } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  claudeAgentRel,
  claudeHarnessAdapter,
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

  it('stages a stance manifest for the bound persona alone, beside the settings it complements', async () => {
    const { tree } = await project(claudeHarnessAdapter);
    const staged = tree.files.filter((f) =>
      f.path.startsWith(`${ENFORCING_STAGE_DIR}/`),
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
    expect(paths.some((p) => p.startsWith(`${ENFORCING_STAGE_DIR}/`))).toBe(
      false,
    );
    const settings = JSON.parse(
      tree.files.find((f) => f.path === 'settings.json')?.content ?? '{}',
    );
    expect(Object.keys(settings.hooks)).toEqual(['SessionStart']);
  });
});
