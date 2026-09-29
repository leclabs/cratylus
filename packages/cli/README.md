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

Capability verbs route to the runtime and are what deployed skills invoke. Its four
capabilities — `eventTap`, `design`, `plan` and `note` — are built into it, so there
is no provider to install or declare:

```sh
cratylus eventTap status
cratylus design show
cratylus design define 'record id' --gloss '…' --author … --reason … --cause …
cratylus plan show
cratylus plan add u1 --plan p --realizes 'record id' --plan-realizes 'record id' --author … --reason … --cause …
cratylus note show
cratylus note capture 'a title' --kind … --topic … --body '…' --blocks 'u1 of plan p' --author … --reason … --cause …
```

## The host runtime config

`cratylus` reads one per-host file, `$AGENT_RUNTIME_CONFIG`, else `~/.cratylus.json`.
`cratylus deploy --harness <h>` (and `cratylus install`, which deploys) writes into it
the corpus's parts — the event vocabulary under `events` and each capability's
`configuration` — and its own harness's stanza, `harnesses.<h>.native`: that harness's
name for each event it can fire. It leaves every other harness's stanza as it found
it, so deploying for Claude and then for omp leaves both harnesses' names in the same
file:

```jsonc
{
  "events": { "vocabulary": ["session.start", "turn.end", …] },
  "harnesses": {
    "claude": { "native": { "turn.end": "Stop", … } },
    "omp": { "native": { "turn.end": "session_stop", … } },
  },
}
```

A command that needs a harness's native names asks for that harness's stanza and
refuses when it has none, naming `cratylus install --harness <h>` (works on a bare
host) and `cratylus deploy --harness <h>` (from a project). `cratylus eventTap` asks
for `claude`'s.

## The host's model routing on omp

An omp agent definition names the role it holds and never a model:
`model: ["@architect", "@default"]` reads "route by `architect`, else by `default`". Which
model fills a role is the host's choice, and omp keeps that choice in
`~/.omp/agent/config.yml` (or `config.yaml`, read only when `config.yml` is absent) under `modelRoles`:

```yaml
modelRoles:
  default: anthropic/claude-opus-5-5:high
  task: "@default"
  architect: "@default"
```

`cratylus install --harness omp` reads the roles the installed agents hold and, for each
one `modelRoles` has no key for, adds an entry aliasing the nearest built-in omp role:
implementer to `@task`, planner to `@plan`, assayer and architect to `@default`. It
prints one `<role>: "@<alias>"` line per entry it added, with the file's path, or says
that no entry was missing. `--dry-run` prints the same entries as would-add and writes
nothing.

An entry the host already has is never changed, whether it is an alias or a concrete
model id, quoted or plain, so pointing a role at a model is done in that file and
survives every later install. The file is the host's: install inserts lines and never
re-serializes it, so its comments, key order and quoting stay as they were. It edits the
file omp reads: `config.yml`, else `config.yaml`. It creates `config.yml` only when the host has
neither, so it never shadows a `config.yaml` that holds the host's own settings, and it
appends a `modelRoles:` block when the file has none. When `modelRoles` is
a flow mapping (`{…}`), a scalar, or carries an anchor or alias, install says it did not
edit the file and still succeeds; an agent whose role has no entry then runs on the
`default` role (`modelRoles.default`). `cratylus deploy`
never touches `config.yml`.
