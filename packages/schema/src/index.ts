// ─────────────────────────────────────────────────────────────────────────────
// The dimension META-MODEL as a TypeScript type system.
//
// THIS MODULE IS THE CONTRACT, and ONLY the contract. It states that a
// dimension HAS an axis, a repertoire, an arity and a `required`, and it derives an
// entire dimension type-system from any manifest obeying that shape
// (`DimensionOf` · `SetDimensionOf` · `RequiredDimensionOf` · `DimensionFieldsOf`
// · `AgentOf`). It does NOT state WHICH dimensions exist. That is the corpus's,
// and it rides the PLUGIN (`AgentPlugin.manifest`) exactly as `preamble` does — a
// projector holding the manifest is a projector containing a design rather than
// projecting one, and a corpus could not then discover a dimension without
// editing the projector.
//
// A dimension value is a per-dimension **nominal-branded string** — the MODEL
// address shape: `body(c) = ⟨α(c), residue(c)⟩`, the anchor plus the leftover the
// anchor does not already fire (residue ∅ for a true σ*). VISION: _address, don't
// describe._ There is NO `{dimension,slug,definiens}` value object, NO per-value
// phantom metadata — the string carries the body; the module's directory
// (`dimensions/<dimension>/`) is its dimension home (PARTITIONED) and its export
// name is its anchor α (SIGNIFIED).
//
// A corpus (canon is the first) declares its manifest, derives its own
// `Dimension`, `Agent` and per-dimension aliases from it, and authors its
// dimension values / agents / skills against those. Composition is ESM `import`;
// an agent is a flat, explicit dimension vector (`null` = omit-to-inherit). A
// wrong dimension→value or a wrong arity is a **compile error** — the brand keys
// each string to its dimension so an `Actions` cannot be assigned where an
// `Objective` is expected.
//
// Exported from `@cratylus/schema` — NOT from the projector. These are the
// dimension-selection shapes; the config-IR `Agent`/`Skill` translation shapes in
// `@cratylus/forge` are a distinct concept with a distinct home.
// ─────────────────────────────────────────────────────────────────────────────

import type { HookSubstrate } from './hook-cell.js';
import type { EventName } from './hook/index.js';

// ── Type-level metadata axes ────────────────────────────────────────────────

/** The MECE filing axis: how the agent comes across vs what it is inclined to do. */
export type Genus = 'Persona' | 'Constitution';

/**
 * A runtime CAPABILITY name — the BOUND, not the members.
 *
 * This used to read `keyof Omit<RuntimePlugin, 'name'>`, deriving the closed set
 * from the runtime's implementation interface. That was the only `schema →
 * runtime` edge, and it was the wrong kind of borrowing: what this package needs
 * is a **vocabulary** (which names exist), and what it reached for was a
 * **shape** (how those things are implemented). `MODEL.md:22` already rules
 * `shape ⊥ vocabulary` for `Event` — shape here, names in the corpus.
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
 * established sign for the concept (ten uses in `ARCHITECTURE.md`), so adopting
 * `Faculty` would have minted a SECOND sign for one concept — the precise defect
 * `α(cᵢ) = α(cⱼ) ⇒ D(cᵢ) = D(cⱼ)` forbids. */
export type CapabilityName = string;

