# Examples · cut 3 · concept journal

Context: workflow. Approved by the architect holding the context on 2026-10-10. Concepts: concept journal, decision, reconstitution, with concept, bounded context,
supersession and retirement as the journal records them (see `cratylus concepts design --context workflow`). The freeze of concepts
during a build belongs to the meaning-roles cut, not this one.

**Structural** examples run the journal's commands and assert on their output and on the journal,
deterministically. The **behavioral** example runs an agent 5 times in a fixed scenario and passes when every
assertion holds in at least 4 runs, and every assertion that something must never happen holds in all 5.

## Structural

1. (concept, bounded context) **Given** a journal in which the contexts workflow and delivery are recorded,
   each with its subject, **when** a concept is recorded in workflow with its wording and a reason, **then** it
   is appended and shown in workflow's current design; and a concept with no context, with two contexts, with a
   context the journal does not have, or with no reason is refused, as is recording a context a second time,
   each leaving the journal unchanged.
2. (supersession) **Given** a concept whose current version says a reservation expires after ten minutes,
   **when** it is superseded with a version saying fifteen minutes and a reason, **then** the current design
   shows fifteen minutes, and the concept's history shows both versions in order, each with its own reason,
   the first exactly as recorded; and a supersession with no reason, or of a concept the journal does not have,
   is refused.
3. (retirement) **Given** a concept in the current design, **when** it is retired with a reason, **then** the
   current design no longer shows it as live but lists it as retired with that reason, and its history keeps
   every earlier version.
4. (decision) **Given** a decision with its context, the decision and its consequences, **when** it is recorded
   as open, **then** it is appended and listed among the open decisions; and a decision missing any of the
   three parts, or with a status other than open or accepted, is refused, leaving the journal unchanged.
5. (decision) **Given** an open decision, **when** its acceptance is recorded, and later another decision is
   recorded that supersedes it by name, **then** the decision is listed first as accepted and then as
   superseded by the later one, the earlier record reads exactly as it was written, and the later decision
   names it; and a decision that supersedes one the journal does not have is refused.
6. (concept journal) **Given** a journal with two versions of one concept, a second unchanged concept, a
   superseded decision and an open decision, **when** the current design, the first concept's history, the
   open decisions, and the whole state of the context in one answer are each asked for twice, **then** the
   current design shows only the latest version and the unchanged concept, the history shows both versions with
   their reasons, the open decisions show only the open one, the one answer holds the current design, the
   accepted decisions and the open ones together, the two answers to each question are identical, and asking
   appended nothing.
7. (concept journal) **Given** concept records left by an earlier record store, on any branch of the
   repository, **when** the current design is asked for, **then** none of them appears: the design is exactly
   what was recorded in this journal.
8. (concept journal) **Given** the design files and decision records of this repository, each concept naming
   the decision it was decided in, **when** they seed the journal, **then** each context, concept and decision
   is recorded once, as currently accepted, each concept with its decision as its reason; the current design
   matches the files concept for concept; seeding a journal that already holds entries is refused, leaving it
   unchanged; and once seeded, the design files and
   decision records are removed from the repository, so the journal is the only account of the design.
9. (concept journal, supersession) **Given** entries appended to the journal on two branches of the
   repository, including one concept superseded differently on each, **when** the branches are merged, **then**
   the merge keeps every entry of both without a conflict to resolve by hand, and that concept's current design
   is reported as two competing versions, each with its reason, until one supersedes both; neither is silently
   chosen.

## Behavioral

10. (reconstitution) **Given** a compacted session, launched as the architect, whose summary says
    reservations expire after ten minutes and a deposit decision is open, and a journal that now says fifteen
    minutes, records the deposit decision's acceptance, and holds another decision still open, **when** the
    session is asked to continue the work, **then** it queries the journal and, before doing anything else,
    reads back fifteen minutes, the accepted deposit decision and the still-open decision, naming the summary
    as out of date; it never acts before reading back, and never treats the still-open decision as settled.
