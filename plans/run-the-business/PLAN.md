# run-the-business (RTB)

**The standing plan.** Unlike a founding/initiative plan — a transient scaffold that retires once its
result is in the source of truth ([[plan-retirement]]) — RTB is **perpetual**. It is the durable home for
the live backlog and standalone tasks that don't warrant their own sharded plan. It never retires; tasks
flow through its state folders (`pending/ → ready/ → active/ → completed/`) and `completed/` is swept
periodically (git is the recovery net).

**Use it for.** One-off maintenance, small standalone tasks, and the surviving tails of retired
initiatives whose larger scaffold has been wound down but whose remaining work is still live. When a
cluster of RTB tasks grows into a coherent initiative, promote it back out into its own sharded plan.

## Status mirror

| Task                       | State   | Owner                                  | Origin                |
| -------------------------- | ------- | -------------------------------------- | --------------------- |
| `memory-home-dual-deploy`  | ready   | Mav (machinery) + Nico (Protocol edit) | memory-tool-bundling  |
| `vault-reference-home`     | ready   | Mav                                    | memory-model-redesign |
| `wake-trigger-and-cutover` | pending | Mav (machinery) + Nico (wake edit)     | memory-tool-bundling  |

### ready

- **memory-home-dual-deploy** — make the `memory` organ the deployed home of the `episodic` tool;
  resolve "one cell, two deploy fates" (verbatim SOUL projection ∧ host `skills/memory/` dir carrying the
  bundled artifact). Deps (both ✓ on main): skill-companion-deploy, episodic-toolsource-bundle.
- **vault-reference-home** — the Obsidian vault as the 5th memory home (cold, on-demand). Lower
  priority; not load-bearing for wake.

### pending

- **wake-trigger-and-cutover** — self-triggering per-host EPISODIC migration at wake + fleet cutover to
  the bundled tool; removes the last package remnants. Deps: memory-home-dual-deploy.

## See also

- `CLAUDE.md` — the standing-initiative context (founder split + acceptance discipline) the migrated
  memory tasks carry.
