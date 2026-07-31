// ─────────────────────────────────────────────────────────────────────────────
// The agent anatomy as a TypeScript type system.
//
// THIS MODULE IS THE ANATOMY CONTRACT. A dimension value is a per-dimension **nominal-
// branded string** — the MODEL address shape: `body(c) = ⟨α(c), residue(c)⟩`, the
// anchor plus the leftover the anchor does not already fire (residue ∅ for a true
// σ*). VISION: _address, don't describe._ There is NO `{dimension,slug,definiens}`
// value object, NO per-value phantom metadata — the string carries the body; the
// module's directory (`dimensions/<dimension>/`) is its dimension home (PARTITIONED) and its
// export name is its anchor α (SIGNIFIED).
//
// agent-canon authors dimension values / agents / skills as typed modules that import
// these types. Composition is ESM `import`; an agent is a flat, explicit dimension
// vector (`null` = omit-to-inherit — see `Agent`). A wrong dimension→value or a wrong
// arity is a **compile error** — the brand keys each string to its dimension so an
// `Actions` cannot be assigned where an `Objective` is expected.
//
// Exported from `@leclabs/agent-forge/anatomy` — a sibling subpath to the config-IR
// `Agent`/`Skill` in `@leclabs/agent-forge` (those are the translation shapes; THESE
// are the dimension-selection shapes — distinct concepts, distinct homes).
// ─────────────────────────────────────────────────────────────────────────────

import type { RuntimePlugin } from '@leclabs/agent-runtime';
import type { HookEvent, HookSubstrate } from './hook-cell.js';

// ── Type-level metadata axes ────────────────────────────────────────────────

/** The MECE filing axis: how the agent comes across vs what it is inclined to do. */
export type Genus = 'Persona' | 'Constitution';

/**
 * A runtime CAPABILITY name — DISCOVERED from S1's `RuntimePlugin` port keys
 * (`memory` · `eventTap`), never coined here (cratylism): the runtime contract is
 * the sole home of the capability set, and a `Skill.runtime` declaration selects
 * one of its ports. This is the ONLY reach across the BUILD→RUNTIME seam and it is
 * type-only — the build DAG stays forge→runtime, acyclic (runtime NEVER →forge). */
export type RuntimeCapability = keyof Omit<RuntimePlugin, 'name'>;

/**
 * How a dimension's value-catalog is sourced:
 * - `enum`   — a member of the model's own native value set (blind introspection).
 * - `open`   — named per-agent; where identity lives.
 * - `coined` — a closed, corpus-authored catalog of canonical directives.
 */
export type Classification = 'enum' | 'open' | 'coined';

/** Whether a dimension field holds one value (`scalar`) or many (`set`). */
export type Arity = 'scalar' | 'set';

/**
 * The 22 FRAGMENT-dimension names — the dimensions whose value is a branded-string cell.
 * `archetype` and `provenance` are NOT here: archetype is a plain-string description on
 * the agent (D13) and provenance is the structured `{mark}` on the agent (D3); both
 * carry data, not a σ* residue, so neither is a value-fragment dimension.
 */
/**
 * Every fragment dimension — DERIVED from `ANATOMY`, never listed twice.
 *
 * This was a hand-written union, one of FIVE hand-kept copies of the same design
 * fact (with `SetDimension`, the `Agent` fields, `DIMENSION_FIELD` and `ANATOMY`
 * itself). Four of them could drift from the fifth silently, and the comment on
 * `DIMENSION_FIELD` already argued against being a second copy while being one.
 * `ANATOMY` is now the single home: add a dimension there and every derivation
 * below follows, or fails to compile.
 */
export type Dimension = keyof typeof ANATOMY;

// ── The provenance mark ─────────────────────────────────────────────────────

/** The emoji·hue mark an agent carries (drives its color). Data, not a σ* value. */
export interface Mark {
  readonly emoji: string;
  /** Hue token (e.g. `green`), resolved to a terminal color by `markToColor`. */
  readonly hue: string;
}

// ── Per-dimension value types (branded strings) ─────────────────────────────────
// A dimension value is a bare named σ* expression: `export const x: Objective = '…'`.
// Each per-dimension type is a nominal-branded `string` — the phantom `__dimension` brand
// keys the string to its dimension so `tsc` rejects a cross-dimension assignment. The
// value's content is the body ⟨α, residue⟩ (rendered `α ≜ residue`, or just `α`
// for a true σ* whose residue is ∅).

