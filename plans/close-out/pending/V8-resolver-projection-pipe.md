# V8 · resolver-projection-pipe

**Deps: V7.**

**Objective.** Determine whether the projector ignoring the resolver is a correctness bug, and fix it
if it is. Do not assume either answer.

## The finding

`runProject` (`packages/agent-forge/src/cli/commands/project.ts:42`) does
`const plugins = config.extends as readonly ProjectablePlugin[]` — it **casts the raw `extends`
list** and hands directories to `projectPluginSet`, which re-scans them from disk.

Meanwhile `resolve()` → `ResolvedAgentSet` (`packages/agent-forge/src/resolve/resolve.ts`) is reached
only through `composeFromFile` (`packages/agent-forge/src/config/loader.ts:147`), whose only
consumers are `cli/commands/compose.ts` (which prints, and writes nothing under `--dry-run`) and
`cli/commands/explain.ts`.

**The resolver's fold output never reaches the projector.**

## The question this shard answers

`ENGINE.md:22` binds `compose(select(a)) = ir(a) ∧ ir(a) ⊑ content(a)`. If composition/inheritance
semantics live in `resolve()` and projection re-scans raw directories instead, then **projected
artifacts may not carry the composed result** — that would be a correctness bug against ENGINE, and a
quiet one, because each pipeline is individually green.

Or: `projectPluginSet`'s own scan may already perform the equivalent fold, in which case the two
paths agree and the defect is duplication, not incorrectness.

**Measure which. Do not reason about which.**

## Inputs

`packages/agent-forge/src/cli/commands/project.ts` · `.../resolve/resolve.ts` · `.../config/loader.ts` ·
`.../project/index.ts` (post-V7 — it now returns an artifact tree, which makes this comparison easy) ·
`ENGINE.md:22` · `MODEL.md:23-27`

## Constraints

- **Differential test first, fix second.** Construct an agent whose composed form differs from its
  raw on-disk form — a dimension inherited from a composed-from sibling is the obvious lever — and
  compare what each path yields.
- If they agree, the outcome is a **recorded finding plus the differential test as a regression
  guard**. That is a complete, passing result. Do not manufacture a refactor to justify the shard.
- If they diverge, fix by routing projection through the resolver — and expect the render tree to
  change. A render-tree diff is then **evidence, not a regression**; report it in full rather than
  suppressing it.
- Do not split packages. See PLAN §Decisions.

## Outputs

`packages/agent-forge/test/project/resolver-parity.test.ts` (always) ·
`packages/agent-forge/src/cli/commands/project.ts` and `.../project/index.ts` (only if they diverge) ·
a finding recorded in the shard's return

## Acceptance

1. A differential test exists that exercises an agent whose composed form differs from its raw form,
   and asserts the two paths agree.
2. A verdict is stated with evidence: **agree** (test is now a guard) or **diverge** (test failed
   first, fix landed, test passes, render-tree delta reported in full).
3. If diverged: the changed render tree is explained artifact by artifact. An unexplained delta is a
   fail.
4. `pnpm test && pnpm typecheck` green.
