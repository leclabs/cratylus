# The omp delta

> Output of `t-omp-persona-bootstrap`. Measured on `omp/17.2.9`, host `fire`, 2026-08-06.
> This file is the adapter's specification. Every claim below names the command or the source
> line it was taken from.

## What carries for free, and it is more than the plan assumed

**omp reads `~/.claude/` directly.** It ships a Claude-compatibility discovery provider
(`src/discovery/claude.ts`) registering eight loaders, every one of them on by default:

| loader        | reads                                                |
| ------------- | ---------------------------------------------------- |
| skills        | `.claude/skills/*/SKILL.md` (user + project walk-up) |
| commands      | `.claude/commands/*.md` (recursive, namespaced)      |
| memory        | `CLAUDE.md` files under `.claude/`                   |
| system prompt | `.claude/SYSTEM.md` (user level only)                |
| settings      | `.claude/settings.json` (user + project)             |
| MCP           | `.claude.json`, `.claude/mcp.json`                   |
| extensions    | `.claude/extensions`                                 |
| custom tools  | `.claude/tools/`                                     |
| hooks         | `.claude/hooks/pre/` and `.claude/hooks/post/`       |

Toggled by `skills.enableClaudeUser`, `skills.enableClaudeProject` and siblings — all `true` out
of the box (`omp config list`).

**Consequence: the skills half of a cratylus deployment needs no adapter at all.** Measured, not
inferred — asked to list what it can see, an omp session in this repo returns all sixteen:

```
carry-on, conceptualize, create-agent, create-skill, dream, elicit, event-tap, exemplify,
formalize, handoff, introspect, materialize, praxis, probe, signify, wake
```

(alongside the Claude plugin skills it also picked up). On the fidelity ladder this is **proxy**,
and it cost nothing.

Both invocation forms work headlessly: `omp -p "/probe harness"` and naming the skill in prose
each execute the cell correctly, in the cell's own formalism.

**A retracted claim, kept because the retraction is the lesson.** This section first recorded that
the bare slash form _"produced empty output and exit 0"_ and that skills _"resolve only when named
in prose."_ That was false. The empty runs were `omp -p` blocking in `readPipedInput` (see the
launch command below) — a **property of how the command was invoked, misattributed to the feature
under test.** Both forms were re-run with stdin closed and both work. An anomaly observed while a
confound is uncontrolled is not a finding.

## What does not carry

### 1. The agent cell — the gap the plan already named, now with its mechanism

`~/.omp/agent/agents/*.md` is the **subagent** sense, not the persona sense. The bundled
`spark.md` proves the shape: `name` / `description` / `model` / `tools` front-matter, a task agent
the `task` tool dispatches. There is no `--agent` flag; `omp --help` lists none.

The persona vectors omp does offer are **all scope-keyed, never identity-keyed**:

| vector                         | binds the persona to  | lifetime            |
| ------------------------------ | --------------------- | ------------------- |
| `--append-system-prompt <f>`   | one launch            | that process        |
| `--system-prompt <v>`          | one launch (replaces) | that process        |
| `~/.claude/SYSTEM.md`          | the user              | every session       |
| `.agent/SYSTEM.md`, `.agents/` | a directory (walk-up) | every session there |

**This is the finding that specifies the extension.** Claude Code's `--agent mav` binds a persona
to a **name**. Every omp surface binds it to a launch, a directory, or a user. A `SYSTEM.md` is
precisely the **ambient** form `MODEL.md` forbids under `ENFORCED` — _"¬ ambient : COMPOSITION is
the scope, ¬ a runtime self-filter"_ — so adopting it would not be a lower-fidelity projection of
the canon's identity model, it would be a different one wearing its name.

`--profile <name>` is the only surface that recovers identity, and it recovers the _home_ rather
than the _persona_: see below.

### 2. `--profile` isolates more than the plan expected, and `--alias` carries no persona

`omp --profile mav --alias omp-mav` writes a shell function to `~/.zshrc`. Measured, it is:

