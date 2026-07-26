# close-out — drive the open plan set to done · mirror

> Working handle, **not** an anchor. Reader = LLM. Runtime folder-state is authority; this doc is a
> derived mirror.

**Status: IN-FLIGHT, bound (`.bound`). Authored 2026-07-26 (mav) by merging the seven open plans
under a grounded three-way census.** `merge : { P₁, P₂, … } ↦ ⋃ Pᵢ`. Each source plan is superseded
by this one and retired; its content survives under `plans/.retired/` as the record.

## Why one plan

Seven plans were open and **not one had an active shard**, so `wake`'s binding predicate was
vacuously false for every one of them and the agent woke structurally unanchored. That defect is
fixed in the `praxis` cell (`bound` · `elect` · WIP=1 · `file`). This plan is the other half: the
open work, reconciled into a single sequenced set, so there is exactly one thing to be bound to.

## What the census established (measured, not asserted)

Three parallel censuses read the plans against the code. Their findings **contradict the plan docs
in four places**, and the code won every time:

| plan claim                                                              | measured truth                                                                                                                                              |
| ----------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------- |
| install-parity S4: "the bin name has exactly one home, one-line change" | **7 homes across 4 packages**, three of them in compiler-unchecked `.mjs`/`.sh`                                                                             |
| agent-runtime: "S9 is the same act as install-parity S4"                | Partially false — they share only the anchor derivation; S9 as specified is a superset, and its own falsifier rejects the two bins that ship today          |
| compiler-projector-split: "MODEL declares ONE `IR`, the code has none"  | Misreading. `MODEL:23` `ir : agent → IR` is **agent-scoped**, and `Agent` (`anatomy/index.ts:215`) already **is** `ir(a)`. MODEL never covered skills/hooks |
| heartbeat-organ: "any shard creating files would be coining by fiat"    | Too strong. True of the two public anchors; false of the port, drain, adapters and gate — ~80% is name-free                                                 |

Three defects are **shipping today** and were owned by no shard:

- **Codex projection emits sessionless shims.** `packages/agent-canon/src/toolkit/runtime-shim.ts`
  is a stale divergent fork of the forge original; the forge copy gained the
  `CLAUDE_CODE_SESSION_ID → AGENT_SESSION_ID` bridge (`f1621b6`), this one did not, and it is live
  via `project-cli-codex.ts:26,156`. Re-opens the phantom-sibling bug.
- **`memory rollover --residue` silently destroys residue.** `cli.ts:978` casts `body as JsonValue`;
  `JsonValue` admits objects, so the natural `[{"body":"…"}]` type-checks and writes a record whose
  body is the wrapper. Exit 0. `rollover` exists precisely so forward state is not lost.
- **Deploy never prunes.** Zero `prune` in `agent-forge/src/deploy/`. The deployed set unions with
  retired artifacts forever — `~/.claude/skills/memory/SKILL.md` is live right now with no source
  cell, instructing agents to run a binary that was deleted.

## Decisions taken (principal, with rationale)

- **The unified CLI dispatcher is ABANDONED**, resolving the contradiction between `agent-runtime`'s
  status line and its own S9 shard file. The `agent-runtime` effort existed to _decomplect_
  build-host from runtime-host; one dispatcher over both re-complects them. `agent-forge` carries 8
  fixed commands while the runtime's verb space is plugin-driven and open, so no static route table
  spans them. **Two bins is correct because two hosts is correct.** S9 shrinks to a rename, which is
  name-gated. Reversible: a dispatcher can be added later if the premise changes.
- **Cratylism-gated work is carved out, not forced.** `∀ name : cold-derivable ∨ ⊥`, and `⊥` is a
  canonical answer. The brand anchor already returned ⊥ once under an under-specified definiendum.
  Those items are listed under §Blocked and are nico's; nothing here coins around them.
- **`compiler-projector-split` does not survive as a package cut.** The census found no aggregate
  type to draw a boundary around, 2 adapters totalling 7 small files, and 198 import sites that
  would churn. What _is_ justified is the I/O extraction inside `project/index.ts` — that ships as
  V7. The package cut is dropped, not deferred.
- **The memory defects are separated from the memory redesign.** All three reproduce with
  deterministic fixes and zero design dependency, so they ship immediately (V2, V3). The
  _architectural_ question — write-time routing signal, an admission test for `PROCEDURAL` bloat,
  dedup — genuinely needs the prior-art survey, so R1 and S3 survive as research and spec.

## Slices (MECE vertical · one concern end-to-end · outputs disjoint within a wave)

