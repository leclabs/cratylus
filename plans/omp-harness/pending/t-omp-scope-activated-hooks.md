# t-omp-scope-activated-hooks

**Wave 2.** The five session-scoped cells omp currently deploys nothing for.

## Intent

`t-omp-agent-extension` built the AGENT-composed enforcement path: `enforcingSurface`
emits one TypeScript module per composing agent into
`profiles/<agent>/agent/extensions/`, where the directory IS the scope.

**Scope-activated cells are the other half and have no home yet.** Projection says
so, once per cell, on every omp run:

> `WARNING: scope-activated cell '<x>' has no mechanism on 'omp': this harness
projects no session-scoped hook surface. The cell is not deployed here.`

Five are affected: `stance-guardrail`, `stance-guardrail-pre`, `deploy-drift-notice`,
`memory-consolidation-nudge`, `resume-availability-notice`. An omp session today runs
with none of them — no stance gate, no memory nudge, no drift notice, no resume
notice. Claude and codex sessions get all five.

## What to build against

The likely home is the **non-profile** native config root — `~/.omp/agent/extensions/`
— which omp scans on every session regardless of profile
(`extensions/loader.ts:580–615`, `discovery/builtin.ts:58–73`). That is the correct
lifetime: these cells bind the SESSION, not an agent, so there is nothing to narrow
to and a matcher would add nothing. Codex reaches the same conclusion for the same
reason — see the note above `hooks:` in `adapters/codex/render.ts`.

The port op is `hooks()`, and it does not fit: it returns
`HarnessHooksProjection.settings`, a JSON fragment for a harness that keeps hook
config in a file. omp keeps none. Either widen that op the way `enforcingSurface` was
widened, or route scope-activated cells through `enforcingSurface` too and let the
adapter distinguish them by `activation`.

**Decide which, and record why** — `hooks()` returning code for one harness and
config for two is the kind of split that reads as an accident later.

## Constraints

- **No runtime self-filter.** The agent-composed path earns its scope by placement;
  this path has no scope to earn, which is exactly why it may sit in the shared root.
  It must not grow an `OMP_PROFILE` check to compensate for anything.
- **The worker bytes are the canon's**, reached through `hookCommand` — the adapter
  wires, it does not author behaviour.
- `agent_end` carries `willContinue` (`shared-events.ts:193–201`), a BETTER terminal
  predicate than the claude adapter has. `memory-consolidation-nudge` and
  `stance-guardrail` both want it: it says outright when a settle is not user-visible.

## Deps

`t-omp-agent-extension`

## Accept

1. An omp session fires all five, and `cratylus project --harness omp` emits no
   `has no mechanism on 'omp'` warning.
2. The stance guardrail BLOCKS on omp, not merely observes — `tool_call` is
   documented as blockable (`extensions/types.ts:304`) and is the one event that is.
3. Verified with BOTH fixtures: a session that should trip a gate does, and a clean
   one is silent.
