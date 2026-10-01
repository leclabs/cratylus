---
'@cratylus/forge': patch
'cratylus': patch
---

On omp a dispatch of the implementer is now an isolated task, so the implementer builds in an isolated copy of the dispatcher's checkout and no longer writes the main checkout. The copy is still cut from the dispatcher's HEAD and not from the plan's line, so the implementer is still not started in a worktree off the line, and the projection warns of that, in words that now say what it does get.

`@cratylus/forge`'s `HarnessAdapter` gains the optional `dispatchIsolation`, a harness's isolation of a dispatched agent where its agent definition has no field for one: the host config files, the scalar settings the host must hold, and what the isolation still lacks. omp declares it as `task.isolation.enabled: true`, `apply: false` and `merge: branch`. omp emits a `cratylus-isolation.ts` extension in the session scope and in each persona's, whose `tool_call` handler sets `isolated: true` on every spawn of an agent declaring a worktree, in a batch or a flat call, and on nothing else. Install sets the three settings in omp's `config.yml` by editing its lines, replacing a value the host held and recording the edit so that uninstall puts the file back byte for byte, and says in its summary what is not realized. A config it cannot edit safely is left as it is, with the lines to write by hand. `ProjectedTree` gains `unisolated`, the agents that declare a worktree the harness cannot start.

Measured on omp 18.4.9: a `tool_call` handler can revise a task's input, `task.isolation.apply: false` keeps the copy's changes out of the dispatcher's checkout (its `git status` is unchanged), and the copy is cut from the dispatcher's checkout as it stands, with no ref to give. The settings are the host's, so they hold for the isolated tasks you dispatch yourself as well: their changes are kept as the branch `omp/task/<id>`, not applied.
