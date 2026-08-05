// accept.ts — the machine-checkable falsifier for the root model's `accept()`
// (MODEL.md). Lifts the author-time gate from the register-only leg to the full
//
//   accept(a) ⇔ Universal(a) ∧ (class(a)=agent ⇒ COMPOSED(a))
//   Universal = CANONICAL ∧ SIGNIFIED ∧ COLD-BLIND ∧ PARTITIONED ∧ PARSIMONIOUS
//             ∧ ENFORCED ∧ REGENERABLE
//
// DIVISION OF LABOUR (the honest boundary): the seven Universal legs split into a
// STATIC floor decided here (pure, hermetic, deterministic — runs in every
// `pnpm test`) and a LIVE authority decided by the priors-only blind cold-oracle
// (`./oracle.ts`, fresh /tmp, no corpus/session/root reads). The two decode-shaped
// legs — COLD-BLIND and SIGNIFIED (α=σ*) — are genuinely oracle judgments (does the
// fragment / anchor decode to intent under LLM-priors ALONE?); the static witness is
// their always-on FLOOR (external-cite, malformed-sign), the oracle their ceiling.
// The five structural legs (CANONICAL·PARTITIONED·PARSIMONIOUS·ENFORCED·REGENERABLE)
// are fully static. ENFORCED and REGENERABLE are GLOBAL rather than per-cell — a cell
// cannot witness its own projection — so both are folded in by the caller. The
// nonce positive-control (`oracle.ts`) empirically backs the SIGNIFIED floor: a
// sign that fires NO circumscribing prior cannot be σ*.
//
// This is the doctrine-agnostic ALGORITHM (forge ENGINE): witnesses over
// supplied data, zero IO, zero corpus doctrine. The corpus DATA it reads — which
// tokens are palimpsest — is INJECTED as a `Policy` (`./policy.ts`); the DATA lives
// in the corpus (canon), never here. Corpus loading + oracle driving live in
// the caller.

import type { Skill, SkillExpression } from '@cratylus/schema';
import type { Policy } from './policy.js';

/** The seven Universal legs of `accept()` (MODEL.md). */
export type Leg =
  | 'CANONICAL'
  | 'SIGNIFIED'
  | 'COLD-BLIND'
  | 'PARTITIONED'
  | 'PARSIMONIOUS'
  | 'ENFORCED'
  | 'REGENERABLE';

export const UNIVERSAL_LEGS: readonly Leg[] = [
  'CANONICAL',
  'SIGNIFIED',
  'COLD-BLIND',
  'PARTITIONED',
  'PARSIMONIOUS',
  'ENFORCED',
  'REGENERABLE',
] as const;

/**
 * A cell reduced to what the static witnesses read (the source grain).
 *
 * GROUND-CONFORMANCE (the property, stated where it binds). `MODEL.md` is
 * hand-authored GROUND: never generated from source, never revised to match it —
 * `ARCHITECTURE.md`, "Where the two disagree, the source is wrong." For a ground
 * enumeration `G` and a source enumeration `S` purporting to realize it:
 *
 *   S ⊂ G  — REFINEMENT. LEGAL. The source under-realizes; the residue is a known
 *            gap, and a gap is nameable, schedulable, convictable.
 *   S ⊃ G  — DEFECT, ALWAYS. A source member with no ground peer is a concept
 *            admitted with NO HOME IN GROUND: unconvictable by construction,
 *            because ground is the only thing that could have convicted it.
 *   both   — TWO findings, never one. Netting them out hides the defect inside
 *            the legal direction.
 *
 * The asymmetry is not stylistic. A source may under-realize ground and say so; it
 * may never EXTEND ground. Extending ground from source is how a document stops
 * being ground — the amendment is written by the thing the document was supposed
 * to judge, and thereafter judges nothing.
 *
 * APPLIED HERE. This union was `… | 'rule' | 'hook'`; `MODEL.md:10` declares
 * `Kind ≜ {fragment, agent, rule, skill}`. S ⊃ G ⇒ DEFECT, so `'hook'` is GONE and
 * **MODEL IS NOT AMENDED**. The cheap direction was to add `hook` to MODEL — which
 * would have deleted the corpus's own best-argued type comment
 * (`schema/src/hook-cell.ts:6-10`: a hook *"is what a HARNESS calls its mechanism;
 * it is not a Kind of thing the canon authors"*), contradicted the same file's
 * classing of the cell as `Kind ∋ rule`, and overwritten `MODEL.md:20`, which
 * convicts this exact error by name (*"binding them made `hook` a Kind and hid
 * enforcement from composition"*). It would have converted a defect into ground.
 *
 * A hook cell therefore enters `accept()` as `kind:'rule'` — its MODEL Kind, with
 * `activation: rule ↦ scope`. What distinguishes the two source FAMILIES is a HOME
 * id (`hook/<id>` vs `rule/<id>`), which is a different thing from a Kind and
 * stays: PARTITIONED quantifies over homes and needs them distinguishable.
 *
 * The gate: `canon/test/ground-conformance.test.ts`, which parses `Kind ≜ {…}` out
 * of `MODEL.md` itself and asserts `⊆` — never `=`, so refinement stays legal.
 */
