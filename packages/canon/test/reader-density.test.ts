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
//                    (one incidental second-person hit is legal)
//   FPP-WALKTHROUGH— ≥2 first-person-plural walkthrough tokens (live = 0)
//
// RATCHET — explicit, shrink-only allowlist. Empty when the corpus fully
// conforms; a violation may only be pinned here deliberately, in the open.
// No silent exemptions: a pinned surface that STOPS failing FAILS the suite
// (remove the pin); a new violation is never pinnable silently (the sets are
// literal here).
//
// NON-VACUOUS: a seeded human-register definiens is convicted with named
// signals; the same text under a ρ=human class is exempt BY THE MODEL; the
// calibration exemplars pass. All asserted below.

import { readFileSync } from 'node:fs';
import { glob } from 'node:fs/promises';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
// accept() falsifier — the full Universal gate (`tooling/cold-oracle/accept.ts`),
// the register gate above being one facet of ρ-conformance, not a Universal leg.
import {
  type AcceptCell,
  type EmittedMechanism,
  type EnforcedObligation,
  type Homes,
  type Leg,
  type LegVerdict,
  type Target,
  UNIVERSAL_LEGS,
  admissibleBody,
  admissibleFormalBlock,
  admissibleSingleLine,
  enforced,
  failingLegs,
  regenerable,
  universalCell,
} from '@cratylus/forge/validate';
import type { Skill } from '@cratylus/schema';
import { bodyOf } from '@cratylus/schema';
import { describe, expect, it } from 'vitest';
import type { Dimension, Value } from '../src/manifest.js';
import { RESIDUE_OPERATORS, declaredGlyphs } from '../src/operator-lexicon.js';
import { signify } from '../src/skills/signify/skill.js';
// The injected corpus POLICY DATA (palimpsest table + operator lexicon) the
// doctrine-agnostic validate ALGORITHM consumes — passed at every gate call site.
import { canonPolicy } from '../tooling/cold-oracle/policy.js';
// ρ + register(a) + conform — ONE shared model (`reader-register.ts`), also
// enforced over the runtime frontiers by `reader-reach.test.ts`; RHO mirrors
// the READER BINDING subset lists (signify).
import {
  type ArtClass,
  RHO,
  conform,
  humanRegisterSignals,
  registerOf,
} from './reader-register.js';
import { firstExport } from './support/cell-module.js';

const canonRoot = join(dirname(fileURLToPath(import.meta.url)), '..');
const srcRoot = join(canonRoot, 'src');

// ── RATCHET — explicit, shrink-only ─────────────────────────────────────────────

/**
 * Known non-conforming ρ=LLM surfaces — EMPTY, and now that means something.
 *
 * It was empty before over three families that were dense by construction, which
 * proved nothing: an unscanned surface cannot fail. The reach leg below asserts that
 * every ρ=LLM class this gate owns is witnessed, so emptiness here is a conformance
 * claim rather than a coverage claim.
 */
const REGISTER_RATCHET: ReadonlySet<string> = new Set([]);

// ── surface enumeration (source grain — the projections follow the source) ──────

interface Surface {
  readonly label: string;
  readonly cls: ArtClass;
  readonly text: string;
}

async function collect(pattern: string): Promise<string[]> {
  const out: string[] = [];
  for await (const p of glob(pattern, { cwd: srcRoot })) {
    out.push(p);
  }
  return out.sort();
}

/**
 * Every catalog value is an anchor and a gloss: one or two plain sentences saying
 * what it means and why, never dense notation (the catalog re-cut's master design).
 * A gloss is read by the model, so ρ is LLM — plain words in the model's register,
 * which the register detector scores like every other ρ=LLM surface.
 */
const DIMENSION_CLASS: ArtClass = 'dimension-definiens';

