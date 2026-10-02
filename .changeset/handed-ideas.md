---
'@cratylus/canon': minor
---

The planner now takes the operator's suggestions about how to build a shard as idea notes handed with the shard, by title, and does not search the notebook for them. It weighs each by its own judgment, never as a ruling and never as grounds to redraw the shard, and resolves one it takes up to the unit that carries it with `note resolve --unit`; one it does not take up stays as it is. The `planner` role value reads the handed idea notes and writes their resolution, the `plan` skill's procedure takes them with the shards and resolves each one taken up after the units are added, and the role's description and archetype say so.