/**
 * A branded fragment string, keyed to dimension `O`.
 *
 * `O extends string`, NOT `O extends Dimension` — and DO NOT re-tighten it. The
 * brand discriminates by the type ARGUMENT, not by the constraint: a
 * `Fragment<'guardrails'>` is refused where a `Role` is wanted because the
 * `__dimension` properties are incompatible, which holds for any string literal.
 * Measured, not assumed — both the cross-dimension refusal and the `required`
 * catch-all survive the relaxation intact.
 *
 * The constraint's ONLY job was catching a misspelled dimension name
 * (`Value<'guardrials'>`). That check MOVES to the corpus, which owns the catalog
 * and derives its own `Dimension` from it — the projector cannot be the home of
 * WHICH dimensions exist and still be projecting a design rather than containing
 * one. Nothing here is lost in the meantime that the corpus does not restore.
 *
 * Forge's internals never needed it: `project/index.ts` writes `Value<Dimension>`
 * to mean "a value of ANY dimension", and nothing in forge branches on a
 * dimension's identity. The machinery is already structural; this states it.
 */
type Fragment<O extends string> = string & { readonly __dimension?: O };

/**
 * WHERE an enforcing value binds — the agents that compose it, and nothing else.
 *
 * The `PolicyBinding` face. The rule and its mechanism stay fused in one authored
 * cell; SCOPE is the part that separates, and it is DERIVED from `ir(a)` rather
 * than authored. That direction is the whole point: scope written into the
 * enforcement code is invisible from the agent it governs and goes stale
 * silently — the fragile-pointcut failure, whose defining property is that an
 * out-of-date selector "will silently malfunction, as the non-advising of a join
 * point does not manifest a syntax or type error."
 *
 * A `Binding` cannot be constructed without both halves, so a fragment can never
 * be emitted with its scope missing — the failure mode that reads as "governs
 * everything" or "governs nothing" depending on which way the mechanism fails.
 */
export interface Binding {
  /** The anchor α of the enforcing value this binds. */
  readonly anchor: string;
  /** The enforcing value itself — declaration + substrate + events. */
  readonly fragment: Enforcing<Dimension>;
  /** Agents whose `ir(a)` composes it. DERIVED; sorted for byte-stable output. */
  readonly agents: readonly string[];
}

/**
 * A fragment that carries its OWN enforcement — MODEL's `events : fragment ⇀
 * ℘(Event) ⟨PARTIAL⟩`, realized as the shape a value takes when it is in the
 * function's domain.
 *
 * ONE artifact, TWO FACES. `body` is the declaration: inline, read by the same
 * reasoning it governs, and the `accept()` target. `substrate` + `events` are
 * where it binds. Two independently-authored artifacts would guarantee silent
 * divergence, and a declaration that overstates what is enforced is worse than
 * no declaration — it manufactures trust in an invariant that does not exist.
 * So the two faces are one authored unit and cannot drift apart.
 *
 * The declaration is not decoration on the mechanism. An agent that cannot see
 * the rule burns turns discovering it by rejection, and may satisfy the enforcer
 * while violating its intent; publication is what makes a refusal legible rather
 * than an opaque wall.
 *
 * `substrate` is REQUIRED alongside `events` because the pair is one fact: the
 * refusal law is substrate-relative (an event belonging to another substrate is
 * routed, not refused), and it cannot be evaluated from the events alone.
 *
 * What is NOT here: the MECHANISM (project register — `realize(c,adapter)` emits
 * it) and the SCOPE (derived from composition — see `Binding`). A source cell is
 * harness-innocent by construction; that is what makes one BEING projectable to
 * many FACES.
 */
export interface Enforcing<O extends string> {
  /** The inline declaration — the σ* body ⟨α, residue⟩ this value would be if bare. */
  readonly body: Fragment<O>;
  /** Which substrate the events fire in — the `realize`-target family. */
  readonly substrate: HookSubstrate;
  /** The harness-agnostic events that bind it (≥1 — an empty set is not enforcing). */
  readonly events: readonly [HookEvent, ...HookEvent[]];
  /**
   * The mechanism this value is realized BY — an ANCHOR, never the mechanism.
   *
   * MODEL: `mechanism : fragment × harness-adapter ⇀ harness-mechanism ⟨what
   * deploy EMITS⟩`. A command, a timeout, a matcher or worker bytes are all
   * PROJECT-register content; MODEL puts exactly two things on a fragment,
   * `events` and `substrate`. They were briefly carried here and that broke
   * BEING/FACE — a being holding one face's shell script cannot have many faces.
   *
   * Absent ⇒ the anchor α of this value is its own mechanism key.
   */
  readonly realizedBy?: string;
  /** Anchors this value references — the CANONICAL orphan-ref witness. */
  readonly refs?: readonly string[];
}

