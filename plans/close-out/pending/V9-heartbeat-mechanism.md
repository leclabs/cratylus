# V9 · heartbeat-mechanism

**Objective.** Build the name-free ~80% of the endogenous-pacemaker capability: the port, the drain,
two host adapters, and the sampling gate — under an **explicitly provisional** module path.

## Why this is buildable now, and why it is sequenced last

`heartbeat-organ` claims _"any shard that creates files would be coining by fiat."_ The census
measured that claim and it is **too strong**. The name-gated surface is exactly three identifiers:

| gated site                                                                         | why                            |
| ---------------------------------------------------------------------------------- | ------------------------------ |
| `packages/agent-runtime/src/loader.ts:33` — `CAPABILITIES = ['memory','eventTap']` | the dispatch word a user types |
| `packages/agent-runtime/src/plugin.ts:30-36` — the `RuntimePlugin` port field      | the port anchor                |
| `packages/agent-canon/src/skills/<name>/`                                          | the `/slash-command`           |

Everything else — port shape, atomic drain, MCP push, async-generator tick, sampling threshold — is
mechanism and carries no public anchor. Nothing outside `agent-runtime` imports it until the
capability is registered, so the eventual rename is a `git mv` plus an identifier sweep.

Sequenced last because it is **net-new capability, not a defect**. Everything in waves 0 and 1 is
either shipping-broken or load-bearing for the memory work the operator named as the priority.

## Prior art already settled — do not re-derive

- **O1**: heartbeat is a **runtime capability** (sibling of `event-tap`), invoked by a skill,
  optionally declared by a dimension. `memory` occupies all three layers, so co-occupation is normal.
- **O2**: one port, N host adapters selected per deployment. Precedent:
  `ports/event-tap.ts:51 EventTapHost` with one realization `capabilities/event-tap/claude.ts:79`,
  bound at `capabilities/event-tap/index.ts:32`. **Copy this shape.**
- **O3**: the pulse **samples** a pressure/salience gate; it never clocks it. Four independent
  architectures converge (LIDA, CLS/wake-sleep, Generative Agents, MemGPT).
- The sense wanted is **scheduling/wake pulse** — the endogenous clock that triggers a cognitive
  cycle on a cadence. Not liveness, not MemGPT's continuation flag.

## Constraints

- **Use a provisional module path and say so in the file header.** Do not name the capability, the
  port field, or a skill directory. Do not register it in `CAPABILITIES`.
- **`heartbeat` is already taken in this codebase** — `packages/agent-runtime/src/ports/memory.ts:131,360,399`
  uses it as a session-**lease** verb (`'register' | 'heartbeat' | 'release'`). That is sense #1
  (liveness) from the plan's own taxonomy. Adopting it for the pacemaker signal would put two
  concepts under one sign in one runtime. Flag it for the derivation; do not resolve it here.
- `packages/agent-canon/src/dimensions/trigger/scheduled-trigger.ts:3` **already exists and is
  selected by zero agents.** If it is the right dimension value, no coinage is owed — check before
  assuming a new one is needed.
- The drain must be atomic under concurrent producers. The external prototype used rename→read→unlink
  with 7/7 unit tests; that prototype lived at `/private/tmp/claude-heartbeat-channel/` and may be
  gone — **verify before citing it, and rebuild the tests canonically either way.**
- A mailbox is a prompt-injection surface. Gate producers as trusted-local; note it in the port docs.

## Outputs

`packages/agent-runtime/src/ports/<provisional>.ts` ·
`packages/agent-runtime/src/capabilities/<provisional>/` · tests · **no** edit to `loader.ts` or
`plugin.ts`

## Acceptance

1. A port interface exists, shaped after `ports/event-tap.ts`: tick emission, period config, drain,
   status.
2. The drain is tested for atomicity under concurrent producers — a test that would fail on a
   naive read-then-delete.
3. Two host adapters implement the port, each independently testable.
4. The sampling gate is implemented as **sample, never clock** — a test asserts a pulse does not
   itself trigger consolidation when the pressure gate is below threshold.
5. `grep -rn '<provisional>' packages/agent-forge packages/agent-canon` returns **nothing** — the
   capability is unregistered and unreferenced outside `agent-runtime`, which is what keeps the
   rename cheap.
6. Every file states in its header that its path is provisional and pending derivation.
7. `pnpm test && pnpm typecheck` green.
