---
'@cratylus/canon': minor
---

Canon now ships the agents of the example-driven workflow, composed from its catalog. The six roles (`architectRole`, `leadRole`, `builderRole`, `assayerRole`, `illustratorRole`, `checkWriterRole`) are full default vectors, one stated list per factor. Each role's generic holder (`architect`, `lead`, `builder`, `assayer`, `illustrator`, `check-writer`) and the personas `kino`, `nico` and `mav` over the architect are installed by the new preselected practice `example-driven-workflow`.

New exports: `holder(cell)` makes a role's generic holder; `persona(role, residue)` composes a persona over a role. Every value an agent holds is an entry carrying its enforcement level, the factor's default unless stated. A persona's single values replace the role's, its set values extend them, and it may narrow reach (`removes` on perception-scope, action-scope or handoffs). Composition refuses, by throwing `CompositionRefusal` with a message naming what it refused: an unknown factor, stating the role, a slots value without a slot, widening reach, removing or weakening a guardrail, taking a value from any other set, and a missing mark or the role's own mark. Also exported: `MANIFEST` and the types `RoleCell`, `Residue` and `Stated`.

A composed agent carries `holds` (its role), `dispatches` (its handoffs), `routing` (its model tier and effort), `readOnly` when its action scope is `none`, and an empty `key`.
