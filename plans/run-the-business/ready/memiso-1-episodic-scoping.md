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
