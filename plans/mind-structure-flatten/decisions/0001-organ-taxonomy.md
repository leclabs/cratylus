# 0001 — Organ taxonomy: organ-as-slot, concept-glossed; no `kind: organ`

- **Status:** Accepted (Nico ruling on Gate G1; binds the flatten build slices)
- **Date:** 2026-06-20
- **Deciders:** Nico (kind taxonomy — owner) · Mav (machinery — advisory recommendation) · Operator (initiator)

## Context

The γ2-B layout files each composite under **one** organ-directory:
`mind/agent/persona/nico.md`, `mind/agent/appraisal/tester.md`,
`mind/skill/enaction/materialize.md`, etc. This is a **category error** (confirmed in the
data): an agent/skill embodies **many** organs at once, so a single-organ directory forces an
arbitrary verdict — `tester` is filed under `appraisal` but equally embodies `competence` and
`charter`; `nico`/`mav` under `persona` but equally `telos`/`charter`/`heuristics`;
`materialize` under `enaction` though equally `competence`. The anatomy
(`docs/agent-conceptual-anatomy.md`, the σ\*\_LLM MECE STANCE/CONATUS organ set) **decomposes
each agent**; it does **not partition the set of agents**. The flatten removes the nesting.

This gate rules whether "organ" becomes a first-class `kind`. Mav's advisory recommendation:
**organ-as-kind, scoped** — only the design-time/persistent _composable_ organs become cells.

Grounding facts that constrain the ruling:

- A `kind` in this corpus is a **storage-and-render class** (concept/principle/process/… in
  `lexicon/`; agent/skill as composites). It decides where a cell lives and how it projects.
- The current organ set the corpus references is realized **two ways**: as the directory axis
  (γ2-B, being removed) and — for `memory` — as a composited cell. The toolkit dispatches the
  `memory` organ purely on **front-matter** (`compose/agent.py: GENUS_ORGANS = ("memory",)`,
  `render: verbatim`, `deploy: skill-dir`), **never on its `kind`**. Its `kind: structure` does
  no organ-specific work today.
- The flatten charter mandates the hardcoded `GENUS_ORGANS` composer list be **removed** so
  anatomy sections drive composition.

## Decision

**Organ-as-slot, concept-glossed. `kind: organ` is NOT created.** An organ is a **named
section role** inside an archetype, filled by a section that **composites an organ _concept_ by
reference** ([[cite-dont-copy]]). The organ's _meaning_ lives once as a `kind: concept`
glossary cell (hover-legible); the organ's _content_ for a given agent lives as that agent's
named section. No cell is filed _under_ an organ, and no new storage class is minted.

### Why not organ-as-kind (the CE∧ME ruling, diverging from Mav)

Mav's "organ-as-kind" bundles two distinct things that the identity test forces apart:

1. **The organ _concept_** ("what `telos` means") — individuated by a stable definition,
   reused across all agents. That is exactly a **glossary concept** (`kind: concept`), the
   corpus's existing class for named abstractions. Minting `kind: organ` for it duplicates
   `kind: concept` with no differentia → fails **minimality (ME)**.
2. **The organ _content_** (Nico's particular `telos` prose) — individuated by _which agent_,
   not by _which organ_. It is a section of an archetype, composited by reference. It is not a
   free-standing cell at all → there is nothing for `kind: organ` to classify.

By the **rigidity test**, "being an organ" is not the essence of any storable cell — it names a
_role in a decomposition_, an accident of how an archetype is sectioned, not a substance with
independent storage identity. A `kind` must answer "where does this cell live / how does it
render"; "organ" answers neither (organ-content renders as its host agent; organ-concepts
render as glossary). So `kind: organ` is a **kind with no work to do** — rejected.

This is **stronger** than Mav's recommendation: it reaches the same flat outcome and the same
"only composable organs surface; runtime organs stay glossary-only" split, but routes the
surfaced organs to the **existing** `concept` kind rather than a new one — honoring ME (no kind
added) while keeping CE (every organ is named, hover-legible).

