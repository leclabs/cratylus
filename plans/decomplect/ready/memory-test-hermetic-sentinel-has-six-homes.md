# The hermetic-config sentinel is restated in six test files, and resolution just got wider

> Found 2026-08-05 by the agent landing `t-memory-config-scope-is-incoherent`, which flagged it
> rather than fixing it — the fix touches six files other shards may hold, and it is a separate cut.

## The hazard, and it is new

Six memory test files each set `AGENT_MEMORY_CONFIG=''` locally to stay hermetic. One concept, six
homes — ordinary DRY, except that `t-memory-config-scope-is-incoherent` **widened config resolution
to reach `$HOME`**. So a developer with a real `~/.cratylus.memory.json` now has it reachable from
any test file that does not stub the sentinel — `dream`, `session`, `store`, `migrate*`, `lock`.

The failure is not a red test. It is a test that reads the developer's own repo keys and passes,
differently, on their machine than in CI. **The machine that ran the change had no such file, so the
leak could not be proven either way** — which is exactly the condition under which it stays hidden.

## Why this is the widening's residue and not a pre-existing nit

Before the widening, `''` was belt-and-braces: resolution was cwd-local and a test's scratch cwd had
no config. After it, the sentinel is the ONLY thing standing between a test and the developer's
home directory. A guard that was redundant became load-bearing without anyone deciding it should be.

## Acceptance

- One home for the sentinel — `test/setup.ts` or the vitest config — so no test file can forget it
  and none needs to remember.
- A test that CONVICTS the leak: plant a `$HOME` config with a distinctive repo key, run a suite
  file that does not stub anything, and assert the key does not appear in the result. It must fail
  with the sentinel removed.
- The six local restatements are deleted, not left as redundant belt-and-braces — a guard in two
  places is a guard whose absence in a third is invisible.

## Execution

<!-- GENERATED from ../spec.mjs by ../sync-shards.mjs. Edit the spec, not this block. -->

- **slice** host-and-config · **wave** 0
- **depends on** `t-memory-config-scope-is-incoherent`
- **writes** `packages/memory/test/**`
- **compiles against** `packages/memory/src/node.ts`
- **evidence** `packages/memory/src/node.ts` · `packages/memory/test/node.test.ts`
- **dispatchable** no ruling owed
