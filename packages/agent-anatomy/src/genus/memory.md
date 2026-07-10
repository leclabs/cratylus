---
kind: structure
render: verbatim
deploy: skill-dir
skill_description: The memory organ — the standalone `memory` tool plus the protocol governing how an agent encodes events and consolidates them across sessions. Not a slash-command; the home its memory rituals run from.
description: An ambient person-agent's memory — the one home for the whole lifecycle (encode → dream → wake) and the model behind it: resident stores (SOUL commons-fixed; SEMANTIC, PROCEDURAL, EPISODIC self-authored) plus the outward home (vault), where every record's scope is computed from its cwd (node(cwd), the nearest marker-declared ancestor directory) and its type picks the organ — so one agent stays one person across fleet, user, and project.
---

# Memory

The one home for an ambient person-agent's memory — the stores (SOUL · SEMANTIC · PROCEDURAL · EPISODIC), the lifecycle (encode → `dream` → `wake`), and the protocol every agent runs. The `memory` tool is installed on every host (PATH tool).

## Protocol

Memory ≜ persistence across sessions. Resident stores (the CoALA types):

- **SOUL** -- this def: fixed essence, commons-generated, deploy-overwritten; never hand-edit.
- **SEMANTIC** (`SEMANTIC.md`) -- identity facts + durable agent-intrinsic knowledge (hot index; vault = cold corpus); read whole at reconstitution.
- **PROCEDURAL** (`PROCEDURAL.md`) -- inductively generalized cross-project wisdom no projection already carries (already-projected => not stored); read whole at reconstitution.
- **EPISODIC** (`EPISODIC.jsonl`) -- append-only JSONL of open records: the encode target, drained at dream.
- **working** -- the context window itself; never persisted.

SEMANTIC · PROCEDURAL · EPISODIC: self-authored, never overwritten by deploy. Home = beside this def in `{name}/` -- canonically `~/.claude/agents/{name}/` (user scope). Resolve by absolute path, never cwd-relative -- cwd = the working project, not the home.

**ENCODE (per turn, the one resident duty).** Salience filter: decision + rationale · surprise · error/failure · fact learned · thread opened/closed => one open record each (observed vs inferred marked; cheap, truthful; no distillation at capture). Recording = tool call, never a markdown append (the time-ordered id cannot be hand-minted): `memory encode --home ~/.claude/agents/{name} --body '<the open record>'` -- the tool derives host + cwd; scope = `node(cwd)`, computed at dream, never judged at capture. Encode writes EPISODIC only; unencoded => unconsolidatable.

**Rituals -- procedure lives in the skills, not here:** consolidation (fold -> route) = the **dream** skill; reconstitution (dream -> load -> orient -> resume) = the **wake** skill; tool mechanics = the **memory** skill home (`~/.claude/skills/memory`). **Triggers (Operator, natural language):** **wake** -> /wake; **dream** -> /dream; **encode** (or 'remember this') -> record to EPISODIC now. **First turn after spawn: wake before resuming**, unless the Operator directs otherwise.

**Session isolation (concurrent sessions of one agent in one node).** Raw working residue — EPISODIC forward-threads and a plan's `active/` ownership — is session-owned WHILE LIVE: a live OTHER session's residue is **invisible** (never read, drained, or plan-bound), while a COMPLETED session's is **inheritable** (this is what makes cross-`/clear` resume work). Cross-session sharing happens ONLY through consolidation — dream merges every completed session's durable events into the resident layers, the sole cross-session merge. The isolation axis is session **liveness**, not node alone: `register` (wake) publishes a session, each `encode` heartbeats it, `release` (handoff) or a 2h stale window completes it; the three enforcers are `read --for-session` (own + completed only), `drain --completed-only` (retains a live sibling), and the plan `owner`/`occupied` orient-gate (report-not-bind a live-other-owned plan).

## EPISODIC schema — the build-spec (machinery)

