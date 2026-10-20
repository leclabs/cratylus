// ─────────────────────────────────────────────────────────────────────────────
// The dimension META-MODEL as a TypeScript type system.
//
// THIS MODULE IS THE CONTRACT, and ONLY the contract. It states that a
// dimension HAS a group, a repertoire, an arity, a default enforcement level and a
// projection, and it derives an entire dimension type-system from any manifest
// obeying that shape
// (`DimensionOf` · `SetDimensionOf` · `RequiredDimensionOf` · `DimensionFieldsOf`
// · `AgentOf`). It does NOT state WHICH dimensions exist. That is the corpus's,
// and it rides the PLUGIN (`AgentPlugin.manifest`) — a
// projector holding the manifest is a projector containing a design rather than
// projecting one, and a corpus could not then discover a dimension without
// editing the projector.
//
// A dimension value is a per-dimension **nominal-branded string** of the shape
// `body(c) = ⟨α(c), residue(c)⟩`, the anchor plus the workflow's
// residue of c, the anchor read in its bounded context (σ* is the anchor with the
// smallest). There is NO
// `{dimension,slug,definiens}` value object, NO per-value
// phantom metadata — the string carries the body; the module's directory
// (`dimensions/<dimension>/`) is its dimension home (PARTITIONED) and its export
// name is its anchor α (SIGNIFIED).
//
// A corpus (canon is the first) declares its manifest, derives its own
// `Dimension`, `Agent` and per-dimension aliases from it, and authors its
// dimension values / agents / skills against those. Composition is ESM `import`;
// an agent is a flat, explicit dimension vector of ENTRIES (`[]` = explicitly
// empty). A wrong dimension→value is a **compile error** — the brand keys each
// string to its dimension so an `Actions` cannot be assigned where an
// `Objective` is expected.
//
// Exported from `@cratylus/schema` — NOT from the projector. These are the
// dimension-selection shapes; the config-IR `Agent`/`Skill` translation shapes in
// `@cratylus/forge` are a distinct concept with a distinct home.
// ─────────────────────────────────────────────────────────────────────────────

import type { AgentContract } from './contract.js';
import type { HookSubstrate } from './hook-cell.js';
import type { EventName } from './hook/index.js';
import type { Ruleset } from './rule.js';

// ── Type-level metadata ─────────────────────────────────────────────────────

/**
 * How firmly a value holds — the repertoire of the corpus's enforcement-level
 * factor, which is an ATTRIBUTE of every value an agent holds rather than a value
 * of its own (see {@link Entry.level}).
 * - `advisory` — guidance the agent weighs and may depart from.
 * - `firm`     — holds unless the operator overrides it.
 * - `fixed`    — holds without exception; only the design changes it.
 */
export type EnforcementLevel = 'advisory' | 'firm' | 'fixed';

/**
 * A runtime CAPABILITY name — the BOUND, not the members.
 *
 * This used to read `keyof Omit<RuntimePlugin, 'name'>`, deriving the closed set
 * from the runtime's implementation interface. That was the only `schema →
 * runtime` edge, and it was the wrong kind of borrowing: what this package needs
 * is a **vocabulary** (which names exist), and what it reached for was a
 * **shape** (how those things are implemented). The rule `shape ⊥ vocabulary`
 * already holds for `Event` — shape here, names in the corpus.
 *
 * So the members are the corpus's, exactly as WHICH dimensions exist is the
 * corpus's. This package states that a capability HAS a name and stops; a corpus
 * declares its own set `as const satisfies readonly CapabilityName[]` and narrows
 * `Skill` against it, which is the `DimensionManifest`/`MANIFEST` pattern reused
 * rather than a second one invented.
 *
 * NAMING NOTE. A blind decode returned `FacultyName`/`Faculty` and argued it
 * well — the `*Name` suffix is what buys the shape/vocabulary distinction, and
 * that insight is kept here. Its root word is not, because the prompt that
 * produced it wrongly disqualified `capability`: only the plural keyspace
 * `capabilities` is occupied, not the root. `capability` is this architecture's
 * established sign for the concept, so adopting
 * `Faculty` would have minted a SECOND sign for one concept — the precise defect
 * `α(cᵢ) = α(cⱼ) ⇒ D(cᵢ) = D(cⱼ)` forbids. */
export type CapabilityName = string;

