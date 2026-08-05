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

## Use

The command is `cratylus-run <capability> <verb> [args]`. The bundled default set is the memory
capability:

```bash
cratylus-run memory encode --name <agent> --body 'what happened'
cratylus-run memory read   --name <agent>

cratylus-run tap status         # the event-tap capability: install · uninstall · read · status

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
