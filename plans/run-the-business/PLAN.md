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

**Pending (tails from retired `koine-absorbs-mind`, migrated 2026-06-30):**

- `minimal-delta-agents` — make each agent a minimal spread-delta over `base` (gated on the
  generic-extraction decision).
- `provenance-out-of-context` — rehome the `<!-- GENERATED -->` build-provenance out of the injected SOUL body.

**Ready / active:** none.

**Done 2026-06-23:** `canonical-organ-values` (retired — own sharded plan, decision docs kept) + its
`fleet-deploy-catchup` tail. Re-derived the organ value catalog from blind model introspection (48+28 blind
agents, 2 rounds each), classified every organ open-vs-closed, purged ~60 bespoke per-agent cells for a
generalized opinionated LLM-reader set, rewired all 11 agents, renamed `weitermachen → carry-on`, added the
`build-agent` layman wizard. Landed `main` @ `510c66e`; **fleet 6/6 deployed + verified** (fire · forge ·
spark · ash · upmav · upgoose — nico sha parity `df337e…`, zero bespoke, memory layers untouched).

**Memory model (Operator decision, 2026-06-23): memory is LOCAL-PER-HOST.** `fleet-organ-sync` is
**declined** — a single shared organ store clobbers each host's legitimate local context, and fleet-wide
memory isn't practical for this simple/open-source library. Deploy pushes only the **SOUL** (the regenerable
def and skills), never memory content (if-absent seed, never clobber). Per-host divergence is fine by design;
the only memory hygiene that matters is keeping the **primary host's** store (fire) clean. The earlier
"fleet-divergence is the structural root" framing is retired.

## See also

- `CLAUDE.md` — the standing-initiative context (founder split + acceptance discipline).
