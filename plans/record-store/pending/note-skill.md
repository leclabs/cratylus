# note-skill

**Wave 3.** Realizes `skill routing` — for the notebook. Authored new: the corpus has no `note`
skill.

## Intent

Canon's `note` skill: it routes its reader's intents to the `note` capability in the notebook's
own vocabulary — show the whole notebook or one note, capture, retract — through
`scripts/note.mjs <verb>`, the shim forge projects for a cell declaring
`runtime: { capability: 'note' }` (the `event-tap` cell is the precedent). It holds the notebook's
own rules and no one else's: anyone may capture a note; capture has no admission bar; the three
kinds are idea, question, decision; a changed note is superseded, never edited in place. It
restates no other skill's rules, borrows nothing from `design`, `plan` or `deliver` (PLAN.md
§ Contract, W3 isolation), composes nothing, and never mentions the record store, record ids,
envelopes, heads or files.

Hypothesis to rectify, not copy: `ssh upmav cat /Users/lcaraccioli/workspaces/WebappLiveSyncTechDemoNuxt/.agents/skills/note/SKILL.md`.
Its sequential ids and its in-place "extend derived" are known defects. The host was unreachable
at census (PLAN.md F4); if it still is, author from the design alone and say so in the return.

## Static

- `git show 9cc32431:docs/design/record-store.md` § The three domains (`notebook`), § How they are
  met (`domain interface`, `skill routing`).
- `packages/canon/src/skills/event-tap/skill.ts` — a capability-bound cell's shape.
- The landed `note` capability's verbs (`packages/runtime/src/capabilities/note/dispatch.ts`).
- `create-skill` (`skill://create-skill`) — how a cell is authored in this corpus; `signify` for
  every sign the block declares.

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
2. `pnpm canon:project` emits `.cratylus/claude/skills/note/scripts/note.mjs`, which spawns the
   bin with `['note', …]`, and `.cratylus/claude/skills/note/SKILL.md` contains
   `scripts/note.mjs capture`, `scripts/note.mjs retract` and `scripts/note.mjs show`.
3. `git grep -niE "record|envelope|\bheads?\b|ulid|\.json" -- packages/canon/src/skills/note`
   prints nothing.
4. `git grep -nE " @ (design|plan|deliver)\b" -- packages/canon/src/skills/note` prints nothing.
5. Sole: `git grep -l "capability: 'note'" -- packages/canon/src` lists only
   `packages/canon/src/skills/note/skill.ts`.
6. The formal-block header's skill count matches
   `ls packages/canon/src/skills/*/skill.ts | wc -l` at the unit's commit.
7. `.changeset/note-skill.md` names `@cratylus/canon`.
