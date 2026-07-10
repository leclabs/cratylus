// ─────────────────────────────────────────────────────────────────────────────
// The agent anatomy as a TypeScript type system.
//
// THIS MODULE IS THE ANATOMY CONTRACT. An organ value is a per-organ **nominal-
// branded string** — the MODEL address shape: `body(c) = ⟨α(c), residue(c)⟩`, the
// anchor plus the leftover the anchor does not already fire (residue ∅ for a true
// σ*). VISION: _address, don't describe._ There is NO `{organ,slug,definiens}`
// value object, NO per-value phantom metadata — the string carries the body; the
// module's directory (`organs/<organ>/`) is its organ home (PARTITIONED) and its
// export name is its anchor α (SIGNIFIED).
//
// agent-anatomy authors organ values / agents / skills as typed modules that import
// these types. Composition is ESM `import`; an agent is a flat, explicit organ
// vector (`null` = omit-to-inherit — see `Agent`). A wrong organ→value or a wrong
// arity is a **compile error** — the brand keys each string to its organ so an
// `Actions` cannot be assigned where an `Objective` is expected.
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

/** Whether an organ field holds one value (`scalar`) or many (`set`). */
export type Arity = 'scalar' | 'set';

/**
 * The 22 FRAGMENT-organ names — the organs whose value is a branded-string cell.
 * `persona` and `provenance` are NOT here: persona is a plain-string description on
 * the agent (D13) and provenance is the structured `{mark}` on the agent (D3); both
 * carry data, not a σ* residue, so neither is a value-fragment organ.
 */
export type Organ =
  // STANCE
  | 'autonomy'
  | 'role'
  | 'formality'
  | 'audience-adaptation'
  | 'transparency'
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

// ── The provenance mark ─────────────────────────────────────────────────────

/** The emoji·hue mark an agent carries (drives its color). Data, not a σ* value. */
export interface Mark {
  readonly emoji: string;
  /** Hue token (e.g. `green`), resolved to a terminal color by `markToColor`. */
  readonly hue: string;
}

// ── Per-organ value types (branded strings) ─────────────────────────────────
// An organ value is a bare named σ* expression: `export const x: Objective = '…'`.
// Each per-organ type is a nominal-branded `string` — the phantom `__organ` brand
// keys the string to its organ so `tsc` rejects a cross-organ assignment. The
// value's content is the body ⟨α, residue⟩ (rendered `α ≜ residue`, or just `α`
// for a true σ* whose residue is ∅).

/** A branded organ-value string, keyed to organ `O`. */
type OrganValue<O extends Organ> = string & { readonly __organ?: O };

// STANCE
export type Autonomy = OrganValue<'autonomy'>;
export type Role = OrganValue<'role'>;
export type Formality = OrganValue<'formality'>;
export type AudienceAdaptation = OrganValue<'audience-adaptation'>;
export type Transparency = OrganValue<'transparency'>;

// CONATUS — standing drives
export type Objective = OrganValue<'objective'>;
export type Guardrails = OrganValue<'guardrails'>;
export type EngineeringPrinciples = OrganValue<'engineering-principles'>;
export type Heuristics = OrganValue<'heuristics'>;
export type Capabilities = OrganValue<'capabilities'>;
export type Learning = OrganValue<'learning'>;
export type SituationAwareness = OrganValue<'situation-awareness'>;

// CONATUS — apparatus
export type Actions = OrganValue<'actions'>;
export type Modalities = OrganValue<'modalities'>;
export type Model = OrganValue<'model'>;
export type Memory = OrganValue<'memory'>;

// CONATUS — per-turn act
export type Trigger = OrganValue<'trigger'>;
export type Framing = OrganValue<'framing'>;
export type ReasoningStrategy = OrganValue<'reasoning-strategy'>;
export type Satisficing = OrganValue<'satisficing'>;
export type OutputFormat = OrganValue<'output-format'>;
export type SelfEvaluation = OrganValue<'self-evaluation'>;

/**
 * The SET organs — the only organs whose `Agent` field is an array.
 * (autonomy · guardrails · capabilities · actions · heuristics · engineering-principles)
 */
