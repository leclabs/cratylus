# scoped-memory-v2 — path-scoped memory (execution spec, decision-grade)

Author: Nico, 2026-07-02. **Landed fleet-wide 2026-07-02** — the reference design of the live memory
system (`git log -- plans/scoped-memory-v2/` is the execution record).

The model in one line: every memory event records its **cwd**; **scope = `node(cwd)`, the nearest
marker-declared ancestor directory**, computed by the tool — never reasoned; dream is a
deterministic fold + a semantic routing pass; stores are the CoALA types.

## D1 — Stores: the CoALA types

Home = `{EPISODIC.jsonl · SEMANTIC.md · PROCEDURAL.md}` + SOUL (catalog; the stance lives here).
working = the context window — never persisted. SEMANTIC = identity facts + durable agent-intrinsic
knowledge (hot index; vault for cold). PROCEDURAL = inductively generalized, cross-project wisdom
**not already carried by a projection** (SOUL · skills · gates) — `correction-consolidation` targets
it; the projection-dedup bar governs every write: already-projected ⇒ not stored.

## D2 — Capture: single-store, append-only, derived

```
{ id: ULID, session?: sid, host, cwd,   -- derived by the tool at encode
  body, tags?: […] }                    -- body open; tags refine, never route
```

Scope is not stored — it is `node(cwd)`, computed at fold time. The raw log lives in the agent home
(`${AGENT_HOME}/EPISODIC.jsonl`) — the being's continuity; capture never writes into a repo.

## D3 — Scope: `node(cwd, host)`, computed, total, configurable

`node : (cwd, host) → path`, total over stored record fields: the nearest ancestor of `cwd`
(reflexive — `cwd` itself qualifies) holding a boundary marker. Defaults: `.git` → project ·
package manifest → package · `PLAN.md` → plan · `$HOME` → user (per-host `$HOME` from
`.agent-factory.config` `host.*`); markerless `cwd` is its own boundary. A `.git` **file**
(worktree/submodule) resolves through to the primary checkout's node; a nonexistent node folds to
its nearest existing ancestor. Records without `cwd` fold to an explicit `legacy` bucket. Marker set
extends via `memory.scopeMarkers` (glob list, `.agent-factory.config`). The resolver is an
`agent-memory` verb — agents invoke it through the memory skill, never infer it.

## D4 — Dream: deterministic fold + semantic routing

- Pass 1 (tool): fold the live log → routing manifest, `record ↦ node(cwd)` — byte-deterministic.
- Pass 2 (dream): type/voice routing over the manifest, multi-scope splits, cross-project lessons
  generalized to agent-intrinsic under the D1 dedup bar. The route is total:

```
route : I → { AGENTS.md@node (versioned) · SEMANTIC · PROCEDURAL · vault · EPISODIC (next-steps, own-node only) · drop }
```

- A plan node's `AGENTS.md` receives that plan's next-steps/open-threads, depalimpsested on write.
- A caller-supplied scope on any verb is an inert `tags` entry — never routing (the fold is the only
  scope authority).
- In-repo writes are exactly: versioned `AGENTS.md` at nodes; nothing else. Extension point (no v2
  producer): node-local episodic views — if ever materialized, gitignored and read by the tooling
  via the filesystem, harness default-invisibility expected.

## D5 — Rituals

- **wake**: load = SEMANTIC + PROCEDURAL whole + `read --under <node(session-start cwd)>`;
  out-of-node records appear as counts only. `audit` (allow-file resolution
  `--allow > <home>/audit-allow.txt > none`) is dream's exit gate; pins are ritual state.
- **dream**: the D4 fold; `${AGENT_HOME}/dream.lock` (O_EXCL; stale = age > 2h) serializes the
  shared partition {SEMANTIC, PROCEDURAL, drain} — same-host sessions of one agent share these
  regardless of project.
- **encode duty** (kernel): cadence unchanged; the tool derives everything derivable.
- **Coverage law**: every dimension that touches the stores moves with them — deploy seeds
  (`agent-forge` `SEED_FILES`) and the audit scan set retarget to
  `{SEMANTIC.md, PROCEDURAL.md, EPISODIC.jsonl}`; the route engine's target set and addressing
  retarget from the v1 dimension names to node paths. A store rename that skips any of these silently
  undoes itself.

## D6 — Migration: one-time, manual, clean-slate

Per host, per agent, `.bak`-first: harvest SELF + MEMORY — PROCEDURAL keeps only what survives a
negative projection-grep; SEMANTIC keeps identity facts + the few durable agent-intrinsic entries;
everything else drops without ceremony. Legacy EPISODIC drops behind the archive. `SELF.md` /
`MEMORY.md` removed after verified harvest; audit green per home. The next wake reorients from git
history + plan context — by design. No migration machinery lands in tool or skill.

## Decisions index

| id  | call                                    | over                                       | why (load-bearing)                                                                        |
| --- | --------------------------------------- | ------------------------------------------ | ----------------------------------------------------------------------------------------- |
| D1  | CoALA stores; projection-dedup bar      | a bespoke identity layer; faithful carry   | industry taxonomy; stance is SOUL's; projected wisdom needs no copy                       |
| D2  | cwd-only derived capture, body-resident | write-set telemetry hooks; capture tags    | the sufficient signal already exists; no new subsystem                                    |
| D3  | computed `node(p)`, marker-configurable | fixed user/project/local enum; inference   | the enum is 3 nodes of the general case; a resolver is a program                          |
| D4  | one deterministic fold, total route     | replay verbs; behavioral scope rules       | tool-filtered loads make defection mechanical-impossible; no branches for one-time events |
| D6  | clean-slate harvest-and-drop            | faithful store migration; replay of legacy | corrections are structurally backstopped; git + plans re-teach                            |
