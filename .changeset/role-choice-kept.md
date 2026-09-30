---
'@cratylus/forge': minor
---

`cratylus install --harness claude` no longer overwrites the model a host chose for an agent. Claude Code sets a subagent's model in one place, the `model:` line of its definition, and every install used to write the tier back. The deploy manifest now records, per placed claude definition, the `model:` value it rendered (`agentModels`); a deployed definition whose `model:` line differs from that record keeps the host's line in the definition placed over it (a line the host removed stays removed, and one it added stays), every other line is replaced as before, and the install output names each agent whose model it kept. A first install into a root with no record writes what it rendered.

Install also shows the roles as settable on Claude Code: one line per held role with its tier and the `model:` line that sets it, and the `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` with `CLAUDE_CODE_SUBAGENT_MODEL=<model>` override for every subagent.

The new integrator role routes like the implementer's spec-bounded work: `model: sonnet` on Claude Code, and the built-in `@task` role on omp. omp's `modelRoles` entries stay the host's and are never changed.
