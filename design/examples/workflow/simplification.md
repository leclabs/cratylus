# Examples · simplification

Context: workflow. Concepts: example, freeze, roles. Decisions in force: 0143, 0144, 0145.

1. (example) **Given** the project as delivered and this repository, **when** their files are searched,
   **then** no suite of live agent runs and no recorded-run proof exists; neither is named as a way
   an example is checked.
2. (example) **Given** this repository's test suite and CI configuration, **when** every test in them
   is listed with the programs it starts, **then** none starts omp or an agent; each tests cratylus's
   own code or the files it produces.
3. (freeze) **Given** an opened cut, **when** a commit changing one of its frozen examples or checks
   is made and moved onto a branch by any route, **then** it succeeds; no hook in the delivered
   project or this repository refuses it, and no reference-transaction hook is installed.
4. (freeze) **Given** an opened cut, **when** someone other than its architect appends a journal entry
   changing a concept its examples name, **then** the entry is recorded with the name of who made it
   and a warning naming the cut is shown; the append is never refused.
5. (freeze) **Given** an opened cut, **when** what it freezes is shown, **then** it lists its examples,
   checks and concepts, and no list of files its checks use; nothing records or tracks those files.
6. (freeze) **Given** the architect of an opened cut, **when** the architect appends an entry changing
   one of the cut's concepts, **then** it is recorded with the architect's name and no warning is shown.
7. (roles) **Given** the roles concept as delivered, **when** it is read, **then** it names each party's
   sight, change and decision, and states no limit on whom a party may dispatch nor any test of how
   its behaviour is judged.
8. (roles) **Given** the delivered project, **when** its commands and harness settings are searched,
   **then** none refuses an act by the architect on the ground of how the architect behaves or replies.
