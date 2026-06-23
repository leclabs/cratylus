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

**Ready / active:** none — fresh baseline (2026-06-23). `completed/` swept (git is the recovery net).

**Active initiative:** `canonical-organ-values` (own sharded plan) — re-derive the organ value catalog from
blind model introspection, classify each organ open-vs-closed, purge bespoke per-agent values for a
generalized opinionated LLM-reader set, rename `weitermachen → carry-on`, and add the layman agent-builder
skill. The retired `asleep-host-catchup` tail (ash + upgoose) **folds into that plan's final fleet
redeploy**, which ships the new corpus to all 6 hosts (superseding the old per-host catch-up).

**Proposed next initiative (awaiting Operator go):** `fleet-organ-sync` — founder memory stores are per-host
and **UNSYNCED** (`~/.claude` is not a synced repo), so they fork and each re-accumulates palimpsest. They
are meant to be ONE user-scoped individual ("travels with the agent"). Per-host de-palimpsest is a mop; the
durable fix is a working **fleet organ sync** (Mav-led machinery; Nico co-specs the memory-cell contract).

## See also

- `CLAUDE.md` — the standing-initiative context (founder split + acceptance discipline).