| id      | slice                                                                                                              | concern      | deps       | wave | state    |
| ------- | ------------------------------------------------------------------------------------------------------------------ | ------------ | ---------- | ---- | -------- |
| **V1**  | `runtime-shim-dedup` — delete the divergent canon fork; codex uses the forge shim; drop the dead import            | live bug     | —          | 0    | **DONE** |
| **V2**  | `residue-validation` — reject a non-string residue element loudly; align three disagreeing docstrings              | data loss    | —          | 0    | **DONE** |
| **V3**  | `node-scope-severance` — `node()` is provenance, not scope; stop laundering orphans into the global store          | routing      | —          | 0    | **DONE** |
| **V4**  | `deploy-prune` — converge the deploy target to the render tree; kill the orphan `memory` skill                     | live bug     | —          | 0    | **DONE** |
| **V6**  | `guardrail-boundary` — re-measure turn-730 at N=20; reconcile the two colliding rules or record the boundary       | calibration  | —          | 0    | active   |
| **V7**  | `projection-io-extraction` — `projectPluginSet` returns an artifact tree; writes move to the caller                | architecture | —          | 0    | **DONE** |
| **R1**  | `memory-prior-art` — write-time signal vs drain-time inference, in shipped systems; adopt-or-build verdict         | research     | —          | 0    | **DONE** |
| **V10** | `event-tap-skill-cell` — the capability is built and has NO agent-facing surface; a false supersession hid it      | live gap     | —          | 0    | **DONE** |
| **V5**  | `bin-name-single-home` — collapse 7 bin-name homes to 1 under the placeholder; the work S4 claimed was done        | hygiene      | V1         | 1    | active   |
| **V8**  | `resolver-projection-pipe` — the resolver's fold output never reaches the projector; measure impact, fix or record | correctness  | V7         | 1    | active   |
| **S3**  | `memory-execution-spec` — the architectural remedy: write-time signal, admission test, dedup, migration            | spec         | R1, V2, V3 | 1    | active   |
| **M1**  | `store-ceiling-enforced` — the 16 kB bound existed and never fired; recalibrate and enforce at the landing site    | memory       | S3         | 1    | active   |
| **M3**  | `cell-verb-roster-gate` — the verb roster has three homes and only two are gated                                   | memory       | S3         | 1    | active   |
| **M2**  | `dream-cell-pressure-seam` — the cell cannot see the trigger the tool measures                                     | memory       | M1, M3     | 2    | pending  |
| **V9**  | `heartbeat-mechanism` — port, drain, two host adapters, sampling gate, under an explicitly provisional path        | capability   | —          | 2    | **DONE** |

```text
R = {(V5,V1), (V8,V7), (S3,R1), (S3,V2), (S3,V3), (M1,S3), (M3,S3), (M2,M1), (M2,M3)}
wave(0) = { V1, V2, V3, V4, V6, V7, V10, R1 }
wave(1) = { V5, V8, S3 } ; S3 emitted { M1, M3 } → wave(2) = { M2 }
wave(2) = { V9 }
```

Wave 0 fan-out 7, wave 1 fan-out 3 — no non-terminal singleton wave. Output sets are pairwise
disjoint within each wave, so `dispatch(wave(n))` needs no worktree isolation.

**V9 is sequenced last deliberately.** It is net-new capability, not a defect; everything above it
is either shipping-broken or load-bearing for the memory work the operator named as the priority.

## Integration record (2026-07-26) — what parallel execution actually cost

Eight slices landed and were merged one at a time, each gated independently on main. Four
integration regressions surfaced, and **all four were one root cause, which was a defect in the
CUT, not in any shard**:

V7 changed `projectPluginSet` from _writing_ to _returning an artifact tree_. V1, V10 and the
existing suite all had callers that read the projection off disk. Their **output sets were disjoint**
— which is what the wave-0 concurrency law tested — but what is not disjoint is one slice's outputs
against what a sibling's files _compile and run against_. The law was strengthened mid-flight:

    refs : P → ℘(path)
    ∀ t, u ∈ wave(n) : t ≠ u ⇒ outputs(t) ∩ refs(u) = ∅

**The nastiest instance is worth remembering.** When `runtime-shim.test.ts`'s `beforeAll` threw
ENOENT, vitest reported the file as **8 skipped**, not failed. The suite still read green while a
whole file had silently stopped asserting. The signal was the SKIP delta — 1 → 8 — not the pass
count. A green suite is not evidence that the suite ran.

Two further findings, each caught only because the falsifier was run before the fix:

- **V10 would have shipped a dead shim.** The shim emitter is `f(capability)`, so an `eventTap` cell
  emits a shim spawning `agent-runtime eventTap …` — and `main.ts:70` routed only the literal `tap`.
  Projection would have been green with the agent-facing path broken end to end.
- **V9's naive drain duplicated 189 of 320 envelopes** and returned 400 claims for 200 deposits.
  POSIX `rename` over an existing path succeeds silently, so a shared claim destination lets both
  drainers believe they won.

## Blocked — cratylism-gated, nico's remit, not executable here

`⊥` is a legal terminal answer for every one of these. None may be coined around.