/**
 * How a dimension's value-catalog is sourced — WHO OWNS THE VALUE SET, and the
 * four members partition it:
 * - `latent`  — the MODEL's own value set, read out by blind introspection.
 * - `open`    — named PER-AGENT; where identity lives.
 * - `curated` — a closed catalog the CORPUS assembled.
 * - `fixed`   — a closed list the DESIGN fixes (decision classes, reach
 *   ceilings, the roles); the corpus transcribes it, it does not tend it.
 *
 * The third member read `coined` until 2026-08-05, and that was a defect the
 * corpus's own first principle names: `cratylism` states a canonical sign is
 * `INTRINSIC ∧ DISCOVERED ¬coined`, and `cratylism` is itself a value of
 * `engineering-principles` — a dimension this type classified `coined`. The type
 * refuted the axiom it types, in the axiom's own vocabulary.
 *
 * `curated` is the repair and not a euphemism. A cold read ranked it first for
 * carrying closure, ownership and maintenance at once, which is the exact
 * contrast that matters against `enum` (`catalog` loses the agency — it never
 * says WHOSE). Its one stated cost, that it understates invention, is the whole
 * point here: under cratylism nothing was invented, only selected. `open` does
 * NOT subsume it — the three are MECE on ownership, so this is a rename, never a
 * merge.
 *
 * ── `enum` → `latent` (2026-08-05) — the SECOND member the axiom refuted ───────
 *
 * `curated` repaired the third member and left this one unexamined. The GLOSSES were
 * always MECE on ownership — model · agent · corpus — which is why the merge was
 * refused; the SIGNS were not. `open` and `curated` are plain words about how a set
 * is held or tended. `enum` was programming-language type vocabulary naming a
 * REPRESENTATION, and it misfired inside its own register: `enum` decodes as "a
 * closed list written down in the source", while this member's whole gloss is that
 * the corpus wrote NONE of them down — it read them out of the model. The sign
 * asserted what the gloss denied, the same shape of defect as `coined`. Worse, under
 * `enum`'s own prediction this member and `curated` become indistinguishable: both
 * are closed finite lists, and the one fact that separates them — who authored the
 * values — is exactly the fact `enum` cannot carry.
 *
 * HOW THE COLLAPSE WAS DETECTED. Six independent blind forward decodes of the axis
 * "who owns the value-set" returned six DIFFERENT winners (`vocabulary` · `domain` ·
 * `provenance` · `admission` · `valueSource` · `sourcing`). Argmin undefined — the
 * signature of a signified that is not yet one concept. Two independent blind
 * reverse decodes then named one cause, and supplied the falsifier: hold the field
 * word fixed and swap this member for a party sign, and all nine field candidates go
 * from strained to clean at once. Nine failing on one element is evidence, not
 * coincidence — so the member, not the field, was the defect.
 *
 * WHY `latent`. `cratylism` itself carries `model-latent-space = real stable
 * concepts`, so the member that means "the model's own set, discovered not
 * authored" wears the sign the axiom already gave it, and the type now QUOTES its
 * axiom where it used to contradict it.
 * A blind reverse decode dissented, scoring `latent` 4/10 and preferring
 * `model-native`/`model`. Both of its winners are occupancy-blocked:
 * `model` is a live dimension name (`export type Model`), and `model-native` is a
 * near-homonym of the live `llm-native` value three agents compose. ⊥ 2026-08-05:
 * `native` (occupied — `llm-native`, and harness-native event vocabulary) ·
 * `discovered` (occupied — cratylism's own `DISCOVERED`) · `intrinsic` (occupied —
 * cratylism's `INTRINSIC`) · `innate` (free and clean, but no corpus grounding, and
 * it fights the truth that a model's vocabulary IS learned) · `given` · `learned`
 * (reads as mutating-from-telemetry, which inverts the closure) · `emergent` ·
 * `endogenous` (imported jargon, breaks register with `open`/`curated`).
 */
export type Repertoire = 'latent' | 'open' | 'curated' | 'fixed';

/**
 * How many values a dimension field holds:
 * - `scalar`    — one value;
 * - `set`       — many;
 * - `slots`     — exactly one value per named {@link Slot}, in slot order;
 * - `attribute` — no field on an agent at all: its values are attributes of the
 *   values other dimensions hold (the enforcement level of an {@link Entry}).
 */
export type Arity = 'scalar' | 'set' | 'slots' | 'attribute';

/** One named coordinate of a `slots` dimension, with an optional plain gloss. */
export interface Slot {
  readonly name: string;
  readonly gloss?: string;
  /** `true` ⇒ a role may leave this coordinate unfilled; every other slot takes exactly one value. */
  readonly optional?: true;
}