export interface AcceptCell {
  /** MODEL's `class(a)`. `Kind ≜ {fragment, agent, rule, skill}` — see above. */
  readonly kind: 'fragment' | 'agent' | 'skill' | 'rule';
  /** α(c) — the assigned anchor (the SIGN). */
  readonly slug: string;
  /**
   * The dimension that qualifies this concept. A concept's IDENTITY is dimension-scoped:
   * `document` as output-format and `document` as role are DISTINCT concepts that
   * legitimately share a bare sign, disambiguated by dimension (as agent vectors do:
   * `role document` vs `output-format document`). Absent ⇒ the bare slug is the id.
   */
  readonly dimension?: string;
  /**
   * D(c) — the definiens (the core σ* fragment). Sourced TYPED from the IR field,
   * NEVER fence-scraped: a dimension value's branded string, a skill's `formalBlock`
   * (`SkillExpression` — see `acceptCellOfSkill`), or an agent's `archetype`. Each is a
   * branded string, so `string` is the widest home; the skill bridge keeps the payload
   * the typed IR field, not a markdown scrape.
   *
   * `definiens`, NOT `residue`, AND THAT IS DELIBERATE (ruled 2026-08-05, when
   * `RuleCell.definiens` was renamed to `RuleCell.residue`). `MODEL.md:50` —
   * `residue(c) = D(c) ∖ fired(α(c))` — makes the two DIFFERENT OBJECTS across one
   * subtraction. This field is the witness INPUT: the un-adjudicated `D` that
   * `parsimonious()` below reads in order to decide, for itself, what `fired(α)`
   * already covers. Naming it `residue` would assert the verdict in the parameter and
   * leave that leg reading as a check that a residue is a residue.
   *
   * A CELL's authored payload is the other side: `HookCell.residue`,
   * `RuleCell.residue` — post-subtraction by construction, because PARSIMONIOUS
   * quantifies over them. Lifting one in here (`definiens: c.residue`, as
   * `canon/test/hook-rule-boundary.test.ts` does) is not a rename bridge; it is the
   * strictest reading available, since the leg must then find nothing left to subtract.
   */
  readonly definiens: string;
  /** The anchors this cell references (imports · `ref` · composition). */
  readonly refs: readonly string[];
}

/** A concept's home-map identity — dimension-qualified when the dimension is known. */
export function conceptKey(
  cell: Pick<AcceptCell, 'slug' | 'dimension'>,
): string {
  return cell.dimension ? `${cell.dimension}/${cell.slug}` : cell.slug;
}

/**
 * The typed bridge: a forge `Skill` IR cell → the `AcceptCell` grain the static legs
 * read. The skill's PARSIMONIOUS definiens IS its `formalBlock` (`SkillExpression`) —
 * the sole σ* payload — consumed as the typed IR field, NEVER a fence-scraped body.
 * The σ_human* `description` is not σ* and never becomes a definiens (E2a un-gating).
 */
export function acceptCellOfSkill(
  skill: Pick<Skill, 'name' | 'formalBlock'>,
  refs: readonly string[] = [],
): AcceptCell {
  const formalBlock: SkillExpression = skill.formalBlock;
  return { kind: 'skill', slug: skill.name, definiens: formalBlock, refs };
}

