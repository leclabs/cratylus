# framing

> The working interpretation an agent forms of its input: the problem framing it adopts before it reasons or acts.

**What this is.** `framing` is one organ in the agent's conceptual anatomy (the **per-turn act** — see [`docs/agent-conceptual-anatomy.md`](../../../docs/agent-conceptual-anatomy.md)). In cognitive-science and AI terms it is the agent's **situation model** or **problem framing** — the lens through which a raw input is taken up as a particular _kind_ of problem. Faced with the same trigger, one agent sees a defect to be explained, another sees a goal to be decomposed, another sees a data-flow to be checked: the input is one, but the framing differs by who is looking. That framing is the framing, and it is what every later faculty (reasoning-strategy, satisficing, output-format) operates on.

A framing is _per-turn_ and _internal_: it is formed fresh each cycle, lives only in the agent's working interpretation, and is never emitted as such. It precedes reasoning-strategy — first the agent decides _what kind of problem this is_, then it reasons within that frame. Choosing the right framing is most of the work; the rest follows from it.

Each cell in this directory is one canonical framing value: an `≜` line stating how the input is framed and which questions that framing makes salient. The set is a generalized, opinionated palette of framing lenses — reusable across agents rather than bespoke to any one.

## The canonical values

Each value is a distinct way of taking up the input — a different question to ask of it first.

- **`analytical`** — frames work as a problem to decompose into parts, dependencies, and structure; abstracts to underlying mechanism before acting; the default reasoning-first lens.

- **`correctness-oriented`** — frames work against a specification of intended behavior: what must hold, where it could be violated, how to test it; the lens of oracles, invariants, and edge cases.

- **`decompositional`** — frames work as a structure to break into parts: identify components, dependencies, and seams, then sequence subproblems; the default lens for planning, scoping, and tractability.

- **`diagnostic`** — frames work as a symptom whose root cause must be isolated; reasons backward from observed behavior to fault via hypotheses and evidence narrowing.

- **`exploratory`** — frames work as an open question with unknown shape; foregrounds discovery, option generation, and reducing uncertainty before committing to a framing.

- **`first-principles`** — frames work by stripping to fundamentals: questions inherited assumptions and reasons up from primitives and constraints rather than from convention, precedent, or analogy.

- **`goal-directed`** — frames work as a concrete objective to achieve; foregrounds the desired end-state and shortest viable path, treating analysis as instrumental to delivery.

- **`risk-oriented`** — frames work through what can fail, break, or be exploited; foregrounds failure modes, edge cases, blast radius, and worst-case before benefits.

- **`systems`** — frames work as nodes in a larger whole; foregrounds interactions, feedback loops, second-order effects, and emergent behavior over local parts.

- **`user-centered`** — frames work from the affected human's goals, mental model, and experience; abstracts requirements from need rather than implementation.

## How an agent binds its framing

An agent does not invent a framing each turn from nothing — it **binds** one. An agent binds a value by citing `framing [[value]]` in its `agent/<name>.md` selection vector — the vector is the single source of truth. The resolver binds the cited value as the agent's standing framing, and the agent applies it to whatever trigger opens the turn. The framing an agent binds _is_ its characteristic question: the problem-shape it reduces every input to before deliberating. This is the per-turn root of an agent's specialization — two agents handed the identical input diverge first here, in what they take the input to _be_.
