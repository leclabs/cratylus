# cratylus

The command. One package, one bin, and the only executable in
[cratylus](../../README.md) — everything it composes is an ordinary ESM library.

```sh
npm install -g cratylus
```

## What it composes

| package             | what it contributes                                          |
| ------------------- | ------------------------------------------------------------ |
| `@cratylus/forge`   | the build surface — resolve a corpus, render it, place it    |
| `@cratylus/runtime` | capability dispatch — what deployed skills call back into    |
| `@cratylus/canon`   | the default corpus, imported so it resolves wherever this is |

This is the only package permitted to know all three. `forge` projects and depends
on no corpus; `canon` is a corpus and knows no projector; a consumer wants one
install. That composition is the whole of what this package adds.

## Use

```sh
cratylus install              # put the default corpus on this machine, no project needed
cratylus init                 # write a cratylus.config.ts naming a corpus
cratylus project              # render the resolved corpus into a render tree
cratylus deploy               # place a render tree into a harness
cratylus deploy --check       # is the deployed tree still what the corpus says?
cratylus explain <filter>     # where each resolved value came from
```

Capability verbs route to the runtime and are what deployed skills invoke:

```sh
cratylus memory encode --name mav --body '…'
cratylus eventTap status
cratylus carryOn status
```

## Choosing different capability providers

The bundled set is `@cratylus/memory`. To use another, declare it in
`~/.cratylus.json`:

```jsonc
{
  "resolveFrom": "/path/to/the/install/site",
  "capabilities": ["@acme/my-memory"],
}
```

A provider is an ordinary package exporting `runtimePlugin`. `resolveFrom` names
the directory whose `node_modules` the specifiers resolve against — under an
isolated store a globally installed bin cannot see a package it does not declare,
so resolving from the install site is what lets a third-party strategy load.

**Declaring any capability replaces the bundled set** rather than merging with it.
List `@cratylus/memory` alongside yours if you want both.
