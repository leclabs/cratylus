# CLI audit — what the help claims vs what the code does

> Taken at `2b15faaa`, 2026-08-06, over `packages/forge/src/cli/**`, `packages/cli/src/**`,
> `packages/runtime/src/**`. **These are facts about the code as it stands**, independent of any
> redesign — a proposal that is rejected does not make a wrong `--help` string right.
>
> Severity is about **user harm**, not tidiness: `bug` = wrong behaviour, `silent` = wrong
> behaviour that reports success, `doc` = the code is right and the words are wrong.

## The ones that are actual defects

| #   | sev        | where                           | what                                                                                                                                                                                       |
| --- | ---------- | ------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| 9   | **silent** | `deploy/deploy.ts:100-109`      | `--kind` is not validated. `--kind bogus` falls through the branch chain and **silently deploys agents**. An unknown kind should refuse.                                                   |
| 10  | **silent** | `deploy/deploy.ts:184-187`      | `--scope` is not validated either — anything that is not the literal `'project'` is treated as user scope, so `--scope porject` writes to `$HOME`.                                         |
| 13  | **bug**    | `deploy/deploy.ts:240`          | `unregisterHookCommandsAt` hardcodes `settings.json`, ignoring `adapter.hooksFile`. Codex's is `hooks.json`, so **stale codex hook registrations are never unregistered**.                 |
| 11  | **bug**    | `deploy/bundle.ts:104-115`      | `--assets` staging copies files into the render tree with **no `dry` guard**, so `--dry-run` — documented as "change nothing" — writes.                                                    |
| 12  | **bug**    | `commands/deploy.ts:123`        | `adapterByName(...)` sits **above** the `try` at :139, so an unknown `--harness` is an uncaught throw on the non-check path. The check path was already fixed for exactly this (:313-319). |
| 19  | **bug**    | `cli/commands/project.ts:45,58` | `loadConfig` and `adapterByName` are unwrapped — a malformed config or bad harness produces an unhandled rejection, not an exit code. Every sibling command catches.                       |

## The ones that mislead

| #   | sev | what the help says                                            | what is true                                                                                                                                                                                                                        |
| --- | --- | ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 3   | doc | `deploy` — "into the local `.claude/` root"                   | the root is `adapter.home`; `--harness codex` makes it `.codex`. A harness is hardcoded into the summary of the command that takes `--harness`.                                                                                     |
| 4   | doc | `deploy` — "(agents/ + skills/)"                              | default `--kind all` also deploys **hooks**, and requires `--hooks-dir` or it exits immediately.                                                                                                                                    |
| 5   | doc | `deploy` — "**Place** a projected render tree"                | it also **deletes** pruned artifacts and **unregisters** `settings.json` entries. Neither appears in any help string.                                                                                                               |
| 6   | doc | _(nothing)_                                                   | every non-dry `deploy` writes **`$HOME/.cratylus-run.json`** — outside `.claude`, outside the scope root, outside every documented flag.                                                                                            |
| 7   | doc | `--config` default `<cwd>/cratylus.config.ts`                 | actually `<--project or cwd>/cratylus.config.ts`.                                                                                                                                                                                   |
| 8   | doc | `--project` is "project root for `--scope project`"           | it also relocates config lookup **at user scope**.                                                                                                                                                                                  |
| 1   | doc | `compose --dry-run` — "print the resolved set; write nothing" | `compose` never writes under any flag. The flag's only effect is **suppressing a note that says nothing was written**.                                                                                                              |
| 2   | doc | _(the note itself)_                                           | the default path prints a note advertising a write that no version implements.                                                                                                                                                      |
| 14  | doc | `explain [agent]`                                             | does not filter agents — substring-matches **fragment IDs**. The source header and the runtime note both admit it; the help does not.                                                                                               |
| 15  | doc | `catalog [agent]`                                             | same, **and silently ignored entirely** in `--corpus` mode.                                                                                                                                                                         |
| 16  | doc | `catalog --corpus` "(default: canon's src/dimensions)"        | `--corpus` has no default. The fallback probes a sibling directory relative to the installed forge package — which **cannot exist in a published package** (`files: ["dist"]`). The documented default is a monorepo-only artifact. |
| 17  | doc | `catalog --json` "the machine contract"                       | two different JSON shapes depending on which mode was selected.                                                                                                                                                                     |
| 18  | doc | _(nothing)_                                                   | `project` always writes **and prunes** `--out`; there is no `--dry-run`.                                                                                                                                                            |
| 20  | doc | _(nothing)_                                                   | `extends: []` is a hard failure (rc 1), though it is arguably a valid config.                                                                                                                                                       |
| 25  | doc | `init --plugin` "(default: the canon corpus)"                 | the default is the literal specifier `'@cratylus/canon'`, never shown; and **no package is read, resolved, or installed** — `init --plugin does-not-exist` succeeds.                                                                |
| 26  | doc | `add` — "already in extends"                                  | the check inspects only the **import line**. A config with the import but no `extends` entry reports as wired and is never repaired.                                                                                                |
| 21  | doc | `optimize --plan … required`                                  | modelled as an option, so it parses fine and fails at runtime.                                                                                                                                                                      |
| 22  | doc | `optimize --manifest` "default `.manifests/<source>.json`"    | actually `<dirname(source)>/.manifests/<basename(source)>.json` — source-relative, not cwd-relative.                                                                                                                                |
| 23  | doc | `optimize --out` "artifact output dir"                        | artifacts with an absolute `path` in the plan bypass it entirely.                                                                                                                                                                   |
| 24  | doc | _(nothing)_                                                   | the plan is JSON with a **mandatory `register` block** whose shape appears only in an error message.                                                                                                                                |

