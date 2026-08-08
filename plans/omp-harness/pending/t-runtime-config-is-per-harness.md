# t-runtime-config-is-per-harness

**Defect, found 2026-08-07 by deploying a second harness to a host that already had one.**

## What happens

`~/.cratylus.json` is the host's runtime configuration, and it carries the canonical →
NATIVE event map every runtime capability resolves through. **Its path has no harness
dimension.** Writer and reader compute the same single home-level file:

- `forge/src/deploy/runtime-config.ts:53` — `join(homedir(), RUNTIME_CONFIG_NAME)`
- `runtime/src/runtime-config.ts:79-83` — `runtimeConfigPath()`, the same expression

So **the last harness deployed wins the whole host.** `cratylus deploy --harness omp` on a
machine that also runs Claude Code silently repoints `turn.end` from `Stop` to `agent_end`,
and every Claude Code capability on that host then emits omp's native names.

## How it surfaced, which is the part worth keeping

It was not found by reading. `carry-on` elevated with `--event turn.end`, resolved it
through the freshly-omp-ified config, and wrote a `Stop`-shaped gate into
`~/.claude/settings.json` under the key **`agent_end`** — an event Claude Code never
fires. **The gate was inert for the rest of the session**, and the elevation's own
read-back check reported `attached: true` because it verified the hook was WRITTEN, never
that it was written under an event this harness fires.

That is the corpus's own lesson turned on itself: _a mechanism beats an assertion_ — but
only if the mechanism is wired to a moment that occurs. It also reached a commit
(`2e57f381`) before anyone noticed, because a settings file with a plausible-looking hook
in it reads as correct.

## Why it did not bite before today

Until the omp adapter landed, `fire` had only ever had `claude` deployed to it, so the
single file was always the right harness's by accident. **omp is the first second
harness to reach a shared host**, which is exactly the condition the design never had.

## What to build

1. **Scope the config to the harness.** Either `~/.cratylus/<harness>.json`, or one file
   keyed by harness with the reader selecting its own. The reader must know which harness
   it is running under, which is the real question — a capability today does not.
2. **Deploy must not clobber another harness's entry**, the way the placer already only
   removes what its own manifest attributes to it.
3. **A gate that catches the wiring, not the writing.** `carry-on`'s read-back proves a
   hook landed; nothing proves the event NAME is one the target harness fires. The
   adapter already publishes `nativeEvents` — a hook emitted for harness H whose event is
   not in H's map should be a loud refusal.

## Accept

1. Deploying omp on a host with claude deployed leaves claude's `turn.end` → `Stop`
   intact, and vice versa — verified by deploying both and reading the config back.
2. A capability resolving an event under harness H gets H's native name, with H
   determined by something other than "whatever was deployed last".
3. A hook emitted under an event its target harness does not fire FAILS, naming the
   event, the harness, and the map it was checked against. Both fixtures.

## Note on scope

This is a **product defect**, not an operations one: any consumer who installs cratylus
for two harnesses on one machine hits it. It belongs in the published packages.