### Numbered decisions

- **D1 — No `kind: organ`.** Organs are not a storage class. The kind taxonomy is unchanged by
  this gate: it stays {classification, concept, gloss, principle, process, structure, utility}
  for primitives + {agent, skill} for composites.
- **D2 — Organ-as-slot.** An organ is a **named section** inside an archetype (agent/skill),
  not a directory the archetype is filed under. Section structure (driven by the anatomy doc)
  composites organs **by reference**; it never partitions the set of agents.
- **D3 — Organ concepts are glossary cells (`kind: concept`).** Each **composable** organ that
  archetypes cite gets one `kind: concept` cell in `lexicon/concept.md` (a `^anchor` block),
  glossing the organ so the section name is hover-legible. One concept, one home, cited not
  copied.
- **D4 — Runtime organs stay glossary-only-_as-prose_, not cells.** The per-turn / apparatus
  organs are **defined in the anatomy doc** (`docs/agent-conceptual-anatomy.md`) and are **not
  minted as cells** — nothing composites them, so a cell would be a homeless referent. They
  remain legible there; the anatomy doc is their home.
- **D5 — `GENUS_ORGANS` is removed (machinery, Mav).** With organs as referenced sections, the
  hardcoded composer list is replaced by anatomy-driven composition. `memory` continues to
  composite into every SOUL **as a named organ section**, by the same front-matter dispatch it
  uses today — see D7.

### (b) The exact set of organ cells to be minted — 8 `kind: concept` glossary cells

The **composable** organs (design-time / persistent, that an archetype section can cite). Each
becomes ONE `kind: concept` block in `lexicon/concept.md`. Trimmed against the anatomy doc's
actual anchor names (the task's candidate list named several that the σ\*\_LLM anatomy does not
carry — see the trim notes):

1. **persona** — STANCE · design-time · internal (anatomy §I)
2. **mandate** — STANCE · design-time · internal (anatomy §I)
3. **comportment** — STANCE · persistent · internal (anatomy §I)
4. **telos** — CONATUS · design-time · internal (anatomy §II)
5. **charter** — CONATUS · design-time · internal (anatomy §II)
6. **heuristics** — CONATUS · design-time · internal (anatomy §II)
7. **competence** — CONATUS · persistent · internal (anatomy §II)
8. **disposition-memory** — CONATUS · persistent · internal (anatomy §II)

These 8 are the **design-time + persistent INTERNAL** organs — the ones an archetype _is
authored with_ and that a section can carry by reference. `memory` is the **organ-home cell**
that realizes the `disposition-memory` + `ledger` axis operationally; it is already a cell and
is **re-glossed, not re-kinded** (D7) — so it is not double-counted in this mint-list. Count:
**8 organ-concept cells to mint** (plus `memory`, which already exists).

### (c) The organs that stay glossary-only (anatomy-doc prose; NO cell) — 14

Minted as cells: none. Home: `docs/agent-conceptual-anatomy.md`. Two classes:

**Runtime / per-turn organs (6)** — `percept`, `construal`, `deliberation`, `resolve`,
`enaction`, `appraisal`. These describe one inference cycle; no design-time artifact composites
them.

**Apparatus + remaining STANCE organs (8)** — the persistent-external machinery and the
per-turn/persistent STANCE face that an archetype does not author as content:
`effectors`, `sensors`, `substrate`, `ledger`, `register-fit`, `disclosure`, `address`,
`provenance`.