// ── The mark ────────────────────────────────────────────────────────────────

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
 * (`Value<'guardrials'>`). That check LIVES IN THE CORPUS, which owns the manifest
 * and derives its own `Dimension` from it (canon's `Value<D extends
 * Dimension>`) — the projector cannot be the home of WHICH dimensions exist and
 * still be projecting a design rather than containing one. Nothing is lost.
 *
 * Forge's internals never needed it: `project/index.ts` writes `Value<string>` to
 * mean "a value of ANY dimension", and nothing in forge branches on a dimension's
 * identity. The machinery is structural; this states it.
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
  readonly fragment: Enforcing<string>;
  /** Agents whose `ir(a)` composes it. DERIVED; sorted for byte-stable output. */
  readonly agents: readonly string[];
}

/**
 * A fragment that carries its OWN enforcement: the shape a value takes when it
 * binds to events.
 *
 * ONE artifact, TWO FACES. `body` is the declaration: inline, read by the same
 * reasoning it governs. `substrate` + `events` are
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
  readonly events: readonly [EventName, ...EventName[]];
  /**
   * The mechanism this value is realized BY — an ANCHOR, never the mechanism.
   *
   * A command, a timeout, a matcher or worker bytes are all PROJECT-register
   * content, emitted per harness by deploy; a fragment carries only `events` and
   * `substrate`. They were briefly carried here and that broke
   * BEING/FACE — a being holding one face's shell script cannot have many faces.
   *
   * Absent ⇒ the anchor α of this value is its own mechanism key.
   */
  readonly realizedBy?: string;
  /** Anchors this value references. */
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
export const isDimensionValue = (u: unknown): u is Value<string> =>
  typeof u === 'string' || enforcing(u as Value<string>);

/** The declaration face of a value, enforcing or not — what the Target renders. */
export const bodyOf = <O extends string>(v: Value<O>): Fragment<O> =>
  enforcing(v) ? v.body : v;

/**
 * The anchor α of a value — the stable name, the body minus its residue.
 *
 * A body is `⟨α, residue⟩`, rendered `α ≜ residue`, or bare `α` when the residue
 * is ∅ (the ideal σ*). This is the one home for that split: keying anything on a
 * body means keying on its residue's text too, whereas α is what the value
 * IS. A bare anchor returns itself — absence of ` ≜ ` means residue ∅, never that
 * the anchor is missing.
 */
export const anchorOf = <O extends string>(v: Value<O>): string => {
  const body = bodyOf(v);
  const i = body.indexOf(' ≜ ');
  return i < 0 ? body : body.slice(0, i);
};

// ── The runtime dimension descriptor ────────────────────────────────────────
// A consumer that needs a dimension's metadata at runtime
// reads the manifest its corpus declares. This package owns the SHAPE of an entry;
// WHICH dimensions exist is the corpus's to state, and the corpus derives its own
// `Dimension` union and per-dimension aliases from it with the helpers below.

/** The runtime-readable metadata for one dimension. */
export interface DimensionMeta {
  /**
   * The factor GROUP the dimension is filed under. Groups are ordered by their
   * first appearance in the manifest, and the projected text has one section each.
   */
  readonly group: string;
  /**
   * How the value-catalog is sourced (the `Repertoire`).
   *
   * This field read `kind` until 2026-08-05, which put a second concept on a sign
   * forge's `FragmentKind` (a value's structural shape) already carried. A blind
   * reverse decode read `kind` here as "the closure policy of the dimension's value
   * space" and ranked this site's claim on the sign weakest — `kind` fires "variant
   * tag answering what is this?", and this is a property ABOUT the dimension, not
   * the dimension's identity.
   */
  readonly repertoire: Repertoire;
  /** How many values the dimension field holds (the `Arity`). */
  readonly arity: Arity;
  /**
   * The DEFAULT enforcement level of the values an agent holds here; an entry
   * that states none takes it. `null` ⇒ no enforcement level applies.
   */
  readonly level: EnforcementLevel | null;
  /**
   * How the dimension reaches a harness: `text` is rendered into the agent's
   * body; `binding` is never text — it compiles to the harness's settings.
   */
  readonly projection: 'text' | 'binding';
  /** The named coordinates of a `slots` dimension, in order. Absent otherwise. */
  readonly slots?: readonly Slot[];
  /**
   * May an agent hold this dimension EMPTY? Absent ⇒ it may (`[]`).
   *
   * Catalog DATA, not a type-level special case. Whether the ideal agent may
   * exist without a given dimension is a canon question, and the one dimension
   * that answers "no" — `guardrails` — used to answer it as a hand-written
   * exception inside the `Agent` interface, i.e. a doctrine the canon stated and
   * the projector enforced with no link between them.
   */
  readonly required?: true;
}

/**
 * One value AS AN AGENT HOLDS IT: the catalog value, the enforcement level it
 * holds at (the enforcement-level factor is an attribute, so it lives here and
 * never as a field of its own), the slot it fills for a `slots` dimension, and a
 * qualifier the design states (e.g. `in realization`).
 */
export interface Entry<D extends string = string> {
  /** The catalog value, body `'<anchor> ≜ <gloss>'`. */
  readonly value: Value<D>;
  readonly level: EnforcementLevel | null;
  /** The slot it fills, for arity `slots`. */
  readonly slot?: string;
  /** A qualifier the design states, e.g. `in realization`. */
  readonly note?: string;
}

/**
 * A dimension MANIFEST: name → metadata. Membership is the definiendum — adding
 * an entry is what makes that dimension exist for the corpus that declares it.
 *
 * Distinct from a catalog (`DimensionName → ℘(fragment)`), which is the
 * same index set with a different codomain: a catalog maps a dimension to its
 * VALUES, a manifest maps it to its METADATA (group/repertoire/arity/level/…). That
 * disambiguation used to live only in the prose.
 *
 * This is the parameter type of every function that reads one, and no projector
 * ships an instance: a projector that can only ever read the one it contains is
 * not projecting a design. The instance rides the PLUGIN
 * (`AgentPlugin.manifest`).
 *
 * A corpus declares its manifest `as const satisfies Record<string, DimensionMeta>`
 * — the `satisfies` is LOAD-BEARING. A plain annotation widens the keys to
 * `string`, which silently collapses every derivation below to `string` and
 * takes the whole corpus's dimension typing with it.
 */
export type DimensionManifest = Readonly<Record<string, DimensionMeta>>;

/** A plugin as the manifest resolution sees one: a name, and the manifest it
 *  declares (or does not). The structural slice of `AgentPlugin` this needs. */
export interface ManifestDeclaring {
  readonly name: string;
  readonly manifest?: DimensionManifest;
}

/**
 * The plugin set's DIMENSION MANIFEST: the per-key merge of every declared one, in
 * `extends` order, later plugin winning that key — and every override reported.
 *
 * PER-KEY, not last-manifest-wins, and that is the whole point rather than a
 * tie-break detail: a consumer must be able to ADD a dimension to the design it
 * extends without forking that design, which a whole-manifest contest makes
 * impossible. A dimension keeps the POSITION of the plugin that first declared it,
 * because `agentBody` reads section order off `Object.keys` — an override changes a
 * dimension's metadata, never where its section lands.
 *
 * No plugin declaring one is a REFUSAL, not a fallback. There is no resident
 * manifest to stand in: a plugin set with no dimensions would project every agent
 * as an empty Target — a silent, plausible-looking nothing, which is the one failure
 * a byte diff of the output cannot tell from a corpus that shrank.
 */
export function mergeManifest(
  plugins: readonly ManifestDeclaring[],
  log: (line: string) => void = () => {},
): DimensionManifest {
  const merged: Record<string, DimensionMeta> = {};
  const declaredBy = new Map<string, string>();
  for (const p of plugins) {
    for (const [dimension, meta] of Object.entries(p.manifest ?? {})) {
      const prev = declaredBy.get(dimension);
      if (prev) log(`  override dimension ${dimension}: ${prev} → ${p.name}`);
      merged[dimension] = meta;
      declaredBy.set(dimension, p.name);
    }
  }
  if (declaredBy.size === 0) {
    throw new Error(
      `no plugin in the set declares a dimension manifest (${plugins
        .map((p) => p.name)
        .join(
          ', ',
        )}) — a corpus owns WHICH dimensions exist and must carry them on its plugin as \`manifest\``,
    );
  }
  return merged;
}

