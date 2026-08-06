# t-omp-agent-extension

**Wave 2.** Launch omp AS a declared agent — the `claude --agent` equivalent.

## Intent

omp has no `--agent`. `omp agents` manages BUNDLED TASK AGENTS — the subagent sense, the same
concept as Claude's `Task` agents — which is a different thing from _this session is that
being_. The gap is real and it is what the extension fills.

## What to build against

`-e/--extension` and `--hook` load extension files; `omp plugin install|link` packages them.
Establish the extension API surface first — what an extension may set before the session
starts (system prompt, tools, model roles, skills filter) — because "launch as an agent" is
precisely a bundle of those.

## Constraints

- **The agent cell stays the source.** The extension consumes a projected omp face; it does
  not become a second place where an agent is defined. A projector that decides something
  about the design rather than carrying it is the defect ARCHITECTURE names for `forge`.
- **`--profile` is probably part of the answer, not competition for it.** A persona with its
  own auth, sessions and settings is closer to a being with a home than a flag that swaps a
  system prompt. Decide deliberately and record why.
- The bootstrap shard's delta is this shard's specification. If they disagree, the delta wins
  — it was measured.

## Deps

`t-omp-persona-bootstrap`

## Accept

1. A documented command launches omp as a declared cratylus agent, with its dimensions in
   effect.
2. `/introspect` inside that session reports the declared values, and names the cause of any
   divergence.
3. The agent cell was not edited to make this work.
