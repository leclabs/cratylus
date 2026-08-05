# T3 — runtime-port (ready · wave 0 · deps ∅)

## Objective

Introduce forge's first **runtime** capability: a harness-agnostic **`EventTapHost` port** + the
**`EventTapHostClaude`** adapter implementation, reusing the existing settings.json-hook machinery. This
is the DIP contract the event-tap domain module (E2) codes against.

## Static inputs (pinned, path:line from census a013fad)

- `packages/forge/src/adapters/claude/write.ts:237-246` (`serializeClaudeHooksReport`), `:248-288` (`serializeClaudeHooks`, `canonicalToClaude` event mapping `turn.end→Stop`), `:126` (`mergeJsonKeys` — foreign-key-preserving settings merge).
- `packages/forge/src/adapters/registry/index.ts:25-31` (`REGISTRY={claude,codex}`, `adapterByName`).
- `packages/forge/src/core/adapter/types.ts:22-30,92-117` (`Adapter`/`AdapterCapabilities.hooks`).
- Forge is **projection/deploy-time only today** — this port is net-new; do not entangle it with the projection `Adapter`.

## Constraints

- **Port has ZERO Claude leakage** (DIP/LSP): `EventTapHost { installTap(events: LifecycleEvent[], sink: CaptureSink): void; removeTap(): void; readCapture(): Record[]; status(): TapStatus }` — names nothing harness-specific (`settings.json`, `hook`).
- **`EventTapHostClaude`**: realize `installTap` = merge a passive logger hook into `settings.json` via `mergeJsonKeys` (foreign keys preserved) + emit the logger worker; `removeTap` = surgical teardown + restore. Reuse `serializeClaudeHooksReport` for the hook shape.
- **YAGNI/simple**: extract the interface from THIS one adapter; NO speculative VS Code/Codex ports.
- **Non-interference** is the `CaptureSink`/logger contract: the installed logger emits ∅, exits 0, never blocks/denies/mutates.

## Outputs

`EventTapHost` port + `EventTapHostClaude` + a hermetic unit test.

## Accept (blind falsifier)

REJECTED if: the port interface references any Claude/harness term; OR `installTap` on a fixture
`settings.json` fails to add the logger hook or clobbers a foreign key; OR `removeTap` leaves residue /
doesn't restore; OR the logger, on a synthetic event, emits any stdout/decision. ACCEPTED when: the port
is harness-neutral, `EventTapHostClaude.installTap`→fixture settings gains the hook (foreign keys intact),
`removeTap`→restored, and the logger proves-CANNOT-block on a synthetic event.
