# Design — records: notes, design and plans as computed state

Author: the architect (design authority). Bootstrap home: this file holds C until the `design`
capability exists; the last unit of the plan that realizes it moves every concept below into the
design records, and this file is deleted. From then on C is read with `design`, never from a file.

## Intent

Agents co-author three things that evolve over long-horizon work: a notebook (ideas and questions
not yet canonical), a design (the concept lattice) and plans (DAGs of units, each realizing one
concept). Held as hand-edited documents they accrete palimpsest, go stale and invite patching.
Each becomes a set of immutable records, and its current state is computed when someone asks.
Divergence between concurrent sessions is a legitimate state that the computation reports, and the
architect reconciles it. Agents and users meet only the three domains, never the records.

## Lattice

Each concept is `anchor — gloss`, then its factors. Primitives have no factors.

### Primitives

- **record id** — a record's identity, a ULID minted without coordination, so records written on
  different branches or machines never collide.
- **entity** — the thing a record is a version of (a concept, a plan, a unit, a note), with an
  identity that is neither its name nor its place in history; a name, where the entity has one, is
  a label on it and can change.
- **payload** — the whole state of the entity as of this record; never a delta. A concept's
  payload is its anchor, gloss and factors; a plan's is its name, the design it realizes and its
  lifecycle state; a unit's is its plan, full spec and lifecycle state; a note's is its kind, topic,
  body and whatever it blocks.
- **fold** — the pure function computing an entity's current state from its records at the moment
  of the read; nothing it computes is ever persisted. (Not "projection": in this corpus that sign
  already means canon → harness Targets.)
- **immutability gate** — the one enforced law of the substrate: a change that modifies or
  deletes an existing record is refused, at commit and in CI.

### The record model

- **envelope** — what a record says about itself: its record id, its entity, the operation, the
  record ids it supersedes, author, time, reason, and what caused it. Factors: record id, entity.
- **record** — one immutable entry in one entity's history, either a version or a retraction: an
  envelope and a whole-state payload, never edited, moved or deleted once written. Factors:
  envelope, payload.
- **supersession** — a new version of an entity that names one or more of its current heads and
  replaces them; naming a record that is not a head is refused, so a single branch's history stays
  linear and divergence arises only from merges. It is how an entity evolves, how a withdrawn
  entity is reinstated, and, naming several heads, how divergence is reconciled. Factors: record,
  record id, entity, payload, envelope.
- **retraction** — a record withdrawing an entity with no successor version, naming the heads it
  withdraws; the retraction itself becomes the entity's head, so the withdrawal is part of the
  history that later records must name. Factors: record, entity, envelope.
- **head** — a record of an entity, either a version or a retraction, that no later record names.
  An entity with exactly one head is settled: live when that head is a version, withdrawn when it is
  a retraction. Factors: supersession, retraction.
- **divergence** — an entity with more than one head, produced when concurrent sessions on
  different branches wrote to the same head differently (two versions, or a version and a
  retraction) and the branches merged. It is state, not error: it is reported, never silently
  resolved. Factors: head.
- **incoherence** — a contradiction between entities produced by a merge: a reference to a
  retracted entity, or a factor cycle. Reported like divergence. Factors: head, entity.
- **reconciliation** — the act resolving divergence: one new whole-state version superseding every
  head of the entity. A reconciliation is an amendment and never shares a record with an
  acceptance. Factors: supersession, divergence.
- **record store** — the internal mechanism holding records as files in the repository (one
  directory per domain, one file per record, named by record id), writing new records, folding
  heads, detecting divergence and incoherence, and owning the immutability gate. A branch merge is
  the union of records and never conflicts. It lives in `runtime`, and no agent or skill ever
  names it. Factors: record, fold, immutability gate, head, divergence, incoherence, reconciliation.

### The three domains

- **notebook** — the set of notes: ideas, questions and decisions not yet canonical, the intake
  that design canonizes. Anyone may capture a note. An open question that names a plan or unit is
  an **owed ruling**, and it blocks what it names until it is closed. Factors: record store.