/**
 * A dimension VALUE: a bare declaration, or one that enforces itself.
 *
 * The union is what makes `events` PARTIAL. Every existing value stays a bare
 * branded string and compiles untouched; only a value that opts in carries the
 * enforcing shape.
 */
export type Value<O extends string> = Fragment<O> | Enforcing<O>;

/**
 * `enforcing(f) ⇔ events(f) ≠ ∅` — DERIVED, never stored.
 *
 * There is deliberately no boolean `enforcing` field: a derived predicate cannot
 * disagree with the data, and two fields can. Non-emptiness is carried by the
 * tuple type, so presence of the shape IS the predicate.
 */
export const enforcing = <O extends string>(v: Value<O>): v is Enforcing<O> =>
  typeof v === 'object' &&
  v !== null &&
  typeof (v as Enforcing<O>).body === 'string' &&
  Array.isArray((v as Enforcing<O>).events);

/**
 * Is `u` a dimension value at all — bare or enforcing?
 *
 * The catalog scans whole modules and sees every export, so "not a string" was
 * doing double duty as "not a value". Now that a value may be an object, that
 * test would admit any exported object and drop every enforcing one. This is the
 * predicate that actually means what the scan needs, and it is SHAPE-checked
 * rather than truthy-checked: an object that merely exists is not a value.
 */
export const isDimensionValue = (u: unknown): u is Value<Dimension> =>
  typeof u === 'string' || enforcing(u as Value<Dimension>);

/** The declaration face of a value, enforcing or not — what the SOUL renders. */
export const bodyOf = <O extends string>(v: Value<O>): Fragment<O> =>
  enforcing(v) ? v.body : v;

/**
 * The anchor α of a value — the stable name, the body minus its residue.
 *
 * A body is `⟨α, residue⟩`, rendered `α ≜ residue`, or bare `α` when the residue
 * is ∅ (the ideal σ*). This is the one home for that split: keying anything on a
 * body means keying on text that a fold may rewrite, whereas α is what the value
 * IS. A bare anchor returns itself — absence of ` ≜ ` means residue ∅, never that
 * the anchor is missing.
 */
export const anchorOf = <O extends string>(v: Value<O>): string => {
  const body = bodyOf(v);
  const i = body.indexOf(' ≜ ');
  return i < 0 ? body : body.slice(0, i);
};

/**
 * Replace a value's declaration face, PRESERVING any enforcement binding.
 *
 * The resolver's fold substitutes authored bodies for composed ones. A body is a
 * declaration; `substrate`/`events` are not, and must survive the substitution
 * untouched — folding a value must never silently unbind it. This is the whole
 * reason the fold cannot simply treat a value as a string any more.
 */
export const withBody = <O extends string>(
  v: Value<O>,
  body: Fragment<O>,
): Value<O> => (enforcing(v) ? { ...v, body } : body);

// Persona
export type Autonomy = Value<'autonomy'>;
export type Role = Value<'role'>;
export type Formality = Value<'formality'>;
export type AudienceAdaptation = Value<'audience-adaptation'>;
export type Transparency = Value<'transparency'>;

// Constitution — standing drives
export type Objective = Value<'objective'>;
export type Guardrails = Value<'guardrails'>;
export type EngineeringPrinciples = Value<'engineering-principles'>;
export type Heuristics = Value<'heuristics'>;
export type Capabilities = Value<'capabilities'>;
export type Learning = Value<'learning'>;
export type SituationAwareness = Value<'situation-awareness'>;

// Constitution — apparatus
export type Actions = Value<'actions'>;
export type Modalities = Value<'modalities'>;
export type Model = Value<'model'>;
export type Memory = Value<'memory'>;

// Constitution — per-turn act
export type Trigger = Value<'trigger'>;
export type Framing = Value<'framing'>;
export type ReasoningStrategy = Value<'reasoning-strategy'>;
export type Satisficing = Value<'satisficing'>;
export type OutputFormat = Value<'output-format'>;
export type SelfEvaluation = Value<'self-evaluation'>;

