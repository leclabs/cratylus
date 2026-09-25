# note-skill

**Wave 3.** Realizes `skill routing` — for the notebook. Authored new: the corpus has no `note`
skill.

## Intent

Canon's `note` skill routes the reader's intents to the `note` capability, in the notebook's own
vocabulary: show the whole notebook or one note, capture, revise, retract and reconcile. It routes
them through `scripts/note.mjs <verb>`, the shim forge projects for a cell declaring
`runtime: { capability: 'note' }` (the `event-tap` cell is the precedent).

It holds the notebook's own rules and no one else's:

- Anyone may capture, revise, retract or reconcile a note, and capture has no admission bar.
- A note's kind (idea, question or decision) is a label the runtime never interprets, so this cell
  is the one home of the kinds.
- Any live note that blocks a plan or unit is an owed ruling, whatever its kind. It blocks what it
  names until it is retracted, or revised to block nothing. The earlier rule that only a question
  may block is dropped: `0c9da09c` no longer makes it.
- A diverged note blocks whatever any of its competing versions blocks, until someone reconciles
  it. The cell says "versions", never "heads" (criterion 4).
- A note's title is its name, and there is one live note per title. A note is addressed by its
  title; there is no body-fragment matching (N9 is superseded at `9e3e1a6f`). The cell never tells the
  reader to use an identity. The interface surfaces one only where a merge has left one title on two
  live notes.
- A changed note is revised, never edited in place.

It restates no other skill's rules, borrows nothing from `design`, `plan` or `deliver` (`PLAN.md`
§ Contract, W3 isolation), composes nothing, and never mentions the record store, record ids,
envelopes, heads or files.

Hypothesis to rectify, not copy:
`ssh upmav cat /Users/lcaraccioli/workspaces/WebappLiveSyncTechDemoNuxt/.agents/skills/note/SKILL.md`.
Its sequential ids and its in-place "extend derived" are known defects. The host was unreachable
at the first census; if it still is, author from the design alone and say so in the return.

## Static

- `git show 9e3e1a6f:docs/design/record-store.md` § The three domains (`notebook`, `unit`), § How
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
   `scripts/note.mjs <verb>` for each of `show`, `capture`, `revise`, `retract` and `reconcile`.
3. The three kinds appear in the cell as labels:
   `git grep -nE "idea|question|decision" -- packages/canon/src/skills/note/skill.ts` hits all
   three. No line makes blocking depend on a kind:
   `git grep -nE "question.*(block|owed)|(block|owed).*question" -- packages/canon/src/skills/note/skill.ts`
   prints nothing. The title law is present:
   `git grep -n "title" -- packages/canon/src/skills/note/skill.ts` hits the line saying a note's
   title is its name, one live note per title.
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
