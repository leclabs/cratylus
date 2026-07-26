# V4 · deploy-prune

**Objective.** Make the deploy target converge to the render tree. Today it only ever unions, so a
retired artifact lives forever and at least one is actively harmful.

## The defect, measured

`grep -rn prune packages/agent-forge/src/deploy/` → **zero hits**. Deploy writes what the render tree
contains and never removes what it does not. Consequence, live right now:
`~/.claude/skills/memory/SKILL.md` exists with **no source cell**, and instructs agents to invoke a
binary that was deleted when `agent-memory` dropped its `memory` bin. An agent reading it follows an
instruction that cannot succeed.

`install-parity/DESIGN.md §4` names this; no shard ever owned it.

## Inputs

`packages/agent-forge/src/deploy/{deploy,local,hooks,scope,types}.ts` ·
`packages/agent-canon/.render-ts/` (the render tree) · the deployed root `~/.claude/`

## Constraints

- **Prune only within the deploy scope this tool owns.** `~/.claude/` holds artifacts from other
  sources — user-authored skills, plugin installs, harness files. Deleting anything not attributable
  to a prior deploy of this render tree is data loss, and it is the operator's machine.
- The mechanism must therefore know what it previously deployed. A manifest is the obvious carrier;
  deriving "ours" from a naming convention is not sufficient and must not be assumed.
- Deploy must stay **idempotent** and **local-only** (S8 established zero ssh/fleet reach — do not
  re-introduce any).
- Dry-run before destructive default: an operator must be able to see the deletion set first.

## Outputs

`packages/agent-forge/src/deploy/*` · a manifest artifact under the deploy root ·
`packages/agent-forge/test/deploy/*`

## Acceptance

1. Deploy render tree A, then deploy render tree B where B drops one skill A had. The dropped skill
   is **absent** from the deploy target afterwards. **This must fail on the pre-state.**
2. A file in the deploy root that this tool never wrote **survives** the prune. This is the
   exonerating fixture and is not optional — a prune with no exonerating test is a data-loss gate.
3. `deploy` twice in a row is a no-op the second time (idempotence).
4. The live orphan `~/.claude/skills/memory/SKILL.md` is gone after a real deploy, or explicitly
   reported by the dry-run. Report which; do not silently delete outside the test.
5. `pnpm test && pnpm typecheck` green.
