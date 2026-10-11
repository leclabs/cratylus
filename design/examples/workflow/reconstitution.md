# Examples · the reconstitution cut

Context: workflow. Concepts: context overview, ledger, completion check, reconstitution, concept journal,
cut, architect, lead and roles. Decisions in force: 0081 and 0086, including the architect restored by
0070 and the typed handoffs carried from 0064. Proposed examples, not yet confirmed or frozen.
Companion examples in the agents and delivery contexts cover the contracts this context consumes.
Examples 20 and 23 belong to [cut 7](cut-7.md) under decisions 0104, 0106 and 0107; the remaining
examples retain their numbers.

Structural examples execute capabilities or assert over their delivered output. Behavioral examples run
the composed agents 5 times in a fixed scenario: every assertion holds in at least 4 runs, every
never-assertion in all 5. Each behavioral scenario supplies its role's actual assignment. Rubric examples
name their criteria; every criterion must hold in at least 4 runs, with never-assertions holding in all 5.

## Carried example

1. (lead) [Execution example 19](execution.md), the lead's report to the architect in concept terms,
   carries into this cut unchanged, first as required by 0081. Its scenario supplies the cut brief and
   the assayers' verdicts as returned, as settled in 0062; its existing rubric remains the criterion.

## Structural (execution and assertions over delivered output)

2. (context overview) **Given** a film-production context whose subject and relation to a scheduling
   context are recorded, and whose concepts are production, built from shoot, and shoot, built from
   take, **when** its overview is requested, **then** the subject and context-map relation come first,
   followed by plain prose about production, shoot and take in that order, then its open decisions and
   cuts in flight; the parts never precede the whole they explain.
3. (context overview, concept journal) **Given** the journal supersedes take with a new meaning and
   reason, settles an open decision, and the ledger records a newly dispatched cut, **when** the next
   overview is requested, **then** it reflects those changes without anyone rewriting an overview;
   it never repeats the superseded meaning as current or the settled decision as open, and never
   substitutes a separately maintained account for the journal and ledger.
4. (ledger) **Given** a cut has two work packages, shoot and edit, and edit depends on shoot, **when**
   the harness reports shoot's builder dispatched and later returned, without any agent making a
   recording call, **then** the ledger records dispatched and returned from those events, reports
   the cut in flight from the first dispatch, and never calls the returned work package approved
   merely because its builder says it is finished.
5. (ledger) **Given** both work packages have returned and both of the cut's independent assayers
   return verdicts passing each work package, **when** the harness delivers those verdicts, **then**
   their approvals appear in the ledger and the cut is complete once both work packages are approved;
   no agent has to remember to record those approvals, and a view with only one work package approved
   never reports the cut complete.
6. (ledger) **Given** a transition has been recorded with its own id, **when** the same transition is
   delivered again, **then** the repeat is refused, the original event remains, and no duplicate event
   or additional state change is recorded.
7. (ledger) **Given** shoot is ready, edit depends on shoot, and neither has been dispatched, **when**
   state is requested, and later requested after shoot has finished, **then** each answer computes
   the cut's phase, both work-package statuses and the next dispatchable work packages from the
   events and dependencies; edit is never offered while its dependency is unfinished, and a stale
   earlier answer never replaces the current computed state.
8. (ledger, cut, concept journal) **Given** a cut's feature branch holds its dispatch events, concept
   changes and acceptance while the integration branch does not yet hold the cut, **when** each
   branch's ledger and journal are read, **then** the feature branch shows those entries and the
   integration branch does not; a shared host or checkout never makes one branch claim the other's
   state. After the cut is merged, its entries land with its work.
9. (ledger) **Given** a builder has made no return recorded by the harness but says in a message
   that its work package returned, **when** the ledger is queried, **then** that statement alone
   never creates a return event; lifecycle state comes from the harness's agent events, not an
   agent's retrospective account.
10. (completion check) **Given** the ledger shows cut film complete, **when** a commit is made with
    the message `feat(cut:film): complete the film cut`, **then** the completion check is silent and
    the commit is never refused.
11. (completion check) **Given** cut film is in flight, shoot is approved and edit has returned but
    is not approved, **when** a commit is made with the message `feat(cut:film): complete the film cut`,
    **then** the commit succeeds and its output warns its author, naming film, the phase the ledger
    shows and edit as not approved, and instructing the author to report the gap as a defect in how
    the ledger captures the harness's events; it never lists shoot as unapproved, refuses the commit,
    or silently changes the ledger to match the declaration.
12. (completion check) **Given** an unfinished cut, **when** ordinary commits are made with messages
    `docs(design): explain completion`, `fix: finish the cut`, or `feat(film): complete the film cut`,
    **then** the completion check is silent, never refuses them and never records them as ledger
    events. A completion claim outside the one enumerated form does not enlarge the watched list.
13. (completion check) **Given** the watched list has only the form fixed by 0081 and a message in
    that form has an ordinary descriptive subject, **when** `feat(cut:film): deliver film review`
    is committed while film is incomplete, **then** the check still compares film with the ledger
    and warns; it never requires an additional completion keyword that the decision did not name.
14. (concept journal) **Given** a concept version and a context description each have a recorded
    reason, **when** their replacements are appended through the journal's named operations, **then**
    current views use the replacements and histories retain the earlier versions and both reasons;
    an attempted in-place edit or deletion never becomes a valid amendment of the journal.
