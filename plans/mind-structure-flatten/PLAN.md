# mind-structure-flatten

**State: GATES CLOSED → BUILD.** Both design gates are ruled and recorded; the build slices are now
the frontier. Mav is principal-ic lead; Nico owns taxonomy + the organ/glossary cells.

## Gates (closed)

| Task                                     | Ruling                                                  | Record                             |
| ---------------------------------------- | ------------------------------------------------------- | ---------------------------------- |
| `taxonomy/organ-kind-ruling` (Nico)      | **organ-as-slot, concept-glossed; NO `kind: organ`**    | `decisions/0001-organ-taxonomy.md` |
| `scope/primitive-flatten-decision` (Mav) | **composites-only**; lexicon-block primitives untouched | `decisions/0002-flatten-scope.md`  |

G1 diverged from Mav's recommendation (organ-as-kind) on a stronger CE∧ME argument — a `kind: organ`
would duplicate `kind: concept` (the organ's meaning) and have nothing to classify (the organ's
content is an archetype section). Mav accepted. Same flat outcome, zero new kinds.

## Build frontier

| Task                               | Concern       | Dep             | Owner      | Byte-identity                             |
| ---------------------------------- | ------------- | --------------- | ---------- | ----------------------------------------- |
| `organ-cells/mint-organs-glossary` | organ-cells   | G1              | Nico       | fleet-neutral; **+8 lines GLOSSARY.md** ✓ |
| `toolkit/flat-storage-support`     | toolkit       | G1, G2          | Mav        | fleet byte-identical                      |
| `agent-anatomy/archetype-sections` | agent-anatomy | G1, organ-cells | Mav + Nico | fleet byte-identical                      |

**Coupling (load-bearing).** `GENUS_ORGANS=("memory",)` is what renders the memory `## Protocol` into
every SOUL. Removing it (charter mandate) without anatomy-section composition in place strips the
Protocol → byte-identity breaks. So `flat-storage-support` (composer half) + `archetype-sections` land
**together** as one byte-gated unit; only the flat _physical move_ + `organ-cells` are separable.
`archetype-sections` references the 8 organ concepts, so it is **downstream of `organ-cells`**.

## Pending (downstream)

| Task                               | Concern   | Dep       | Owner |
| ---------------------------------- | --------- | --------- | ----- |
| `migration/move-composites-flat`   | migration | toolkit   | Mav   |
| `skills/flatten-skills-and-assets` | skills    | toolkit   | Mav   |
| `docs/update-conventions`          | docs      | migration | Nico  |

## Build sequence

`organ-cells` (Nico, running) → coupled core {`flat-storage-support` composer + `archetype-sections`}
(byte-gated together) + flat physical resolver → `migration` + `skills` → `docs`. Every slice under the
γ2-B byte-identity license (`diff -rq` of `.render` pre/post empty unless a delta is scoped + enumerated).

## See also

- `docs/agent-conceptual-anatomy.md` — the σ\*\_LLM organ set this plan files as section-structure.
- `../sharded-memory-store/` — sequence B after this (it touches the `memory` cell restructured here).
