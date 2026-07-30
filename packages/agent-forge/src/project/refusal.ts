// THE VERIFIER ON THE SEAM.
//
// A declaration and its realization are split across a substrate boundary, and
// the one non-negotiable for that split is this: a declaration with no
// realization on the target substrate must be a HARD BUILD ERROR, never a
// runtime no-op. Gatekeeper links a Constraint to its template by an untyped
// string `kind`; a typo yields a constraint that matches nothing and fails
// OPEN — silent non-enforcement, and the most expensive bug in this design
// space. The convergent modern answer is to put a compiler or verifier on the
// seam (seccomp's declaration → a BPF program the kernel verifier gates;
// Gatekeeper's Rego template → CEL generated into the apiserver; a database
// CHECK compiled into the insert path). This module is ours.
//
// FOUR CASES, NOT TWO. The law as first written conflated the rest:
//
//     enforcing(f) ∧ ∃e ∈ events(f) : ¬realizable(e,adapter) ⇒ deploy REFUSES
//
// | case                                    | correct behaviour                  |
// | --------------------------------------- | ---------------------------------- |
// | the adapter realizes AND scopes `e`     | emit the mechanism                 |
// | the adapter SHOULD realize `e`, cannot  | REFUSE, loudly, naming f · e · adapter |
// | it fires `e` but cannot NAME the agent  | REFUSE — widening is worse than nothing |
// | `e` belongs to a DIFFERENT substrate    | ROUTE — not this adapter's concern |
//
// So the implemented law is substrate-relative:
//
//     enforcing(f) ∧ substrate(f) = substrate(adapter) ∧ ¬realizable(e,adapter)
//       ⇒ REFUSE
//
// Without the qualifier, deploying a perfectly correct git-substrate constraint
// to the claude adapter would refuse. The rubric, not the artifact, was the
// defect.
//
// FIRE-ABILITY IS NOT SCOPABILITY, and collapsing them cost this module its own
// stated invariant. `realizable` answers "can the adapter fire `e` at all"; a
// constraint composed into an agent needs the strictly stronger "can it fire `e`
// FOR THAT AGENT". Codex's `Stop` fires and names nobody. Because MODEL had no
// word for the second question, the codex adapter grew a private `throw` to ask
// it — a SECOND refusal site, the exact drift the header below forbids, and
// invisible because it was never a missing string, only a missing distinction.
//
// The split restores the seam: an adapter DECLARES what it can do (`realizes`,
// `scopes`); this module alone decides what a "cannot" means for the build.
//
//     own(f,adapter) ∧ f ∈ ir(a) ∧ ¬scopable(e,adapter) ⇒ REFUSE naming f·e·adapter·a
//
// Asked only when some agent composes `f`. A session-wide hook that no agent
// composes has nothing to narrow to, so the question does not arise — `agents`
// empty is not a silent pass, it is a different question.

import type { HarnessAdapter } from '../core/harness-adapter.js';
import type { SubstrateEvent } from '../core/hook/index.js';

/** A constraint's realization demand: what it is, where it fires, on what. */
export interface Realizable {
  /** The anchor α — what the refusal names, so the reader need not search. */
  readonly anchor: string;
  readonly substrate: string;
  readonly events: readonly SubstrateEvent[];
  /**
   * Agents whose `ir(a)` composes this constraint — MODEL's `f ∈ ir(a)`.
   *
   * Empty ⇒ nothing to narrow to, so scopability is not asked. NOT optional: an
   * adapter-narrowing demand reachable by omitting a field is a silent-allow, the
   * same failure `substrate` is required to prevent.
   */
  readonly agents: readonly string[];
}

/**
 * An enforcing constraint the target adapter was obliged to realize and could
 * not. Thrown, never warned: a warning here is a silent-allow with a receipt,
 * and the non-enforcement it announces is invisible at the point it matters.
 */
export class UnrealizableEventError extends Error {
  constructor(
    readonly anchor: string,
    readonly event: string,
    readonly adapter: string,
    readonly substrate: string,
  ) {
    super(
      `enforcing constraint '${anchor}' declares event '${event}' on substrate '${substrate}', which the '${adapter}' adapter cannot realize. An enforcing declaration with no mechanism on its own substrate is silent non-enforcement — refused at build time rather than discovered in production.`,
    );
    this.name = 'UnrealizableEventError';
  }
}

/**
 * An enforcing constraint the target adapter can FIRE but cannot narrow to the
 * agents that composed it.
 *
 * A distinct error, not a variant message: the two failures have opposite
 * remedies. Unrealizable means the bound does not exist on this harness — the
 * constraint or the harness must change. Unscopable means it exists and would
 * over-apply, governing agents that never composed it. Widening is not a
 * degraded success; it is a different, larger constraint than the one declared.
 */
export class UnscopableEventError extends Error {
  constructor(
    readonly anchor: string,
    readonly event: string,
    readonly adapter: string,
    readonly agents: readonly string[],
  ) {
    super(
      `enforcing constraint '${anchor}' is composed into ${agents.join(', ')}, but the '${adapter}' adapter cannot narrow its event '${event}' to those agents — the harness gives that hook no agent identifier to match on. Emitting it anyway would govern EVERY agent instead of the ones that composed it. Refused rather than silently widened.`,
    );
    this.name = 'UnscopableEventError';
  }
}

/**
 * Case 3 — is `f` someone else's concern? Routed, not refused, and not warned.
 *
 * A git-substrate constraint reaching the claude adapter is CORRECT
 * configuration, not an error. Answer this before asking `realizes`.
 */
export function routes(f: Realizable, adapter: HarnessAdapter): boolean {
  return f.substrate !== adapter.substrate;
}

/**
 * The refusal. Emit-case returns; the two cannot-cases throw naming f · e ·
 * adapter (· a); the route-case is caught by the guard above and never reaches
 * either predicate.
 *
 * ONE site. A second check elsewhere would be a second place for the law to
 * drift from itself, which is the failure this whole plan is written against.
 * That drift has already happened once — see the scopability note in the header.
 */
export function assertRealizable(f: Realizable, adapter: HarnessAdapter): void {
  if (routes(f, adapter)) return; // not this adapter's to judge
  for (const event of f.events) {
    if (!adapter.realizes(event))
      throw new UnrealizableEventError(
        f.anchor,
        event,
        adapter.name,
        f.substrate,
      );
    // `scopable ⇒ realizable`, so this is asked strictly after, and only of a
    // constraint some agent composes.
    if (f.agents.length > 0 && !adapter.scopes(event))
      throw new UnscopableEventError(f.anchor, event, adapter.name, f.agents);
  }
}