/** concept-anchor → its home cell-ids (the partition the corpus induces). */
export type Homes = ReadonlyMap<string, readonly string[]>;

/** A deploy Target — REGENERABLE quantifies over these, not over source cells. */
export interface Target {
  readonly path: string;
  /** ∃c,adapter: t=deploy(c,adapter) — produced by deploy, not hand-authored. */
  readonly deployOwned: boolean;
  /** a hand-edit escaped the projector (¬hand-edit is required). */
  readonly handEdited: boolean;
  /** t ∈ SelfAuthored{SEM,PROC,EPIS} — must never be a deploy Target. */
  readonly selfAuthored: boolean;
}

export interface LegVerdict {
  readonly leg: Leg;
  readonly pass: boolean;
  /** '' when pass; the named signal(s) when convicted. */
  readonly reason: string;
}

// ── shared lexis ──────────────────────────────────────────────────────────────

/** Well-formed sign: shortlex kebab (σ* is a well-formed fittest sign). */
const KEBAB = /^[a-z][a-z0-9]*(?:-[a-z0-9]+)*$/;

/**
 * External-cite markers — a fragment that leans on an OUTSIDE reference cannot
 * ground in `inline-≜ ∪ Corpus ∪ LLM-priors` alone (MODEL `¬external-cite`), so
 * it fails blind. The static floor under COLD-BLIND (the live oracle is the
 * authority: `decode_cold(core f) = intent(f)`).
 */
