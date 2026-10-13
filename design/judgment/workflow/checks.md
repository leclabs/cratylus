# Held-out · checks

Context: workflow. Used only in judgment.

1. (ledger) **Given** a cut with an integration event followed by a recorded finding against one
   of its work packages, and a separate cut still in flight for the unfinished work, **when** both
   cuts are read, **then** the first still reads integrated and the second still reads in flight.
   The finding remains readable in the first cut's history but does not reopen it, and its
   integration neither approves nor integrates the second cut.
