# t-omp-launch-spec-carrier

> The profile carrier conflated identity with environment. Move the persona to a launch spec
> under a harness-neutral `~/.agents/` root, and delete the profile path rather than keep it.

## Why

`t-omp-agent-extension` read `omp --profile <name>` as this harness's `claude --agent <name>`
and projected each persona into `profiles/<name>/agent/APPEND_SYSTEM.md`. The reading was
wrong in one specific way: **an omp profile is an environment, not an identity.** It silos
auth (`agent.db`), MCP, model prefs, sessions, logs and config, and it inherits nothing from
the default profile but keybindings (`omp://config-usage.md` — "A profile sees only its own
OMP config, never the default profile's agent config").

Measured cost, on two hosts:

- **`fire`** — `cratylus install --harness omp` created ten profiles, each with its own
  `agent.db` holding **zero** credential rows, and the operator's own MCP config
  (`~/.omp/agent/mcp.json`: linear · slack · jobnimbus · shadcn) invisible under every one of
  them.
- **`upmav`** — the `mav` profile's `mcp.json` was a **byte-duplicate** of the default
  profile's 17-server org config, hand-copied because profile scope silos it. Its
  `config.yml`, `managed.yml`, `models.yml` and `.env` were duplicated for the same reason.
  Both copies already carried the same `disabledServers` entry: a drift pair waiting.
- The first run in a fresh `mav` profile returned **`401 User not found`** (§ 2 of `DELTA.md`),
  which is the same fact stated as an error message.

And the skills half compounded it: because omp's native config root is profile-scoped, a
corpus whose skills are shared by every agent had to be copied into every profile — the
11-way fan-out `t-omp-scope-activated-hooks` shipped.

## What replaces it

**Identity is the LAUNCH SPEC. Environment stays the profile. They are orthogonal.**

| artifact         | destination                                     | how the harness reads it                                          |
| ---------------- | ----------------------------------------------- | ----------------------------------------------------------------- |
| skills           | `~/.agents/skills/<skill>/SKILL.md`             | natively, no flag — the vendor-neutral `.agent[s]` provider       |
| face             | `~/.agents/<agent>/APPEND_SYSTEM.md`            | `--append-system-prompt <file>`                                   |
| overlay          | `~/.agents/<agent>/omp.yml`                     | `--config <file>`, naming that persona's `extensions/` dir        |
| mechanism module | `~/.agents/<agent>/extensions/<bin>-session.ts` | loaded by the overlay above                                       |
| session module   | `~/.omp/agent/extensions/<bin>-session.ts`      | natively — a bare `omp` that named no persona still gets governed |
| launcher         | `~/.agents/<agent>/omp-launch` (0755)           | the operator runs it                                              |

`omp --profile work` remains available to anyone who wants an isolated environment. It is no
longer how a persona is named.

## Accept

1. `--harness omp` writes no `profiles/` path at all, and `deploy --check` reports in sync.
2. The launcher, run from a sandbox `--home`, answers AS the persona, loads the corpus's
   skills, and loads that persona's mechanism module — verified against the installed `omp`
   binary, not a stub.
3. claude's projection is untouched.

---

# Result — 2026-09-10 (AAI-6)

## Shipped

`ompProfileDir` is gone with every destination that used it. The port carries the change:
`skillRel` collapsed to ONE destination (the `agents` argument survives for claude/codex),
`enforcingRel` became **`scopedRel`** because the same op now places a module, an overlay and
a launcher, and `HarnessProjection` gained `executable?` so the launcher lands 0755.

Two path facts were measured rather than assumed, and they decide the design:

- **`omp.yml` cannot carry `$HOME`.** A literal `$HOME` segment in a config value is not
  expanded — it loads as a directory named `$HOME` (`Failed to load extension /cwd/$HOME/…`).
  A relative entry resolves against the LAUNCH process's cwd, not the overlay's own dir. So
  the overlay carries a `{{scopeDir}}` token that deploy substitutes with the real
  `--home`-derived absolute path, the one moment that path is known.
- **`omp-launch` must not.** A shell script has a shell, so it resolves its own directory
  (`$(dirname -- "$0")`) and is correct wherever it landed — including a sandbox `--home` it
  was never told about.

The overlay names the persona's `extensions/` **directory**, not the session module by name:
omp's `collectAutoExtensionEntries` sweeps every loose `.ts`/`.js` inside a directory entry,
so a persona that later gains its bound guardrail module keeps loading both. Naming one file
would have dropped the other silently, which is what the profile's own directory scan never
did.

## Two defects the real binary caught that a stub could not

1. **Every registration in every emitted module died at load.** The renderer emitted
   `pi.exec(cmd, { shell: true })`, but `HookAPI.exec(command, args, options?)` requires
   `args` and does `ptree.exec([command, ...args])` — so omp spread an object and threw
   `Spread syntax requires ...iterable[Symbol.iterator] to be a function`, twice per launch.
   There is no `shell` option at all (`ExecOptions` is signal · timeout · cwd). Now
   `pi.exec("sh", ["-c", cmd])`, which is also what expands the `$HOME` in a worker command.
   Yesterday's bun smoke test stubbed `pi.exec` and reported eight healthy registrations.
2. **A missing worker BLOCKED the session.** `sh -c` returns 127 when the worker is not
   there, the blocking branch read any non-zero as a verdict, and so `ask` and `task` were
   refused with `No such file` as the reason — a governance mechanism bricking the session it
   governs, on any host whose workers had not landed yet. 127 now returns without a verdict,
   which is what the cells themselves say (`fail-open ∀error`).

## Verified

- `cratylus project --harness omp` → 10 agents, 13 skills, 3 hooks, 0 warnings; `grep -rn
"profiles/" packages/forge/src` is empty for destinations.
- Sandbox deploy → `.agents/<agent>/{APPEND_SYSTEM.md,omp.yml,omp-launch,extensions/}` ×10,
  `.agents/skills/` ×13, `.omp/agent/extensions/` for the session scope, and `.omp/hooks/` for
  the workers. No `profiles/` directory is created.
- **The deployed launcher, run against the installed `omp`:** answered `mav`; listed exactly
  the 13 deployed skills from `~/.agents/skills` (natively, with no `skills.customDirectories`
  entry anywhere); emitted no extension error.
- **The mechanism fires through omp's own event bus.** With the sandbox as `$HOME`, a
  `session_start` in that launch executed the deployed `deploy-drift-notice` worker —
  observed by instrumenting the DEPLOYED worker (not the module under test) and seeing its
  marker appear.
- Full gates: forge 41 files, canon 34, memory 16, runtime 6, schema 1; biome clean;
  typecheck + typecheck:test clean; render oracle re-baselined across all three harnesses.

## Also found, and fixed, because the cutover surfaced it

**A deleted cell kept projecting.** `index.ts` hands the loader DIRECTORIES (`skills:
dir('./skills')`) resolved against the BUILT module, and canon's build was `tsc` alone —
which never removes an output whose input is gone. Deleting three cells and rebuilding still
projected sixteen skills. The build now cleans first, and `projection-stability.test.ts` reads
the two rosters (`dist/skills` vs `src/skills`) so the failure names the stale cell rather
than a count.

## Not claimed

The skills leg is verified natively at `~/.agents/skills` on a real `$HOME` (a marker skill
loaded with no flag and no profile) and again in-sandbox with `$HOME` redirected. A deploy to
a sandbox `--home` read with the operator's real `$HOME` cannot see those skills — the neutral
root is home-anchored by the harness, and that is the harness's rule, not a defect here.
