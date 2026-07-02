# scoped-memory-v2 — path-provenance memory (execution spec, decision-grade)

Author: Nico, 2026-07-02. Status: **awaiting Operator approval** — approval releases `pending/` into
execution.

The model in one line: memory events carry **mechanical file-path provenance** captured by the
harness; **scope is a position in a marker-declared directory lattice**, computed at consolidation —
never judged at capture; consolidation is a **re-runnable fold**; stores are the CoALA types.

## D1 — Stores: the CoALA types

Home = `{EPISODIC.jsonl · SEMANTIC.md · PROCEDURAL.md}` + SOUL (commons; the stance lives here).
working = the context window — never persisted. SEMANTIC = identity facts + durable agent-intrinsic
knowledge (hot index; vault for cold). PROCEDURAL = hard-won, inductively generalized, cross-project
wisdom **not already carried by a projection** (SOUL · skills · gates) — `correction-consolidation`
targets it, and the projection-dedup bar governs every write: already-projected ⇒ not stored.

## D2 — Capture: telemetry-first, single-store, append-only

```
{ id: ULID, session: sid, host, cwd,                  -- derived at encode
  writes: [host:path…], reads?: [host:path…],         -- the unit-of-work's write/read sets, host-qualified
  body, tags?: […] }                                  -- body open; tags = semantic layer, refine, never route
```

The mechanical layer is load-bearing; the semantic layer never is. Scope is computed at fold time
(D4), not stored. Raw log lives in the agent home (`${AGENT_HOME}/EPISODIC.jsonl`) — the being's
continuity; raw telemetry never lands in a repo.

**Telemetry source = the harness (D2a).** A PostToolUse hook (agent-forge-projected) journals
Write/Edit/NotebookEdit/unambiguous-Bash-mutation paths per session to
`${AGENT_HOME}/.telemetry/<sid>.jsonl`; `encode` folds the since-last-encode window into `writes`.
`--paths` supplements; hook absence degrades to cwd-only (capture never blocks).

## D3 — Scope: marker-declared directory lattice

- Scopes = directory nodes; `⊑` = path-prefix containment. **Boundary = marker-file presence.**
  Built-in default markers: `.git` → project · package manifest (`package.json` etc.) → package ·
  `PLAN.md` → plan · `$HOME` → user. The launch cwd is always a node (an unmarked scratch dir is its
  own scope, never `$HOME`'s).
- Marker set is **configurable**: `memory.scopeMarkers` (glob list) in `.agent-factory.config`
  extends/overrides the defaults. Repo-level declaration = extension point, deferred until a repo
  needs it.
- `node(p)` ≜ the nearest ancestor boundary of path `p`. Canonical project key = the repo-root node;
  finer nodes (package, plan) are refinements strategies may use.
- **Attribute-to-writes**: scope(event) from its write-set (LCA across the lattice; a cross-scope
  write-set stays raw for the fold to split). Writeless event → `node(cwd)`. Reads = context, never
  scope.

## D4 — Dream: one fold, re-runnable

- dream = fold(window) through an ordered strategy pipeline: **deterministic pass** (lattice
  resolution per D3 → a routing manifest) then **semantic pass** (re-judge: split multi-scope,
  generalize a cross-project lesson to agent-intrinsic, route by type/voice, apply the D1
  projection-dedup bar). Two-axis routing: scope → instance, type → organ.
- Window: default = the live log; `--replay` widens to retained archives. **A strategy or model
  change is handled by `dream --replay`** — consolidation is recomputation, there is no separate
  migration machinery.
- Outputs: scope nodes' **versioned `AGENTS.md`** (semantic-at-scope; dedup · net-current ·
  move-not-copy; a plan node's `AGENTS.md` receives that plan's next-steps/open-threads,
  depalimpsested on write) · SEMANTIC/PROCEDURAL (agent-intrinsic) · vault. Unversioned per-node
  views: deferred tier — materialize only at marker nodes, only on demonstrated demand; rebuildable
  from the log, so deferral costs nothing.
- Retention: v2 records (telemetry-bearing, replayable) — keep-all-compact archives. Records
  predating the telemetry schema are unreplayable: dropped at first v2 dream behind one `.bak`.

## D5 — Rituals

- **wake**: load = SEMANTIC + PROCEDURAL whole + `read --under <node(launch cwd)>` episodic;
  out-of-node records surface as **counts only**. Orient law: **an out-of-node thread is surfaced as
  one report line — never acted on, never a self-directed project switch**; project changes are
  operator-directed. `audit` is dream's exit gate.
- **dream**: the D4 fold. `dream.lock` (O_EXCL, stale-by-age) serializes the shared partition
  {SEMANTIC, PROCEDURAL, drain} — same-host sessions of one agent share these regardless of project.
  No session registry: the shared partition needs mutual exclusion, not discovery; a lockfile is the
  whole requirement.
- **encode duty** (kernel): cadence unchanged; the tool derives everything derivable.
- **audit**: default allow-file resolution `--allow > <home>/audit-allow.txt > none`; pins are ritual
  state, never episodic recall.

## D6 — In-repo policy (first-class)

Dream may write in-repo: versioned `AGENTS.md` at scope nodes (git-reviewed org memory — the
feature) · gitignored views at marker nodes (deferred tier) · nothing else; raw telemetry/logs
never. Machine memory joins a repo only through the git-reviewed semantic layer.

## D7 — Migration: harvest-and-drop, drop-biased

Per host, per agent, `.bak`-first: (1) SELF + MEMORY → harvest: PROCEDURAL gets only inductively
generalized cross-project wisdom that no projection already carries (grep-verified against
SOUL/skills before keep); SEMANTIC gets identity facts + the few durable agent-intrinsic entries;
**everything else drops without ceremony** — project-scoped content belongs in (and should already
be in) the project's `AGENTS.md`; unported remainders are weighed once, presumed cruft. (2) Legacy
EPISODIC drops behind one `.bak` (D4 retention). (3) `SELF.md`/`MEMORY.md` removed after verified
harvest; audit green per home. (4) The next wake reorients from git history + plan context — by
design. Store migrations of this class are standing in-remit work: `.bak`-first, per-host,
audit-gated, content-verified.

## Decisions index

| id  | call                                           | over                                        | why (load-bearing)                                                     |
| --- | ---------------------------------------------- | ------------------------------------------- | ---------------------------------------------------------------------- |
| D1  | CoALA stores; projection-dedup bar             | a bespoke identity layer; faithful carry    | industry taxonomy; stance is SOUL's; projected wisdom needs no copy    |
| D2  | telemetry-first, body-resident, no scope field | judgment tags at capture; scope sidecars    | derivation over inference; continuity, ordering, no repo litter        |
| D2a | harness-hook path journal                      | agent-recalled write-sets                   | mechanical end-to-end; recall drifts                                   |
| D3  | marker lattice, configurable, cwd-is-a-node    | fixed user/project/local enum               | enum = 3 nodes of the general case; scratch-dir astonishment           |
| D4  | one re-runnable fold (`--replay`)              | write-time scoping; separate migration verb | retroactive re-scoping; migration = recomputation; one skill           |
| D5  | node(cwd) everywhere; lockfile; no registry    | a session/presence subsystem                | mutual exclusion ≠ discovery; the lattice already names the binding    |
| D6  | git-reviewed in-repo semantic layer only       | machine memory out-of-repo always           | org memory is the feature; litter stays out                            |
| D7  | harvest-and-drop, drop-biased                  | faithful store-shape migration              | corrections are structurally backstopped; git + plans re-teach context |
