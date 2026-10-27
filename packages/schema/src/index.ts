// ─────────────────────────────────────────────────────────────────────────────
// The factor META-MODEL as a TypeScript type system.
//
// THIS MODULE IS THE CONTRACT, and ONLY the contract. It states that a
// factor HAS a group, a repertoire, an arity, a default enforcement level and a
// projection, and it derives an entire factor type-system from any manifest
// obeying that shape
// (`FactorOf` · `SetFactorOf` · `RequiredFactorOf` · `FactorFieldsOf`
// · `AgentOf`). It does NOT state WHICH factors exist. That is the canon's,
// and it rides the PLUGIN (`AgentPlugin.manifest`) — a
// projector holding the manifest is a projector containing a design rather than
// projecting one, and the canon could not then discover a factor without
// editing the projector.
//
// A value of a factor is a per-factor **nominal-branded string** of the shape
// `body(c) = ⟨term(c), correction(c)⟩`, the term plus the correction written
// beside it, the term read in its bounded context (the Cratylic name `cratylic(c)`
// is the term with the smallest semantic gap). There is NO
// `{factor,slug,definiens}` value object, NO per-value
// phantom metadata — the string carries the body; the module's directory
// (`factors/<factor>/`) is its factor home (PARTITIONED) and its export
// name is its term.
//
// The canon declares its manifest, derives its own
// `Factor`, `Agent` and per-factor aliases from it, and authors its
// values / agents / skills against those. Composition is ESM `import`;
// an agent is a flat, explicit factor vector of ENTRIES (`[]` = explicitly
// empty). A wrong factor→value is a **compile error** — the brand keys each
// string to its factor so an `Actions` cannot be assigned where an
// `Objective` is expected.
//
// Exported from `@cratylus/schema` — NOT from the projector. These are the
// factor-selection shapes; the config-IR `Agent`/`Skill` translation shapes in
// `@cratylus/forge` are a distinct concept with a distinct home.
// ─────────────────────────────────────────────────────────────────────────────

import type { AgentContract } from './contract.js';
import type { HookSubstrate } from './hook-declaration.js';
import type { EventName } from './hook/index.js';
import type { Ruleset } from './rule.js';

// ── Type-level metadata ─────────────────────────────────────────────────────

/**
 * How firmly a value holds — the repertoire of the canon's enforcement-level
 * factor, which is an ATTRIBUTE of every value an agent holds rather than a value
 * of its own (see {@link Entry.level}).
 * - `advisory` — guidance the agent weighs and may depart from.
 * - `firm`     — holds unless the product owner overrides it.
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
 * already holds for `Event` — shape here, names in the canon.
 *
 * So the members are the canon's, exactly as WHICH factors exist is the
 * canon's. This package states that a capability HAS a name and stops; the canon
 * declares its own set `as const satisfies readonly CapabilityName[]` and narrows
 * `Skill` against it, which is the `FactorManifest`/`MANIFEST` pattern reused
 * rather than a second one invented.
 *
 * NAMING NOTE. A blind decode returned `FacultyName`/`Faculty` and argued it
 * well — the `*Name` suffix is what buys the shape/vocabulary distinction, and
 * that insight is kept here. Its root word is not, because the prompt that
 * produced it wrongly disqualified `capability`: only the plural keyspace
 * `capabilities` is occupied, not the root. `capability` is this architecture's
 * established term for the concept, so adopting
 * `Faculty` would have minted a SECOND term for one concept — the precise defect
 * `term(cᵢ) = term(cⱼ) ⇒ D(cᵢ) = D(cⱼ)` forbids. */
export type CapabilityName = string;

