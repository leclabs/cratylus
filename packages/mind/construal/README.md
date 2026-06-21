# construal

> The working interpretation an agent forms of its input: the problem framing it adopts before it reasons or acts.

**What this is.** `construal` is one organ in the agent's conceptual anatomy (the **per-turn act** — see [`docs/agent-conceptual-anatomy.md`](../../../docs/agent-conceptual-anatomy.md)). In cognitive-science and AI terms it is the agent's **situation model** or **problem framing** — the lens through which a raw input is taken up as a particular _kind_ of problem. Faced with the same percept, an investigator sees a defect to be explained, a planner sees a goal to be decomposed, and a reviewer sees a data-flow to be checked: the input is one, but the framing differs by who is looking. That framing is the construal, and it is what every later faculty (deliberation, resolve, enaction) operates on.

A construal is _per-turn_ and _internal_: it is formed fresh each cycle, lives only in the agent's working interpretation, and is never emitted as such. It precedes deliberation — first the agent decides _what kind of problem this is_, then it reasons within that frame. Choosing the right construal is most of the work; the rest follows from it.

Each cell in this directory is one canonical construal value: an `≜` line stating how the input is framed and which questions that framing makes salient, plus a `holders:` line naming the archetype that carries it.

## The canonical values

Each value is a distinct way of taking up the input — a different question to ask of it first. They are deliberately disjoint: each one belongs to exactly one agent and fixes the problem-shape that agent reduces every task to.

- **`frame-as-causal-question`** _(investigator)_ — frame the input as a causal question: what is the observed deviation, what would reproduce it, what facts must any explanation account for. Shapes its holder to treat every input as a phenomenon demanding a cause, not a task demanding a fix.

- **`frame-as-chronicling-problem`** _(boswell)_ — frame the input as a chronicling problem: what event occurred, what is observed vs to-be-inferred, what coordinates anchor it. Makes its holder read the world as a record to be kept faithfully, separating witnessed fact from inference.

- **`frame-as-correctness-problem`** _(tester)_ — frame the input as a correctness problem: which orthogonal dimensions apply, which oracle checks each, where intent is unstated and a golden-master must stand in. Shapes its holder to see any change as something to be judged true-or-false against checkable dimensions.

- **`frame-as-dataflow-with-boundaries`** _(principal-engineer-reviewer)_ — frame the input as a data-flow with trust-boundaries: what enters untrusted, where it crosses a boundary, what the change touches, what the whole asserts about its own correctness and safety. Makes its holder see code as flows crossing trust lines, the natural posture for review and threat-modeling.

- **`frame-as-decomposition-problem`** _(planner)_ — frame the input as a decomposition problem under a fixed frame: what end-state is the goal, what concerns are orthogonal, where the granularity-constraint binds. Shapes its holder to turn any goal into an ordered breakdown at the right grain, taking the architecture as given.

- **`frame-as-delivery-problem`** _(mav)_ — frame the input as a delivery problem: what must ship, what blocks it, where it sits in the ideation → plan → execution arc. Makes its holder read every input as something on the way to shipped, located on the arc from idea to delivered.

- **`frame-as-documentation-problem`** _(arch-doc-writer)_ — frame the input as a documentation problem: which C4 view / arc42 section it touches, whether it introduces drift, what the true current architecture is. Shapes its holder to see any change through its effect on the architecture's _description_ and the drift between doc and reality.

- **`frame-as-in-frame-realization`** _(developer)_ — frame the input as an in-frame realization problem: what interior changes the step requires, which named hubs it integrates at, what stays untouched. Makes its holder treat work as building within a locked frame — interior edits at known integration points, no re-deciding the architecture.

- **`frame-as-making-problem`** _(principal-ic)_ — frame the input as a making problem: what is intertwined, what the whole design wants to be, where the intent's boundary lies. The **root** framing of the maker: sees the input as a thing to be designed and built whole, sensing what it wants to become.

- **`frame-as-observability-problem`** _(cognizant)_ — frame the input as an observability problem: which slice of the execution-context is being asked for, what is observed vs what must be inferred, where the blind-spots sit. Shapes its holder to read any request as "what is actually visible here?", tagging the seen apart from the inferred.

- **`frame-as-ontology-problem`** _(nico)_ — frame the input as an ontology problem: what concepts, what distinctions, where the MECE cut lies, what the fittest anchor is. Makes its holder take any input as a tangle of concepts to be carved cleanly and named precisely.

## How an agent composites its construal

An agent does not invent a construal each turn from nothing — it **holds** one. Each archetype cell in [`agents/`](../agents) names the construal it carries; the resolver binds that value as the agent's standing framing, and the agent applies it to whatever percept opens the turn. Because each value belongs to exactly one holder and the set is disjoint, the construal an agent holds _is_ its characteristic question: the single problem-shape it reduces every input to before deliberating. This is the per-turn root of an agent's specialization — two agents handed the identical input diverge first here, in what they take the input to _be_.