const EXTERNAL_CITE: ReadonlyArray<readonly [string, RegExp]> = [
  ['url', /\bhttps?:\/\//i],
  ['section-ref', /§\s*\d/],
  ['rfc', /\bRFC[-\s]?\d/i],
  ['numeric-citation', /\[\d+\]/],
  ['et-al', /\bet al\.?/i],
  ['ibid', /\bibid\b/i],
  [
    'see-doc',
    /\bsee\b[^.]*\b(doc|document|spec|specification|section|manual|paper)\b/i,
  ],
];

/** The anchor's own lexical tokens — a proxy for fired(α)'s core field. */
function slugTokens(slug: string): string[] {
  return slug.split('-').filter((t) => t.length > 0);
}

// ── the five per-cell / partition witnesses ─────────────────────────────────────

/**
 * CANONICAL — ∀c∈concepts(a): ¬orphan ∧ ¬private ∧ ¬palimpsest. Static reading:
 * every anchor the cell REFERENCES resolves to a home (¬orphan/¬private), and the
 * body carries no superseded framing layer (¬palimpsest). Duplicate-home is NOT
 * here — that is PARTITIONED's sole jurisdiction (DRY/MECE). The palimpsest token
 * table is CORPUS DATA (`policy.palimpsestTokens`), injected — never baked here.
 */
export function canonical(
  cell: AcceptCell,
  homes: Homes,
  policy: Policy,
): LegVerdict {
  const orphans = cell.refs.filter((r) => !homes.has(r));
  // palimpsest — retired framing residue (superseded semantic layer left in body).
  const palimpsest = policy.palimpsestTokens.filter(([, re]) =>
    re.test(cell.definiens),
  );
  const reasons: string[] = [];
  if (orphans.length > 0) {
    reasons.push(`orphan-ref(${orphans.join(',')})`);
  }
  if (palimpsest.length > 0) {
    reasons.push(`palimpsest(${palimpsest.map(([k]) => k).join(',')})`);
  }
  return {
    leg: 'CANONICAL',
    pass: reasons.length === 0,
    reason: reasons.join(' · '),
  };
}

/**
 * SIGNIFIED — α(c)=σ*(c). Static FLOOR: α is a well-formed sign (shortlex kebab);
 * a sign that is not even well-formed is provably ≠ σ* (σ* is a well-formed
 * fittest sign). The σ* circumscription itself — do the anchor's fired priors
 * pick out exactly this concept? — is the live oracle's judgment (`oracle.ts`),
 * empirically anchored by the nonce positive control (a sign firing NO
 * circumscribing prior cannot be σ*). NB: |home(α)|>1 is PARTITIONED's leg (one
 * concept, many homes), NOT an injectivity failure here (which is two distinct
 * concepts colliding on one anchor — a concept-identity judgment, oracle-side).
 */
export function signified(cell: AcceptCell): LegVerdict {
  const pass = KEBAB.test(cell.slug);
  return {
    leg: 'SIGNIFIED',
    pass,
    reason: pass ? '' : `malformed-sign('${cell.slug}')`,
  };
}

/**
 * COLD-BLIND — decode_cold(core f) = intent(f). Static FLOOR: the fragment does
 * not lean on an external cite (a fragment that needs an outside reference is not
 * self-sufficient and fails blind). The AUTHORITY is the live oracle
 * (`oracle.ts`): a cold, isolated, priors-only decode must recover intent.
 */
export function coldBlindStatic(cell: AcceptCell): LegVerdict {
  const hits = EXTERNAL_CITE.filter(([, re]) => re.test(cell.definiens));
  return {
    leg: 'COLD-BLIND',
    pass: hits.length === 0,
    reason: hits.length
      ? `external-cite(${hits.map(([k]) => k).join(',')})`
      : '',
  };
}

/**
 * PARTITIONED — ∀c: |home(c)|=1 ∧ disjoint(homes) ∧ ⋃home=Corpus. Per-cell view:
 * this cell's anchor has exactly one home. (Coverage/disjointness are asserted
 * corpus-wide by the caller over the full `homes` map.)
 */
export function partitioned(cell: AcceptCell, homes: Homes): LegVerdict {
  const key = conceptKey(cell);
  const bearers = homes.get(key) ?? [];
  const pass = bearers.length === 1;
  return {
    leg: 'PARTITIONED',
    pass,
    reason: pass
      ? ''
      : `|home('${key}')|=${bearers.length} (${bearers.join(',')})`,
  };
}

/**
 * PARSIMONIOUS — body(c)=⟨α(c),residue(c)⟩ ∧ residue=D∖fired(α). Static proxy: the
 * body must not re-emit the anchor's own lexical field (residue ⊇ fired(α) ⇒ the
 * gloss restates the name the reader already decoded). A leading self-restatement
 * is the crisp convictable signature; the full residue=D∖fired subtraction is the
 * oracle's finer judgment.
 */
export function parsimonious(cell: AcceptCell): LegVerdict {
  const restated = slugTokens(cell.slug).filter((t) =>
    new RegExp(`\\b${t}\\b`, 'i').test(cell.definiens),
  );
  return {
    leg: 'PARSIMONIOUS',
    pass: restated.length === 0,
    reason: restated.length ? `restates-α(${restated.join(',')})` : '',
  };
}

/**
 * REGENERABLE — ∀t∈Target: t=deploy(c) ∧ deterministic ∧ deploy-owned ∧ ¬hand-edit
 * ∧ SelfAuthored∉Target ∧ ¬deploy-writes(SelfAuthored). Global over the Target set.
 */
export function regenerable(targets: readonly Target[]): LegVerdict {
  const bad = targets.flatMap((t) => {
    const f: string[] = [];
    if (t.selfAuthored) {
      f.push(`self-authored∈Target(${t.path})`);
    }
    if (t.handEdited) {
      f.push(`hand-edited(${t.path})`);
    }
    if (!t.deployOwned) {
      f.push(`¬deploy-owned(${t.path})`);
    }
    return f;
  });
  return {
    leg: 'REGENERABLE',
    pass: bad.length === 0,
    reason: bad.join(' · '),
  };
}

// ── ENFORCED ─────────────────────────────────────────────────────────────────

/** One (enforcing fragment → agent) obligation the source register DECLARES. */
export interface EnforcedObligation {
  /** α of the enforcing fragment — `enforcing(f) ⇔ events(f) ≠ ∅`. */
  readonly fragment: string;
  /** The agent whose `ir(a)` composes it. Composition IS the scope. */
  readonly agent: string;
}

/** One mechanism the projection actually EMITTED, and for whom. */
export interface EmittedMechanism {
  readonly fragment: string;
  readonly agent: string;
  /**
   * `scoped(mechanism(f,adapter), a)` — the mechanism reaches THIS agent and no
   * other. False ⇒ ambient: emitted globally and narrowed (if at all) by a
   * runtime self-filter, which MODEL rejects outright.
   */
  readonly scoped: boolean;
}

/**
 * ENFORCED — `enforcing(f) ∧ f ∈ ir(a) ⇒ scoped(mechanism(f,adapter), a)`.
 *
 * The leg MODEL declares and `accept()` did not implement. Its absence is not a
 * missing nicety: without it a cell passes the gate while declaring a bound that
 * projects to nothing, and MODEL states the consequence itself —
 *
 *   *a declared bound that projects to nothing is INDISTINGUISHABLE from an
 *   undeclared one*
 *
 * Two convicting shapes, and the second is the reason `¬ ambient` is written into
 * MODEL:
 *
 *  1. **UNPROJECTED** — declared in the source register, no mechanism emitted for
 *     that agent. The bound reads as real and enforces nothing.
 *  2. **AMBIENT** — a mechanism was emitted, but not scoped to the agent that
 *     composed it. It governs everyone or is narrowed at runtime by the
 *     mechanism's own self-filter, which is the fragile-pointcut failure:
 *     the scope lives in the enforcement code, invisible from the agent, and goes
 *     stale silently.
 *
 * Global over the (obligation, emission) sets rather than per-cell, exactly like
 * `regenerable` — a single cell cannot witness its own projection. Doctrine-free:
 * both sets are supplied by the caller, which owns the adapter and the corpus.
 */
export function enforced(
  declared: readonly EnforcedObligation[],
  emitted: readonly EmittedMechanism[],
): LegVerdict {
  const key = (o: { fragment: string; agent: string }) =>
    `${o.fragment}→${o.agent}`;
  const byKey = new Map(emitted.map((e) => [key(e), e]));
  const bad: string[] = [];
  for (const o of declared) {
    const hit = byKey.get(key(o));
    if (hit === undefined) {
      bad.push(`unprojected(${key(o)})`);
    } else if (!hit.scoped) {
      bad.push(`ambient(${key(o)})`);
    }
  }
  return {
    leg: 'ENFORCED',
    pass: bad.length === 0,
    reason: bad.join(' · '),
  };
}

// ── the composite ────────────────────────────────────────────────────────────

/**
 * The per-cell Universal verdicts (CANONICAL·SIGNIFIED·COLD-BLIND·PARTITIONED·
 * PARSIMONIOUS). REGENERABLE is global (`regenerable`) — a cell has no Target
 * of its own — so it is folded in by the caller with the deploy Target set. The
 * injected `policy` carries the corpus DATA the legs read (palimpsest tokens).
 */
export function universalCell(
  cell: AcceptCell,
  homes: Homes,
  policy: Policy,
): LegVerdict[] {
  return [
    canonical(cell, homes, policy),
    signified(cell),
    coldBlindStatic(cell),
    partitioned(cell, homes),
    parsimonious(cell),
  ];
}

/** The legs a verdict list convicts (∅ ⇒ every leg passes). */
export function failingLegs(verdicts: readonly LegVerdict[]): Leg[] {
  return verdicts.filter((v) => !v.pass).map((v) => v.leg);
}

// ── COMPOSED — the agent-only conjunct (light; tsc enforces dimension/arity) ────────

/** An agent composite: dimension → selected value-anchors, in source order. */
export interface AgentComposite {
  readonly name: string;
  readonly selection: ReadonlyMap<string, readonly string[]>;
}

/**
 * COMPOSED(a) — ∄ superfluous S_on (a value selected twice in one dimension is
 * redundant). Arity ∈ NatSet and value ∈ catalog are TYPE-enforced upstream
 * (`@cratylus/schema` — wrong dimension/arity = a compile error); this
 * catches the one class types miss: a duplicated selection within a dimension set.
 */
export function composed(agent: AgentComposite): {
  pass: boolean;
  reason: string;
} {
  const dups: string[] = [];
  for (const [dimension, values] of agent.selection) {
    const seen = new Set<string>();
    for (const v of values) {
      if (seen.has(v)) {
        dups.push(`${dimension}:${v}`);
      }
      seen.add(v);
    }
  }
  return {
    pass: dups.length === 0,
    reason: dups.length ? `superfluous(${dups.join(',')})` : '',
  };
}