async function allSurfaces(): Promise<Surface[]> {
  const surfaces: Surface[] = [];
  for (const rel of await collect('dimensions/**/*.ts')) {
    const f = await firstExport<string>(join(srcRoot, rel));
    surfaces.push({
      label: `dimension ${relative('dimensions', rel).replace(/\.ts$/, '')}`,
      cls: DIMENSION_CLASS,
      text: splitBody(f).definiens,
    });
  }
  for (const rel of await collect('skills/*/skill.ts')) {
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
    // into every Target; the sibling sections are corpus/skill-dir surfaces.
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
  // The prime principle rides into every skill whose laws apply it — the same
  // ship-whole verbatim carry as the genus protocol, so the same class.
  {
    const mod = (await import(
      pathToFileURL(join(srcRoot, 'genus/prime-principle.ts')).href
    )) as Record<string, unknown>;
    for (const [k, v] of Object.entries(mod)) {
      if (typeof v === 'string') {
        surfaces.push({
          label: `genus prime-principle ${k}`,
          cls: 'genus-protocol',
          text: v,
        });
      }
    }
  }
  // Rule cells: the σ*-signified declaration AND the verbatim payload it projects.
  // The payload is the one that matters — `repo-preamble` regenerates `/AGENTS.md`,
  // which every session loads on entry. It went unscanned while being the most
  // widely-read artifact the corpus emits.
  for (const rel of await collect('rules/*.ts')) {
    // `residue`, not `definiens` — a cell's authored identity has already paid
    // `∖ fired(α)`. The ρ-class `dimension-definiens` below is the OTHER object
    // (raw `D`, pre-subtraction) and keeps its own sign; see `rule-cell.ts`.
    const c = await firstExport<{ residue: string; content: string }>(
      join(srcRoot, rel),
    );
    surfaces.push({
      label: `rule ${rel} residue`,
      cls: 'cell-declaration',
      text: c.residue,
    });
    surfaces.push({
      label: `rule ${rel} content`,
      cls: 'rule-target-content',
      text: c.content,
    });
  }
  // Hook cells: the DECLARATION only. `workers[].content` is SOURCE CODE, not
  // context — nothing loads a shell script into a reader. Scoring it would convict
  // the authorial "we" of an ordinary code comment, and this gate's own source
  // files would fail first.
  //
  // `RuleCell.content` above is its structural twin and IS scored, so the split is
  // now between two same-signed fields — which is correct and not a slip. The class
  // is fixed by what READS the bytes, never by the field's sign: `/AGENTS.md` lands
  // in an agent's context, a shell worker lands in a shell. The exclusion is by
  // CONSTRUCTION, not by name — this loop never reaches `workers` at all.
  //
  // What a hook SPEAKS to an agent is `HookCell.speech` — a declared, enumerable
  // field as of the worker-template seam, no longer `printf` bodies reachable only
  // by parsing shell. It is not scored HERE because it is not `cell-declaration`:
  // an agent-facing reminder is prose addressed to a reader, not a σ*-signified
  // identity, and filing it under this class would assert a register nobody chose
  // for it. Its own ρ entry is a `reader-register.ts` decision.
  for (const rel of await collect('hooks/*.ts')) {
    const c = await firstExport<{ residue?: string }>(join(srcRoot, rel));
    if (typeof c.residue === 'string') {
      surfaces.push({
        label: `hook ${rel} residue`,
        cls: 'cell-declaration',
        text: c.residue,
      });
    }
  }
  return surfaces;
}

/**
 * The ρ=LLM classes THIS gate is responsible for witnessing.
 *
 * `RHO` is shared with `reader-reach.test.ts`, which owns the runtime frontiers.
 * Splitting the responsibility explicitly is what lets each gate assert total
 * coverage of its own half — the assertion that turns "the ratchet is empty" from
 * a claim about coverage into a claim about conformance.
 */
const OWNED_CLASSES: readonly ArtClass[] = [
  'dimension-definiens',
  'skill-description',
  'genus-protocol',
  'cell-declaration',
  'rule-target-content',
];

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

/**
 * Recover just the α(c) slug (the common case).
 *
 * Takes a VALUE, not a string: a value may now carry its own enforcement, and
 * this gate reads the DECLARATION face. `bodyOf` is the uniform way to reach it —
 * reading density off anything but the declaration would score the binding.
 */
function slugOf(v: Value<Dimension>): string {
  return splitBody(bodyOf(v)).slug;
}

// ── the gate ────────────────────────────────────────────────────────────────────

describe('READER-DENSITY gate — conform(a) ⇔ register(a) = ρ(a)', () => {
  it('the calibration exemplars PASS', async () => {
    for (const rel of [
      'dimensions/objective/parsimony.ts',
      'dimensions/communication-style/decision-rationale.ts',
      'dimensions/expertise/research-investigation.ts',
    ]) {
      const f = await firstExport<string>(join(srcRoot, rel));
      expect(
        humanRegisterSignals(splitBody(f).definiens),
        `${rel} is a PASS exemplar`,
      ).toEqual([]);
    }
  });

  // REACH — the leg that makes the ratchet's emptiness mean something.
  //
  // The ratchet was empty over three self-selected families that were already dense
  // by construction, annotated "the corpus conforms". That is a claim about COVERAGE
  // stated as a claim about CONFORMANCE: an unscanned surface cannot fail, so absence
  // of failures measured nothing. Enumerating more families fixes today's corpus and
  // NOT the defect — the next class added would be silently unscanned again.
  //
  // So reach is asserted, not just extended: every ρ=LLM class this gate owns must be
  // witnessed by a real surface. A class declared and never enumerated is the defect
  // itself, and it now fails loudly. (`agent-vector` was exactly that.)
  it('every owned ρ=LLM class is WITNESSED — coverage is asserted, not assumed', async () => {
    const surfaces = await allSurfaces();
    const seen = new Set(surfaces.map((s) => s.cls));
    const unwitnessed = OWNED_CLASSES.filter((c) => !seen.has(c));
    expect(
      unwitnessed,
      `ρ=LLM classes declared but enumerated by nothing: ${unwitnessed.join(' · ')}`,
    ).toEqual([]);
    // …and nothing is scanned under a class this gate does not claim, which would
    // put a surface outside both gates' stated responsibility. A ρ=human class is
    // not unclaimed, it is out of scope BY THE MODEL: the detector "can witness
    // register=human, never certify it" (`reader-register.ts`), so ρ=human is
    // exempt by ρ rather than by path — the same exemption the header already
    // grants `readme` and `human-doc`.
    const unclaimed = [...seen].filter(
      (c) => RHO[c] === 'LLM' && !OWNED_CLASSES.includes(c),
    );
    expect(
      unclaimed,
      `surfaces scanned under unowned ρ=LLM classes: ${unclaimed.join(' · ')}`,
    ).toEqual([]);
  });

  // A gloss is plain words, and that is what this leg pins. The register detector
  // above witnesses the TUTORIAL register (hedges, second person, first-person
  // walkthrough); it cannot tell plain words from notation, since clean notation
  // carries none of those markers either. So the notation itself is the witness:
  // a gloss carrying any glyph of the operator lexicon is dense notation.
  //
  // MEASURED, and the reason glosses are plain: a value carrying its clauses in
  // σ* was quoted back byte-for-byte by the session it governed — comprehended —
  // while that same session did not act on it (0.69 structured reply lines against
  // 0.45 once the same clauses were written in plain words).
  it('every catalog value is `<anchor> ≜ <gloss>`, its gloss plain words, never σ*', async () => {
    const glyphs = declaredGlyphs();
    const rels = await collect('dimensions/**/*.ts');
    expect(rels.length).toBeGreaterThan(100);
    const notPlain: string[] = [];
    for (const rel of rels) {
      const body = bodyOf(
        await firstExport<Value<Dimension>>(join(srcRoot, rel)),
      );
      const { slug, definiens } = splitBody(body);
      const dense = [...definiens].filter((ch) => glyphs.has(ch));
      if (slug === body || definiens.length === 0 || dense.length > 0)
        notPlain.push(`${rel}: ${dense.join(' ') || 'no gloss'}`);
    }
    expect(
      notPlain,
      `catalog values without a plain gloss: ${notPlain.join(' · ')}`,
    ).toEqual([]);
    // non-vacuous: the predicate convicts a σ* gloss the catalog once shipped
    expect(
      [...'⟨names natural ¬conventional⟩'].some((ch) => glyphs.has(ch)),
    ).toBe(true);
  });

  it('the enumerated families are all PRESENT (an empty glob passes every check)', async () => {
    const surfaces = await allSurfaces();
    const count = (cls: ArtClass) =>
      surfaces.filter((s) => s.cls === cls).length;
    // Named artifacts, not counts-as-exit-codes: a wrong glob yields the empty set,
    // and the empty set travels through every downstream assertion as success.
    const labels = surfaces.map((s) => s.label);
    expect(labels).toContain('genus src/genus/persona.md ## Protocol');
    expect(labels).toContain('genus prime-principle primePrinciple');
    expect(labels).toContain('rule rules/repo-preamble.ts content');
    expect(count('dimension-definiens')).toBeGreaterThan(100);
    expect(count('skill-description')).toBeGreaterThan(10);
  });

  it('every ρ=LLM surface conforms, or is an explicit ratchet pin', async () => {
    const surfaces = await allSurfaces();
    // cardinality sanity — the gate SEES the persona genus protocol (memory's genus
    // def was retired in E6c: its mechanism → the `memory` CLI --help; its
    // reasoning-contract lived in the wake + dream skill formalBlocks, retired
    // along with those cells — no replacement home has been declared).
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
// `COLD_ORACLE_LIVE=1`) over an always-on STATIC floor (`tooling/cold-oracle/
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
    path: '~/.omp/agent/agents/example/EPISODIC.jsonl',
    deployOwned: false,
    handEdited: false,
    selfAuthored: true,
  },
];

/** A conformant, freshly regenerated deploy Target set — passes REGENERABLE. */
const GREEN_TARGETS: readonly Target[] = [
  {
    path: 'agent/agents/example.md',
    deployOwned: true,
    handEdited: false,
    selfAuthored: false,
  },
];

/** The full six-leg verdict for a scenario (per-cell legs + the global Target leg). */
function allSeven(
  cell: AcceptCell,
  homes: Homes,
  targets: readonly Target[],
  obligations: readonly EnforcedObligation[] = [],
  emissions: readonly EmittedMechanism[] = [],
): LegVerdict[] {
  return [
    ...universalCell(cell, homes, canonPolicy),
    enforced(obligations, emissions),
    regenerable(targets),
  ];
}

/**
 * The ENFORCED seed — a bound DECLARED in the source register that the projection
 * never emitted. MODEL: "a declared bound that projects to nothing is
 * INDISTINGUISHABLE from an undeclared one." Global like REGENERABLE, so it is
 * seeded with a clean cell and a dirty obligation set rather than a dirty cell.
 */
const ENFORCED_SEED: readonly EnforcedObligation[] = [
  { fragment: 'seeded-bound', agent: 'seeded-agent' },
];

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
  it('convicts one seeded defect per Universal leg — 7/7, and MECE (only that leg)', () => {
    const convicted = new Set<Leg>();
    for (const seed of CELL_SEEDS) {
      const failing = failingLegs(
        allSeven(seed.cell, seed.homes, GREEN_TARGETS),
      );
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
      allSeven(green, new Map([['clean-anchor', ['seed']]]), REGENERABLE_SEED),
    );
    expect(regFailing, 'REGENERABLE seed must convict exactly its leg').toEqual(
      ['REGENERABLE'],
    );
    convicted.add('REGENERABLE');
    // ENFORCED is global too — a clean cell, a declared bound, nothing emitted.
    const enfFailing = failingLegs(
      allSeven(
        green,
        new Map([['clean-anchor', ['seed']]]),
        GREEN_TARGETS,
        ENFORCED_SEED,
        [],
      ),
    );
    expect(enfFailing, 'ENFORCED seed must convict exactly its leg').toEqual([
      'ENFORCED',
    ]);
    convicted.add('ENFORCED');
    // 7/7 — every Universal leg has a convicting seed (non-vacuous).
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
    expect(failingLegs(allSeven(cell, homes, GREEN_TARGETS))).toEqual([]);
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
      const failing = failingLegs(allSeven(pin.cell, pin.homes, GREEN_TARGETS));
      expect(
        failing,
        `ratchet pin '${pin.cell.slug}' no longer fails ${pin.leg} — REMOVE it`,
      ).toContain(pin.leg);
    }
    // conformance witness: the gated corpus needs no pins.
    expect(ACCEPT_RATCHET.length).toBe(0);
  });
});

