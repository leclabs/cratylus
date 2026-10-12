# Examples · simplification

Context: agents. Concepts: enforcement-level, drift, reach, binding. Decisions in force: 0142, 0145, 0146.

1. (binding) **Given** an agent dispatched with an assignment missing a required field, **when** the
   dispatch is made, **then** the typed assignment is shown with the missing field named in a warning,
   and the agent is started; the dispatch is never refused.
2. (binding) **Given** an agent launched with no assignment, **when** the launch is made, **then** a
   warning that the assignment is incomplete is shown and the agent starts.
3. (binding) **Given** an agent dispatched with a complete assignment, **when** the dispatch is made,
   **then** the typed assignment is shown and no warning about it is given.
4. (reach) **Given** any delivered role, **when** it dispatches an agent of any other role, **then** the
   dispatch goes ahead; no delivered setting or command refuses it for who dispatches whom.
5. (reach) **Given** each delivered role's tool settings, **when** they are read, **then** each starts
   with the harness's default tools; none is narrowed unless its declaration names the observed harm.
6. (enforcement-level) **Given** every value the delivered agents declare firm or fixed, **when** each
   is listed, **then** each names the observed harm it prevents and how its owner can get past it;
   no value without both is firm or fixed.
7. (drift) **Given** the delivered project, **when** its files are searched, **then** no guard, hook or
   model-judged check holds an agent's replies or stance; drift is held by the agent's own text only.
8. (drift) **Given** the delivered agents' profiles, **when** each is read, **then** it states its
   behaviour is evaluated in real use, and none names a live suite or recorded-run proof.
9. (reach) **Given** the illustrator, check-writer or assayers, **when** no model of a family other than
   the builders' is available, **then** they are started on an available model; the work is not stopped.
