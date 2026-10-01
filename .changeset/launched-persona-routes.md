---
'@cratylus/forge': patch
---

An omp persona started by name now begins on the model its role routes to, as a dispatched holder of that role does: the launcher reads the `model` list from the definition it already reads and starts omp on the roles of it that the host's `modelRoles` maps, falling back from the held role to the default role. Where the definition routes nothing or the host maps none of its roles omp still chooses its own model, and a `--model` given on the launch command line wins.