15. (concept journal) **Given** two concept versions each supersede the same earlier version, **when**
    the design is queried, **then** they are reported as competing, never silently reduced to whichever
    was read last; after a later version supersedes both, that version is current and their histories
    remain. The same rule holds for competing descriptions of a context.
16. (cut, concept journal) **Given** a cut is built on its own feature branch in an ordinary checkout,
    **when** its concepts, decisions and acceptances are recorded and its integration proceeds,
    **then** those entries are made on that branch and arrive with its merge; neither working on the
    cut nor integrating it requires creating or removing a worktree.
17. (lead, reconstitution) **Given** a completed lead handoff contains each example's concept,
    outcome and evidence named by example and check, the assayers' verdicts, efficiency figures and
    hardening notes, **when** a new session reconstitutes without the old conversation, **then** those
    results are durably readable with the cut; it never loses a hardening note or substitutes an
    unrecorded recollection for the reported outcomes or figures. This checks continuity of the
    handoff, not a second rendition of execution example 19's report rubric.

## Behavioral (assertions over recorded agent behavior)

<!-- prettier-ignore-start -->

18. (reconstitution, architect) **Given** a new architect session touches film production and scheduling
    and has no prior conversation, **when** it resumes work, **then** it first queries each context's
    overview, then the detail needed from the journal and ledger, and before acting reads back to the
    operator the current design, open decisions and cuts in flight; it never starts delivery work
    before that readback or asks the operator to reconstruct information those records provide.
19. (architect) **Given** the operator has stated the intent for a film approval process, the architect
    holds film production and scheduling whose meanings of approval differ, and the illustrator has
    returned examples accurately expressing both, **when** the architect decides on those examples,
    **then** it approves each context's examples itself and keeps their models separate; it never
    seeks the operator's or another party's confirmation of an example in a context it holds, or
    merges the two meanings merely because the same word is used.
21. (completion check, reconstitution) **Given** a completion warning names an unapproved work package
    after the agent has observed the corresponding approving verdicts return, **when** the agent
    responds, **then** it reports the capture gap as a defect, retaining the distinction between the
    observed verdicts and the ledger's computed state; it never treats manual lifecycle bookkeeping
    or routine suppression of the warning as the normal completion path.

<!-- prettier-ignore-end -->

## Rubric (delivered accounts)

22. (context overview) **Given** the small film-production context of example 2, **when** its overview
    is read by a reader of that context, **then** it is a whole account rather than a catalog dump.
    _Fixed rubric: it identifies the subject and relation; explains production before its parts;
    preserves every supplied concept's meaning; separates open decisions from current meaning; and
    identifies the cuts in flight. It never invents a concept, decision or cut to fill a gap._

## Structural (the settled overview, judgment and context boundaries)

24. (context overview) **Given** publication and production are recorded in that order, neither is
    built into another concept, and each is built from review, **when** the context overview is
    requested, **then** it presents publication and production first in their recorded order, then
    review; it never sorts the roots by name, puts review before them, or repeats review for each
    root that uses it.
25. (ledger) **Given** a returned work package has one passing assayer verdict and the second assayer
    has not returned, **when** the ledger is queried, **then** the work package remains unapproved
    and the cut incomplete; a single passing verdict never becomes approval for both assayers.
26. (ledger) **Given** both assayers find that edit fails its example while shoot passes, **when**
    their verdicts return through the harness, **then** edit returns to build as a failing case
    and shoot is approved; edit is never approved merely because both verdicts have returned, and
    the cut never becomes complete while edit remains unapproved.
27. (cut) **Given** one reviewable change serves workflow, agents and delivery, all held by the same
    architect, **when** the cut and its examples are recorded, **then** it is one cut with examples
    approved by that architect and kept and judged in each concept's own context; it never becomes
    three cuts merely because three contexts are touched, and a shared cut never merges their
    models or example sets or requires a separate party to approve their examples.
28. (cut) **Given** one intent spans film production and scheduling held by different architects,
    **when** its cuts are defined, **then** there is one cut per context joined by contracts, with
    each architect approving its own context's examples, never one cut justified solely by
    convenience or a separate confirmer replacing either architect. The shared-cut exception also
    never combines contexts when the whole would exceed one reviewable change.
29. (cut, lead) **Given** the architect has named a cut's feature branch and the cut is ready to
    dispatch, **when** the lead's assignment is delivered, **then** the cut's record carries that
    branch name and the named branch has been checked out before dispatch; the assignment never
    adds directions to stay on the branch, create or avoid another branch, make or avoid a worktree,
    or follow a branching procedure. The branch name is information, not a branching instruction.
30. (roles) **Given** a role has not used some of the harness's default tools and no harm from those
    tools has been observed, **when** its reach is granted for another assignment, **then** it keeps
    the default tools and only its handoffs are held by the harness's permissions; non-use alone
    never justifies narrowing, and a role's decision rights are never inferred from tool access.

## Behavioral (dispatching the cut)

31. (architect, cut) **Given** the architect has a confirmed cut ready to dispatch and has named its
    feature branch with it, **when** it dispatches the lead, **then** it first checks out that branch
    and gives the lead the cut with its branch name, concepts and acceptance; it never delegates
    choosing the cut's branch to the lead or supplements the name with branching instructions.