/** kebab-case → camelCase, at the type level. The bridge between a dimension's
 *  NAME (how the canon files it) and its FIELD (how a vector carries it). */
export type KebabToCamel<S extends string> = S extends `${infer H}-${infer T}`
  ? `${H}${Capitalize<KebabToCamel<T>>}`
  : S;

/** The vector field a dimension occupies — derived, never transcribed. */
export type DimensionFieldName<D extends string = string> = KebabToCamel<D>;

// ── Generic derivation over a manifest ──────────────────────────────────────
// A corpus states its manifest ONCE and reads its whole dimension type-system out
// of it with these. Each is the generic form of a derivation that used to be
// written against forge's own resident one; the manifest is now a parameter,
// which is the entire difference between projecting a design and containing one.

/** Every dimension name manifest `A` declares — a literal union when `A` is a
 *  `satisfies`-checked const, and `string` when the `satisfies` was dropped. */
export type DimensionOf<A extends DimensionManifest> = keyof A & string;

/** The dimensions of `A` holding MANY values — read off `arity`, so a dimension's
 *  arity is stated once and cannot disagree with itself. */
export type SetDimensionOf<A extends DimensionManifest> = {
  [D in DimensionOf<A>]: A[D]['arity'] extends 'set' ? D : never;
}[DimensionOf<A>];

