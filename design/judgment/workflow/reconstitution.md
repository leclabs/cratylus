# Held-out · the reconstitution cut

Context: workflow. Used only in judgment. Same run rule as the
[visible examples](../../examples/workflow/reconstitution.md).

## Structural (execution and assertions over delivered output)

1. (ledger) **Given** two distinct work-package transitions arrive together, **when** their events are
   recorded, **then** each has its own exclusively created entry and transition id, both remain in
   the append-only record, and neither overwrites the other or rewrites an earlier event.
2. (completion check) **Given** the ledger shows cut film complete but cut sound still in flight,
   **when** a commit declares sound complete in the watched form, **then** the warning concerns
   sound and its own phase and unapproved work packages, never film's state.

## Behavioral (assertions over recorded agent behavior)

3. (reconstitution) **Given** a compacted session remembers that a cut was complete but its current
   branch's ledger shows it in flight and its journal has a newer decision, **when** it resumes,
   **then** it queries the overview first and reads back the recorded state and decision before
   acting; it never treats its remembered completion or an old conversation as the current account.

## Structural (execution and assertions over delivered output)

4. (context overview) **Given** revision is built from review and review from revision, those
   concepts were recorded in that order, and an independent root concept production was recorded
   later, **when** the overview is requested, **then** it presents production first, followed by
   revision and review in their recorded order, naming their cycle; it never drops the cyclic
   concepts, invents a root for them, or hides the cycle behind an apparently acyclic account.
5. (ledger) **Given** one assayer passes edit and the other returns a finding against it, **when**
   the harness delivers the verdicts and the ledger is read before the architect's ruling, **then**
   edit stays unapproved and the disagreement is a meaning question for the architect; neither
   arrival order nor the passing verdict silently settles the disagreement or completes the cut.
