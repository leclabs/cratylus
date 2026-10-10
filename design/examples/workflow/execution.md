# Examples · the execution cut

Context: workflow. Concepts: work package, dependency graph, whole check, efficiency, proportionality, and the
roles lead, builder and assayer. Decisions in force: 0054, 0055. Confirmed by the architect on 2026-10-10 under
the operator's delegation. Structural examples call the work package capability and inspect its answer.
Behavioral examples run the composed agents 5 times in a fixed scenario: every assertion holds in at least 4
runs, every never-assertion in all 5.

## Structural

1. (proportionality) **Given** a cut with one concept, one example and one output, **when** the lead submits
   one work package for it, **then** it is one work package for one builder, alone on the first level, and
   nothing more is required.
2. (work package) **Given** two work packages that both need one shared output, owned by a third they both depend
   on, and an example spanning two of them, **when** they are submitted, **then** the shared output has one
   owner on an earlier level, and the spanning example belongs to the work package that depends on the other.
3. (work package) **Given** a work package that owns an output, **when** another work package claims the same
   output, **then** the claim is refused, naming the output and both work packages.
4. (work package) **Given** a cut with two concepts and work packages serving only one, **when** dispatch is
   asked for, **then** the unserved concept is named and nothing is dispatched; once a work package serves it,
   both are reported served.
5. (dependency graph) **Given** work packages whose dependencies form a cycle, **when** levels are asked for,
   **then** the cycle is reported by its work packages and no levels are given.
6. (dependency graph) **Given** A and B with no dependencies, C after A, D after B, and E after C and D,
   **when** levels are asked for, **then** they are A and B, then C and D, then E, and a level is offered only
   once the one before it has finished.
7. (work package) **Given** an accepted work package, **when** the lead updates its outputs and dependencies,
   **then** the answer shows only the updated outputs and the levels computed from the update.
8. (dependency graph) **Given** no work package ready to hand out, **when** a dispatch is asked for, **then** it
   is refused, never reported as a dispatch of nothing.
9. (work package) **Given** a cut whose visible examples are divided among two work packages, **when** each
   builder's assignment is asked for, **then** each receives exactly its own work package's examples, none of
   the other's, and the cut's inventory accounts for every visible example.
10. (work package) **Given** a builder whose commits change only its own work package's outputs, **when** they
    are made, **then** they are accepted and kept in that work package's history in order.
11. (work package) **Given** a builder's commit that also changes another work package's output, **when** it is
    made, **then** it is refused, naming the output outside its work package, and nothing of it is kept.
12. (whole check) **Given** a whole-check run that reveals three failures, one round that fixes all three, and
    one more run, **when** the counts are asked for, **then** they are two whole-check runs, each in its round,
    and the fixes add no runs.
13. (whole check, efficiency) **Given** a round whose whole-check run resolves none of the previous run's
    failures, **when** the round is recorded, **then** it is flagged as making no progress and still counted; a
    round that resolves at least one is progress.
14. (efficiency) **Given** a cut's recorded agent runs, rounds, whole-check runs and tokens, **when** a later
    session reads the design, **then** it reads the same figures for that cut.

## Behavioral (the composed roles)

<!-- prettier-ignore-start -->
15. (meaning question, lead) **Given** an example that can be read two ways, and the two readings would change
    its concept, **when** the lead meets it, **then** it asks the architect, leaves the concept and example
    unchanged, and never picks a meaning itself.
16. (judgment, lead) **Given** judgment finds the work fails a case, **when** the builder has fixed it, **then**
    the lead confirms it by re-running that case or by the assayer re-judging that finding alone, and never
    judges the whole cut again.
17. (builder) **Given** a builder whose visible examples all pass and to whom no failing case is given,
    **when** it is asked to continue, **then** it makes no change.
18. (assayer) **Given** a visible example is still failing, **when** the assayer is asked to judge, **then**
    it declines and says judgment waits for a green build.
<!-- prettier-ignore-end -->

## Moved out of this cut

Example 19 (the lead reports the outcome in the design's concepts, naming no file, function or command) moves to
the cut that realizes decisions 0059 and 0060, where the outcome is recorded through the work package capability.
Its number is retired here.
