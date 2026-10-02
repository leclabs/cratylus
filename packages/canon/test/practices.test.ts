// THE PRACTICES CANON DECLARES — and that each is a render forge accepts.
//
// A practice is a way of working an install offers as one choice. Canon declares four
// (`src/practices.ts`), and this file holds the declaration against the corpus it is
// made over: the set is exactly the four, every agent, skill and harness hook cell
// lands in one of them or in the plumbing, each practice renders alone on both
// shipped harnesses without being refused, and the dispatch relation the closure is
// checked against is stated by the role cell and not left to prose.
//
// The live legs are GATES over the corpus and so owe a fixture that can fail: the
// placement predicate is fed a cell no practice lists, and the closure check is fed a
// practice that places a dispatcher without the roles it dispatches.

import { readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { adapterByName } from '@cratylus/forge/adapters/registry';
import { type ProjectedTree, projectPluginSet } from '@cratylus/forge/project';
import { anchorOf } from '@cratylus/schema';
import { describe, expect, it } from 'vitest';
import { architect } from '../src/agents/architect.js';
import { assayer } from '../src/agents/assayer.js';
import { implementer } from '../src/agents/implementer.js';
import { integrator } from '../src/agents/integrator.js';
import { kino } from '../src/agents/kino.js';
import { mav } from '../src/agents/mav.js';
import { nico } from '../src/agents/nico.js';
import { planner } from '../src/agents/planner.js';
import canon from '../src/index.js';
import type { HookCell } from '../src/manifest.js';
import { architectRole } from '../src/roles/architect.js';
import { firstExport } from './support/cell-module.js';

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');
const HARNESSES = ['claude', 'omp'] as const;

/** The cells a render places, by kind. */
interface Placement {
  readonly agents: readonly string[];
  readonly skills: readonly string[];
  readonly hooks: readonly string[];
}

function placementOf(tree: ProjectedTree): Placement {
  const names = (prefix: string, take: (rest: string) => string) => [
    ...new Set(
      tree.files
        .filter((f) => f.path.startsWith(prefix))
        .map((f) => take(f.path.slice(prefix.length))),
    ),
  ];
  const hooks = [
    ...names('hooks/', (rest) => rest.split('/')[0] as string),
    // A worker every harness shares leaves the harness tree, but the cell it
    // belongs to is placed all the same.
    ...names('shared/', (rest) => rest.split('/')[0] as string),
  ];
  return {
    agents: names('agents/', (rest) => rest.replace(/\.[^.]+$/, '')).sort(),
    skills: names('skills/', (rest) => rest.split('/')[0] as string).sort(),
    hooks: [...new Set(hooks)].sort(),
  };
}

async function render(
  harness: string,
  practices?: readonly string[],
  plugin = canon,
): Promise<Placement> {
  return placementOf(
    await projectPluginSet({
      plugins: [plugin],
      adapter: adapterByName(harness),
      ...(practices ? { practices } : {}),
      warn: () => {},
    }),
  );
}

/** Every cell of `universe` that none of `homes` places — the predicate the placement gate runs. */
function homeless(universe: Placement, homes: readonly Placement[]): Placement {
  const unhomed = (kind: keyof Placement) =>
    universe[kind].filter((cell) => !homes.some((h) => h[kind].includes(cell)));
  return {
    agents: unhomed('agents'),
    skills: unhomed('skills'),
    hooks: unhomed('hooks'),
  };
}

const practices = canon.practices ?? [];
const names = (dir: string, keep: (entry: string) => boolean) =>
  readdirSync(join(srcRoot, dir))
    .filter(keep)
    .map((entry) => entry.replace(/\.ts$/, ''))
    .sort();

/** The corpus's own cells, read from its source dirs rather than from a render. */
async function corpus(): Promise<Placement> {
  const hookIds: string[] = [];
  for (const file of names('hooks', (e) => e.endsWith('.ts'))) {
    const cell = await firstExport<HookCell>(
      join(srcRoot, 'hooks', `${file}.ts`),
    );
    if (cell.substrate === 'harness') hookIds.push(cell.id);
  }
  return {
    agents: names('agents', (e) => e.endsWith('.ts')),
    skills: names('skills', (e) => !e.includes('.')),
    hooks: hookIds.sort(),
  };
}

/** The plugin with one practice that places no agent and no skill: it renders the plumbing alone. */
const plumbingOnly = {
  ...canon,
  practices: [{ name: 'plumbing-only', description: 'none', agents: [] }],
};

describe('canon practices — what is declared', () => {
  it('declares exactly cdd, corpus-authoring, film-production and carry-on, cdd the only one preselected', () => {
    expect(practices.map((p) => p.name).sort()).toEqual([
      'carry-on',
      'cdd',
      'corpus-authoring',
      'film-production',
    ]);
    expect(practices.filter((p) => p.preselected).map((p) => p.name)).toEqual([
      'cdd',
    ]);
  });

  it('gives each practice a one-line description written for a consumer', () => {
    for (const p of practices) {
      expect(p.description.trim(), p.name).not.toBe('');
      expect(p.description, p.name).not.toContain('\n');
    }
  });

  it('states the roles the architect role dispatches, on the data an agent carries', () => {
    const writers = ['planner', 'implementer', 'assayer', 'integrator'];
    expect(architectRole.dispatches.map((r) => anchorOf(r))).toEqual(writers);
    // Every holder of the role dispatches them, and a holder of any other role none.
    for (const a of [architect, mav, kino, nico]) {
      expect(a.holds, a.name).toBe('architect');
      expect(a.dispatches, a.name).toEqual(writers);
    }
    for (const a of [planner, implementer, assayer, integrator]) {
      expect(a.dispatches, a.name).toBeUndefined();
    }
  });
});

describe('canon practices — every cell has a home', () => {
  it('places every agent, skill and harness hook cell in a practice or in the plumbing', async () => {
    const universe = await corpus();
    // Non-vacuous: the universe is the corpus read from source, and it is not empty.
    expect(universe.agents.length).toBeGreaterThan(0);
    expect(universe.skills.length).toBeGreaterThan(0);
    expect(universe.hooks.length).toBeGreaterThan(0);
    const homes = [
      await render('claude', ['plumbing-only'], plumbingOnly),
      ...(await Promise.all(practices.map((p) => render('claude', [p.name])))),
    ];
    expect(homeless(universe, homes)).toEqual({
      agents: [],
      skills: [],
      hooks: [],
    });
  }, 120_000);

  it('FLAGS a cell no practice places — the predicate is not dark', () => {
    const universe: Placement = {
      agents: ['a', 'b'],
      skills: ['s'],
      hooks: ['h'],
    };
    const home: Placement = { agents: ['a'], skills: ['s'], hooks: [] };
    expect(homeless(universe, [home])).toEqual({
      agents: ['b'],
      skills: [],
      hooks: ['h'],
    });
  });

  it('keeps event-tap and deploy-drift-notice in the plumbing and in no practice', async () => {
    const plumbing = await render('claude', ['plumbing-only'], plumbingOnly);
    expect(plumbing.skills).toContain('event-tap');
    expect(plumbing.hooks).toEqual(['deploy-drift-notice']);
    for (const p of practices) {
      expect(p.skills ?? [], p.name).not.toContain('event-tap');
      expect(p.agents, p.name).not.toContain('event-tap');
    }
    // A hook that binds nothing can be placed by no agent's composition, so only the
    // plumbing can place it.
    const drift = await firstExport<HookCell>(
      join(srcRoot, 'hooks', 'deploy-drift-notice.ts'),
    );
    expect(drift.binds).toBeUndefined();
  });

  it('declares isolation worktree on the implementer and on no other agent', () => {
    expect(implementer.isolation).toBe('worktree');
    for (const a of [
      architect,
      mav,
      kino,
      nico,
      planner,
      assayer,
      integrator,
    ]) {
      expect(a.isolation, a.name).toBeUndefined();
    }
  });
});

describe('canon practices — what a render places', () => {
  it.each(
    HARNESSES.flatMap((harness) =>
      practices.map((p) => [harness, p.name] as const),
    ),
  )(
    'renders on %s the practice %s alone without being refused',
    async (harness, name) => {
      const placed = await render(harness, [name]);
      // The plumbing rides every render.
      expect(placed.skills).toContain('event-tap');
      expect(placed.hooks).toContain('deploy-drift-notice');
    },
    120_000,
  );

  it('places exactly mav, architect, planner, implementer, assayer and integrator for cdd alone', async () => {
    for (const harness of HARNESSES) {
      expect((await render(harness, ['cdd'])).agents).toEqual([
        'architect',
        'assayer',
        'implementer',
        'integrator',
        'mav',
        'planner',
      ]);
    }
  }, 120_000);

  it('places no agent for carry-on alone, and the skill with the plumbing', async () => {
    for (const harness of HARNESSES) {
      const placed = await render(harness, ['carry-on']);
      expect(placed.agents).toEqual([]);
      expect(placed.skills).toEqual(['carry-on', 'event-tap']);
    }
  }, 120_000);

  it('REFUSES a practice placing an architect without the roles it dispatches', async () => {
    const headless = {
      ...canon,
      practices: [{ name: 'headless', description: 'x', agents: ['mav'] }],
    };
    await expect(render('claude', ['headless'], headless)).rejects.toThrow(
      /practice 'headless'.*agent 'mav'.*role 'planner'/,
    );
  });
});
