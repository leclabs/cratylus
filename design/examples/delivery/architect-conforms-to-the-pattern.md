# Examples · architect conforms to the pattern

Context: delivery. Concepts: delivered context.

1. (delivered context) **Given** cratylus has just been installed and a new project has no recorded contexts, **when** the project's design and design state are read, **then** the practice holds two delivered contexts, cratylic context design first and workflow second, each named by its origin and marked delivered and read-only. Reading them creates no project record and adds no context the project owns.

2. (delivered context) **Given** the operator installs cratylus at either scope, user or project, and declines every ruleset the install offers, **when** a project's design is then read, **then** cratylic context design is still delivered, beside workflow. It ships with every install; it is never an optional ruleset, and declining the rulesets must not remove it.

3. (delivered context) **Given** a project owns a booking context, **when** a fresh session reads the design at its start, **then** it reads cratylic context design first, then workflow, then the booking context, and its read-back names the delivered practice apart from the project's design. The session must not judge the booking record's names before it has read cratylic context design.

4. (delivered context) **Given** a project owns booking and payments contexts with a dependency between them, **when** the project's context map is read, **then** it shows booking and payments only. Cratylic context design and workflow are shown in the practice, apart from the project's contexts; neither appears as a node or a dependency in the project's context map, and neither counts among the project's own contexts in its design state.

5. (delivered context) **Given** the architect has found that the booking record redefines "refund" and has a correction to record, **when** it records the correction, **then** it lands only as a new version of the booking context's own concept. A write aimed at the delivered cratylic context design (to change its description, add, supersede or retire a concept, or record a decision) is refused and changes nothing, and it must not create a project-owned copy of cratylic context design as a side effect.

6. (delivered context) **Given** cratylus's own project record holds cratylic context design itself, with wording that differs from the release installed on the machine, **when** that project's design is read, **then** cratylic context design is shown once, as the project's own context with the project's own current wording, still before workflow. The installed release's version neither overrides it nor appears as a second copy in the practice.

7. (delivered context) **Given** a project that does not hold cratylic context design, **when** the architect reads the project's record against the universe of discourse, **then** it reads the project's own concepts as the conceptual model, and cratylic context design as the practice it works by. Cratylic context design's concepts must not be taken as concepts of the project, accepted against as the project's work, or flagged as defects in the project's record.
