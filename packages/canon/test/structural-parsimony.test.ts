// STRUCTURAL-PARSIMONY gate — the missing `accept()` leg that stops the accretion
// this plan pays down (`base.ts`, `ResolvedAgent`, provenance mega-fragments) from
// re-accreting. `test/reader-density.test.ts` enforces PARSIMONIOUS per-cell
// (residue ⊉ fired(α)); this enforces it OVER STRUCTURE — the import-graph + the
// module set — where a file/type/field that restates an archetype hides ABOVE any
// single cell. Predicate + witnesses: `src/toolkit/cold-oracle/structural-parsimony.ts`.
//
// E1 already DELETED the motivating cruft, so the live tree has nothing to bite —
// this is a REGRESSION-PREVENTION leg. Proof it is NON-VACUOUS is two-sided:
//   POSITIVE control — held-out synthetic fixtures carrying the VERBATIM deleted
//     source (real base.ts · real nicoResolved · real mavArchetypeGreen) RED, each
//     on exactly its class (MECE).
//   NEGATIVE control — the live tree GREENs on all three classes, AND a legit
//     reusable dimension value (≥2 agents) + a legit single-ref mark-less open value
//     (role/build, referenced once) stay GREEN (the false-positive guards).
//
// GOVERNING INVARIANT held structurally: the corpus admits no artifact existing
// SOLELY to restate what an archetype already holds — σ*-parsimony above the cell.

import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  type StructuralClass,
  type StructuralCorpus,
  absorbedIdentity,
  failingClasses,
  genusFloor,
  parseAgentModule,
  parseFragment,
  resolvedDup,
  structuralParsimony,
} from '@cratylus/forge/validate';
import { describe, expect, it } from 'vitest';

const srcRoot = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

async function collect(pattern: string): Promise<string[]> {
  const out: string[] = [];
  for await (const p of glob(pattern, { cwd: srcRoot })) {
    out.push(p);
  }
  return out.sort();
}

/** Read + parse the LIVE source tree into the structural model (source = truth). */
async function loadLiveCorpus(): Promise<StructuralCorpus> {
  const agents = (await collect('agents/*.ts')).map((rel) =>
    parseAgentModule(
      basename(rel, '.ts'),
      readFileSync(join(srcRoot, rel), 'utf8'),
    ),
  );
  const fragments = (await collect('dimensions/**/*.ts')).map((rel) => {
    const parts = rel.split('/'); // dimensions/<dimension>/<slug>.ts
    const dimension = parts[1] as string;
    const slug = basename(parts[2] as string, '.ts');
    return parseFragment(
      dimension,
      slug,
      readFileSync(join(srcRoot, rel), 'utf8'),
    );
  });
  return { agents, fragments };
}

// ═══ POSITIVE CONTROL — the VERBATIM deleted cruft (held-out fixtures) ════════════
// Each string is the actual source E1 removed (git 42e2e35~1), parsed by the SAME
// parser the live loader uses — so a RED here is proof the gate would have bitten
// the real accretion.

/** (a) the real `src/agents/base.ts` — a genus floor spread into every agent. */
const BASE_TS = `// delete this file and set the values in the agent definitions directly i.e. packages/canon/src/agents/*.ts.

export const memoryProtocol = \`\` // duplicative garbage, memory should be set on the dimension in the agent
export const personaProtocol = \`\` // same as above except for archetype.

export const base = {
  memoryProtocol,
  personaProtocol,
} as const;
`;

/** a real agent that spreads the floor (\`...base\`) — supplies the graph edge. */
const AGENT_SPREADING_BASE = `import type { Agent } from '@cratylus/schema';
import { curate as curate_role } from '../dimensions/role/curate.js';
import { base } from './base.js';
export const nico: Agent = { ...base, name: 'nico', role: curate_role };
`;

/** (b) the real \`nicoResolved: ResolvedAgent\` — a parallel rep of the Agent vector. */
const AGENT_WITH_RESOLVED = `import type { ResolvedAgent } from '@cratylus/forge/adapters/claude';
import type { Agent } from '../src/manifest.js';
import { curate as curate_role } from '../dimensions/role/curate.js';
export const nico: Agent = { name: 'nico', role: curate_role };
export const nicoResolved: ResolvedAgent = {
  name: 'nico',
  description: nico.archetype,
  dimensions: [['Role', [curate_role]]],
};
`;

/** (c) the real \`mavArchetypeGreen\` — a Provenance value carrying a \`mark\` token. */
const MAV_ARCHETYPE_GREEN = `import type { Provenance } from '@cratylus/schema';

export const mavArchetypeGreen: Provenance = {
  dimension: 'provenance',
  slug: 'mav-archetype-green',
  definiens: \`the mav archetype(regenerable SOUL) · ✈️·green · principal-tier individual-contributor authority, held intrinsically — the elite-IC delivery lineage mav descends from, bound to the agent-subject, ¬path-scoped grant.\`,
  mark: { emoji: '✈️', hue: 'green' },
};
`;

/** an agent selecting the mega-fragment — the sole reference (refCount = 1). */
const AGENT_SELECTING_MEGA_FRAGMENT = `import type { Agent } from '@cratylus/schema';
import { mavArchetypeGreen as mavArchetypeGreen_provenance } from '../dimensions/provenance/mav-archetype-green.js';
export const mav: Agent = { name: 'mav', provenance: mavArchetypeGreen_provenance };
`;

const GENUS_FLOOR_FIXTURE: StructuralCorpus = {
  agents: [
    parseAgentModule('base', BASE_TS),
    parseAgentModule('nico', AGENT_SPREADING_BASE),
  ],
  fragments: [],
};

const RESOLVED_DUP_FIXTURE: StructuralCorpus = {
  agents: [parseAgentModule('nico', AGENT_WITH_RESOLVED)],
  fragments: [],
};

