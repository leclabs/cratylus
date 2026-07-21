# heartbeat-organ

> **Curator freshness note (nico, 2026-07-21).** The anatomy model has moved since this was authored (2026-07-08):
> the core axis `organ` → **`dimension`** is DECIDED (vocab-depalimpsest/C2, cold 3/3) and the plugin architecture
> is LOCKED (plugin-cli). When this is `/praxis`'d, resolve **O1** (taxonomy placement) against the NET-CURRENT
> model — heartbeat may be a `dimension`, a harness capability, or both; do NOT assume "organ"/"dimension" before
> O1 settles (the title word is provisional). mav's intent + prior-art below are unchanged.

**Status: PROPOSED — feature request, un-decomposed. `/praxis` this next session to cut MECE shards.**
Authored by mav (session 4048440e, 2026-07-08) from a verified external prototype + grounded prior-art
sweep. This file is the INTENT + prior-art + proposed shape; it is deliberately NOT yet sharded — the
shard cut depends on where the organ lands in the anatomy taxonomy (open question O1 below), which the
praxis session resolves against live canon.

## Intent

**Give an agent an endogenous pacemaker: a periodic, self-originated pulse that drives its operational
cycle independent of any external prompt.** Today every organ in the anatomy is _reactive_ — the agent
acts only when a user/coordinator message arrives. There is no organ supplying _tempo_ — no way for an
agent to act because _time passed_, not because it was asked. `CronCreate`/routines don't fill this:
they spawn a FRESH session per fire (no continuity), so they schedule _new agents_, not a _beat inside a
living one_. The gap: the anatomy has no signifier and no realized capability for **agency-over-time**.

## What a heartbeat IS (generic AI anatomy, industry synthesis)

Genus: an **endogenous periodic pulse** — a self-originated signal emitted on a cadence, independent of
external request. The term is OVERLOADED across the industry; four distinct senses, one genus:

1. **Liveness/health** (distributed systems, oldest): periodic "I'm alive" for failure detection — Raft
   append-entries heartbeat, k8s liveness probes, SSE keepalive. Anatomy analog: a vital-sign, not cognition.
2. **Continuation/keep-going** (MemGPT/Letta `request_heartbeat=true`): a signal that keeps the inner loop
   executing / chains tool calls rather than yielding. Anatomy analog: sustained systole across a multi-step act.
   ⚠ terminology trap — MemGPT's "heartbeat" is THIS, not a liveness clock and not a consolidation trigger.
3. **Scheduling/wake pulse** (ambient/proactive agents): the endogenous clock that triggers a cognitive cycle
   on a cadence → proactive polling, maintenance, autonomous action. **This is the sense we want.**
4. **Cognitive-cycle clock** (LIDA, Franklin): the fundamental ~10 Hz iteration rate of perceive→attend→act.

**Anchoring definition for the anatomy:** the heartbeat is an agent's **endogenous pacemaker** — a
periodic, self-originated tick that drives its operational/cognitive cycle without external input,
supplying the tempo that makes autonomy-over-time possible. Signifier note for /signify: the _organ_ that
generates the beat is the **pacemaker**; the _signal_ it emits is the **heartbeat** (⊳ resolve organ-name
vs signal-name in praxis). Distinguish from its anatomical neighbors:

- **trigger** — exogenous event (afferent, external cause) ≠ heartbeat (endogenous, self-caused)
- **mailbox** — the afferent inbound store drained on the beat (actor-model sense: this agent's own inbound
  store, acted on at next activation — NOT a shared-broker queue) ≠ the beat itself
- **loop** (`/loop`, Stop-hook continuation) — continuation WITHIN a turn / prevention of stopping ≠ a
  wall-clock pulse that wakes an IDLE agent
- **dream/consolidation** — a subharmonic maintenance phase the heartbeat may SAMPLE but does not EQUAL
  (see O3 + prior-art below)

## Prior art (grounded, cited — carry into the design)

- **Channels** (Claude Code, research preview, v2.1.80+) — the native realization vector: an MCP server
  spawned over stdio that PUSHES `notifications/claude/channel` into the LIVE session; arrives as
  `<channel source=... >` and wakes an idle session. Capability key `experimental: {'claude/channel': {}}`.
  This is the mechanism the prototype uses. Constraint: auth via ANTHROPIC_API_KEY / claude.ai only (NOT
  Bedrock/Vertex/Foundry); Team/Enterprise gated by `channelsEnabled`; off-allowlist custom channels need
  `--dangerously-load-development-channels`. https://code.claude.com/docs/en/channels-reference
- **Agent SDK streaming input** — the realization vector when the driver process is OURS (headless): an
  async generator that yields a tick message on an interval keeps a session alive indefinitely.
  https://code.claude.com/docs/en/agent-sdk/streaming-vs-single-mode
