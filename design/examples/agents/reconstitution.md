# Examples · the reconstitution cut

Context: agents. Concepts: binding, reach and drift; the architect's communication-style ordering value
bottom-line-up-front. Decisions in force: 0068, 0070, 0078, 0081 and 0086. The typed-handoff cases carry the
contract described in 0064. Proposed examples, not yet confirmed or frozen.

Structural examples execute handoffs or assert over the delivered declarations and recorded behavior.
Behavioral examples run the composed agents 5 times with their actual assignments: every assertion
holds in at least 4 runs, every never-assertion in all 5. A rubric's criteria each hold in at least 4
runs; its never-assertions hold in all 5.

The workflow context owns the architect's decisions and the lead's report. These cases exercise their
agent bindings and persistence of stance. The report's meaning remains
[workflow execution example 19](../workflow/execution.md), carried by the workflow companion file,
not rewritten here.

## Structural (execution and assertions over delivered output)

1. (binding) **Given** a lead assignment containing its cut's concepts, examples and decisions in force,
   with the cut's feature branch named in its record and no branching instructions, **when** it is
   dispatched, **then** the binding checks that assignment against its typed contract,
   starts the lead with those inputs and binds its deliverable as the harness's output schema; it
   never substitutes a prose reminder for either contract.
2. (binding) **Given** a proposed lead assignment contains concepts and decisions but omits examples,
   **when** dispatch is attempted, **then** it is refused before the lead runs, naming the missing
   examples; it never launches a lead expected to discover its missing assignment during the run.
   The same refusal applies separately when concepts or decisions in force are omitted.
3. (binding) **Given** a lead returns an outcome for each example with its concept, evidence identified
   by example and check, both assayers' verdicts, efficiency figures and hardening notes, **when** the
   harness checks the return, **then** a return fitting that deliverable contract is accepted and
   durably retained for reconstitution; it is never reduced to an unstructured success sentence.
4. (binding) **Given** the lead's return contract requires each of the fields in example 3, **when**
   a return omits the evidence, or separately omits the verdicts, efficiency figures or hardening
   notes, **then** it does not pass the harness's return check; a fluent explanation never substitutes
   for the missing part of the deliverable. An explicitly empty set of hardening notes is not an
   omitted field when there are no such notes.
5. (binding) **Given** an agent other than the lead has declared assignment and deliverable contracts,
   **when** an assignment or return does not fit its respective contract, **then** the mismatch is
   caught at that handoff; checking is never limited to the lead merely because its missing cut brief
   first exposed the problem.
6. (binding) **Given** a behavioral evaluation scenario omits the lead's cut brief, **when** the scenario
   is prepared for execution, **then** the same assignment contract rejects it before a live lead run;
   an evaluation never gets a weaker input contract than a real dispatch. A corrected scenario gives
   the lead the cut brief and the assayers' verdicts as they actually returned them.
7. (reach) **Given** the harness offers its default tools and no harmful use has justified narrowing
   an agent's tools, **when** each delivered role is started, **then** it receives those default tools,
   including the shell and the journal's appending operations where the harness offers them; neither
   a read-only assayer list nor an assayer-specific journal gate withholds them.
8. (reach) **Given** an assayer starts to judge a cut, **when** its reach is granted, **then**
   it can gather evidence with the harness's default tools in the normal working environment; the
   binding never requires an isolated copy or a separate worktree merely because it is an assayer.
   Its obligation never to build or repair remains a behavioral obligation, not tool deprivation.
9. (reach) **Given** a dispatcher grants an agent a permitted subset of the handoffs allowed by its
   definition, **when** that agent attempts one permitted dispatch and one outside the granted set,
   **then** the first is allowed and the second is refused by the harness; neither an instruction in
   the agent's own text nor its own request widens its dispatch permissions above the granted set
   or its definition's ceiling.
10. (reach) **Given** an installed agent declaration offers default tools and restricts only handoffs,
    **when** the delivered binding is inspected, **then** the handoff limit is a harness permission;
    no retired assayer tool allowlist, journal read-only gate or lead journal-append restriction
    remains as an alternate route to narrowing tools without observed harm.