```sh
omp-mav() { command '/Users/lex/.local/share/mise/installs/bun/1.3.14/bin/bun' \
  '/Users/lex/.bun/install/global/node_modules/@oh-my-pi/pi-coding-agent/dist/cli.js' \
  --profile=mav "$@"; }
```

Two facts:

- **The alias carries no persona.** It is `--profile=mav` and nothing else. A profile is a home,
  not a being.
- **It hardcodes the bun binary path and the package dist path.** A bun version bump or an omp
  reinstall breaks it silently, and it lives in an operator-owned file.

The profile root is `~/.omp/profiles/<name>/`, with its own `agent.db`, `models.db`, sessions,
logs and config. Isolation is total, and that is a cost: the first run in the `mav` profile
returned **`401 User not found`** — the default profile's credentials do not carry — and the
`spark` provider declared in `~/.omp/agent/models.yml` is invisible there, because that file
belongs to the default profile. **One auth and one provider config per agent.**

### 3. Hooks — the claude-compat path is a dead end, and omp's own path is rich

**The compat path does not carry our hooks, and this is settled, not assumed.** omp's Claude hook
loader reads `.claude/hooks/{pre,post}/<tool>.sh` and keys each hook by **tool name**, two phases
only (`loadHooks`, `src/discovery/claude.ts` ~L353). Forge's claude adapter emits `settings.json`
`hooks` entries keyed by Claude's **lifecycle events**. And although omp does load
`.claude/settings.json` into its settings stack, **nothing reads its `hooks` key** — `grep -rn
'data\.hooks\|\.hooks\b' src/discovery/*.ts` returns nothing. Our hooks reach omp as inert JSON.

**omp's own hook API is where the fidelity lives** (`HookAPI`, `src/extensibility/hooks/types.ts`
~L481), loaded via `--hook` / `-e`. Mapping it against the seven canonical events this corpus
actually binds:

| canon event (cells binding it)                      | omp surface                      | fidelity    |
| --------------------------------------------------- | -------------------------------- | ----------- |
| `session.start` (resume-availability, deploy-drift) | `session_start`                  | **proxy**   |
| `turn.end` (memory-nudge, stance-guardrail)         | `agent_end` — **not** `turn_end` | **proxy**   |
| `prompt.submit` (deploy-drift)                      | `turn_start`, without the prompt | **provide** |
| `operator.consult.pre` (stance-guardrail-pre)       | `tool_call` filtered to `ask`    | **provide** |
| `subagent.dispatch.pre` (stance-guardrail-pre)      | `tool_call` filtered to `task`   | **provide** |
| `subagent.end` (stance-guardrail)                   | `tool_result` filtered to `task` | **provide** |
| `vcs.commit.post` (praxis-continuity)               | none; `tool_result` on `bash`    | **declare** |

**Three things this table gets wrong if read from the event names alone.** Each was corrected by
opening the type, and the first two would have shipped as silent misbehaviour:

- **`turn_end` is not our `turn.end`.** omp's turn is a **model** turn — `TurnStartEvent` /
  `TurnEndEvent` carry a `turnIndex` that increments within one exchange, so a hook on `turn_end`
  fires once per model turn, not once per user exchange. The analogue of Claude's `Stop` is
  **`agent_end`**, _"fired when an agent loop ends"_, which additionally carries `willContinue` —
  _"the session has already scheduled an automatic continuation … must not treat this as a
  user-visible terminal settle"_ (`shared-events.ts` L193–201). That flag is a **better** terminal
  predicate than the claude adapter has. Binding `memory-consolidation-nudge` to `turn_end` would
  have made it fire several times per exchange.
- **`turn_start` cannot carry `prompt.submit`'s payload.** `TurnStartEvent` is
  `{type, turnIndex, timestamp}` — no prompt text. It realizes the _moment_, not the _content_, so
  any cell needing the submitted prompt is **provide**, not proxy.