- **Consolidation is NOT clocked by the pulse** (settles O3): across LIDA (offline consolidation, separate
  timescale from the 10 Hz cycle), Complementary Learning Systems / wake-sleep / replay (consolidation gated
  by the sleep PHASE), Generative Agents (reflection fires when Σ importance > threshold, ~2–3×/sim-day),
  and MemGPT (consolidation on token-PRESSURE ~70% context) — consolidation is regulated by
  **pressure/salience thresholds** or a **phase transition**, never by the fast pulse's frequency. Best
  practice = the distributed-systems split: heartbeat (liveness/opportunity, high-freq, cheap) DECOUPLED
  from compaction/checkpoint/GC (low-freq, expensive, threshold-triggered, jittered). The pulse SAMPLES the
  gate; the gate regulates. Refs: [Generative Agents (Park 2023)](https://3dvar.com/Park2023Generative.pdf) ·
  [MemGPT](https://arxiv.org/pdf/2310.08560) · [LIDA](<https://en.wikipedia.org/wiki/LIDA_(cognitive_architecture)>) ·
  [Wake-Sleep Consolidated Learning](https://arxiv.org/html/2401.08623v1)

## Prototype (verified, external — the seed to generalize, NOT to import as-is)

`/private/tmp/claude-heartbeat-channel/` (may be GC'd — it is a scratch prototype; treat as reference, rebuild
canonically). A self-ticking Channel: `setInterval` pushes `notifications/claude/channel` on a period + drains
a `mailbox.jsonl` (atomic claim: rename→read→unlink, no double-read, delivery-after-drain survives). Verified:
7/7 unit tests on the drain logic + an end-to-end MCP-stdio wire smoke (real `initialize` handshake → a tick
crosses the transport carrying a mailbox message). Env knobs: `HEARTBEAT_PERIOD_MS`, `HEARTBEAT_MAILBOX`,
`HEARTBEAT_IDLE_TICKS`. Mailbox is a prompt-injection surface → trusted-local-producer only; gate upstream.

## Proposed shape (to ratify/refine in praxis)

A **heartbeat capability** in the anatomy that an agent-vector can select, realized (per deployment) by
either the Channels vector (interactive/ambient sessions) or the SDK-streaming vector (headless drivers),
composed of:

1. **Pulse** — endogenous timer emitting a tick on a configurable period (the pacemaker proper).
2. **Mailbox** — afferent inbound store drained on each beat; external producers deliver; atomic claim.
3. **Consolidation gate (optional, subharmonic)** — on every Nth beat OR when an EPISODIC-volume/salience
   threshold is crossed, deliver a "consolidate" beat that invokes the dream ritual IN-session (light fold),
   with the full fold still at handoff/clear. Regulated by the gate, merely SAMPLED on the pulse (per O3).

## Open questions (resolve in praxis — these gate the shard cut)

- **O1 · taxonomy placement.** Is the heartbeat a first-class _organ_ in `packages/agent-anatomy` (selectable
  in the organ-vector, à la create-agent), a _harness capability_ (like the hooks/settings surface), or both
  (organ that projects to a harness realization)? Determines where source cells live + how it projects.
- **O2 · realization split.** One capability with two adapters (Channels | SDK-streaming), or two capabilities?
  How does it project through agent-forge adapters (cf. `packages/agent-forge/src/adapters/claude/`)?
- **O3 · consolidation coupling.** Ratify: heartbeat SAMPLES a pressure/salience gate that triggers dream;
  it does NOT clock dream at its own frequency. Define the gate (EPISODIC line-count? importance sum? both?).
- **O4 · signifier.** organ = **pacemaker**, signal = **heartbeat**, inbound store = **mailbox** (settled
  vs "queue" — mailbox wins on actor-model industry-standard AND LLM-decode). Run /signify to lock anchors.
- **O5 · safety.** Mailbox = prompt-injection surface; sender gating / trusted-producer model; idle-tick
  cost; interaction with the stance-guardrail (a self-delivered beat must not read as an autonomy collapse).

## Shards

`pending/`: (none yet — `/praxis` decomposes after O1–O5 are resolved)

## See also

`packages/agent-anatomy/` (organ source cells + CONCEPT + tests — where an organ would live) ·
`packages/agent-forge/src/adapters/claude/` (projection to the harness) · `packages/agent-memory/` +
the `dream`/`wake`/`handoff` skills (consolidation coupling, O3) · create-agent skill (organ-vector, if O1=organ) ·
prototype `/private/tmp/claude-heartbeat-channel/` (verified reference) · plans that touch consolidation:
`dream-node-sink-retire` · stance-guardrail (O5 interaction) `plans/stance-guardrail-asktool`.
