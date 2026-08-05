# formal-block-self-sufficiency

**Status: COMPLETE — all shards landed, full canon suite green (113 pass/1 skip).** Owner: session `555c4985` (mav).
Residual (documented, not silent): praxis R1 `-- plan-retirement` = nico-ratified admissible boundary-prose, `ALLOW_LIST={praxis}`; 3 whitespace-gap glosses in `formalize.ts` deferred (mechanically ambiguous vs notation; gate tallies them). Follow-ups: nico 2nd-order items (canonizable/accept overlap; root `.md` outside SYMBOLS scan); whitespace-gap detector; praxis plan-lifecycle formalization when plan-set dynamics are designed.
Derived from nico's D5 ruling + the signify×symbolic-notation review (`.scratchpad/signify-review-jul-22/`).
This file is a mirror of runtime state (task-files in state folders); the folders are authority.

## Intent

Enforce `self-sufficient-formalism` on **every** formal block in the corpus: no `--` annotation may carry
a law or a definition — that load belongs in notation. The signify×symbolic review proved the degradation
is live (`signify.ts` had a mint-law and a `dec`-definition hiding in comments) and generalized the rule
corpus-wide (nico D5; the rule is already canon in `formalize.ts`, stricter). Deliver: a **gate** that
detects the violation, a **drained corpus** that passes it, and a **success-gate** wiring per-symbol probe
round-trip into the canon lifecycle so regressions can't re-enter.

## Ground truth (census, 2026-07-22)

15 skill formal blocks under `packages/canon/src/skills/`. `--` annotation surface (raw counts, NOT
all violations — primitive glosses + β∪ι citations are admissible): exemplify 28, praxis 23, conceptualize
23, signify 16, materialize 11, elicit 8, dream 7, introspect 6, create-agent 6, probe 4, create-skill 4,
handoff 3, formalize 3. **Already drained this workstream:** signify.ts σ\*-cluster (nico), probe.ts
experiment/coverage (mav U3). **Untouched, in-scope:** signify.ts ρ-region (L47–66) + all other blocks.

## Admissibility rule (from nico D5, canonical in formalize.ts)

A formal block carries prose in exactly two legitimate places: (a) a **primitive's** by-value declaration
gloss (`⟨anchor, gloss⟩`, where formalization bottoms out); (b) **boundary-bind / invocation-context**
citations (β∪ι). Everything else — a `--` on a law or a defined symbol — is a violation, forked:

- **redundant** (content reconstructable from other notation in the same block) → **delete** (R2 lesson:
  the fork MUST check redundancy-elsewhere BEFORE choosing formalize, else it mis-forks — as the review's
  own `dec` example was mis-forked).
- **load-bearing** (content absent from notation) → **formalize** into a symbol/law, then delete.

## Slices (MECE, vertical concern)

- **t1 — the gate** (`completed`): self-sufficiency lint over every formalBlock; catches BOTH `--` and
  `—` markers under the admissibility boundary (violation = gloss on a law/operational-def carrier;
  admissible = gloss on a declaration signature / by-value primitive incl `{set}`/`⟨tuple⟩`/enum/
  backtick-literal/bare-term). Emits worklist + anti-stale regression guard.
- **t2 — drain the corpus** (`completed`): ~120 `--` + 35 `—` law/def glosses drained across 15 blocks
  (redundant-deleted or formalized with established signs, round-trip equivalent-or-better, zero mints).
  14/15 self-sufficient; praxis retains only the ratified R1.
- **t3 — success-gate** (`completed`): per-symbol `probe` round-trip wired into CANON/ENGINE
  (`symbol-probe-gate.ts` + test; ENGINE `signify-verify` law; CANON §Signification-gate). Verified green,
  non-vacuous (un-probed = `needs-probe`, withholds). Surfaced one canon call → nico (batched): altitude of
  `signify-verify` (ENGINE law vs MODEL invariant) + minted ENGINE names bypass the SYMBOLS gate.

## Dependencies & waves

R = { (t2, t1) }. wave(0) = { t1, t3 } (dispatch concurrently). wave(1) = { t2 }.

## Not in scope

- Ratifying canon _notation_ choices in a drain (a genuine naming call) → route to nico.
- The scope hypothesis (§7.6, symbolic σ\* model-invariance) — a forward research item, not this plan.
