# notebook

**Wave 1.** Realizes `notebook`.

## Intent

"The set of notes: ideas, questions and decisions not yet canonical, the intake that design
canonizes. Anyone may capture a note. An open question that names a plan or unit is an owed ruling,
and it blocks what it names until it is closed."

- A note's payload is its kind, topic, body, and whatever it blocks (references to plans or units).
  A note has no name (`entity`: a name is a label "where the entity has one").
- Capture writes a note's first version, with no admission bar: capture refuses only a malformed
  shape (a missing field), never a judgement of content; resolving what a note blocks is the
  interface's. A changed note is a supersession of its current head, never an in-place edit;
  retract writes a retraction that becomes its head; live notes are those whose one head is a
  version (a diverged note — two versions, or a version and a retraction, from merged branches —
  is reported, never resolved by picking one).
- **Kinds are opaque here.** Which kinds exist, and that only a question may block, are the `note`
  skill's meaning (`PLAN.md` finding N4). This module recognises an **owed ruling** as a live note
  that blocks a plan or unit, and exposes, for a caller, the plans and units the owed rulings name.
  Closing an owed ruling is retracting its note.
- Two defects of the hypothesis `note` skill are not reproduced: sequential ids (identity is the
  store's minted one, and readers address a note by topic and kind — N3) and in-place "extend
  derived" (records are immutable).

Isolation (`PLAN.md` § Contract): imports only from `../../record-store/` (never
`immutability-gate.ts`), never from another capability directory, the view or `runtime-config.ts`.
It references plans and units as opaque entity references; it imports no plan module.

## Static

- `git show 4610c33f:docs/design/record-store.md` § The three domains (`notebook`, `unit`),
  § Primitives (`entity`, `payload`).
- The landed `packages/runtime/src/record-store/` and its return's reported signs.

## Deps

`record-store`

## Outputs

- `packages/runtime/src/capabilities/note/notebook.ts` (new), plus any further new file in that
  directory other than `index.ts` and `dispatch.ts`, which are `domain-interface`'s
- `.changeset/notebook.md`

## Accept

1. `pnpm --filter @cratylus/runtime typecheck` passes.
2. The return carries a smoke script and its verbatim output, run as
   `pnpm --filter @cratylus/canon exec tsx <absolute path>` against a temporary records root; a
   re-run reproduces the output. It shows: notes of three different kinds over two topics captured
   and listed live with kind and topic; a one-word body captured without refusal; a note blocking a
   unit reference is reported as an owed ruling naming that unit, and retracting it removes the
   owed ruling; a note blocking nothing is no owed ruling; one note superseded (two records, one
   live version); no identifier the module exposes is a sequence number.
3. `git grep -nE "'(idea|question|decision)'" -- packages/runtime/src` prints nothing.
4. `git grep -nE "from '\.\./(design|plan)/|from '\.\./\.\./(view|runtime-config)|immutability-gate" -- packages/runtime/src/capabilities/note`
   prints nothing.
5. Sole: the return names the one function yielding owed rulings, and `git grep -n <it> -- packages/runtime/src`
   finds it declared only under `packages/runtime/src/capabilities/note/`.
6. `.changeset/notebook.md` names `@cratylus/runtime`.
