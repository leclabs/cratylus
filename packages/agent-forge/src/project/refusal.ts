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
// THREE CASES, NOT TWO. The law as first written conflated the last two:
//
//     enforcing(f) ∧ ∃e ∈ events(f) : ¬realizable(e,adapter) ⇒ deploy REFUSES
//
// | case                                    | correct behaviour                  |
// | --------------------------------------- | ---------------------------------- |
// | the adapter realizes `e`                | emit the mechanism                 |
// | the adapter SHOULD realize `e`, cannot  | REFUSE, loudly, naming f · e · adapter |
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

import type { HarnessAdapter } from '../core/harness-adapter.js';
import type { SubstrateEvent } from '../core/hook/index.js';

/** A constraint's realization demand: what it is, where it fires, on what. */
export interface Realizable {
  /** The anchor α — what the refusal names, so the reader need not search. */
  readonly anchor: string;
  readonly substrate: string;
  readonly events: readonly SubstrateEvent[];
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
 * Case 3 — is `f` someone else's concern? Routed, not refused, and not warned.
 *
 * A git-substrate constraint reaching the claude adapter is CORRECT
 * configuration, not an error. Answer this before asking `realizes`.
 */
export function routes(f: Realizable, adapter: HarnessAdapter): boolean {
  return f.substrate !== adapter.substrate;
}

/**
 * The refusal. Case 1 returns; case 2 throws naming f · e · adapter; case 3 is
 * routed by the guard above and never reaches `realizes`.
 *
 * ONE site. A second check elsewhere would be a second place for the law to
 * drift from itself, which is the failure this whole plan is written against.
 */
export function assertRealizable(f: Realizable, adapter: HarnessAdapter): void {
  if (routes(f, adapter)) return; // case 3 — not this adapter's to judge
  for (const event of f.events) {
    if (!adapter.realizes(event))
      throw new UnrealizableEventError(
        f.anchor,
        event,
        adapter.name,
        f.substrate,
      );
  }
}