| item                     | gate                                                                                                                                                                                                                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| CLI brand anchor         | returned ⊥ once under an under-specified definiendum; re-run with the full differentia. Gates the rename                                                                                                                                                                           |
| heartbeat anchors        | organ · signal · store. Must handle the collision with `ports/memory.ts:399`, where `heartbeat` is already a session-lease verb                                                                                                                                                    |
| bin rename sweep         | deps the brand anchor. V5 does everything that does not need the name                                                                                                                                                                                                              |
| publish flags            | `private:true` ×3, `changesets ignore: []`. Softly gated — publishing under a placeholder burns the PATH name                                                                                                                                                                      |
| repo name · heartbeat O4 | wait indefinitely; an acceptable resting state per `discipline-anchor`                                                                                                                                                                                                             |
| event-tap verb pair      | `install`/**`remove`** breaks the house `install`/`uninstall` pair used by `continuity-hook.sh` and `stance-guardrail.sh`; `read` vs `inspect` likewise. Shipped un-derived — the port method names were mirrored, not oracled. Narrow re-derivation owed; 4 call sites, cheap now |

### Canon-reconciliation flags — nico's, resolve in ONE loop

Raised by `self-sufficiency-redo` and carried in mav's private episodic memory until now, which was
the wrong home: a project-scoped fact belongs to the project, not to an agent's private store. Homed
here so it survives the agent.

1. **concept-record has FOUR anchors** — `TRIPLE` · `Concept` · `concept-contract` · `k`. Pick one;
   the others cite it.
2. **`ρ` CONFLICT** — `signify` says by-design, not-inferred; `exemplify` derives `ρ` from readers.
   Home it in `signify`.
3. **`distill` COLLISION** — `conceptualize` uses it as a predicate; `dream` as a function to DFP.
4. **`minimal` UNDECLARED** corpus-wide.
5. **strategy-refusal DUP** — `exemplify` restates what `materialize` homes.
6. **`loud-refusal` (TS) vs `hoare-elegance-no-permissive-defaults` (ir-bridge)** — same law, two signs.
7. **`priors_R` (elicit) vs `latent-priors` (probe)** — synonyms.
8. **congruence domain-extension** — `introspect` V-values vs C × C.
9. **`fit`/`fittest`/`gap`** — `create-agent` locals, undeclared.
10. **`create-agent` references `exemplify` in notation but `composition: []`** — compose-edge or at-cite?
11. **`precise-circumscription` (probe) vs `circ` (signify)** — is `circ_R` shared?
12. **ir-bridge fixture** `agent-canon.agent-forge.json` wants regeneration.

One already retracted (`e00c837`, a false `principal-ic` staleness claim). **A thirteenth, found
today:** the symbols gate validates fence glyphs against `operator-lexicon` but never checks that an
`X @ home` boundary-binding resolves to a real declaration in that home — which is how
`carry-on`'s `active @ praxis` stayed dangling. Filed as `pending/x-symbols-gate-…`.

### Retired-plan audit (2026-07-26) — four plans were retired carrying ten unfinished shards

`terminal(P) ⇒ retire(P)` was honoured; `retire(P) ⇔ terminal(P)` was not. Verdicts, grounded:

- **ABSORBED, verified** — event-tap T3 (→ S5, falsifier and all), T5 (→ S10), skills-refactor T4
  (absorbed _by reversal_: the dep-free bundle was replaced by the thin shim, which strictly
  dominates it for the same acceptance) and T5 (→ S10).
- **CORRECTLY ABANDONED** — event-tap T2 assets-bridge. Zero live consumers; the runtime-shim path
  covers every motivating case. Residue is a **lying type**: `anatomy/index.ts:279-280` advertises
  "companion assets shipped byte-for-byte" and the projection never reads `cell.assets`. Filed.
- **WRONGLY ABANDONED** — event-tap **T4**, recorded as absorbed into S8 by
  `SUPERSESSION.md:32`. S8 is memory-only; the claim is false against code and the work vanished
  silently. Recovered as **V10**.
- **DUPLICATE** — memory R1/R2/S3, re-authored here. R2 was executed by the census. The merge
  dropped R1/S3's buy-vs-build constraint set, which R1's own verdict then walked into (a cosine
  rung assuming an embedding service); restored into S3.

**The lesson, for the praxis:** a supersession claim is a _claim_. `SUPERSESSION.md:32` asserted an
absorption that the absorbing shard's own falsifier disproves, and nothing checked it. Retiring on an
unverified supersession is how work disappears without anyone deciding to drop it.

## Superseded

`agent-runtime` · `install-parity` · `compiler-projector-split` · `heartbeat-organ` ·
`memory-consolidation` · `stance-guardrail-repair` · `discipline-anchor`. Each carries
`.superseded-by`; content preserved on retirement.
