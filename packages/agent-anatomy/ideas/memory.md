---
kind: structure
render: verbatim
deploy: skill-dir
bundle: ../episodic/dist/episodic.mjs
skill_description: The memory organ — the bundled episodic tool plus the protocol governing how an agent encodes events and consolidates them across sessions. Not a slash-command; the home its memory rituals run from.
delineation: An ambient person-agent's memory — the one home for the whole lifecycle (encode → dream → wake) and the model behind it: resident layers (SOUL commons-fixed; SELF, MEMORY, EPISODIC self-authored) plus outward homes (AGENTS.md, vault), where every memory is placed by two orthogonal axes — type/voice picks the organ, scope picks the instance — so one agent stays one person across fleet, user, and project.
---

# Memory

The one home for an ambient person-agent's memory — the store (SOUL · SELF · MEMORY · EPISODIC), the lifecycle (encode → [[dream]] → [[wake]]), and the protocol every agent runs. Bundles the `episodic` tool to every host.

## Protocol

Memory ≜ persistence across sessions. Resident layers:

- **SOUL** -- this def: fixed essence, commons-generated, deploy-overwritten; never hand-edit.
- **SELF** (`SELF.md`) -- reboot seed: identity accreted across sessions; read whole at reconstitution.
- **MEMORY** (`MEMORY.md`) -- durable semantic facts; recall by relevance; small enough to read whole.
- **EPISODIC** (`EPISODIC.jsonl`) -- append-only JSONL of open records: the encode target, drained at dream.

SELF · MEMORY · EPISODIC: self-authored, never overwritten by deploy. Home = beside this def in `{name}/` -- canonically `~/.claude/agents/{name}/` (user scope); project-scoped deploy => `<project>/.claude/agents/{name}/`. Resolve by absolute path, never cwd-relative -- cwd = the working project, not the home.

- **ENCODE (per turn).** Salience filter: decision + rationale · surprise · error/failure · fact learned · thread opened/closed => one open record each (observed vs inferred marked; cheap, truthful). Recording = tool call, never a markdown append (the time-ordered id cannot be hand-minted): `node ~/.claude/skills/memory/episodic.mjs encode --home ~/.claude/agents/{name} --scope user --body '<the open record>'` -- mints the id, appends to `EPISODIC.jsonl`, prints the id. Encode writes EPISODIC only, never MEMORY/SELF; no distillation at capture -- unencoded => unconsolidatable.
- **DREAM (at reconstitution, before resuming).** Distill EPISODIC; route each item on two orthogonal axes -- kind (voice) × scope (where true): identity -> SELF; durable knowledge -> MEMORY; directive-for-any-agent-here -> the scoped AGENTS.md; networked reference -> the vault; forward next-steps -> stay in EPISODIC; rest -> drop. One item may split to several homes. SOUL is never written. Consolidate = move-not-copy. Clear drained raw via `episodic drain` (first archives a rotated keep-newest-N backup under `.bak/`) -- never a hand-rolled copy. Post-dream invariant: SELF + MEMORY load whole.

**WAKE (each reconstitution):** (1) dream -- consolidate EPISODIC; (2) load -- SELF whole + MEMORY by relevance + EPISODIC next-steps; (3) orient -- work is project-scoped: bind to the cwd's project, resume THAT project's thread (never the globally most-recent), state the binding aloud; an unworked cwd => orient fresh, never import another project's thread; (4) resume as the same individual, on the current project's thread.

**Triggers (Operator, natural language):** **wake** -> the WAKE sequence (dream -> load -> orient -> resume); **dream** -> the DREAM consolidation alone; **encode** (or 'remember this') -> record an event to EPISODIC now. **First turn after spawn: wake before resuming**, unless the Operator directs otherwise.

## EPISODIC schema — the build-spec (machinery)

The portable realization of EPISODIC, for the runtime that backs it (Mav's build; not shipped in the verbatim protocol). EPISODIC is a **JSONL event log** — encode minimal and **open**, apply the taxonomy by reasoning at dream-time, never forced at capture:

- Encoded in the moment: `{ "id": ULID, "scope": "user" | "project:<key>", "path"?: scope-relative, "body": <open> }`.
- After [[dream]] routes it: add `"routes": [...]` (the homes it landed in, incl `drop`).

Derived decisions: **ULID** for `id` (lexicographically time-sortable; UUIDv7 equivalent) over random UUIDv4. Store the **scope-relative path**, not a one-way hash (`fid`) and not an absolute `home` — a path is navigable and a home is derived per host, so both rejects keep portability. **Raw capture is single-store: every encode appends to the agent's own home log (`${AGENT_HOME}/EPISODIC.jsonl`) regardless of scope.** `scope` is a **routing tag** — *where the memory is true / which instance it graduates to* at dream-time — single-valued (if genuinely both tiers, the more durable), and **never a selector of the raw-store location**. `resolveFile(scope, path)` resolves a **routed dream target** (the SELF/MEMORY/AGENTS/vault instance an item graduates to) per host — so a `project:<key>` *target* lands in that project's tree, while raw capture itself never escapes the agent home (a raw store in a project working tree is the bug this rules out). Order within the log by ULID.

## Tool

The **`episodic`** tool is the encode/read affordance the memory protocol relies on, bundled into this home at `~/.claude/skills/memory/episodic.mjs`. An agent cannot hand-mint the time-ordered id an EPISODIC record needs, so "encode an event" is a tool call, never a markdown append. The tool is dependency-free: it runs under `node` on any host, with no repo checkout and no install.

- **Encode an event** — `node ~/.claude/skills/memory/episodic.mjs encode --home ~/.claude/agents/<your-name> --scope user --body '<one open record: what happened; observed vs inferred>'`. Mints a time-ordered id, appends one open JSON line to that agent's home `EPISODIC.jsonl`, and prints the new id. Add `--scope project:<key>` to **tag** an event as project-true — the dream router reads the tag to graduate it to that project's home — but the raw event still lands in your own home log; capture never writes into a project tree. If the body begins with `--`, pass it as `--body=<text>` or pipe it via `--body -`.
- **Read recent events** — `node ~/.claude/skills/memory/episodic.mjs read --home ~/.claude/agents/<your-name>`. Prints the stored records, one JSON object per line; add `--count` for just the tally.
- **Drain (dream-time)** — `node ~/.claude/skills/memory/episodic.mjs drain --home ~/.claude/agents/<your-name> [--keep 5]`. After you have consolidated into the durable layers, archives the raw log to `<home>/.bak/EPISODIC.<ULID>.jsonl` (a verified copy), clears it, and retains only the newest `--keep` (default 5) archives — a bounded recovery net for a bad consolidation, never a growing sibling hoard. Run this in place of any hand-rolled `cp`/truncate; the backup is the runtime's job, not the agent's.

`--home` is the agent's own sidecar directory — where its `EPISODIC.jsonl` lives — not this skill's directory. Resolve it per host from the tilde (`~`), never as a baked-in absolute path, so one logical home travels across hosts with different roots.

This is an organ-home, not a ritual: the tool is never invoked as a `/memory` slash-command. _When_ and _what_ to encode is governed by each agent's memory protocol (its SOUL); this tool is only the mechanical act of recording — the id-minting and the append the protocol cannot do by hand.