## The program does not know its own name

**#28.** The bin is `cratylus`. `forge` — a program that has never existed under that name — appears
**16 times across 6 files**, of which **10 are user-visible**. Measured, roster below, reproducible:

```sh
git grep -n forge -- packages/forge/src/cli packages/forge/src/config \
  | grep -E '`forge |'\''forge |forge:|forge — '
```

**Reaches a user's terminal — 8:**

| site                                      | string                                                                                                     |
| ----------------------------------------- | ---------------------------------------------------------------------------------------------------------- |
| `cli/index.ts:304`                        | `forge: unknown command '<x>'` — the unknown-command error, the one place a user learns the program's name |
| `cli/commands/add.ts:25`                  | `forge add: <msg>`                                                                                         |
| `cli/commands/project.ts:40`              | `run forge init first`                                                                                     |
| `cli/commands/optimize.ts:91,103,111,117` | `forge optimize: …` ×4                                                                                     |
| `config/scaffold.ts:140`                  | ``no cratylus.config.ts — run `forge init` first``                                                         |

**Written into the user's own config file — 2**, and these are the worse ones, because they persist
in a file the user owns and will read long after the session that generated it:

| site                    | string                                                       |
| ----------------------- | ------------------------------------------------------------ |
| `config/scaffold.ts:59` | `// forge — config is code. This is the SINGLE config home.` |
| `config/scaffold.ts:62` | ``// Wire more plugins with `forge add <package>`.``         |

The remaining **6** are source comments (`add.ts:1`, `init.ts:1,7`, `optimize.ts:2`,
`project.ts:111`, `index.ts:296`) — wrong, but they reach no one outside the repository.

The existing census (`bin-name-single-home.test.ts:437-440`) cannot catch these: it matches the
bare token pattern against `FORGE_BIN`, and `FORGE_BIN` is `cratylus`, so a literal `forge` in a
`cac`-coloured string is invisible to it. **A gate that checks the name is right cannot see a
different name that is wrong.**

## Structural findings

**Config resolution is duplicated seven times.** `compose.ts:59`, `project.ts:37`, `explain.ts:124`,
`catalog.ts:214`, `commands/deploy.ts:189`, `scaffold.ts:98`, `scaffold.ts:137` each independently
compute the same thing, and `deploy`'s differs from the other six. There is **no shared resolver**,
no walk-up, and exactly one accepted filename (#27). Every `runX` takes an `opts.cwd` that no CLI
action ever passes — it exists for tests only.

**Absence means seven different things.** With no config: `init` creates it · `add` fails · `compose`
fails · `project` fails · `explain` fails · `catalog` **silently switches mode** · `deploy` **warns
and proceeds**. No two of these agree, and only one of them is documented.

**`optimize` is the last verb of a deleted flow.** Its own header calls it "the exemplify leg of the
documented import → optimize → compile flow" — and `cli/index.ts:297-299` records that both `import`
and `compile` were deleted, along with `lint`, `diff`, `watch`, `migrate`, **`doctor`** and `events`.
It is corpus authoring, not projection, on a package whose own manifest says it "owns the mapping and
nothing else."

## The plugin contract is half-built

**The documented build face does not exist.** `ARCHITECTURE.md:137` and `runtime/src/plugin.ts:8,10`
both describe a two-named-export contract — `buildPlugin` and `runtimePlugin`. `git grep buildPlugin`
returns **four hits, every one of them prose**. No package exports it; no consumer imports one. What
forge actually consumes is an unnamed `default` export, validated by a single structural test
(`Array.isArray(v.extends)`).

**The capability keyspace is closed.** `CAPABILITIES = ['memory','eventTap','carryOn','heartbeat']`
is a fixed tuple in `runtime/src/loader.ts:35-40`. A third party cannot add a capability without
editing the runtime. Of the four:

| capability  | reality                                                                               |
| ----------- | ------------------------------------------------------------------------------------- |
| `memory`    | a real plugin — the only one that reaches the dispatcher through `RuntimeHost`        |
| `eventTap`  | a **hardcoded string intercept** in `main.ts:105`, before any host exists             |
| `carryOn`   | a **hardcoded string intercept** in `main.ts:130`, before any host exists             |
| `heartbeat` | **no provider, no dispatch route** — a keyspace member and a port field, nothing else |

`event-tap/index.ts:55` exports a `runtimePlugin` that **nothing imports**.

**Declaring a capability silently drops the bundled ones.** `invoke/src/bin.ts:83` is
`(await discoverConfigured()) ?? BUNDLED` — a replacement, never a merge. A third party who declares
`["@acme/my-memory"]` loses `@cratylus/memory` and is told nothing.

**Nothing writes the `capabilities` array.** `deploy` emits only the `events` half of
`~/.cratylus-run.json` (`commands/deploy.ts:204-208`); the array survives across deploys only via
`readPriorCapabilities`. Registering a third-party capability requires **hand-editing JSON** —
which is the whole of the documented path (`invoke/README.md:124-129`).

## What has no tests

`cratylus` — the package that owns the `cratylus-run` bin — has **no test directory** and no
`test` script. Its 432-line `install.ts`, which writes executables onto a host's `PATH`, is
exercised only indirectly.
