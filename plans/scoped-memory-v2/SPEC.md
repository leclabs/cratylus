# scoped-memory-v2 — path-provenance memory (execution spec, decision-grade)

Author: Nico, 2026-07-02. Status: **awaiting Operator approval** — approval releases `pending/` into
execution. Supersedes v1's scope-tag-as-judgment model (D3-v1 falsified in the field: 32/38 records
mis-tagged; root incident = scope defection acting on out-of-scope EPISODIC). Prior-art survey on
record (session 2026-07-02): composition unshipped; every leg proven (nested-AGENTS.md lattice ·
Mylyn event-capture · CamFlow/tup write-sets · event-sourcing folds · Letta sleep-time consolidation).

## D1 — Stores: CoALA-aligned; SELF dissolves

Home = `{EPISODIC.jsonl · SEMANTIC.md · PROCEDURAL.md}` + SOUL (commons, unchanged). working = the
context window — never persisted. SELF splits: learned dispositions/laws → PROCEDURAL
(`correction-consolidation` re-targets there); identity facts/history → SEMANTIC (identity section);
stance → already SOUL (was double-carried). Wake reads SEMANTIC + PROCEDURAL whole; continuity intact.
Names are the CoALA standard (industry σ\*; no blind gate needed — the organ already declares
`episodic · semantic · procedural`).

## D2 — Capture: telemetry-first, single-store, append-only

Record = mechanical layer (load-bearing) + body + optional semantic layer (never load-bearing):

```
{ id: ULID, session: sid, host, territory,            -- territory = launch-cwd's boundary node, derived
  cwd,                                                -- at encode, derived
  writes: [host:path…], reads?: [host:path…],         -- the unit-of-work's write/read sets, host-qualified
  scope_override?: tag,                               -- deliberate agent override, rare
  body, tags?: […] }                                  -- body open; tags refine, never route
```

Scope is NOT stored as a judgment — it is computed at fold time (D4). v1's tag grammar retires as the
load-bearing axis. Raw log stays in the body (`${AGENT_HOME}/EPISODIC.jsonl`) — the being's
continuity; raw telemetry never lands in a repo.

**Telemetry source = the harness, not agent recall (D2a).** A PostToolUse hook (agent-forge-projected,
stance-guardrail pattern) journals Write/Edit/NotebookEdit/Bash-mutation paths per session to
`${AGENT_HOME}/.telemetry/<sid>.jsonl`; `encode` folds the journal's since-last-encode window into
`writes`. Agent-supplied `--paths` remains as supplement; hook absence degrades to cwd+territory only
(never blocks capture).

## D3 — Scope: directory lattice, marker-declared, prefix-ordered

- Scopes = directory nodes; `⊑` = path-prefix containment. Boundary markers: `.git` root · `AGENTS.md`
  · `PLAN.md` (plan node) · `$HOME` · **launch cwd always a node** (kills the /tmp astonishment).
- Canonical project key = the repo-root node; finer prefixes (packages/, plans/<name>/) are refinements
  strategies may use. user/project/local/plan = distinguished nodes, not an enum.
- **Attribute-to-writes**: scope(event) from its write-set (LCA within the lattice; cross-scope
  write-sets kept raw for the strategy to split). Writeless event → territory. No territory → $HOME
  node. Reads = context, never scope.

## D4 — Dream: strategy-pipeline fold; re-dream = migration

- dream = fold(events) through an ordered strategy pipeline: **deterministic pass** (lattice
  resolution: writes→node, territory fallback, override respect) then **semantic pass** (LLM re-judge:
  split multi-scope, generalize cross-project lessons → agent-intrinsic, route by type/voice). Two-axis
  routing unchanged: scope→instance, type→organ.
- Outputs: scope nodes' **versioned AGENTS.md** (semantic-at-scope; dedup · net-current ·
  move-not-copy) · SEMANTIC/PROCEDURAL (agent-intrinsic) · vault. Unversioned per-node views
  (`.episodic-memory.jsonl` sidecars): **deferred tier** — materialize only at marker nodes, only when
  demand shows (the .DS_Store law); rebuildable from the log, so deferral costs nothing.
