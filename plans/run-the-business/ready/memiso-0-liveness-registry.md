# memiso-0 · session-liveness-registry ⚡ HIGHEST PRIORITY

**Sub-DAG** memory-session-isolation · **Wave** 0 · **Deps** none · **State** ready

## Why (the defect this sub-DAG fixes)

Two concurrent nico sessions in the same node collide in memory: (1) wake's **orient** binds any plan
with task-files in `active/` — owner-blind — so a second face claims a plan a live session is executing;
(2) episodic **`read --under <node>`** returns all same-node records regardless of authoring session, so
a live sibling's forward next-steps bleed in as the reader's own resume state. Node-scoping conflates
_inherit-from-completed_ (wanted, enables cross-`/clear` resume) with _bleed-from-live_ (the bug).

## Governing principle (the whole sub-DAG implements this — canonical statement)

```
Raw working residue (EPISODIC forward-threads · plan active/ ownership) is SESSION-OWNED and isolated
while LIVE. Cross-session sharing happens ONLY through consolidation (drain → stores / AGENTS.md), which
merges COMPLETED sessions. A completed session's residue is INHERITABLE (cross-/clear resume); a live
OTHER session's residue is INVISIBLE (no collision). Isolation axis = session LIVENESS, not node alone.
```

## Objective (this task)

Build the foundational primitive every other task consumes: a **session-liveness registry** in the
`agent-memory` package (source: `packages/agent-memory/src/…`, built to `dist/episodic.mjs` — edit
SOURCE, never `dist`/`.render-ts`/deployed `~/.claude` copies).

## Spec

- Registry home: `<agent-home>/sessions/<session>` (sibling of the stores). One entry per session.
- Verbs (new subcommands on the episodic runtime): `session register` (on wake/first-encode) · `session
heartbeat` (touch) · `session release` (clean exit) · `session status <id>` / `session list`
  (→ `{id, live|completed, last_beat}`).
- Liveness predicate: `live(s) ⇔ registered(s) ∧ ¬released(s) ∧ (now − last_beat) < STALE` (STALE
  reuses the dream-lock 2h convention or a configured value). Crash ⇒ stale ⇒ completed.
- `session` on each record is already tool-derived (present today) — this task adds only the registry +
  liveness predicate + verbs; it changes NO existing read/drain behavior (that is memiso-1).

## Acceptance (falsifier)

- FAIL if `live()` returns true for a session that called `release`, or for one whose last heartbeat is
  older than STALE (crash simulation: register, never beat, advance clock past STALE → must read completed).
- FAIL if the registry is not concurrency-safe (two sessions registering simultaneously corrupt it).
- FAIL if any existing verb's behavior changed (this task is additive; read/drain unchanged here).

## Return

Source paths touched + the verb contracts + a transcript proving: register→live, release→completed,
stale-heartbeat→completed, concurrent-register→both tracked.