/** The dimensions of `A` an agent may NOT hold empty — read off `required`. */
export type RequiredDimensionOf<A extends DimensionManifest> = {
  [D in DimensionOf<A>]: A[D] extends { required: true } ? D : never;
}[DimensionOf<A>];

/** The dimensions of `A` that occupy a FIELD on an agent: every one whose arity
 *  is not `attribute` (an attribute rides the entries of the others). */
export type FieldDimensionOf<A extends DimensionManifest> = {
  [D in DimensionOf<A>]: A[D]['arity'] extends 'attribute' ? never : D;
}[DimensionOf<A>];

/**
 * Every dimension FIELD an agent carries under manifest `A`: one list of
 * {@link Entry} per non-attribute dimension, whatever its arity. A scalar holds
 * one entry, a `slots` dimension one per slot, a set any number; an explicitly
 * empty set is `[]`, and there is no `null`.
 *
 * Arity, the slot names and `required` are manifest DATA, checked where an agent
 * is composed (the corpus's composition refuses a scalar without exactly one
 * entry, a slot left unfilled, or a required dimension held empty); the name of
 * each field is derived here, so it is stated exactly once, where the dimension
 * is declared.
 */
export type DimensionFieldsOf<A extends DimensionManifest> = {
  readonly [D in FieldDimensionOf<A> as DimensionFieldName<D>]: readonly Entry<D>[];
};

/**
 * The STRICT agent vector over manifest `A` — the shape a corpus exports as its
 * own `Agent`, and the shape its agent modules are authored against.
 *
 * Every dimension key is REQUIRED (completeness law); an empty dimension is
 * spelled `[]`, never a missing key.
 */
export type AgentOf<A extends DimensionManifest> = Agent & DimensionFieldsOf<A>;

/** kebab → camel at RUNTIME, the exact operation `KebabToCamel` performs at the
 *  type level. One rule, both registers, so the map cannot disagree with itself. */
export const kebabToCamel = <S extends string>(s: S): KebabToCamel<S> =>
  s.replace(/-(\w)/g, (_, c: string) => c.toUpperCase()) as KebabToCamel<S>;

// ── The Agent: a typed dimension-selection vector ───────────────────────────────

/**
 * An agent as FORGE sees one: the IDENTITY face, and nothing about which
 * dimensions it selects over.
 *
 * A corpus's own agents are the strict `AgentOf<typeof itsCatalog>` — a flat,
 * explicit dimension vector (depth 1, composition over inheritance) whose fields
 * each carry a list of {@link Entry}. Forge is deliberately blind to that half:
 * nothing here branches on a dimension's identity, so it reads the dimension
 * fields STRUCTURALLY off the manifest it is given (`dimensionValueOf`) and never
 * names one. Name, description, mark and key are identity details, not
 * dimensions.
 *
 * No index signature: a strict `AgentOf<A>` must stay assignable here without
 * relying on implicit-index-signature inference.
 */
