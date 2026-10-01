---
'@cratylus/canon': patch
---

A purview refusal no longer strands the agent. The deny gives the judge's reason followed by the way forward: act on it, or, if the agent holds it wrong, write why into the file the reason names with the one shell command it spells out, then repeat the same call. That call goes through unjudged, a line naming the guard and the agent's reason is said where the operator reads it, and the contest is appended as one JSON line to `$GUARD_CONTEST_LOG` (default `~/.agents/guardrail/contests.log`) for the operator to review. A retry with no contest is judged again and refused again, and a write under `$TMPDIR/guardrail-contest/` is never refused. The shell this needs, with the judge-payload clip, now lives in `guard-shell.ts`, the one home every guard worker shares. The purview worker is cut to what its act needs: 8.1 KB from 15.4 KB, its judge payload unchanged byte for byte.
