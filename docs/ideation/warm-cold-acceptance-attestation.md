# warm≡cold acceptance — attestation

_Durable record of the `warm-cold-acceptance` initiative (2026-07-03), retained after the plan scaffold
retired. Git is the fuller record: `git log -- plans/warm-cold-acceptance/`. The law it encodes lives in
source at `packages/agent-anatomy/src/organs/engineering-principles/cold-decode-oracle.ts`
([[cold-decode-oracle]]); the isolated oracle instrument at
`packages/agent-anatomy/src/toolkit/cold-oracle/` (`cold-oracle.sh` + `sweep.mjs`)._

## Criterion (the law, in brief)

A fragment's meaning is its **cold-blind decode** `R_cold(f)` — what a naive isolated reader recovers from
the fragment's own signifiers (+ inline `≜`) alone, zero project context. A warm in-repo reading MUST equal
it: `∀ f · decode_warm(f | K) ≡ R_cold(f) ≡ intent`. Divergence is a **project defect**, corrected **one-way**
by realigning the project toward cold-truth — never by bending the fragment to the warm corpus. The corpus is
the **defendant**; the cold read is the **oracle**.

## Verdict — the corpus is uniformly `warm ≡ cold ≡ intent`

The sweep found **zero fragment defects**. Every gated fragment cold-decoded to its intent (m1 PASS); no
warm≢cold divergence survived (m2 PASS). The self-sufficiency authoring discipline (llm-native · signify/σ\* ·
self-sufficient-formalism · industry-standard anchors) **is** the warm≡cold property — nothing needed bending.

**Coverage** (isolated oracle, `cold-oracle.sh`): all **15 skills**; **21 of 24 organ classes** directly
oracled (the other 3 are single industry-standard-term anchors, `cold ≡ standard ≡ intent` by construction);
including the coined anchors (`correction-consolidation`, `input-untrusted`, delegation's `ρ`-reader-binding).

## The meta-finding — zero-trust on the instrument caught a false mass-realignment

The **only** divergences the sweep surfaced were in the **oracle instrument itself**, not the corpus:

1. **Mood-confound.** An `explain:\n\n<f>` prompt made a skill delineation beginning "use this skill to…"
   read as a _request to invoke a skill_; the reader hunted its skill list and returned "I don't have that
   skill" instead of decoding meaning — a FALSE divergence on 4 clean skills. Fixed: a mood-neutral prompt
   ("Restate what it means in plain language").
2. **Truncation bug** (`sweep.mjs`): a naive first-backtick scan cut delineations at their first internal
   `` ` ``. Fixed: escape-aware extraction.

A confounded oracle would have driven a false mass-realignment of 4 self-sufficient skills — the very
"bend f to a noisy reading" failure the law exists to prevent, here originating in the _instrument_.
**The gate's own harness is untrusted-until-calibrated** (positive control: an ecosystem token must decode to
its GENERIC prior, not the local registry gloss) before it may judge.

## Commutation — divergence 0/4, operator-ratified

Four readers commute through `R_cold` as the fixed point (agreement = each equals the oracle, never
consensus against it): **oracle · nico-inside (warm) · nico-outside (clean) · operator**. Divergence **0/4**
across the sample (incl. the plan's own artifacts). Lex ratified the sampled meanings 2026-07-03.
**Test case #0 GREEN** — the plan is the first artifact to satisfy its own criterion.

## Standing enforcement

- **Author-time (done):** [[exemplify]]'s accept gate `valid(k)` now includes
  `coldpass(k) ⇔ R_cold(body(k)) ≅_R gloss(k) ∧ decode_warm(body(k)|K) ≅_R R_cold(body(k))` and **executes**
  the isolated oracle on the realized body — refusing on divergence. A PROCESS, never a subagent (a subagent
  inherits project-K and reads warm).
- **Boundary gate (open, Mav's lane):** the enforced pre-commit/CI gate over changed fragments is tracked as
  the RTB `standing-oracle-gate` task — the instrument exists (`toolkit/cold-oracle/`); it needs a durable
  hook + headless CI auth.