export interface Agent {
  /** The agent's name (its module / deploy identity). */
  readonly name: string;
  /** σ_human* — the human-read one-line selection bound → Target frontmatter
   *  `description:` the subagent-router reads (NOT σ*). The one-level-up twin of
   *  the skill `description`. */
  readonly description: string;
  /** The emoji·hue mark (drives color) — data, not a fragment. `null` ⇒ none. */
  readonly mark: Mark | null;
  /** RESERVED for ipseic agents (decision 0048); always empty. */
  readonly key: null;
  /**
   * OPTIONAL — the anchor of the role this agent HOLDS. Absent ⇒ the agent holds
   * none.
   *
   * NOT A DIMENSION READ, and that is the reason it is a field. A corpus may state
   * a role as one of its dimensions, but the projector is contractually blind to
   * dimension identity (see `dimensionValueOf`), so the held role could not reach
   * an adapter at all unless the corpus's own fold copies its anchor here.
   */
  readonly holds?: string;
  /**
   * OPTIONAL — the anchors of the model tier and thinking effort this agent runs
   * at, copied by the corpus's own fold from its model dimension. Absent ⇒ the
   * host's default. A harness binds it through a model role named for the agent.
   */
  readonly routing?: { readonly tier: string; readonly effort: string };
  /**
   * OPTIONAL — the agent's typed handoff: the JSON Schema its assignment must fit
   * when it is dispatched or launched, and the one its deliverable must fit when
   * it returns. Copied by the corpus's own fold from the contracts its assignment
   * and deliverable values carry. Absent ⇒ its handoff is free text.
   *
   * A harness binds the deliverable as its own output schema and shows the
   * assignment form to a session that may dispatch the agent.
   */
  readonly contract?: AgentContract;
  /**
   * OPTIONAL — the NAMES of the skills this agent operates through. Absent ⇒
   * omitted, and an empty list means the same thing as absent. Carried on the
   * identity face, projected by whichever adapter has somewhere to put it.
   *
   * NOT A DIMENSION, and deliberately outside any manifest. STRUCTURALLY, a
   * dimension's value is a branded σ* fragment that `agentBody` emits into the
   * Target; a skill name is an ADDRESS a host resolves against its own skill tree.
   * CONCEPTUALLY, a dimension is a trait — who this agent is — and which skills it
   * loads is APPARATUS, the equipment it reaches for.
   *
   * WHAT A HARNESS RECEIVES IS THE CLOSURE, not this list: projection hands each
   * adapter these names followed by every skill they transitively compose, so
   * an agent starts with the whole of what its skills rely on. A HARNESS whose
   * agent definition can name skills it preloads carries that closure natively
   * — omp as front-matter `autoloadSkills`, claude as the subagent `skills`
   * field. A harness with no such field gets the closure as a
   * required-reading declaration in its instructions, and projection warns.
   */
  readonly skills?: readonly string[];
  /**
   * OPTIONAL — that this agent runs in a git worktree of its own. Absent ⇒ it runs
   * where its dispatcher does.
   *
   * A DECLARATION, NOT A TEACHING. How an agent uses a worktree is its own
   * competence and nothing it reads need explain it; what this states is only that
   * the HARNESS starts the agent in one, so the rule does not depend on the agent
   * remembering to follow it. The value names the kind of isolation rather than a
   * flag, so a corpus that later needs another kind adds a member, not a field.
   *
   * A HARNESS whose agent definition can start an agent in a worktree of its own
   * carries it natively — claude as the subagent `isolation` field. A harness with
   * no such field emits nothing, and projection warns, as it does for skills a
   * harness cannot preload.
   */
  readonly isolation?: 'worktree';
}

/**
 * Read one dimension FIELD off an agent, by the field name the manifest derives.
 *
 * The one place forge crosses from the identity face to the dimension face. It
 * returns `unknown` on purpose: forge knows a field holds a list of entries and
 * knows nothing about WHICH dimension — the strict typing of that field is the
 * corpus's, discharged where the agent is authored.
 */
export const dimensionValueOf = (a: Agent, field: string): unknown =>
  (a as unknown as Record<string, unknown>)[field];

// ── The Skill: a self-sufficient set-builder cell ───────────────────────────

/**
 * A skill's σ* payload string — the self-sufficient set-builder block. A nominal-
 * branded `string` with the SAME shape as `Fragment<O>` (optional phantom brand,
 * so a plain string literal still assigns): keys the notation to its role so `tsc`
 * rejects a raw string where a skill's formal block is expected.
 */
export type SkillExpression = string & { readonly __skillExpr?: true };

/**
 * Any JSON-serializable value, read-only all the way down so an `as const` literal
 * assigns. The shape of data that crosses a process boundary as bytes — here, the
 * configuration a skill hands its runtime capability through the host config.
 */
export type JsonValue =
  | string
  | number
  | boolean
  | null
  | readonly JsonValue[]
  | { readonly [key: string]: JsonValue };