/**
 * How a dimension's value-catalog is sourced — the axis is WHO OWNS THE VALUE
 * SET, and the three members partition it:
 * - `latent`  — the MODEL's own value set, read out by blind introspection.
 * - `open`    — named PER-AGENT; where identity lives.
 * - `curated` — a closed catalog the CORPUS assembled.
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
 * WHY `latent`, AND WHY IT IS DISCOVERED RATHER THAN COINED. It is already this
 * corpus's sign for exactly this concept. `VISION.md` names the whole discipline
 * LATENT LEXICOGRAPHY and glosses the word: "the vocabulary exists, unsurfaced,
 * awaiting description… Nor is it authored" — in a table whose owner column reads
 * THE MODEL. `cratylism` itself carries `model-latent-space = real stable concepts`.
 * So the member that means "the model's own set, discovered not authored" wears the
 * sign the founding document already gave it, and the type now QUOTES its axiom
 * where it used to contradict it.
 *
 * A blind reverse decode dissented, scoring `latent` 4/10 and preferring
 * `model-native`/`model`, on the ground that nothing in the declaration points at a
 * language model unless the reader already knows the codebase. That objection is
 * answered by `MODEL.md:45`: `decode_cold(f) ≜ decode(f, LLM-priors ∪ Corpus, ∅)` —
 * the CORPUS is admitted to a cold decode; only session-K is excluded. Grounding in
 * `VISION.md` is cold grounding. Both of its winners are occupancy-blocked anyway:
 * `model` is a live dimension name (`export type Model`), and `model-native` is a
 * near-homonym of the live `llm-native` value three agents compose. ⊥ 2026-08-05:
 * `native` (occupied — `llm-native`, and harness-native event vocabulary) ·
 * `discovered` (occupied — cratylism's own `DISCOVERED`) · `intrinsic` (occupied —
 * cratylism's `INTRINSIC`) · `innate` (free and clean, but no corpus grounding, and
 * it fights the truth that a model's vocabulary IS learned) · `given` · `learned`
 * (reads as mutating-from-telemetry, which inverts the closure) · `emergent` ·
 * `endogenous` (imported jargon, breaks register with `open`/`curated`).
 */
export type Repertoire = 'latent' | 'open' | 'curated';

/** Whether a dimension field holds one value (`scalar`) or many (`set`). */
export type Arity = 'scalar' | 'set';

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
  readonly events: readonly [EventName, ...EventName[]];
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

// ── The runtime dimension descriptor (axis / repertoire / arity) ──────────────────────
// A consumer that needs a dimension's metadata at runtime (e.g. `cratylus catalog`)
// reads the manifest its corpus declares. This package owns the SHAPE of an entry;
// WHICH dimensions exist is the corpus's to state, and the corpus derives its own
// `Dimension` union and per-dimension aliases from it with the helpers below.