> **Trim notes vs the task's candidate sets (be exact):**
>
> - The task's _composable_ candidate list named `sensors`, `ledger`, and `provenance` as
>   organ-cells. **Rejected from the mint-set:** in the anatomy doc these three are
>   **persistent-EXTERNAL apparatus / STANCE-external** (`sensors`, `ledger` under CONATUS
>   Apparatus; `provenance` under STANCE-external) — they are machinery/recognition, not
>   content an archetype authors. They stay **glossary-only** (listed above). `ledger` is the
>   external store organ; `memory` is the corpus's concrete organ-home that _spans_
>   `disposition-memory` + `ledger`, which is exactly why `memory` is a cell and `ledger` is
>   not.
> - The task's _runtime_ candidate list named `substrate`, `register-fit`, `address`,
>   `disclosure`, `effectors` alongside the per-turn six. **Confirmed glossary-only**, but
>   reclassified: they are **persistent/per-turn apparatus & STANCE**, not strictly "per-turn
>   runtime" — the distinction does not change their fate (no cell) but the anatomy doc is their
>   accurate home.

### (d) The fate of `memory` — re-glossed, NOT re-kinded; all front-matter survives

- **`kind` stays `structure`. It does NOT re-kind to `structure`→`organ`** (consistent with D1:
  there is no `kind: organ`). `memory` is a `structure` cell that _plays the role of_ an organ;
  the role is carried by composition + front-matter, not by a kind label. Re-kinding it would
  (i) require a `kind: organ` storage class the toolkit does not have, and (ii) risk the
  fleet-wide SOUL projection and the memory-tool bundling, both of which key on front-matter,
  not kind — pure downside, zero gain.
- **`render: verbatim` survives unchanged.** It is dispatched independently of `kind`
  (`compose/agent.py`, `verify.py: is_verbatim_organ`); the SOUL `## Protocol` projection does
  not consult the kind. Removing or changing it would break every agent's SOUL.
- **`deploy: skill-dir` + `bundle:` + `skill_description:` survive unchanged.** The skill-dir
  deploy set is computed from `slugs_deploying_as_skill()` (front-matter `deploy:`), **not** from
  `kind: skill` — so `memory` deploys as a host skill carrying `episodic.mjs` regardless of its
  kind. This is the `memory-home-dual-deploy` invariant and it is preserved verbatim.
- **What does change:** `memory` is **re-glossed** as the corpus's organ-home (it already calls
  itself "The memory organ"), and its composition into SOULs moves from the hardcoded
  `GENUS_ORGANS` list (D5, removed) to anatomy-driven section composition (Mav's machinery
  slice). Net front-matter delta: **none**. Net kind delta: **none**.

## Consequences

- **Positive (CE∧ME):** the kind taxonomy gains **zero** new kinds (ME); every organ is named
  and hover-legible — composable ones as glossary concepts, runtime ones in the anatomy doc (CE).
  The arbitrary single-organ verdicts vanish: archetypes go flat, organs are referenced sections.
  The `memory` cell — the one load-bearing risk — is touched **only** in its gloss prose; kind
  and all front-matter are byte-stable, so SOUL projection and memory-tool bundling are
  unaffected.
- **Costs / risks:** the anatomy doc becomes load-bearing as the **home** of the 14 glossary-only
  organs (it must not be deleted/retired while archetype sections name them). The 8 organ-concept
  glossary cells must each pass CE∧ME at mint (the `organ-cells/mint-organs-glossary` task).
- **Hands-off (build slices, not this decision):** `GENUS_ORGANS` removal, anatomy-driven
  composition, the flat migration, and the actual glossary mints are Mav's + the downstream Nico
  tasks. This file decides taxonomy only.

## References

- Anatomy: `docs/agent-conceptual-anatomy.md` (σ\*\_LLM STANCE/CONATUS MECE organ set).
- Charter: `plans/mind-structure-flatten/AGENTS.md` (Gate G1; `GENUS_ORGANS` removal mandate).
- Toolkit coupling: `packages/mind/toolkit/compose/agent.py` (`GENUS_ORGANS`),
  `packages/mind/toolkit/verify.py` (`is_verbatim_organ`), `deploy.py`
  (`slugs_deploying_as_skill`) — all key on front-matter, not kind.
- Corpus: [[cite-dont-copy]] · [[substance-over-accident]] · [[memory]].