// ═══ RESIDUE gate (AC-RESIDUE) — the DEPLOYED σ* payload is formal σ*, never prose ══
//
// The machine-check behind AC-RESIDUE: MODEL PARSIMONIOUS
// `body(c)=⟨α,residue⟩ ∧ residue=D∖fired(α)` specialized to the DEPLOYED σ* payload —
// every skill `formalBlock` (whole) MUST be a `formalize` artifact, never human prose.
// Catalog values are NOT σ* payloads: each is an anchor and a plain gloss, gated by
// the plain-gloss leg above. Predicate + witnesses: `tooling/cold-oracle/residue.ts`;
// admitted operators READ from `operator-lexicon.ts` (`RESIDUE_OPERATORS` — DRY, one
// home). The single-line predicate is proven on fixtures: prose REJECTED (offending
// clause named), the three σ* forms + a real `formalize` body ACCEPTED, a
// prose-carrying body REJECTED. NON-VACUOUS: the gate BITES on prose, PASSES on σ*.

describe('RESIDUE gate (AC-RESIDUE) — deployed σ* payload is formal σ*, never prose', () => {
  // DRY — the gate's admitted value-algebra operators ARE the lexicon's, not a copy.
  it('reads its operator set from operator-lexicon (RESIDUE_OPERATORS — one home)', () => {
    expect(RESIDUE_OPERATORS).toEqual(['↾', '⟨', '⟩', '${}']);
    // the infix `↾` (∈ RESIDUE_OPERATORS) combines terms; `⟨⟩`/`${}` group a span.
    expect(admissibleSingleLine('scope ↾ ic', canonPolicy).admissible).toBe(
      true,
    );
    // An UNDECLARED glyph surfaces as a non-σ* atom and is rejected. The bar is
    // COLD-VERIFIABILITY, never lexicon membership: the lexicon is a corpus artifact
    // (warm K), the model is the oracle. A glyph the model decodes reliably — `⊂`
    // proper-subset, `⊕` direct-sum — belongs in the lexicon, and its absence there
    // is a LEXICON defect to fix, never a reason to bend the cell away from the sign
    // the model wants. `⍟` is the negative probe precisely because it carries no
    // stable prior to verify against.
    expect(admissibleSingleLine('scope ⍟ ic', canonPolicy).admissible).toBe(
      false,
    );
    // …and the two just-canonized glyphs are admitted, as cold-verification requires.
    expect(admissibleSingleLine('scope ⊂ ic', canonPolicy).admissible).toBe(
      true,
    );
    expect(admissibleSingleLine('scope ⊕ ic', canonPolicy).admissible).toBe(
      true,
    );
    // SUBSCRIPTED Greek — policy/family notation (`π_<axis>`, `ρ_<kind>`) is
    // cold-verified and load-bearing (`autonomy/decision-authority`, `materialize`).
    // The single-letter GREEK form once rejected it, convicting the cell instead of
    // the rig; the whole point is that the model's sign wins over the checker.
    for (const v of [
      'π_decision-authority(self) = principal',
      'ρ_document(k)',
      'σ*',
    ])
      expect(
        admissibleSingleLine(v, canonPolicy).admissible,
        `subscripted-Greek rejected: ${v}`,
      ).toBe(true);
  });

  // ── SINGLE-LINE (a σ* residue) ─────────────────────────────────────────────
  it('ACCEPTS the three σ* forms — ∅ · a bare anchor · an operator application', () => {
    for (const form of [
      '', // ∅ — the anchor α fully fires the concept
      'human-on-the-loop', // a bare symbol/anchor
      'decision-authority(self) ↾ individual-contribution ⟨intrinsic⟩', // op application
    ]) {
      const v = admissibleSingleLine(form, canonPolicy);
      expect(v.admissible, `${JSON.stringify(form)} → ${v.reason}`).toBe(true);
    }
  });

  it('REJECTS a prose residue, NAMING the offending clause (actionable for O*/S*)', () => {
    // a prose residue (verbatim head of a since-retired value intermediate).
    const prose =
      "acts autonomously on the operator's behalf; the operator oversees and " +
      'sets intent, never pre-approves each act.';
    const v = admissibleSingleLine(prose, canonPolicy);
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
    const v = admissibleBody(block, canonPolicy);
    expect(v.admissible, v.reason).toBe(true);
    // …and the REAL deployed artifact: signify's formalBlock IS a formalize artifact.
    const live = admissibleBody(signify.formalBlock, canonPolicy);
    expect(live.admissible, live.reason).toBe(true);
  });

  it('REJECTS a body carrying an explanatory-prose line / a #-preamble gloss', () => {
    const prosey = [
      'DECLARATIONS',
      '  R      — the reader',
      'LAWS',
      '  We first walk the lattice and then assign a name to each concept.',
    ].join('\n');
    const v = admissibleBody(prosey, canonPolicy);
    expect(v.admissible).toBe(false);
    expect(v.reason).toContain('explanatory-prose line');
    expect(v.reason).toContain('We first walk the lattice');

    const preamble = [
      '# how naming works',
      'DECLARATIONS',
      '  R — the reader',
    ].join('\n');
    const w = admissibleBody(preamble, canonPolicy);
    expect(w.admissible).toBe(false);
    expect(w.reason).toContain('#-preamble gloss');
  });

  // ── LIVE-corpus scan — the full AC-RESIDUE claim over the deployed σ* payload ──
  // (`description` is σ_human*, not a σ* payload — gated by density, not residue.)
  it('every deployed σ* payload is admissible (skill formalBlocks)', async () => {
    const failures: string[] = [];
    for (const rel of await collect('skills/*/skill.ts')) {
      const s = await firstExport<Skill>(join(srcRoot, rel));
      // `description` is σ_human*, NOT σ* — no longer residue-gated. The sole σ*
      // payload is `formalBlock`, gated as a FORMAL-BLOCK via the typed entry point.
      const f = admissibleFormalBlock(s.formalBlock, canonPolicy);
      if (!f.admissible)
        failures.push(`skill ${s.name} formalBlock: ${f.reason}`);
    }
    expect(failures, failures.join('\n')).toEqual([]);
  });
});
