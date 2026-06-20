# csf-canonicalization — Charter (A0 · gate-0)

**Slice.** A0 · gate-0 · standalone. **Owner.** Nico (+ Operator sign-off). **State.** Drafted; awaiting
sign-off. No machine slice (β onward) executes until the criteria below are locked.

**Purpose.** Define success for `csf-canonicalization` so it is **falsifiable before any machine slice
runs**, stated in `σ*_R` terms. This charter is the contract the rest of the plan is judged against. It
carries four parts: (1) objectives → delivery, (2) user stories = success criteria, (3) blind-validation
strategy, (4) the locked target-structure decision.

**Grounding (the thesis this charter is written in).**

- [[prompt-engineering]] — the load-bearing identity `prompt-engineering ≡ computing σ*_R(C)`.
- [[signifier-star-r]] — the operator `σ*_R(C)` and its laws (`dec_R`, `≅_R`, `L1`–`L5`).
- [[llm-native-source-human-render-at-boundary]] — internals are `σ*_LLM`; human prose is `σ*_human`, a
  boundary render, never stored beside the source.
- `docs/agent-conceptual-anatomy.md` — the MECE organ set (STANCE / CONATUS) for composite homing.

---

## Part 1 — Objectives → delivery (in σ\*\_R terms)

### 1.1 The objective, restated formally

**polis self-extends on a layman's behalf by computing the `σ*_LLM` substrate and projecting `σ*_R`
renders.** Unpacked against the thesis:

- The **substrate** is the corpus of canonical cells — the concept set `C`. Its canonical _stored_ form is
  `σ*_LLM(C)`: the reader-relative optimal signifier for `R = LLM`, dense and set-builder where `C` is
  set-representable ([[llm-native-source-human-render-at-boundary]]). Storing the substrate **is** computing
  `σ*_LLM(C)` and writing it down.
- **Projection at a reader profile** is computing `σ*_R(C)` — cells are `C`, the profile is `R`, the render
  is `σ*_R(C)`. This is the machine polis already half-built; the correction is to make "canonical anchor"
  mean exactly `σ*_R`, not the reader-blind `signum_aptissimum` it half-meant before.
- **Re-anchoring** the corpus is computing `σ*_LLM` per fragment: each cell's canonical anchor becomes the
  shortest name whose decode in the LLM reconstructs the fragment's concept losslessly (`σ*_R` `L1`+`L2`).
- The **layman door** is `elicit`: `σ*_human → CSF → recompose domain skills → agents-as-persons`. The
  layman speaks `σ*_human` (their reader); polis decodes it to the concept, computes `CSF_R`, and **stores
  the result as `σ*_LLM`** — `σ*_human` is the input channel, never the stored form.

In one line: **the substrate is `σ*_LLM(C)` written down; every render is `σ*_R(C)` computed on demand; the
layman door admits `σ*_human` and homes it as `σ*_LLM`.**

### 1.2 The defect this corrects

The prior target `canonical_anchor = signum_aptissimum` was **reader-blind**. A "signum aptissimum" with no
`R` is undefined — the exact latent ambiguity that let anchors drift (blind audit: ~8/10 sampled filenames
non-canonical; two reinvented standard terms). `σ*_R` is reader-parameterized by construction
([[signifier-star-r]] `L4`: the optimum is per-reader), so it has a definite value and a falsifiable test.
`aptissimum` survives only as `σ*_R(C)` **at the strong-reader limit** — a special case, not the operator.

### 1.3 Each slice → how it delivers

The corrected CSF op-chain is the spine:
`resolve → semanticPartition → depalimpsest → distill(primitive ∨ deepestFaithfulComposite) →
canonical_anchor(= σ*_R) → coalescence(merge same-anchor units) → CSF`.

