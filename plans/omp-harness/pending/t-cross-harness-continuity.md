# t-cross-harness-continuity

**Wave 1.** An agent wakes in omp as the individual it was in Claude Code.

## Intent

This is the **acceptance criterion for the whole integration**, which is why it is second and
not last. A harness that runs the persona but breaks continuity has not been integrated; it
has been added.

`wake` and `handoff` are the minimum pair: handoff persists at one session's end, wake
reconstitutes at the next session's start, and the pair must hold when the two sessions are in
DIFFERENT harnesses.

## The seams that already exist

- **`omp --from-claude`** imports a Claude Code session. Establish what it actually carries —
  transcript only, or session identity too — because that decides whether it is the continuity
  path or merely a transcript convenience.
- **The memory home is harness-independent by construction.** MODEL states it: a cell is a
  BEING projected to many per-harness FACES, and the being's memory home is single-per-being
  and in no face. If that holds, continuity across harnesses should already work — and the
  first job of this shard is to TEST that claim rather than assume it.
- `--profile` gives an omp persona its own sessions dir; check it does not fragment the
  agent home.

## Constraints

- **Test in the direction that actually happens**: handoff in Claude Code, wake in omp, and
  then the reverse. A one-direction test proves half a property.
- The memory CLI is harness-agnostic and reads only the `AGENT_*` namespace it owns — verify
  that survives omp's environment rather than trusting it.
- **`--under` was just repaired** so it no longer drops foreign-host records; a second harness
  is the first real exercise of that repair.

## Accept

1. An agent handed off in Claude Code wakes in omp carrying its SEMANTIC, PROCEDURAL and
   EPISODIC state, and the reverse.
2. A written finding on `--from-claude`: what it carries, and whether it is on the continuity
   path at all.
3. Any place the memory home turns out NOT to be harness-independent is named, not patched
   over — that would be a MODEL-level defect, not an omp one.
