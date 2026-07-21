# Target-vocabulary MAPPING — the depalimpsest decision (nico, signification authority)

**Why.** The founding lexicon (`polis`/`politeia`/`mind-society`/`society`/`commons`/`oikos`/`founder`) is
palimpsest — abstract classical framing that predates the concrete component names the source-of-truth model
(`VISION`·`MODEL`·`ENGINE`·`CANON`) already uses. The corpus's OWN accept gate confirms it:
`agent-anatomy/src/toolkit/cold-oracle/policy.ts` lists `polis`/`oikos`/`conatus`/`stance-conatus` as
palimpsest tokens that FAIL the CANONICAL gate. This table is the ratified replacement set; every sweep shard
consumes it. The palimpsest-token guard STAYS after the sweep (it keeps the vocabulary from returning).

## The map (retired → concrete; context-keyed — apply with judgment, not blind sed)

| retired token                                     | concrete replacement                 | context / note                                                    |
| ------------------------------------------------- | ------------------------------------ | ----------------------------------------------------------------- |
| `polis` (the founded thing)                       | **project**                          | "found a polis" → "scaffold a project"                            |
| `polis` (the source canon)                        | **catalog** / **canon**              | "the polis commons" → "the catalog"                               |
| `mind-society` · `society` (the deployed agents)  | **fleet**                            | the set of agents deployed to a project (harness term: FleetView) |
| `mind-society` · `society` (the founded artifact) | **project**                          | context decides fleet vs project                                  |
| `politeia` (foundational structure)               | **scaffold** / **project structure** | the laid-down layout                                              |
| `commons`                                         | **catalog**                          | the canon of shared fragments                                     |
| `founder` · `founder-charter` (agent provenance)  | **first-party** / **built-in**       | nico/mav are built-in (baseline-catalog) agents, not "founders"   |
| `found` · `founding` (CLI verb + ceremony)        | **init** / **create** / **scaffold** | aligns to `agent-forge init`; the npx verb (ask 2)                |
| `oikos` (private/local scope)                     | **local** / **home**                 | the household → local scope                                       |
| `substrate` (mav's founder prose)                 | **infrastructure** / **engine**      | keep only if concrete in context                                  |

## FLAGGED — one deferred fork (NOT in this sweep)

**The `STANCE` / `CONATUS` genus axis** (`Genus = 'STANCE' | 'CONATUS'` in `agent-forge/src/anatomy/index.ts`,
pervading organ metadata). Evidence it is palimpsest: abstract Latin (violates "concrete names"); the accept
gate lists `conatus` as a palimpsest token — an INTERNAL CONTRADICTION (a core type axis named by a word the
gate rejects). Evidence to keep: it is a live structural primitive; renaming it is a large MECE-model refactor
with its own signification problem (concrete candidates: `presentation`/`disposition`? `demeanor`/`drive`?).

**Cold-panel verdict (2026-07 — isolated `claude -p` ×5 from `/tmp`, no project context, results in
`/tmp/cold-panel/results.txt`).** Confirms the vocabulary was polluted at authoring:

- **Unprimed (3/3), given only the two families' glosses:** Family A (how it comes across) → **Persona** ×3
  (unanimous); Family B (what it's inclined to do) → **Policy** ×2 / **Disposition** ×1.
- **Primed comparison of 6 candidate pairs:** `Stance / Conatus` ranked **5th of 6** — _"'Conatus' is obscure
  jargon most readers won't parse; 'Stance' is ambiguous."_ Compare-winner: **Demeanor / Drive**;
  `Presentation / Disposition` 2nd; `Persona / Telos` last ("Persona overstates it as a mask").

**Decision (nico, signification authority — cold-informed + Operator-challenged):** the genus axis SHOULD be
renamed; `STANCE`/`CONATUS` is jargon, not the model's best-fit. Recommended signifier: **`STANCE` → Presentation ·
`CONATUS` → Disposition.**

Rationale — and a correction the Operator surfaced. The unprimed cold winner for Family A was "Persona" (3/3), which
I first called a "collision" with the `persona` field. That framing was shallow. Grounding: `persona` is NOT a peer
organ — it is the free-text identity BODY → SOUL body (`anatomy/index.ts:207`, D13), the most identity-laden MEMBER
of the presentation family. The cold LLM naming the AXIS "Persona" is **prototype-naming** — labelling a category by
its most salient member, a known bias — NOT evidence the axis IS the field. The correct principle is **taxonomy
hygiene: name a category by its DIMENSION, not a member.** "Presentation" names the dimension "how it comes across"
and spans the A organs (autonomy·role·formality·audience-adaptation·transparency·persona·provenance); the `persona`
field stays unchanged (a legitimate distinct member — the irreducible archetype the structured dims can't capture).
So the cold "Persona" is DISCOUNTED for the axis (prototype bias), not adopted. "Disposition" fits a GENUS (a stable
filing CATEGORY, not a moment's drive) over the B organs. Punchier alternative on record: **Demeanor / Drive**. NOT
`Stance/Conatus`.

_Broader signal — now its own gated task `pending/C2`: the anatomy's core metaphor carries signification debt. A
fresh UNPRIMED cold probe (`/tmp/cold-panel/altitude.txt`) found `organ`/`anatomy` in **0 of 4** reads — the model's
natural terms are module/primitive (per-agent) and **trait/fragment** (shared unit), and it explicitly rejects
"organ" for a shareable piece. This indicates the ORIGINAL "anatomy/organs" signify was primed/biased, not a clean
cold read (`apparatus-under-zero-trust`; nico's altitude-defense of "organ" was refuted by the probe). Confirming +
choosing replacements is a full signify pass with real blast radius (the package IS `agent-anatomy`) → `C2`. C1
(genus) and C2 (core vocab) are two facets of one cleanup._

**Still OUT of the mechanical sweep.** Renaming a `Genus` axis is a large structural refactor (the type +
per-organ metadata + docs + the accept-gate token list) — it needs its OWN census-grounded execution spec
(`census-grounds-spec`), authored when the Operator green-lights pulling it into scope. Every sweep shard EXCLUDES
the `Genus`-axis tokens until then.