/**
 * How a factor's value-catalog is sourced — WHO OWNS THE VALUE SET, and the
 * four members partition it:
 * - `latent`  — the MODEL's own value set, read out by blind introspection.
 * - `open`    — named PER-AGENT; where identity lives.
 * - `curated` — a closed catalog the CANON assembled.
 * - `fixed`   — a closed list the DESIGN fixes (decision classes, reach
 *   ceilings, the roles); the canon transcribes it, it does not tend it.
 *
 * The third member read `coined` until 2026-08-05, and that was a defect the
 * canon's own first principle names: `cratylism` states a canonical term is
 * `INTRINSIC ∧ DISCOVERED ¬coined`, and `cratylism` is itself a value of
 * `engineering-principles` — a factor this type classified `coined`. The type
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
 * `curated` repaired the third member and left this one unexamined. The MEANINGS were
 * always MECE on ownership — model · agent · canon — which is why the merge was
 * refused; the TERMS were not. `open` and `curated` are plain words about how a set
 * is held or tended. `enum` was programming-language type vocabulary naming a
 * REPRESENTATION, and it misfired inside its own register: `enum` decodes as "a
 * closed list written down in the source", while this member's whole meaning is that
 * the canon wrote NONE of them down — it read them out of the model. The term
 * asserted what the meaning denied, the same shape of defect as `coined`. Worse, under
 * `enum`'s own prediction this member and `curated` become indistinguishable: both
 * are closed finite lists, and the one fact that separates them — who authored the
 * values — is exactly the fact `enum` cannot carry.
 *
 * HOW THE COLLAPSE WAS DETECTED. Six independent blind forward decodes of the axis
 * "who owns the value-set" returned six DIFFERENT winners (`vocabulary` · `domain` ·
 * `provenance` · `admission` · `valueSource` · `sourcing`). Argmin undefined — the
 * signature of a meaning that is not yet one concept. Two independent blind
 * reverse decodes then named one cause, and supplied the falsifier: hold the field
 * word fixed and swap this member for a party term, and all nine field candidates go
 * from strained to clean at once. Nine failing on one element is evidence, not
 * coincidence — so the member, not the field, was the defect.
 *
 * WHY `latent`. `cratylism` itself carries `model-latent-space = real stable
 * concepts`, so the member that means "the model's own set, discovered not
 * authored" wears the term the axiom already gave it, and the type now QUOTES its
 * axiom where it used to contradict it.
 * A blind reverse decode dissented, scoring `latent` 4/10 and preferring
 * `model-native`/`model`. Both of its winners are occupancy-blocked:
 * `model` is a live factor name (`export type Model`), and `model-native` is a
 * near-homonym of the live `llm-native` value three agents compose. ⊥ 2026-08-05:
 * `native` (occupied — `llm-native`, and harness-native event vocabulary) ·
 * `discovered` (occupied — cratylism's own `DISCOVERED`) · `intrinsic` (occupied —
 * cratylism's `INTRINSIC`) · `innate` (free and clean, but no grounding in the canon, and
 * it fights the truth that a model's vocabulary IS learned) · `given` · `learned`
 * (reads as mutating-from-telemetry, which inverts the closure) · `emergent` ·
 * `endogenous` (imported jargon, breaks register with `open`/`curated`).
 */
export type Repertoire = 'latent' | 'open' | 'curated' | 'fixed';

/**
 * How many values a factor field holds:
 * - `scalar`    — one value;
 * - `set`       — many;
 * - `slots`     — exactly one value per named {@link Slot}, in slot order;
 * - `attribute` — no field on an agent at all: its values are attributes of the
 *   values other factors hold (the enforcement level of an {@link Entry}).
 */
export type Arity = 'scalar' | 'set' | 'slots' | 'attribute';

/** One named coordinate of a `slots` factor: its name, and the correction beside it when it needs one. */
export interface Slot {
  readonly name: string;
  readonly correction?: string;
  /** `true` ⇒ a role may leave this coordinate unfilled; every other slot takes exactly one value. */
  readonly optional?: true;
}

// ── The mark ────────────────────────────────────────────────────────────────

/** The emoji·hue mark an agent carries (drives its color). Data, not a value of a factor. */
export interface Mark {
  readonly emoji: string;
  /** Hue token (e.g. `green`), resolved to a terminal color by `markToColor`. */
  readonly hue: string;
}