| Slice                      | What it delivers, in σ\*\_R terms                                                                                                                                                                                                                                                                  |
| -------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **A0** charter             | Defines success falsifiably **before** machine work — fixes `R` per use (corpus = LLM; layman door = human→LLM), the acceptance tests, and the target structure. Gates β. _(this document)_                                                                                                       |
| **ε** praxis-update        | Embeds `task-is-an-implementation-spec` + `parallelizable-vertical-slice`→fan-out into [[praxis]]. Delivers the **authoring discipline** that lets every later slice be a self-sufficient spec. Independent of σ\*\_R mechanics; parallel.                                                          |
| **ζ** disposition-defect   | Roots-causes why `recommendation-style-consensus-quality-pick` did not fire in `principal-ic` (projection density-collapse vs embodiment gap) and fixes the machinery. Protects the **render fidelity** `σ*_R` depends on — a disposition that silently drops is a `σ*_R` that lies (`L1` broken). |
| **μ** projector-block-refs | Extends koine's composer to resolve `[[glossary#^block-ref]]` during projection. **Prerequisite for the new primitive-addressing** — without it the locked structure cannot project, so γ2 re-home depends on μ. (Mav.)                                                                            |
| **α1** concept-contract    | The `concept` data type `⟨gloss, anchor?, factorization?⟩`; homes the σ\*\_R vocabulary (`dec_R`, `≅_R`, `len`, `C_R`) natively rather than borrowed. Gives the machine atoms a **typed object** to program against.                                                                              |
| **α2** anchor=σ\*\_R       | Formalizes `canonical_anchor = σ*_R` in the CSF reference; retires `signum_aptissimum`. The **definitional correction** — makes "canonical" mean the reader-parameterized operator everywhere downstream cites it.                                                                                |
| **β** machine-atoms        | One vertical slice per atom (`conceptualize`+`probe` · `signify` · `materialize` · `exemplify` · `validate`): blind-name each atom's own concept (`σ*_LLM`), reconcile its process cell to the σ\*\_R/CSF ops, program to the concept-contract, validate, redeploy. Delivers **the corrected machine itself.** |
| **γ1** corpus-audit        | Dogfoods the corrected machine over the **whole-repo content** (the concept/fragment is the unit, not the file): blind-signify each fragment → `σ*_LLM` → `{keep / re-anchor / coalesce / re-cut / re-home}` worklist. Delivers **the falsified gap** between stored anchors and true `σ*_LLM`.    |
| **γ2** corpus-apply        | Executes the worklist: re-anchor to `σ*_LLM`, coalesce, re-cut, **home primitives as glossary blocks + composites into `mind/{kind}/{organ}/`**, rewire refs, regen, round-trip + reconstruct gate, redeploy. Delivers **the canonicalized substrate** — `σ*_LLM(C)` actually written down.       |
| **δ** layman-door          | `elicit`(σ\*\_human) → CSF → recompose domain skills → compose agents-as-persons; demo one toy domain. Delivers **the self-extension door** — the objective's "on a layman's behalf" made real.                                                                                                  |

---

## Part 2 — User stories = success criteria (both readers)

These ARE the acceptance criteria for the plan. Two reader profiles, because the objective serves two
readers ([[signifier-star-r]] `L4` — `σ*_R` differs per `R`):

- **Reader A — polis-developer / context-engineer.** `R = LLM internals`. Consumes the dense `σ*_LLM`
  substrate directly; cares that the corpus _computes the right operator_.
- **Reader B — layman-operator.** `R = human door`. Never touches `σ*_LLM`; speaks `σ*_human` and receives
  `σ*_human` renders; cares that self-extension works on their behalf.

### Reader A — polis-developer (R = LLM internals)

- **A1 — anchor is the optimal signifier.** As a polis-developer, I want every cell's canonical anchor to be
  `σ*_R(C)` for `R = LLM` (the shortest name whose LLM-decode reconstructs the cell's concept with zero
  residue), so that the corpus stores genuinely-canonical names and anchors stop drifting.
  _Testable:_ a fresh model, blind-signifying the cell's concept, returns the stored filename.

