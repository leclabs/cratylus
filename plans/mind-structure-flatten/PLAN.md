# mind-structure-flatten

**State: DELIVERED (committed; push/merge pending) · one scoped follow-on deferred.** The γ2-B
`mind/<kind>/<organ>/` nesting is dissolved — composites flat at `packages/mind/{agents,skills}/<slug>.md`,
organs section-driven, primitives untouched. Committed `911d771` on branch `mav/mind-structure-flatten`
(unpushed — Operator's push/PR call). Mav principal-ic lead; Nico owns taxonomy + organ/glossary cells + docs.

## Gates (closed)

| Task                                     | Ruling                                                  | Record                             |
| ---------------------------------------- | ------------------------------------------------------- | ---------------------------------- |
| `taxonomy/organ-kind-ruling` (Nico)      | **organ-as-slot, concept-glossed; NO `kind: organ`**    | `decisions/0001-organ-taxonomy.md` |
| `scope/primitive-flatten-decision` (Mav) | **composites-only**; lexicon-block primitives untouched | `decisions/0002-flatten-scope.md`  |

G1 diverged from Mav's recommendation (organ-as-kind) on a stronger CE∧ME argument — a `kind: organ`
would duplicate `kind: concept` and have nothing to classify. Mav accepted. Same flat outcome, zero new kinds.

## Tasks

| Task                               | Owner | State                                                                   |
| ---------------------------------- | ----- | ----------------------------------------------------------------------- |
| `organ-cells/mint-organs-glossary` | Nico  | ✅ 8 organ concepts in `lexicon/concept.md`; fleet-neutral, +8 GLOSSARY |
| `toolkit/flat-storage-support`     | Mav   | ✅ flat `agents/`+`skills/` resolver (storage-polymorphic)              |
| `agent-anatomy/archetype-sections` | Mav   | ✅ `GENUS_ORGANS` removed → `section_organ_refs`; `## Memory` ×11       |
| `migration/move-composites-flat`   | Mav   | ✅ 24 composites git-moved flat; `mind/` removed                        |
| `docs/update-conventions`          | Nico  | ✅ `AGENTS.md` + `ideas/AGENTS.md` mirror the flat layout               |
| `skills/flatten-skills-and-assets` | Mav   | ⏸ **DEFERRED** — acceptance met; op2 asset-collapse a follow-on (0004)  |

Every build step byte-proven: `diff -rq` of the rendered fleet pre/post **empty**, `verify.py` PASS, 17/17 tests.

## Decisions

`0001` organ-taxonomy (Nico) · `0002` flatten-scope (Mav) · `0003` memory-section-convention (Nico ratify) ·
`0004` skills-flatten-scope (Mav — op2 deferred).

## Follow-on (deferred — decision 0004)

`asset-mechanism-collapse` — collapse the dir-form `assets:` mechanism into `bundle:`-style front-matter
paths; remove `cell_dir` + the dir-form branches in `cells.py` / `resolve._stage_assets`; rewrite
`test_place.py §1`. Zero current users + test-only safety net → a focused pass, not a session-tail cram.

## See also

- `docs/agent-conceptual-anatomy.md` — the σ\*\_LLM organ set this plan filed as section-structure.
- `../sharded-memory-store/` — initiative B, sequenced after this (it touches the `memory` cell).