// ── Per-factor value types (branded strings) ────────────────────────────────────
// A value of a factor is a bare named expression: `export const x: Objective = '…'`.
// Each per-factor type is a nominal-branded `string` — the phantom `__factor` brand
// keys the string to its factor so `tsc` rejects a cross-factor assignment. The
// value's content is the body ⟨term, correction⟩ (rendered `term ≜ correction`, or
// just `term` for a Cratylic name that needs no correction).

/**
 * A bare value: a branded string, keyed to factor `O`.
 *
 * `O extends string`, NOT `O extends Factor` — and DO NOT re-tighten it. The
 * brand discriminates by the type ARGUMENT, not by the constraint: a
 * `BareValue<'guardrails'>` is refused where a `Role` is wanted because the
 * `__factor` properties are incompatible, which holds for any string literal.
 * Measured, not assumed — both the cross-factor refusal and the `required`
 * catch-all survive the relaxation intact.
 *
 * The constraint's ONLY job was catching a misspelled factor name
 * (`Value<'guardrials'>`). That check LIVES IN THE CANON, which owns the manifest
 * and derives its own `Factor` from it (canon's `Value<D extends
 * Factor>`) — the projector cannot be the home of WHICH factors exist and
 * still be projecting a design rather than containing one. Nothing is lost.
 *
 * Forge's internals never needed it: `project/index.ts` writes `Value<string>` to
 * mean "a value of ANY factor", and nothing in forge branches on a factor's
 * identity. The machinery is structural; this states it.
 */
type BareValue<O extends string> = string & { readonly __factor?: O };

/**
 * WHERE an enforcing value binds — the agents that compose it, and nothing else.
 *
 * The `PolicyBinding` face. The rule and its mechanism stay fused in one authored
 * value; SCOPE is the part that separates, and it is DERIVED from `ir(a)` rather
 * than authored. That direction is the whole point: scope written into the
 * enforcement code is invisible from the agent it governs and goes stale
 * silently — the fragile-pointcut failure, whose defining property is that an
 * out-of-date selector "will silently malfunction, as the non-advising of a join
 * point does not manifest a syntax or type error."
 *
 * A `Binding` cannot be constructed without both halves, so a value can never
 * be emitted with its scope missing — the failure mode that reads as "governs
 * everything" or "governs nothing" depending on which way the mechanism fails.
 */
export interface Binding {
  /** The term of the enforcing value this binds. */
  readonly term: string;
  /** The enforcing value itself — declaration + substrate + events. */
  readonly value: Enforcing<string>;
  /** Agents whose `ir(a)` composes it. DERIVED; sorted for byte-stable output. */
  readonly agents: readonly string[];
}

/**
 * A value that carries its OWN enforcement: the shape a value takes when it
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
 * it) and the SCOPE (derived from composition — see `Binding`). A value is
 * harness-innocent by construction; that is what makes one BEING projectable to
 * many FACES.
 */
export interface Enforcing<O extends string> {
  /** The inline declaration — the body ⟨term, correction⟩ this value would be if bare. */
  readonly body: BareValue<O>;
  /** Which substrate the events fire in — the `realize`-target family. */
  readonly substrate: HookSubstrate;
  /** The harness-agnostic events that bind it (≥1 — an empty set is not enforcing). */
  readonly events: readonly [EventName, ...EventName[]];
  /**
   * The mechanism this value is realized BY — a TERM, never the mechanism.
   *
   * A command, a timeout, a matcher or worker bytes are all PROJECT-register
   * content, emitted per harness by deploy; a value carries only `events` and
   * `substrate`. They were briefly carried here and that broke
   * BEING/FACE — a being holding one face's shell script cannot have many faces.
   *
   * Absent ⇒ the term of this value is its own mechanism key.
   */
  readonly realizedBy?: string;
  /** Terms this value references. */
  readonly refs?: readonly string[];
}

/**
 * A factor's VALUE: a bare declaration, or one that enforces itself.
 *
 * The union is what makes `events` PARTIAL. Every existing value stays a bare
 * branded string and compiles untouched; only a value that opts in carries the
 * enforcing shape.
 */