- **`agent_start` / `agent_end` are the MAIN loop, not subagents.** They do not realize
  `subagent.*`; the `task` tool's `tool_call` / `tool_result` does.

And one that makes omp **stronger** than the compat path suggested: **`tool_call` can BLOCK** —
_"Fired before a tool is executed. Hooks can block execution."_ (`types.ts` L304). The guardrail
cells that must **bound** rather than **steer** are mechanizable here.

### The finding that unifies §1 and §3

`MODEL.md` sets `mode(f, adapter) = bound ⇔ own(f) ∧ ∀e: realizable(e) ∧ (f ∈ ir(a) ⇒
scopable(e, a))`. On omp today, `realizable` holds for nearly everything above — but **`scopable`
fails for all of it**, because scoping an event to a _named agent_ presupposes a named agent, and
omp cannot launch as one (§1).

> **Every enforcing fragment degrades to `steer` on omp today — not because the events cannot
> fire, but because there is no identity to scope them to.** The persona gap and the enforcement
> gap are one defect, not two, and `t-omp-agent-extension` is the single repair for both.

That is a load-bearing dependency the plan's stated ordering does not carry: `t-omp-agent-extension`
is currently described as independent of the other adoptions. It is not — it gates every `bound`
mechanism on this harness.

## The measurement problem, which redirects this shard's own method

Paired probes, same prompt, same hosted model, `--no-skills`, control vs `--append-system-prompt`:

| probe                                | control                                   | with persona                                                                       |
| ------------------------------------ | ----------------------------------------- | ---------------------------------------------------------------------------------- |
| "plan state + next action"           | correct, well-structured                  | correct, well-structured — **indistinguishable**                                   |
| "are ARCHITECTURE.md's counts true?" | re-ran the commands, found 2 stale claims | ran **three gate suites** and swept **past the table's boundary**, finding a third |

The persona run's extra find was real and independently confirmed: a claim above the table
understating the bin-name gate's reach by 16×. But the honest reading is not "the persona works":

> **A well-signified corpus masks the persona's marginal contribution.** The control behaved like
> a careful engineer because `ARCHITECTURE.md` _tells_ its reader the counts are falsifiable in one
> command and to re-run them. The corpus carried the disposition, not the cell.

That is cratylism functioning exactly as `VISION.md` claims — meaning addressed by the artifact
rather than described by the prompt — and it means **behaviour on this corpus cannot answer
"did the persona carry?"**. A discriminating probe must run where the corpus is silent: a blank
cwd, a foreign repo, a task the ground documents say nothing about. That is a correction to this
shard's stated method, and `t-cross-harness-continuity` should inherit it.

## Documented launch command (accept criterion 1)

Run from a checkout of this corpus, after `pnpm canon:project`:

```sh
# DERIVE the persona at launch — the render tree is the only home
persona=$(mktemp) && trap 'rm -f "$persona"' EXIT
awk 'BEGIN{fm=0} /^---$/{fm++; next} fm>=2' \
  packages/canon/.cratylus/claude/agents/mav.md > "$persona"

omp --append-system-prompt "$persona" < /dev/null
```

**It derives rather than stores, and that is not fussiness.** A committed `mav.persona.md` would
be a **second home for the agent cell**, diverging from the render tree at the next deploy — the
same defect shape as a version literal in TypeScript, and the same shape as the stale deployment
this shard uncovered below. The front-matter is stripped because it is Claude adapter syntax; the
body is harness-agnostic.

**`< /dev/null` is required, not decorative.** Without it `omp -p` blocks in phase
`readPipedInput` waiting on a pipe that never closes, and the symptom is **empty stdout with exit
0** — indistinguishable from a model that returned nothing. Two runs were lost to this before the
`Still starting after Ns — phase: readPipedInput` line on stderr gave it away.

`--profile mav` is deliberately **not** in the documented command. It buys an isolated home at the
cost of a separate auth and a separate provider config, and it does not carry the persona anyway.
Revisit when `t-omp-agent-extension` can bind a persona to the profile.

