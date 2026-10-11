# Examples · the reconstitution cut

Context: workflow. Concepts: context overview, ledger, completion check, reconstitution, concept journal,
cut, architect and lead. Decision in force: 0079, including the architect restored by 0070 and the typed
handoffs carried from 0064. Proposed examples, not yet confirmed or frozen. Companion examples in the
agents and delivery contexts cover the contracts this context consumes.

Structural examples execute capabilities or assert over their delivered output. Behavioral examples run
the composed agents 5 times in a fixed scenario: every assertion holds in at least 4 runs, every
never-assertion in all 5. Each behavioral scenario supplies its role's actual assignment. Rubric examples
name their criteria; every criterion must hold in at least 4 runs, with never-assertions holding in all 5.
No example is designated held out here.

## Carried example

1. (lead) [Execution example 19](execution.md), the lead's report to the architect in concept terms,
   carries into this cut unchanged, first as required by 0079. Its scenario supplies the cut brief and
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
5. (ledger) **Given** both work packages have returned and the cut's independent assayers return
   approving verdicts for both, **when** the harness delivers those verdicts, **then** their approvals
   appear in the ledger and the cut is complete once both are approved; no agent has to remember to
   record those approvals, and a view with only one approved never reports the cut complete.
6. (ledger) **Given** a transition has been recorded with its own id, **when** the same transition is
   delivered again, **then** the repeat is refused, the original event remains, and no duplicate event
   or additional state change is recorded.
7. (ledger) **Given** two distinct work-package transitions arrive together, **when** their events are
   recorded, **then** each has its own exclusively created entry and transition id, both remain in
   the append-only record, and neither overwrites the other or rewrites an earlier event.
8. (ledger) **Given** shoot is ready, edit depends on shoot, and neither has been dispatched, **when**
   state is requested, and later requested after shoot has finished, **then** each answer computes
   the cut's phase, both work-package statuses and the next dispatchable work packages from the
   events and dependencies; edit is never offered while its dependency is unfinished, and a stale
   earlier answer never replaces the current computed state.
9. (ledger, cut, concept journal) **Given** a cut's feature branch holds its dispatch events, concept
   changes and acceptance while the integration branch does not yet hold the cut, **when** each
   branch's ledger and journal are read, **then** the feature branch shows those entries and the
   integration branch does not; a shared host or checkout never makes one branch claim the other's
   state. After the cut is merged, its entries land with its work.
10. (ledger) **Given** a builder has made no return recorded by the harness but says in a message
    that its work package returned, **when** the ledger is queried, **then** that statement alone
    never creates a return event; lifecycle state comes from the harness's agent events, not an
    agent's retrospective account.
11. (completion check) **Given** the ledger shows cut film complete, **when** a commit is made with
    the message `feat(cut:film): complete the film cut`, **then** the completion check is silent and
    the commit is never refused.
12. (completion check) **Given** cut film is in flight, shoot is approved and edit has returned but
    is not approved, **when** a commit is made with the message `feat(cut:film): complete the film cut`,
    **then** the commit succeeds and its output warns its author, naming film, the phase the ledger
    shows and edit as not approved, and instructing the author to report the gap as a defect in how
    the ledger captures the harness's events; it never lists shoot as unapproved, refuses the commit,
    or silently changes the ledger to match the declaration.
13. (completion check) **Given** the ledger shows cut film complete but cut sound still in flight,
    **when** a commit declares sound complete in the watched form, **then** the warning concerns
    sound and its own phase and unapproved work packages, never film's state.
14. (completion check) **Given** an unfinished cut, **when** ordinary commits are made with messages
    `docs(design): explain completion`, `fix: finish the cut`, or `feat(film): complete the film cut`,
    **then** the completion check is silent, never refuses them and never records them as ledger
    events. A completion claim outside the one enumerated form does not enlarge the watched list.
15. (completion check) **Given** the watched list has only the form fixed by 0079 and a message in
    that form has an ordinary descriptive subject, **when** `feat(cut:film): deliver film review`
    is committed while film is incomplete, **then** the check still compares film with the ledger
    and warns; it never requires an additional completion keyword that the decision did not name.
16. (concept journal) **Given** a concept version and a context description each have a recorded
    reason, **when** their replacements are appended through the journal's named operations, **then**
    current views use the replacements and histories retain the earlier versions and both reasons;
    an attempted in-place edit or deletion never becomes a valid amendment of the journal.
