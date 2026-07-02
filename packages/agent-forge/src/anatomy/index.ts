// ─────────────────────────────────────────────────────────────────────────────
// The agent anatomy as a TypeScript type system.
//
// THIS MODULE IS THE ANATOMY CONTRACT. `docs/agent-conceptual-anatomy.md` is its
// human projection; the prose mirrors these types, not the other way around.
//
// agent-anatomy authors fragments / agents / skills as typed modules that import these
// types. Composition is ESM `import`; an agent is a flat, explicit 24-organ
// vector (`null` = omit-to-inherit — see `Agent`). A wrong organ→value, a wrong arity, or a
// fragment of the wrong organ in the wrong field is a **compile error** — there
// is NO JSON-Schema and NO `Ref`/resolution machinery here: "every ref resolves
// to one home" is `tsc`, and the `(organ, value)` pair-keying is structural (the
// `organ` literal on each fragment discriminates `actions/emitFencedReview`
// from `output-format/emitFencedReview`).
//
// Exported from `@leclabs/agent-forge/anatomy` — a sibling subpath to the config-IR
// `Agent`/`Skill` in `@leclabs/agent-forge` (those are the translation shapes; THESE
// are the organ-selection shapes — distinct concepts, distinct homes).
// ─────────────────────────────────────────────────────────────────────────────

// ── Type-level metadata axes ────────────────────────────────────────────────

/** The MECE filing axis: how the agent comes across vs what it is inclined to do. */
export type Genus = 'STANCE' | 'CONATUS';

/**
 * How an organ's value-catalog is sourced:
 * - `enum`   — a member of the model's own native value set (blind introspection).
 * - `open`   — named per-agent; where identity lives.
 * - `coined` — a closed, corpus-authored catalog of canonical directives.
 */
export type Classification = 'enum' | 'open' | 'coined';

/** Whether an organ field holds one fragment (`scalar`) or many (`set`). */
export type Arity = 'scalar' | 'set';

/** The 24 organ names — the MECE anatomy. The `Fragment.organ` discriminant. */
export type Organ =
  // STANCE
  | 'autonomy'
  | 'persona'
  | 'role'
  | 'formality'
  | 'audience-adaptation'
  | 'transparency'
  | 'provenance'
  // CONATUS
  | 'objective'
  | 'guardrails'
  | 'engineering-principles'
  | 'heuristics'
  | 'capabilities'
  | 'learning'
  | 'situation-awareness'
  | 'actions'
  | 'modalities'
  | 'model'
  | 'memory'
  | 'trigger'
  | 'framing'
  | 'reasoning-strategy'
  | 'satisficing'
  | 'output-format'
  | 'self-evaluation';

// ── The Fragment base type ──────────────────────────────────────────────────

/** The emoji·hue mark a `provenance` fragment carries (drives agent color). */
export interface Mark {
  readonly emoji: string;
  /** Hue token (e.g. `green`), resolved to a terminal color by `markToColor`. */
  readonly hue: string;
}

/**
 * The shape a value-cell module exports. One module = one fragment = one home.
 *
 * `organ` is a string-literal discriminant: it makes the `(organ, value)` pair
 * structural, so a fragment authored under `organs/actions/` cannot be
 * assigned where an `organs/output-format/` fragment is expected even if both share
 * the slug `emitFencedReview`. `G` / `C` / `A` carry the genus, classification,
 * and arity at the type level (phantom — present in the type, absent at runtime)
 * so tooling and the per-organ aliases stay self-describing.
 */
export interface Fragment<
  O extends Organ = Organ,
  G extends Genus = Genus,
  C extends Classification = Classification,
  A extends Arity = Arity,
> {
  /** The organ this fragment is a value of — the structural discriminant. */
  readonly organ: O;
  /** The cell anchor (σ*_R): the densest reader-relative name for the idea. */
  readonly slug: string;
  /** The definition body — `≜ <definiens>`. */
  readonly definiens: string;
  /** The emoji·hue mark — only `provenance` fragments carry it. */
  readonly mark?: Mark;

  // Phantom metadata — never read at runtime; present so the genus /
  // classification / arity of a fragment are recoverable from its type alone.
  readonly __genus?: G;
  readonly __classification?: C;
  readonly __arity?: A;
}

// ── Per-organ fragment types (24) ───────────────────────────────────────────
// Each is a `Fragment` specialization pinned to its (organ, genus, classification,
// arity) tuple. The arity here is the type-level fact; `Agent` (below) is what
// actually enforces scalar-field-vs-array — a scalar organ's field holds `T`,
// a set organ's field holds `T[]`.