## The verdict (accept criterion 3)

> **Yes — the persona is recognisably the agent, and the downstream shards are warranted.**

Evidence, not vibes. An omp session carrying the persona was asked to run `introspect` on itself.
It identified itself as `mav`, located its own source vector (`packages/canon/src/agents/mav.ts`),
enumerated **all twenty-five dimensions** with declared-vs-effective values, and classified five
divergences by cause — `profile-projection`, `env-conditioned` ×3, `harness-override` — in the
skill's own formalism (`{ ⟨o, why(o)⟩ | o ∈ div }`, `why ∈ K_cfg`), then correctly declined to
reconcile any of them. It also observed, unprompted and correctly, that it held **no `carry-on`
elevation** and that memory was neither `wake`-loaded nor `dream`-consolidated this session.

That is the agent behaving as the agent, executing a canon skill, on a harness nothing was adapted
for.

**Two honest qualifications.**

1. **Identity was carried by a flag, not by a name.** `--append-system-prompt` binds the persona to
   one launch. Nothing about the session says "this is mav" to the harness, which is why
   `scopable` fails and every enforcing fragment degrades to `steer` (above).
2. **Some of what looked like persona was corpus.** The introspect run reported dimensions that are
   _not in the appended file_ — `Provenance`, `Modalities`, `Trigger`, `Heuristics` — because it
   **read the canon source** to get them. The cell and the corpus were both reachable, and the run
   cannot separate their contributions. The same masking effect as the paired probes. A clean test
   of persona-alone must run where the corpus is not on disk.

## What this shard found that it was not looking for

Running `introspect` under omp reported `Output-Format: structured-decision` while the **deployed**
`~/.claude/agents/mav.md` on this host said `code`. That was true, and it opened a chain:

1. Ten deployed files on `fire` had drifted from the corpus — including `agents/mav.md` and
   `skills/wake/SKILL.md`, **the cell this session's own `/wake` executed**, which carried a
   superseded `catch-up` law (`dream ≺ proceed`, since replaced by `REPORT(owed) ∧ proceed`).
2. `deploy-drift-notice` was installed and wired on `SessionStart`, and said nothing.
3. **Because the deployed copy of that hook globs `"$root"/.render*` for the render tree, and the
   tree is now `.cratylus/claude`.** The corpus had already fixed the glob — its own header
   documents the defect — but the fix lives in the corpus, and the host never received it.

> **The guardrail against running a stale projection is itself deployed, so a host that misses one
> deploy can go permanently blind to the fact — and its silence is indistinguishable from
> "in sync".** This is a bootstrapping defect in the fleet-deployment design, not a bug in the
> hook's logic. It is not an omp finding and belongs to whoever owns fleet deployment; it is
> recorded here only because this shard is where it surfaced.

Repaired on this host: `pnpm canon:deploy` → deployed tree now byte-identical to the render tree,
which itself regenerated with no diff (the committed oracle was correct; only the host was stale).
The repaired hook was then verified against **both** fixtures — synthetic drift in
`agents/mav.md` produced a full `DEPLOY DRIFT` report naming the superseded line, and the restored
tree produced silence.

## What omp offers that Claude Code does not

- `memory.backend = off|local|hindsight|mnemopi` and `providers.memoryModel` with local models
  (`qwen3-1.7b`, `llama3.2:3b`, `gemma-3-1b`, `qwen2.5-1.5b`, `lfm2-1.2b`) — the consolidation-model
  binding W4 named as the thing to harvest, shipped.
- `collab.relayUrl = wss://my.omp.sh` + `omp join` — `provisional-mailbox`'s stated intention.
- `--from-claude` / `--from-codex` session import — the continuity seam.
- Multi-vendor inference with per-role selection (`--model`, `--smol`, `--slow`, `--plan`), plus
  `--profile`, `--hook`, `-e/--extension`, `omp plugin install|link`, ACP server mode.
