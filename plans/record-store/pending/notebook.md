# notebook

**Wave 1.** Realizes `notebook`.

## Intent

The set of notes — ideas, questions and decisions not yet canonical, the intake the design
canonizes — as a domain over the record store.

- A note's payload is its kind, topic and body, plus its anchor: `entity` makes every entity
  carry an anchor as its label (PLAN.md finding F2). The kinds are the gloss's three — idea,
  question, decision; their exact signs, if they differ from those words, come from `signify` and
  are reported.
- Capture writes a note's first version. There is no admission bar: capture refuses only a
  malformed shape (an unknown kind, a missing field), never a judgement of content.
- A changed note is a supersession, never an in-place edit; retract withdraws it; live notes are
  those with a head that no retraction withdrew.
- Two defects of the hypothesis `note` skill are not reproduced here: sequential ids (an entity's
  identity is the store's minted one, and readers name a note by its anchor) and in-place
  "extend derived" (the record is immutable).

Isolation (PLAN.md § Contract): imports only from `../../record-store/` (never
`immutability-gate.ts`), never from another capability directory or the view.

## Static

- `git show 9cc32431:docs/design/record-store.md` § The three domains (`notebook`), § Primitives
  (`entity`, `payload`).
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
   re-run reproduces the output. It shows: one note of each kind over two topics captured and
   listed live with kind and topic; a note with a one-word body captured without refusal; an
   unknown kind refused; one note superseded (two records, one live version) and one retracted
   (absent from the live set); no identifier the domain exposes is a sequence number.
3. `git grep -nE "from '\.\./(design|plan)/|from '\.\./\.\./view|immutability-gate" -- packages/runtime/src/capabilities/note`
   prints nothing.
4. Sole: the return names the one module declaring the note payload shape, and
   `git grep -n <that identifier> -- packages/runtime/src` finds its declaration only there.
5. `.changeset/notebook.md` names `@cratylus/runtime`.
