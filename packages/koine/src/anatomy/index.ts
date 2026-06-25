// ─────────────────────────────────────────────────────────────────────────────
// The agent anatomy as a TypeScript type system.
//
// THIS MODULE IS THE ANATOMY CONTRACT. `docs/agent-conceptual-anatomy.md` is its
// human projection; the prose mirrors these types, not the other way around.
//
// mind authors fragments / agents / skills as typed modules that import these
// types. Composition is ESM `import`; merge is object spread (see
// `docs/baseline-delta-model.md`). A wrong organ→value, a wrong arity, or a
// fragment of the wrong organ in the wrong field is a **compile error** — there
// is NO JSON-Schema and NO `Ref`/resolution machinery here: "every ref resolves
// to one home" is `tsc`, and the `(organ, value)` pair-keying is structural (the
// `organ` literal on each fragment discriminates `effectors/emitFencedReview`
// from `enaction/emitFencedReview`).
//
// Exported from `@leclabs/koine/anatomy` — a sibling subpath to the config-IR
// `Agent`/`Skill` in `@leclabs/koine` (those are the translation shapes; THESE
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
  | 'address'
  | 'persona'
  | 'mandate'
  | 'comportment'
  | 'register-fit'
  | 'disclosure'
  | 'provenance'
  // CONATUS
  | 'telos'
  | 'charter'
  | 'instructions'
  | 'heuristics'
  | 'competence'
  | 'disposition-memory'
  | 'gestalt'
  | 'effectors'
  | 'sensors'
  | 'substrate'
  | 'ledger'
  | 'percept'
  | 'construal'
  | 'deliberation'
  | 'resolve'
  | 'enaction'
  | 'appraisal';

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
 * structural, so a fragment authored under `organs/effectors/` cannot be
 * assigned where an `organs/enaction/` fragment is expected even if both share
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
export type Address = Fragment<'address', 'STANCE', 'enum', 'scalar'>;
export type Persona = Fragment<'persona', 'STANCE', 'open', 'scalar'>;
export type Mandate = Fragment<'mandate', 'STANCE', 'open', 'scalar'>;
export type Comportment = Fragment<'comportment', 'STANCE', 'enum', 'scalar'>;
export type RegisterFit = Fragment<'register-fit', 'STANCE', 'enum', 'scalar'>;
export type Disclosure = Fragment<'disclosure', 'STANCE', 'enum', 'scalar'>;
/** Carries the emoji·hue `mark` that drives the agent's color. */
export type Provenance = Fragment<'provenance', 'STANCE', 'open', 'scalar'>;

// CONATUS — standing drives
export type Telos = Fragment<'telos', 'CONATUS', 'open', 'scalar'>;
export type Charter = Fragment<'charter', 'CONATUS', 'coined', 'set'>;
export type Instructions = Fragment<'instructions', 'CONATUS', 'coined', 'set'>;
export type Heuristics = Fragment<'heuristics', 'CONATUS', 'coined', 'set'>;
export type Competence = Fragment<'competence', 'CONATUS', 'open', 'set'>;
export type DispositionMemory = Fragment<
  'disposition-memory',
  'CONATUS',
  'enum',
  'scalar'
>;
export type Gestalt = Fragment<'gestalt', 'CONATUS', 'enum', 'scalar'>;

// CONATUS — apparatus
export type Effectors = Fragment<'effectors', 'CONATUS', 'enum', 'set'>;
export type Sensors = Fragment<'sensors', 'CONATUS', 'enum', 'scalar'>;
export type Substrate = Fragment<'substrate', 'CONATUS', 'enum', 'scalar'>;
export type Ledger = Fragment<'ledger', 'CONATUS', 'enum', 'scalar'>;

// CONATUS — per-turn act
export type Percept = Fragment<'percept', 'CONATUS', 'enum', 'scalar'>;
export type Construal = Fragment<'construal', 'CONATUS', 'open', 'scalar'>;
export type Deliberation = Fragment<
  'deliberation',
  'CONATUS',
  'enum',
  'scalar'
>;
export type Resolve = Fragment<'resolve', 'CONATUS', 'enum', 'scalar'>;
export type Enaction = Fragment<'enaction', 'CONATUS', 'enum', 'scalar'>;
export type Appraisal = Fragment<'appraisal', 'CONATUS', 'enum', 'scalar'>;

/**
 * The five SET organs — the only organs whose `Agent` field is an array.
 * (charter · competence · effectors · heuristics · instructions)
 */
export type SetOrgan =
  | 'charter'
  | 'competence'
  | 'effectors'
  | 'heuristics'
  | 'instructions';

// ── The runtime organ descriptor (axis / kind / arity) ──────────────────────
// The per-organ `Fragment<O,G,C,A>` aliases above carry an organ's genus,
// classification, and arity at the TYPE level — phantom params that erase at
// runtime. A consumer that needs this metadata at runtime (e.g. `koine catalog`)
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
 * type. This is the one runtime home for organ metadata — `koine catalog` reads
 * it, never a second hand-kept copy.
 */