/**
 * The SET dimensions — the only dimensions whose `Agent` field is an array.
 * (autonomy · guardrails · capabilities · actions · heuristics · engineering-principles)
 */
/** The dimensions holding MANY values — derived from `ANATOMY`'s `arity`, so a
 *  dimension's arity is stated once and cannot disagree with itself. */
export type SetDimension = {
  [D in Dimension]: (typeof ANATOMY)[D]['arity'] extends 'set' ? D : never;
}[Dimension];

/** The dimensions an agent may NOT omit — derived from `ANATOMY`'s `required`. */
export type RequiredDimension = {
  [D in Dimension]: (typeof ANATOMY)[D] extends { required: true } ? D : never;
}[Dimension];

// ── The runtime dimension descriptor (axis / kind / arity) ──────────────────────
// A consumer that needs a dimension's metadata at runtime (e.g. `agent-forge catalog`)
// reads `ANATOMY` — the single home for dimension genus/classification/arity. The keyed
// object type forces every one of the fragment dimensions to be present (a missing
// dimension is a compile error; an extra key has no declared type and is rejected).

/** The runtime-readable metadata for one dimension (axis = genus). */
export interface DimensionMeta {
  /** The MECE filing axis (the `Genus` of the dimension's values). */
  readonly axis: Genus;
  /** How the value-catalog is sourced (the `Classification`). */
  readonly kind: Classification;
  /** Whether the dimension field holds one value or many (the `Arity`). */
  readonly arity: Arity;
  /**
   * May an agent OMIT this dimension? Absent ⇒ omittable (`| null`, inherit).
   *
   * Catalog DATA, not a type-level special case. Whether the ideal agent may
   * exist without a given dimension is a canon question, and the one dimension
   * that answers "no" — `guardrails` — used to answer it as a hand-written
   * exception inside the `Agent` interface, i.e. a doctrine the canon stated and
   * the projector enforced with no link between them.
   */
  readonly required?: boolean;
}

/**
 * The one runtime home for dimension metadata — `agent-forge catalog` reads it, never a
 * second hand-kept copy. Keyed by dimension so a missing/extra dimension is a compile error.
 */
export const ANATOMY = {
  // Persona
  autonomy: { axis: 'Persona', kind: 'enum', arity: 'set' },
  role: { axis: 'Persona', kind: 'open', arity: 'scalar' },
  formality: { axis: 'Persona', kind: 'enum', arity: 'scalar' },
  'audience-adaptation': { axis: 'Persona', kind: 'enum', arity: 'scalar' },
  transparency: { axis: 'Persona', kind: 'enum', arity: 'scalar' },
  // Constitution — standing drives
  objective: { axis: 'Constitution', kind: 'open', arity: 'scalar' },
  // `required` — this dimension may NOT be omitted. The catch-all against
  // attachment failing open: an agent composed with no bound is not a lesser
  // agent, it is an unconfined one. Stated HERE, as catalog data, because
  // "may this be omitted?" is a fact about the dimension exactly as `arity` is.
  // It was previously a hand-written exception in the `Agent` interface, which
  // put a canon doctrine somewhere the canon could not reach.
  guardrails: {
    axis: 'Constitution',
    kind: 'coined',
    arity: 'set',
    required: true,
  },
  'engineering-principles': {
    axis: 'Constitution',
    kind: 'coined',
    arity: 'set',
  },
  heuristics: { axis: 'Constitution', kind: 'coined', arity: 'set' },
  capabilities: { axis: 'Constitution', kind: 'open', arity: 'set' },
  learning: { axis: 'Constitution', kind: 'enum', arity: 'scalar' },
  'situation-awareness': {
    axis: 'Constitution',
    kind: 'enum',
    arity: 'scalar',
  },
  // Constitution — apparatus
  actions: { axis: 'Constitution', kind: 'enum', arity: 'set' },
  modalities: { axis: 'Constitution', kind: 'enum', arity: 'scalar' },
  model: { axis: 'Constitution', kind: 'enum', arity: 'scalar' },
  memory: { axis: 'Constitution', kind: 'enum', arity: 'scalar' },
  // Constitution — per-turn act
  trigger: { axis: 'Constitution', kind: 'enum', arity: 'scalar' },
  framing: { axis: 'Constitution', kind: 'open', arity: 'scalar' },
  'reasoning-strategy': { axis: 'Constitution', kind: 'enum', arity: 'scalar' },
  satisficing: { axis: 'Constitution', kind: 'enum', arity: 'scalar' },
  'output-format': { axis: 'Constitution', kind: 'enum', arity: 'scalar' },
  'self-evaluation': { axis: 'Constitution', kind: 'enum', arity: 'scalar' },
} as const satisfies Record<string, DimensionMeta>;