export type Value<O extends string> = BareValue<O> | Enforcing<O>;

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
 * Is `u` a value of a factor at all — bare or enforcing?
 *
 * The catalog scans whole modules and sees every export, so "not a string" was
 * doing double duty as "not a value". Now that a value may be an object, that
 * test would admit any exported object and drop every enforcing one. This is the
 * predicate that actually means what the scan needs, and it is SHAPE-checked
 * rather than truthy-checked: an object that merely exists is not a value.
 */
export const isFactorValue = (u: unknown): u is Value<string> =>
  typeof u === 'string' || enforcing(u as Value<string>);

/** The declaration face of a value, enforcing or not — what the Target renders. */
export const bodyOf = <O extends string>(v: Value<O>): BareValue<O> =>
  enforcing(v) ? v.body : v;

/**
 * The term of a value — the stable name, the body minus its correction.
 *
 * A body is `⟨term, correction⟩`, rendered `term ≜ correction`, or the bare term
 * when it needs no correction (the ideal: a Cratylic name). This is the one home
 * for that split: keying anything on a body means keying on its correction's text
 * too, whereas the term is what the value IS. A bare term returns itself — absence
 * of ` ≜ ` means no correction, never that the term is missing.
 */
export const termOf = <O extends string>(v: Value<O>): string => {
  const body = bodyOf(v);
  const i = body.indexOf(' ≜ ');
  return i < 0 ? body : body.slice(0, i);
};

// ── The runtime factor descriptor ───────────────────────────────────────────
// A consumer that needs a factor's metadata at runtime
// reads the manifest the canon declares. This package owns the SHAPE of an entry;
// WHICH factors exist is the canon's to state, and the canon derives its own
// `Factor` union and per-factor aliases from it with the helpers below.

/** The runtime-readable metadata for one factor. */
export interface FactorMeta {
  /**
   * The GROUP the factor is filed under. Groups are ordered by their
   * first appearance in the manifest, and the projected text has one section each.
   */
  readonly group: string;
  /**
   * How the value-catalog is sourced (the `Repertoire`).
   *
   * This field read `kind` until 2026-08-05, which put a second concept on a term
   * forge's `FragmentKind` (a value's structural shape) already carried. A blind
   * reverse decode read `kind` here as "the closure policy of the factor's value
   * space" and ranked this site's claim on the term weakest — `kind` fires "variant
   * tag answering what is this?", and this is a property ABOUT the factor, not
   * the factor's identity.
   */
  readonly repertoire: Repertoire;
  /** How many values the factor field holds (the `Arity`). */
  readonly arity: Arity;
  /**
   * The DEFAULT enforcement level of the values an agent holds here; an entry
   * that states none takes it. `null` ⇒ no enforcement level applies.
   */
  readonly level: EnforcementLevel | null;
  /**
   * How the factor reaches a harness: `text` is rendered into the agent's
   * body; `binding` is never text — it compiles to the harness's settings.
   */
  readonly projection: 'text' | 'binding';
  /** The named coordinates of a `slots` factor, in order. Absent otherwise. */
  readonly slots?: readonly Slot[];
  /**
   * May an agent hold this factor EMPTY? Absent ⇒ it may (`[]`).
   *
   * Catalog DATA, not a type-level special case. Whether the ideal agent may
   * exist without a given factor is a canon question, and the one factor
   * that answers "no" — `guardrails` — used to answer it as a hand-written
   * exception inside the `Agent` interface, i.e. a doctrine the canon stated and
   * the projector enforced with no link between them.
   */
  readonly required?: true;
}

/**
 * One value AS AN AGENT HOLDS IT: the catalog value, the enforcement level it
 * holds at (the enforcement-level factor is an attribute, so it lives here and
 * never as a field of its own), the slot it fills for a `slots` factor, and a
 * qualifier the design states (e.g. `in realization`).
 */
export interface Entry<D extends string = string> {
  /** The catalog value, body `'<term> ≜ <correction>'`. */
  readonly value: Value<D>;
  readonly level: EnforcementLevel | null;
  /** The slot it fills, for arity `slots`. */
  readonly slot?: string;
  /** A qualifier the design states, e.g. `in realization`. */
  readonly note?: string;
}