export type SetOrgan =
  | 'autonomy'
  | 'guardrails'
  | 'capabilities'
  | 'actions'
  | 'heuristics'
  | 'engineering-principles';

// ── The runtime organ descriptor (axis / kind / arity) ──────────────────────
// A consumer that needs an organ's metadata at runtime (e.g. `agent-forge catalog`)
// reads `ANATOMY` — the single home for organ genus/classification/arity. The keyed
// object type forces every one of the fragment organs to be present (a missing
// organ is a compile error; an extra key has no declared type and is rejected).

/** The runtime-readable metadata for one organ (axis = genus). */
export interface OrganMeta {
  /** The MECE filing axis (the `Genus` of the organ's values). */
  readonly axis: Genus;
  /** How the value-catalog is sourced (the `Classification`). */
  readonly kind: Classification;
  /** Whether the organ field holds one value or many (the `Arity`). */
  readonly arity: Arity;
}

/**
 * The one runtime home for organ metadata — `agent-forge catalog` reads it, never a
 * second hand-kept copy. Keyed by organ so a missing/extra organ is a compile error.
 */
export const ANATOMY: { readonly [O in Organ]: OrganMeta } = {
  // STANCE
  autonomy: { axis: 'STANCE', kind: 'enum', arity: 'set' },
  role: { axis: 'STANCE', kind: 'open', arity: 'scalar' },
  formality: { axis: 'STANCE', kind: 'enum', arity: 'scalar' },
  'audience-adaptation': { axis: 'STANCE', kind: 'enum', arity: 'scalar' },
  transparency: { axis: 'STANCE', kind: 'enum', arity: 'scalar' },
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

/** Every fragment-organ name, in anatomy (STANCE-then-CONATUS) declaration order. */
export const ORGAN_NAMES = Object.keys(ANATOMY) as readonly Organ[];

// ── The Agent: a typed organ-selection vector ───────────────────────────────

/**
 * An agent as a selection over the anatomy: a FLAT, explicit organ vector
 * (depth 1 — composition over inheritance). Scalar organ fields hold ONE branded
 * value; the six set organs hold arrays. Arity is enforced by the field types.
 *
 * Every organ key is REQUIRED (completeness law). A scalar organ's value is a
 * concrete branded string **or `null`** (explicit omit-to-inherit — do NOT project
 * this organ; inherit whatever the harness provides). `null` on a set organ omits
 * the whole section. `persona` and `provenance` are NOT fragment organs: persona is
 * a plain identity description, provenance the structured `{mark}` (or null).
 */
export interface Agent {
  /** The agent's name (its module / deploy identity). */
  readonly name: string;
  /** σ_human* — the human-read one-line selection bound → SOUL frontmatter
   *  `description:` the subagent-router reads (NOT σ*). The one-level-up twin of
   *  the skill `description`. */
  readonly description: string;

  // STANCE
  readonly autonomy: readonly Autonomy[] | null; // SET (composed standing, D5)
  /** σ* — the model-read identity body → SOUL body. A plain string, not a branded
   *  fragment-organ (D13), but σ* content nonetheless. */
  readonly persona: string;
  readonly role: Role | null;
  readonly formality: Formality | null;
  readonly audienceAdaptation: AudienceAdaptation | null;
  readonly transparency: Transparency | null;
  /** The emoji·hue mark (drives color) — data, not a fragment (D3). */
  readonly provenance: { readonly mark: Mark } | null;

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

/**
 * A skill's σ* payload string — the self-sufficient set-builder block. A nominal-
 * branded `string` with the SAME shape as `OrganValue<O>` (optional phantom brand,
 * so a plain string literal still assigns): keys the notation to its role so `tsc`
 * rejects a raw string where a skill's formal block is expected.
 */
export type SkillExpression = string & { readonly __skillExpr?: true };

/** How a skill cell deploys, beyond the default agent-resident projection. */
export interface SkillDeploy {
  /** Deploy as a host `skills/<name>/` directory (the `memory`-style cell). */
  readonly deployAs?: 'skill-dir';
  /** Committed companion assets shipped byte-for-byte with the skill. */
  readonly assets?: readonly string[];
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
export { type OrganDoc, projectHumanOrgan } from './project-human.js';
