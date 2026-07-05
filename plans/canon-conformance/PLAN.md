# canon-conformance

**Initiative** (sharded) · **Lane** Nico (canon semantics) + Mav (engine/harness/projection) · **Frontier** wave 0
Bring the tracked `.ts` source into conformance with the root acceptance model. Carries no semantics of its own —
it drives the corpus to `∀c∈canon: accept(c)` and stands up the pipeline that keeps it there.

## Grounding — the aligned model (read once)

- **Thesis (VISION):** _address_ the model's semantic space via canonical signs (σ*); do not *instruct\* it with prose.
  **The source of truth is canonical semantics; runtime context is a projection of it, not its author.**
- **What (MODEL):** `accept(c) ⇔ Universal(c) ∧ (class c=agent ⇒ COMPOSED(c))`;
  `Universal = CANONICAL ∧ SIGNIFIED ∧ COLD-BLIND ∧ PARTITIONED ∧ PARSIMONIOUS ∧ REGENERABLE`.
  **Implementation-AGNOSTIC** — quantifies over _any_ catalog, never the specific organ set.
- **How (ENGINE):** pipeline `⟨discover, author, normalize, validate, select, compose, deploy⟩`;
  `boundary-projection ≜ {deploy, project-human}`; `ENGINE ⊥ MODEL` (impl free, invariants fixed).
- **BLIND = LLM-priors ONLY** (fresh `/tmp`, no corpus/memory/root reads). `verify(f) ⇔ decode_cold(core f)=intent(f)`;
  a fragment that needs the corpus to decode is not σ\*\_R — it fails blind. A referenced anchor is legal only because it too blind-validates.
- **`rule`/`hook` are harness-AGNOSTIC SOURCE fragments** (`.ts` cells); `scope`/`event` are conceptual activation modes; the
  harness enters only at `realize(activation, adapter)` on deploy — so today's shell hooks + scoped `AGENTS.md` are _targets_.

## Done-definition

`∀c∈canon: accept(c)` ∧ every `Target` + human-artifact is `deploy(c)` / `project-human(c)` — regenerated, `¬hand-edit`.

## Slices (vertical, MECE by subsystem — each end-to-end on its file-set) + enablers

- **E1 acceptance-harness** — make `accept()` machine-checkable via the BLIND (priors-only) cold-oracle. _root_
- **E2 projection-boundary** — `{deploy, project-human}` as the SOLE path to any Target/human-view. _root_
- **S1 organ-catalog** — 159 organ-value cells → σ\*, formal, depalimpsested, one-home, blind-verified.
- **S2 skills** — 15 skill cells, over `delineation` + prose + `formalBlock`; REFLEXIVE.
- **S3 agents** — `COMPOSED` validation (arity, `∄ superfluous`) over every agent composite.
- **S4 rules-hooks** — re-source harness-agnostic `rule`/`hook` cells; shell hooks + scoped `AGENTS.md` become deploy targets.
- **S5 framing-and-projections** — wire `VISION/MODEL/ENGINE/CANON` authority; retire `ideas/` + rival source-of-truth; regenerate human views; re-signify residual civic vocab.

## Waves (topo) · R (deps)

- **wave 0:** `E1`, `E2` — no deps
- **wave 1:** `S1, S2, S3` ⊳ `E1` ; `S4, S5` ⊳ `E1, E2` — fan-out 5
- **wave 2:** `CLOSE` ⊳ `E1, E2, S1..S5` — the join

(`|frontier|=1` only at the terminal join — not a mis-cut. Per-cell fan-out happens _inside_ each slice.)

## Per-cell method (binds every slice — the pipeline)

`discover σ* (signify/conceptualize/probe) → author cell → normalize (body=⟨α,residue⟩) → validate (verify via BLIND
cold-oracle) → [select/compose/deploy]`. Standard anchors only (never bespoke); MECE — no organ re-fusion (the
`mav`→`human-on-the-loop` exercise bleed is the reference defect); edit SOURCE `.ts`, never a deploy-owned `.md`;
push GATED to Operator (irreversible-outward).

## Acceptance

`accept(canon)` green corpus-wide; ratchets empty + shrink-only; no `[[ ]]`, no prose definiens, no rival
source-of-truth; every human/Target artifact regenerated; `remediation-fanout` reference retired.