/** Every fragment-dimension name, in anatomy (Persona-then-Constitution) declaration order. */
export const DIMENSION_NAMES = Object.keys(ANATOMY) as readonly Dimension[];

/** kebab-case → camelCase, at the type level. The bridge between a dimension's
 *  NAME (how the canon files it) and its FIELD (how a vector carries it). */
export type KebabToCamel<S extends string> = S extends `${infer H}-${infer T}`
  ? `${H}${Capitalize<KebabToCamel<T>>}`
  : S;

/** The vector field a dimension occupies — derived, never transcribed. */
export type DimensionFieldName<D extends Dimension = Dimension> =
  KebabToCamel<D>;

/** kebab → camel at RUNTIME, the exact operation `KebabToCamel` performs at the
 *  type level. One rule, both registers, so the map cannot disagree with itself. */
export const kebabToCamel = <S extends string>(s: S): KebabToCamel<S> =>
  s.replace(/-(\w)/g, (_, c: string) => c.toUpperCase()) as KebabToCamel<S>;

// ── The Agent: a typed dimension-selection vector ───────────────────────────────

/**
 * An agent as a selection over the anatomy: a FLAT, explicit dimension vector
 * (depth 1 — composition over inheritance). Scalar dimension fields hold ONE branded
 * value; the six set dimensions hold arrays. Arity is enforced by the field types.
 *
 * Every dimension key is REQUIRED (completeness law). A scalar dimension's value is a
 * concrete branded string **or `null`** (explicit omit-to-inherit — do NOT project
 * this dimension; inherit whatever the harness provides). `null` on a set dimension omits
 * the whole section. `archetype` and `provenance` are NOT fragment dimensions: archetype is
 * a plain identity description, provenance the structured `{mark}` (or null).
 */
/**
 * Every dimension field an agent carries, DERIVED from `ANATOMY` — the fourth and
 * last of the five hand-kept copies of the dimension set.
 *
 * Arity and nullability come from the catalog, so the three facts about a
 * dimension (is it multi-valued · may it be omitted · what is it called) are
 * stated exactly once, where the dimension is declared.
 *
 * THE GUARDRAILS CATCH-ALL SURVIVES, and is now `required: true` in `ANATOMY`
 * rather than a hand-written exception here. Attachment-based governance fails
 * OPEN — Spring Security prescribes a catch-all authorization rule for
 * unannotated methods; AppArmor runs unprofiled tasks "in an unconfined state".
 * Two unrelated systems, one weakness, both prescribing a catch-all underneath.
 * Ours remains stronger than either because it is `tsc` rather than a runtime
 * backstop: an agent composed without a bound does not compile. What changed is
 * only WHERE the doctrine lives — it is canon data the catalog carries, not a
 * projector-side special case the canon could not reach.
 */
export type DimensionFields = {
  readonly [D in Dimension as DimensionFieldName<D>]: D extends SetDimension
    ? D extends RequiredDimension
      ? readonly Value<D>[]
      : readonly Value<D>[] | null
    : D extends RequiredDimension
      ? Value<D>
      : Value<D> | null;
};

export interface Agent extends DimensionFields {
  /** The agent's name (its module / deploy identity). */
  readonly name: string;
  /** σ_human* — the human-read one-line selection bound → SOUL frontmatter
   *  `description:` the subagent-router reads (NOT σ*). The one-level-up twin of
   *  the skill `description`. */
  readonly description: string;
  /** OPTIONAL doctrine-AGNOSTIC leading block, emitted VERBATIM above `## Archetype`
   *  by `agentBody`. The engine knows only "a leading block"; a consumer fills it
   *  (agent-canon injects its founding doctrine so the axiom rides every SOUL,
   *  intrinsic to the projected bytes rather than ambient repo context). Absent ⇒
   *  omitted. */
  readonly preamble?: string;
  /** σ* — the model-read identity body → SOUL body. A plain string, not a branded
   *  fragment-dimension (D13), but σ* content nonetheless. */
  readonly archetype: string;
  /** The emoji·hue mark (drives color) — data, not a fragment (D3). */
  readonly provenance: { readonly mark: Mark } | null;
}

