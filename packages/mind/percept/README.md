# percept

> The concrete input as taken up this turn: the parsed observation that opens the cycle.

**What this is.** `percept` is one organ in the agent's conceptual anatomy (the **per-turn · external** input; see [`docs/agent-conceptual-anatomy.md`](../../../docs/agent-conceptual-anatomy.md)). In the industry vocabulary it is the agent's **input parse** — the single observation that arrives at the top of one act of the agent loop and gets read as "here is what I am being handed _this turn_." Where [`sensors`](../sensors) is the standing channel by which the world _can_ enter, a percept is the one thing that _did_ enter now, already construed into the shape its holder reads.

A percept is not raw bytes and not yet an interpretation — it is the **opening of the turn**: the diff, directive, report, or request, parsed into the question the agent's archetype is built to answer. Each cell here states one such opening (`≜ …`); an agent binds a percept by citing it (`percept [[opening]]`) in its `agent/<name>.md` selection vector — that vector is the source of truth for who holds it, i.e. the agents for whom that is the canonical first thing seen. The percepts are holder-specific: a reviewer opens on a change to weigh, a tester on a change to exercise, an investigator on an anomaly to explain. They mirror the [`mandate`](../mandate) set one office to one input — what an agent is _for_ determines what it _first sees_.

## The canonical percepts

Each is a value cell (`kind: percept`); the opening observation is the `≜` claim.

- **[`change-to-review`](change-to-review.md)** — a change to review: a diff, plan, architecture-sketch, or codebase-region, parsed as the turn's opening. The holder reads it as material to weigh, not to write.

- **[`change-under-test-or-suite-result`](change-under-test-or-suite-result.md)** — a change-under-test, a diff, or a suite-result, parsed as the turn's opening. The holder reads it as something to exercise and judge PASS/FAIL, whether the artifact itself or the verdict a run already produced.

- **[`defect-or-surprise`](defect-or-surprise.md)** — a defect-report, surprising observation, or tool-result, parsed as the turn's opening question **"what is actually happening?"**. The holder reads it as an anomaly to be explained, not yet a thing to be fixed.

- **[`fragment-or-directive-or-tool-result`](fragment-or-directive-or-tool-result.md)** — an artifact/codebase/corpus fragment, an operator directive, or a tool/build result, parsed as the turn's opening. The broad maker's input: any of source material, an instruction, or the outcome of a prior action.

- **[`goal-frame-or-refine`](goal-frame-or-refine.md)** — an agreed goal plus a set architectural-frame, or a directive to refine/advance the standing plan, parsed as the turn's opening. The holder reads it as the raw material of a route to be laid out, with the frame already fixed by someone else.

- **[`introspection-request`](introspection-request.md)** — an introspection request ("why isn't the agent doing X?" / "what is available at this lifecycle-point?") or a re-anchoring trigger, parsed as the turn's opening. The holder reads it as a demand to surface execution context, not to act on it.

- **[`plan-step-or-feedback`](plan-step-or-feedback.md)** — a plan-step, a frame-coordinate, or reviewer/tester feedback, parsed as the turn's opening. The implementer's input: the next unit of work to realize, or the correction that redirects it.

## How an agent composites a percept

An agent does not invent its percept each turn — it **holds** one. Each archetype cell in [`agents/`](../agents) imports its percept by reference (`[[ ]]`, never restating it — [[cite-dont-copy]]); the resolver inlines the held percept as the lens through which that agent reads the turn's input. Because each office holds a distinct opening, the same incoming material lands as a different first question depending on who receives it — a diff is "material to weigh" to the reviewer, "a thing to exercise" to the tester, "the next unit to build" to the developer. The percept is where an agent's mandate meets the world: it fixes what counts as the start of work.
