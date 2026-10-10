# Examples · context subjects

Context: workflow. Decision in force: 0056. Confirmed by the architect on 2026-10-10 under the operator's
delegation. All structural.

1. **Given** a recorded context with a subject and a relation, **when** its subject is changed with a reason,
   **then** the new subject is current, the relation is unchanged, and the context's history keeps the earlier
   subject and records the new one with its reason.
2. **Given** the same context, **when** its relation is changed with a reason, **then** the context map shows
   the new relation, the subject is unchanged, and the history keeps the earlier relation.
3. **Given** a recorded context, **when** a change to its subject or relation comes with no reason, **then** it
   is refused and nothing is appended; **and when** a change names a context the journal does not have, **then**
   it is refused and no context is created.
4. **Given** two branches that recorded a context differently, merged, **when** the context is settled with a
   reason, **then** the settled description is current, the disagreement is gone, and both earlier descriptions
   stay in history.
5. **Given** a context whose subject and relation were changed, **when** the design is reconstituted, **then** the
   current subject and relation are read, and the earlier ones only in its history.