/**
 * A factor MANIFEST: name → metadata. Membership is the definiendum — adding
 * an entry is what makes that factor exist for the canon that declares it.
 *
 * Distinct from a catalog (`FactorName → ℘(value)`), which is the
 * same index set with a different codomain: a catalog maps a factor to its
 * VALUES, a manifest maps it to its METADATA (group/repertoire/arity/level/…). That
 * disambiguation used to live only in the prose.
 *
 * This is the parameter type of every function that reads one, and no projector
 * ships an instance: a projector that can only ever read the one it contains is
 * not projecting a design. The instance rides the PLUGIN
 * (`AgentPlugin.manifest`).
 *
 * The canon declares its manifest `as const satisfies Record<string, FactorMeta>`
 * — the `satisfies` is LOAD-BEARING. A plain annotation widens the keys to
 * `string`, which silently collapses every derivation below to `string` and
 * takes the whole canon's factor typing with it.
 */
export type FactorManifest = Readonly<Record<string, FactorMeta>>;

/** A plugin as the manifest resolution sees one: a name, and the manifest it
 *  declares (or does not). The structural slice of `AgentPlugin` this needs. */
export interface ManifestDeclaring {
  readonly name: string;
  readonly manifest?: FactorManifest;
}

/**
 * The plugin set's FACTOR MANIFEST: the per-key merge of every declared one, in
 * `extends` order, later plugin winning that key — and every override reported.
 *
 * PER-KEY, not last-manifest-wins, and that is the whole point rather than a
 * tie-break detail: a consumer must be able to ADD a factor to the design it
 * extends without forking that design, which a whole-manifest contest makes
 * impossible. A factor keeps the POSITION of the plugin that first declared it,
 * because `agentBody` reads section order off `Object.keys` — an override changes a
 * factor's metadata, never where its section lands.
 *
 * No plugin declaring one is a REFUSAL, not a fallback. There is no resident
 * manifest to stand in: a plugin set with no factors would project every agent
 * as an empty Target — a silent, plausible-looking nothing, which is the one failure
 * a byte diff of the output cannot tell from a canon that shrank.
 */
export function mergeManifest(
  plugins: readonly ManifestDeclaring[],
  log: (line: string) => void = () => {},
): FactorManifest {
  const merged: Record<string, FactorMeta> = {};
  const declaredBy = new Map<string, string>();
  for (const p of plugins) {
    for (const [factor, meta] of Object.entries(p.manifest ?? {})) {
      const prev = declaredBy.get(factor);
      if (prev) log(`  override factor ${factor}: ${prev} → ${p.name}`);
      merged[factor] = meta;
      declaredBy.set(factor, p.name);
    }
  }
  if (declaredBy.size === 0) {
    throw new Error(
      `no plugin in the set declares a factor manifest (${plugins
        .map((p) => p.name)
        .join(
          ', ',
        )}) — the canon owns WHICH factors exist and must carry them on its plugin as \`manifest\``,
    );
  }
  return merged;
}

/** kebab-case → camelCase, at the type level. The bridge between a factor's
 *  NAME (how the canon files it) and its FIELD (how a vector carries it). */
export type KebabToCamel<S extends string> = S extends `${infer H}-${infer T}`
  ? `${H}${Capitalize<KebabToCamel<T>>}`
  : S;

/** The vector field a factor occupies — derived, never transcribed. */
export type FactorFieldName<D extends string = string> = KebabToCamel<D>;

// ── Generic derivation over a manifest ──────────────────────────────────────
// The canon states its manifest ONCE and reads its whole factor type-system out
// of it with these. Each is the generic form of a derivation that used to be
// written against forge's own resident one; the manifest is now a parameter,
// which is the entire difference between projecting a design and containing one.

/** Every factor name manifest `A` declares — a literal union when `A` is a
 *  `satisfies`-checked const, and `string` when the `satisfies` was dropped. */
export type FactorOf<A extends FactorManifest> = keyof A & string;

