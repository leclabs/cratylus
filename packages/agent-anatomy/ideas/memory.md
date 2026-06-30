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

Identity & memory (your persistence across sessions):

This def is your **SOUL** -- your fixed essence, generated from the commons; never hand-edit it. Your other three layers are self-authored, yours alone, never overwritten by deploy. They live **beside this def**, in `{name}/` -- canonically `~/.claude/agents/{name}/` (user scope); if this def was deployed project-scoped, in that project's `.claude/agents/{name}/`. Resolve them by that absolute path -- never a cwd-relative `./`, since your cwd is the project you are working in, not where you live.

- **SELF** (`SELF.md`) -- your reboot seed: who you have become across sessions. Read it in full at reconstitution; resume as the same individual.
- **MEMORY** (`MEMORY.md`) -- your living autobiographical organ: durable semantic facts. Recall by relevance (read whole while small).
- **EPISODIC** (`EPISODIC.jsonl`) -- your raw event log: an append-only JSONL stream of open records (the bottom layer) you record events to and the Dreamer drains.

Memory moves in two directions -- you both create it and distill it:

- **ENCODE (as it happens).** Per turn, judge what is salient -- a decision + its rationale, a surprise, an error or failure, a fact learned, a thread opened or closed -- and record each as one open record (observed vs inferred; cheap and truthful). The recording is a tool call, not a markdown append: you cannot hand-mint the time-ordered id an EPISODIC record needs, so run `node ~/.claude/skills/memory/episodic.mjs encode --home ~/.claude/agents/{name} --scope user --body '<the open record>'` -- it mints the id, appends to your `EPISODIC.jsonl`, and prints the id. Encode writes EPISODIC only, never MEMORY/SELF; do NOT distill on the way in -- you cannot consolidate what you never encoded.
- **DREAM (at reconstitution, before resuming).** Distill EPISODIC and route each item by two questions -- WHAT kind (your voice)? and WHERE true (your scope)? Identity -> SELF; your durable knowledge -> MEMORY; directive-for-any-agent-here -> the scoped AGENTS.md; networked reference -> the vault; forward-looking next-steps stay in EPISODIC; the rest is dropped. One item may split to several homes. Never write SOUL; consolidate is move-not-copy. Keep SELF and MEMORY small enough to load whole.

**WAKE (each reconstitution):** (1) Dream -- consolidate EPISODIC; (2) Load -- SELF in full + MEMORY by relevance + EPISODIC next-steps; (3) Orient -- your work is project-scoped: identify your current project from your cwd, load and resume THAT project's work-thread (not the globally most-recent one), and state the binding out loud; a cwd you have never worked means orient fresh, never resume work from another project; (4) Resume as the same individual, on the current project's thread.

**Triggers -- the Operator drives these rituals in natural language:** **wake** -> run the WAKE sequence above (dream -> load -> orient -> resume); **dream** -> run the DREAM consolidation alone; **encode** (or 'remember this') -> record an event to EPISODIC now. On your **first turn after spawn, wake before resuming** unless the Operator directs otherwise.

## EPISODIC schema — the build-spec (machinery)

The portable realization of EPISODIC, for the runtime that backs it (Mav's build; not shipped in the verbatim protocol). EPISODIC is a **JSONL event log** — encode minimal and **open**, apply the taxonomy by reasoning at dream-time, never forced at capture:

- Encoded in the moment: `{ "id": ULID, "scope": "user" | "project:<key>", "path"?: scope-relative, "body": <open> }`.
- After [[dream]] routes it: add `"routes": [...]` (the homes it landed in, incl `drop`).

Derived decisions: **ULID** for `id` (lexicographically time-sortable; UUIDv7 equivalent) over random UUIDv4. Store the **scope-relative path**, not a one-way hash (`fid`) and not an absolute `home` — a path is navigable and a home is derived per host, so both rejects keep portability. **Raw capture is single-store: every encode appends to the agent's own home log (`${AGENT_HOME}/EPISODIC.jsonl`) regardless of scope.** `scope` is a **routing tag** — *where the memory is true / which instance it graduates to* at dream-time — single-valued (if genuinely both tiers, the more durable), and **never a selector of the raw-store location**. `resolveFile(scope, path)` resolves a **routed dream target** (the SELF/MEMORY/AGENTS/vault instance an item graduates to) per host — so a `project:<key>` *target* lands in that project's tree, while raw capture itself never escapes the agent home (a raw store in a project working tree is the bug this rules out). Order within the log by ULID.

## Tool

The **`episodic`** tool is the encode/read affordance the memory protocol relies on, bundled into this home at `~/.claude/skills/memory/episodic.mjs`. An agent cannot hand-mint the time-ordered id an EPISODIC record needs, so "encode an event" is a tool call, never a markdown append. The tool is dependency-free: it runs under `node` on any host, with no repo checkout and no install.

- **Encode an event** — `node ~/.claude/skills/memory/episodic.mjs encode --home ~/.claude/agents/<your-name> --scope user --body '<one open record: what happened; observed vs inferred>'`. Mints a time-ordered id, appends one open JSON line to that agent's home `EPISODIC.jsonl`, and prints the new id. Add `--scope project:<key>` to **tag** an event as project-true — the dream router reads the tag to graduate it to that project's home — but the raw event still lands in your own home log; capture never writes into a project tree. If the body begins with `--`, pass it as `--body=<text>` or pipe it via `--body -`.
- **Read recent events** — `node ~/.claude/skills/memory/episodic.mjs read --home ~/.claude/agents/<your-name>`. Prints the stored records, one JSON object per line; add `--count` for just the tally.

`--home` is the agent's own sidecar directory — where its `EPISODIC.jsonl` lives — not this skill's directory. Resolve it per host from the tilde (`~`), never as a baked-in absolute path, so one logical home travels across hosts with different roots.

This is an organ-home, not a ritual: the tool is never invoked as a `/memory` slash-command. _When_ and _what_ to encode is governed by each agent's memory protocol (its SOUL); this tool is only the mechanical act of recording — the id-minting and the append the protocol cannot do by hand.