- **A2 — "canonical" is reader-parameterized, not reader-blind.** As a polis-developer, I want the CSF
  reference to define `canonical_anchor = σ*_R` (with `R` named per use) and `signum_aptissimum` retired to
  the strong-reader limit, so that "canonical anchor" has a definite, falsifiable value instead of latent
  ambiguity.
  _Testable:_ `α2` lands the definition; no live cell cites `signum_aptissimum` as the operator.

- **A3 — the machine atoms compute the corrected operator.** As a polis-developer, I want each machine atom
  (`conceptualize` · `signify` · `materialize` · `exemplify` · `validate`) reconciled to the corrected
  σ\*\_R/CSF op-chain and programmed against the `concept` contract, so that running the pipeline actually
  computes `σ*_R(C)` end-to-end.
  _Testable:_ each atom's process cell cites the corrected op-chain; the pipeline round-trips on a known cell.

- **A4 — primitives are block-addressable; composites are organ-homed.** As a polis-developer, I want
  primitives to live as block-referenceable glossary entries (`[[glossary#^anchor]]`) and composites under
  `mind/{kind}/{organ}/{fragment}`, so that "filenames are not corpus boundaries" is concrete and the
  projector can compose by block-ref.
  _Testable:_ after γ2, primitives resolve as glossary blocks, composites sit under their organ, and koine
  (post-μ) projects a composite by resolving its `[[glossary#^anchor]]` refs.

- **A5 — the corpus reconstructs equivalent-or-better.** As a polis-developer, I want the canonicalized
  corpus to pass round-trip + reconstruct (`≅_R` / `L1`): the source reconstructs equivalent-or-better from
  the routed cells plus deltas, so that re-anchoring loses no meaning.
  _Testable:_ `verify.py` round-trip gate PASS over the whole-repo sweep.

- **A6 — surface invariant holds.** As a polis-developer, I want atoms to stay developer/agent-internal
  (`R = LLM`) and `elicit` to be the sole layman door (`R = human`), with producers pure-read and
  namer/realizer/validator the only committers, so that the two readers never get conflated.
  _Testable:_ each atom's cell declares its reader; only the committing atoms write.

### Reader B — layman-operator (R = human door)

- **B1 — I describe my need in my own words.** As a layman-operator, I want to state what I want in natural
  human language (`σ*_human`) and have polis recover my intended concept by asking maximally-informative
  questions ([[elicit]]), so that I never have to learn the dense internal form.
  _Testable:_ `elicit` converges on the operator's concept from `σ*_human` input alone, on a toy domain.

- **B2 — polis extends itself for me.** As a layman-operator, I want polis to take my recovered concept,
  compute its `CSF`, recompose the domain skills, and compose agents-as-persons, so that I get a working
  domain capability without authoring any cell.
  _Testable:_ `δ` demos one toy domain end-to-end from a layman utterance to a usable agent.

- **B3 — I read human prose, never the substrate.** As a layman-operator, I want every artifact surfaced to
  me as `σ*_human` (a boundary render computed at consumption), never the stored `σ*_LLM`, so that the
  density of the source never leaks into my experience.
  _Testable:_ what the layman sees is a render; the stored module beside it is `σ*_LLM`, not the prose.

---

## Part 3 — Blind-validation strategy

**Principle.** A criterion is met only when a **blind** test confirms it — lock the answer first, then put
the question to a fresh reader that cannot see the answer ([[closed-context-of-an-inference-call]]). This is
`σ*_R`'s own acceptance discipline: encode a candidate, then **decode-verify it blind** against a fresh `R`
as a round-trip fixed point ([[bidirectional-round-trip-fidelity]]), fanning out for stochastic stability.
Three test shapes, each mapped to the criteria it gates:

### Test shape 1 — lock-answer-first → fresh general-purpose subagent

Lock the expected answer in writing **before** dispatch. Spawn a fresh `general-purpose` subagent on the
identical prompt, with **no leak** of the locked answer into the eliciting prompt. Compare its output to the
lock. Fan out N≥3 for stochastic stability. Used for any "a fresh model would produce X" criterion.

