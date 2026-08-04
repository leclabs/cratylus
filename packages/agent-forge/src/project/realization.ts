// THE SEAM THAT DECIDES ENFORCEMENT MODE.
//
// THE CANON AUTHORS THE IDEAL; THE ADAPTER ADAPTS IT. A constraint is authored
// once, harness-innocent, as the shape it would take if every target could carry
// it. What varies is how much of that a given harness can express. Deciding what
// a shortfall MEANS is this module's job, and only this module's.
//
// A CONSTRAINT HAS TWO FACES, AND ONLY ONE OF THEM IS CONTINGENT.
//
//   face_decl — `body`, the inline σ* declaration, read by the same reasoning it
//               governs. Projected into the agent's own definition by `agentBody`
//               for EVERY composed value, on EVERY harness, UNCONDITIONALLY.
//   face_mech — the harness mechanism. Emitted only where the harness can express
//               it at the scope the composition declares.
//
// This asymmetry is the whole argument. An earlier revision of this module made a
// missing mechanism a HARD BUILD ERROR, reasoning that "a declared bound that
// projects to nothing is indistinguishable from an undeclared one". The premise
// was false: `face_decl` is unconditional, so a bound never projects to nothing.
// The floor is a STEER, never silence. A rule the agent can read still governs the
// agent — by its reasoning rather than around it — which is what every non-enforcing
// dimension value has always been.
//
// So the shortfall is a DEGRADATION, not a failure, and it is reported, not thrown:
//
//   mode = bound  — the harness realizes every event at the composed scope
//   mode = steer  — it cannot; the mechanism is withheld and the declaration carries
//                   the rule alone. WARN, naming what was lost.
//   mode = routed — another substrate entirely; not this adapter's concern, no loss.
//
// DEGRADE IS NOT WIDEN, and the distinction is the one thing here that must not
// blur. Degrading changes HOW STRONGLY the composed agents are bound. Widening
// changes WHICH agents are bound — codex can only declare hooks globally, so
// emitting an unscopable one would govern every agent on the host, a different
// constraint wearing this one's name. Degrading is always available; widening is
// never permitted.
//
// FIRE-ABILITY IS NOT SCOPABILITY. `realizable` answers "can the adapter fire `e`
// at all"; a constraint composed into an agent needs the strictly stronger "can it
// fire `e` FOR THAT AGENT". Codex's `Stop` fires and names nobody. Because MODEL
// once had no word for the second question, the codex adapter grew a private
// `throw` to ask it — a second decision site, invisible because it was never a
// missing string, only a missing distinction. Adapters DECLARE capability
// (`realizes`, `scopes`); this module alone decides what a "cannot" means.

import type { SubstrateEvent } from '@leclabs/agent-schema/hook';
import type { HarnessAdapter } from '../core/harness-adapter.js';

/** A constraint's realization demand: what it is, where it fires, on what, for whom. */
export interface Realizable {
  /** The anchor α — what a warning names, so the reader need not search. */
  readonly anchor: string;
  readonly substrate: string;
  readonly events: readonly SubstrateEvent[];
  /**
   * Agents whose `ir(a)` composes it — MODEL's `f ∈ ir(a)`.
   *
   * Empty ⇒ nothing to narrow to, so scopability is not asked. NOT optional: a
   * scoping demand reachable by omitting a field is a silent pass, the same
   * failure `substrate` is required to prevent.
   */
  readonly agents: readonly string[];
}

/**
 * How strongly a harness can carry a constraint.
 *
 * `bound` and `steer` are MODEL's own two modes — `enforcing(f) ⇔ events(f) ≠ ∅
 * ⟨f binds REGARDLESS of the agent's reasoning ∴ bounds, ¬ steers⟩`. A degraded
 * constraint is not a broken one; it is the same constraint realized at the
 * weaker of the two modes the model already names.
 */
export type EnforcementMode = 'bound' | 'steer' | 'routed';

/** One thing a harness could not carry, and why — the `skipped` half of a projection. */
export interface Loss {
  readonly anchor: string;
  readonly event: SubstrateEvent;
  readonly adapter: string;
  readonly agents: readonly string[];
  /** `unrealizable` — the harness has no peer for this event at all.
   *  `unscopable` — it fires the event but cannot narrow it to the composed agents. */
  readonly reason: 'unrealizable' | 'unscopable';
  /** The operator-facing sentence. Names f · e · adapter · a and what was lost. */
  readonly warning: string;
}

/** What a harness will actually do with a constraint, and what that costs. */
export interface Realization {
  readonly mode: EnforcementMode;
  readonly losses: readonly Loss[];
}

function unrealizableWarning(f: Realizable, event: string, adapter: string) {
  return `enforcing constraint '${f.anchor}' declares event '${event}' on substrate '${f.substrate}', which the '${adapter}' adapter cannot realize. No mechanism is emitted for it. The rule still reaches the agent as a declaration and governs by its reasoning — a steer, not a bound.`;
}

function unscopableWarning(f: Realizable, event: string, adapter: string) {
  return `enforcing constraint '${f.anchor}' is composed into ${f.agents.join(', ')}, but the '${adapter}' adapter cannot narrow its event '${event}' to those agents — the harness gives that hook no agent identifier to match on. Emitting it anyway would govern EVERY agent instead of the ones that composed it, so no mechanism is emitted. The rule still reaches those agents as a declaration and governs by their reasoning — a steer, not a bound.`;
}

/**
 * Is `f` someone else's concern? Routed, not degraded, and not warned.
 *
 * A git-substrate constraint reaching the claude adapter is CORRECT
 * configuration, not a shortfall. Answered before either capability predicate.
 */
export function routes(f: Realizable, adapter: HarnessAdapter): boolean {
  return f.substrate !== adapter.substrate;
}

/**
 * The decision. ONE site — a second one elsewhere is a second place for the law
 * to drift from itself, which has already happened once (see the header).
 *
 * Returns rather than throws: a shortfall is a degradation the operator is told
 * about, never a build they cannot complete. Emitting the mechanism is the
 * caller's job, and it is conditioned on `mode === 'bound'`.
 */
export function realizationOf(
  f: Realizable,
  adapter: HarnessAdapter,
): Realization {
  if (routes(f, adapter)) return { mode: 'routed', losses: [] };
  const losses: Loss[] = [];
  for (const event of f.events) {
    if (!adapter.realizes(event)) {
      losses.push({
        anchor: f.anchor,
        event,
        adapter: adapter.name,
        agents: f.agents,
        reason: 'unrealizable',
        warning: unrealizableWarning(f, event, adapter.name),
      });
      continue;
    }
    // `scopable ⇒ realizable`, so this is asked strictly after, and only of a
    // constraint some agent composes.
    if (f.agents.length > 0 && !adapter.scopes(event)) {
      losses.push({
        anchor: f.anchor,
        event,
        adapter: adapter.name,
        agents: f.agents,
        reason: 'unscopable',
        warning: unscopableWarning(f, event, adapter.name),
      });
    }
  }
  // ANY loss degrades the WHOLE constraint. Emitting the mechanism for a subset of
  // its events would enforce a constraint nobody authored — one that binds on some
  // occasions and not others, with no declaration saying which. The declaration
  // already covers every occasion; a partial mechanism only adds a false floor.
  return { mode: losses.length > 0 ? 'steer' : 'bound', losses };
}
