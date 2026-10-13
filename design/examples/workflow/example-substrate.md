# Examples · cut 1 · example substrate

Context: workflow. Concepts: example, held-out example, freeze (see `cratylus concepts design --context workflow`).
Approved by the architect holding the context on 2026-10-09. Changed only with that architect's approval, with a reason.

## example

1. **Given** an example with a situation, a trigger and a checkable outcome, **when** it is checked,
   **then** a pass is recorded only if the outcome holds, and a failure otherwise.
2. **Given** an example whose outcome is missing or too vague to check mechanically, **when** it is
   submitted, **then** it is refused, and the reason names the unspecified outcome.
3. **Given** an example about an AI agent in a fixed scenario with stand-in peers and tools, **when** it is
   checked, **then** the run is repeated and passes only if the observed pass rate meets the example's
   stated threshold.
4. **Given** an example scored against a fixed rubric, **when** it is checked, **then** it is scored only
   against that rubric, and the rubric is frozen with it.

## held-out example

1. **Given** a held-out example, **when** judgment runs it, **then** its result is reported without the
   case being revealed to builders.
2. **Given** a held-out example fails, **when** builders are told, **then** they learn the concept and the
   shortfall, never the case's situation, trigger or outcome.
3. **Given** a held-out case is revealed so it can be fixed, **when** the judgment set is updated, **then**
   the case becomes visible and a new held-out case replaces it.

## freeze

1. **Given** an example whose check has been seen to fail against the unbuilt work, **when** it is
   confirmed, **then** the example and its check are frozen against changes by builders.
2. **Given** an example whose check has never been seen to fail, **when** freezing it is attempted,
   **then** it is refused, and the reason is that the check has not shown it can fail.
3. **Given** the architect holding the context approves a change to a frozen example, **when** the change is applied,
   **then** it is accepted, recorded with its reason, and frozen again only after its check fails against
   work that does not yet satisfy it.
