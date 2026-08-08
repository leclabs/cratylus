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

## 3. The persona seam — and the sentence this section first got wrong

**RETRACTED, and the retraction is the finding.** This section first concluded that
`before_agent_start` was _"strictly better than DELTA's `--append-system-prompt`."_ **That is
false, and it is false in the direction that would have cost the most**: it would have put the
persona inside an extension — code to write, load, and keep loaded — when omp already carries it
with two files and no code. A true conclusion (the seam works) sat on a false premise (that it was
the best seam), and only re-running the comparison caught it.

What survives, measured by reading the implementation rather than its doc comment:

- `BeforeAgentStartEventResult.systemPrompt?: string[]` — `extensions/types.ts:1033`.
- `extensions/runner.ts:1344–1394` feeds each handler the running `currentSystemPrompt` as
  `event.systemPrompt`, so a handler **can** reconstruct an append with
  `[...event.systemPrompt, persona]`. But `runner.ts:1379–1380` **overwrites the array outright** —
  the append is the handler's own doing, not the API's. Calling it "an augment" flattered it.
- **It cannot accumulate across turns**, for a better reason than first given: the extension's
  result is written to the AGENT (`agent-session.ts:5258`, `this.agent.setSystemPrompt(...)`),
  while the base lives in a separate `#baseSystemPrompt` field on the session's tool manager
  (`session-tools.ts:1094–1106`) that the extension cannot reach. The base is rebuilt from tools
  and model, never from the previous turn's modified prompt.
- **The real cost.** Returning anything at all — append or replace — takes the
  `baseXdevCatalogDelivered = false` branch (`agent-session.ts:5256–5258`), which forces an `xd://`
  mount-notice line. omp's own comment at `session-tools.ts:791–799` says why: _"A
  `before_agent_start` replacement drops it, so its additions must remain in the notice."_
  Appending keeps the catalog bytes, so the notice is redundant — but the cost is unconditional.

**Two traps in the shipped package, both of which would have shipped as silent misbehaviour:**

- **`systemPromptAppend` does not exist.** `examples/extensions/pirate.ts:30` returns it and
  `examples/extensions/README.md:58` documents it. `BeforeAgentStartEventResult` has only `message`
  and `systemPrompt`, and `runner.ts:1373–1383` reads only those two. The shipped example **silently
  no-ops.** Do not copy it.
- **`resources_discover` is never emitted.** The type (`types.ts:611–615`), the subscription
  (`types.ts:1127`) and the aggregator (`runner.ts:1179–1220`) all exist; there is **no call site**
  in `src/` or in the compiled `dist/cli.js` beyond the definition itself. It would live beside
  `runner.emit({type:"session_start"})` in `modes/runtime-init.ts:143` and is not there. Any plan to
  inject skill paths through it is dead on arrival.

## 4. omp has NO hook config — so the omp adapter uses `enforcingSurface`, not `hooks`

**RESOLVED, and the answer is that the thing to find does not exist.** `extensions/loader.ts:580–615`
(`discoverExtensionPaths`, ambient branch) scans exactly two things, and neither is a settings key
listing hooks:

1. `extensions/` subdirectories of the native config dirs, via `extensionModuleCapability` with
   **`providers: ["native"]`** — the claude/codex/gemini providers are skipped outright
   (`loader.ts:586–592`, whose comment names issue #4198 as the reason).
2. loose `.ts`/`.js` hook factories, filtered by `isExtensionFile` and **bound through the
   EXTENSION runner** (`loader.ts:597–605`).

Both are **profile-scoped**, because the native config dir is `getAgentDir()` (§5.3). So an omp hook
is a **TypeScript module dropped in `~/.omp/profiles/<name>/agent/extensions/`** — nothing declares
it; the directory IS the declaration.

**This decides which port op the omp adapter implements.** `hooks()` returns a
`HarnessHooksProjection` whose `settings` is `Record<string, unknown>` — a JSON fragment, right for
claude's `settings.json` and codex's `hooks.json`, wrong for omp. **`enforcingSurface()` returns a
bare `HarnessProjection` — `{filename, content}`, arbitrary bytes — which is exactly a `.ts`
module.** Its own doc block already describes omp's situation without naming it: _"a harness that
cannot attach a hook to one agent — a global surface, filtered per agent by whatever selector the
harness does offer."_ Codex's selector is a `matcher` regex; **omp's is `$OMP_PROFILE`.**

So the omp adapter **omits `hooks()` and implements `enforcingSurface()`**. The port needed no
change to accommodate a harness whose hook surface is code rather than config — which is some
evidence the port's seam was cut in the right place.

Do **not** route through the claude-compat hook path. DELTA settled it: omp's compat loader keys
on `pre|post × tool name` (`capability/hook.ts` — `type: "pre" | "post"`, `tool: string`), which
cannot express a lifecycle event, and nothing reads `.claude/settings.json`'s `hooks` key at all.

## 5. DECISION — the profile IS the name

**`omp --profile mav` is this harness's `claude --agent mav`, and the persona needs no extension
to carry it.** Recorded with its reason, as the shard's constraint demands.

**Why the profile and not a flag.** An extension _can_ register a value-taking string flag
(`registerFlag(name, {type:"string"})`, `extensions/types.ts:1214`, `loader.ts:199–207`), so
`omp --agent mav` is buildable. It is still the wrong answer:

- **The value is unreadable when it would be needed.** `main.ts:1550` loads extensions, `main.ts:1557`
  applies flags. Inside the factory `getFlag` returns only the registered **default**
  (`loader.ts:204–206`); the real value arrives no earlier than `session_start`. A name learned
  after the session is built is not what the session IS.
- **It invents a second identity axis** beside one omp already has, and the canon would then own a
  name the harness does not know — the ambient shape `MODEL.md` forbids under `ENFORCED`.

**Why the profile works, in four facts I read myself:**

1. **It is the only name a launch carries.** There is no `--agent`, no `--persona` in the flag table
   (`cli/flag-tables.ts:115–320`); `SessionStartEvent` is `{type:"session_start"}` and nothing else
   (`shared-events.ts:28–30`); `ExtensionContext` exposes no agent name. The one near-miss,
   `agentId` (`sdk.ts:520–521`), is SDK-only IRC routing, unreachable from any CLI or extension.
2. **The name is exported into the environment.** `pi-utils/src/dirs.ts:466–468` sets
   `process.env.OMP_PROFILE`, `PI_PROFILE` and `PI_CODING_AGENT_DIR` on profile activation. **Every
   hook worker and child process inherits it.** That is the selector `scopes()` needs — the direct
   analogue of codex's `matcher` over `agent_type`, and it costs nothing to read.
3. **The profile root is a real home.** `~/.omp/profiles/<name>/agent/` with its own `extensions/`,
   `settings.json`, plugins and sessions (`dirs.ts:105–125`; `discovery/builtin.ts:65–70` states it
   outright: _"Native user config is profile-scoped"_). That is where `deploy --harness omp` lands
   the face.
4. **The persona is auto-discovered there, as a TRUE augment, with no flag.**
   `main.ts:827–838` (`discoverAppendSystemPromptFile`) looks for `APPEND_SYSTEM.md` at project then
   user level, and the user base is the profile-scoped agent dir (`config.ts:83–85`, via
   `globalAgentDir()`). It is used only when no CLI value was passed (`main.ts:881`), and it is
   applied by `applyResolvedSystemPromptInputs`, whose own comment is the guarantee: _"Apply
   resolved CLI/discovered prompt files **without bypassing system prompt templates**"_
   (`main.ts:840–841`). Nothing is dropped, and the `xd://` cost of §3 is not paid.

**So DELTA's §2 needs amending, and this is the revisit it asked for.** It concluded _"the alias
carries no persona … a profile is a home, not a being"_ and deferred to this shard. True of
`--profile` **alone**; false of the profile **home**, which auto-discovers a persona file the
bootstrap never looked for.

**What this does to the shard.** The fidelity ladder, per capability:

| capability          | rung        | mechanism                                                     |
| ------------------- | ----------- | ------------------------------------------------------------- |
| persona             | **proxy**   | `APPEND_SYSTEM.md` in the profile agent dir — zero code       |
| identity            | **proxy**   | `--profile <name>` / `OMP_PROFILE` — zero code                |
| skills              | **proxy**   | already free via the claude-compat loader (DELTA §"for free") |
| enforcement scoping | **provide** | the extension — and this is now ALL it has to do              |

**The extension shrinks to one job.** It no longer carries the persona, the model, or the skills.
It exists to make enforcing fragments fire and narrow on `$OMP_PROFILE` — which is the only thing
DELTA found genuinely missing. That is a much smaller artifact than this shard was scoped for, and
it is the right one.

## 6. The decision was tested, including the test DELTA said the bootstrap could not run

`pnpm canon:project` → `./.cratylus/claude/agents/mav.md` (repo root; DELTA's
`packages/canon/.cratylus/…` path is stale). Body front-matter stripped into
`~/.omp/profiles/mav/agent/APPEND_SYSTEM.md`. No flag, no extension, no `-e`.

**The discriminating run — the one DELTA's "measurement problem" section said had to happen
somewhere this corpus is not on disk:**

```sh
cd "$(mktemp -d)"
omp --profile mav --no-skills -p "State … what is your name, and what is your Prime Principle?" < /dev/null
```

> `Name: mav.`
> `Prime Principle: cratylism — names are natural, not conventional. Canonical signs are intrinsic
and discovered, not coined…`

Blank cwd, `--no-skills`, nothing on the command line naming an agent. **The persona carried, and
this time the corpus could not have been the one carrying it** — DELTA's masking confound is
controlled, not merely acknowledged. The profile's auth also carried; DELTA's `401 User not found`
did not recur.

**Accept criterion 2**, run in the repo (`omp --profile mav -p "/introspect"`): the session
enumerated **twenty dimensions** declared-vs-effective and classified two divergences by cause —
`Archetype → misnomer` (cold decode found accidental genre mass on `Hero archetype`) and
`Memory → unobservable` (correct: this session was never `wake`-loaded). It ran the skill in the
skill's own formalism and declined to reconcile anything.

**Accept criterion 3** holds: no agent cell was edited. Nothing in `packages/canon/src/agents/`
was touched to make any of this work.

**What is NOT yet done, stated plainly.** `APPEND_SYSTEM.md` was landed by hand, by `awk`-stripping
the **claude** face — the exact bootstrap form §1 says expires here. So criterion 1 is satisfied at
the LAUNCH end and still bootstrap at the DEPLOY end. **The shard closes when
`forge/adapters/omp` emits that file and `cratylus deploy --harness omp` lands it**, not before.
What the test settles is that the target is right and the mechanism works — the adapter now has a
known-good artifact to reproduce.

## Open

- [x] Extension API surface map — done; §3 and §5 carry it.
- [x] The identity decision (§5), with its reason.
- [x] Empirical verification of §5, including the corpus-absent run (§6).
- [x] Where omp declares hook paths in config (§4) — it does not; the `extensions/` directory is
      the declaration, and the adapter implements `enforcingSurface`, not `hooks`.
- [ ] `forge/src/adapters/omp/` — `agentDef` → `APPEND_SYSTEM.md`, `events.ts` mapping the canonical
      vocabulary onto omp's 24 `HookAPI` events, `scopes()` answering from `$OMP_PROFILE`.
- [ ] Register `omp` in `adapters/registry/index.ts` and widen `HarnessName`.
- [ ] The extension — now reduced to enforcement scoping alone.

## 7. Validated on a second host, from the published package — 2026-08-07

`fire` proves the code; `coal` proves the ARTIFACT. Different machine, no corpus
checked out, nothing built locally — the package as a consumer receives it.

```sh
npm i -g cratylus@latest        # 0.2.0 → 0.2.1
bun add -g @oh-my-pi/pi-coding-agent
cratylus install --harness omp  # zero-config path
```

**Three things this run settled that `fire` could not:**

1. **The identity carries from the published artifact.** In a blank tmpdir, asked the
   bare "what is your name?": `mav` → _"My name is mav."_, `nico` → _"nico."_,
   `tester` → _"My name is **tester**."_ A fourth, `boz`, returned its name, its
   archetype (**Boswell** — the chronicler), its remit, and an enumeration of its
   deployed skills. **coal has no copy of this corpus**, so the masking confound
   DELTA warned about is absent by construction rather than by arrangement.
2. **`cratylus install` emits the event vocabulary.** The output ends
   `runtime config: /Users/lex/.cratylus.json — 31 event(s), 9 with a native peer`,
   with no warning about a missing `cratylus.config.ts`. That is `d4a01b7c` verified
   from the published package on the host that carried the bug — the FORWARD note
   this plan opened with, discharged.
3. **It works on `omp/17.2.11`, not only the `17.2.9` it was read against.** coal
   installed a patch newer than fire's. Nothing in the adapter's reading of
   `APPEND_SYSTEM.md` discovery moved.

`9 with a native peer` matches `canonicalToOmp` exactly — the map is nine entries,
and the host config agrees with the adapter without either being told about the other.

## Accept — MET

1. **A documented command launches omp as a declared cratylus agent.** `omp --profile
<name>`, with the face deployed by `cratylus deploy --harness omp` (or `install`).
   Verified on two hosts, four agents.
2. **`/introspect` reports the declared values and names each divergence's cause.**
   Twenty dimensions, two divergences classified (`misnomer`, `unobservable`), in the
   skill's own formalism.
3. **The agent cell was not edited.** Nothing under `packages/canon/src/agents/` was
   touched at any point.

Shipped as `@cratylus/forge@0.3.0` and `cratylus@0.2.1`, both with sigstore provenance.

## What this shard does NOT close

**Five scope-activated cells still have no home on omp** — `stance-guardrail`,
`stance-guardrail-pre`, `deploy-drift-notice`, `memory-consolidation-nudge`,
`resume-availability-notice`. Projection says so out loud, once per cell:

> `WARNING: scope-activated cell '<x>' has no mechanism on 'omp': this harness
projects no session-scoped hook surface. The cell is not deployed here.`

The AGENT-composed path is built and gated (`enforcingSurface` → one module per
profile). The SESSION-scoped path is not, because those cells bind the session
rather than an agent, and on omp that means the non-profile `~/.omp/agent/extensions/`
— a different artifact with a different lifetime. Carried to
`t-omp-scope-activated-hooks`, because it is a separable concern and this shard's
accept criteria are met without it.