// STANCE
export type Autonomy = Fragment<'autonomy', 'STANCE', 'enum', 'scalar'>;
export type Persona = Fragment<'persona', 'STANCE', 'open', 'scalar'>;
export type Role = Fragment<'role', 'STANCE', 'open', 'scalar'>;
export type Formality = Fragment<'formality', 'STANCE', 'enum', 'scalar'>;
export type AudienceAdaptation = Fragment<
  'audience-adaptation',
  'STANCE',
  'enum',
  'scalar'
>;
export type Transparency = Fragment<'transparency', 'STANCE', 'enum', 'scalar'>;
/** Carries the emoji·hue `mark` that drives the agent's color. */
export type Provenance = Fragment<'provenance', 'STANCE', 'open', 'scalar'>;

// CONATUS — standing drives
export type Objective = Fragment<'objective', 'CONATUS', 'open', 'scalar'>;
export type Guardrails = Fragment<'guardrails', 'CONATUS', 'coined', 'set'>;
export type EngineeringPrinciples = Fragment<
  'engineering-principles',
  'CONATUS',
  'coined',
  'set'
>;
export type Heuristics = Fragment<'heuristics', 'CONATUS', 'coined', 'set'>;
export type Capabilities = Fragment<'capabilities', 'CONATUS', 'open', 'set'>;
export type Learning = Fragment<'learning', 'CONATUS', 'enum', 'scalar'>;
export type SituationAwareness = Fragment<
  'situation-awareness',
  'CONATUS',
  'enum',
  'scalar'
>;

// CONATUS — apparatus
export type Actions = Fragment<'actions', 'CONATUS', 'enum', 'set'>;
export type Modalities = Fragment<'modalities', 'CONATUS', 'enum', 'scalar'>;
export type Model = Fragment<'model', 'CONATUS', 'enum', 'scalar'>;
export type Memory = Fragment<'memory', 'CONATUS', 'enum', 'scalar'>;

// CONATUS — per-turn act
export type Trigger = Fragment<'trigger', 'CONATUS', 'enum', 'scalar'>;
export type Framing = Fragment<'framing', 'CONATUS', 'open', 'scalar'>;
export type ReasoningStrategy = Fragment<
  'reasoning-strategy',
  'CONATUS',
  'enum',
  'scalar'
>;
export type Satisficing = Fragment<'satisficing', 'CONATUS', 'enum', 'scalar'>;
export type OutputFormat = Fragment<
  'output-format',
  'CONATUS',
  'enum',
  'scalar'
>;
export type SelfEvaluation = Fragment<
  'self-evaluation',
  'CONATUS',
  'enum',
  'scalar'
>;

/**
 * The five SET organs — the only organs whose `Agent` field is an array.
 * (guardrails · capabilities · actions · heuristics · engineering-principles)
 */
export type SetOrgan =
  | 'guardrails'
  | 'capabilities'
  | 'actions'
  | 'heuristics'
  | 'engineering-principles';

// ── The runtime organ descriptor (axis / kind / arity) ──────────────────────
// The per-organ `Fragment<O,G,C,A>` aliases above carry an organ's genus,
// classification, and arity at the TYPE level — phantom params that erase at
// runtime. A consumer that needs this metadata at runtime (e.g. `agent-forge catalog`)
// can't read the types, so `ANATOMY` mirrors them as data. It is SINGLE-SOURCED:
// each entry's value type is `MetaOf<TheOrgansFragmentAlias>`, which projects the
// alias's `G/C/A` params back out — so a wrong axis/kind/arity here is a COMPILE
// error, not a silent drift. The keyed object type forces every one of the 24
// organs to be present (a missing organ is a compile error; an extra key has no
// declared type and is rejected). `test/catalog/anatomy-descriptor` further
// asserts the keyset is EXACTLY the 24 `Organ` literals at runtime.

/** The runtime-readable metadata for one organ (axis = genus). */
export interface OrganMeta {
  /** The MECE filing axis (the `Genus` of the organ's fragments). */
  readonly axis: Genus;
  /** How the value-catalog is sourced (the `Classification`). */
  readonly kind: Classification;
  /** Whether the organ field holds one fragment or many (the `Arity`). */
  readonly arity: Arity;
}

