// AN AGENT IS GIVEN ITS SKILLS' WHOLE COMPOSITION — pinned through the projector,
// because the closure is computed in `projectPluginSet` and nowhere else, and an
// adapter handed the declared list would render it just as faithfully.
//
// The fixture roster (`fixtures-closure/base`): `a` composes `b` and `d`, `b`
// composes `c` and `d`, `c` composes `a` back, `d`, `e` and `f` compose nothing.
// `chain` declares `a`, `e` and `ghost` (no cell), `bare` declares nothing. The
// `override` plugin ships a `d` that composes `f`.

import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import { adapterByName } from '../../src/adapters/registry/index.js';
import type { HarnessAdapter } from '../../src/core/harness-adapter.js';
import {
  type ProjectablePlugin,
  projectPluginSet,
} from '../../src/project/index.js';
import { FIXTURE_MANIFEST } from '../fixture-manifest.js';
import { SHORTFALL, shortfallAdapter } from './shortfall-adapter.js';

const here = fileURLToPath(new URL('.', import.meta.url));
const fixtures = join(here, 'fixtures-closure');

const base: ProjectablePlugin = {
  name: 'fixture-closure-base',
  manifest: FIXTURE_MANIFEST,
  agents: join(fixtures, 'base', 'agents'),
  skills: join(fixtures, 'base', 'skills'),
};
const override: ProjectablePlugin = {
  name: 'fixture-closure-override',
  skills: join(fixtures, 'override', 'skills'),
};

// Declared first (`a`, `e`, `ghost`), then breadth-first in each cell's
// declaration order: `a` adds `b` and `d`, `b` adds `c` (its `d` is already
// there), and `c`'s `a` closes the cycle adding nothing. `ghost` is kept and
// never expanded. A depth-first walk would put `c` before `d`.
const CLOSURE = ['a', 'e', 'ghost', 'b', 'd', 'c'];

async function project(
  harness: string | HarnessAdapter,
  plugins: readonly ProjectablePlugin[] = [base],
) {
  const warnings: string[] = [];
  const tree = await projectPluginSet({
    plugins,
    adapter: typeof harness === 'string' ? adapterByName(harness) : harness,
    warn: (line) => warnings.push(line),
  });
  const agent = (name: string) => {
    const file = tree.files.find((f) => f.path.startsWith(`agents/${name}.`));
    if (!file) throw new Error(`no agent file for ${name}`);
    return file.content;
  };
  return { warnings, agent };
}

/** The front-matter fence of a markdown agent definition. */
function fence(md: string): string {
  return /^---\n([\s\S]*?)\n---\n/.exec(md)?.[1] as string;
}

describe('omp — `autoloadSkills` carries the closure', () => {
  it('emits every composed skill once, declared first, breadth-first', async () => {
    const { agent } = await project('omp');
    expect(fence(agent('chain')).split('\n')).toContain(
      `autoloadSkills: [${CLOSURE.map((s) => `"${s}"`).join(', ')}]`,
    );
    expect(fence(agent('bare'))).not.toContain('autoloadSkills');
  });

  it("a later plugin's same-name cell changes the closure", async () => {
    const { agent } = await project('omp', [base, override]);
    expect(fence(agent('chain')).split('\n')).toContain(
      `autoloadSkills: [${[...CLOSURE, 'f'].map((s) => `"${s}"`).join(', ')}]`,
    );
  });

  it('warns about nothing — omp preloads skills natively', async () => {
    expect((await project('omp')).warnings).toEqual([]);
  });
});

describe('claude — the subagent `skills` field carries the closure', () => {
  it('emits it as a YAML sequence, in closure order', async () => {
    const { agent } = await project('claude');
    const lines = fence(agent('chain')).split('\n');
    const at = lines.indexOf('skills:');
    expect(at).toBeGreaterThan(-1);
    expect(lines.slice(at + 1, at + 1 + CLOSURE.length)).toEqual(
      CLOSURE.map((s) => `  - "${s}"`),
    );
    expect(lines[at + 1 + CLOSURE.length]?.startsWith('  - ')).not.toBe(true);
    expect(fence(agent('bare'))).not.toMatch(/^skills:/m);
  });

  it('warns about nothing — claude preloads skills natively', async () => {
    expect((await project('claude')).warnings).toEqual([]);
  });
});

describe('a harness with no preload field — the closure degrades to a declaration', () => {
  // No supported harness lacks a preload field, so the test-local shortfall
  // adapter (claude without `preloadsSkills`) is the witness.
  it('ends the definition with a required-reading section, in closure order', async () => {
    const { agent } = await project(shortfallAdapter);
    const text = agent('chain');
    const section = text.slice(text.lastIndexOf('\n## '));
    expect(section.startsWith('\n## Required reading\n')).toBe(true);
    expect([...section.matchAll(/^- `([^`]+)`/gm)].map((m) => m[1])).toEqual(
      CLOSURE,
    );
    expect(agent('bare')).not.toContain('## Required reading');
  });

  it('emits no `skills` field into any agent front-matter', async () => {
    const { agent } = await project(shortfallAdapter);
    for (const name of ['chain', 'bare']) {
      expect(fence(agent(name))).not.toMatch(/^skills:/m);
    }
  });

  it('warns once for the agent given skills, naming it, the adapter and its skills', async () => {
    const { warnings } = await project(shortfallAdapter);
    expect(warnings).toHaveLength(1);
    const [warning] = warnings as [string];
    expect(warning).toContain("'chain'");
    expect(warning).toContain(`'${SHORTFALL}'`);
    expect(warning).toContain(CLOSURE.join(', '));
    expect(warning).not.toContain('bare');
  });
});

describe('a harness that cannot start an agent in a worktree — the declaration degrades to a warning', () => {
  // The `isolating` plugin ships `walled`, which declares worktree isolation; the
  // base agents (`chain`, `bare`) declare none. claude is the harness that starts
  // one in a worktree; omp and the test-local shortfall adapter cannot.
  const isolating: ProjectablePlugin = {
    name: 'fixture-closure-isolating',
    agents: join(fixtures, 'isolating', 'agents'),
  };
  const isolationWarnings = (warnings: readonly string[]) =>
    warnings.filter((w) => w.includes('worktree'));

  it('warns once for the declaring agent, naming it and the adapter, and for no other', async () => {
    const { warnings } = await project(shortfallAdapter, [base, isolating]);
    const worktree = isolationWarnings(warnings);
    expect(worktree).toHaveLength(1);
    const [warning] = worktree as [string];
    expect(warning).toContain("'walled'");
    expect(warning).toContain(`'${SHORTFALL}'`);
    expect(warning).not.toContain("'chain'");
    expect(warning).not.toContain("'bare'");
  });

  it('emits no `isolation` key into the definition it degrades', async () => {
    const { agent } = await project(shortfallAdapter, [base, isolating]);
    expect(fence(agent('walled'))).not.toMatch(/^isolation:/m);
  });

  it('warns on omp, which has no such field, and emits no key', async () => {
    const { warnings, agent } = await project('omp', [base, isolating]);
    expect(isolationWarnings(warnings)).toHaveLength(1);
    expect(isolationWarnings(warnings)[0]).toContain("'walled'");
    expect(fence(agent('walled'))).not.toMatch(/^isolation:/m);
  });

  it('warns about nothing on claude, which carries it natively', async () => {
    const { warnings, agent } = await project('claude', [base, isolating]);
    expect(isolationWarnings(warnings)).toEqual([]);
    expect(fence(agent('walled')).split('\n')).toContain('isolation: worktree');
    expect(fence(agent('bare'))).not.toMatch(/^isolation:/m);
  });
});
