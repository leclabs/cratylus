# human-docs-projection — human end-user + contributor docs as a ρ=human projection (FEATURE REQUEST)

**Lane** Nico (signification · reader-binding · projection owner) · **Status** pending · **Kind**
feature-request, **intent-first** (elicit before spec).

**Standing:** captured 2026-07-03 from an Operator design conversation. The proposal below is an
**EXTERNAL HYPOTHETICAL — candidate solution, NOT a ratified spec.** The intent it gestures at is not
yet canonized. This task's FIRST act is intent-extraction ([[elicit]]); only a ratified intent
authorizes phase 2 (the net-new execution spec). **Do not bake the hypothetical as the spec** — it is
raw input to elicit AGAINST, nothing more.

## The captured hypothetical (candidate · ¬spec)

- **Need (as stated):** communicate the project's key concepts to two human audiences — end-users and
  contributors — while (a) avoiding **agent-context pollution** when agents work the repo, and (b)
  staying **drift-free by design** (no manual doc maintenance).
- **Proposed shape (Nico's candidate judgment):** human docs = a **projection of the one canonical
  source at ρ=human**, not a maintained artifact — reuse the existing signify/materialize/exemplify
  pipeline with the reader binding flipped to human; regenerate, never edit (drift-gated like
  `anatomy:project`). Three sharpenings offered: (1) pollution-avoidance is **structural first** — the
  gloss is a downstream, write-only output living OUTSIDE the AGENTS.md chain (agents read source, not
  gloss); harness-ignore is only the backstop. (2) fully-auto human prose is wooden — split
  **mechanically-projected invariant slots** (drift-gated) from **stable human-authored narrative
  frames**. (3) two audiences = two altitudes of the one concept lattice, one skill + an audience
  parameter. Dogfood the skill (it is itself a corpus cell).

## Phase 1 — intent extraction (the gate before any spec)

Run [[elicit]] with the Operator: recover the TRUE underlying need behind the request, **independent
of the candidate solution**. Bisect the live candidates by information-gain — e.g.: is the driver
end-user adoption · contributor onboarding · a specific stakeholder ask · exercising the ρ machinery?
What is the real maintenance-cost pain being solved? Is "projection" the intent, or one candidate
_means_? Which audiences are actually in scope, at what altitude? Are the two named constraints
(no agent-context pollution · drift-free-by-design) hard requirements or nice-to-haves? **Output:** a
written intent statement the Operator ratifies — the concept, not a solution.

## Phase 2 — spec (gated on phase-1 ratification)

From the extracted intent author the net-new execution spec (static · scope · accept). If it exceeds
one blind-dispatchable task, `praxis start` its own sharded plan. The candidate design material above
is reusable ONLY where the ratified intent endorses it — never by default.

## Static

This conversation (2026-07-03 — the captured hypothetical + Nico's judgment) · the projection
machinery: the `signify` · `materialize` · `exemplify` · `probe` · `elicit` skills (reader-binding ρ,
σ\*\_R, the R=LLM-default / human-iff-literal-human law) · `packages/agent-anatomy` (the `.ts` source →
markdown projection; `pnpm anatomy:project`) · agent-forge as the projector.

## Accept (falsifiers)

- **Phase 1:** a written intent statement exists that the Operator ratifies as their ACTUAL need, and
  is **distinguishable from — not a verbatim echo of — the candidate solution** above; a run that
  returns the proposed solution as "the intent" without independent elicitation FAILS.
- **Phase 2** (blocked until phase-1 ratified): a blind-dispatchable execution spec (or a started
  sharded plan) exists with static pinned + a falsifiable acceptance; **nothing built before intent is
  ratified.**
