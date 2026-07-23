# self-sufficiency-redo

**Status: PREPARING — spec authored; fan-out gated on prep completion (do NOT dispatch until §Readiness all ✓).**
Owner: session `555c4985` (mav). Supersedes the flawed `formal-block-self-sufficiency` pass (categorical
exceptions → bulk-exception metastasis; mechanical executors; leaky regex acceptance).

## Objective (absolute, no exceptions)

Every skill formal block is **self-sufficient**: it contains **ZERO comments** (`--`, `—`, whitespace-gap
glosses, and section-header decorations — all of them), and **every unit of meaning is carried by the
notation**, verified by cold-decode round-trip. There is no "admissible gloss" category — a comment is
always a defect.

## Why the last pass failed (do not repeat)

1. Wrong rule — "admissible primitive/declaration gloss" is an attractor, not a rarity; it saturated.
2. Wrong executor — the drain is a **semantic** act (does the notation carry this meaning?), delegated to
   mechanical developer agents that pattern-matched.
3. Wrong acceptance — a `--`/`—` marker regex mistaken for verification; leaky (missed `≽`, whitespace,
   declaration glosses) and blind to whether the notation actually carries the meaning.
4. Destructive fix — "delete redundant" run on a leaky classification may have **deleted load-bearing
   prose**. The current source is therefore a suspect base.

## The rule (per unit of meaning — held by the executor as IC, not a regex)

For each comment in a block: **cold-decode the notation alone.**

- **Carried** (the notation, read by an LLM, already reconstructs the comment's meaning) → the comment is
  redundant → **delete**.
- **Load-bearing** (notation does not carry it) → **formalize into notation**: a law, a definition, or —
  where the meaning is a concept needing a name — a **re-signified anchor / structured composition**.
  **Never delete load-bearing prose.** Never leave it as a comment.
- A signifier that needs a gloss to be understood is a **failed signifier** → re-signify (better anchor),
  not annotate.

## Baseline — start from the complete meaning, not the damaged current source

For each block, the **reference of complete meaning** is the pre-drain original on `main`
(`git show main:packages/agent-canon/src/skills/<name>.ts` — flat path; the corpus later moved to
`skills/<name>/skill.ts`). The redo reconstructs each block so that the union of {pre-drain meaning} ∪
{legitimate post-drain notation additions: plan-set-dynamics on praxis, the `live` fix, etc.} is fully
carried by notation with zero comments. This guarantees no meaning the last pass may have deleted stays lost.

## Acceptance (independent — not self-judged by the drainer)

1. **Zero comments** — deterministic: no `--`/`—`/whitespace-gap/section-header in the block. (Tripwire.)
2. **Cold-decode round-trip, independently verified** — a verifier DISTINCT from the drainer reads the new
   notation ALONE and reconstructs the meaning; it must be **equivalent-or-better** (`reconstruct(B) ≽ P`)
   than the pre-drain reference. Self-judgment by the drainer does not count (independent-leg).
3. typecheck + suite green; SYMBOLS gate green (no undeclared glyph from re-signification).

## Remit routing (cratylism: anchors are discovered + cold-verified, never dev-minted)

- delete-redundant + move-existing-formalism-to-notation → the per-skill executor.
- **Genuine re-signification** (a new/better anchor, a structured composition, a modeling choice) →
  **nico**, centrally, so anchors stay **consistent corpus-wide**. A per-skill executor proposes; nico
  ratifies + registers the anchor; the executor applies. No parallel minting.

## Coordination

- Per-skill dirs (`skills/<name>/skill.ts`) isolate file edits — no cross-skill collision.
- Shared: the re-signification anchor registry (central, nico) and the gate/test (one integrator).
- Executor caliber: **nico-caliber** (semantic + canon), not mechanical developer.
- Structure: per skill, `formalize` pass → **independent** cold-decode `verify` pass (distinct agent).

## Readiness gate (fan out the remaining 14 ONLY when all ✓)

- [x] R2 — spec ratified (mav, IC): rule + baseline + acceptance + routing correct.
- [ ] R0 — **prove the method on praxis first** (de-risk before the expensive fan-out): every praxis
      comment eliminated correctly — delete-redundant (cold-decode-carried) by mav, load-bearing
      re-signified by nico — independently cold-decode verified. Only a proven praxis unlocks the fan-out.
- [ ] R3 — re-signification protocol: central anchor registry + nico ratifies (exercised by R0).
- [ ] R4 — executor→verifier pipeline (formalize → independent cold-decode verify) — exercised by R0.
- [ ] R1 — gate rebuilt to the absolute as a **post-drain tripwire** (flag ANY comment; rollout
      allow-list → ∅). NOT a prerequisite: acceptance is the cold-decode round-trip, not the gate.

## Not in scope

- Prose-as-definiens for primitives (`X ≜ <phrase>`) is a **deeper** question (does the anchor cold-decode,
  making even the definiens redundant?) — flagged, but this pass targets **comments**. If the objective is
  the deeper zero-prose cut, that is a corpus-wide re-signification and must be scoped separately.
