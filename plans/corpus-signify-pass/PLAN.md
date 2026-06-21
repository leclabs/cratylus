# corpus-signify-pass

**State: SEQUENCED AFTER `mind-structure-flatten`** (run the σ\*\_R content pass on the clean flat
structure, not one we are about to move). Nico is corpus lead; Mav owns tooling + drives elicitation.

## Ready frontier

| Task                            | Concern | Owner |
| ------------------------------- | ------- | ----- |
| `harvest/harvest-reference-set` | harvest | Mav   |

## Pending

| Task                                     | Concern    | Dep        | Owner          |
| ---------------------------------------- | ---------- | ---------- | -------------- |
| `clustering/cluster-redundant-fragments` | clustering | harvest    | Nico + Mav     |
| `elicit/elicit-candidates`               | elicit     | clustering | Mav + Operator |
| `signify/signify-star-r-pass`            | signify    | elicit     | Nico           |
| `verify/reconstruction-gate`             | verify     | signify    | Mav            |

## See also

- `../mind-structure-flatten/` — run this **after** it (content pass on the final structure).
- [[signifier-star-r]] · [[signify]] · [[elicit]] · [[precise-circumscription]] — the method.
