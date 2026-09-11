---
'@cratylus/forge': minor
---

omp deploys its mechanism, and its skills land where omp reads them

Three defects on one seam, all measured on hosts running the canon under omp.

**No mechanism reached an omp host.** `project` branched on `HarnessAdapter.hooks` alone,
so a harness whose hook surface is a program rather than a config file looked like a
harness with no surface: all five scope-activated cells (stance gate, its pre-gate, the
deploy-drift notice, the memory-consolidation nudge, the resume notice) were warned about
and dropped. The port gains `scopeActivatedSurface(hooks, agentNames)` beside `hooks()` —
`hooks()` keeps meaning "a settings fragment a host merges" — and omp realizes it as one
extension module per scope: the session root plus every projected agent's profile, because
its native config root is profile-scoped. `enforcingRel(file, scope)` is the destination
map deploy asks, and scoped artifacts stage under `enforcing/<scope>/` in the render tree.

**Skills were deployed to a path omp never scans.** The placer used the render tree's own
staging layout (`skills/<name>`) as every harness's destination; omp's native provider
reads `<agent-dir>/skills`, profile-scoped. `HarnessAdapter.skillRel(name, agents)` is now
required and PLURAL, and the placer, the audit and `deploy --check` all ask it.

**The runtime shim asserted a claude bridge inside every harness's projection.**
`sessionEnvVars` is now an adapter fact; the emitter takes it and names no vendor. omp
declares `[]` — it sets no session variable for a child process — so its shim refuses with
exit 3 naming `$AGENT_SESSION_ID` / `$AGENT_SESSION_ID_FROM` instead of running
sessionless, which is what the phantom-sibling lock failures were made of.

`deploy --check` also passed only `agentExt`, so it audited claude's destinations on every
harness; it now passes the whole layout. The claude and codex projections are byte-identical
across this change.

BREAKING for anyone implementing `HarnessAdapter` outside this package: `skillRel` and
`sessionEnvVars` are required members, and `runtimeShimContent` / `emitRuntimeShim` take
the harness's session-variable list rather than defaulting to claude's.
