// `@cratylus/schema/hook` — the SHAPE of a lifecycle binding, and NOT its
// vocabulary.
//
// The shape lives here; the names live in the canon — `@cratylus/canon`'s
// `CANONICAL_EVENTS`, one declaration every other site derives or receives. A
// package that needs a VOCABULARY takes it from the one home that declares it.
// `CapabilityName` states that a capability HAS a name and stops; {@link EventName}
// is its peer and stops in the same place.
//
// `vcs.commit.post` is an ordinary canon member carrying `substrate: 'git'`: an
// open `EventName` needs no union to admit a git-substrate event.
//
// A HOOK DECLARATION NAMES AN ACT, NEVER A TOOL. Tool sets are OPEN-WORLD (MCP
// servers add tools at run time, users add their own, two harnesses overlap only in
// shell/file primitives), so a closed enum over them would be permanently
// incomplete. The declaration names the ACT instead — `product-owner.consult.pre`,
// `subagent.dispatch.pre` — which is an ordinary member of the lifecycle vocabulary,
// and the adapter COMPUTES the native pair ⟨event, selector⟩ from it
// ({@link NativeBinding}). Declaration-level harness-neutrality is structural: there
// is no field for a vendor tool name to sit in. A path-scoped need would arrive as a
// field of its own.
//
// A LEAF module by construction: it imports nothing.

/**
 * A lifecycle EVENT NAME — the BOUND, not the members.
 *
 * The vendor-neutral PIVOT every harness adapter maps from
 * (`adapters/<harness>/events.ts`), stated here as a shape and enumerated by the
 * canon. Exactly the `CapabilityName` treatment, for exactly its reason: what
 * this package needs of an event is that it HAS a name;
 * WHICH names exist is a naming act, and naming is the canon's.
 *
 * The canon declares its own set `as const satisfies readonly EventName[]` and
 * narrows `HookDeclaration` against it, so a hook naming an undeclared event is a compile
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
 * refused). It is also below the declaration shapes, so a `HarnessAdapter` can declare
 * which substrate it realizes on without this module reaching upward.
 */
export type Substrate = 'harness' | 'git';

/**
 * A lifecycle hook — the wire shape the sibling `HookDeclaration` lifts into (`hookIrOf`)
 * before a `HarnessAdapter.hooks()` projects it onto a harness's native settings
 * surface.
 *
 * Hand-authored, as every other shape in this package is: seven fields, with the
 * event vocabulary left to the canon.
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
 * `product-owner.consult.pre` names an ACT (about to put a question or a menu to the
 * product owner); on claude that act is `PreToolUse` narrowed to the tool that performs
 * it, and the tool's NAME is a vendor fact the adapter holds. A declaration that
 * spelled it would choose one harness's face on a harness-agnostic shape.
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
   * IT IS A FIELD, not a convention, because SILENCE IS THE DEFECT. A harness whose
   * selector cannot express the act's narrowing can FIRE `product-owner.consult.pre`
   * and cannot NARROW it, so the hook runs on every tool call there. Declaring the
   * loss beside the binding makes the report structural: the serializer has the
   * sentence in hand at the only moment it could stay quiet.
   */
  readonly unnarrowed?: string;
}

/**
 * The realization payload for ONE enforcing constraint on ONE harness — what
 * `realize(c, adapter)` yields and `inject` writes.
 *
 * Lives HERE, in the project register, and NEVER on the source declaration: it is a
 * function OF the adapter. A declaration carrying a command would be a BEING holding
 * one FACE's bytes, and could not have many faces.
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
   * a function OF the adapter (claude takes the {@link NativeBinding} of the
   * act), so it is COMPUTED at
   * realization and never read off a source declaration.
   */
  readonly matcher?: string;
  /** Run order within an event — SEMANTIC: a blocking gate precedes a nudge. */
  readonly order?: number;
  /** Verbatim worker payloads — the byte-identity pins of the deployed mechanism. */
  readonly workers: readonly HarnessWorker[];
}

/** One worker payload a mechanism ships. */
export interface HarnessWorker {
  readonly filename: string;
  readonly targetPath: string;
  readonly content: string;
  readonly executable: boolean;
}