- **Re-dream**: drain archives keep the full raw stream (rotated `.bak`, retention raised to
  keep-all-compact); a strategy/model change = re-run the fold over archives. Migration becomes
  recomputation — v1's hand-carry migration class retires.
- Legacy records (v1 tags, no telemetry): a compat strategy maps `scope` tag → override field;
  untagged → territory-of-record if present, else user.

## D5 — Rituals

- **wake**: load = SEMANTIC + PROCEDURAL whole + `read --territory <node>` episodic (filter now
  trustworthy — derived, not inferred) + out-of-territory **counts**. Orient: **out-of-territory law**
  — a foreign-scoped thread is surfaced as one report line, never acted on, never a self-directed
  project switch (codifies the probe's judgment-gap). audit stays dream's exit gate.
- **dream**: the D4 pipeline; `dream.lock` (O_EXCL, stale-by-age) serializes the shared partition
  {SEMANTIC, PROCEDURAL, drain} — same-host cross-project sessions share them (scope-independent
  hazard). Session registry remains DECLINED (v1 verdict stands; the incident was policy, not
  discovery).
- **encode duty** (kernel): unchanged cadence; the tool derives everything derivable.

## D6 — In-repo policy (first-class, diverges from industry deliberately)

Dream may write: versioned `AGENTS.md` at scope nodes (human-reviewable org memory — the feature) ·
gitignored views at marker nodes (deferred tier) · NOTHING else in-repo; raw telemetry/logs never.
Industry keeps machine memory out of repos; we join memory to the repo **only** through the
git-reviewed semantic layer.

## D7 — Harvest from the upmav prototype

Keep (re-founded on derived telemetry): `dream.lock` verbs · audit default-allow
(`--allow > <home>/audit-allow.txt > none`) · territory read/drain filters · the oracle harness
pattern as the acceptance suite. Declined: session start/end/list, liveness/steal, SESSIONS.jsonl.
upmav's host fork supersedes cleanly at cutover (`.bak` restore point on host).

## D8 — Migration (recomputation-first)

Per host, per agent: (1) SELF → SEMANTIC + PROCEDURAL split — each agent dreams its own split
(identity voice), Nico judges; `.bak`-first; (2) MEMORY.md → SEMANTIC.md rename-with-review;
(3) legacy EPISODIC archives retained for re-dream; (4) audit green (unpinned or reviewed pins) per
home; kernel/SOUL reprojection carries the new store names. Fleet cutover atomic per host
(runtime + hook + SOULs + skills together).

## Decisions index

| id  | call                                         | over                                                 | why (load-bearing)                                                          |
| --- | -------------------------------------------- | ---------------------------------------------------- | --------------------------------------------------------------------------- |
| D1  | CoALA stores; SELF dissolved                 | keep bespoke SELF                                    | one bespoke layer vs industry taxonomy; stance already in SOUL              |
| D2  | telemetry-first capture, body-resident       | scope-judgment tags (v1) · capture-to-scope sidecars | 32/38 field mis-tag; VCS/ordering/continuity                                |
| D2a | harness-hook path journal                    | agent-recalled write-sets                            | derivation over inference, end to end                                       |
| D3  | marker-declared lattice; attribute-to-writes | user/project/local enum                              | enum = 3 nodes of the lattice; /tmp astonishment; build-system outputs rule |
| D4  | fold + re-dream                              | write-time scoping; hand migration                   | retroactive re-scoping; migration = recomputation                           |
| D5  | out-of-territory law; lock; no registry      | presence/discovery machinery                         | incident was policy-class; probe confirmed                                  |
| D6  | git-reviewed in-repo semantic layer only     | industry's out-of-repo-always                        | org memory is the feature; litter stays out                                 |