/** Project a per-organ `Fragment` alias's phantom params into an `OrganMeta`. */
type MetaOf<F> = F extends Fragment<Organ, infer G, infer C, infer A>
  ? { readonly axis: G; readonly kind: C; readonly arity: A }
  : never;

/**
 * The runtime mirror of the 24 per-organ `Fragment` aliases. Each value is typed
 * as `MetaOf<…>` of that organ's alias, so the data cannot disagree with the
 * type. This is the one runtime home for organ metadata — `agent-forge catalog` reads
 * it, never a second hand-kept copy.
 */
export const ANATOMY: {
  readonly autonomy: MetaOf<Autonomy>;
  readonly persona: MetaOf<Persona>;
  readonly role: MetaOf<Role>;
  readonly formality: MetaOf<Formality>;
  readonly 'audience-adaptation': MetaOf<AudienceAdaptation>;
  readonly transparency: MetaOf<Transparency>;
  readonly provenance: MetaOf<Provenance>;
  readonly objective: MetaOf<Objective>;
  readonly guardrails: MetaOf<Guardrails>;
  readonly 'engineering-principles': MetaOf<EngineeringPrinciples>;
  readonly heuristics: MetaOf<Heuristics>;
  readonly capabilities: MetaOf<Capabilities>;
  readonly learning: MetaOf<Learning>;
  readonly 'situation-awareness': MetaOf<SituationAwareness>;
  readonly actions: MetaOf<Actions>;
  readonly modalities: MetaOf<Modalities>;
  readonly model: MetaOf<Model>;
  readonly memory: MetaOf<Memory>;
  readonly trigger: MetaOf<Trigger>;
  readonly framing: MetaOf<Framing>;
  readonly 'reasoning-strategy': MetaOf<ReasoningStrategy>;
  readonly satisficing: MetaOf<Satisficing>;
  readonly 'output-format': MetaOf<OutputFormat>;
  readonly 'self-evaluation': MetaOf<SelfEvaluation>;
} = {
  // STANCE
  autonomy: { axis: 'STANCE', kind: 'enum', arity: 'scalar' },
  persona: { axis: 'STANCE', kind: 'open', arity: 'scalar' },
  role: { axis: 'STANCE', kind: 'open', arity: 'scalar' },
  formality: { axis: 'STANCE', kind: 'enum', arity: 'scalar' },
  'audience-adaptation': { axis: 'STANCE', kind: 'enum', arity: 'scalar' },
  transparency: { axis: 'STANCE', kind: 'enum', arity: 'scalar' },
  provenance: { axis: 'STANCE', kind: 'open', arity: 'scalar' },
  // CONATUS — standing drives
  objective: { axis: 'CONATUS', kind: 'open', arity: 'scalar' },
  guardrails: { axis: 'CONATUS', kind: 'coined', arity: 'set' },
  'engineering-principles': { axis: 'CONATUS', kind: 'coined', arity: 'set' },
  heuristics: { axis: 'CONATUS', kind: 'coined', arity: 'set' },
  capabilities: { axis: 'CONATUS', kind: 'open', arity: 'set' },
  learning: { axis: 'CONATUS', kind: 'enum', arity: 'scalar' },
  'situation-awareness': { axis: 'CONATUS', kind: 'enum', arity: 'scalar' },
  // CONATUS — apparatus
  actions: { axis: 'CONATUS', kind: 'enum', arity: 'set' },
  modalities: { axis: 'CONATUS', kind: 'enum', arity: 'scalar' },
  model: { axis: 'CONATUS', kind: 'enum', arity: 'scalar' },
  memory: { axis: 'CONATUS', kind: 'enum', arity: 'scalar' },
  // CONATUS — per-turn act
  trigger: { axis: 'CONATUS', kind: 'enum', arity: 'scalar' },
  framing: { axis: 'CONATUS', kind: 'open', arity: 'scalar' },
  'reasoning-strategy': { axis: 'CONATUS', kind: 'enum', arity: 'scalar' },
  satisficing: { axis: 'CONATUS', kind: 'enum', arity: 'scalar' },
  'output-format': { axis: 'CONATUS', kind: 'enum', arity: 'scalar' },
  'self-evaluation': { axis: 'CONATUS', kind: 'enum', arity: 'scalar' },
};

/** Every organ name, in anatomy (STANCE-then-CONATUS) declaration order. */
export const ORGAN_NAMES = Object.keys(ANATOMY) as readonly Organ[];

// ── The Agent: a typed organ-selection vector ───────────────────────────────

