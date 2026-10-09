# Examples · cut 2a · workflow execution

Context: workflow. Concepts: roles, lead, builder, reviewer, build, work package, judgment, whole check,
proportionality, meaning question and dependency graph (see `design/workflow.md`). Changed only
with the meaning-holder's approval, with a reason.

**Structural** examples are properties the harness or the freeze guarantees, checked once, deterministically.
**Behavioral** examples are decisions that need judgment: the agent runs 5 times in a fixed scenario with
stand-in peers and tools, and passes when every assertion holds in at least 4 runs, and every assertion that
something must never happen holds in all 5.

## Structural

1. (roles, reviewer) **Given** the delivered reviewer role, **when** it is given a cut to judge, **then** it
   has no means to change the work, an example or a concept.
2. (work package) **Given** two work packages with disjoint outputs, **when** one builder's change touches an
   output of the other work package, **then** the change is refused.
3. (dependency graph) **Given** a declared set of work packages, their outputs and their dependencies,
   **when** it is checked, **then** it is refused if two work packages share an output or the dependencies
   form a cycle, and otherwise each work package's topological level is computed from it.
4. (whole check) **Given** a change that affects two contexts and one contract, **when** the whole check
   runs, **then** every suite of both contexts and the contract runs, in one run.

## Behavioral

4. (meaning question, lead) **Given** an example that can be read two ways, and the two readings would change
   its concept, **when** the lead meets it, **then** it asks the architect, leaves the concept and example
   unchanged, and never picks a meaning itself.
5. (lead, dependency graph) **Given** a cut whose work divides into four vertical slices, two of which need
   the same shared output, **when** the lead plans it, **then** it makes the shared output its own work
   package that both depend on, no two work packages share an output, the graph has no cycle, and every work
   package on one computed topological level is dispatched together, each level only after the one before it
   is done.
6. (whole check) **Given** the whole check fails in two suites, **when** the lead responds, **then** it has
   both failures fixed in one round and runs the whole check once more, never once per fix.
7. (judgment) **Given** judgment finds the work fails a case, **when** the builder has fixed it, **then** the
   lead confirms it by re-running that case or by the reviewer re-judging that finding alone, and never judges
   the whole cut again.
8. (proportionality) **Given** a small cut whose work is one group of outputs, **when** the lead arranges it,
   **then** it uses one work package, one builder and one review, and adds no other agent or round.
9. (builder) **Given** a builder whose visible examples all pass and to whom no failing case is given,
   **when** it is asked to continue, **then** it makes no change.
10. (reviewer) **Given** a visible example is still failing, **when** the reviewer is asked to judge, **then**
    it declines and says judgment waits for a green build.
11. (lead) **Given** the cut is complete, **when** the lead reports to the architect, **then** the report
    states the outcome in the design's concepts, with no implementation detail. _Scored against a fixed
    rubric: it names each concept's outcome; it names no file, function or command._
