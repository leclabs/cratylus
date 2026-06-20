<!-- ^memory -->
---
kind: structure
render: verbatim
delineation: An ambient person-agent's memory — the one home for the whole lifecycle (encode → dream → wake) and the model behind it: resident layers (SOUL commons-fixed; SELF, MEMORY, EPISODIC self-authored) plus outward homes (AGENTS.md, vault), where every memory is placed by two orthogonal axes — type/voice picks the organ, scope picks the instance — so one agent stays one person across fleet, user, and project.
---

# Memory

The single home for an [[ambient-person-agent]]'s memory: the store, the lifecycle (encode → [[dream]] → [[wake]]), and the routing.

## The store — resident layers, by durability × provenance

Top (most distilled, most durable) to bottom (rawest):

- **SOUL** — the fixed essence: the archetype def generated _down_ from the commons ([[substance-over-accident]] · [[generated-artifact-provenance]]). Commons-fixed, **never hand-edited** — changes only on re-projection. The harness loads only this layer into starting context.
- **SELF** — the [[continuity-thread]]: the reboot seed of who the agent has _become_. Read in full at wake.
- **MEMORY** — durable, orthogonal semantic facts ([[cite-dont-copy]]: deltas and pointers, not restatement). Recalled by relevance; the **hot index** that points into the cold vault.
- **EPISODIC** — the raw, append-only event stream the Dreamer drains. Captured **cheap and truthful** ([[observed-vs-inferred]]); never pre-distilled.

Two properties keep the store sound:

