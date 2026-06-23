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

**Ready / active:** none — fresh baseline.

**Done 2026-06-23:** `canonical-organ-values` (retired — own sharded plan, decision docs kept) + its
`fleet-deploy-catchup` tail. Re-derived the organ value catalog from blind model introspection (48+28 blind
agents, 2 rounds each), classified every organ open-vs-closed, purged ~60 bespoke per-agent cells for a
generalized opinionated LLM-reader set, rewired all 11 agents, renamed `weitermachen → carry-on`, added the
`build-agent` layman wizard. Landed `main` @ `510c66e`; **fleet 6/6 deployed + verified** (fire · forge ·
spark · ash · upmav · upgoose — nico sha parity `df337e…`, zero bespoke, memory layers untouched).

**Proposed next initiative (awaiting Operator go):** `fleet-organ-sync` — founder memory stores are per-host
and **UNSYNCED** (`~/.claude` is not a synced repo), so they fork and each re-accumulates palimpsest. They
are meant to be ONE user-scoped individual ("travels with the agent"). Per-host de-palimpsest is a mop; the
durable fix is a working **fleet organ sync** (Mav-led machinery; Nico co-specs the memory-cell contract).

## See also

- `CLAUDE.md` — the standing-initiative context (founder split + acceptance discipline).
