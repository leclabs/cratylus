# memiso-1 · episodic read + drain become liveness-aware ⚡ HIGH PRIORITY

**Sub-DAG** memory-session-isolation · **Wave** 1 · **Deps** memiso-0 ⊳dep (liveness registry) · **State** pending

## Objective

Make the episodic tool's `read` and `drain` respect session-liveness (memiso-0's registry), so concurrent
live sessions stop bleeding into each other while cross-`/clear` inherit and cross-session consolidation
are preserved. Code in `agent-memory` SOURCE (not `dist`/`.render-ts`/`~/.claude`).

## Spec — the two verbs

```
read  --home --for-session <S> --under <node> :
    return records where node(cwd) ⊑ node  AND  ( session == S  OR  completed(session) )
    EXCLUDE records of live OTHER sessions (session ≠ S ∧ live(session)).
    → wake passes S = my session: I resume my own + inheritable completed residue, never a live sibling's.
    Back-compat: absent --for-session ⇒ today's behavior (all --under node), so nothing silently breaks.

drain --home [--completed-only | --for-session <S>] :
    fold+drain records of COMPLETED sessions (and my own S at handoff);
    NEVER drain a live OTHER session's residue.
    Consolidation still merges ACROSS all drained (completed) sessions — the cross-session merge is intact.
    post: live-other residue remains; completed residue consolidated + cleared.
```

- `live()/completed()` come from memiso-0. Reuse its predicate; do not re-implement.
- Keep `--under <node>` as the spatial filter; liveness is the ORTHOGONAL new filter (both apply).

## Acceptance (falsifier)

- FAIL if a `read --for-session A` returns a record authored by a DIFFERENT live session B (the bleed).
- FAIL if it EXCLUDES a completed prior session's records under the node (that would break cross-`/clear`
  resume — the behavior we must keep).
- FAIL if `drain --completed-only` removes or folds any record of a live other session.
- FAIL if `drain` stops consolidating across multiple completed sessions (cross-session merge must persist).
- FAIL if the default (no --for-session) call path changed behavior (back-compat).

## Return

Diff + a two-session transcript: A live + B live → A's read excludes B's records; B releases (completed)
→ A's read now includes B's; `drain --completed-only` folds A? No (A live) + B (completed) and leaves A;
consolidation shows B's durable events merged into the target store.

## Outcome (2026-07-04 · done)

**Source touched:**

- `src/session.ts` — added `liveSessions(home, now?, stale?) → Set<id>` (reuses `isLive`/`sessionStatus`;
  the predicate is defined once).
- `src/store.ts` — `drain` gains an optional `retain: (rec) ⇒ boolean` predicate. Absent it, the WHOLE
  log drains via the byte-exact copy path (back-compat). With it, only the non-retained subset is archived
  (serialize + parse-count verify) and the retained records are rewritten into the live log.
- `src/cli.ts` — `read --for-session <S>` applies the ORTHOGONAL liveness filter (keep iff `session
undefined ∨ == S ∨ ¬live`); `drain --completed-only | --for-session <S>` builds `retain = live-OTHER`
  (`session ≠ undefined ∧ ≠ S ∧ live`); `--stale <ms>` overrides the window on both. USAGE updated.
- `test/liveness-read-drain.test.ts` (NEW, 9 tests) — every falsifier.

**Falsifiers cleared** (unit + bundled `dist/episodic.mjs` two-session drive):

- read `--for-session A` with B live → excludes B's records (bleed closed); keeps own + sessionless. ✓
- B released (completed) → A's read now includes B's (cross-`/clear` inherit preserved). ✓
- `drain --completed-only` with A,B live → drains only sessionless; **retains both live**. ✓
- `drain --for-session A` → drains own A + sessionless, **retains live-other B**. ✓
- two completed sessions drain together in one pass (cross-session consolidation intact). ✓
- default (no flag) read/drain unchanged (back-compat). ✓

**Scope note for memiso-2/3:** `fold` (dream's pass-1 routing) is NOT liveness-filtered here — the task
scoped exactly `read` + `drain`. The dream skill (memiso-2) composes its working set via `read
--for-session S`, so live-other records never reach the classifier; whether `fold` itself needs the filter
is a memiso-2/3 composition decision, surfaced here rather than silently pre-decided.

Gates: pkg `test`(152) · `typecheck` · `biome` green; `build` → `dist/episodic.mjs` 42.8 KB.
