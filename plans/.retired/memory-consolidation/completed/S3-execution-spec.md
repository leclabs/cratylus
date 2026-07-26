# S3 — author the execution spec

**Wave 1 · deps: R1, R2 · state: pending (blocked until both land) · NOT delegable blind**

## Intent

Produce the execution specification that de-clunks the memory system: what changes, in what order, with
what acceptance, sized as a reorganization-and-repair rather than a rewrite.

**This is the deliverable the praxis exists for** — the follow-up execution-spec generation task the
operator asked to be recorded rather than improvised. It is `pending` on purpose. Writing it before the
prior art is read and the defects are reproduced would repeat, one level up, exactly the failure it exists
to fix.

## Inputs

- `ready/R1-findings.md` — the prior-art survey, especially its verdict on write-time signal vs
  drain-time inference, and its adopt/build call
- `ready/R2-findings.md` — the reproduced defects, their mechanisms at file:line, and the true defect count
- `PLAN.md` §Census — the established seam, notably: `tags` is contractually barred from routing, so
  **there is no write-time routing signal by design**
- The live stores, as re-measured by R2

## The decisions this spec must make

1. **Write-time signal: adopt, or reject with a reason.** The operator's hypothesis is architecturally
   well-founded — routing is currently 100% deferred inference over free-form prose. But `record.ts:26`
   states `tags` may "Refine, never route (SPEC D2/D4)", so adopting it means either a **new field** or
   **amending that contract**. Decide which, and if a new field: `cratylism` governs — cold-derive the
   name, do not coin it. Undiscovered ⇒ ⊥, and say so.
2. **The deterministic/inference boundary, decision by decision.** Enumerate every decision the pipeline
   makes (route · dedup · admit · merge · compact · drop) and assign each to mechanism or model. Every
   model call needs a justification for why mechanism cannot do it. This is the operator's stated
   priority and R1 Q3 supplies the prior art.
3. **The admission test.** If R2 confirms D1/D2/D3 collapse into "nothing tests admission", this is the
   central fix and the spec is mostly about it. Define it: what is tested, against what, mechanically.
4. **The skill seam.** What "the tooling drives the agent" concretely means at the `dream`/`wake` boundary
   — which verbs, which order, what the tool refuses. R1 Q1's consolidation-trigger findings constrain it,
   as does the settled finding (carried from `heartbeat-organ`) that consolidation is gated by
   pressure/salience, never clocked.
5. **Migration.** The live stores hold real memory. State what happens to existing records under the new
   scheme, and prove the migration is lossless or state precisely what it drops.

## Constraints

- **Reorganize, do not redesign.** If the spec proposes replacing the store model or the fold engine, it
  has failed its brief — record that as a separate finding and scope this to repair.
- **Shard the spec MECE**, each shard independently executable and independently verifiable, each with a
  falsifiable acceptance that fails on the pre-state.
- **No new dependency** without R1 having judged it against local-first / no-network / no-embedding-service
  / runs-in-a-hook.
- **`cratylism`** on every new name. **No `git push`.**

## Outputs

- `plans/memory-consolidation/SPEC.md` — the execution specification
- Shard files under `pending/` for each unit of work the spec defines, wired into `PLAN.md`'s wave table

## Acceptance

- Every decision in "The decisions this spec must make" is **decided**, with its rationale and the R1/R2
  evidence it rests on. A spec that re-opens a question R1 or R2 already answered FAILS.
- The deterministic/inference table is complete over the enumerated decisions, and every model call carries
  its justification.
- Every shard has an acceptance criterion that **provably fails on the pre-state** — the same falsifier
  discipline this plan's own shards are held to.
- The migration section states losslessness or names exactly what is dropped.
- Total scope is legibly a repair. If the shard count or blast radius reads as a rewrite, the spec is
  rejected and re-cut.

**Falsifier (must fail on the pre-state):** `SPEC.md` does not exist, no decision is made, no shard is cut.
Acceptance fails on every criterion today.

## Blocked-by

`R1` and `R2`. Do not start this shard on partial inputs — the whole point of its position in wave 1 is
that a spec written ahead of its evidence is the defect being repaired.


---

**DISPOSITION (mav, 2026-07-26) — RE-AUTHORED AND EXECUTED in `close-out`.**

Produced `plans/.retired/close-out/SPEC.md`, which refused both of R1's recommendations with
measurement rather than deferring to them — the right way round for a spec consuming research.

The decisive finding: `STORE_WATERMARK` **already existed at 16,000** and
`nico/PROCEDURAL.md` was **15,969 bytes** — 31 under, never fired, on the exact file called
bloated. And the dedup ladder has **zero yield at every rung** (0 exact duplicates across 46
records) because the phenomenon does not occur in this store; the real defect is
record↔projection *restatement*.

Root cause named: the dream cell declared `gate : home → findings` while `auditHome` also
returns `pressure`, the only trigger `depalimpsest` has. **The tool measured the trigger the
cell could not see.** Shipped as M1 (ceiling, both write paths), M3 (verb-roster gate) and M2
(the seam), all completed.