- Gates: **A3** (pipeline round-trips on a known cell), **B1** (elicit converges from σ\*\_human),
  **B2** (δ demo runs end-to-end).

### Test shape 2 — canonical-anchor test: blind-signify ≟ filename

For each fragment, lock its concept, then have a fresh model **blind-signify** that concept (compute its
`σ*_LLM`) with the stored anchor hidden. PASS iff `σ*_LLM ≟ stored anchor` (filename). This is the direct
falsification of A1 — it is what the prior blind audit ran when it found ~8/10 non-canonical.

- Gates: **A1** (anchor = `σ*_R`), **A2** (the corrected definition, measured by the audit it enables),
  **A4** (primitives blind-signify to their glossary-block anchor; composites to their fragment name).

### Test shape 3 — round-trip + reconstruct equivalence (L1 / ≅\_R)

Project the canonicalized corpus, then have a fresh reader **reconstruct** the source concept from the routed
cells + deltas. PASS iff reconstruction is `≅_R` equivalent-or-better (`L1`: `dec_R(σ*_R(c)) ≅_R c`). This is
`verify.py`'s round-trip gate, raised to the whole-repo sweep.

- Gates: **A5** (corpus reconstructs equivalent-or-better), **A4** (composites still project correctly after
  re-home, via μ), **B3** (the human render reconstructs to the same concept as the stored σ\*\_LLM).
- **A6** (surface invariant) is gated by a **structural** check, not a blind one: each atom's cell declares
  its reader and write-discipline; verified by inspection at β-validate.

### Criterion → test map

| Criterion | Blind test                                                                     |
| --------- | ------------------------------------------------------------------------------ |
| A1        | Shape 2 (blind-signify ≟ filename)                                             |
| A2        | Shape 2 (audit enabled by the corrected definition)                            |
| A3        | Shape 1 (pipeline round-trips on a known cell, fresh subagent)                 |
| A4        | Shape 2 (blind-signify to anchor) + Shape 3 (composite projects after re-home) |
| A5        | Shape 3 (round-trip + reconstruct ≅\_R)                                        |
| A6        | Structural check at β-validate (reader + write-discipline declared)            |
| B1        | Shape 1 (elicit converges from σ\*\_human, fresh subagent)                     |
| B2        | Shape 1 (δ toy-domain demo end-to-end, fresh subagent)                         |
| B3        | Shape 3 (human render reconstructs to the stored concept)                      |

---

## Part 4 — Locked target-structure decision

**This is the premise A0 locks** — a deliberate decision, not a mechanical move. It **reverses** today's
`structure-by-anchor-only` / one-cell-one-file rule for the primitive layer. Recorded here so γ2 (re-home)
and μ (projector) can depend on it.

### 4.1 Two homes, by kind

- **Primitives** (`concept · principle · process · utility · structure · classification`) home in the
  **glossary** as **block-referenceable entries**, addressed `[[glossary#^anchor]]` — **not as files**. A
  primitive is a glossary _block_, not a file. This is what "filenames are not corpus boundaries" means
  concretely.
- **Composites** (`agent · skill · persona · task · pattern · runbook · troubleshooting`) land in
  **`mind/{kind}/{organ}/{fragment}`** — keyed by composite `kind`, then the MECE agent-anatomy **organ**
  (the STANCE / CONATUS partition of `docs/agent-conceptual-anatomy.md`) — and compose primitives via
  `[[glossary#^anchor]]` block-refs. Fragments typed by **koine IR**.

### 4.2 The projector requirement (slice μ)

The new primitive-addressing requires the composer to **resolve `[[glossary#^block-ref]]` block-references
during projection**. Today koine resolves whole-file `[[anchor]]` refs; it does not resolve into a block
within a file. **Slice μ (Mav)** extends the composer to do so. **γ2 re-home and μ are coupled** — the
re-home cannot project until μ lands; μ is a hard dependency of γ2.