/** The runtime-readable metadata for one dimension (axis = genus). */
export interface DimensionMeta {
  /** The MECE filing axis (the `Genus` of the dimension's values). */
  readonly axis: Genus;
  /**
   * How the value-catalog is sourced (the `Repertoire`).
   *
   * This field read `kind` until 2026-08-05, which put a THIRD concept on a sign
   * two others already carried, two of them in
   * this package: `RuleCell.kind` (MODEL's `Kind ≜ {fragment, agent, rule, skill}`,
   * one file over) and forge's `FragmentKind` (a value's structural shape). A blind
   * reverse decode of all three read `kind` here as "the closure policy of the
   * dimension's value space" and ranked this site's claim on the sign WEAKEST of
   * the three — `kind` fires "variant tag answering what is this?", and this is a
   * property ABOUT the dimension, not the dimension's identity. `RuleCell` keeps it.
   */
  readonly repertoire: Repertoire;
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
 * A dimension MANIFEST: name → metadata. Membership is the definiendum — adding
 * an entry is what makes that dimension exist for the corpus that declares it.
 *
 * Distinct from MODEL's `catalog : DimensionName → ℘(fragment)`, which is the
 * same index set with a different codomain: a catalog maps a dimension to its
 * VALUES, a manifest maps it to its METADATA (axis/repertoire/arity/required). That
 * disambiguation used to live only in the prose.
 *
 * This is the parameter type of every function that reads one, and no projector
 * ships an instance: a projector that can only ever read the one it contains is
 * not projecting a design. The instance rides the PLUGIN
 * (`AgentPlugin.manifest`), exactly as `preamble` does.
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

/** The dimensions of `A` an agent may NOT omit — read off `required`. */
export type RequiredDimensionOf<A extends DimensionManifest> = {
  [D in DimensionOf<A>]: A[D] extends { required: true } ? D : never;
}[DimensionOf<A>];

/**
 * Every dimension FIELD an agent carries under manifest `A`.
 *
 * Arity and nullability come from the manifest, so the three facts about a
 * dimension (is it multi-valued · may it be omitted · what is it called) are
 * stated exactly once, where the dimension is declared.
 *
 * THE CATCH-ALL LIVES HERE, as `required: true` manifest data rather than a
 * hand-written exception. Attachment-based governance fails OPEN — Spring
 * Security prescribes a catch-all authorization rule for unannotated methods;
 * AppArmor runs unprofiled tasks "in an unconfined state". Two unrelated
 * systems, one weakness, both prescribing a catch-all underneath. Ours is
 * stronger than either because it is `tsc` rather than a runtime backstop: an
 * agent composed without a bound does not compile. WHICH dimension is required
 * is a canon question, and the canon answers it in its own manifest.
 */
export type DimensionFieldsOf<A extends DimensionManifest> = {
  readonly [D in DimensionOf<A> as DimensionFieldName<D>]: D extends SetDimensionOf<A>
    ? D extends RequiredDimensionOf<A>
      ? readonly Value<D>[]
      : readonly Value<D>[] | null
    : D extends RequiredDimensionOf<A>
      ? Value<D>
      : Value<D> | null;
};

/**
 * The STRICT agent vector over manifest `A` — the shape a corpus exports as its
 * own `Agent`, and the shape its agent modules are authored against.
 *
 * Every dimension key is REQUIRED (completeness law); omission is spelled
 * `null` (explicit omit-to-inherit), never a missing key.
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
 * carry branded values, arity-checked, `null` for omit-to-inherit. Forge is
 * deliberately blind to that half: nothing here branches on a dimension's
 * identity, so it reads the dimension fields STRUCTURALLY off the manifest it is
 * given (`dimensionValueOf`) and never names one. `archetype` and `provenance`
 * are NOT fragment dimensions — archetype is a plain identity description,
 * provenance the structured `{mark}`.
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
  /** OPTIONAL doctrine-AGNOSTIC leading block, emitted VERBATIM above `## Archetype`
   *  by `agentBody`. The engine knows only "a leading block"; a consumer fills it
   *  (canon injects its founding doctrine so the axiom rides every Target,
   *  intrinsic to the projected bytes rather than ambient repo context). Absent ⇒
   *  omitted. */
  readonly preamble?: string;
  /** σ* — the model-read identity body → Target body. A plain string, not a branded
   *  fragment-dimension, but σ* content nonetheless. */
  readonly archetype: string;
  /** The emoji·hue mark (drives color) — data, not a fragment. */
  readonly provenance: { readonly mark: Mark } | null;
}

