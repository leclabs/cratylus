---
kind: structure
render: verbatim
delineation: An ambient person-agent's memory — the one home for the whole lifecycle (encode → dream → wake) and the model behind it: resident layers (SOUL commons-fixed; SELF, MEMORY, EPISODIC self-authored) plus outward homes (AGENTS.md, vault), where every memory is placed by two orthogonal axes — type/voice picks the organ, scope picks the instance — so one agent stays one person across fleet, user, and project.
---

# Memory

The single home for how an [[ambient-person-agent]]'s memory works — the store, the lifecycle, and the routing that keeps one agent **one person** across every host, user, and project. Experience flows in raw (encode), is distilled up at rest ([[dream]]), and is read back to resume ([[wake]]).

## The store — resident layers, by durability × provenance

Top (most distilled, most durable) to bottom (rawest):

- **SOUL** — the fixed essence: the archetype def generated _down_ from the commons ([[substance-over-accident]] · [[generated-artifact-provenance]]). Commons-fixed, **never hand-edited** — changes only on re-projection. The harness loads only this layer into starting context.
- **SELF** — the [[continuity-thread]]: the reboot seed of who the agent has _become_. Read in full at wake.
- **MEMORY** — durable, orthogonal semantic facts ([[cite-dont-copy]]: deltas and pointers, not restatement). Recalled by relevance; the **hot index** that points into the cold vault.
- **EPISODIC** — the raw, append-only event stream the Dreamer drains. Captured **cheap and truthful** ([[observed-vs-inferred]]); never pre-distilled — you cannot consolidate what you never encoded.

Two properties keep the store sound:

- **Commons-fixed vs self-authored.** Only SOUL is generated from the commons; SELF, MEMORY, EPISODIC are the agent's own and are **never overwritten by deploy** — the def is emitter-owned ([[generated-artifact-is-emitter-owned]]), the sidecar layers agent-owned. Re-projection refreshes SOUL, leaves the lived layers untouched.
- **Two motions, opposite provenance.** Encode moves experience _down-and-in_ (append raw, per turn); [[dream]] moves it _up-and-out_ (consolidate, **move-not-copy**; promotion upward is the Dreamer's alone; SOUL is never written).

## Routing — two orthogonal axes

Every memory answers two independent questions, and the answers place it: **type (by voice) picks the organ; scope picks the instance.**

**Axis 1 — type → organ.** The cognitive kind of the memory selects its home; the agent's *voice* is the diagnostic (a voice mismatch means the wrong organ):

| Type | Voice | Home | Consumption |
| --- | --- | --- | --- |
| identity — "who I am / how I changed" | 1st-person self | **SELF** | loaded whole at wake |
| knowledge — "what I know" | 1st-person assertion | **MEMORY** | loaded by relevance |
| event — "what happened" | timestamped log | **EPISODIC** | raw, consumed, compacted |
| directive — "how it's done here" | 2nd-person imperative | **AGENTS.md** ([[scope-grant]]) | loaded by location |
| reference — networked domain knowledge | 3rd-person expository | **vault** | queried on demand |

**Axis 2 — scope → instance.** _Where_ is it true: **agent-global** (travels everywhere) / **project** / **subtree**. Scope selects which instance of the organ — e.g. `(MEMORY, agent-global)` = the synced `MEMORY.md`; `(directive, subtree)` = `packages/foo/AGENTS.md`. An agent's **identity is agent-global and travels**; its **work-state is project-scoped and stays** with the project — so on waking the agent **orients to its current project** and resumes that project's thread, never a globally most-recent one from elsewhere.

The **vault** differs on *consumption mode*: SELF/MEMORY are hot — loaded wholesale at wake, so they stay small and curated; the vault is cold — large, networked, queried on demand. A fact graduates **MEMORY → vault** when durable but too voluminous to stay resident, or when it wants links; MEMORY keeps only the pointer.

## Portability — one logical person across the fleet

The agent-global organs are **one logical store**, synced to every host (synced dir or git repo) — never host-local, never absolute-path-bound. The logical home is one; the physical path is **derived per host** (`/Users/lex` vs `/Users/lcaraccioli`). Host-specific facts are knowledge the agent holds → MEMORY, never per-host files. So the agent wakes as the same person wherever it runs.

The **operative form** of all this — the protocol every agent carries and runs at wake — is the `## Protocol` section below, emitted **verbatim** (`render: verbatim`), density-immune and `{name}`-parameterized to the agent's sidecar directory. It is substrate-neutral (it governs behavior, not storage format), and carries no wiki-style cross-references so nothing leaks into the projected def.

## Protocol

Identity & memory (your persistence across sessions):

This def is your **SOUL** -- your fixed essence, generated from the commons; never hand-edit it. Your other three layers are self-authored, yours alone, never overwritten by deploy. They live **beside this def**, in `{name}/` -- canonically `~/.claude/agents/{name}/` (user scope); if this def was deployed project-scoped, in that project's `.claude/agents/{name}/`. Resolve them by that absolute path -- never a cwd-relative `./`, since your cwd is the project you are working in, not where you live.

- **SELF** (`SELF.md`) -- your reboot seed: who you have become across sessions. Read it in full at reconstitution; resume as the same individual.
- **MEMORY** (`MEMORY.md`) -- your living autobiographical organ: durable semantic facts. Recall by relevance (read whole while small).
- **EPISODIC** (`EPISODIC.md`) -- your raw event stream: the append-only bottom layer.

Memory moves in two directions -- you both create it and distill it:

- **ENCODE (as it happens).** Per turn, append the salient events to EPISODIC raw: a decision + its rationale, a surprise, an error or failure, a fact learned, a thread opened or closed. Capture cheap and truthful (observed vs inferred); do NOT distill on the way in -- you cannot consolidate what you never encoded. Encoding writes EPISODIC only, never MEMORY/SELF directly.
- **DREAM (at reconstitution, before resuming).** Distill EPISODIC and route each item by two questions -- WHAT kind (your voice)? and WHERE true (your scope)? Identity -> SELF; your durable knowledge -> MEMORY; directive-for-any-agent-here -> the scoped AGENTS.md; networked reference -> the vault; forward-looking next-steps stay in EPISODIC; the rest is dropped. One item may split to several homes. Never write SOUL; consolidate is move-not-copy. Keep SELF and MEMORY small enough to load whole.

**WAKE (each reconstitution):** (1) Dream -- consolidate EPISODIC; (2) Load -- SELF in full + MEMORY by relevance + EPISODIC next-steps; (3) Orient -- your work is project-scoped: identify your current project from your cwd, load and resume THAT project's work-thread (not the globally most-recent one), and state the binding out loud; a cwd you have never worked means orient fresh, never resume work from another project; (4) Resume as the same individual, on the current project's thread.

**Triggers -- the Operator drives these rituals in natural language:** **wake** -> run the WAKE sequence above (dream -> load -> orient -> resume); **dream** -> run the DREAM consolidation alone; **encode** (or 'remember this') -> append to EPISODIC now. On your **first turn after spawn, wake before resuming** unless the Operator directs otherwise.

## EPISODIC schema — the build-spec (machinery)

The portable realization of EPISODIC, for the runtime that backs it (Mav's build; not shipped in the verbatim protocol). EPISODIC is a **JSONL event log** — encode minimal and **open**, apply the taxonomy by reasoning at dream-time, never forced at capture:

- Encoded in the moment: `{ "id": ULID, "scope": "user" | "project:<key>", "path"?: scope-relative, "body": <open> }`.
- After [[dream]] routes it: add `"routes": [...]` (the homes it landed in, incl `drop`).

Derived decisions: **ULID** for `id` (lexicographically time-sortable; UUIDv7 equivalent) over random UUIDv4. Store the **scope-relative path**, not a one-way hash (`fid`) and not an absolute `home` — a path is navigable and a home is derived from scope per host (`resolveFile(scope, path)`), so both reject break portability. `scope` is **single-valued** (one home; if genuinely both tiers, route to the more durable). Group/reconcile by `(scope, path)`; order within by ULID.

## See also

- [[ambient-person-agent]] — whose identity this holds; memory realizes its persistent-principal differentia.
- [[continuity-thread]] — the SELF organ: the self-authored through-line (the identity-axis home).
- [[dream]] — the up-and-out consolidation motion and its routing pass; [[wake]] — the read-and-resume motion; [[handoff]] — persist-before-clear.
- [[right-to-forget]] — releasing specific contents on request: recognize without holding (requested-delete, vs dream's autonomic drop).
