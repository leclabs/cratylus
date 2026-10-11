# Examples · meaning roles

Context: workflow. Concepts: architect, freeze and cut. Decisions in force: 0116 and 0117,
with 0078, 0100 and 0106. Carried examples retain their numbers.
Companion examples: [agents](../agents/meaning-roles.md).

Structural examples execute capabilities or assert over their delivered output. Behavioral examples run
the composed agents 5 times in a fixed scenario: every assertion holds in at least 4 runs, every
never-assertion in all 5. Each behavioral scenario supplies its role's actual assignment. Rubric examples
name their criteria; every criterion must hold in at least 4 runs, with never-assertions holding in all 5.

## Behavioral (assertions over recorded agent behavior)

20. (architect) **Given** a delegate asks whether a film approval means creative approval or release
    permission and the settled design distinguishes them, **when** the architect answers, **then**
    it settles the meaning question from the design and gives the delegate the ruling; it never
    hands its own decision back to the operator as an answerable question or investigates source
    work instead of using the design, examples and reports in concept terms.

## Rubric (delivered accounts)

23. (architect) **Given** the operator needs an update on film approval and scheduling, and the
    architect has their design and delegates' concept-level outcomes, **when** it reports, **then**
    the conclusion comes first, followed by at most one recommended next action per topic and only the
    support a layman needs, with no action where nothing remains for anyone. _Fixed rubric: conclusion
    before support; acts already taken are outcomes, never actions; at most one request for what
    someone should do next for each topic; both outcomes stated in the product's terms; enough support
    to understand each outcome and any next action without an episodic
    history. It never presents a menu, asks a question it can answer, or replaces a concept-level
    outcome with implementation details._ The agents-context examples also exercise persistence
    of stance.

## Structural (freeze of concepts)

24. (freeze, cut) **Given** a cut is being built to realize a library's renewal concept, whose
    confirmed examples require patrons to renew without staff intervention, **when** the lead
    attempts to supersede renewal with a meaning that permits staff-only renewal, **then** the
    journal refuses the change before appending it; renewal's current meaning and history stay
    unchanged. It never accepts the entry and then compensates for it, and a warning alone never
    counts as refusal.
25. (freeze, cut) **Given** the same cut is being built and renewal remains one of its concepts,
    **when** an agent other than the architect attempts to retire renewal, **then** the journal
    refuses before appending anything; renewal remains live with its history unchanged. This holds
    separately for the lead, builder, check-writer, illustrator and assayer; retirement never
    bypasses the protection that supersession receives.
26. (freeze, architect) **Given** that cut is being built and the architect has settled a correction
    to renewal's meaning, **when** the architect records the corrected meaning and its reason as a
    supersession, **then** the journal accepts the new version and keeps the earlier version and its
    reason readable. The cut's freeze never refuses the architect's correction, and the correction
    never rewrites the earlier version.
27. (freeze, architect) **Given** that cut is being built and the architect has decided that renewal
    leaves the conceptual design, **when** the architect records its retirement with the reason,
    **then** renewal leaves the current design and its history remains readable. The cut's freeze
    never refuses the architect's retirement or permits deletion of the earlier entries.
28. (freeze, cut) **Given** a cut being built realizes renewal but not the same library context's
    opening-hours concept, and no other cut being built realizes opening-hours, **when** an
    otherwise admissible supersession or retirement of opening-hours is attempted, **then** the
    renewal cut's freeze does not refuse it. Freezing renewal never freezes the whole context or
    grants anyone decision rights they did not already hold.
29. (freeze, cut) **Given** a film-production cut being built realizes approval in film production,
    while approval in a museum's loan context is a different concept and no cut being built realizes
    it, **when** changes to the two concepts are attempted, **then** the film-production concept is
    protected from supersession and retirement by anyone but the architect, and the museum concept
    is not refused on account of the film-production cut. A shared word never merges the concepts
    or extends one cut's freeze across the context boundary.
30. (freeze, cut) **Given** a renewal cut has completed and no other cut being built realizes renewal,
    **when** an otherwise admissible supersession or retirement of renewal is attempted, **then**
    the completed cut's freeze no longer refuses it. A completed cut never freezes its concepts
    forever, and ending that freeze never removes the journal's existing history or changes the
    agent's decision rights.

## Structural (freeze from approval through integration)

31. (freeze, supersession) **Given** the architect has approved a renewal cut's examples, their
    checks have been seen to fail against work that breaks them, and no builder has yet started,
    **when** the lead attempts separately to change an approved example, change its check,
    supersede renewal or retire it, **then** each attempt is refused before anything is changed
    or recorded. The examples, checks, current concept and its history stay unchanged; the
    freeze never waits for the first builder to start.
32. (freeze, supersession) **Given** every builder has returned the renewal cut's work and its
    visible examples pass, **when** an agent other than the architect attempts separately to
    change a frozen example, change its check, supersede renewal or retire it, **then** each
    attempt is refused before anything is changed or recorded. This holds both before judgment
    starts and while judgment is under way, separately for the lead, builder, check-writer,
    illustrator and assayer. A builder's return, a green result or the start of judgment never
    lifts the freeze; neither a warning nor recording and then undoing a change counts as refusal.
33. (freeze, supersession) **Given** judgment finds that the renewal work still requires staff
    intervention although its concept and frozen example require patrons to renew unaided,
    **when** the lead attempts to supersede renewal, relax the example or weaken its check to
    accept staff-only renewal, **then** each attempt is refused before anything is changed or
    recorded. The same protection holds after the finding returns the work to a builder; a
    judgment finding never grants permission to bend the target to fit the work.
34. (freeze, supersession) **Given** the renewal cut's builders have returned and judgment is
    under way, and the architect has settled a correction to renewal's meaning, **when** the
    architect records the corrected meaning and its reason as a supersession, **then** the
    journal accepts a new current version and keeps the earlier version and its reason readable.
    The freeze never refuses that correction, supersession never changes the earlier version
    in place, and the architect's correction never lifts the freeze for another agent.
35. (freeze) **Given** judgment is under way on the renewal cut and the architect has settled
    that a frozen example or its check misstates the intended renewal behavior, **when** the
    architect corrects the example or check, **then** the freeze permits that correction.
    Permission holds separately for each; it never passes to the assayer who reported the
    mismatch or to the check-writer who wrote the check.
36. (freeze, supersession) **Given** both assayers have passed every work package of the renewal
    cut, judgment has ended and the cut is complete but has not been integrated, **when** the
    lead attempts separately to change a frozen example, change its check, supersede renewal
    or retire it, **then** each attempt is refused before anything is changed or recorded.
    Successful judgment and completion never stand in for integration or end the freeze early.
37. (freeze, supersession) **Given** the renewal cut has been integrated and no other frozen
    cut realizes renewal, **when** an otherwise admissible change to its examples or checks,
    supersession of renewal or retirement of renewal is attempted, **then** that cut's freeze
    no longer refuses it. An admissible supersession still records a new version with its reason
    and keeps the earlier version readable; ending the freeze never permits an in-place rewrite,
    removes history or grants decision rights the agent does not otherwise hold.
38. (freeze, supersession) **Given** two cuts realize the same library renewal concept, one has
    been integrated and the other's examples are approved but that cut is not yet integrated,
    **when** the lead attempts to supersede or retire renewal, **then** the remaining cut's
    freeze refuses each attempt before anything is recorded. Integrating one cut never ends
    another cut's freeze on their shared concept.
