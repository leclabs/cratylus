// READER-DENSITY gate — the enforcement leg of the reader binding ρ
// (`src/skills/signify.ts`, READER BINDING): the RULE is
//
//   conform(a) ⇔ register(a) = ρ(a)
//
// enforced here one-sidedly: ρ(a) = LLM ⇒ register(a) = LLM. `register(a)` is
// decided by a deterministic detector that witnesses register=human via named
// lexical signal classes (`reader-register.ts`, the shared model); absence of
// a witness = register LLM. For
// ρ(a) = human artifacts (README · human docs · commit messages) the gate
// ABSTAINS — exemption falls out of ρ, never a special-cased path; the detector
// is one-sided (it can witness human register, not certify it), so it cannot
// convict a human-facing artifact.
//
// REGISTER ≠ DENSITY. The gate convicts reader=human REGISTER (tutorial
// second-person address, hedge/connective prose, human-gloss walkthrough); it
// does NOT score density-to-the-bar — that is a semantic density-judge concern,
// out of this gate's scope (calibration 2026-07-01 proved raw glue-ratio does not
// separate: live verbose-but-LLM-register cells overlap human prose).
//
// SIGNAL CLASSES (thresholds frozen from the 2026-07-01 corpus sweep; each has
// live-corpus margin — the 4 densified exemplars and the whole non-pinned
// corpus sit at 0 hits, the pinned genus bodies at 5.4–5.5 second-person/100):
//   HEDGE          — ≥2 distinct tutorial/hedge/connective patterns
//                    (live max = 1, on pinned src/genus/memory.md; seed fixture = 6)
//   SECOND-PERSON  — ≥2 hits ∧ ≥4 per 100 words (one incidental agent-address
//                    hit is legal: carry-on description = 1 hit @3.1)
//   FPP-WALKTHROUGH— ≥2 first-person-plural walkthrough tokens (live = 0)
//
// RATCHET — explicit, shrink-only allowlist. Empty when the corpus fully
// conforms; a violation may only be pinned here deliberately, in the open.
// No silent exemptions: a pinned surface that STOPS failing FAILS the suite
// (remove the pin); a new violation is never pinnable silently (the sets are
// literal here). Cross-dimension consistency (root-cause H3): `llm-native` ∧
// `natural-language` in one agent vector = a register contradiction.
//
// NON-VACUOUS: a seeded human-register definiens is convicted with named
// signals; the same text under a ρ=human class is exempt BY THE MODEL; the 4
// densified exemplars pass. All asserted below.

import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import type { Agent, Skill } from '@leclabs/agent-forge/anatomy';
// accept() falsifier — the full Universal gate (`src/toolkit/cold-oracle/accept.ts`),
// the register gate above being one facet of ρ-conformance, not a Universal leg.
import {
  type AcceptCell,
  type Homes,
  type Leg,
  type LegVerdict,
  type Target,
  UNIVERSAL_LEGS,
  admissibleBody,
  admissibleFormalBlock,
  admissibleSingleLine,
  failingLegs,
  regenerable,
  universalCell,
} from '@leclabs/agent-forge/validate';
import { describe, expect, it } from 'vitest';
import { signify } from '../src/skills/signify.js';
import { nonceControl } from '../src/toolkit/cold-oracle/oracle.js';
// The injected corpus POLICY DATA (palimpsest table + operator lexicon) the
// doctrine-agnostic validate ALGORITHM consumes — passed at every gate call site.
import { anatomyPolicy } from '../src/toolkit/cold-oracle/policy.js';
import { RESIDUE_OPERATORS } from '../src/toolkit/operator-lexicon.js';
// ρ + register(a) + conform — ONE shared model (`reader-register.ts`), also
// enforced over the runtime frontiers by `reader-reach.test.ts`; RHO mirrors
// the READER BINDING subset lists (signify).
import {
  type ArtClass,
  conform,
  humanRegisterSignals,
  registerOf,
} from './reader-register.js';

const anatomyRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(anatomyRoot, 'src');

// ── RATCHET — explicit, shrink-only ─────────────────────────────────────────────

/** Known non-conforming R=LLM surfaces — EMPTY (the corpus conforms). */
const REGISTER_RATCHET: ReadonlySet<string> = new Set([]);

