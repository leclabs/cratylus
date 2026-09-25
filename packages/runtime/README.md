# @cratylus/runtime

The **mechanism** concern of [cratylus](../../README.md) — the per-host runtime contract leaf.

A skill has two faces: what it _means_, which is canon's, and the programmatic thing it routes to,
which is this package's. `runtime` is the generic platform beneath that second face, plus the
lifecycle guardrails an agent would otherwise drift out of.

It **depends on nothing** in this system — zero `@cratylus/*` dependencies — and knows no harness and
no corpus. It ships with the agent and runs on the host; anything corpus-specific reaches it as
configuration the projection emitted.

## Ports and strategies

The abstraction is a **port**; the interchangeable implementations are **strategies**. A capability
package declares which ports it provides as its runtime face:

```ts
import { defineRuntimePlugin } from '@cratylus/runtime';
import { myMemory } from './strategy.js';

export const runtimePlugin = defineRuntimePlugin({
  name: 'my-memory',
  memory: myMemory,
});
```

`defineRuntimePlugin` is an identity factory: it returns its argument unchanged, so a consumer
addresses the plugin and its ports by the **imported binding**, never a string id. `name` is only a
namespace segment for reporting and uniqueness.

`RuntimePlugin` is standalone and distinct from the build host's `AgentPlugin`. A capability package
exposes two named exports — `buildPlugin` and `runtimePlugin` — never one dual-hook object, which is
what keeps the build DAG and the runtime DAG from reaching across.

## Subpaths

| subpath                    | what it carries                                                                    |
| -------------------------- | ---------------------------------------------------------------------------------- |
| `.`                        | `RuntimePlugin`, `defineRuntimePlugin`, the ports, the event taxonomy              |
| `./ports/memory`           | `MemoryStrategy` — the memory protocol's verb surface as one typed contract        |
| `./ports/event-tap`        | `EventTapHost` — a harness-neutral passive observer contract                       |
| `./events`                 | `LIFECYCLE_EVENTS` (28, in canonical order) and the derived `LifecycleEvent` union |
| `./loader`                 | `RuntimeHost`, `bootstrap`, `discoverConfigured`, `CAPABILITIES`                   |
| `./dispatch`               | `dispatch`, `parseArgs`, `verbsOf`, `VerbArgs`, `DispatchResult`                   |
| `./main`                   | `runCli` — the thin `cac` CLI over loader + dispatch                               |
| `./runtime-config`         | `loadRuntimeConfig`, `runtimeConfigPath`, `RuntimeConfig`                          |
| `./bin-name`               | `CLI_BIN` — the one home for the executable's name on PATH                         |
| `./ulid`                   | `ulid`, `monotonicFactory`, `decodeTime`, `isValidUlid` — the one ULID             |
| `./capabilities/event-tap` | the event-tap capability, which ships inside the runtime rather than as a plugin   |

The `.` barrel is pure contracts plus one identity helper: no implementation.

## The three domains

Notes, design and plans are immutable records in the repository, folded when someone asks. Agents
and users meet them only through three capabilities that ship inside the runtime, each routed by
`runCli` ahead of the discovered dispatch and each with its port in the `.` barrel:

| capability | port         | verbs                                                                       |
| ---------- | ------------ | --------------------------------------------------------------------------- |
| `design`   | `DesignHost` | `show`, `define`, `amend`, `retract`, `reconcile`, `trace`                  |
| `plan`     | `PlanHost`   | `show`, `add`, `advance`, `retract`, `revise`, `bind`, `close`, `reconcile` |
| `note`     | `NoteHost`   | `show`, `capture`, `revise`, `retract`, `reconcile`                         |

Every input names an entity by name, and every output is the domain's view, in the domain's own
words. Where a merge left one name held by more than one entity, the view prints each holder's
identity beside it as `name (identity <id>)`, and that printed form is exactly the input that
addresses one holder. A write is all or nothing: it is checked and its view rendered before anything
reaches the repository, so a refusal writes nothing and exits `1` naming the verb that would succeed.
A view's header says when it includes writes not yet committed. Where no plan is in view, a unit is
printed with its plan, `u of plan p`, and that form is accepted wherever a unit is named. What
must be resolved first names its cause and what moved, lists a plan view's own items only, and
never asks of a closed plan's frozen units. When the store itself fails — no repository, a damaged
stored entry — the capability says so plainly and names what to repair. `plan show <plan>` shows any plan
whole; a unit's pin is kept by every revise until one says `--repin` with a reason. The plan lifecycle
arrives as `configuration.plan` in the host runtime config, which deploy emits; without it `plan`
refuses and names the deploy, and `design show` shows the lattice and says the plans standing on it
wait for that deploy.

## Dispatch

The dispatcher routes `<capability> <verb> [args]` to a bound port method. It is capability-agnostic
— a port is an opaque bag of verb handlers, and per-verb argv marshalling belongs to the capability
package. It is also pure: it returns a `DispatchResult` and does no process IO, so the bin maps it to
stdio and an exit code.

Unknown fails loud. An unknown capability or verb is code `2` with a message listing what _is_
available; a verb that throws is code `1`; success is `0`. Never a silent no-op.

## Which providers a host uses

`runCli` accepts declared plugins directly. Absent that, `discoverConfigured` reads the host config
— `$AGENT_RUNTIME_CONFIG`, else `~/.cratylus.json` — and resolves the named capability package
specifiers against `resolveFrom`'s `node_modules`. An absent or malformed config is not an error: the
caller's bundled default set still loads, so configuring is opt-in.

`runCli` exports but does not invoke. The invoking bin lives in
[`cratylus`](../invoke/README.md), which declares its capability packages as real
dependencies and passes them in.

## The bin name

`CLI_BIN` (`cratylus`) lives here because four packages speak it and three of them speak it
from inside an emitted artifact — a projected skill shim, a generated hook script — where no compiler
can see it. A rename that missed one produced a script that failed on a host rather than at build.

Flipping this one symbol really is the whole rename: `RUNTIME_CONFIG_NAME` (`.cratylus.json`) and
the event-tap's `EVENT_TAP_ID` are template-derived from it and move without being edited. The one
irreducible second copy is [`cratylus`](../invoke/README.md)'s `bin` key, which npm reads with
no compiler in the loop; their agreement is held by a test.
