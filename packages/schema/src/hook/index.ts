// `@cratylus/schema/hook` — the SHAPE of a lifecycle binding, and NOT its
// vocabulary.
//
// `MODEL.md:22` rules this verbatim:
//
//   Event ≜ the harness-agnostic lifecycle vocabulary ⟨corpus-owned ⟨a name for a
//   moment ∴ signification⟩ ; shape ⊥ vocabulary : shape @ schema · names @ corpus ;
//   the PIVOT every adapter maps from⟩
//
// This module held the NAMES until 2026-08-05 — 28 of them, emitted from a sibling
// `hook.schema.json` by a sibling generator — while `runtime/src/events.ts` held the
// same 28, hand-authored, identical as sets AND in order, with nothing enforcing it.
// That is the IDENTICAL defect the `schema → runtime` repair fixed one axis over: a
// package reaching for a VOCABULARY and being handed one by whichever module
// happened to spell it. `CapabilityName` states that a capability HAS a name and
// stops; {@link EventName} is its peer and stops in the same place. The members are
// the corpus's — `@cratylus/canon`'s `CANONICAL_EVENTS`.
//
// WHAT DISSOLVED WITH THE ENUM. `SubstrateEvent = CanonicalEvent | 'vcs.commit.post'`
// existed only because the enum was CLOSED: a git-substrate event had no literal to
// be, so the union widened by exactly one string. With an open `EventName` there is
// nothing to widen — `vcs.commit.post` is an ordinary corpus member carrying
// `substrate: 'git'`, and the union, the generator and the JSON schema are gone.
//
// WHAT DISSOLVED WITH `matcher` (2026-08-05). `Hook` and `HookCell` each carried a
// `matcher`, and this package described the one field THREE ways at once: the
// `HarnessMechanism` law below (a mechanism lives HERE and NEVER on the source
// cell), `HookCell.matcher` (documented with a claude tool-name regex as its own
// example), and the emitted `Hook.matcher` (a harness-agnostic glob). The third
// described a UNION of two unlike things — path-glob narrowing, genuinely
// harness-agnostic, and tool-name narrowing, harness-native — and zero path-glob
// matchers existed in the corpus, so parsimony deletes the field rather than
// picking one of its senses. A future path need arrives as its own field, never as
// an overloaded `matcher`.
//
// WHAT REPLACED IT is not a tool vocabulary. Tool sets are OPEN-WORLD (MCP servers
// add tools at run time, users add their own, two harnesses overlap only in
// shell/file primitives), so a closed enum over them is permanently incomplete. The
// cell names the ACT instead — `operator.consult.pre`, `subagent.dispatch.pre` —
// which is an ordinary member of the lifecycle vocabulary, and the adapter COMPUTES
// the native pair ⟨event, selector⟩ from it ({@link NativeBinding}). Cell-level
// harness-neutrality is structural after that: there is no field left for a vendor
// tool name to sit in.
//
// A LEAF module by construction: it imports nothing.

/**
 * A lifecycle EVENT NAME — the BOUND, not the members.
 *
 * The vendor-neutral PIVOT every harness adapter maps from
 * (`adapters/<harness>/events.ts`), stated here as a shape and enumerated by the
 * corpus. Exactly the `CapabilityName` treatment, for exactly the reason
 * `MODEL.md:22` gives: what this package needs of an event is that it HAS a name;
 * WHICH names exist is a signification act, and signification is the corpus's.
 *
 * A corpus declares its own set `as const satisfies readonly EventName[]` and
 * narrows `HookCell` against it, so a cell naming an undeclared event is a compile
 * error. What CANNOT be narrowed that way — an adapter's map, a host's config —
 * is what the census gate exists to hold.
 */
export type EventName = string;

/**
 * Which SUBSTRATE a constraint's events fire in — the `realize`-target family.
 *
 * Lives HERE, beside the event shape, because the two are one fact: an event is
 * only meaningful relative to the substrate it fires in, and the refusal law is
 * substrate-relative (an event belonging to another substrate is ROUTED, not
 * refused). It is also below the cell shapes, so a `HarnessAdapter` can declare
 * which substrate it realizes on without this module reaching upward.
 */
export type Substrate = 'harness' | 'git';

