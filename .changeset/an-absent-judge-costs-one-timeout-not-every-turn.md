---
'@cratylus/forge': patch
---

The omp stance judge has a deadline of its own, and an absent one is asked once

An unreachable judge does not fail — it **hangs**. `askJudge` awaited `completeSimple` with no
bound, and omp kills an extension handler at 30 s, so a judge that had stopped answering cost
every turn end the full budget and then surfaced as `Extension error: handler timed out` — which
reads as the guard being broken rather than the judge being away.

Found by a plain status check rather than by a test: launching a persona through `omp-launch`
printed the extension error, and isolating it showed the worker returning in **30 ms** while a
**one-word** prompt to the configured `advisor` role did not return in 20 s. The endpoint was
down; the code had no way to say so.

Two bounds, both on the fail-open path a judge that cannot answer belongs on:

- **`JUDGE_TIMEOUT_MS = 12_000`** — a deadline well inside omp's 30 s handler kill. A healthy
  local judge answers this rubric in about two seconds, so the margin is wide enough that a
  slow answer is still heard, and a dead one no longer reaches the host's killer.
- **`judgeAway`** — tripped when the deadline fires and read on every later turn. An endpoint
  that is away stays away; re-proving it on each turn end buys nothing and taxes the whole
  session. One timeout, not one per turn.

Verified against a live down endpoint: the same launch that printed
`handler timed out after 30000ms` now completes with no extension error and no refusal, the
guard having correctly declined to judge what it could not reach.
