# Session-lifecycle & memory-consolidation trigger (v2 — converged)

nico (design authority). v1's PreCompact-primary REJECTED by two adversarial reviewers (grounded + mechanism);
v2 is the converged design. ρ=LLM.

## The tension (unchanged)

Consolidation (`dream`) needs LIVE agent reasoning (P2 strategy). `session.end` is post-inference (dead).
Consolidating on HOT context beats cold catch-up. Must be harness-generic + memory-module-owned (no agent-side
skill names `dream`/`episodic.mjs`).

## Why v1 (PreCompact-primary) was wrong (verified)

- **PreCompact cannot make the agent reason.** Claude Code PreCompact is command-only (`decision:block`, NO
  `additionalContext`); no live turn runs between it and compaction (issues #43733 not-planned, #17237). The
  hook fires a shell command; the model never acts. Unimplementable.
- **Post-compaction context is SUMMARIZED (lossy)** — "max-hot at PreCompact" is a mirage.
- **Not harness-generic** — PreCompact is CC-only; raw SDK compaction is opaque server-side; codex has none.
- **Against all convergence** — no surveyed system (Letta/MemGPT · mem0 · Zep · LangMem · Generative-Agents ·
  Cursor · Anthropic memory tool) triggers reasoning-consolidation at compaction; compaction is kept ORTHOGONAL
  to semantic consolidation everywhere.

## v2 design — hot-path consolidation, `turn.end`-nudged, cold catch-up floor

**1. Two act-classes (by whether reasoning is needed):**

| act                                                                       | reasoning? | trigger                             |
| ------------------------------------------------------------------------- | ---------- | ----------------------------------- |
| `encode` (per-turn raw append) · `register`/`heartbeat`/`release`         | NO         | any event, incl. dead `session.end` |
| `consolidate` (dream: `apply`/`replace`) · `reconstitute` (load resident) | YES        | while inference is LIVE only        |

**2. PRIMARY consolidation trigger = agent hot-path, nudged by a threshold-gated `turn.end` (Stop) hook.**

- The consolidation ACT is the agent calling the **`apply`/`replace` verbs (§5.3 already ships them)** in-turn
  — the convergent industry pattern (Letta/LangMem hot-path, Anthropic memory tool).
- **The nudge:** a `turn.end` (Stop) hook the memory module ships. Stop is the ONLY turn-forcing hook
  (`decision:block` + reason force a live continuation turn); it fires HOT (turn just ended, nothing
  summarized) and LIVE. It maps in the hook-capable adapters (claude + ~5). This satisfies both constraints
  PreCompact failed (hot ∧ live).
- **The gate (throttle):** the hook's SHELL counts unconsolidated records in `EPISODIC.jsonl` since the last
  dream marker (cheap `wc`-class, zero tokens). Fires only above a watermark set BELOW the harness auto-compact
  threshold. The compaction trigger point is a **calibration measurement** (instrument once; default the
  watermark ≈60% of measured; env-override) — a knob, not a redesign. Below watermark → silent.
- When it fires: inject a consolidation directive; the agent runs the salience/route reasoning and calls the
  verbs. (This is the repo's own Stop-hook pattern — the stance guard already blocks Stop to inject.)

**3. Cold `session.start` catch-up = the data-safe FLOOR.** `encode` is per-turn durable, so raw is never lost.
Every wake's `reconstitute` runs an idempotent catch-up dream over any unconsolidated records. Cold (reads raw,
not hot context) → it is the NET, the hot-path is the primary. **The 8 hook-less adapters (aider · continue ·
crush · devin · pi · roo · standards · zed) get ONLY this floor** — hot consolidation is honestly a
claude-plus-few capability; degrading to cold-catch-up loses hot-quality, never data. Stated non-goal, not a gap.

**4. `session.end` → mechanical `release` only** (flag flip; command-only hook suffices; no reasoning). Never
consolidation. **`/handoff`** → explicit on-demand consolidation (convenience). **`context.compact.pre`** →
demoted to a shell-only raw-log safety SNAPSHOT (breadcrumb/backup), never agent consolidation.

**5. The braid RELOCATES to the module (does not "dissolve").** `wake`/`handoff` become thin ORCHESTRATORS:

- `wake` ≜ `register → memory.reconstitute → orient → resume` — `orient` (bind project · read PLAN.md ·
  liveness-gate) stays a praxis/session concern, NOT memory.
- `handoff` ≜ `praxis-sync → memory.consolidate → release`.
- Memory exposes two named entrypoints — `reconstitute`, `consolidate` — and the module's OWN hook payload
  names its consolidation (correct ownership). No agent-generic skill names `episodic.mjs`; the orchestrator
  CALLS memory's entrypoint. The braid moves into its rightful owner; it doesn't vanish.

**6. P2 split (clean).** Stop-hook = nudge-mechanism (fires hot+live). `apply`/`replace` = act-mechanism.
Agent = strategy (what to distill/route). Shell-count gate = cheap mechanism (no reasoning). None crosses.

## Deferred / follow-up (owned; not v1 blockers)

- **Sleep-time / offline sidecar** (Letta production pattern · Cursor sidecar) — a separate background agent that
  dreams the raw log post-session with fresh inference. Elegant + meshes with being/faces, but NOT required:
  durable encode + any-face cold catch-up already delivers cross-face continuity. DEFERRED (future optimization,
  like MCP-later). Adopt only if timeliness of consolidation becomes a felt need.
- **Crash-window duplication** (`dream.ts:224` land vs `:246` compact): tolerate v1 (de-palimpsest absorbs;
  window is a single-record crash-between-land-and-atomic-compact; no loss, bounded dup). Harden later with a
  content-hash idempotency guard in `appendToHome`.
- **Finer-grained update** (Zep bi-temporal invalidate-not-delete; mem0 per-fact ADD/UPDATE/DELETE): the trigger
  design must not preclude replacing whole-file `replace` with per-fact ops later. Out of scope now.

## Canonical-event binding (nico sign-off)

`turn.end` (Stop) = consolidation nudge · `session.start` = reconstitute + catch-up · `session.end` = mechanical
release · `context.compact.pre` = shell raw-log snapshot only. (Retires v1's `context.compact.pre`-as-primary.)
