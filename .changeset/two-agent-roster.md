---
'@cratylus/forge': minor
---

the canon ships two agents, and both inherit the harness's memory

The roster is `mav` and `nico`. `arch-doc-writer`, `boz`, `developer`, `investigator`,
`planner`, `principal-engineer-reviewer`, `principal-ic` and `tester` are deleted — not
deprecated, not moved behind a flag.

Both survivors declare `memory: null`, the explicit omit-to-inherit sentinel: the dimension is
OMITTED from the projected face, so the agent has whatever memory its harness provides. The
corpus used to declare `long-term-memory ⟨episodic · semantic · procedural⟩` and fund it with
the `wake` and `dream` cells; those cells are retired, and a host with a real backend does this
better than a projected claim. `dimensions/memory/*` stays on disk as an unreferenced axis
library — four of its five fragments already were.

Consumers of the published corpus lose eight agent definitions. The retired faces and their
launch specs ARE swept from a host on the next `cratylus deploy` — but only because this
release also fixes the prune: its containment guard took ONE root, and omp's destinations are
`../.agents/…`, a sibling of the harness home, so every record resolved outside that root and
was silently skipped. Measured on a sandbox host — ten projected personas, redeployed from a
two-agent corpus, kept all ten faces, all ten launch specs and every retired skill, and the
deploy reported success. `applyPrune` now takes the neutral root as a second entitled root, and
attribution is still by manifest record, so a file this tool never wrote is untouchable in
either root.
