# V5 · bin-name-single-home

**Deps: V1** (which deletes one of the homes).

**Objective.** Give the runtime bin name exactly one home — the work `install-parity` S4 recorded as
already done. It is not done.

## The state, measured

S4 claims _"S1+S3 gave the bin name exactly one home, so the rebrand is a one-line change."_
`packages/agent-runtime/src/main.ts:16-30` says the same of itself. The literal `agent-runtime`-as-a-
bin-name actually lives in **7 places across 4 packages**:

| #   | site                                                                          | note                                                                                                  |
| --- | ----------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------- |
| 1   | `packages/agent-runtime/src/main.ts:30`                                       | `const BIN = 'agent-runtime'` (cac brand + help)                                                      |
| 2   | `packages/agent-cli/src/bin.ts:22`                                            | a **second** `const BIN` (error prefix)                                                               |
| 3   | `packages/agent-cli/package.json`                                             | the `bin` key                                                                                         |
| 4   | `packages/agent-forge/src/project/runtime-shim.ts:63`                         | `spawnSync('agent-runtime', …)` — **the operative one**, baked into every emitted `scripts/<cap>.mjs` |
| 5   | `packages/agent-canon/src/toolkit/runtime-shim.ts:28`                         | duplicate — **V1 deletes this**                                                                       |
| 6   | `packages/agent-canon/src/hooks/memory-consolidation-nudge.ts:89`             | `MEM="${MEMORY_BIN:-agent-runtime}"`                                                                  |
| 7   | `packages/agent-canon/src/toolkit/guardrail/memory-consolidation-nudge.sh:40` | the generated worker of #6                                                                            |

Sites 4, 6 and 7 are inside emitted `.mjs` / `.sh` strings — **compiler-unchecked**. A rename that
misses one produces a deployed script that fails at runtime on a host, not at build.

## Constraints

- **This shard does NOT rename anything.** The brand anchor is cratylism-gated, returned ⊥ once, and
  is nico's. This is the refactor that makes the eventual rename a one-line change — i.e. it makes
  S4's claim true rather than asserting it.
- #6/#7 are a cell and its generated worker: edit `memory-consolidation-nudge.ts` (the cell) and
  regenerate. Never the `.sh` alone — see `c4b4298`.
- Keep `MEMORY_BIN` env-override behaviour intact.
- Do not fold the two `BIN` constants (#1, #2) into a shared one by having `agent-cli` import from
  `agent-runtime`'s internals if that crosses a package's public surface — route it through the
  declared export or a tiny shared constant module.

## Outputs

`packages/agent-runtime/src/main.ts` · `packages/agent-cli/src/bin.ts` ·
`packages/agent-cli/package.json` · `packages/agent-forge/src/project/runtime-shim.ts` ·
`packages/agent-canon/src/hooks/memory-consolidation-nudge.ts` (+ regenerated worker) · a test

## Acceptance

1. Exactly **one** source-of-truth declaration of the bin name. `package.json`'s `bin` key is
   necessarily a second literal — a test must assert the two agree, so a rename cannot half-land.
2. A test asserts that the string appearing in an emitted `scripts/<cap>.mjs` equals the declared
   constant. **This must fail if someone edits one and not the other** — prove it by mutating one in
   the test and observing the failure.
3. A single-symbol change flips the name everywhere except `package.json`, whose agreement is gated
   by (1). Demonstrate by temporarily flipping it and diffing the render tree.
4. `pnpm test && pnpm typecheck` green; render tree otherwise byte-identical.
