---
'@cratylus/canon': patch
'@cratylus/forge': patch
'@cratylus/schema': patch
---

omp judges in-process; no harness depends on another harness's CLI

`claude -p` was never an acceptable judge for omp, and it was not acceptable for codex
either. The backend hardcoded `judge_bin="${STANCE_JUDGE_BIN:-claude}"`, so every harness's
stance guard required a third vendor's CLI installed, on PATH, and separately
authenticated. When that OAuth lapsed on the author's host, every verdict on every harness
failed open in silence — deployed, opted in, correctly scoped, judging nothing.

**The judge seam is now explicit, and the procedure still has one home.** A host that holds a
model runs the worker twice around a judgment it makes itself: once with `STANCE_EMIT_PAYLOAD`
to collect the gated, layer-1-annotated payload and the rubric that scores it, then again with
`STANCE_VERDICT_FILE` naming its answer. Everything either pass touches before the seam is
read-only, so the counters, the hash and the verdict log see exactly one pass. The gating,
extraction, deterministic pre-filter, evidence verification and block accounting stay in the
worker; only the model call moves.

**omp's shim takes that seam.** The emitted extension module resolves `modelRoles.advisor`
(then `smol`, then `tiny`, then the live session model) through `ctx.modelRegistry`, gets auth
from omp's own registry, and calls `completeSimple` — static-imported from `@oh-my-pi/pi-ai`,
which omp's loader aliases to its own bundled build. Measured against `omp` v18.1.19: the real
26.8 kB rubric judged in 1991 ms on a local model, and a live `mav` session blocked, re-opened
the turn, and settled with a tripwire `claude` first on `PATH` never once invoked.

The richer `judgment` module (`TextJudge`, `chatTextBackend`, `NoulQuestion`) exists in omp's
source but is **not** in the bundled compat entrypoint the shipped binary carries; importing it
silently kills the module load. `completeSimple` is what the binary exposes and what a judge
needs.

**The judge binary is now a projection fact, not a literal.** `harness-judge-bin` joins the
closed `ProjectionFact` set; each adapter answers with its own name — claude `claude`, codex
`codex`, omp the **empty string**, because it judges in-process and names no subprocess at all.
An empty value is a real answer and the backend reads it as one, failing open rather than
falling back to somebody else's CLI.

**A gate holds the law.** `canon/harness-independence.test.ts` fails if any committed worker
names another harness's home in executable shell, or if a cell template names a vendor CLI
where a projection fact belongs. Both legs were convicted before admission: a
`$HOME/.claude/...` line injected into a committed worker and a `:-claude}` default restored to
the cell each produced exactly one finding, and removing them returned the gate to green.
Comments are exempt — a rule that forbids naming `claude` in a sentence would delete the record
of the repair along with the bug.
