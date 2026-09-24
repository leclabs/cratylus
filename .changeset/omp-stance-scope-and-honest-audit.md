---
'@cratylus/forge': minor
---

The omp adapter projects a per-persona stance manifest, and the deploy audit
stops lying in both directions.

The omp projection now emits `<scope>/stance/manifest.json` for every persona,
keyed by the cell that owns each gate and carrying that cell's moments, so a
second gated dimension is a second entry rather than a new field, a new file, or
a line in any caller. The emitted extension derives its own scope directory from
its placement and passes it in the envelope, so a worker resolves its own gate
and the dispatcher learns nothing about who is enrolled.

**Breaking.** The emitted bridge no longer returns early when the judge produces
nothing. It writes the empty verdict file and fires the worker anyway, which
reaches the worker's own `dark` announcement and forwards it once per session to
agent and operator alike. Failing open is the correct enforcement posture;
failing open silently is the bypass — measured at five hours of one session
judged nothing while the endpoint behind `modelRoles.advisor` accepted
connections and never answered.

The judge deadline moves from 12 s to 22 s and its away-latch from the first
timeout to three consecutive misses, cleared by any answer. The old budget came
from a local judge answering in two seconds; re-measured against a cloud model,
one 9 KB payload against the 29 KB rubric takes 9.3 s, so a healthy judge
brushed the deadline and a single transient blacked out a whole session.

Three placement defects in deploy are fixed. `renderedFiles` never enumerated
the shared stage, so the audit reported the stance rubric as ours-and-retired
and the prune borrowed that set as its candidates — an audit condemning the
artifact it exists to protect. The same pass compared rendered bytes raw while
the placer resolves `SCOPE_DIR_TOKEN` at write, leaving six persona overlays
permanently and falsely stale. And both scoped placement and scoped audit walked
a persona directory one level deep, silently dropping any nested artifact.
