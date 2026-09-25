# design-migration

**Wave 3.** Realizes `design` — moving C from its bootstrap home into the design records.
**Executor: the architect.** Only the architect writes the design (`design`'s gloss); this is
transcription, but every `define` is a design write.

## Intent

Define every concept of the lattice through the `design` capability, giving its anchor, its gloss
verbatim and its factors by anchor. Define them in factor order, primitives first, because at
`0c9da09c` every write keeps the design's laws: a factor naming a concept not yet defined (not
live) is refused. Every `define` carries a non-empty reason, citing the pinned document and its
commit, because an empty reason is refused too. Then read the lattice back against the pinned
document and delete `docs/design/record-store.md`. From here on, C is read with `design`, never
from a file (the design's own bootstrap note).

The source is always `git show 9e3e1a6f:docs/design/record-store.md`, never the working file.

## Static

- `git show 9e3e1a6f:docs/design/record-store.md` § Lattice (22 concepts at `9e3e1a6f`; re-derive
  with the command in criterion 1).
- The landed `design` capability (`domain-interface`) and the records root (`record-store`).

## Deps

`domain-interface`, `immutability-gate` (the records this unit writes are the first the
repository holds, and the gate must already guard them)

## Outputs

- the design records under the records root (new files only)
- `docs/design/record-store.md` (deleted)

No package changes, so no changeset.

## Accept

1. For every anchor listed by
   `git show 9e3e1a6f:docs/design/record-store.md | grep -oE '^- \*\*[a-z ]+\*\*'`,
   `pnpm exec cratylus design show <anchor>` (after `pnpm build`) exits 0, prints the gloss, and
   lists exactly the anchors on that concept's `Factors:` line in the document (none for a
   primitive). A script prints `matched n/22` with both numbers read, not typed.
2. `pnpm exec cratylus design show` counts 22 live concepts and lists no divergence and no
   incoherence.
3. `git ls-files docs/design` prints nothing, and `git grep -l "^## Lattice" -- docs` prints
   nothing (at `c501e002` it lists `docs/design/record-store.md`).
4. The commit adding the records passed the pre-commit gate, and
   `git show --name-status <that commit>` shows only `A` under the records root.
5. Sole: C has one home — criterion 3's second command is its check.
6. `pnpm verify` passes.
