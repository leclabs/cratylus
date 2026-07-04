# memiso-2 · orient + drain skill layer: liveness-gated plan-bind ⚡ HIGH PRIORITY

**Sub-DAG** memory-session-isolation · **Wave** 1 · **Deps** memiso-0 ⊳dep (liveness registry) · **State** pending

## Objective

Close the DOMINANT collision surface: wake's **orient** binds any plan with task-files in `active/`,
owner-blind. Make plan-binding liveness-gated, and make dream's drain call the liveness-aware verb.
Skill/prose SOURCE under `packages/agent-anatomy/src/organs/memory` (wake · dream · memory skills) —
edit source, redeploy; never the `.render-ts`/`~/.claude` rendered copies.

## Spec

1. **Plan owner-stamp.** A plan records its executing session: add `owner: <session>` to the plan
   (PLAN.md front-matter or a `.owner` file). Set when a session dispatches the plan's first task
   (state → active). Cleared/loosened when the owner completes.
2. **Orient becomes liveness-gated** (wake skill): auto-bind an `active/`-populated plan ONLY if
   `owner ∈ {me, completed}`. If `owner` is a LIVE other session, the plan is OCCUPIED — orient REPORTS
   it ("plan X is being executed by a live session; not resuming") and does NOT bind. Falls through to
   the next candidate / a clean orientation.
3. **Dream drain** (dream skill): call the memiso-1 liveness-aware `drain --completed-only`, and read
   via `--for-session`; state in the skill that drain never touches a live sibling's residue.
4. **memory skill**: document the governing principle (session-owned-while-live · consolidation-is-the-
   sole-cross-session-merge · liveness axis) so the model is discoverable, not folklore.

## Acceptance (falsifier)

- FAIL if a fresh wake, with a plan whose `owner` is a LIVE other session, BINDS/resumes that plan
  (simulate: session A owns plan P (active, live); session B wakes in the node → B must report-not-bind P).
- FAIL if a plan owned by a COMPLETED session is NOT inheritable (B must be able to resume P once A is
  completed — cross-`/clear` handoff of a plan must still work).
- FAIL if dream's drain touches a live sibling's records (regression against memiso-1).
- FAIL if the memory skill does not state the liveness model.

## Return

Skill diffs + a transcript: A owns P live → B wakes → B reports "occupied, not resuming"; A released →
B wakes → B resumes P. Plus confirmation dream drain uses the completed-only path.

## Outcome (2026-07-04 · done)

**Skill/prose source touched** (agent-anatomy `.ts` source; projected + verified, never `.render-ts`):

- `src/skills/praxis.ts` — formal block gains `self`, `live`, `owner : P ⇀ session`, `occupied(P)`;
  `dispatch` stamps `owner(P) := self`; `session-isolation` law; a **Session ownership** prose para
  (`plans/<plan>/.owner` sidecar, liveness-gated not a lock, refreshed on dispatch, no explicit clear).
- `src/skills/wake.ts` — WAKE sequence `register → dream → load → orient → resume`: a `register` step,
  `load`'s EPISODIC read gains `--for-session ${CLAUDE_SESSION_ID}`, `orient` is LIVENESS-GATED (bind an
  `active/` plan only if `owner ∈ {self, completed}`; live-other ⇒ report-not-bind). A **Session isolation**
  body paragraph. Both formalBlock + mirrored body edited in lockstep.
- `src/skills/dream.ts` — read `--for-session`, drain `--completed-only`; new `session-liveness` absorbed
  declaration; §1/§3 + verb-set `V` updated (adds `session`; notes encode heartbeats).
- `src/skills/handoff.ts` — a **Release closes the session** law: `session release` as the final persist act.
- `ideas/memory.md` — `## Protocol` gains the complete **Session isolation** governing principle (→ every
  SOUL genus via `base.ts`, maximally discoverable); `## Tool` verb docs updated (read `--for-session`,
  drain `--completed-only`, new **Session liveness** `session` verb).
- `src/agents/base.ts` — regenerated (`tsx src/toolkit/make-base.ts`) so the SOUL `## Memory Protocol`
  genus carries the principle. `test/projection-stability.test.ts` — WAKE-sequence assertion updated.

**Code (registry lifecycle wiring):** `src/cli.ts` `encode` now heartbeat-upserts the current session
(`registerSession(home, rec.session)`) — realizes memiso-0's "register on first-encode", so an
actively-encoding session stays live and one idle > 2h correctly falls to completed. 2 new tests.

**Falsifiers:**

- fresh wake, plan owner = LIVE other → orient reports occupied, does not bind — mechanism driven live
  (owner status `live` ⇒ report-not-bind). ✓
- owner COMPLETED → inheritable (release → status `completed` ⇒ orient may bind). ✓
- dream drain uses `--completed-only` (never a live sibling) — projected into dream §3 + verified in the
  rendered SKILL.md; tool behavior proven in memiso-1. ✓
- memory skill states the model — the governing principle is in `## Protocol` (SOUL genus, rendered
  `Session isolation (concurrent…)` present in `nico.md`) + the `## Tool` verb docs. ✓

Note: the skill layer is agent-followed PROSE, not a program — its behavioral falsifiers (an agent wakes
and reports/binds) are exercised end-to-end in memiso-3; the tool PRIMITIVES the prose invokes
(`session status`, `read --for-session`, `drain --completed-only`) are unit-proven in memiso-0/1.

Gates: anatomy `test`(36) · `typecheck` green; repo-wide `build · test · lint · typecheck` green;
projection clean (11 agents + 16 skills, zero unexpected drift); `.owner`-gate driven live.