/** The factors of `A` holding MANY values — read off `arity`, so a factor's
 *  arity is stated once and cannot disagree with itself. */
export type SetFactorOf<A extends FactorManifest> = {
  [D in FactorOf<A>]: A[D]['arity'] extends 'set' ? D : never;
}[FactorOf<A>];

/** The factors of `A` an agent may NOT hold empty — read off `required`. */
export type RequiredFactorOf<A extends FactorManifest> = {
  [D in FactorOf<A>]: A[D] extends { required: true } ? D : never;
}[FactorOf<A>];

/** The factors of `A` that occupy a FIELD on an agent: every one whose arity
 *  is not `attribute` (an attribute rides the entries of the others). */
export type FieldFactorOf<A extends FactorManifest> = {
  [D in FactorOf<A>]: A[D]['arity'] extends 'attribute' ? never : D;
}[FactorOf<A>];

/**
 * Every factor FIELD an agent carries under manifest `A`: one list of
 * {@link Entry} per non-attribute factor, whatever its arity. A scalar holds
 * one entry, a `slots` factor one per slot, a set any number; an explicitly
 * empty set is `[]`, and there is no `null`.
 *
 * Arity, the slot names and `required` are manifest DATA, checked where an agent
 * is composed (the canon's composition refuses a scalar without exactly one
 * entry, a slot left unfilled, or a required factor held empty); the name of
 * each field is derived here, so it is stated exactly once, where the factor
 * is declared.
 */
export type FactorFieldsOf<A extends FactorManifest> = {
  readonly [D in FieldFactorOf<A> as FactorFieldName<D>]: readonly Entry<D>[];
};

/**
 * The STRICT agent vector over manifest `A` — the shape the canon exports as its
 * own `Agent`, and the shape its agent modules are authored against.
 *
 * Every factor key is REQUIRED (completeness law); an empty factor is
 * spelled `[]`, never a missing key.
 */
export type AgentOf<A extends FactorManifest> = Agent & FactorFieldsOf<A>;

/** kebab → camel at RUNTIME, the exact operation `KebabToCamel` performs at the
 *  type level. One rule, both registers, so the map cannot disagree with itself. */
export const kebabToCamel = <S extends string>(s: S): KebabToCamel<S> =>
  s.replace(/-(\w)/g, (_, c: string) => c.toUpperCase()) as KebabToCamel<S>;

// ── The Agent: a typed factor-selection vector ──────────────────────────────────

/**
 * An agent as FORGE sees one: the IDENTITY face, and nothing about which
 * factors it selects over.
 *
 * The canon's own agents are the strict `AgentOf<typeof itsCatalog>` — a flat,
 * explicit factor vector (depth 1, composition over inheritance) whose fields
 * each carry a list of {@link Entry}. Forge is deliberately blind to that half:
 * nothing here branches on a factor's identity, so it reads the factor
 * fields STRUCTURALLY off the manifest it is given (`factorValueOf`) and never
 * names one. Name, description, mark and key are identity details, not
 * factors.
 *
 * No index signature: a strict `AgentOf<A>` must stay assignable here without
 * relying on implicit-index-signature inference.
 */
