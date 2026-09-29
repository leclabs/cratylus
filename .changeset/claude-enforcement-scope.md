---
'@cratylus/schema': minor
'@cratylus/forge': minor
'@cratylus/canon': minor
---

The scope-enrolled guards now judge on Claude Code. They fired from `settings.json` on every turn and exited at their scope gate, because the gate read only the `stance_scope` that omp's dispatcher supplies, so a Claude Code session was never judged and nothing said so.

`@cratylus/schema` adds the projection fact `harness-persona-root`.

`@cratylus/forge` builds the persona enrollment manifest once, in `core/enrollment.ts`, and the projector stages it for every adapter that declares `scopedRel`. The claude adapter now declares one, placing a persona scope at `personas/<name>/` under `.claude`. `OMP_STANCE_MANIFEST` is now `STANCE_MANIFEST` in that module, and omp's rendered manifests are byte-identical. `deploy` also stops dropping a cell's second matcher group on one event when it merges `settings.json`, which had left the stance dispatch guard and purview's every-tool group unregistered on a deployed host; an identical group is still added once.

`@cratylus/canon` resolves the scope in all three guard workers as `stance_scope` when present, and otherwise as `<harness home>/<persona root>/<agent_type>` when the payload names an agent. A bare session and an agent with no manifest stay silent, and an `agent_type` that is not one directory name is refused. The regenerated `.sh` targets differ in that gate and its comments.
