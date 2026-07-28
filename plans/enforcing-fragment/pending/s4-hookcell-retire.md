# S4 · hookcell-retire

> **BLOCKED — this shard's premise is FALSIFIED by measurement. Do not execute it as written; its
> completion criteria are unsatisfiable. The fork below is owed to the operator.**

## The falsification

The objective assumed **five** agent-scoped cells. Measured, only **two** are:

| cell                         | substrate | agent-scoped?                                                                 |
| ---------------------------- | --------- | ----------------------------------------------------------------------------- |
| `stance-guardrail`           | harness   | **YES** — 6 `agent_type` refs, live allowlist                                 |
| `stance-guardrail-pre`       | harness   | **YES** — 7 `agent_type` refs, live allowlist                                 |
| `memory-consolidation-nudge` | harness   | **NO** — its 1 `agent_type` hit is a COMMENT stating a Stop hook carries none |
| `resume-availability-notice` | harness   | **NO** — no scoping of any kind                                               |
| `praxis-continuity`          | git       | **NO** — no scoping of any kind                                               |

Three of five have no agent to compose them, so their scope cannot come from composition — there is
nothing to derive it from. They are not agent-scoped policy; they are session/substrate mechanisms.

∴ criterion 2 (`rg HookCell` returns zero) cannot be met by migrating cells into dimension values:
three of them are not dimension values, and forcing them to be would bind a `session.start` notice
per-agent — a semantic change disguised as a refactor, which is the exact `order`-loss failure this
shard's own constraints forbid.

## The fork — OPERATOR

**What is a constraint that binds no particular agent?**

- **(a) `HookCell` NARROWS and survives.** Enforcing fragment ≜ agent-scoped, scope from
  composition. A mechanism that binds the session or the substrate rather than an agent stays a
  hook cell. `HookCell` does not retire; it stops being a Kind-level category error and becomes the
  home of exactly what it always described. **Recommended** — it follows the evidence, keeps
  `Binding` meaning what it says (an agent set derived from `ir(a)`), and matches the resolution
  already reached: the split that pays is rule↔binding, and a substrate mechanism simply has no
  binding face.
- **(b) Everything becomes a fragment**, and the global three bind to all agents. Rejected on the
  evidence: it invents a scope the cells do not have and changes live firing semantics.

This is a MODEL-level taxonomy question, so it is surfaced rather than decided — it changes what an
enforcing fragment IS, and the plan's stated outcome ("`HookCell` retires") is what the measurement
contradicts.

## What is executable TODAY under (a), if chosen

Migrate `stance-guardrail` + `stance-guardrail-pre` only, and delete the `agent_type` allowlist from
both — S2's binding already derives exactly that scope. The other three stay as they are. Criterion
1 (deleting the grep changes nothing observable) still applies and is still the acceptance test.

---

**Original objective (superseded by the fork above).** Migrate the five hook cells to enforcing
guardrail fragments, retire `HookCell`, and delete the runtime `agent_type` allowlist. Terminal
wave; absorbs what the sketch called S5.

**The ORIGINAL blocker (execution locus) was refuted — that resolution still stands, and is not
what blocks this shard now.** This shard waited on: _is an enforcing constraint ONE cell carrying
two loci, or TWO artifacts linked by reference?_ Three independent cold probes converged on ONE
cell. The blocking argument was:

> the cold read of `guardrail` requires the SEPARATE locus, but `fragment` is inline BY DEFINITION,
> so a fragment carrying `events` may be structurally incapable of being a guardrail — and
> `1aa1779` may have retired the one Kind whose locus was right.

**That argument is unsound: execution locus is not what binds.** Out-of-loopness is a _correlate_
of enforceability, not its cause. A subagent runs in a separate context and returns text that the
parent may simply ignore — outside the loop, and purely advisory. A hook that vetoes a tool call
binds absolutely. Both are "separate". The two properties that actually do the work are that the
mechanism is **not argumentatively addressable from inside the context**, and that it sits
**causally between decision and effect**. A fragment's inline-ness disqualifies its DECLARATION
from binding — which was never the declaration's job. `1aa1779` did not retire the wrong Kind.

