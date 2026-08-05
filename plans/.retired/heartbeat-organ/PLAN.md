# heartbeat-organ

> **Curator freshness note (nico, 2026-07-21).** The anatomy model has moved since this was authored (2026-07-08):
> the core axis `organ` → **`dimension`** is DECIDED (vocab-depalimpsest/C2, cold 3/3) and the plugin architecture
> is LOCKED (plugin-cli). When this is `/praxis`'d, resolve **O1** (taxonomy placement) against the NET-CURRENT
> model — heartbeat may be a `dimension`, a harness capability, or both; do NOT assume "organ"/"dimension" before
> O1 settles (the title word is provisional). mav's intent + prior-art below are unchanged.
>
> **Discharged (mav, 2026-07-26).** O1 resolved against live code — see §Open questions. Two references in
> this file had also gone stale: `packages/anatomy` **does not exist** (dimensions live in
> `packages/forge/src/anatomy/index.ts`, their values in `packages/canon/src/dimensions/`), and
> the plan's title word `organ` is superseded by `dimension` per the note above — but the file is not
> renamed, because the anchor is undiscovered (O4) and renaming it to `heartbeat-dimension` would coin by
> fiat the very thing O4 must derive. The working handle stays provisional until `/signify` runs.

**Status: PROPOSED — architecture settled, blocked on naming. O1–O3 resolved 2026-07-26 against live
code; the sole remaining gate is O4 (signifier), which is nico's. `/signify` → then `/praxis`.**
Authored by mav (session 4048440e, 2026-07-08) from a verified external prototype + grounded prior-art
sweep. This file is the INTENT + prior-art + resolved shape; it is deliberately NOT yet sharded, but the
reason has changed: the taxonomy question that once gated the cut is answered, and what blocks it now is
that the thing has no discovered name to create files under.

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

## Open questions

### RESOLVED 2026-07-26 (mav) — against live architecture, not the 2026-07-08 assumptions

- **O1 · taxonomy placement — RESOLVED, and the question's trichotomy was the wrong axis.** "Organ vs
  harness capability vs both" presupposes one slot. The architecture already has **three**, and `memory`
  occupies all of them at once — the precedent that settles this:

  | layer                  | what it holds                          | memory's instance                                                   |
  | ---------------------- | -------------------------------------- | ------------------------------------------------------------------- |
  | **dimension**          | a σ\* fragment declaring a disposition | `src/dimensions/memory/long-term-memory.ts`, selected into `mav.ts` |
  | **skill** `runtime:{}` | the procedure the agent RUNS           | `src/skills/wake/skill.ts:33` → `runtime: { capability: 'memory' }` |
  | **runtime capability** | the host-side impl behind a port       | `runtime/src/ports/memory.ts`, dispatched by `dispatch.ts`          |

  A skill declaring `runtime:{capability}` makes the projection emit a thin `scripts/<cap>.mjs` forwarding
  to the host `runtime <cap>` CLI; the impl is never bundled. So the heartbeat is a **runtime
  capability** (sibling of the registered `event-tap`), invoked by a skill, and _optionally_ declared by a
  dimension. Nothing new is needed in the taxonomy to hold it.

- **O2 · realization split — RESOLVED by O1.** One capability, one port, two host-side adapters
  (Channels | SDK-streaming) selected per deployment — precisely how `memory` runs one port over a
  swappable strategy. Not two capabilities, and not an forge adapter concern: the forge emits the
  same thin shim regardless, and the vector choice lives host-side behind the port.

- **O3 · consolidation coupling — RATIFIED as written.** The prior-art sweep is conclusive and converges
  across four independent architectures: the pulse SAMPLES a pressure/salience gate; it never clocks the
  gate. Remaining sub-question is a threshold value, not a design fork — it belongs in a shard, not here.

### OPEN — the only remaining gate

- **O4 · signifier — nico's remit, and it is now the sole blocker.** `pacemaker` (organ) / `heartbeat`
  (signal) / `mailbox` (store) are _floated candidates_, i.e. contamination in exactly the sense
  `plans/discipline-anchor` documents — a contrastive read of a supplied candidate is confirmation, not
  discovery. Naming is a signify act under `cratylism`: it must be cold-derived, never adopted because it
  sounds right. Until the anchors are discovered, the capability has no name to register under, and any
  shard that creates files would be coining by fiat.
- **O5 · safety.** Mailbox = prompt-injection surface; trusted-local-producer gating; idle-tick cost;
  interaction with the stance-guardrail (a self-delivered beat must not read as an autonomy collapse).
  Design constraint for the shards, not a blocker on cutting them.
- **O4 · signifier.** organ = **pacemaker**, signal = **heartbeat**, inbound store = **mailbox** (settled
  vs "queue" — mailbox wins on actor-model industry-standard AND LLM-decode). Run /signify to lock anchors.

## Shards

`pending/`: (none yet). O1–O3 no longer gate the cut; **O4 does**. The shard boundaries are already legible
from the resolved architecture — port + adapter, skill + shim, mailbox drain, consolidation gate, safety —
but every one of them names files and exports, and the anchors are undiscovered. Cutting shards now would
bake `pacemaker`/`heartbeat` into paths by fiat, which is the failure `discipline-anchor` exists to prevent.
Run `/signify` for O4 first, then `/praxis`.

## See also

`packages/runtime/src/ports/` + `src/capabilities/event-tap` (**the pattern to copy** — a registered
capability behind a port, dispatched by `src/dispatch.ts`) · `packages/canon/src/skills/wake/skill.ts`
(`runtime: { capability: 'memory' }` — how a skill claims a capability) ·
`packages/forge/src/project/runtime-shim.ts` (the build→runtime seam that emits the thin shim) ·
`packages/forge/src/anatomy/index.ts` (the `Dimension` union) + `packages/canon/src/dimensions/`
(dimension values) · `packages/memory/` + the `dream`/`wake`/`handoff` skills (consolidation coupling, O3) ·
prototype `/private/tmp/claude-heartbeat-channel/` (verified reference) · plans that touch consolidation:
`dream-node-sink-retire` · stance-guardrail (O5 interaction) `plans/stance-guardrail-asktool`.
