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

**Decision (nico) — REVISED on clean evidence: `STANCE` → Persona · `CONATUS` → Constitution.**

_Retraction (why the prior decision was wrong)._ I earlier decided `Presentation / Disposition`, DISCOUNTING the
cold "Persona" as prototype-bias (naming a category after its member). Two errors: (1) the evidence was
CONTAMINATED — the `TERM-compare` prompt LISTED "Presentation / Disposition" as a candidate and glossed the families
("how it COMES ACROSS / outward manner") in leading σ_human\* prose, not σ\*; (2) my prototype-bias dismissal was
false. An **argmin σ\* re-probe** (`/tmp/cold-panel/min.txt` — concept given by EXTENSION only, no gloss, no
candidate list, `persona` field NOT in the set) returned: Family A → **Persona 3/3** (robust — so NOT prototype-bias;
it is the genuine fittest sign for "how an agent presents/conducts itself"); Family B → **Constitution 2/3**
(Disposition 1/3; "policy" alt) — domain-resonant (cf. constitutional AI). The Operator was right that Persona is not
a mere collision.

_Coupled sub-fork (persona field)._ Genus A = `Persona` collides with the `persona` FIELD (the identity body → SOUL
body). Resolution options: (a) genus `Persona` + rename the field to its narrower true role (`archetype`/`essence` —
the free-text identity core), or (b) keep the field `persona` and use the behavioral-side alt `Posture` for the genus
(offered 1/3 in the clean probe). Leaning (a) — honor the fittest genus sign, give the field its accurate narrower
name — but the field rename wants its OWN argmin probe before commit. Recorded as C2's open sub-item.

_Broader finding — now DECIDED in `pending/C2`: a decisive cold panel (`/tmp/cold-panel/decide.txt`, head-to-head
×3) resolved the core vocabulary. **`organ` → `dimension`** (3/3 cold, decisively fitter — adopted); VALUE keeps
`fragment` and CORPUS keeps `anatomy` (cold winners `variant`/`kit` overridden on concept-fit). The genus rename
(C1) folds into C2 as one coherent re-signification; execution is sequenced after the plugin-cli design locks. Only
the published BRAND (`agent-anatomy` vs `AgentKit`) is left as an Operator value-call. See `C2` for the decision +
spec._

**Still OUT of the mechanical sweep.** Renaming a `Genus` axis is a large structural refactor (the type +
per-organ metadata + docs + the accept-gate token list) — it needs its OWN census-grounded execution spec
(`census-grounds-spec`), authored when the Operator green-lights pulling it into scope. Every sweep shard EXCLUDES
the `Genus`-axis tokens until then.
