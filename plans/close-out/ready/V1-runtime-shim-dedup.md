# V1 · runtime-shim-dedup

**Objective.** One home for the runtime-shim emitter. The codex projection currently emits shims
that cannot resolve their session, because it calls a stale fork.

## The defect, measured

`packages/agent-canon/src/toolkit/runtime-shim.ts` is a divergent copy of
`packages/agent-forge/src/project/runtime-shim.ts`. The forge original gained
`HARNESS_SESSION_ENV_VARS` — the `CLAUDE_CODE_SESSION_ID → AGENT_SESSION_ID` bridge, commit
`f1621b6`. The canon fork did not. It is live via `packages/agent-canon/src/toolkit/project-cli-codex.ts:26,156`,
so **every codex-projected skill script is sessionless**, re-opening the phantom-sibling bug the
forge file's own comment documents.

(A second, related defect — the dead `emitRuntimeShim` import at
`packages/agent-canon/src/toolkit/project-cli.ts:31` — belongs to **V7**, which owns that file.
Do not touch `project-cli.ts`; editing a file another wave-0 slice owns is what the disjoint-outputs
law exists to prevent.)

## Inputs

- `packages/agent-canon/src/toolkit/runtime-shim.ts` (to delete)
- `packages/agent-forge/src/project/runtime-shim.ts` (the survivor; note it is NOT exported from the
  package root — check `packages/agent-forge/package.json` `exports` and add a subpath if needed)
- `packages/agent-canon/src/toolkit/project-cli-codex.ts`

## Constraints

- **Do not fix the fork by copying the bridge into it.** DRY: two emitters is the defect, not the
  drift. Delete the fork.
- If the forge shim is not reachable from canon, widening its export is in scope; inventing a third
  copy is not.
- Codex and claude projections must emit byte-identical shims for the same capability.

## Outputs

`packages/agent-canon/src/toolkit/runtime-shim.ts` (deleted) ·
`packages/agent-canon/src/toolkit/project-cli-codex.ts` ·
possibly `packages/agent-forge/package.json` (exports) · a test asserting shim identity across both paths.

## Acceptance

1. `packages/agent-canon/src/toolkit/runtime-shim.ts` does not exist.
2. A test projects the same capability down both the claude and codex paths and asserts the emitted
   script bytes are equal. **This test must fail on the pre-state** — verify that by running it
   before the deletion; if it passes before, it is not testing the divergence.
3. The emitted codex shim contains both `CLAUDE_CODE_SESSION_ID` and `AGENT_SESSION_ID`.
4. `pnpm test && pnpm typecheck` green.