export interface Agent {
  /** The agent's name (its module / deploy identity). */
  readonly name: string;
  /** The human-read one-line selection bound → Target frontmatter
   *  `description:` the subagent-router reads (not the model-read term). The one-level-up twin of
   *  the skill `description`. */
  readonly description: string;
  /** The emoji·hue mark (drives color) — data, not a value. `null` ⇒ none. */
  readonly mark: Mark | null;
  /** RESERVED for ipseic agents (decision 0048); always empty. */
  readonly key: null;
  /**
   * OPTIONAL — the term of the role this agent HOLDS. Absent ⇒ the agent holds
   * none.
   *
   * NOT A FACTOR READ, and that is the reason it is a field. The canon may state
   * a role as one of its factors, but the projector is contractually blind to
   * factor identity (see `factorValueOf`), so the held role could not reach
   * an adapter at all unless the canon's own fold copies its term here.
   */
  readonly holds?: string;
  /**
   * OPTIONAL — the terms of the model tier and thinking effort this agent runs
   * at, copied by the canon's own fold from its model factor. Absent ⇒ the
   * host's default. A harness binds it through a model role named for the agent.
   */
  readonly routing?: { readonly tier: string; readonly effort: string };
  /**
   * OPTIONAL — the agent's typed handoff: the JSON Schema its assignment must fit
   * when it is dispatched or launched, and the one its deliverable must fit when
   * it returns. Copied by the canon's own fold from the contracts its assignment
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
   * NOT A FACTOR, and deliberately outside any manifest. STRUCTURALLY, a
   * factor's value is a branded string that `agentBody` emits into the
   * Target; a skill name is an ADDRESS a host resolves against its own skill tree.
   * CONCEPTUALLY, a factor is a trait — who this agent is — and which skills it
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
   * flag, so a canon that later needs another kind adds a member, not a field.
   *
   * A HARNESS whose agent definition can start an agent in a worktree of its own
   * carries it natively — claude as the subagent `isolation` field. A harness with
   * no such field emits nothing, and projection warns, as it does for skills a
   * harness cannot preload.
   */
  readonly isolation?: 'worktree';
}

/**
 * Read one factor FIELD off an agent, by the field name the manifest derives.
 *
 * The one place forge crosses from the identity face to the factor face. It
 * returns `unknown` on purpose: forge knows a field holds a list of entries and
 * knows nothing about WHICH factor — the strict typing of that field is the
 * canon's, discharged where the agent is authored.
 */
export const factorValueOf = (a: Agent, field: string): unknown =>
  (a as unknown as Record<string, unknown>)[field];

// ── The Skill: a self-sufficient set-builder block ──────────────────────────