const ABSORBED_IDENTITY_FIXTURE: StructuralCorpus = {
  agents: [parseAgentModule('mav', AGENT_SELECTING_MEGA_FRAGMENT)],
  fragments: [
    parseFragment('provenance', 'mav-archetype-green', MAV_ARCHETYPE_GREEN),
  ],
};

// ═══ NEGATIVE CONTROL — legit shared / single-ref values stay GREEN ═══════════════

/** a mark-carrying value referenced by ≥2 agents — a GENUINE shared value. The AND
 * guard: mark ALONE must not convict (only mark ∧ refCount≤1 = absorbed identity). */
const SHARED_MARK_VALUE: StructuralCorpus = {
  agents: [
    parseAgentModule(
      'a',
      "import { x } from '../dimensions/provenance/shared-lineage.js';\nexport const a = 1;",
    ),
    parseAgentModule(
      'b',
      "import { x } from '../dimensions/provenance/shared-lineage.js';\nexport const b = 1;",
    ),
  ],
  fragments: [
    parseFragment(
      'provenance',
      'shared-lineage',
      "export const sharedLineage = { dimension: 'provenance', slug: 'shared-lineage', mark: { emoji: '🔱', hue: 'gold' } };",
    ),
  ],
};

/** a mark-LESS value referenced by exactly ONE agent — a legit open-dimension value
 * (role/build, curate). Single-ref ALONE must not convict (¬mark ⇒ green). */
const SINGLE_REF_DIMENSION_VALUE: StructuralCorpus = {
  agents: [
    parseAgentModule(
      'mav',
      "import { build as build_role } from '../dimensions/role/build.js';\nexport const mav = 1;",
    ),
  ],
  fragments: [
    parseFragment(
      'role',
      'build',
      'export const build: Role = `build ≜ own the artifact.`;',
    ),
  ],
};

describe('structural-parsimony gate — ¬∃ artifact restating an archetype', () => {
  // ── POSITIVE: each fixture REDs, on exactly its class (MECE) ──────────────────
  it('(a) GENUS-FLOOR — bites the real deleted base.ts (spread into every agent)', () => {
    const v = genusFloor(GENUS_FLOOR_FIXTURE);
    expect(v.pass).toBe(false);
    expect(v.convicted).toEqual(['base']);
    // MECE — trips ONLY its class.
    expect(failingClasses(structuralParsimony(GENUS_FLOOR_FIXTURE))).toEqual([
      'GENUS-FLOOR',
    ]);
  });

  it('(b) RESOLVED-DUP — bites the real deleted nicoResolved (parallel Agent rep)', () => {
    const v = resolvedDup(RESOLVED_DUP_FIXTURE);
    expect(v.pass).toBe(false);
    expect(v.convicted).toEqual(['nico:nicoResolved']);
    expect(failingClasses(structuralParsimony(RESOLVED_DUP_FIXTURE))).toEqual([
      'RESOLVED-DUP',
    ]);
  });

  it('(c) ABSORBED-IDENTITY — bites the real deleted mavArchetypeGreen (mark ∧ refCount=1)', () => {
    const v = absorbedIdentity(ABSORBED_IDENTITY_FIXTURE);
    expect(v.pass).toBe(false);
    expect(v.convicted).toEqual(['provenance/mav-archetype-green']);
    expect(
      failingClasses(structuralParsimony(ABSORBED_IDENTITY_FIXTURE)),
    ).toEqual(['ABSORBED-IDENTITY']);
  });

  it('all three classes have a convicting fixture (non-vacuous — 3/3)', () => {
    const convicted = new Set<StructuralClass>([
      ...failingClasses(structuralParsimony(GENUS_FLOOR_FIXTURE)),
      ...failingClasses(structuralParsimony(RESOLVED_DUP_FIXTURE)),
      ...failingClasses(structuralParsimony(ABSORBED_IDENTITY_FIXTURE)),
    ]);
    expect([...convicted].sort()).toEqual([
      'ABSORBED-IDENTITY',
      'GENUS-FLOOR',
      'RESOLVED-DUP',
    ]);
  });

  // ── NEGATIVE: the false-positive guards ──────────────────────────────────────
  it('a mark-carrying value referenced by ≥2 agents is GREEN (mark alone ≠ cruft)', () => {
    expect(absorbedIdentity(SHARED_MARK_VALUE).convicted).toEqual([]);
  });

  it('a mark-less value referenced by exactly one agent is GREEN (single-ref ≠ cruft)', () => {
    expect(absorbedIdentity(SINGLE_REF_DIMENSION_VALUE).convicted).toEqual([]);
  });

  // ── LIVE TREE: GREEN on every class (regression-prevention floor) ─────────────
  it('the live tree is GREEN on all three structural classes', async () => {
    const corpus = await loadLiveCorpus();
    // cardinality sanity — the loader SEES the whole corpus.
    expect(corpus.agents.length).toBe(10);
    expect(corpus.fragments.length).toBeGreaterThan(100);
    const verdicts = structuralParsimony(corpus);
    const failures = verdicts
      .filter((v) => !v.pass)
      .map((v) => `${v.cls}: {${v.convicted.join(',')}}`);
    expect(failures, failures.join('\n')).toEqual([]);
  });

  it('a live legit single-ref open value (role/review → 1 agent) is not convicted', async () => {
    const corpus = await loadLiveCorpus();
    const refs = corpus.agents.filter((a) =>
      a.dimensionImports.includes('role/review'),
    );
    expect(refs.length).toBe(1); // referenced by exactly one agent (principal-engineer-reviewer)…
    expect(absorbedIdentity(corpus).convicted).not.toContain('role/review'); // …yet GREEN
  });
});