/** root-cause H3: (engineering-principle, output-format) pairs that contradict. */
const CONTRADICTION_PAIRS: ReadonlyArray<readonly [string, string]> = [
  ['llm-native', 'natural-language'],
];

/** Agents with a known dimension contradiction, pinned until the anatomy fix-class task. */
const CONTRADICTION_RATCHET: ReadonlySet<string> = new Set([]);

// ── surface enumeration (source grain — the projections follow the source) ──────

interface Surface {
  readonly label: string;
  readonly cls: ArtClass;
  readonly text: string;
}

async function firstExport<T>(modPath: string): Promise<T> {
  const mod = (await import(pathToFileURL(modPath).href)) as Record<
    string,
    unknown
  >;
  const key = Object.keys(mod).find((k) => k !== 'default');
  return mod[key as string] as T;
}

async function collect(pattern: string): Promise<string[]> {
  const out: string[] = [];
  for await (const p of glob(pattern, { cwd: srcRoot })) {
    out.push(p);
  }
  return out.sort();
}

async function allSurfaces(): Promise<Surface[]> {
  const surfaces: Surface[] = [];
  for (const rel of await collect('dimensions/**/*.ts')) {
    const f = await firstExport<string>(join(srcRoot, rel));
    surfaces.push({
      label: `dimension ${relative('dimensions', rel).replace(/\.ts$/, '')}`,
      cls: 'dimension-definiens',
      text: splitBody(f).definiens,
    });
  }
  for (const rel of await collect('skills/*.ts')) {
    const s = await firstExport<Skill>(join(srcRoot, rel));
    // A skill contributes ONE ρ=LLM density surface: its `description` (σ_human*
    // one-liner, harness-read at progressive disclosure). The `formalBlock` is pure
    // σ* formal notation — governed by the RESIDUE gate (`admissibleFormalBlock`,
    // which rejects explanatory prose) + the SYMBOLS gate, NOT the prose-density
    // detector; the retired `body`'s free-prose surface no longer exists.
    surfaces.push({
      label: `skill ${s.name} (description)`,
      cls: 'skill-description',
      text: s.description,
    });
  }
  for (const name of ['persona.md']) {
    const raw = readFileSync(join(srcRoot, 'genus', name), 'utf8');
    const body = raw.replace(/^---\n[\s\S]*?\n---\n/, '');
    // ρ binds at the finest separately-consumed grain: `## Protocol` projects
    // into every SOUL; the sibling sections are corpus/skill-dir surfaces.
    // Each section is its own artifact — none silently skipped.
    for (const section of body.split(/^(?=## )/m)) {
      const head = section.startsWith('## ')
        ? (section.split('\n')[0] as string).split(' — ')[0]
        : '(preamble)';
      surfaces.push({
        label: `genus src/genus/${name} ${head}`,
        cls: 'genus-protocol',
        text: section,
      });
    }
  }
  return surfaces;
}

async function allAgents(): Promise<Array<{ rel: string; agent: Agent }>> {
  const out: Array<{ rel: string; agent: Agent }> = [];
  for (const rel of await collect('agents/*.ts')) {
    if (rel.endsWith('base.ts')) {
      continue;
    }
    const mod = (await import(
      pathToFileURL(join(srcRoot, rel)).href
    )) as Record<string, unknown>;
    const key = Object.keys(mod).find(
      (k) => k !== 'default' && !k.endsWith('Resolved'),
    );
    out.push({ rel, agent: mod[key as string] as Agent });
  }
  return out;
}

/** Recover {slug, definiens} from a dimension value's `"<slug> ≜ <definiens>"` body. */
function splitBody(v: string): { slug: string; definiens: string } {
  const i = v.indexOf(' ≜ ');
  // No ` ≜ ` = a BARE ANCHOR (residue ∅ — the ideal σ*): definiens is EMPTY, not the slug
  // itself (the describe-era default misread ∅ as a self-restatement of α, false-convicting
  // PARSIMONIOUS on every reduced-to-∅ value).
  return i < 0
    ? { slug: v, definiens: '' }
    : { slug: v.slice(0, i), definiens: v.slice(i + 3) };
}

/** Recover just the α(c) slug (the common case). */
function slugOf(v: string): string {
  return splitBody(v).slug;
}

/** The contradiction pairs `agent` carries (root-cause H3). */
function dimensionContradictions(agent: Agent): string[] {
  const principles = (agent.engineeringPrinciples ?? []).map(slugOf);
  const output = agent.outputFormat ? slugOf(agent.outputFormat) : undefined;
  return CONTRADICTION_PAIRS.filter(
    ([p, o]) => principles.includes(p) && output === o,
  ).map(([p, o]) => `${p} ∧ ${o}`);
}

// ── the gate ────────────────────────────────────────────────────────────────────

describe('READER-DENSITY gate — conform(a) ⇔ register(a) = ρ(a)', () => {
  it('the 4 densified exemplars PASS (calibration anchors)', async () => {
    for (const rel of [
      'dimensions/role/curate.ts',
      'dimensions/objective/parsimony.ts',
      'dimensions/transparency/decision-rationale.ts',
      'dimensions/capabilities/research-investigation.ts',
    ]) {
      const f = await firstExport<string>(join(srcRoot, rel));
      expect(
        humanRegisterSignals(splitBody(f).definiens),
        `${rel} is a PASS exemplar`,
      ).toEqual([]);
    }
  });

  it('every ρ=LLM surface conforms, or is an explicit ratchet pin', async () => {
    const surfaces = await allSurfaces();
    // cardinality sanity — the gate SEES the persona genus protocol (memory's genus
    // def was retired in E6c: its mechanism → the `memory` CLI --help, its
    // reasoning-contract → the wake + dream skill formalBlocks).
    const genusLabels = surfaces
      .filter((s) => s.cls === 'genus-protocol')
      .map((s) => s.label);
    expect(genusLabels).toContain('genus src/genus/persona.md ## Protocol');
    expect(
      surfaces.filter((s) => s.cls === 'dimension-definiens').length,
    ).toBeGreaterThan(100);
    const failures = surfaces
      .filter((s) => !conform(s.cls, s.text) && !REGISTER_RATCHET.has(s.label))
      .map(
        (s) =>
          `REGISTER ${s.label}: ρ=LLM but register=human — ${humanRegisterSignals(s.text).join(' · ')}`,
      );
    expect(failures, failures.join('\n')).toEqual([]);
  });

  it('the ratchet is shrink-only: every pin still FAILS (else remove the pin)', async () => {
    const surfaces = await allSurfaces();
    for (const label of REGISTER_RATCHET) {
      const s = surfaces.find((x) => x.label === label);
      expect(s, `ratchet pin ${label} names a scanned surface`).toBeDefined();
      expect(
        registerOf((s as Surface).text),
        `${label} now conforms — REMOVE its ratchet pin`,
      ).toBe('human');
    }
  });

  it('no agent vector carries a register contradiction (root-cause H3), or is pinned', async () => {
    const agents = await allAgents();
    expect(agents.length).toBe(10);
    const failures = agents
      .filter(
        ({ agent }) =>
          dimensionContradictions(agent).length > 0 &&
          !CONTRADICTION_RATCHET.has(agent.name),
      )
      .map(
        ({ agent }) =>
          `CONTRADICTION ${agent.name}: ${dimensionContradictions(agent).join(' · ')}`,
      );
    expect(failures, failures.join('\n')).toEqual([]);
    // shrink-only, same law as the register ratchet
    for (const name of CONTRADICTION_RATCHET) {
      const entry = agents.find(({ agent }) => agent.name === name);
      expect(
        entry,
        `contradiction pin ${name} names a live agent`,
      ).toBeDefined();
      expect(
        dimensionContradictions((entry as { agent: Agent }).agent).length,
        `${name} no longer contradicts — REMOVE its ratchet pin`,
      ).toBeGreaterThan(0);
    }
  });

  // ── NON-VACUOUS: the gate BITES, and the exemption is the model's ─────────────
  const humanSeed =
    'This value means that the agent should always be helpful and make sure ' +
    'that it explains its reasoning clearly, because it is important for you ' +
    'to understand what is going on. In other words, note that clarity matters ' +
    'and you should keep it in mind.';

  it('FAILS a seeded human-register definiens, with named signals', () => {
    const signals = humanRegisterSignals(humanSeed);
    expect(signals.length).toBeGreaterThan(0);
    expect(signals.join(' ')).toContain('HEDGE');
    expect(conform('dimension-definiens', humanSeed)).toBe(false);
  });

  it('EXEMPTS the same human-register text when ρ(a)=human — by the model, not a path', () => {
    expect(registerOf(humanSeed)).toBe('human'); // the detector still sees it…
    expect(conform('readme', humanSeed)).toBe(true); // …ρ exempts it
    expect(conform('human-doc', humanSeed)).toBe(true);
    expect(conform('commit-message', humanSeed)).toBe(true);
  });

  it('convicts each signal class independently (calibration margins hold)', () => {
    // SECOND-PERSON: rate + hits both required — one agent-address hit is legal.
    expect(
      humanRegisterSignals('closing a check-in and returning you to execution'),
    ).toEqual([]);
    expect(
      humanRegisterSignals(
        'you drift; you own it; your stance decays; hold yours',
      ),
    ).toEqual([expect.stringContaining('SECOND-PERSON')]);
    // FPP walkthrough.
    expect(humanRegisterSignals('we walk the tree, then we prune it')).toEqual([
      expect.stringContaining('FPP-WALKTHROUGH'),
    ]);
    // one hedge alone is NOT a conviction (threshold = 2 distinct patterns).
    expect(humanRegisterSignals('for example, a fenced block')).toEqual([]);
  });
});

// ═══ accept() FALSIFIER — the full Universal gate + per-leg seed suite ════════════
//
// Lifts the author-time gate from the register-only leg (above) to
//   accept(a) ⇔ Universal(a) ∧ (agent ⇒ COMPOSED(a))
//   Universal = CANONICAL ∧ SIGNIFIED ∧ COLD-BLIND ∧ PARTITIONED ∧ PARSIMONIOUS ∧ REGENERABLE
// decided by the BLIND priors-only cold-oracle — a LIVE authority (gated below,
// `COLD_ORACLE_LIVE=1`) over an always-on STATIC floor (`src/toolkit/cold-oracle/
// accept.ts`). NON-VACUOUS: one seeded defect per leg, each convicted — and MECE
// (each seed trips ONLY its leg). Green over one live already-conformant cell.

/** A self-sufficient, parsimonious body — clean on every non-target leg. */
const clean = 'toward the minimal residue.';

interface CellSeed {
  readonly leg: Leg;
  readonly cell: AcceptCell;
  readonly homes: Homes;
}

/** Five cell-level seeds — each a distinct static defect signature. */
const CELL_SEEDS: readonly CellSeed[] = [
  {
    // references an anchor with NO home → orphan-ref (a dangling concept)
    leg: 'CANONICAL',
    cell: {
      kind: 'fragment',
      slug: 'clean-anchor',
      definiens: clean,
      refs: ['ghost-anchor'],
    },
    homes: new Map([['clean-anchor', ['seed']]]),
  },
  {
    // a malformed sign (whitespace) — provably ≠ σ* without the oracle
    leg: 'SIGNIFIED',
    cell: {
      kind: 'fragment',
      slug: 'bespoke term',
      definiens: clean,
      refs: [],
    },
    homes: new Map([['bespoke term', ['seed']]]),
  },
  {
    // leans on an external cite → not self-sufficient, fails blind
    leg: 'COLD-BLIND',
    cell: {
      kind: 'fragment',
      slug: 'clean-anchor',
      definiens: 'derive it per §2 of the upstream spec.',
      refs: [],
    },
    homes: new Map([['clean-anchor', ['seed']]]),
  },
  {
    // one concept, two homes → |home|=2 (partition broken)
    leg: 'PARTITIONED',
    cell: {
      kind: 'fragment',
      slug: 'dup-anchor',
      definiens: clean,
      refs: [],
    },
    homes: new Map([['dup-anchor', ['home-a', 'home-b']]]),
  },
  {
    // the body restates the anchor → residue ⊇ fired(α)
    leg: 'PARSIMONIOUS',
    cell: {
      kind: 'fragment',
      slug: 'parsimony',
      definiens: 'being parsimonious: parsimony is the parsimony principle.',
      refs: [],
    },
    homes: new Map([['parsimony', ['seed']]]),
  },
];

/** The REGENERABLE seed — a self-authored store leaked into the deploy Target set. */
const REGENERABLE_SEED: readonly Target[] = [
  {
    path: '~/.claude/agents/mav/EPISODIC.jsonl',
    deployOwned: false,
    handEdited: false,
    selfAuthored: true,
  },
];

/** A conformant deploy Target set (a regenerated SOUL) — passes REGENERABLE. */
const GREEN_TARGETS: readonly Target[] = [
  {
    path: 'agents/mav.md',
    deployOwned: true,
    handEdited: false,
    selfAuthored: false,
  },
];

/** The full six-leg verdict for a scenario (per-cell legs + the global Target leg). */
function allSix(
  cell: AcceptCell,
  homes: Homes,
  targets: readonly Target[],
): LegVerdict[] {
  return [...universalCell(cell, homes, anatomyPolicy), regenerable(targets)];
}

// ── the live corpus (one home per fragment anchor is the PARTITIONED claim) ───

async function loadDimensionHomes(): Promise<Map<string, string[]>> {
  const homes = new Map<string, string[]>();
  for (const rel of await collect('dimensions/**/*.ts')) {
    const v = await firstExport<string>(join(srcRoot, rel));
    // concept identity is dimension-qualified — `dimensions/<dimension>/<value>.ts`. A bare
    // slug shared across dimensions (`document` role vs output-format) is TWO concepts.
    const dimension = rel.split('/')[1] as string;
    const key = `${dimension}/${slugOf(v)}`;
    const bearers = homes.get(key) ?? [];
    bearers.push(rel);
    homes.set(key, bearers);
  }
  return homes;
}

// ── RATCHET — explicit, shrink-only (mirrors REGISTER_RATCHET; no silent pin) ─────
//
// A deliberately-allowed known-non-conformant cell pins here, keyed to the leg it
// fails; every pin must STILL fail that leg (else remove it). Literal set ⇒ a pin
// cannot be added without a reviewed edit. Empty ⇔ the gated corpus conforms.
const ACCEPT_RATCHET: ReadonlyArray<CellSeed> = [];

describe('accept() falsifier — Universal ∧ (agent ⇒ COMPOSED), BLIND cold-oracle', () => {
  it('convicts one seeded defect per Universal leg — 6/6, and MECE (only that leg)', () => {
    const convicted = new Set<Leg>();
    for (const seed of CELL_SEEDS) {
      const failing = failingLegs(allSix(seed.cell, seed.homes, GREEN_TARGETS));
      expect(failing, `${seed.leg} seed must convict exactly its leg`).toEqual([
        seed.leg,
      ]);
      convicted.add(seed.leg);
    }
    // REGENERABLE is global (a Target-set leg) — seed a clean cell + a dirty Target set.
    const green = {
      kind: 'fragment',
      slug: 'clean-anchor',
      definiens: clean,
      refs: [],
    } as const;
    const regFailing = failingLegs(
      allSix(green, new Map([['clean-anchor', ['seed']]]), REGENERABLE_SEED),
    );
    expect(regFailing, 'REGENERABLE seed must convict exactly its leg').toEqual(
      ['REGENERABLE'],
    );
    convicted.add('REGENERABLE');
    // 6/6 — every Universal leg has a convicting seed (non-vacuous).
    expect([...convicted].sort()).toEqual([...UNIVERSAL_LEGS].sort());
  });

  it('GREEN — one already-conformant live cell passes every Universal leg', async () => {
    const v = await firstExport<string>(
      join(srcRoot, 'dimensions/objective/parsimony.ts'),
    );
    const { slug, definiens } = splitBody(v);
    expect(slug).toBe('parsimony');
    const cell: AcceptCell = {
      kind: 'fragment',
      slug,
      dimension: 'objective',
      definiens,
      refs: [],
    };
    const homes = await loadDimensionHomes();
    expect(failingLegs(allSix(cell, homes, GREEN_TARGETS))).toEqual([]);
  });

  it('PARTITIONED corpus-wide — every fragment anchor has exactly one home', async () => {
    const homes = await loadDimensionHomes();
    const split = [...homes].filter(([, bearers]) => bearers.length !== 1);
    expect(homes.size).toBeGreaterThan(100);
    expect(
      split.map(([slug, b]) => `${slug} → {${b.join(',')}}`),
      'fragment anchors must partition (one home each)',
    ).toEqual([]);
  });

  it('the accept ratchet is explicit + shrink-only — every pin still convicts', () => {
    for (const pin of ACCEPT_RATCHET) {
      const failing = failingLegs(allSix(pin.cell, pin.homes, GREEN_TARGETS));
      expect(
        failing,
        `ratchet pin '${pin.cell.slug}' no longer fails ${pin.leg} — REMOVE it`,
      ).toContain(pin.leg);
    }
    // conformance witness: the gated corpus needs no pins.
    expect(ACCEPT_RATCHET.length).toBe(0);
  });

  // ── LIVE authority — the priors-only BLIND cold-oracle (gated integration lane) ──
  // Hits the network + a live model (slow, non-deterministic) → opt-in only, so the
  // hermetic floor above stays green on every commit. Run: COLD_ORACLE_LIVE=1 vitest.
  const live = process.env.COLD_ORACLE_LIVE === '1';
  it.runIf(live)(
    'BLIND isolation positive control — a nonce decodes to its GENERIC prior, not a registry gloss',
    () => {
      const ctl = nonceControl({ model: 'sonnet' });
      // isolation holds ⇔ the coined nonce reads as an unknown/coined term. If the
      // corpus/registry had leaked in, it would come back with a local gloss.
      expect(ctl.isolated, `nonce '${ctl.nonce}' → ${ctl.decode}`).toBe(true);
      // and never carries a project-registry gloss (the σ* skill sense of `signify`).
      expect(/injective canonical anchor|σ\*/.test(ctl.decode)).toBe(false);
    },
    180_000,
  );
});

// ═══ RESIDUE gate (AC-RESIDUE) — the DEPLOYED σ* payload is formal σ*, never prose ══
//
// The machine-check behind AC-RESIDUE (PLAN.md): MODEL PARSIMONIOUS
// `body(c)=⟨α,residue⟩ ∧ residue=D∖fired(α)` specialized to the DEPLOYED corpus —
// every dimension VALUE residue · every skill `description` · every skill `body`
// (whole) MUST be a composable σ* expression / a `formalize` artifact / ∅, never human
// prose (the vision's failure criterion). GOVERNING INVARIANT: every deployed artifact
// the model reads is formal σ* under ρ, never human prose — this gate IS that
// invariant's enforcement over the whole deployed payload set. Predicate + witnesses:
// `src/toolkit/cold-oracle/residue.ts`; admitted operators READ from
// `operator-lexicon.ts` (`RESIDUE_OPERATORS` — DRY, one home).
//
// FIXTURE-BASED bite proof, GREEN NOW: the 139 live dimension values are E1's verbatim-
// prose intermediates (`slug ≜ <old prose>`) until wave-2 (O/S/H) reduces them to σ*,
// and descriptions are likewise pre-reduction prose — so the LIVE-corpus scan is
// `.skip`ped (C1 marker) to avoid reddening a suite full of legitimate intermediates.
// The predicate is proven on fixtures instead: prose REJECTED (offending clause named),
// the three σ* forms + a real `formalize` body ACCEPTED, a prose-carrying
// body REJECTED. NON-VACUOUS: the gate BITES on prose, PASSES on σ*.

describe('RESIDUE gate (AC-RESIDUE) — deployed σ* payload is formal σ*, never prose', () => {
  // DRY — the gate's admitted value-algebra operators ARE the lexicon's, not a copy.
  it('reads its operator set from operator-lexicon (RESIDUE_OPERATORS — one home)', () => {
    expect(RESIDUE_OPERATORS).toEqual(['↾', '⟨', '⟩', '${}']);
    // the infix `↾` (∈ RESIDUE_OPERATORS) combines terms; `⟨⟩`/`${}` group a span.
    expect(admissibleSingleLine('scope ↾ ic', anatomyPolicy).admissible).toBe(
      true,
    );
    // a glyph NOT in RESIDUE_OPERATORS (a compose `⊕`) is not an admitted operator ⇒
    // it surfaces as a non-σ* atom — member-composition is the agent's set-arity
    // vector, NOT a cell glyph (no compose op without its own cold-verification).
    expect(admissibleSingleLine('scope ⊕ ic', anatomyPolicy).admissible).toBe(
      false,
    );
  });

  // ── SINGLE-LINE (dimension value residue · skill `description`) ────────────────────
  it('ACCEPTS the three σ* forms — ∅ · a bare anchor · an operator application', () => {
    for (const form of [
      '', // ∅ — the anchor α fully fires the concept
      'human-on-the-loop', // a bare symbol/anchor
      'decision-authority(self) ↾ individual-contribution ⟨intrinsic⟩', // op application
    ]) {
      const v = admissibleSingleLine(form, anatomyPolicy);
      expect(v.admissible, `${JSON.stringify(form)} → ${v.reason}`).toBe(true);
    }
  });

  it('REJECTS a prose residue, NAMING the offending clause (actionable for O*/S*)', () => {
    // the live E1 intermediate for dimensions/autonomy/human-on-the-loop (verbatim head).
    const prose =
      "acts autonomously on the operator's behalf; the operator oversees and " +
      'sets intent, never pre-approves each act.';
    const v = admissibleSingleLine(prose, anatomyPolicy);
    expect(v.admissible).toBe(false);
    expect(v.reason).toContain("acts autonomously on the operator's behalf");
    expect(v.reason).toMatch(/clausal-punct|free-NL connective/);
  });

  // ── FORMAL-BLOCK (skill `body`, whole — a `formalize` artifact) ──────────
  it('ACCEPTS a valid `formalize` body (declarations-above / laws-below)', () => {
    const block = [
      'DECLARATIONS',
      '  R      — the reader; fixes every meaning',
      '  α      : C_R ↣ Names',
      'LAWS',
      '  A ≜ { α(c) | c ∈ C_R }',
      '  injective : α(cᵢ) = α(cⱼ) ⇒ cᵢ = cⱼ',
    ].join('\n');
    const v = admissibleBody(block, anatomyPolicy);
    expect(v.admissible, v.reason).toBe(true);
    // …and the REAL deployed artifact: signify's formalBlock IS a formalize artifact.
    const live = admissibleBody(signify.formalBlock, anatomyPolicy);
    expect(live.admissible, live.reason).toBe(true);
  });

  it('REJECTS a body carrying an explanatory-prose line / a #-preamble gloss', () => {
    const prosey = [
      'DECLARATIONS',
      '  R      — the reader',
      'LAWS',
      '  We first walk the lattice and then assign a name to each concept.',
    ].join('\n');
    const v = admissibleBody(prosey, anatomyPolicy);
    expect(v.admissible).toBe(false);
    expect(v.reason).toContain('explanatory-prose line');
    expect(v.reason).toContain('We first walk the lattice');

    const preamble = [
      '# how naming works',
      'DECLARATIONS',
      '  R — the reader',
    ].join('\n');
    const w = admissibleBody(preamble, anatomyPolicy);
    expect(w.admissible).toBe(false);
    expect(w.reason).toContain('#-preamble gloss');
  });

  // ── LIVE-corpus scan — the full AC-RESIDUE claim over the deployed payload set ──
  // ENABLED (C1): wave-2 (O/S/H) reduced every dimension value + skill formalBlock to σ*.
  // (`description` is σ_human*, not a σ* payload — gated by density, not residue.)
  it('every deployed σ* payload is admissible (dimension values · skill formalBlocks)', async () => {
    const failures: string[] = [];
    for (const rel of await collect('dimensions/**/*.ts')) {
      const value = await firstExport<string>(join(srcRoot, rel));
      const r = admissibleSingleLine(splitBody(value).definiens, anatomyPolicy);
      if (!r.admissible) failures.push(`dimension ${rel}: ${r.reason}`);
    }
    for (const rel of await collect('skills/*.ts')) {
      const s = await firstExport<Skill>(join(srcRoot, rel));
      // `description` is σ_human*, NOT σ* — no longer residue-gated. The sole σ*
      // payload is `formalBlock`, gated as a FORMAL-BLOCK via the typed entry point.
      const f = admissibleFormalBlock(s.formalBlock, anatomyPolicy);
      if (!f.admissible)
        failures.push(`skill ${s.name} formalBlock: ${f.reason}`);
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });
});
