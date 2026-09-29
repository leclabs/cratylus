// THE CLAUDE PERSONA SCOPE — where a persona's enrollment lands on Claude Code, and
// what lands.
//
// Claude registers its mechanism ONCE, in `settings.json`, so its scope is not where a
// hook lives. It is what a worker looks for when the hook payload names the running
// agent (`agent_type`): `<claude home>/personas/<agent>/stance/manifest.json`. Presence
// is enrollment, so the two claims worth pinning are WHERE the manifest lands and
// WHICH personas get one — a wrong answer to either leaves a guard that fires from the
// global settings and exits at its scope gate on every call, green throughout.

import { join, posix } from 'node:path';
import { describe, expect, it } from 'vitest';
import {
  claudeAgentRel,
  claudeHarnessAdapter,
} from '../../src/adapters/claude/render.js';
import {
  STANCE_MANIFEST,
  enrollmentManifests,
  personaRootOf,
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

const here = new URL('.', import.meta.url).pathname;

describe('claude scopedRel', () => {
  it('places a persona’s manifest at personas/<agent>/<file> under .claude', () => {
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

describe('enrollment manifests', () => {
  const hook = (id: string, events: string[], timeout?: number) =>
    ({ id, events, command: `sh ${id}.sh`, timeout }) as never;
  const realizing = (...events: string[]) => ({
    realizes: (e: string) => events.includes(e),
  });

  it('emits one manifest per persona, sorted, and none for the session', () => {
    const out = enrollmentManifests(
      [hook('g', ['turn.end'])],
      realizing('turn.end'),
      ['nico', 'mav'],
    );
    expect(out.map((m) => m.scope)).toEqual(['mav', 'nico']);
    expect(out.map((m) => m.scope)).not.toContain(SESSION_SCOPE);
    for (const m of out) {
      expect(m.filename).toBe(STANCE_MANIFEST);
      expect(JSON.parse(m.content).agent).toBe(m.scope);
    }
  });

  it('gates each cell by the moments this adapter realizes, and only those', () => {
    const [m] = enrollmentManifests(
      [
        hook(
          'stance-guardrail',
          ['turn.end', 'subagent.end', 'git.commit.post'],
          60,
        ),
        hook('unrealizable', ['git.commit.post']),
      ],
      realizing('turn.end', 'subagent.end'),
      ['mav'],
    );
    const parsed = JSON.parse(m?.content ?? '{}');
    // An event the harness cannot fire is no moment of the cell, and a cell with no
    // realizable event is no gate: a manifest naming either would read as coverage.
    expect(parsed.gates).toEqual({
      'stance-guardrail': {
        moments: ['subagent.end', 'turn.end'],
        timeout: 60,
      },
    });
  });

  it('enrolls nobody when the adapter realizes nothing the cells name', () => {
    expect(
      enrollmentManifests([hook('g', ['turn.end'])], realizing(), ['mav']),
    ).toEqual([]);
  });
});

describe('the claude projection emits the enrollment', () => {
  const plugin: ProjectablePlugin = {
    name: 'fixture-facts',
    manifest: FIXTURE_MANIFEST,
    hooks: join(here, '..', 'project', 'fixtures-facts', 'hooks'),
    agents: join(here, '..', 'project', 'fixtures-enforcing', 'agents'),
  };

  it('stages a manifest per rendered persona, in the same tree as the settings it complements', async () => {
    const tree = await projectPluginSet({
      plugins: [plugin],
      adapter: claudeHarnessAdapter,
      warn: () => {},
    });
    const manifests = tree.files.filter((f) =>
      f.path.endsWith(STANCE_MANIFEST),
    );
    // ONE persona is rendered by this fixture, and exactly its own scope is staged.
    expect(manifests.map((f) => f.path)).toEqual([
      join(ENFORCING_STAGE_DIR, 'warden', STANCE_MANIFEST),
    ]);
    const parsed = JSON.parse(manifests[0]?.content ?? '{}');
    expect(parsed.agent).toBe('warden');
    expect(parsed.gates['fact-probe'].moments).toEqual(['session.start']);
    // The registration is unchanged: claude keeps `settings.json`, and the scope
    // artifact is the only thing staged besides it.
    expect(tree.files.some((f) => f.path === 'settings.json')).toBe(true);
    expect(
      tree.files.filter((f) => f.path.startsWith(`${ENFORCING_STAGE_DIR}/`)),
    ).toHaveLength(1);
  });
});