- **design** — the concept lattice C: every live concept with its anchor, gloss and factors.
  Only the architect writes it; a planner, implementer or assayer that meets divergence reports it
  and never picks a head. Factors: record store, reconciliation.
- **plan** — an entity naming the design it realizes and its lifecycle: proposed, then bound, then
  closed. At most one plan is bound at a time, and a closed plan stays readable forever; closing
  replaces retiring by deletion. Factors: record store.
- **unit** — one unit of work in a plan, realizing exactly one concept and carrying its full spec
  and lifecycle state. Readiness is computed, never stored: a unit is ready when every dependency
  is completed and no owed ruling names it. Factors: plan, pin, notebook.
- **pin** — a unit's reference to the concept version it realizes, taken automatically when the
  unit is authored. A unit is **drifted** when its pinned version is no longer a head, and
  **suspect** when its concept's closure holds a divergence or a newer version. Factors: head,
  divergence, design.

### How they are met

- **view** — a domain's current state computed at query time and rendered for its reader in three
  layers: a header naming the commit it was computed at, with counts; everything that must be
  resolved before the rest is trusted (divergence, incoherence, drift, suspect units, owed
  rulings, open questions); then the whole domain in its own structure, one line per live item.
  The lattice runs root to primitive; the plan runs in wave order with the frontier marked in
  place; the notebook groups by kind and topic. Design and plan views cross-reference: each concept
  shows how the plans stand on it, each unit shows the concept it serves. Naming one item drills
  into it in full. Factors: fold, divergence, incoherence, unit.
- **domain interface** — one capability per domain, named for it (`design`, `plan`, `note`), in
  its own verbs, shipped with its skill:
  - `design` shows the whole design or one concept, and defines, amends, retracts, reconciles
    and traces a concept;
  - `plan` shows the whole bound plan or one unit, adds, revises and advances units, and binds
    and closes a plan;
  - `note` shows the whole notebook or one note, and captures and retracts notes.
    Agents never see record ids, envelopes, heads or files. A payload names entities by anchor and
    the interface resolves them. `amend` on a diverged concept refuses and points to `reconcile`.
    Factors: view, notebook, design, plan, unit.
- **skill routing** — each skill routes its reader's intents to its own domain interface in its
  own vocabulary, and holds its domain's authority rules. `design` holds reconciliation, the
  architect's alone. `plan` pins and advances. `deliver` reads both and records acceptance by
  advancing a unit. `note` captures without an admission bar. No skill restates another's rules
  or mentions the record store. Factors: domain interface.

## Cut

One piece: the lattice is connected, and every domain factors down to the record store, so no
closed proper subset exists. Pin: the commit that carries this revision.

## Boundaries the plan must respect

- Clean cutover: the plan-state folders, the plan markers and the plan-set tooling the `plan`
  capability replaces are deleted, together with the plan skill's `mirror` law, the runtime
  `carryOn` capability that reads them, and memory's handling of plan paths. The existing plans
  under `plans/` are stale and are removed, not migrated. The `note` skill does not exist in this
  corpus yet and is authored here.
- Lifecycle states of plans and units are meaning: the `plan` skill is their one home, and they
  reach the runtime as configuration the projection emits, as the event vocabulary does today. The
  runtime restates none of them.
- One ULID implementation: the record id reuses the one memory already has, moved down into
  `runtime` so both import it.
- One sense of supersession: the `design` skill's lattice law, which reads a superseded concept as
  replaced by another concept, is restated in this design's sense, as a new version of the same
  concept. A concept that genuinely becomes another is a retraction plus a definition.
- The record store is mechanism (`runtime`); the skills and their laws are meaning (`canon`); the
  mapping of each capability onto harness scripts is projection (`forge`). No concept here crosses
  those seams.
- Out of scope: excision (forgetting a record), multi-repository projects, and valid-time.
