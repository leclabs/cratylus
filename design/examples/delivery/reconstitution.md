# Examples · the reconstitution cut

Context: delivery. Concepts: capability fidelity and capability interface. Decision in force: 0079,
which delivers the workflow as self-explaining capabilities, not as a skill restating it. Proposed
examples, not yet confirmed or frozen. These are the delivery side of the workflow's consumption of
its concept journal and work package capabilities.

Structural examples exercise the delivered interface or assert over what the product delivers.
Behavioral examples give the agent its actual assignment and run 5 times: every assertion holds in at
least 4 runs, every never-assertion in all 5. Each rubric criterion holds in at least 4 runs, with
never-assertions holding in all 5. No example is designated held out here.

## Structural (execution and assertions over delivered output)

1. (capability fidelity) **Given** a harness offers a native facility able to expose a capability,
   **when** the capability is delivered, **then** it uses that facility; it never chooses a lower-fidelity
   extension or prose instructions instead of the native facility that can hold it.
2. (capability fidelity) **Given** a harness has no suitable native facility but can expose the
   capability through cratylus's extension, **when** it is delivered, **then** agents receive a callable
   tool through that extension; a prose procedure never replaces the available tool.
3. (capability fidelity) **Given** a harness offers neither a suitable native facility nor an extension
   route for a capability, **when** that capability is presented, **then** prose is the last-resort
   form; it never falsely claims to offer a callable tool the harness cannot supply. The fallback
   does not authorize a second, independently maintained account of the capability's meaning.
4. (capability fidelity, capability interface) **Given** a product has only its own film-production
   concepts in its journal and has the workflow's capabilities installed, **when** a new agent session
   starts, **then** the harness publishes the concept journal's and work package capability's own
   explanations, including their purposes and when to reach for them; the agent never needs a copy
   of cratylus's own design journal or a workflow-teaching skill to discover what those tools do.
5. (capability interface) **Given** a capability explains its concepts and verbs on request, **when**
   its explanation and the harness's published tool description are compared, **then** the harness's
   form carries the same purposes, meanings and guidance about when to use it; the adapter never
   supplies an independent definition, an extra workflow rule or a conflicting meaning.
6. (capability interface) **Given** a capability's own explanation is changed to reflect an accepted
   concept change, **when** it is delivered again, **then** the harness receives that explanation in
   its own form without a second account being rewritten by hand; no stale adapter-authored
   description survives as another authority for the capability's meaning.
7. (capability fidelity, capability interface) **Given** the product delivers the concept journal and
   work package capability, **when** its delivered skills and agent-facing capability explanations
   are inspected, **then** the capabilities explain themselves, including when to reach for them;
   no workflow overview skill, procedure skill or reach-for-this-tool skill restates those
   capabilities. This removes the duplication proposed before 0079, not unrelated agent procedures.
8. (capability interface) **Given** a product agent needs its film-production context's current design
   and the cuts in flight, **when** it asks the concept journal for the context overview using the
   offered interface, **then** it receives that context's computed account and recorded state; the
   interface never substitutes cratylus's own contexts for the product's or requires a separately
   authored overview to teach the workflow.

## Behavioral (recorded agent behavior)

9. (capability fidelity, capability interface) **Given** a new film-production agent knows its own
   context, receives a request to recover the current design, and sees only the harness's published
   capability explanations rather than a workflow skill, **when** it chooses how to recover that
   design, **then** it identifies and calls the concept journal for the overview and needed detail;
   it never has to reconstruct the capability's behavior from procedural prose or pretend that
   following a prose checklist is the same as querying the journal.
10. (capability interface) **Given** a lead knows its cut's concepts and examples, has a valid cut
    brief, and the harness publishes the work package capability's own explanation, **when** it needs
    to see which work packages can be dispatched next, **then** it can identify that capability and
    the relevant operation from their purpose and context words; it never needs a separate skill
    that redefines work packages or teaches a competing way to compute their order.

## Rubric (self-explanation in the consuming context)

11. (capability interface) **Given** a reader knows the product's context but not how the workflow is
    realized, **when** the reader sees the delivered concept journal and work package interfaces,
    **then** each interface explains the concepts it serves. _Fixed rubric: names and verbs use those
    concepts' own words; each operation says what purpose it serves; each says when to reach for it;
    the reader can distinguish reading the design from finding ready work packages without consulting
    another account. The interface never substitutes implementation terminology for concept meaning
    or assumes the reader has cratylus's internal journal. This is contextual comprehension, not a
    cold-decode test of isolated names._
12. (capability fidelity, capability interface) **Given** the product's agent is given its context
    overview through the capability and no workflow-restating skill, **when** its understanding of
    that account is judged, **then** the account is sufficient to orient it to that context and the
    purpose of the available workflow capabilities. _Fixed rubric: it can state the context's whole
    before its parts, distinguish an open decision from a settled concept, and identify where to ask
    for the recorded work in flight. It never has to treat a skill's second description as more
    authoritative than the capability or invent missing workflow state._
