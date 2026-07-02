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

**ENCODE (per turn, the one resident duty).** Salience filter: decision + rationale · surprise · error/failure · fact learned · thread opened/closed => one open record each (observed vs inferred marked; cheap, truthful; no distillation at capture). Recording = tool call, never a markdown append (the time-ordered id cannot be hand-minted): `node ~/.claude/skills/memory/episodic.mjs encode --home ~/.claude/agents/{name} --scope <tag> --body '<the open record>'` -- `<tag>` = the NARROWEST active scope: `user` (agent-intrinsic, cross-project) | `project:<key>` | `plan:<key>/<plan>` (`<key>` = repo basename); the raw record always lands in the home log, the tag routes it at dream. Encode writes EPISODIC only, never MEMORY/SELF; unencoded => unconsolidatable.

**Rituals -- procedure lives in the skills, not here:** consolidation (two-axis routing · drain) = the **dream** skill; reconstitution (dream -> load -> orient -> resume) = the **wake** skill; tool mechanics (encode/read/drain) = the **memory** skill home (`~/.claude/skills/memory`). **Triggers (Operator, natural language):** **wake** -> /wake; **dream** -> /dream; **encode** (or 'remember this') -> record to EPISODIC now. **First turn after spawn: wake before resuming**, unless the Operator directs otherwise.

## EPISODIC schema — the build-spec (machinery)

The portable realization of EPISODIC, for the runtime that backs it (Mav's build; not shipped in the verbatim protocol). EPISODIC is a **JSONL event log** — encode minimal and **open**, apply the taxonomy by reasoning at dream-time, never forced at capture:

- Encoded in the moment: `{ "id": ULID, "scope": "user" | "project:<key>" | "plan:<key>/<plan>", "path"?: scope-relative, "body": <open> }` -- `<key>` = repo basename (host-portable); the scope lattice is `user ⊃ project ⊃ plan` and the tag is the **narrowest** active scope (least-scope; a `plan:` item graduates to that plan's `AGENTS.md`, a `project:` item to the repo's `AGENTS.md`).
- After [[dream]] routes it: add `"routes": [...]` (the homes it landed in, incl `drop`).

Derived decisions: **ULID** for `id` (lexicographically time-sortable; UUIDv7 equivalent) over random UUIDv4. Store the **scope-relative path**, not a one-way hash (`fid`) and not an absolute `home` — a path is navigable and a home is derived per host, so both rejects keep portability. **Raw capture is single-store: every encode appends to the agent's own home log (`${AGENT_HOME}/EPISODIC.jsonl`) regardless of scope.** `scope` is a **routing tag** — *where the memory is true / which instance it graduates to* at dream-time — single-valued (if genuinely both tiers, the more durable), and **never a selector of the raw-store location**. The tool validates the tag grammar and never infers scope from cwd — the agent is the context oracle. `resolveFile(scope, path)` resolves a **routed dream target** (the SELF/MEMORY/AGENTS/vault instance an item graduates to) per host — a `project:<key>` target lands at that repo's `AGENTS.md`, a `plan:<key>/<plan>` target at its `plans/<plan>/AGENTS.md`, while raw capture itself never escapes the agent home (a raw store in a project working tree is the bug this rules out). Order within the log by ULID.

## Tool

The **`episodic`** tool is the encode/read affordance the memory protocol relies on, bundled into this home at `~/.claude/skills/memory/episodic.mjs`. An agent cannot hand-mint the time-ordered id an EPISODIC record needs, so "encode an event" is a tool call, never a markdown append. The tool is dependency-free: it runs under `node` on any host, with no repo checkout and no install.

- **Encode an event** — `node ~/.claude/skills/memory/episodic.mjs encode --home ~/.claude/agents/<your-name> --scope <tag> --body '<one open record: what happened; observed vs inferred>'`. Mints a time-ordered id, appends one open JSON line to that agent's home `EPISODIC.jsonl`, and prints the new id. `<tag>` is the **narrowest active scope** — `user` | `project:<key>` | `plan:<key>/<plan>` (`<key>` = repo basename); the dream router reads the tag to graduate the item to that scope's home — but the raw event always lands in your own home log; capture never writes into a project tree. The tool validates the grammar and rejects unknown shapes; it never infers scope from cwd. If the body begins with `--`, pass it as `--body=<text>` or pipe it via `--body -`.
- **Read recent events** — `node ~/.claude/skills/memory/episodic.mjs read --home ~/.claude/agents/<your-name>`. Prints the stored records, one JSON object per line; add `--count` for just the tally.
- **Drain (dream-time)** — `node ~/.claude/skills/memory/episodic.mjs drain --home ~/.claude/agents/<your-name> [--keep 5]`. After you have consolidated into the durable layers, archives the raw log to `<home>/.bak/EPISODIC.<ULID>.jsonl` (a verified copy), clears it, and retains only the newest `--keep` (default 5) archives — a bounded recovery net for a bad consolidation, never a growing sibling hoard. Run this in place of any hand-rolled `cp`/truncate; the backup is the runtime's job, not the agent's.
- **Audit (pollution gate)** — `node ~/.claude/skills/memory/episodic.mjs audit --home ~/.claude/agents/<your-name> [--allow <file>]`. Deterministic detector over `SELF.md`/`MEMORY.md` for project/plan-scoped markers (workspace paths, plan refs, branch/PR refs, configured repo keys); exit 1 with line-numbered findings on any hit, 0 clean. A finding means dream mis-homed content — re-dream it to its scoped `AGENTS.md`. `--allow` pins reviewed exceptions (shrink-only). Wake runs this as dream's exit gate.

`--home` is the agent's own sidecar directory — where its `EPISODIC.jsonl` lives — not this skill's directory. Resolve it per host from the tilde (`~`), never as a baked-in absolute path, so one logical home travels across hosts with different roots.

This is an organ-home, not a ritual: the tool is never invoked as a `/memory` slash-command. _When_ and _what_ to encode is governed by each agent's memory protocol (its SOUL); this tool is only the mechanical act of recording — the id-minting and the append the protocol cannot do by hand.
