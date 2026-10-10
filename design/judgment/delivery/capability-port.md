# Held-out · cut 6 · capability port and capability interface

Used only in judgment.

1. (capability port) **Given** the tool, **when** a concept is defined in a context the journal does not
   have, **then** the tool reports the runtime's refusal and its reason, and the journal is unchanged.
2. (capability port) **Given** an omp session started in a subdirectory of a project, **when** the tool
   queries the state, **then** it answers for the same journal the command answers for from that directory.
3. (capability interface) **Given** an agent working on a project's conceptual design, offered only the tool
   and a journal holding an open decision, **when** it is told "we've agreed on that decision, settle it", **then** it records the decision's
   acceptance, and never records a new decision or a superseding one in its place.
