# @cratylus/invoke

The **run-time entry** of [cratylus](../../README.md) — the one package a consumer installs
globally to give an agent the capabilities it invokes while it is running.

A consumer meets this system at two different times, and they are not the same entry. At build time,
[`@cratylus/forge`](../forge/README.md) authors, resolves, projects and deploys a corpus. At run
time, this package composes [`@cratylus/runtime`](../runtime/README.md) with its declared capability
plugins and ships them as an installable command.

`invoke` sits at the **top of the dependency graph**: nothing depends on it. It is a verb, and verbs
decode as leaves — nobody imports an action for its contracts.

## Install

```bash
npm install -g @cratylus/invoke
```

### From a checkout — `cratylus-run install`

A development host runs the bin out of a checkout rather than a registry, and until
2026-08-05 it reached `PATH` through a `pnpm link --global`: a relative symlink into
the checkout that **no artifact in this repository authored**. Renaming the workspace
directory stranded it, every deployed skill shim died inside node's module loader,
`/wake` could not run — and the repository was green and clean throughout, because
nothing here had ever claimed the binding.

The binding is now an artifact of this repository:

```bash
node <checkout>/packages/invoke/dist/bin.js install
```

It writes an executable `cratylus-run` — a real file, `#!/bin/sh` + `exec node <entry>`,
never a symlink — and then **proves it runs** with `--version` before reporting success.

| flag             | effect                                                                            |
| ---------------- | --------------------------------------------------------------------------------- |
| `--dir <bindir>` | destination (default `$CRATYLUS_BIN_DIR`, else `$PNPM_HOME`, else `~/.local/bin`) |
| `--entry <path>` | the run-time entry to bind (default: the executing bin)                           |
| `--force`        | replace a file at the destination this verb did not author                        |
| `--print`        | write the shim to stdout and install nothing                                      |

**Moving or re-cloning the checkout? Re-run it. That is the whole recovery.**

The shim carries an absolute path, and that is not an oversight: once the checkout
moves, nothing on this host knows where it went, so no recorded form of the path could
find it. What is guaranteed instead is that a stale binding **fails legibly** —

```
cratylus-run: UNAVAILABLE — the run-time capability is not installed on this host.

  this command   /Users/lex/.local/share/pnpm/bin/cratylus-run
  its entry      /Users/lex/workspaces/OLD-NAME/packages/invoke/dist/bin.js
  status         that file does not exist
  …
  node <checkout>/packages/invoke/dist/bin.js install
```

— rather than dying in `cjs/loader` from a file no one remembers exists. Exit `127`.

**Symlinking a package-manager bin shim does not work**, and it cost a recovery to
learn: such a shim resolves its target relative to its own `basedir`, so a symlink
re-anchors that basedir and the shim points at a path that does not exist. Nor is
`pnpm link --global ./packages/<pkg>` the right instrument inside a workspace — run
from the root it rewrites `package.json`, `pnpm-workspace.yaml` and the lockfile,
purges the root `node_modules`, and _then_ fails resolving `workspace:*` deps.

**The other half of this repair lives in `forge`.** `cratylus deploy` places skill
shims that `spawnSync('cratylus-run', …)`, and after placing them it executes
`cratylus-run --version` and refuses — non-zero, in capability terms — if it does not
come back. The probe is `--version` and **not `which`**: `which` was satisfied by the
stranded shim the entire time the capability was dead. The two halves share no import;
`invoke` authors the binding, `forge` refuses to ship against a broken one.

## Use

The command is `cratylus-run <capability> <verb> [args]`. The bundled default set is the memory
capability:

```bash
cratylus-run memory encode --name <agent> --body 'what happened'
cratylus-run memory read   --name <agent>

cratylus-run eventTap status    # the event-tap capability: install · uninstall · read · status

cratylus-run --help
cratylus-run --version
```

**The bin is `cratylus-run`, not `invoke`.** Two things are going on there. `invoke` could not _be_
the bin: `pyinvoke` already installs `invoke` and `inv` on `PATH`, and a package name is scoped and
cheap while a bin name is global — the two were derived separately for that reason. And the bare mark
`cratylus` went to the build-time bin, [`@cratylus/forge`](../forge/README.md)'s, because that is the
surface a **human** types. This one is invoked almost entirely by generated artifacts: the projected
`scripts/<capability>.mjs` shims and the generated hook workers. Spending the brevity budget on a
machine-written call site would be backwards.

This package owns the `bin` key because npm reads that manifest with no compiler in the loop. Every
other site interpolates `RUNTIME_BIN` from the runtime, and `bin-name-single-home.test.ts` holds the
two in agreement so a rename cannot half-land.

Exit codes come from the dispatcher: `0` on success, `1` for a verb that threw, `2` for an unknown
capability or verb — reported with the set that _is_ available, never a silent no-op.

## Why this package exists

To break a dependency cycle. Every capability package depends on the runtime for its contracts, so
the runtime cannot declare the capabilities. `invoke` is the third package that depends on **both**
and wires them by static import.

That is not a formality. Capability resolution used to be **ambient**: the runtime dynamic-imported
`@cratylus/memory` as a bare specifier while declaring no dependency on it, which resolved only
because a retired installer flat-co-installed both packages into one `node_modules`. A plain global
install therefore got no memory capability at all, and an isolated store broke resolution outright.
Resolution now succeeds because the dependency is **declared**.

## Choosing different providers

The bundled set is a default, not a fixture. A host that declares providers in its runtime config —
`$AGENT_RUNTIME_CONFIG`, else `~/.cratylus-run.json` — overrides it entirely:

```jsonc
{
  "resolveFrom": "/path/to/the/install/site",
  "capabilities": ["@acme/my-memory"],
}
```

`resolveFrom` is the directory whose `node_modules` those specifiers resolve against — normally the
site that installed them. Under an isolated store, a globally-installed bin cannot see a package it
does not declare, so resolving from the install site is what lets a third-party strategy load at all.
That is what makes a `MemoryStrategy` genuinely swappable rather than merely plugin-shaped.
