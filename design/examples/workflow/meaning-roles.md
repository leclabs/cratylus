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
