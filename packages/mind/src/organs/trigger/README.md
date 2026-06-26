# trigger

> The concrete input as taken up this turn: the parsed observation that opens the cycle.

**What this is.** `trigger` is one organ in the agent's conceptual anatomy (the **per-turn · external** input; see [`docs/agent-conceptual-anatomy.md`](../../../docs/agent-conceptual-anatomy.md)). In the industry vocabulary it is the agent's **input parse** — the single observation that arrives at the top of one act of the agent loop and gets read as "here is what I am being handed _this turn_." Where [`modalities`](../modalities) is the standing channel by which the world _can_ enter, a trigger is the one thing that _did_ enter now, already construed into the shape the agent reads.

A trigger is not raw bytes and not yet an interpretation — it is the **opening of the turn**: the message, result, event, or request, parsed into the question the agent is built to answer. The dimension this organ governs is the **turn-opening input type**: _what kind of thing_ started this turn. The values below partition that space — every turn opens on exactly one of them.

## The canonical percepts

Each is a value cell (`kind: trigger`); the opening observation is the `≜` claim.

- **[`user-message`](user-message.md)** — a natural-language directive, query, or reply from a human user/operator/interlocutor opens the turn; the agent's primary intent-bearing input channel.

- **[`tool-result`](tool-result.md)** — the return value, output, or error of a tool/function/build/query the agent itself invoked opens the turn; the world's reply to a prior action.

- **[`agent-message`](agent-message.md)** — a message from another agent (request, delegation, response, or broadcast) over an inter-agent channel opens the turn; peer/orchestrator input distinct from a human's.

- **[`environment-event`](environment-event.md)** — an unsolicited external occurrence the agent subscribed to — sensor reading, webhook, file/state change, message-queue delivery — opens the turn; pushed, not requested.

- **[`scheduled-trigger`](scheduled-trigger.md)** — a time-based fire — cron, timer, interval, or deadline — opens the turn with no external content payload; the clock is the trigger.

- **[`introspection-request`](introspection-request.md)** — a request for the agent to examine its own state, config, capabilities, or reasoning — self-report or self-audit — opens the turn; the subject sensed is the agent itself.

## How an agent binds a trigger

An agent binds a value by citing `trigger [[value]]` in its `agent/<name>.md` selection vector — the vector is the single source of truth. The resolver inlines the cited cell by reference (`[[ ]]`, never restated — [[cite-dont-copy]]) as the lens through which that agent reads the turn's opening. Because each office may bind a distinct opening, the same incoming material can land as a different first question depending on the binding. The trigger is where an agent's role meets the world: it fixes what counts as the start of work.