∴ **one norm, two faces.** Two independently-authored artifacts guarantee silent divergence, and a
declaration that overstates what is enforced is worse than no declaration — it manufactures trust
in an invariant that does not exist. `HookCell` was made a Kind because of its realization payload
(`command`, `workers`), not because it is a different sort of thing. **It was already a fragment
carrying `events` plus its own realization.** That is the whole migration in one sentence.

**Static inputs (pinned, verified present at authoring):**

- The five cells — `packages/agent-canon/src/hooks/{stance-guardrail,stance-guardrail-pre,memory-consolidation-nudge,resume-availability-notice}.ts` (substrate `harness`) and `praxis-continuity.ts` (substrate `git`). Measured: 4 harness, 1 git.
- `packages/agent-forge/src/anatomy/hook-cell.ts` — the type to retire. Its fields, and where each goes: `id`→anchor, `residue`→the fragment body (σ\* declaration), `events`+`substrate`→S1's fields, `command`/`timeout`/`workers`→the realization face, `matcher`→the retained dynamic binding, `order`→run order within an event (SEMANTIC: a blocking gate must evaluate before a non-blocking nudge — do not let a dir-scan impose alphabetical order), `refs`→orphan-ref witness.
- `packages/agent-canon/src/hooks/stance-guardrail-pre.ts` — contains the `agent_type` grep. Also referenced by `packages/agent-canon/test/stance-guardrail-dark.test.ts`.
- `packages/agent-canon/src/hooks/memory-consolidation-nudge.ts` — also matches `agent_type`; both sites die here.

**Constraints.**

- **ONE cell.** Declaration and realization stay in one authored artifact with two faces. Do not split into linked artifacts; do not add a reference between them.
- `order` semantics must survive the migration intact. Losing it silently reorders a blocking gate after a nudge — a correctness change disguised as a refactor.
- The `agent_type` grep dies only AFTER S2's composition binding is proven to mediate. Deleting it first replaces a working ambient scope with nothing.
- Retire `HookCell` completely — no compat alias, no deprecated re-export. A retained alias is a second home for the concept.
- **Do not migrate `rule` on momentum.** Whether `rule` survives is a SEPARATE open question (it activates by `scope`, and it may be the same conflation `hook` was). It is not in this shard.
- The `guardrails` catalog is mis-signified (`honesty`/`helpfulness` STEER, and the cold read of `guardrail` excludes steering). **Do not fix it here** — that is catalog work with its own probes and must not travel inside a structural migration.

**Dependencies.** S2 (binding must mediate before the grep dies), S3 (refusal must exist before
cells relying on substrate routing migrate).

**Outputs.** the five migrated cells; `packages/agent-forge/src/anatomy/hook-cell.ts` deleted;
the `agent_type` grep removed from both sites; tests updated.

**Completion criteria (falsifier).**

1. **The acceptance test for the whole plan:** deleting the `agent_type` grep changes NOTHING observable. Capture the deployed tree BEFORE and diff. If scoping is real the trees match; if they differ, composition binding was not actually mediating and S2 is not done.
2. `rg -n "HookCell|agent_type"` over `packages/` returns ZERO hits.
3. All five cells deploy to the same effective configuration as before — asserted by comparing deployed artifacts, not by the suite passing.
4. `order` is preserved: the blocking gate still evaluates before the nudge. Assert the ORDER explicitly; an alphabetical accident can coincide with the correct order and hide the loss.
5. Full cold suite green; `~/.claude` deploys byte-identical modulo the intended change.

**REJECTED if:** a compat alias for `HookCell` survives; `order` is unasserted; `rule` is migrated;
the guardrails catalog is touched; or criterion 1 is claimed without a before/after diff.
