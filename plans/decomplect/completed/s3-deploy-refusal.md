# S3 · deploy-refusal

**Objective.** Make `deploy` refuse loudly, naming `f · e · adapter`, when an enforcing fragment
declares an event the target adapter cannot realize **on that fragment's own substrate**. This is
the verifier on the seam — the piece that converts a silent-allow failure into a loud-deny one.

**Why this is load-bearing rather than polish.** The convergent modern pattern is: split the
authoring artifact, fuse the runtime artifact, and **put a compiler or verifier on the seam**
(seccomp's declaration → BPF program, gated by the kernel's BPF verifier; Gatekeeper's Rego
ConstraintTemplate → CEL policy generated into the apiserver; a database CHECK compiled into the
insert path). Independently, the strongest stated non-negotiable for any declaration/realization
split is exactly this: _a declaration with no realization on the target substrate must be a hard
build error, never a runtime no-op._ Gatekeeper's fail-open link is described as the single most
expensive bug in this design space. S3 is our verifier.

**The law is SUBSTRATE-RELATIVE — three cases, not two.** `1aa1779` wrote:

    enforcing(f) ∧ ∃e ∈ events(f) : ¬realizable(e,adapter) ⇒ deploy REFUSES

That conflates the last two of these:

| case                                      | correct behaviour                                 |
| ----------------------------------------- | ------------------------------------------------- |
| the adapter realizes `e`                  | emit the mechanism                                |
| the adapter SHOULD realize `e` and cannot | REFUSE, loudly, naming f · e · adapter            |
| `e` belongs to a DIFFERENT substrate      | not this adapter's concern — ROUTE, do not refuse |

So the law to implement is:

    enforcing(f) ∧ substrate(f) = substrate(adapter) ∧ ¬realizable(e,adapter) ⇒ REFUSE

Without the substrate qualifier, deploying to the claude adapter would refuse on a perfectly
correct git-substrate constraint. **My own refusal law would refuse a correct configuration** — the
rubric, not the artifact, was the defect.

**Static inputs (pinned, verified present at authoring):**

- `packages/forge/src/anatomy/hook-cell.ts:32` — `HookEvent = CanonicalEvent | 'vcs.commit.post'`. `vcs.commit.post` is precisely case 3: it has no `CanonicalEvent` peer because it is not a harness event at all.
- `packages/forge/src/anatomy/hook-cell.ts:35` — `HookSubstrate = 'harness' | 'git'`, already exists.
- `packages/forge/src/anatomy/hook-cell.ts:92-101` — `hookIrOf` ALREADY throws on a substrate mismatch (`only harness hooks serialize to settings.json`). Read it: the substrate-relative refusal partly exists. Extend that discipline; do not build a parallel one beside it.
- `packages/canon/src/hooks/praxis-continuity.ts:17` — `substrate: 'git'`, the one git-substrate cell, and the live case-3 instance.

**Constraints.**

- The refusal message names **f, e, and adapter**. A refusal that does not say which fragment, which event, and which adapter sends the reader searching — and the search is where the wrong fix enters.
- Case 3 ROUTES; it does not refuse and does not warn-and-skip. A warning is a silent-allow with a receipt.
- One refusal site. Do not add a second check beside `hookIrOf`'s.
- **`vcs.commit.post` currently warns-and-skips and will now refuse.** That is a live behaviour change on a real cell. It is correct under this law, but confirm it is wanted before landing — a behaviour change discovered by a user is a defect regardless of which law sanctioned it.

**Dependencies.** S1 (needs `events`/`substrate` on a fragment to evaluate).

**Outputs.** the refusal in the deploy path; adapter/deploy tests covering all three cases.

**Completion criteria (falsifier).**

1. **All three cases exercised, each observed:** realizable ⇒ mechanism emitted; should-realize-and-cannot ⇒ refusal naming f · e · adapter; different-substrate ⇒ routed, NOT refused, NOT warned.
2. **The control fires:** case 2 must be observed REFUSING before the test is believed. Assert the defect was present.
3. **The regression this law was nearly written to cause:** deploying the real `praxis-continuity` (git substrate) to the claude adapter succeeds. If it refuses, the substrate qualifier is not wired.
4. The refusal string contains the fragment id, the event, and the adapter name — asserted on content, not on exit code.

**REJECTED if:** case 3 refuses or warns; the message omits any of f/e/adapter; a second refusal
site is added; or the `vcs.commit.post` behaviour change lands unconfirmed.