/**
 * Read one dimension FIELD off an agent, by the field name the manifest derives.
 *
 * The one place forge crosses from the identity face to the dimension face. It
 * returns `unknown` on purpose: forge knows a field holds a value, a list of
 * values, or `null`, and knows nothing about WHICH dimension — the strict typing
 * of that field is the corpus's, discharged where the agent is authored.
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

/** How a skill cell deploys, beyond the default agent-resident projection. */
export interface SkillDeploy<C extends CapabilityName = CapabilityName> {
  /** Deploy as a host `skills/<name>/` directory (the `memory`-style cell). */
  readonly deployAs?: 'skill-dir';
  /**
   * Committed companion assets, staged by `deploy --assets` ONLY.
   *
   * NOT projected: `projectPluginSet` never reads this field, so a render tree
   * carries no assets and a consumer who never passes `--assets` ships none. The
   * field previously advertised "shipped byte-for-byte with the skill", which
   * overstated a guarantee nothing enforced. The asset-staging bridge that would
   * have honoured it — built for the event-tap capability — was abandoned once the
   * runtime thin shim covered every motivating case, and `runtime` below replaced
   * it. Zero cells declare `assets` today. Kept because `deploy/bundle.ts` still
   * honours it.
   */
  readonly assets?: readonly string[];
  /**
   * The RUNTIME capability this skill is a face of. When set, the projection ALSO
   * emits a THIN SHIM `scripts/<capability>.mjs` that forwards to the host-installed
   * `cratylus <capability>` CLI — NOT a bundle of the impl (the capability logic
   * lives host-side behind the runtime port, installed once per host).
   * Absent ⇒ SKILL.md only (unchanged). This REVERSES the superseded design in which
   * forge composed a standalone, dependency-free `.mjs` at build time. */
  readonly runtime?: { readonly capability: C };
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

// ── Source-cell type kernel — the generic `hook`/`rule` cell shapes ───────────
// The doctrine-free cell shapes (`hook`/`rule`) + the generic config-IR lift. The
// concrete cell instances live in the consuming corpus (canon).
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
export type { RuleCell } from './rule-cell.js';

// The event SHAPE — the peer of `CapabilityName` above, re-exported beside the cell
// shapes it types. The MEMBERS are the corpus's (`MODEL.md:22`), so there is
// nothing else here to export.
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
 * WHERE a plugin's cells live on disk — the four package-relative dirs a
 * projector scans to discover them.
 *
 * This is the half of a plugin declaration that is pure DISCOVERY MECHANICS: it
 * answers "where do I look", which is mapping, and mapping is the projector's to
 * own. It is named rather than left as four loose fields so the resolver can take
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
 * A package's plugin declaration: its {@link Layout}, plus what it contributes.
 *
 * `preamble` AND `manifest` ARE DELIBERATELY NOT GROUPED, and that is a finding
 * rather than an omission. The census that motivated this cut proposed a second
 * interface over the two of them; a blind decode returned **⊥** and gave the test
 * that settles it: they are one concept only if the preamble is the informal face
 * of the vocabulary the manifest formalizes. Inspection says it is not —
 * `foundingDoctrine` is the cratylism naming axiom and says nothing about which
 * dimensions exist.
 *
 * So the only thing the two share is that both must TRAVEL with the plugin. That
 * is a lifecycle property, not a concept, and grouping by it yields non-concepts
 * (`payload`, `carried`, `bundle`). The group would also have been defined
 * negatively — "the fields that aren't paths" — which is exactly how the retired
 * `anatomy` sign became a palimpsest over four concepts. One generation later,
 * the same defect was available and was declined.
 *
 * `name` stays on the wrapper for the same reason: uniqueness is a registry-level
 * property no single plugin can enforce, and a corpus with the same doctrine under
 * a different label is the same corpus. The label is not constitutive.
 */
export interface AgentPlugin extends Layout {
  /** The namespace segment — reporting + per-plugin σ* uniqueness. NOT an address. */
  readonly name: string;
  /**
   * A doctrine-agnostic leading block stamped into every cell this plugin
   * contributes. It must travel WITH the plugin: a consumer projecting an extended
   * plugin has no access to the plugin's own repo context, so an axiom left behind
   * in the corpus's build script would silently vanish from consumer-projected
   * cells — exactly the ambient-dependence the doctrine forbids.
   */
  readonly preamble?: string;
  /**
   * WHICH dimensions exist, and each one's metadata — the manifest INSTANCE, as
   * against the meta-model (that a dimension has an axis/repertoire/arity) above.
   *
   * It rides the plugin for the same reason `preamble` does: a consumer projecting
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
   * (`MODEL.md:22`: `names @ corpus`).
   *
   * It rides the plugin for the third time and the same reason `preamble` and
   * `manifest` do, and here it also serves ARCHITECTURE property 3 exactly: the
   * corpus reaches the projector as DATA, never as an import. The projector needs
   * the members to EMIT the host's runtime configuration; it must not contain them,
   * or a corpus could not name a moment without editing the projector.
   */
  readonly events?: readonly EventName[];
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
