# shard-layout

**Objective.** Decide the on-disk shard model: granularity (one file per fact vs per topic),
directory layout for SELF/MEMORY as sharded files, frontmatter schema, naming.

**Preconditions.** `interface/verb-interface-spec` landed (the verbs constrain the layout).
[[sharded-work-layout]] is the pattern; the vault namespace (`agents/<name>/`) is the precedent.

**Operations.** Choose granularity + naming + frontmatter (type/topic/scope tags for relevance);
define how "hot vs cold" maps to directories; record as `decisions/0003-shard-layout.md`.

**Artifacts.** `decisions/0003-shard-layout.md`.

**Acceptance (blind test).** The decision file lets a reader lay out one agent's sharded SELF/MEMORY
by hand and predict where any new memory would file.