/**
 * A skill's model-read payload string — the self-sufficient set-builder block. A nominal-
 * branded `string` with the SAME shape as `BareValue<O>` (optional phantom brand,
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

/** How a skill deploys, beyond the default agent-resident projection. */
export interface SkillDeploy<C extends CapabilityName = CapabilityName> {
  /**
   * The RUNTIME capability this skill is a face of. When set, the projection ALSO
   * emits a THIN SHIM `scripts/<capability>.mjs` that forwards to the host-installed
   * `cratylus <capability>` CLI — NOT a bundle of the impl (the capability logic
   * lives host-side behind the runtime port, installed once per host).
   * Absent ⇒ SKILL.md only (unchanged). This REVERSES the superseded design in which
   * forge composed a standalone, dependency-free `.mjs` at build time.
   *
   * `configuration` is what the capability receives from the canon: data, never
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
 * A skill: its formal block plus the live sibling skills it composes. The
 * name is the term (trigger `= /`+name; verb derivable), so neither is stored.
 * Per-FIELD reader binding: `formalBlock` is the sole model-read payload;
 * `description` is the human-read selection-line the router surfaces (not
 * model-read, not judged for its semantic gap). NO `body` field — the SKILL.md is GENERATED by the adapter
 * as `f(name, formalBlock)`; storing it would be the parse-to-recover / DRY defect
 * this de-braid kills. `composition` is plain imported sibling `Skill`s.
 */
export interface Skill<C extends CapabilityName = CapabilityName>
  extends SkillDeploy<C> {
  /** The skill name — the term; carries the trigger-weight at disclosure. */
  readonly name: string;
  /** The human-read one-line selection bound the router surfaces (not model-read). */
  readonly description: string;
  /** The sole model-read payload: the self-sufficient set-builder block
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
   *  leading block"; a skill whose laws apply a principle fills it (canon sets its
   *  prime principle on the skills that name concepts by term), so the
   *  principle rides the projected bytes of exactly those skills. Absent ⇒ omitted. */
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

// ── The hook declaration type kernel ────────────────────────────────────────────
// The doctrine-free hook declaration shape + the generic config-IR lift. The concrete
// hook declarations live in the canon.
export {
  type HookDeclaration,
  type HookMessage,
  type HookSource,
  type HookSubstrate,
  type HookWorker,
  type ProjectionFact,
  type ProjectionFacts,
  hookIrOf,
  resolveWorker,
} from './hook-declaration.js';
export type { Rule, Ruleset } from './rule.js';
export type { AgentContract, JsonSchema } from './contract.js';

// The event SHAPE — the peer of `CapabilityName` above, re-exported beside the hook
// declaration shape it types. The MEMBERS are the canon's, so there is nothing else here to
// export.
export type { EventName } from './hook/index.js';

// ── The plugin authoring surface ────────────────────────────────────────────
//
// MOVED HERE FROM `@cratylus/forge/resolve` on 2026-08-05, retiring the last
// property-2 breach: `canon/src/index.ts` — the canon's ROOT — had to import
// `defineAgentPlugin` from the PROJECTOR in order to declare things that are the
// canon's own. Nothing depends on projection; that is the rule, and this was the
// last edge violating it.
//
// The move is not a judgement call. `AgentPlugin` imported exactly one thing,
// `FactorManifest` from this package, and `defineAgentPlugin` is
// `(plugin) => plugin` — a pure identity factory with ZERO forge dependency. It
// sat in the projector by history, not by need, and "the shapes the canon is written
// against" is this package's charter.

/**
 * WHERE a plugin's factors, agents, skills and hook declarations live on disk — the package-relative dirs a
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
  /** FACTOR dir, package-relative — each factor's values, scanned `<dir>/<factor>/*.ts`. */
  readonly factors?: string;
  /** Preset AGENT dir, package-relative — scanned `<dir>/*.ts`. */
  readonly agents?: string;
  /** Preset SKILL dir, package-relative — scanned `<dir>/*.ts`. */
  readonly skills?: string;
  /** Dir of hook declaration modules this plugin contributes (harness-substrate only). */
  readonly hooks?: string;
}

/**
 * A package's plugin declaration: its {@link Layout}, plus what it contributes.
 *
 * `name` stays on the wrapper because uniqueness is a registry-level property no
 * single plugin can enforce, and a canon with the same doctrine under a
 * different label is the same canon. The label is not constitutive.
 *
 * The plugin carries no leading doctrine block. The prime principle rides only
 * the skills and agents whose laws apply it (`Skill.preamble`, and an agent's own held
 * stance), so a skill that does not use it never holds a host's
 * authored surfaces to this canon's naming axiom.
 */
export interface AgentPlugin extends Layout {
  /** The namespace segment — reporting + per-plugin term uniqueness. NOT an address. */
  readonly name: string;
  /**
   * WHICH factors exist, and each one's metadata — the manifest INSTANCE, as
   * against the meta-model (that a factor has a group/repertoire/arity/level) above.
   *
   * It rides the plugin for a plain reason: a consumer projecting
   * an extended plugin has no access to the plugin's repo, so a manifest left behind
   * there would make the design unprojectable by anyone but its author. A canon
   * that must edit the projector to declare a factor does not own its own design.
   *
   * Plugins compose, so the set's manifest is the per-factor merge in `extends`
   * order (later wins, every override logged) — which is what lets a consumer ADD a
   * factor without forking the plugin it extends. Nobody declaring one is a
   * REFUSAL, not a fallback: `mergeManifest` THROWS.
   */
  readonly manifest?: FactorManifest;
  /**
   * WHICH lifecycle events exist — the canon's harness-agnostic event vocabulary
   * (`names @ canon`).
   *
   * It rides the plugin for the same reason `manifest` does, and here it also keeps the package boundary exactly: the
   * canon reaches the projector as DATA, never as an import. The projector needs
   * the members to EMIT the host's runtime configuration; it must not contain them,
   * or the canon could not name a moment without editing the projector.
   */
  readonly events?: readonly EventName[];
  /**
   * WHICH rulesets the canon offers — each one standard convention's rules, which
   * an install offers whole, rule by rule, or not at all. Absent ⇒ none.
   *
   * It rides the plugin the way `events` does: which rulesets exist is the
   * canon's to say, and the projector receives them as data. Plugins compose: a
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
