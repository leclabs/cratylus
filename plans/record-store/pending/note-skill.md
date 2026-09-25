# note-skill

**Wave 3.** Realizes `skill routing` — for the notebook. Authored new: the corpus has no `note`
skill.

## Intent

Canon's `note` skill routes its reader's intents to the `note` capability in the notebook's own
vocabulary — show the whole notebook or one note, capture, retract — through
`scripts/note.mjs <verb>`, the shim forge projects for a cell declaring
`runtime: { capability: 'note' }` (the `event-tap` cell is the precedent).

It holds the notebook's own rules and no one else's: anyone may capture a note; capture has no
admission bar; the kinds are idea, question and decision, and the runtime treats kind as opaque, so
this cell is their one home (`PLAN.md` N4); only a question may block a plan or unit, and an open
question that does is an owed ruling, which blocks what it names until it is closed; closing it is
retracting the note; a note is addressed by its topic, and by kind within a topic (N3); a changed
note is superseded, never edited in place.

It restates no other skill's rules, borrows nothing from `design`, `plan` or `deliver` (`PLAN.md`
§ Contract, W3 isolation), composes nothing, and never mentions the record store, record ids,
envelopes, heads or files.

Hypothesis to rectify, not copy:
`ssh upmav cat /Users/lcaraccioli/workspaces/WebappLiveSyncTechDemoNuxt/.agents/skills/note/SKILL.md`.
Its sequential ids and its in-place "extend derived" are known defects. The host was unreachable
at the first census; if it still is, author from the design alone and say so in the return.

## Static

- `git show c501e002:docs/design/record-store.md` § The three domains (`notebook`, `unit`), § How
  they are met (`domain interface`, `skill routing`).
- `packages/canon/src/skills/event-tap/skill.ts` — a capability-bound cell's shape.
- The landed `note` capability's verbs (`packages/runtime/src/capabilities/note/dispatch.ts`).
- `skill://create-skill` — how a cell is authored in this corpus; `signify` for every sign the block
  declares.

## Deps

`domain-interface`

## Outputs

- `packages/canon/src/skills/note/skill.ts` (new)
- `packages/canon/test/formal-block-self-sufficiency.test.ts` — its header's skill count
- `.changeset/note-skill.md`

## Accept

1. `pnpm --filter @cratylus/canon test` passes (among them `symbols`, `symbol-probe-gate`,
   `reader-density`, `skill-shape`, `boundary-binding`, `formal-block-self-sufficiency`,
   `capability-keyspace`).
2. `pnpm canon:project` emits `.cratylus/claude/skills/note/scripts/note.mjs`, which spawns the bin
   with `['note', …]`, and `.cratylus/claude/skills/note/SKILL.md` contains
   `scripts/note.mjs capture`, `scripts/note.mjs retract` and `scripts/note.mjs show`.
3. The three kinds appear in the cell, and the owed-ruling rule names the question kind:
   `git grep -nE "idea|question|decision" -- packages/canon/src/skills/note/skill.ts` hits all three.
4. `git grep -niE "record|envelope|\bheads?\b|ulid|\.json" -- packages/canon/src/skills/note` prints
   nothing.
5. `git grep -nE " @ (design|plan|deliver)\b" -- packages/canon/src/skills/note` prints nothing.
6. Sole: `git grep -l "capability: 'note'" -- packages/canon/src` lists only
   `packages/canon/src/skills/note/skill.ts`, and
   `git grep -lE "'(idea|question|decision)'" -- 'packages/*/src' ':!packages/canon/src/skills/note'`
   prints nothing: no second home spells the kinds.
7. The formal-block header's skill count matches `ls packages/canon/src/skills/*/skill.ts | wc -l`
   at the unit's commit.
8. `.changeset/note-skill.md` names `@cratylus/canon`.
