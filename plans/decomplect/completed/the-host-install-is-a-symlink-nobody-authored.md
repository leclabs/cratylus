# The run-time bin reaches the host by a hand-made symlink, and renaming a directory strands it

> Found 2026-08-05 the expensive way: the operator renamed the workspace directory, and **`/wake`
> died before it could run** — every agent on this host lost its memory capability at once, silently,
> with the repository green and the tree clean.

## Symptom

The projected thin shim `~/.claude/skills/*/scripts/memory.mjs` does `spawnSync(RUNTIME_BIN, …)`.
`RUNTIME_BIN` reaches `PATH` through a `pnpm link --global`, which is a symlink into the checkout:

```
~/.local/share/pnpm/global/v11/…/node_modules/@<retired-scope>/<retired-pkg>
  -> ../../../../../../../../workspaces/<OLD-DIR-NAME>/packages/<retired-pkg>
```

Rename the workspace directory and that relative symlink points at nothing. The shim then dies with
`MODULE_NOT_FOUND` — not a diagnosable "capability unavailable", a node stack trace out of
`cjs/loader`, from a file no one remembers exists.

**Two independent staleness layers were stacked**, and either alone is fatal:

1. the global link, stranded by the directory rename;
2. the **deployed** shims still spawning the pre-migration bin name while the render says
   `cratylus-run` — i.e. `pending/deployed-drifts-from-rendered-unwatched.md`, observed live, in the
   act of breaking something.

## Why nothing caught it

`bin-name-single-home.test.ts` proves the bin name has one home and that the **rendered** shim spawns
it. Nothing asserts that the named bin is **resolvable on the host that runs the shim**. The gate
covers the string; the failure is in the binding.

There is also no install mechanism to blame. The `install-parity` plan records that the installer
was retired — that plan was **deleted with the rest of `plans/.retired/` on 2026-08-05**, so the
citation is now `git show 61b85db7^:plans/.retired/install-parity/PLAN.md` rather than a live path.
`packages/invoke/README.md` documents the consumer path as
`npm install -g @cratylus/invoke` — correct, and not yet available, because nothing is published.
So the development host runs on a link **no artifact in this repository authored**, which is why
nothing in this repository could notice it break.

## Two traps, measured, that cost the recovery

- **`pnpm link --global ./packages/<pkg>` is the wrong instrument in a workspace.** Run from the
  root it adds a `dependencies: { "<pkg>": "link:packages/<pkg>" }` entry to the root `package.json`,
  rewrites `pnpm-workspace.yaml` and the lockfile, **purges the root `node_modules`**, and _then_
  fails resolving `workspace:*` deps — leaving the tree worse than it found it. Reverted with
  `git checkout` + `pnpm install`.
- **Symlinking the global bin at `node_modules/.bin/<bin>` does not work.** A pnpm bin shim resolves
  its target relative to its own `basedir`, so a symlink to it re-anchors that basedir and the shim
  points into `~/.local/share/pnpm/@scope/pkg/dist/bin.js`, which does not exist. The working form is
  a real file: `#!/bin/sh` + `exec node "<abs>/packages/invoke/dist/bin.js" "$@"`.

What was **not** affected, and is worth recording as the thing that was designed right: memory data
lives at `~/.agents/<name>`, keyed by agent name. It survived the rename untouched. The capability
broke; the state did not.

## The hand-made recovery is the defect, not the repair

The host works today only because a **hand-authored 86-byte file** was written during recovery:

```sh
#!/bin/sh
exec node "/Users/lex/workspaces/cratylus/packages/invoke/dist/bin.js" "$@"
```

`grep -rn 'local/share/pnpm/bin' packages/ *.md plans/` → **no hits**. No artifact in this repository
authors it. And it carries an **absolute path into the checkout**, so the original failure mode —
move the workspace, every deployed shim dies in the node loader — is **reproduced identically, not
repaired**. It also points at a path `tsup` deletes and recreates under `clean: true`, which is the
suspected mechanism in `pending/memory-nudge-is-flaky-under-the-full-verify.md`.

Measured, so the gap is not restated as an impression: `cratylus` has **no `install` verb**
(8 commands declared in `forge/src/cli/index.ts`; `grep -n "'install'"` → nothing), and **no
deploy-time resolvability check** (`grep -rn 'command -v\|--version' packages/forge/src/deploy/*.ts`
→ prose comments only).

## The shape of the fix (not a prescription)

The property is a **binding**, so a static check cannot carry it alone:

1. **An install verb that authors the link**, so the host's binding is an artifact of this repo and
   can be re-run after any move. `deploy` already knows the host root; it is the natural home, and
   `install-parity` is its prior art.
2. **A deploy-time resolvability check**: after placing a shim that spawns `RUNTIME_BIN`, resolve
   `RUNTIME_BIN` and **refuse loudly** if it is absent or points outside a live checkout. A shim
   deployed against an unresolvable bin is a deploy that produced a broken artifact and reported
   success.
3. **`--version` as the probe, not `which`.** `which` was satisfied by the stranded shim throughout;
   only executing it revealed the break. Presence on `PATH` is not resolvability.

## Acceptance

- A test convicts a host where the deployed shim's bin does not execute, and **exonerates** one where
  it does — both fixtures, or the checker convicts the corpus of its own defects.
- The recovery is a documented command, not archaeology: moving the checkout and re-running it
  restores `/wake` with no hand-authored files anywhere.
- The refusal is legible at the point of failure — a capability-level message, never a node module
  loader stack.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** host-and-config · **wave** 0
- **depends on** `t-soul-to-target-in-forge`
- **writes** `packages/invoke/**`
- **compiles against** `packages/runtime/src/bin-name.ts`
- **evidence** `packages/invoke/README.md` · `packages/runtime/src/bin-name.ts`
- **dispatchable** no ruling owed