17. (concept journal) **Given** two concept versions each supersede the same earlier version, **when**
    the design is queried, **then** they are reported as competing, never silently reduced to whichever
    was read last; after a later version supersedes both, that version is current and their histories
    remain. The same rule holds for competing descriptions of a context.
18. (cut, concept journal) **Given** a cut is built on its own feature branch in an ordinary checkout,
    **when** its concepts, decisions and acceptances are recorded and its integration proceeds,
    **then** those entries are made on that branch and arrive with its merge; neither working on the
    cut nor integrating it requires creating or removing a worktree.
19. (lead, reconstitution) **Given** a completed lead handoff contains each example's concept,
    outcome and evidence named by example and check, the assayers' verdicts, efficiency figures and
    hardening notes, **when** a new session reconstitutes without the old conversation, **then** those
    results are durably readable with the cut; it never loses a hardening note or substitutes an
    unrecorded recollection for the reported outcomes or figures. This checks continuity of the
    handoff, not a second rendition of execution example 19's report rubric.

## Behavioral (assertions over recorded agent behavior)

20. (reconstitution, architect) **Given** a new architect session touches film production and scheduling
    and has no prior conversation, **when** it resumes work, **then** it first queries each context's
    overview, then the detail needed from the journal and ledger, and before acting reads back to the
    operator the current design, open decisions and cuts in flight; it never starts delivery work
    before that readback or asks the operator to reconstruct information those records provide.
21. (reconstitution) **Given** a compacted session remembers that a cut was complete but its current
    branch's ledger shows it in flight and its journal has a newer decision, **when** it resumes,
    **then** it queries the overview first and reads back the recorded state and decision before
    acting; it never treats its remembered completion or an old conversation as the current account.
22. (architect) **Given** the operator asks for a film approval process and the scheduling context
    already uses approval with a different meaning, **when** the architect designs the requested
    change, **then** it states film-production concepts using established patterns, keeps scheduling's
    model separate, and seeks confirmation of examples from each affected meaning-holder; it never
    merges the two meanings merely because the same word is used.
23. (architect) **Given** a delegate asks whether a film approval means creative approval or release
    permission and the settled design distinguishes them, **when** the architect answers, **then**
    it settles the meaning question from the design and gives the delegate the ruling; it never
    hands its own decision back to the operator as an answerable question or investigates source
    work instead of using the design, examples and reports in concept terms.
24. (completion check, reconstitution) **Given** a completion warning names an unapproved work package
    after the agent has observed the corresponding approving verdicts return, **when** the agent
    responds, **then** it reports the capture gap as a defect, retaining the distinction between the
    observed verdicts and the ledger's computed state; it never treats manual lifecycle bookkeeping
    or routine suppression of the warning as the normal completion path.

## Rubric (delivered accounts)

25. (context overview) **Given** the small film-production context of example 2, **when** its overview
    is read by a reader of that context, **then** it is a whole account rather than a catalog dump.
    _Fixed rubric: it identifies the subject and relation; explains production before its parts;
    preserves every supplied concept's meaning; separates open decisions from current meaning; and
    identifies the cuts in flight. It never invents a concept, decision or cut to fill a gap._
26. (architect) **Given** the operator needs an update on film approval and scheduling, and the
    architect has their design and delegates' concept-level outcomes, **when** it reports, **then**
    the conclusion comes first, followed by one recommended action per topic and only the support a
    layman needs. _Fixed rubric: conclusion before support; one action for each topic; both outcomes
    stated in the product's terms; enough support to understand each action without an episodic
    history. It never presents a menu, asks a question it can answer, or replaces a concept-level
    outcome with implementation details._ The agents-context examples exercise each drift tell
    separately.

## Boundaries needing a meaning ruling

- The overview examples use a single-root chain. The wording does not settle how several roots are
  ordered or how a dependency cycle is rendered while preserving the whole-before-parts rule.
- Ledger approval examples supply approving verdicts. The wording says approval occurs when the
  assayers' verdicts return but does not settle failing or disagreeing verdicts, or whether one
  returned verdict is enough. No example silently chooses those rules.
- The cut concept separates changes by context; 0079 groups these three contexts as one named cut.
  These companion files state each context's examples without choosing how that grouping is recorded.
