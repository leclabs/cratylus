---
'@cratylus/forge': minor
---

A Claude Code agent definition now names the model tier of the role its agent holds, so a dispatched implementer no longer runs on whatever model its parent session uses, and a `claude --agent planner` session no longer runs on the account default. The definition carries `model: <tier>` right after its `description`: `sonnet` for an implementer, `opus` for a planner, assayer or architect. An agent holding any other role, or none, carries no `model` and runs on the session's model. Only a tier alias is emitted, never a model id or version, so the alias resolves to whatever Claude currently serves for that tier.

The host's own choice outranks the definition. For a `--agent` main session it is `--model`. For a dispatched subagent it is `CLAUDE_CODE_SUBAGENT_MODEL_FORCE=1` together with `CLAUDE_CODE_SUBAGENT_MODEL=<model>`; `CLAUDE_CODE_SUBAGENT_MODEL` alone leaves the definition's tier standing (observed on Claude Code 2.1.285).

The table lives in the claude adapter alone, and canon names no tier. `roleRouting` stays absent on claude, since `install` seeds no claude config and the omp projection and install are unchanged. The `RoleRouting` doc on the adapter port no longer says an absent table means definitions carry no route: a harness may route by tier in its own definitions.