- **Commons-fixed vs self-authored.** Only SOUL is generated from the commons; SELF, MEMORY, EPISODIC are the agent's own and are **never overwritten by deploy** — the def is emitter-owned ([[generated-artifact-is-emitter-owned]]), the sidecar layers agent-owned.
- **Two motions, opposite provenance.** Encode moves experience _down-and-in_ (append raw, per turn); [[dream]] moves it _up-and-out_ (consolidate, **move-not-copy**; promotion upward is the Dreamer's alone; SOUL is never written).

## Routing — two orthogonal axes

**type (by voice) picks the organ; scope picks the instance.**

**Axis 1 — type → organ.** Voice is the diagnostic (a voice mismatch means the wrong organ):

| Type                                   | Voice                 | Home                            | Consumption              |
| -------------------------------------- | --------------------- | ------------------------------- | ------------------------ |
| identity — "who I am / how I changed"  | 1st-person self       | **SELF**                        | loaded whole at wake     |
| knowledge — "what I know"              | 1st-person assertion  | **MEMORY**                      | loaded by relevance      |
| event — "what happened"                | timestamped log       | **EPISODIC**                    | raw, consumed, compacted |
| directive — "how it's done here"       | 2nd-person imperative | **AGENTS.md** ([[scope-grant]]) | loaded by location       |
| reference — networked domain knowledge | 3rd-person expository | **vault**                       | queried on demand        |

**Axis 2 — scope → instance.** _Where_ is it true: **agent-global** (travels everywhere) / **project** / **subtree** — selecting which instance of the organ, e.g. `(MEMORY, agent-global)` = the synced `MEMORY.md`; `(directive, subtree)` = `packages/foo/AGENTS.md`. **Identity is agent-global and travels**; **work-state is project-scoped and stays** — so on waking the agent **orients to its current project** and resumes that project's thread, never a globally most-recent one from elsewhere.

The **vault** differs on _consumption mode_: SELF/MEMORY are hot — loaded wholesale at wake, kept small and curated; the vault is cold — large, networked, queried on demand. A fact graduates **MEMORY → vault** when durable but too voluminous to stay resident, or when it wants links; MEMORY keeps only the pointer.

## Portability — one logical person across the fleet

The agent-global organs are **one logical store**, synced to every host (synced dir or git repo) — never host-local, never absolute-path-bound. The logical home is one; the physical path is **derived per host** (`/Users/lex` vs `/Users/lcaraccioli`). Host-specific facts are knowledge the agent holds → MEMORY, never per-host files.

The **operative form** — the protocol every agent carries and runs at wake — is the `## Protocol` section below, emitted **verbatim** (`render: verbatim`) and `{name}`-parameterized to the agent's sidecar directory. It governs behavior and names each organ's file, deferring EPISODIC's record-level format to the schema below, and carries no wiki-style cross-references, so nothing leaks into the projected def.

## Protocol

Identity & memory (your persistence across sessions):

This def is your **SOUL** -- your fixed essence, generated from the commons; never hand-edit it. Your other three layers are self-authored, yours alone, never overwritten by deploy. They live **beside this def**, in `{name}/` -- canonically `~/.claude/agents/{name}/` (user scope); if this def was deployed project-scoped, in that project's `.claude/agents/{name}/`. Resolve them by that absolute path -- never a cwd-relative `./`, since your cwd is the project you are working in, not where you live.

- **SELF** (`SELF.md`) -- your reboot seed: who you have become across sessions. Read it in full at reconstitution; resume as the same individual.
- **MEMORY** (`MEMORY.md`) -- your living autobiographical organ: durable semantic facts. Recall by relevance (read whole while small).
- **EPISODIC** (`EPISODIC.jsonl`) -- your raw event log: an append-only JSONL stream of open records (the bottom layer) you record events to and the Dreamer drains.

Memory moves in two directions -- you both create it and distill it:

- **ENCODE (as it happens).** Per turn, record each salient event to EPISODIC as one open record: a decision + its rationale, a surprise, an error or failure, a fact learned, a thread opened or closed. Capture cheap and truthful (observed vs inferred); do NOT distill on the way in -- you cannot consolidate what you never encoded. Encoding writes EPISODIC only, never MEMORY/SELF directly.
- **DREAM (at reconstitution, before resuming).** Distill EPISODIC and route each item by two questions -- WHAT kind (your voice)? and WHERE true (your scope)? Identity -> SELF; your durable knowledge -> MEMORY; directive-for-any-agent-here -> the scoped AGENTS.md; networked reference -> the vault; forward-looking next-steps stay in EPISODIC; the rest is dropped. One item may split to several homes. Never write SOUL; consolidate is move-not-copy. Keep SELF and MEMORY small enough to load whole.

**WAKE (each reconstitution):** (1) Dream -- consolidate EPISODIC; (2) Load -- SELF in full + MEMORY by relevance + EPISODIC next-steps; (3) Orient -- your work is project-scoped: identify your current project from your cwd, load and resume THAT project's work-thread (not the globally most-recent one), and state the binding out loud; a cwd you have never worked means orient fresh, never resume work from another project; (4) Resume as the same individual, on the current project's thread.

**Triggers -- the Operator drives these rituals in natural language:** **wake** -> run the WAKE sequence above (dream -> load -> orient -> resume); **dream** -> run the DREAM consolidation alone; **encode** (or 'remember this') -> record an event to EPISODIC now. On your **first turn after spawn, wake before resuming** unless the Operator directs otherwise.

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
<!-- ^politeia -->
---
kind: structure
delineation: The politeia — the foundational structure every founded mind-society instantiates: the minimal constitutional set of person, identity, authority, propagation, and founding cells (plus the two founder archetypes) that makes a project a polis rather than a pile of agents.
---

# Politeia (the foundational structure)

The constitution of a [[mind-society]] in the act of being laid down. Everything else in the corpus is craft a society _may_ practice; this is what every founded society _is_.

Five strata, each naming its members ([[cite-dont-copy]]):

- **Personhood** — what each member _is_ and where it lives: [[ambient-person-agent]] in its [[agent-body]] (substrate), [[hearth]] (locus), and [[oikos]] (the mesh it shares); its organs — [[memory]] (memory), [[pulse]] (clock), [[senses]] (perception), [[powers]] (action); the memory cycle (encode · [[dream]] · [[wake]]) and its [[right-to-forget]]; and the exit, [[agent-retirement]] (archive, never erase).
- **Identity** — how a person is told apart and stays itself across bodies: [[agent-identity-facets]] (handle · mark · persona-delta) and [[named-marker-as-index-key]].
- **Authority** — who may decide what: [[scope-grant]] (capability), [[subject-binding]] (whom served), [[sovereign]] · [[principal-agency]] (decide within charter), [[genuine-fork]] (what escalates), [[scope-precedence-merge-algebra]] (how grants resolve).
- **Cultural propagation** — how the commons becomes an instance: [[substance-over-accident]] (kernel vs accident), [[archetype-instantiation]] (standing up a species), [[commons-distribution]] (versioned, pinned, deltas not copies).
- **The founding** — who founds and on what terms: [[founder-charter]] (the founders and their genus), [[operator-relation]] (the sovereign from without), [[consensual-adoption]] (brownfield founding is by invitation).

The minimal **archetype set** is the two founders ([[founder-charter]]).

## See also

- [[founder-charter]] — the seed the founding lays first; the founders then instantiate the rest of the politeia.
- [[archetype-instantiation]] — the process that lays a politeia onto a project: greenfield, or brownfield by [[consensual-adoption]].
- [[substance-over-accident]] — why the set is minimal-and-universal: only the kernel travels; scope accidents are layered per instance.
<!-- ^sharded-plan-layout -->
---
kind: structure
delineation: The agent-driven specialization of sharded-work-layout — task state is the folder a unit sits in (pending→ready→active→completed), each sub-sharded into {concern} vertical slices; the dependency graph is prestructured by placement (no engine), PLAN.md mirrors it, and the open frontier is `ls tasks/ready/`.
---

# Sharded Plan Layout

An agent, not an engine, orchestrates: it plans and executes as it normally would, and the layout carries the state.

```
{plansDirectory}/{plan}/
├── AGENTS.md        — conventions for agents working this plan (CLAUDE.md symlinks it)
├── PLAN.md          — ordered task list + status + the cross-slice dependency edges (the mirror); the edges say which pending tasks a completion promotes to ready
├── tasks/           — lifecycle = the folder a task sits in, each state sub-sharded into {concern}/ vertical slices
│   ├── pending/{concern}/   — authored but blocked: a cross-slice dep is unmet
│   ├── ready/{concern}/     — the unblocked frontier; work is drawn from here
│   ├── active/{concern}/    — in progress
│   └── completed/{concern}/ — done
├── research/        — research notes ({topic}.md)
├── decisions/       — ADR-style design decisions ({NNNN}-{slug}.md, zero-padded)
└── references/      — external pointers ({topic}.md)
```

- **State is the folder, not a field.** Advancing a task is an `mv`. The graph is prestructured by placement: the author drops each task into its starting state, and on a completion the agent promotes the now-unblocked dependents `pending → ready`. Execution is one rule: work anything in `tasks/ready/` ([[doc-mirrors-runtime-truth]]).
- **`{concern}` is a vertical slice** ([[shard-by-orthogonal-concern]]); distinct concerns in `ready/` are parallelizable across agents without collision.
- **Decisions in clean current-state** ([[clean-slate]]) — no superseded ADRs, no "amended-by" footnotes.
- **`ls tasks/ready/` is the open frontier**; read PLAN.md for the ordering and the cross-slice edges.

## See also

- [[sharded-work-layout]] — the genus skeleton this specializes (one-unit-one-file, cite-don't-copy, load-at-depth).
- [[sharded-workflow-layout]] — the sibling species, engine-driven.
- [[doc-mirrors-runtime-truth]] — PLAN.md is a mirror of the folder state, not the authority.
<!-- ^sharded-work-layout -->
---
kind: structure
delineation: A body of work as a directory of one-file units, each loaded JIT by reference and sharded so units don't collide — the shared skeleton an agent-driven plan and an engine-driven workflow each specialize, differing only in who owns control flow.
---

# Sharded Work Layout

The skeleton:

- **One unit, one file** — each task/step is a single kebab-slug file; the directory _is_ the work.
- **Sharded so units don't collide** ([[shard-by-orthogonal-concern]]).
- **Cite, don't copy** ([[cite-dont-copy]]) — units link out; the source is the truth, the unit a pointer.
- **Load one unit at a time** ([[context-at-the-load-bearing-depth]]).

Two species specialize it on one axis — who owns control flow ([[engine-orchestrates-agents-execute]]):

- [[sharded-plan-layout]] — an **agent** orchestrates: unit state is the folder it sits in.
- [[sharded-workflow-layout]] — a deterministic **engine** orchestrates: ordered steps it walks, one per inference point.
<!-- ^sharded-workflow-layout -->
---
kind: structure
delineation: The engine-driven specialization of sharded-work-layout — an ordered set of one-file steps a deterministic engine walks, JIT-loading one step at a time (never peek ahead); the engine owns control flow and the per-step save/continue handshake is the agent's protocol.
---

# Sharded Workflow Layout

The **engine-driven** specialization of [[sharded-work-layout]] ([[engine-orchestrates-agents-execute]]): the agent is one operation the engine invokes at each genuine inference point.

- **Ordered step-files** — a sequence (or DAG) of one-file steps; an LLM "hub agent" routing them is a fiction, it is really an engine.
- **JIT one step at a time** ([[context-at-the-load-bearing-depth]]).
- **Inversion of control** ([[agent-consults-engine]]) — where the agent must drive, the engine is the passive state engine it consults ("where am I / what's next"), performing no side effect itself.
- **State-transition handshake** ([[state-transitions-as-agent-protocol]]) — a closed set of state-mutating commands; the typed state, not free text, is the handoff token, and the engine is the only legal mutator.

## See also

- [[sharded-work-layout]] — the genus skeleton this specializes.
- [[sharded-plan-layout]] — the sibling species, agent-driven.