/**
 * A lifecycle hook — the wire shape the sibling `HookCell` lifts into (`hookIrOf`)
 * before a `HarnessAdapter.hooks()` projects it onto a harness's native settings
 * surface.
 *
 * HAND-AUTHORED since 2026-08-05. It was emitted from `hook.schema.json`, and the
 * generator's whole payload beyond this interface was the event enum — a JSON
 * file, a generator, an emitted union and a `gen` script, all ceremony around a
 * vocabulary that was never this package's to hold. The shape is seven fields and
 * is now authored where every other shape in this package is.
 */
export interface Hook {
  /** Stable identifier; usually the source filename without extension. */
  id?: string;
  /** Canonical events that trigger this hook (≥1). */
  events: [EventName, ...EventName[]];
  /** Shell command to execute when the hook fires. */
  command: string;
  /** Timeout in seconds. Defaults to the client default when omitted. */
  timeout?: number;
  targets?: string[];
  excludes?: string[];
}

/**
 * What ONE canonical event becomes on ONE harness: its native event name, plus the
 * native SELECTOR that event needs there — the pair an adapter emits.
 *
 * THE SELECTOR IS COMPUTED, NEVER DECLARED. A canonical event like
 * `operator.consult.pre` names an ACT (about to put a question or a menu to the
 * operator); on claude that act is `PreToolUse` narrowed to the tool that performs
 * it, and the tool's NAME is a vendor fact the adapter holds. A cell that spelled it
 * would have chosen a face — which is exactly what one cell did, with
 * `matcher: 'AskUserQuestion|Agent|SendMessage'` sitting on a harness-agnostic shape.
 *
 * MANY ACTS MAY SHARE ONE NATIVE EVENT, which is why this is a binding rather than
 * an entry in the plain `canonical → native` map: that map must reverse (native →
 * canonical, for a reader), and a map with three keys on `PreToolUse` cannot.
 */
export interface NativeBinding {
  /** The harness's own event name — `PreToolUse`, `SubagentStop`, … */
  readonly event: string;
  /** The harness-native selector this act needs on that event, when expressible. */
  readonly matcher?: string;
  /**
   * WHY this harness cannot express the act's selector, when it cannot — the
   * adapter's own words, routed to the projection's `warnings`.
   *
   * IT IS A FIELD, not a convention, because SILENCE IS THE DEFECT. Codex reads
   * `matcher` as a regex over `agent_type`, so it can FIRE `operator.consult.pre`
   * and cannot NARROW it; it used to drop the narrowing without a word and the hook
   * ran on every tool call there. Declaring the loss beside the binding makes the
   * report structural: the serializer has the sentence in hand at the only moment
   * it could stay quiet.
   */
  readonly unnarrowed?: string;
}

/**
 * The realization payload for ONE enforcing constraint on ONE harness — what
 * `realize(c, adapter)` yields and `inject` writes.
 *
 * Lives HERE, in the project register, and NEVER on the source cell. MODEL:
 * `mechanism : fragment × harness-adapter ⇀ harness-mechanism ⟨what deploy EMITS⟩`
 * — a function OF the adapter. A cell carrying a command is a BEING holding one
 * FACE's bytes, which is why it could no longer have many faces.
 */
export interface HarnessMechanism {
  /** The fire command — references the deployed worker path. */
  readonly command: string;
  /** Timeout in seconds; adapter default when omitted. */
  readonly timeout?: number;
  /**
   * Residual DYNAMIC selector (client-native regex) for subject-scoped events.
   *
   * THE ONLY REGISTER THAT MAY HOLD ONE — see the law above, and the header. It is
   * a function OF the adapter (codex generates `^(mav|nico)$` from composition;
   * claude takes the {@link NativeBinding} of the act), so it is COMPUTED at
   * realization and never read off a source cell.
   */
  readonly matcher?: string;
  /** Run order within an event — SEMANTIC: a blocking gate precedes a nudge. */
  readonly order?: number;
  /** Verbatim worker payloads — the byte-anchors of the deployed mechanism. */
  readonly workers: readonly HarnessWorker[];
}

/** One worker payload a mechanism ships. */
export interface HarnessWorker {
  readonly filename: string;
  readonly targetPath: string;
  readonly content: string;
  readonly executable: boolean;
}
