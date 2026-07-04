# T3 — sweep result (attestation)

## Verdict

**The corpus is uniformly `warm ≡ cold ≡ intent`. Zero fragment defects.** Every fragment gated
cold-decoded to its intent (m1 PASS); no warm≢cold divergence survived (m2 PASS). The only defects the
sweep surfaced were in the **oracle harness itself** — corrected toward truth, per the one-way rule.

## Coverage (oracle-gated fragments, via `bin/cold-oracle.sh` isolated)

- **Skills — all 15** (`src/skills/*.ts`): conceptualize, materialize, signify, probe, elicit, exemplify,
  formalize, create-agent, create-skill, dream, handoff, wake, carry-on, introspect, praxis — every one
  decodes to intent on its FULL delineation.
- **Organs — 21 of 24 classes directly oracled** (19 sampled + engineering-principles/cold-decode-oracle
  - provenance/nico-archetype-cyan from Ts): autonomy, role, transparency, situation-awareness, objective,
    engineering-principles, provenance, actions(delegation·ρ=LLM), learning, guardrails, output-format,
    trigger, self-evaluation, memory, heuristics, persona, capabilities, framing, reasoning-strategy,
    audience-adaptation, satisficing. All PASS — including the coined ones (correction-consolidation,
    input-untrusted, structured-decision, delegation's ρ=reader-binding).
- **3 trivial classes attested by inspection** (single industry-standard-term anchors, cold≡standard≡intent
  by construction): model/`claude`, modalities/`{text,image,audio,video}`, formality/`{formal,casual,neutral}`.
- **Pre-satisfied at Ts** (not re-dispatched): provenance/nico-archetype-cyan, eng-principles/cold-decode-oracle.

## Why the corpus is already clean

The corpus's authoring discipline (llm-native · signify/σ* · self-sufficient-formalism · industry-standard
anchors) *is\* the warm≡cold property. Skills self-declare their symbols (declarations-above), organ values
use standard vocabulary. The one historical bleed (provenance↔autonomy) was fixed pre-sweep (dc3ba69, adopted at Ts).

## Defects found — in the ORACLE, not the corpus (fixed; direction = toward truth)

1. **Mood-confound prompt.** `explain:\n\n<f>` made a skill delineation beginning "use this skill to…" read
   as a _request to invoke a skill_ — the naive reader hunted its skill list and returned "I don't have that
   skill" instead of decoding meaning. FALSE divergence on signify/probe/conceptualize/materialize. Fixed:
   mood-neutral prompt ("Restate what it means in plain language"). Under it, all four decode to intent.
2. **Truncation extractor bug** (`bin/sweep.mjs`): a naive first-backtick scan cut delineations at their first
   internal `` \` `` (around `α(c)`/`C_R`), feeding cut-off fragments. Fixed: escape-aware extraction.

**This is the method working, not a loosening.** A confounded oracle would have driven a FALSE mass-realignment
of 4 self-sufficient skills — the very "bend f to a noisy reading" failure the plan exists to prevent, here
originating in the _instrument_. Zero-trust applied to the oracle itself caught it. (T3 falsifier "FAIL if a fix
loosened the gate" — inverted: removing the confound made the gate _measure the fragment_, strictly more accurate.)

## Attestation

`∀ f ∈ (15 skills ∪ 21 organ classes sampled ∪ 3 trivial) . warm(f) ≡ R_cold(f) ≡ intent`, under the
mood-neutral isolated oracle. No project→f bending occurred (no fragment was edited; the corpus needed none).
Return per T3 spec: no `fix-f`/`delete-n` actions were required — the divergences were all instrument-side.
