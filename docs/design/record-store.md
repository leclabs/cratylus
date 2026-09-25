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

- **record** — one immutable version of one entity: an envelope and a whole-state payload, never
  edited, moved or deleted once written.
- **record id** — a record's identity, a ULID minted without coordination, so records written on
  different branches or machines never collide.
- **entity** — the thing a record is a version of (a concept, a unit, a note), with an identity
  that is neither its name nor its place in history; an anchor is a label on it and can change.
- **payload** — the whole state of the entity as of this record; never a delta. A concept's
  payload is its anchor, gloss and factors; a unit's is its full spec and lifecycle state; a note's
  is its kind, topic and body.
- **envelope** — what the record says about itself: record id, entity, operation, the record ids
  it supersedes, author, time, reason, and what caused it.
- **fold** — the pure function computing an entity's current state from its records at the moment
  of the read; nothing it computes is ever persisted. (Not "projection": in this corpus that sign
  already means canon → harness Targets.)
- **immutability gate** — the one enforced law of the substrate: a change that modifies or
  deletes an existing record is refused, at commit and in CI.

### The record model

- **supersession** — a record replacing one or more earlier versions of the same entity by naming
  them; it is how an entity evolves and, naming several, how divergence is reconciled.
  Factors: record, record id, entity, payload, envelope.
- **retraction** — a record withdrawing an entity with no successor, naming the versions it
  withdraws. Factors: record, entity, envelope.
- **head** — a version of an entity that no record supersedes or retracts; an entity with exactly
  one head is settled. Factors: supersession, retraction.
- **divergence** — an entity with more than one head, produced when concurrent sessions on
  different branches superseded the same version differently and the branches merged. It is state,
  not error: it is reported, never silently resolved. Factors: head.
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
  that design canonizes. Anyone may capture a note. Factors: record store.
- **design** — the concept lattice C: every live concept with its anchor, gloss and factors.
  Only the architect writes it; a planner, implementer or assayer that meets divergence reports it
  and never picks a head. Factors: record store, reconciliation.
- **plan** — one DAG of units, each unit realizing exactly one concept and carrying its spec and
  lifecycle state; readiness is computed from dependencies, never stored. Factors: record store,
  pin.
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
  into it in full. Factors: fold, divergence, incoherence, pin.
- **domain interface** — one capability per domain, named for it (`design`, `plan`, `note`), in
  its own verbs, shipped with its skill:
  - `design` shows the whole design or one concept, and defines, amends, retracts, reconciles
    and traces a concept;
  - `plan` shows the whole bound plan or one unit, and adds, revises and advances units;
  - `note` shows the whole notebook or one note, and captures and retracts notes.
    Agents never see record ids, envelopes, heads or files. A payload names entities by anchor and
    the interface resolves them. `amend` on a diverged concept refuses and points to `reconcile`.
    Factors: view, notebook, design, plan.
- **skill routing** — each skill routes its reader's intents to its own domain interface in its
  own vocabulary, and holds its domain's authority rules. `design` holds reconciliation, the
  architect's alone. `plan` pins and advances. `deliver` reads both and records acceptance by
  advancing a unit. `note` captures without an admission bar. No skill restates another's rules
  or mentions the record store. Factors: domain interface.

## Cut

One piece: the lattice is connected, and every domain factors down to the record store, so no
closed proper subset exists. Pin: the commit that adds this file.

## Boundaries the plan must respect

- Clean cutover: the plan-state folders, the plan markers and the plan-set tooling the `plan`
  capability replaces are deleted, together with the plan skill's `mirror` law. The `note` skill
  does not exist in this corpus yet and is authored here.
- The record store is mechanism (`runtime`); the skills and their laws are meaning (`canon`); the
  mapping of each capability onto harness scripts is projection (`forge`). No concept here crosses
  those seams.
- Out of scope: excision (forgetting a record), multi-repository projects, and valid-time.
