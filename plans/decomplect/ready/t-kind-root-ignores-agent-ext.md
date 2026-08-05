# `KIND_ROOT` hardcodes `.md`, so codex deploys report zero orphans — always

> Census: [`CENSUS-2026-08-05.md`](../CENSUS-2026-08-05.md). Every number below was measured,
> not quoted forward.

## Intent

**This is a live wrong answer, not a placement complaint.**

`forge/src/deploy/manifest.ts:144-148` hardcodes `agent: { dir: 'agents', suffix: '.md' }` while
the `HarnessAdapter` port already declares `agentExt` (`core/harness-adapter.ts:104`) — claude
`.md`, codex **`.toml`**.

The fact is threaded down one branch and hardcoded in the branch beside it: `deployLocal` receives
`opts.agentExt` (`deploy/deploy.ts:61`) and threads it into `place` (`:143`), but the sibling
`unattributable(…)` call (`:196-201`) passes only `(harnessDir, kind, names, manifestNames)`. So
`unattributable` filters a codex tree by `.endsWith('.md')` (`manifest.ts:176`) and **finds nothing,
every time.** Prune is silently a no-op on codex.

## Why no gate caught it

`forge/test/deploy/prune.test.ts:267` exercises the **claude** path only — which is why it passes.

## Constraints

- Thread `agentExt` into `unattributable` from the same source `place` already uses. One fact, one home.
- The new test must be a **codex** fixture that convicts today.

## Acceptance

- A codex deploy with an orphan **reports it**; a fixture proves it went red before the fix.
- The claude path is unchanged — both fixtures, or the checker only convicts what it already knew.
