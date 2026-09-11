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

---

# Result — 2026-09-10 (AAI-6)

## The decision the shard asked for: widen the port, do not overload `hooks()`

A new op, `HarnessAdapter.scopeActivatedSurface(hooks, agentNames)`, beside `hooks()`
rather than inside it. `hooks()` keeps its meaning — a JSON settings fragment a host
MERGES — and the new op returns artifacts, the same shape `enforcingSurface` already
returns. One sign, one extension: an op returning code for one harness and config for
two is exactly the split the shard warned would read as an accident later.

Routing through `enforcingSurface` was the other candidate and was rejected: it takes
`Binding[]` — an agent-composed constraint with a mechanism map — and a scope-activated
cell has neither. Passing synthetic bindings would have made the adapter distinguish
them by shape, which is the same overload one layer down.

`project` now reads "no scope-activated surface" only when BOTH are absent. That
conditional was the whole defect: the branch tested `hooks` alone, so a harness whose
surface is a program looked like a harness with no surface.

## The shard's premise was half right, and the correction is the load-bearing part

"**The likely home is the non-profile native config root — `~/.omp/agent/extensions/` —
which omp scans on every session regardless of profile.**" It does not. The same
`discovery/builtin.ts` this shard cites says the opposite two lines up: _"Native user
config is profile-scoped: getAgentDir() points at the active profile's agent dir"_.
`~/.omp/agent/extensions/` is scanned when NO profile is named, and never under
`--profile mav` — and every projected persona IS a profile.

So the shared root is one scope, not the scope. These cells land once per scope that
must carry them: the session root plus every projected agent's profile (`SESSION_SCOPE`

- N). Claude's user-level `settings.json` reaches every claude session; on this harness
  the same reach is N+1 placements. That is not the ambient form `MODEL.md` forbids —
  nothing emitted filters itself at runtime, and these cells compose no agent to widen
  past.

**The same correction fixed a second, larger silence**: skills. Deploy placed them at
`~/.omp/skills`, a directory omp never scans, so `fire`'s byte-perfect omp render was
16 unloadable skills reporting success — it only appeared to work because that host's
`~/.claude/skills` carried the same corpus and omp's claude provider reads that base
under every profile. `HarnessAdapter.skillRel(name, agents)` is now plural and the
placer asks it.

## Accept

**1. No warning, and all five deployed. MET.**
`cratylus project --harness omp` emits `0` lines matching `has no mechanism on 'omp'`
(was 5), and 11 modules — `enforcing/_session/cratylus-session.ts` plus one per agent.
Deployed into a sandbox `--home`:

```
mechanism _session -> agent/extensions/cratylus-session.ts
mechanism mav      -> profiles/mav/agent/extensions/cratylus-session.ts
…9 more
```

and `cratylus deploy --check --harness omp` reports `DEPLOYED TREE IS IN SYNC` over 231
skill files and 18 hook files. The canon's harness-parity gate now reads THREE renders
(`.cratylus/{claude,codex,omp}`) and asserts the same governance cell set on each — the
gate that was added for codex's silent drop could not see omp's, because omp was not in
its `RENDERS` list.

**2. The stance guardrail BLOCKS. MET, at the artifact.**
The emitted module was loaded under bun with a stub `HookAPI`, registering
`agent_end, tool_result, tool_call, tool_call, session_start, before_agent_start,
agent_end, session_start`. Driving the `tool_call` handler:

```
clean   tool_call verdict: undefined
tripped tool_call verdict: {"block":true,"reason":"stance: elevation not held"}
other tool verdict:        undefined      ⟨toolName: read — never gated⟩
```

**3. Both fixtures. MET in the same run** — the clean worker is silent, the failing one
blocks with the worker's own stderr as the reason, and a non-matching tool is not gated
at all.

**What is NOT claimed:** a live authenticated `omp --profile <agent>` session was not
run, so "an omp session fires all five" is verified at the module boundary (load,
registration, verdict) rather than end-to-end through the harness's own event bus.

## Also landed, because it was the same seam

- **The shim stopped asserting a bridge omp has no end for.** `sessionEnvVars` is now an
  adapter fact; omp declares `[]` (no `*_SESSION_ID` variable is set for a child process
  anywhere in its coding-agent source), and its projected shim REFUSES with exit 3
  naming `$AGENT_SESSION_ID` / `$AGENT_SESSION_ID_FROM` instead of running sessionless.
  This is why `upmav` had deleted every shim-bearing skill by hand.
- **`deploy --check` was auditing claude's layout on every harness** — it passed
  `agentExt` alone, so an omp check compared `agents/<name>.md` against a host that
  carries `profiles/<name>/agent/APPEND_SYSTEM.md`. It now passes the whole layout.
- **Prune still converges over the new destinations.** Removing `boz` from the render
  tree and redeploying removes `profiles/boz/agent/APPEND_SYSTEM.md`, its 16 skill
  copies and its module — `profiles/boz` no longer exists on the target.

## Owed, and deliberately not taken here

**Persona ≡ profile conflates identity with environment.** N+1 skill copies is the
cheapest honest reading of a harness whose config root is per-profile, but the copies
exist because a persona is a profile, and a profile also silos auth, MCP, models,
sessions and memory. `upmav`'s profile `mcp.json` is a byte-duplicate of the default
profile's 17-server org config for exactly this reason. That is a ruling, not a patch.