// ── The Skill: a self-sufficient set-builder cell ───────────────────────────

/**
 * A skill's σ* payload string — the self-sufficient set-builder block. A nominal-
 * branded `string` with the SAME shape as `Fragment<O>` (optional phantom brand,
 * so a plain string literal still assigns): keys the notation to its role so `tsc`
 * rejects a raw string where a skill's formal block is expected.
 */
export type SkillExpression = string & { readonly __skillExpr?: true };

/** How a skill cell deploys, beyond the default agent-resident projection. */
export interface SkillDeploy {
  /** Deploy as a host `skills/<name>/` directory (the `memory`-style cell). */
  readonly deployAs?: 'skill-dir';
  /**
   * Committed companion assets, staged by `deploy --assets` ONLY.
   *
   * NOT projected: `projectPluginSet` never reads this field, so a render tree
   * carries no assets and a consumer who never passes `--assets` ships none. The
   * field previously advertised "shipped byte-for-byte with the skill", which
   * overstated a guarantee nothing enforced — the bridge that would have honoured
   * it (event-tap T2) was abandoned once the runtime thin shim covered every
   * motivating case, and `runtime` below is what replaced it. Zero cells declare
   * `assets` today. Kept because `deploy/bundle.ts` still honours it.
   */
  readonly assets?: readonly string[];
  /**
   * The RUNTIME capability this skill is a face of. When set, the projection ALSO
   * emits a THIN SHIM `scripts/<capability>.mjs` that forwards to the host-installed
   * `agent-runtime <capability>` CLI — NOT a bundle of the impl (the capability logic
   * lives host-side behind the runtime port, installed per-host by agent-runtime/S7).
   * Absent ⇒ SKILL.md only (unchanged). This REVERSES the superseded dep-free-bundle
   * design (skills-refactor T4). */
  readonly runtime?: { readonly capability: RuntimeCapability };
}

/**
 * A skill cell: its σ* formal block plus the live sibling skills it composes. The
 * name is the anchor (trigger `= /`+name; verb derivable), so neither is stored.
 * Per-FIELD reader binding: `formalBlock` is the sole **σ*** payload (model-read);
 * `description` is **σ_human*** (the human selection-line the router surfaces — NOT
 * σ*, NOT residue-gated). NO `body` field — the SKILL.md is GENERATED by the adapter
 * as `f(name, formalBlock)`; storing it would be the parse-to-recover / DRY defect
 * this de-braid kills. `composition` is plain imported sibling `Skill`s.
 */
export interface Skill extends SkillDeploy {
  /** The skill name — the anchor; carries the trigger-weight at disclosure. */
  readonly name: string;
  /** σ_human* — the human-read one-line selection bound the router surfaces (NOT σ*). */
  readonly description: string;
  /** σ* — the sole model-read payload: the self-sufficient set-builder block
   *  (declarations-above / laws-below). The SKILL.md projects FROM this. */
  readonly formalBlock: SkillExpression;
  /** The sibling skills this one composes — plain ESM imports, no `[[ ]]`.
   *  A LAZY THUNK (`() => readonly Skill[]`), not an eager array: the real skill
   *  graph is CYCLIC (conceptualize↔exemplify↔signify↔materialize, elicit↔probe),
   *  so eager sibling `const` references would TDZ-crash at ESM load. The generator
   *  CALLS it (`skill.composition()`) only when emitting "Composed from …". */
  readonly composition: () => readonly Skill[];
}

// ── Projection helpers ──────────────────────────────────────────────────────

/**
 * Resolve a provenance mark's hue to a terminal color. The hue is the source of
 * truth; this maps it to the concrete color token a harness wants. (Identity for
 * now — a richer hue→color table lands with a later projection task.)
 */
export function markToColor(mark: Mark): string {
  return mark.hue;
}

// ── project-human — the harness-agnostic human-view boundary projection ───────
export { type DimensionDoc, projectHumanDimension } from './project-human.js';

// ── Source-cell type kernel — the generic `hook`/`rule` cell shapes ───────────
// The doctrine-free cell shapes (`hook`/`rule`) + the generic config-IR lift. The
// concrete cell instances live in the consuming corpus (agent-canon).
export {
  type HookCell,
  type HookEvent,
  type HookSource,
  type HookSubstrate,
  type HookWorker,
  hookIrOf,
} from './hook-cell.js';
export type { RuleCell } from './rule-cell.js';
