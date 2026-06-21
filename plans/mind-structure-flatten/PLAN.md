# mind-structure-flatten

**State: DESIGN-GATED.** Two gates (G1 organ-kind ruling, G2 primitive scope) are the **ready
frontier**; the build slices are **pending** on them. Mav is principal-ic lead; Nico owns taxonomy.

## Ready frontier (the gates — fan out now)

| Task                               | Concern  | Owner          |
| ---------------------------------- | -------- | -------------- |
| `taxonomy/organ-kind-ruling`       | taxonomy | Nico           |
| `scope/primitive-flatten-decision` | scope    | Mav + Operator |

## Pending (unblock on the gates)

| Task                               | Concern       | Dep       | Owner      |
| ---------------------------------- | ------------- | --------- | ---------- |
| `toolkit/flat-storage-support`     | toolkit       | G1, G2    | Mav        |
| `agent-anatomy/archetype-sections` | agent-anatomy | G1        | Mav + Nico |
| `organ-cells/mint-organs-glossary` | organ-cells   | G1        | Nico       |
| `migration/move-composites-flat`   | migration     | toolkit   | Mav        |
| `skills/flatten-skills-and-assets` | skills        | toolkit   | Mav        |
| `docs/update-conventions`          | docs          | migration | Nico       |

## See also

- `docs/agent-conceptual-anatomy.md` — the σ\*\_LLM organ set this plan files as section-structure.
- `../sharded-memory-store/` — sequence B after this (it touches the `memory` cell restructured here).
