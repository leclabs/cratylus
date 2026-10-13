# Examples · checks

Context: workflow. Concept: ledger. Decisions in force: 0149, 0155 and 0156.

## Structural

1. (ledger) **Given** a cut whose ledger records its opening and integration but no work packages,
   **when** its state is read, **then** its phase is integrated, not open; missing work-package
   history does not undo the recorded integration.

2. (ledger) **Given** an integrated cut with three work packages whose last recorded statuses
   are dispatched, returned and unapproved respectively, **when** its state is read, **then** its
   phase is integrated, not in flight. Those three statuses remain readable as recorded; none is
   changed to approved to make the phase come out integrated.

3. (ledger) **Given** a cut with every work package approved but no recorded integration,
   **when** its state is read, **then** it is complete, not integrated. An open cut with no dispatch
   remains open, and a dispatched cut with unapproved work remains in flight; the repair does not
   make every cut integrated regardless of its record.

4. (ledger) **Given** a context with one integrated cut and one cut still in flight,
   **when** its overview and the cuts still in flight are read, **then** only the latter is listed
   as in flight; the integrated cut is not presented as unfinished because its work packages lack
   approvals.

5. (ledger) **Given** the repository's existing ledger, including every integration already
   recorded, **when** the states of those cuts are read, **then** every one reads integrated without
   appending, editing or deleting any record. Reading again leaves the records unchanged; missing
   dispatches, returns or verdicts are not backfilled to repair the reading.
