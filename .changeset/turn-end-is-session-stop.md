---
'@cratylus/forge': patch
---

`turn.end` binds omp's `session_stop`, so the turn-end bound is a bound again

`agent_end` is documented _"notification-only"_ and takes no result. A turn-end cell mapped there
cannot REFUSE — the best the shim could do was queue a `sendUserMessage` continuation, which is a
steer wearing a bound's name. `MODEL.md` calls that a degradation; nothing reported one, because
the adapter believed the event was realizable.

omp has the real thing and the adapter was not using it. `session_stop` is _"awaited before
settle"_, and its result type is `{decision?: "block"; reason?: string}` whose own doc-comment
reads **"Claude/Codex-compatible block decision"**. The event carries `messages`,
`last_assistant_message`, `session_id`, and — decisively — **`stop_hook_active`**, the re-entry
flag the workers read and which `agent_end` has no field for, so the guard's own loop-safety was
dead on this harness.

Measured against the installed binary: a handler returning `{decision: "block", reason}` re-opened
the turn and fired again with `stop_hook_active=true`, exactly as the claude `Stop` contract does.
Then end to end with the deployed worker and the real rubric on a `mav` overlay — the first
`session_stop` blocked, omp re-opened the turn, the agent re-assumed the stance, and the second
fire settled.

Also here:

- **Two refusal shapes, one table.** A tool wrapper reads `{block, reason}`; the stop pass reads
  `{decision: "block", reason}`. Emitting either at the other site is silently ignored — a gate
  that returns and refuses nothing. `OMP_REFUSAL_SHAPE` maps each blocking event to its spelling
  and replaces `OMP_BLOCKING_EVENTS`, whose keys were the same list in a second place.
- **`subagent.end` keeps the continuation channel**, because `session_stop` never fires for
  subagents (`agent-session.ts`: `if (this.#agentKind === "sub" || …) return false`) and
  `tool_result` takes no verdict.
- **The emitted module imports `ExtensionAPI`, not `HookAPI`.** omp's `docs/hooks.md` states the
  package root does not re-export `HookAPI`. Type-only, so the wrong name was erased before it
  could throw; it would have failed the first person to typecheck an emitted module.