/**
 * An agent as a selection over the anatomy: a FLAT, explicit 24-organ vector
 * (depth 1 — no base-organ hierarchy, no delta resolution; composition over
 * inheritance). Scalar organ fields hold ONE fragment; the five set organs hold
 * arrays. Arity is enforced by the field types — a scalar field cannot take an
 * array and a set field cannot take a scalar, so either mistake is a compile
 * error.
 *
 * Every organ key is REQUIRED (completeness law — a missing key is a compile
 * error). A key's value is a concrete fragment **or `null`**: the explicit-unset
 * sentinel (cf. CSS `unset`) — do NOT project this organ; inherit whatever the
 * harness provides. The key stays visible at the agent source, self-documenting
 * the deliberate harness-inheritance, and tracks the harness default even when
 * it drifts (expressiveness a concrete-value-matching-a-fixture cannot give).
 * `null` on a set organ omits the whole section (there is no partial inherit).
 */
export interface Agent {
  /** The agent's name (its module / deploy identity). */
  readonly name: string;

  // STANCE (all scalar)
  readonly autonomy: Autonomy | null;
  readonly persona: Persona | null;
  readonly role: Role | null;
  readonly formality: Formality | null;
  readonly audienceAdaptation: AudienceAdaptation | null;
  readonly transparency: Transparency | null;
  readonly provenance: Provenance | null;

  // CONATUS — standing drives
  readonly objective: Objective | null;
  readonly guardrails: readonly Guardrails[] | null; // SET
  readonly engineeringPrinciples: readonly EngineeringPrinciples[] | null; // SET
  readonly heuristics: readonly Heuristics[] | null; // SET
  readonly capabilities: readonly Capabilities[] | null; // SET
  readonly learning: Learning | null;
  readonly situationAwareness: SituationAwareness | null;

  // CONATUS — apparatus
  readonly actions: readonly Actions[] | null; // SET
  readonly modalities: Modalities | null;
  readonly model: Model | null;
  readonly memory: Memory | null;

  // CONATUS — per-turn act
  readonly trigger: Trigger | null;
  readonly framing: Framing | null;
  readonly reasoningStrategy: ReasoningStrategy | null;
  readonly satisficing: Satisficing | null;
  readonly outputFormat: OutputFormat | null;
  readonly selfEvaluation: SelfEvaluation | null;
}

// ── The Skill: a self-sufficient set-builder cell ───────────────────────────

/** How a skill cell deploys, beyond the default agent-resident projection. */
export interface SkillDeploy {
  /** Deploy as a host `skills/<name>/` directory (the `memory`-style cell). */
  readonly deployAs?: 'skill-dir';
  /** Copy a build artifact (path relative to corpus root) into the skill dir. */
  readonly bundle?: string;
  /** Committed companion assets shipped byte-for-byte with the skill. */
  readonly assets?: readonly string[];
}

/**
 * A skill cell: a self-sufficient formal block plus the live sibling skills it
 * composes. `composition` is plain imported sibling `Skill`s — NO `[[ ]]`, NO
 * Bindings prose; the import IS the binding (one home, checked by `tsc`).
 */
export interface Skill extends SkillDeploy {
  /** The skill name — carries the trigger-weight at progressive-disclosure. */
  readonly name: string;
  /** The invocation token (e.g. `/graphify`). */
  readonly trigger: string;
  /** The one-line bound that resolves into composites at selection time. */
  readonly delineation: string;
  /** The H1 verb the formal block enacts. */
  readonly verb: string;
  /** The self-sufficient set-builder block (declarations-above / laws-below). */
  readonly formalBlock: string;
  /** The sibling skills this one composes — plain ESM imports, no `[[ ]]`. */
  readonly composition: readonly Skill[];
}

// ── Derivation helpers (signatures + stubs) ─────────────────────────────────

/**
 * Project a persona fragment to the agent's one-line description (the
 * `description:` front-matter the harness reads). Stub — the projection logic
 * lands with the composer migration (T2.x).
 */
export function personaToDescription(persona: Persona): string {
  return persona.definiens;
}

/**
 * Resolve a provenance fragment's `mark` to a terminal color. The mark's hue is
 * the source of truth; this maps it to the concrete color token a harness wants.
 * Stub — the hue→color table lands with the composer migration (T2.x).
 */
export function markToColor(mark: Mark): string {
  return mark.hue;
}

/** Pull the `{ emoji, hue }` mark off a provenance fragment, if present. */
export function provenanceMark(provenance: Provenance): Mark | undefined {
  return provenance.mark;
}