/** How a skill cell deploys, beyond the default agent-resident projection. */
export interface SkillDeploy<C extends CapabilityName = CapabilityName> {
  /**
   * The RUNTIME capability this skill is a face of. When set, the projection ALSO
   * emits a THIN SHIM `scripts/<capability>.mjs` that forwards to the host-installed
   * `cratylus <capability>` CLI — NOT a bundle of the impl (the capability logic
   * lives host-side behind the runtime port, installed once per host).
   * Absent ⇒ SKILL.md only (unchanged). This REVERSES the superseded design in which
   * forge composed a standalone, dependency-free `.mjs` at build time.
   *
   * `configuration` is what the capability receives from the corpus: data, never
   * code, and no opinion here about any capability's keys. `install` emits it into
   * the host runtime config keyed by `capability`, beside the event vocabulary, so
   * meaning the runtime needs reaches it as configuration rather than as a second
   * copy spelled inside the runtime. */
  readonly runtime?: {
    readonly capability: C;
    readonly configuration?: JsonValue;
  };
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
export interface Skill<C extends CapabilityName = CapabilityName>
  extends SkillDeploy<C> {
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
  /** OPTIONAL doctrine-AGNOSTIC leading block, emitted VERBATIM as the SKILL.md's
   *  first section (above the fenced formal block). The engine knows only "a
   *  leading block"; a cell whose laws apply a principle fills it (canon sets its
   *  prime principle on the skills that name concepts by anchor), so the
   *  principle rides the projected bytes of exactly those cells. Absent ⇒ omitted. */
  readonly preamble?: string;
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

// ── Source-cell type kernel — the generic `hook` cell shape ─────────────────────
// The doctrine-free hook cell shape + the generic config-IR lift. The concrete
// cell instances live in the consuming corpus (canon).
export {
  type HookCell,
  type HookMessage,
  type HookSource,
  type HookSubstrate,
  type HookWorker,
  type ProjectionFact,
  type ProjectionFacts,
  hookIrOf,
  resolveWorker,
} from './hook-cell.js';
export type { Rule, Ruleset } from './rule.js';
export type { AgentContract, JsonSchema } from './contract.js';

// The event SHAPE — the peer of `CapabilityName` above, re-exported beside the cell
// shapes it types. The MEMBERS are the corpus's, so there is nothing else here to
// export.
export type { EventName } from './hook/index.js';

// ── The plugin authoring surface ────────────────────────────────────────────
//
// MOVED HERE FROM `@cratylus/forge/resolve` on 2026-08-05, retiring the last
// property-2 breach: `canon/src/index.ts` — the corpus ROOT — had to import
// `defineAgentPlugin` from the PROJECTOR in order to declare things that are the
// corpus's own. Nothing depends on projection; that is the rule, and this was the
// last edge violating it.
//
// The move is not a judgement call. `AgentPlugin` imported exactly one thing,
// `DimensionManifest` from this package, and `defineAgentPlugin` is
// `(plugin) => plugin` — a pure identity factory with ZERO forge dependency. It
// sat in the projector by history, not by need, and "the shapes a corpus authors
// against" is this package's charter.

/**
 * WHERE a plugin's cells live on disk — the package-relative dirs a
 * projector scans to discover them.
 *
 * This is the half of a plugin declaration that is pure DISCOVERY MECHANICS: it
 * answers "where do I look", which is mapping, and mapping is the projector's to
 * own. It is named rather than left as loose fields so the projector can take
 * a `Layout` without taking a whole plugin.
 *
 * DIR RESOLUTION: an imported plugin OBJECT loses its package-root provenance, so
 * a plugin SELF-LOCATES its dirs to ABSOLUTE paths against its own
 * `import.meta.url` (see canon's default export). The config-is-code loader uses
 * those verbatim and resolves a RELATIVE dir against the config file's dir only
 * as a local/dev fallback.
 */
export interface Layout {
  /** Fragment (dimension-value) dir, package-relative — scanned `<dir>/<dim>/*.ts`. */
  readonly fragments?: string;
  /** Preset AGENT dir, package-relative — scanned `<dir>/*.ts`. */
  readonly agents?: string;
  /** Preset SKILL dir, package-relative — scanned `<dir>/*.ts`. */
  readonly skills?: string;
  /** Dir of hook cell modules this plugin contributes (harness-substrate only). */
  readonly hooks?: string;
}

/**
 * A PRACTICE — a way of working a corpus offers as one installable choice: the
 * agents, skills and hooks that carry it, installed together.
 *
 * A practice is CLOSED under skill composition: every agent it installs finds every
 * skill it composes, and projection refuses a chosen set that is not closed rather
 * than render one whose agents name skills it does not carry.
 *
 * It is data, not a dimension and not a cell: nothing about WHO an agent is
 * changes by being in one.
 */
export interface Practice {
  /** The name an install offers and a render is asked for. Unique in the set. */
  readonly name: string;
  /** σ_human* — the one line an install shows a consumer deciding whether to take it. */
  readonly description: string;
  /** The agents this practice installs, by name. */
  readonly agents: readonly string[];
  /**
   * The skills this practice installs BEYOND those its agents are given. A skill
   * an agent is given (`Agent.skills`) travels with the agent and need not be
   * repeated here; a skill no agent carries (a practice made of skills alone) is
   * named here. Whatever the skills compose comes with them.
   */
  readonly skills?: readonly string[];
  /**
   * The hook cells, by id, this practice registers BEYOND those its agents'
   * compositions bind. A hook bound by a composition travels with the agents that
   * compose what it binds and is named nowhere; a cell that binds no composition, and
   * exists for what a practice's agents declare rather than compose, is named here, so
   * that every install that places those agents places the cell. A cell every practice
   * needs is {@link Plumbing.hooks} instead.
   */
  readonly hooks?: readonly string[];
  /** `true` ⇒ a fresh install selects this practice unless the operator declines. */
  readonly preselected?: true;
}

/**
 * The PLUMBING a corpus's practices depend on: installed with any practice, offered
 * as none. A cell here belongs to no practice, and names what other parts need
 * rather than a way of working.
 */
export interface Plumbing {
  /** Skills installed with any practice; whatever they compose comes with them. */
  readonly skills?: readonly string[];
  /** Hook cells, by id, registered with any practice and bound to no agent. */
  readonly hooks?: readonly string[];
}

/**
 * A package's plugin declaration: its {@link Layout}, plus what it contributes.
 *
 * `name` stays on the wrapper because uniqueness is a registry-level property no
 * single plugin can enforce, and a corpus with the same doctrine under a
 * different label is the same corpus. The label is not constitutive.
 *
 * The plugin carries no leading doctrine block. The prime principle rides only
 * the cells whose laws apply it (`Skill.preamble`, and an agent's own held
 * stance), so a cell that does not use it never holds a host's
 * authored surfaces to this corpus's naming axiom.
 */
export interface AgentPlugin extends Layout {
  /** The namespace segment — reporting + per-plugin σ* uniqueness. NOT an address. */
  readonly name: string;
  /**
   * WHICH dimensions exist, and each one's metadata — the manifest INSTANCE, as
   * against the meta-model (that a dimension has a group/repertoire/arity/level) above.
   *
   * It rides the plugin for a plain reason: a consumer projecting
   * an extended plugin has no access to the plugin's repo, so a manifest left behind
   * there would make the design unprojectable by anyone but its author. A corpus
   * that must edit the projector to declare a dimension does not own its own design.
   *
   * Plugins compose, so the set's manifest is the per-dimension merge in `extends`
   * order (later wins, every override logged) — which is what lets a consumer ADD a
   * dimension without forking the plugin it extends. Nobody declaring one is a
   * REFUSAL, not a fallback: `mergeManifest` THROWS.
   */
  readonly manifest?: DimensionManifest;
  /**
   * WHICH lifecycle events exist — the corpus's harness-agnostic event vocabulary
   * (`names @ corpus`).
   *
   * It rides the plugin for the same reason `manifest` does, and here it also keeps the package boundary exactly: the
   * corpus reaches the projector as DATA, never as an import. The projector needs
   * the members to EMIT the host's runtime configuration; it must not contain them,
   * or a corpus could not name a moment without editing the projector.
   */
  readonly events?: readonly EventName[];
  /**
   * WHICH practices the corpus offers — each a way of working an install offers as
   * ONE choice. Absent ⇒ the corpus declares none and projects every cell, as
   * before.
   *
   * It rides the plugin the way `events` does, and for the same reason: which
   * practices exist is the corpus's to say, so the projector receives them as data
   * and an install only OFFERS what is declared. Plugins compose: a later plugin's
   * practice of the same name replaces an earlier one's.
   */
  readonly practices?: readonly Practice[];
  /**
   * What every practice is installed with and none is offered as — see
   * {@link Plumbing}. Plugins compose: the set's plumbing is the union.
   */
  readonly plumbing?: Plumbing;
  /**
   * WHICH rulesets the corpus offers — each one standard convention's rules, which
   * an install offers whole, rule by rule, or not at all. Absent ⇒ none.
   *
   * It rides the plugin the way `practices` does: which rulesets exist is the
   * corpus's to say, and the projector receives them as data. Plugins compose: a
   * later plugin's ruleset of the same name replaces an earlier one's.
   */
  readonly rulesets?: readonly Ruleset[];
}

/**
 * Declare an agent-plugin. Identity factory: returns its argument unchanged so a
 * consumer addresses the plugin by the IMPORTED BINDING, never a string id. Named
 * `defineAgentPlugin` (not `definePlugin`) to dodge the webpack `DefinePlugin`
 * prior; lineage is Nuxt's `defineNuxtConfig`.
 */
export function defineAgentPlugin(plugin: AgentPlugin): AgentPlugin {
  return plugin;
}