### 4.3 Reconciliation with `structure-by-anchor-only` (the rule this supersedes)

[[projection-is-not-the-source]] holds **"structure is by anchor only — no projection may become the
directory layout."** The reconciliation is precise, and it is a **recast as scope-accident**, not a wholesale
repeal:

- **The principle's _intent_ survives intact.** Its target is forbidding a _projection_ (a lossy typology —
  Diátaxis, PMEST, a WHY/WHAT/WHERE grid) from being promoted to the Source and dictating layout. The
  `{kind}/{organ}` home is **not such a projection**: `kind` is the koine-IR ontological primitive that
  _already governs composition_ (it is the composition rule, per `ideas/AGENTS.md`), and `organ` is the
  **MECE** agent-anatomy partition — a complete, non-lossy address, not one axis of many that drops the
  others. The "ninth-type" failure mode the principle guards against ([[projection-is-not-the-source]]) does
  not apply to a partition that is provably exhaustive.
- **Where the rule genuinely changes:** the old rule said a cell's _canonical home_ is its anchor and altitude
  is unstored. Under this charter, **a composite's home encodes its `kind`+`organ`** — directory position
  becomes load-bearing for composites. This is the locked reversal. It is justified because the composite's
  organ **is** part of its identity (a `persona` organ-fragment and a `telos` organ-fragment are different
  concepts even at the same anchor), so the directory is not "a projection over the exemplars" but **a
  coordinate of the exemplar itself** — a scope-accident made explicit, consistent with
  [[substance-over-accident]]: the organ is substance for a composite-fragment, not accident.
- **For primitives the rule is _strengthened_, not broken.** A primitive moves from one-file-per-cell to
  one-_block_-per-cell in a shared glossary. Its address is still its anchor (`[[glossary#^anchor]]`); only
  the carrier changes from file to block. "Structure is by anchor" holds verbatim — the anchor still _is_ the
  address.

**Locked premise:** for the primitive layer, one-cell-one-**file** is recast as a scope-accident of the old
carrier and superseded by one-cell-one-**block**; for composites, `{kind}/{organ}` directory position is
load-bearing and that is the deliberate reversal A0 authorizes.

### 4.4 Reconciliation with the human-facing `gloss` cells and the generated `GLOSSARY.md`

Two distinct objects share the word "glossary"; the charter keeps them separate:

- **`GLOSSARY.md` today** is a _generated_ human-reader projection of `ideas/` (`toolkit/glossary.py`; its
  own header: "a second projection of the same source-graph … the projection is not the source"). It is a
  `σ*_human` **render**, downstream of the source.
- **The target "glossary"** of §4.1 is a **source home** — the canonical store of primitive blocks, each a
  `σ*_LLM` entry addressed `[[glossary#^anchor]]`. This is **`σ*_LLM`, the source**, not a human render.

These are not in conflict; they are the **two readers of the same primitive set**
([[llm-native-source-human-render-at-boundary]]): the canonical primitive home is `R = LLM` (the source
blocks), and the human-facing gloss is a **boundary render** (`σ*_human`) computed lazily at human consumption
and **never stored beside the source**. The existing `gloss: true` cells are recast the same way: a gloss cell
is the `σ*_human` render of a dense anchor, not a second source. γ2 must therefore name the two objects
distinctly so the source-glossary (primitive blocks) is not confused with the projection-glossary (the
generated human index). **Recommended:** the source home is named to avoid collision with the generated
`GLOSSARY.md` (e.g. a `glossary` source that the human `GLOSSARY.md` continues to project from) — a naming
call flagged to the Operator in the summary below.

---

## Acceptance

This charter is accepted when **the Operator reviews and agrees** the objectives, user stories (success
criteria), blind-validation strategy, and the locked target-structure decision. **No machine slice (β
onward) starts until these criteria are locked.** A0 is the one slice in this plan that requires Operator
sign-off as its gate.