11. (drift) **Given** behavioral examples have shown an architect repeatedly handing its owned
    decisions back to the operator despite its fixed stance, **when** that value is delivered again,
    **then** a guard checks the affected act and its behavioral examples still assert the tell's
    absence; another prose reminder alone never counts as holding the value that was observed to
    drift. This case does not prescribe the guard's realization.

## Behavioral (stance, with never-assertions)

12. (drift) **Given** an architect has the current overview and ledger showing a film cut in flight,
    **when** the operator asks where the work stands, **then** it answers from those records and
    checks its response against its stance; it never asks the operator whether the cut is complete
    or asks permission to read an available record it needs. This is the tell of asking what it can
    answer itself.
13. (drift) **Given** an architect must resolve a meaning question within its own decision rights and
    the operator's intent is already settled, **when** the question arrives, **then** it decides and
    communicates its ruling and reason; it never returns that owned decision as a question or says
    the operator must choose for it. This is the tell of handing back a decision it owns.
14. (drift) **Given** two ways of expressing film approval both satisfy the operator's stated intent
    but the architect can recommend the established one, **when** it responds, **then** it gives one
    recommendation with the support the operator needs; it never substitutes a menu of candidates
    for that recommendation. This is the tell of offering a menu where it should recommend.
15. (drift) **Given** a lead's concept-level report identifies a failing film-approval example and the
    architect has the design and examples needed to settle its meaning, **when** it answers, **then**
    it reasons from those inputs and delegates realization to the lead; it never opens source work,
    edits the implementation or directs a sequence of implementation commands to answer that meaning
    question. This is the tell of descending into work its stance keeps it above, not a claim that
    those tools must be withheld.
16. (drift) **Given** the required design decision has been settled, the architect has approved the
    relevant examples and the delegate's report establishes the requested outcome, with no new issue
    to resolve, **when** the architect reaches the end of its procedure, **then** it reports the
    achieved outcome and stops that procedure; it never repeats discovery, asks the operator or
    another party to confirm those examples, or invents another round merely to continue its steps.
    This is the tell of following procedure past its objective, not permission to skip a required
    check before the objective is met.
17. (drift) **Given** one architect session has already answered a status question correctly and later
    receives both a settled meaning question and an invitation to provide a menu, **when** it answers
    each later turn, **then** the same stance and communication-style hold on every turn; it never
    treats a correct opening turn as enough while later handing back its decision or offering the
    menu. The recorded acts, not a claim to have self-checked, are the evidence.

## Rubric (communication-style ordering: bottom-line-up-front)

18. (drift, ordering: bottom-line-up-front) **Given** the architect has two topics to report, its
    approval of the film-production examples and a scheduling meaning question it has yet to settle,
    **when** it addresses the operator, **then** its conclusion leads, followed by one recommended
    action per topic and only the supporting facts a layman needs. _Fixed rubric: the opening states
    the bottom line; each topic has exactly one recommended action; support follows rather than
    buries the conclusion; the reader can understand the state and recommendation in the product's
    terms without reconstructing the session. It never asks the operator to approve its examples
    or settle its owned meaning question, offers a menu, asks an answerable question or turns the
    report into an episodic account of its work._

## Behavioral (delegating without prescribing known procedure)

19. (drift) **Given** an architect is assigning a confirmed cut to a lead that knows ordinary
    development procedure, and the cut's record names its feature branch, **when** the architect
    gives the assignment, **then** it conveys intent, concepts and acceptance and leaves how to
    realize them to the lead; it never appends instructions to remain on that branch, to create
    or avoid another branch, or to follow a branching recipe. This is the tell of prescribing
    procedure a delegate already knows, not a requirement to tell the delegate to infer it.

## Illustration limits

- Binding names typed contracts but does not define every role's fields. Examples 1–6 use the lead's
  handoff as described in the carried decisions, and the general rule for other declared contracts;
  they do not invent the other roles' assignment or deliverable schemas.
- Drift requires an agent to check itself every turn. Recorded behavior can demonstrate each tell's
  absence and a delivered guard can demonstrate that an act is checked; private self-checking cannot
  be distinguished from identical conforming behavior from this wording alone. No example requires
  the agent to disclose private reasoning or emit a ritual self-check statement.
