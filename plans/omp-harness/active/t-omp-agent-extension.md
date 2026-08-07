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

---

# Findings — opened 2026-08-07

## 1. This shard is TWO artifacts, because there is no omp face to consume

The shard constraint says the extension _"consumes a projected omp face"_. **There is none.**
`packages/forge/src/adapters/` holds `claude`, `codex`, `registry` and nothing else, and
`adapters/registry/index.ts` declares `HarnessName = 'claude' | 'codex'`. So the face has to be
built before the thing that consumes it:

1. **`forge/src/adapters/omp/`** — a `HarnessAdapter` implementation: the omp face.
2. **the extension** — the mechanism that makes the adapter's `scopes()` answer `true`.

DELTA's documented launch command reads the **claude** face and strips its front-matter with
`awk`. That is the bootstrap form and it expires here: a claude artifact reshaped at launch time
is exactly the "second place an agent is defined" the constraint forbids, one level down.

## 2. Codex is the template, not claude

Read `adapters/codex/render.ts` and `adapters/codex/events.ts` before writing a line of omp.
Claude attaches a hook to a subagent **directly**, so its adapter never had to solve the problem
omp has. Codex declares hooks **globally** and recovers per-agent scope through a generated
`matcher` regex over `agent_type` — the same shape omp is in.

The port already anticipates every part of this (`core/harness-adapter.ts`):

| port member                           | what omp needs it for                                                        |
| ------------------------------------- | ---------------------------------------------------------------------------- |
| `realizes(e)` / `scopes(e)`           | separate predicates — **firing is not scoping**, and that is the whole shard |
| `nativeEvents`                        | canonical → omp `HookAPI` name, read by deploy to configure the runtime      |
| `enforcingSurface(bindings)`          | the global-surface-plus-selector case codex already exercises                |
| `hookCommand(anchor, workerFilename)` | keeps the omp path out of every canon cell                                   |
| `agentExt`, `home`, `hooksFile`       | deploy reads these off disk with no vector to ask                            |

**Every enforcing fragment degrades to `steer` on omp today** (DELTA's unifying finding), so
`scopes()` starts as `() => false` and the extension is what earns each `true`. Write it that way
round: the adapter DECLARES the incapacity, the seam decides what follows — codex's rule, and it
has one home.

## 3. The persona seam is `before_agent_start`, and it AUGMENTS

Measured on `omp/17.2.9` by reading the implementation, not the doc comment:

- `BeforeAgentStartEventResult.systemPrompt?: string[]` — `extensions/types.ts:1033`.
- The doc comment says _"Replace the system prompt for this turn"_, but
  `extensions/runner.ts:1344–1394` chains handlers over a `currentSystemPrompt` that each handler
  receives as `event.systemPrompt`. **Returning `[...event.systemPrompt, persona]` is an augment**,
  and it composes with other extensions instead of clobbering them.
- **It does not accumulate across turns.** `agent-session.ts:5218` rebuilds the base fresh every
  turn via `#buildSystemPromptForAgentStart`, and `:5255–5263` calls `setSystemPrompt(...)` per
  turn. So the append is idempotent by construction.
- **One real cost.** Returning anything at all sets `baseXdevCatalogDelivered = false`
  (`agent-session.ts:5256`), which forces an `xd://` mount-notice line. Appending keeps the base
  catalog text, so the notice is redundant rather than a loss — but it is a visible artifact and
  belongs in the adapter's warnings, not in a comment.

This is strictly better than DELTA's `--append-system-prompt`, which binds to one launch and
cannot see what it is appending to.

## 4. `hooks()` returns JSON; omp's hook surface is CODE

`HarnessHooksProjection.settings` is `Record<string, unknown>` — a JSON fragment the consumer
merges into the host's config. That fits claude's `settings.json` and codex's `hooks.json`. **omp's
own `HookAPI` is a TypeScript module loaded by `--hook`/`-e`**, so the omp adapter either emits
code or finds omp's config-declared hook path. `hooks/loader.ts` calls a hook's `path` _"Original
path from config"_, so a config surface exists — locate it before assuming code emission.

Do **not** route through the claude-compat hook path. DELTA settled it: omp's compat loader keys
on `pre|post × tool name` (`capability/hook.ts` — `type: "pre" | "post"`, `tool: string`), which
cannot express a lifecycle event, and nothing reads `.claude/settings.json`'s `hooks` key at all.

## 5. Identity: omp has `--no-extensions`, therefore it has extension DISCOVERY

`omp --help` carries `--no-extensions  Disable extension discovery (explicit -e paths still
work)`. An always-on load path exists, which is what an identity binding needs — a persona that
requires a flag on every launch is `--append-system-prompt` again with more steps.

Two candidate identity carriers, to be decided on the surface map:

- **`ExtensionFlag`** (`extensions/types.ts:1431`) — if an extension may register a value-taking
  flag, `omp --agent mav` becomes literally the `claude --agent mav` equivalent.
- **`OMP_PROFILE` / `--profile`** — already a NAME, and `omp --help` confirms the env var. DELTA
  measured its cost: separate auth (`401 User not found` on first run) and a separate provider
  config. It buys a home, not a persona — but a home with a name is exactly what `scopes()` needs.

These are not exclusive. The profile is the being's **home**; the flag or env var is what tells
the extension **which** being. Decide with the surface map in hand and record the reason here.

## Open

- [ ] Extension API surface map — flags, discovery, activation signature, what may be set when.
- [ ] Where omp declares hook paths in config (§4).
- [ ] The identity decision (§5), with its reason.
