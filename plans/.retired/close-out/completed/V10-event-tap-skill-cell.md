# V10 · event-tap-skill-cell

**Objective.** Give the event-tap capability an agent-facing surface. It is fully built and fully
unreachable by any agent.

## The hole, and why nobody saw it

`plans/.retired/agent-runtime/SUPERSESSION.md:32` records event-tap **T4** (the skill cell) as
ABSORBED into `agent-runtime` **S8**. **That claim is false against the code.** S8 as specified and
executed is memory-only — its objective is "rewire every **memory**-touching skill from bare
`memory <verb>` to `agent-runtime memory <verb>`" and its falsifier is
`git grep -n "\bmemory " src/skills/` returning zero. Event-tap appears nowhere in it.

So the shard was marked absorbed, the plan was retired as complete, and the work silently vanished.

Measured today:

- `packages/agent-canon/src/skills/` holds **15** cells, none named `event-tap`.
- Only three cells declare `runtime:` — `dream/skill.ts:54`, `handoff/skill.ts:25`,
  `wake/skill.ts:35` — all `capability: 'memory'`. **No cell declares `capability: 'eventTap'`**,
  though the type admits it: `packages/agent-forge/src/anatomy/index.ts:31-35` derives
  `RuntimeCapability` from the plugin port keys (`memory` · `eventTap`), and `:288` is
  `readonly runtime?: { readonly capability: RuntimeCapability }`.
- The capability itself is complete and tested — `packages/agent-runtime/src/capabilities/event-tap/`,
  port at `packages/agent-runtime/src/ports/event-tap.ts:51`, verbs at
  `capabilities/event-tap/dispatch.ts:21` (`'install' | 'remove' | 'read' | 'status'`).

**Consequence.** Event-tap is reachable only by an operator typing `agent-runtime tap …` at a shell.
A Claude skill is the agent-facing invocation surface, and there isn't one — which inverts the point
of the whole effort chain: _a passive event tap an agent can turn on to observe itself._

This also explains a gap in the integration smoke test:
`packages/agent-forge/test/deploy/integrate-smoke.test.ts:236` invokes the runtime **binary
directly** for the tap leg, while the memory leg round-trips through a projected thin shim. There is
no event-tap skill to project a shim from. Closing this shard closes that gap.

## Inputs

`packages/agent-canon/src/skills/wake/skill.ts` (the `runtime:` declaration pattern) ·
`packages/agent-runtime/src/capabilities/event-tap/dispatch.ts` (the verbs) ·
`packages/agent-runtime/src/ports/event-tap.ts` · `packages/agent-canon/test/skill-shape.test.ts:99` ·
`packages/agent-canon/test/symbols.test.ts:205` · `packages/agent-canon/src/toolkit/operator-lexicon.ts`

## Constraints

- **The cell's `name` and directory basename must match** — `packages/agent-canon/test/cratylism.test.ts`
  gates it. `event-tap` is the anchor already carried by the port, the capability directory and the
  dispatch word; this shard adopts it, it does not re-derive it.
- **Do NOT re-derive the four verbs.** A separate blocked item covers whether `remove`/`read` should
  be `uninstall`/`inspect`. Name whatever `dispatch.ts:21` currently exports, so the cell cannot
  disagree with the runtime. If that item later lands, both move together.
- The formal block must pass the whole skill gate-set: self-sufficiency (zero comment markers — no
  `--` or `—` inside the fence), symbols (every glyph declared in `operator-lexicon`), reader-density,
  structural parsimony. Any genuinely-fittest new glyph is **declared in the lexicon**, never
  downgraded to a weaker declared one.
- **Bump the two hard-coded counts from 15 to 16** — `skill-shape.test.ts:99`, `symbols.test.ts:205`.
  Read the live glob to confirm the number rather than assuming it.
- Do not commit `.render-ts/` or `dist/`.

## Outputs

`packages/agent-canon/src/skills/event-tap/skill.ts` ·
`packages/agent-canon/test/skill-shape.test.ts` · `packages/agent-canon/test/symbols.test.ts` ·
possibly `packages/agent-canon/src/toolkit/operator-lexicon.ts` ·
`packages/agent-forge/test/deploy/integrate-smoke.test.ts` (the shim leg)

## Acceptance

1. `packages/agent-canon/src/skills/event-tap/skill.ts` exists, exports one `Skill`, declares
   `runtime: { capability: 'eventTap' }`.
2. Projecting the canon emits `skills/event-tap/scripts/eventTap.mjs` — a thin shim — and a
   `SKILL.md` whose body names the four verbs. Assert on the projected artifact, not the source.
3. The integration smoke test's tap leg goes through the **deployed shim**, not `execFileSync(bin, …)`.
   **This must fail on the pre-state** — there is no shim today; run it before you write the cell.
4. The verbs named in the cell equal `dispatch.ts:21`'s exported union. Assert this mechanically so
   the two cannot drift.
5. `pnpm test && pnpm typecheck` green, with the skill counts at 16.
