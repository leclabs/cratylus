// STRUCTURAL-PARSIMONY gate — the missing `accept()` leg that stops the accretion
// this plan pays down (`base.ts`, `ResolvedAgent`, provenance mega-fragments) from
// re-accreting. `test/reader-density.test.ts` enforces PARSIMONIOUS per-cell
// (residue ⊉ fired(α)); this enforces it OVER STRUCTURE — the import-graph + the
// module set — where a file/type/field that restates an archetype hides ABOVE any
// single cell. Predicate + witnesses: `tooling/structural-parsimony.ts`.
//
// E1 already DELETED the motivating cruft, so the live tree has nothing to bite —
// this is a REGRESSION-PREVENTION leg. Proof it is NON-VACUOUS is two-sided:
//   POSITIVE control — held-out synthetic fixtures carrying the VERBATIM deleted
//     source (real base.ts · real nicoResolved · real mavArchetypeGreen) RED, each
//     on exactly its class (MECE).
//   NEGATIVE control — the live tree GREENs on all three classes, AND a legit
//     reusable dimension value (≥2 agents) + a legit single-ref mark-less open value
//     (role/architect, referenced once) stay GREEN (the false-positive guards).
//
// GOVERNING INVARIANT held structurally: the corpus admits no artifact existing
// SOLELY to restate what an archetype already holds — σ*-parsimony above the cell.

import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { basename, dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
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
} from '../tooling/structural-parsimony.js';

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

// ═══ POSITIVE CONTROL — the deleted cruft, held out as fixtures ══════════════════
// Each string is the source E1 removed (git 42e2e35), parsed by the SAME parser the
// live loader uses — so a RED here is proof the gate would have bitten the real
// accretion.
//
// NOT byte-verbatim, and it cannot be. These strings must stay PARSEABLE by today's
// parser, so their SCAFFOLDING tracks the live schema: the originals said `organ:`
// and imported from `@leclabs/agent-forge/anatomy`, both since renamed. What is held
// verbatim is the PAYLOAD — the definiens prose, the shape of the accretion, the
// names that carried it. That payload is a historical citation and is deliberately
// NOT swept: `regenerable SOUL` below is the deleted text and must stay that way, or
// this stops being evidence and becomes a restatement of the present.
//
// This header used to claim VERBATIM outright. It was false when written down to the
// import line, and a corpus-wide rename had already drifted the scaffolding without
// touching the claim — so the fixture quietly modernized itself while asserting it
// had not. Say what is actually preserved; a positive control is only as good as the
// accuracy of what it says it holds.

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
import { architect as architect_role } from '../dimensions/role/architect.js';
import { base } from './base.js';
export const nico: Agent = { ...base, name: 'nico', role: architect_role };
`;

/** (b) the real \`nicoResolved: ResolvedAgent\` — a parallel rep of the Agent vector. */
const AGENT_WITH_RESOLVED = `import type { ResolvedAgent } from '@cratylus/forge/adapters/claude';
import type { Agent } from '../src/manifest.js';
import { architect as architect_role } from '../dimensions/role/architect.js';
export const nico: Agent = { name: 'nico', role: architect_role };
export const nicoResolved: ResolvedAgent = {
  name: 'nico',
  description: nico.archetype,
  dimensions: [['Role', [architect_role]]],
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
 * (role/architect). Single-ref ALONE must not convict (¬mark ⇒ green). */
const SINGLE_REF_DIMENSION_VALUE: StructuralCorpus = {
  agents: [
    parseAgentModule(
      'mav',
      "import { architect as architect_role } from '../dimensions/role/architect.js';\nexport const mav = 1;",
    ),
  ],
  fragments: [
    parseFragment(
      'role',
      'architect',
      'export const architect: Role = `architect ≜ own the design.`;',
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
    // cardinality sanity — the loader SEES the whole corpus. A floor, never an
    // exact count: pinning the roster size makes every new agent a test failure.
    expect(corpus.agents.length).toBeGreaterThan(0);
    expect(corpus.fragments.length).toBeGreaterThan(100);
    const verdicts = structuralParsimony(corpus);
    const failures = verdicts
      .filter((v) => !v.pass)
      .map((v) => `${v.cls}: {${v.convicted.join(',')}}`);
    expect(failures, failures.join('\n')).toEqual([]);
  });

  // This control proves single-ref ≠ cruft on the LIVE tree, so it needs a value
  // the corpus genuinely references exactly once. It was keyed to `role/architect`,
  // re-grounded on `objective/delivery` when the roster shrank to {mav, nico},
  // then broke again when a third agent also picked `delivery`. A hand-picked
  // witness re-breaks on every roster change, so the witness is DERIVED: whatever
  // the live corpus currently references exactly once, all of them.
  it('every live single-ref dimension value is not convicted', async () => {
    const corpus = await loadLiveCorpus();
    const refCount = new Map<string, number>();
    for (const a of corpus.agents)
      for (const imp of a.dimensionImports)
        refCount.set(imp, (refCount.get(imp) ?? 0) + 1);
    const singleRef = [...refCount]
      .filter(([, n]) => n === 1)
      .map(([value]) => value);
    expect(singleRef.length).toBeGreaterThan(0); // the premise must hold
    const { convicted } = absorbedIdentity(corpus);
    for (const value of singleRef)
      expect(convicted, value).not.toContain(value);
  });
});