export const ANATOMY: {
  readonly address: MetaOf<Address>;
  readonly persona: MetaOf<Persona>;
  readonly mandate: MetaOf<Mandate>;
  readonly comportment: MetaOf<Comportment>;
  readonly 'register-fit': MetaOf<RegisterFit>;
  readonly disclosure: MetaOf<Disclosure>;
  readonly provenance: MetaOf<Provenance>;
  readonly telos: MetaOf<Telos>;
  readonly charter: MetaOf<Charter>;
  readonly instructions: MetaOf<Instructions>;
  readonly heuristics: MetaOf<Heuristics>;
  readonly competence: MetaOf<Competence>;
  readonly 'disposition-memory': MetaOf<DispositionMemory>;
  readonly gestalt: MetaOf<Gestalt>;
  readonly effectors: MetaOf<Effectors>;
  readonly sensors: MetaOf<Sensors>;
  readonly substrate: MetaOf<Substrate>;
  readonly ledger: MetaOf<Ledger>;
  readonly percept: MetaOf<Percept>;
  readonly construal: MetaOf<Construal>;
  readonly deliberation: MetaOf<Deliberation>;
  readonly resolve: MetaOf<Resolve>;
  readonly enaction: MetaOf<Enaction>;
  readonly appraisal: MetaOf<Appraisal>;
} = {
  // STANCE
  address: { axis: 'STANCE', kind: 'enum', arity: 'scalar' },
  persona: { axis: 'STANCE', kind: 'open', arity: 'scalar' },
  mandate: { axis: 'STANCE', kind: 'open', arity: 'scalar' },
  comportment: { axis: 'STANCE', kind: 'enum', arity: 'scalar' },
  'register-fit': { axis: 'STANCE', kind: 'enum', arity: 'scalar' },
  disclosure: { axis: 'STANCE', kind: 'enum', arity: 'scalar' },
  provenance: { axis: 'STANCE', kind: 'open', arity: 'scalar' },
  // CONATUS — standing drives
  telos: { axis: 'CONATUS', kind: 'open', arity: 'scalar' },
  charter: { axis: 'CONATUS', kind: 'coined', arity: 'set' },
  instructions: { axis: 'CONATUS', kind: 'coined', arity: 'set' },
  heuristics: { axis: 'CONATUS', kind: 'coined', arity: 'set' },
  competence: { axis: 'CONATUS', kind: 'open', arity: 'set' },
  'disposition-memory': { axis: 'CONATUS', kind: 'enum', arity: 'scalar' },
  gestalt: { axis: 'CONATUS', kind: 'enum', arity: 'scalar' },
  // CONATUS — apparatus
  effectors: { axis: 'CONATUS', kind: 'enum', arity: 'set' },
  sensors: { axis: 'CONATUS', kind: 'enum', arity: 'scalar' },
  substrate: { axis: 'CONATUS', kind: 'enum', arity: 'scalar' },
  ledger: { axis: 'CONATUS', kind: 'enum', arity: 'scalar' },
  // CONATUS — per-turn act
  percept: { axis: 'CONATUS', kind: 'enum', arity: 'scalar' },
  construal: { axis: 'CONATUS', kind: 'open', arity: 'scalar' },
  deliberation: { axis: 'CONATUS', kind: 'enum', arity: 'scalar' },
  resolve: { axis: 'CONATUS', kind: 'enum', arity: 'scalar' },
  enaction: { axis: 'CONATUS', kind: 'enum', arity: 'scalar' },
  appraisal: { axis: 'CONATUS', kind: 'enum', arity: 'scalar' },
};

/** Every organ name, in anatomy (STANCE-then-CONATUS) declaration order. */
export const ORGAN_NAMES = Object.keys(ANATOMY) as readonly Organ[];

// ── The Agent: a typed organ-selection vector ───────────────────────────────

/**
 * An agent as a selection over the anatomy. Scalar organ fields hold ONE
 * fragment; the five set organs hold arrays. Arity is enforced by the field
 * types — a scalar field cannot take an array and a set field cannot take a
 * scalar, so either mistake is a compile error. Every field is required after
 * merge (completeness law); a delta-over-base supplies the omitted organs by
 * `...base` spread (see `base?`).
 */
export interface Agent {
  /** The agent's name (its module / deploy identity). */
  readonly name: string;

  /**
   * The baseline this agent is a delta over: `{ ...base, ...overrides }`.
   * The polis-universal floor (`agents/base.ts`) spreads in here; an agent that
   * is itself the base omits it. Merge is object spread (scalar = field replace,
   * additive set = array spread), NOT a resolution pass.
   */
  readonly base?: Agent;

  // STANCE (all scalar)
  readonly address: Address;
  readonly persona: Persona;
  readonly mandate: Mandate;
  readonly comportment: Comportment;
  readonly registerFit: RegisterFit;
  readonly disclosure: Disclosure;
  readonly provenance: Provenance;

  // CONATUS — standing drives
  readonly telos: Telos;
  readonly charter: readonly Charter[]; // SET
  // `instructions` (the engineering-directive methodology organ) and `heuristics`
  // (the cognitive-shortcut organ) are OPTIONAL — not every agent carries them
  // (in the live corpus: instructions 4/11, heuristics 8/11). The other 22 organs
  // are required (every agent fills them). Omission ⇒ no `## Instructions` /
  // `## Heuristics` section in the projected SOUL.
  readonly instructions?: readonly Instructions[]; // SET, optional
  readonly heuristics?: readonly Heuristics[]; // SET, optional
  readonly competence: readonly Competence[]; // SET
  readonly dispositionMemory: DispositionMemory;
  readonly gestalt: Gestalt;

  // CONATUS — apparatus
  readonly effectors: readonly Effectors[]; // SET
  readonly sensors: Sensors;
  readonly substrate: Substrate;
  readonly ledger: Ledger;

  // CONATUS — per-turn act
  readonly percept: Percept;
  readonly construal: Construal;
  readonly deliberation: Deliberation;
  readonly resolve: Resolve;
  readonly enaction: Enaction;
  readonly appraisal: Appraisal;
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
