# constitution-update

**Objective.** Update the `memory` cell's resident-layers model + [[dream]]/[[wake]] routing so the
store is **sharded files** and consolidation is a **move** (ADR D2). Nico's domain.

**Preconditions.** `layout/shard-layout` decided.

**Operations.** Revise `lexicon/structure.md` `^memory` (resident layers → sharded) + `dream.md`
(routing/clearing as file-moves) under CE ∧ ME; run `resolve→glossary→verify` to PASS.

**Artifacts.** `packages/mind/lexicon/structure.md`, `packages/mind/mind/skill/.../dream.md`.

**Acceptance (blind test).** `verify.py` PASS; the rendered memory Protocol describes sharded files

- move-consolidation, and a fresh agent could run wake/dream against the new model from the SOUL alone.