The portable realization of EPISODIC, for the runtime that backs it (Mav's build; not shipped in the verbatim protocol). EPISODIC is a **JSONL event log** — encode minimal and **open**; scope is computed, never captured:

- Record: `{ "id": ULID, "session"?: sid, "host", "cwd", "body", "tags"?: [...] }` -- `host` + `cwd` derived by the tool at encode; `tags` = optional semantic annotations that refine, never route. A caller-supplied scope on any verb is an inert tag.
- **Scope is not stored**: scope = `node(cwd, host)`, computed at fold -- the nearest ancestor of `cwd` (reflexive) holding a boundary marker. Default markers: `.git` -> project · package manifest -> package · `PLAN.md` -> plan · `$HOME` -> user (per-host from `.agent-factory.config`); a markerless `cwd` is its own boundary; a `.git` FILE (worktree/submodule) resolves through to the primary checkout's node; a nonexistent node folds to its nearest existing ancestor; records without `cwd` fold to the `legacy` bucket. Markers extend via `memory.scopeMarkers` (glob list, `.agent-factory.config`).
- **Raw capture is single-store**: every encode appends to the agent's own home log (`${AGENT_HOME}/EPISODIC.jsonl`); capture never writes into a repo (a raw store in a working tree is the bug this rules out). **ULID** for `id` (lexicographically time-sortable) over random UUIDv4; order within the log by ULID.

## Tool

The **`memory`** tool is the encode/read affordance the memory protocol relies on, installed on PATH (the package `bin`, `memory`). An agent cannot hand-mint the time-ordered id an EPISODIC record needs, so "encode an event" is a tool call, never a markdown append. The tool is dependency-free: it runs on any host, with no repo checkout and no runtime dependencies.

- **Encode an event** — `memory encode --home ~/.claude/agents/<your-name> --body '<one open record: what happened; observed vs inferred>'`. Mints a time-ordered id, derives `host` + `cwd`, appends one open JSON line to that agent's home `EPISODIC.jsonl`, and prints the new id. Scope is never passed — it is computed at dream from the recorded `cwd`. If the body begins with `--`, pass it as `--body=<text>` or pipe it via `--body -`.
- **Read events** — `memory read --home ~/.claude/agents/<your-name> [--under <path>] [--for-session <S>]`. One JSON object per line; `--under` keeps same-host records whose `node(cwd)` resolves under the given node (out-of-node and foreign-host records report as counts); `--for-session <S>` adds the orthogonal **liveness** filter — a LIVE OTHER session's records are excluded, while own + completed + sessionless records pass (the session-isolation axis; see the memory protocol); `--count` for just the tally.
- **Resolve a node** — `memory node <path>`. Prints the boundary node governing `<path>` (the scope authority; agents invoke it, never infer it).
- **Fold (dream pass 1)** — `memory fold --home ~/.claude/agents/<your-name>`. Emits the byte-deterministic routing manifest `{id ↦ node | legacy, marker-basis}` the dream's semantic pass consumes.
- **Drain (dream-time)** — `memory drain --home ~/.claude/agents/<your-name> [--keep 5] [--completed-only | --for-session <S>]`. After consolidation: archives the raw log to `<home>/.bak/EPISODIC.<ULID>.jsonl` (verified copy), clears it, keeps the newest `--keep` archives. `--completed-only` drains only COMPLETED sessions' records and retains a live sibling's; `--for-session <S>` also drains the caller's own live S; bare drain clears the whole log (back-compat). Never hand-roll a copy/truncate.
- **Session liveness** — `memory session register|heartbeat|release|status [<id>]|list --home ~/.claude/agents/<your-name>`. One file per session under `<home>/sessions/`; `register` (wake) marks it live, every `encode` heartbeats it, `release` (handoff) completes it. `live ⇔ registered ∧ ¬released ∧ (now − last_beat) < 2h`; a crash falls to completed via the stale window. `status <id>` prints a bare `live|completed|absent` word; wake/dream consume this to isolate sessions.
- **Audit (pollution gate)** — `memory audit --home ~/.claude/agents/<your-name> [--allow <file>]`. Deterministic detector over `SEMANTIC.md`/`PROCEDURAL.md` for project/plan-scoped markers; exit 1 with line-numbered findings, 0 clean. Allow-file resolution: `--allow` > `<home>/audit-allow.txt` > none; pins are ritual state. Wake runs this as dream's exit gate.
- **Lock (dream serialization)** — `memory lock acquire|release|status --home ~/.claude/agents/<your-name>`. `${AGENT_HOME}/dream.lock`, O_EXCL, stale = age > 2h; guards the shared partition {SEMANTIC, PROCEDURAL, drain}.

`--home` is the agent's own sidecar directory — where its `EPISODIC.jsonl` lives — not this skill's directory. Resolve it per host from the tilde (`~`), never as a baked-in absolute path, so one logical home travels across hosts with different roots.

This is an organ-home, not a ritual: the tool is never invoked as a `/memory` slash-command. _When_ and _what_ to encode is governed by each agent's memory protocol (its SOUL); this tool is only the mechanical act of recording — the id-minting and the append the protocol cannot do by hand.
