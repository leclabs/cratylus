# design-domain

**Wave 1.** Realizes `design`.

## Intent

The concept lattice C as a domain over the record store: every live concept with its anchor,
gloss and factors, computed from the design records at the moment of the read.

- A concept's payload is its anchor, gloss and factors. Factors are stored as entity references,
  so relabelling an anchor never breaks a reference; anchors are resolved to entities and back at
  the domain's boundary ("a payload names entities by anchor and the interface resolves them").
- Live concepts are entities with a head that no retraction withdrew. `closure` and `blast` are
  the `design` skill's existing signs and mean what they mean there.
- Define (an entity's first version), amend (a supersession of the one head — refused on a
  diverged concept, and the refusal names reconciliation), retract, reconcile (the store's
  reconciliation) and the lookups a trace needs (closure, blast, version history with reasons).
- The domain hands the store its reference relation — a factor pointing at a retracted concept, a
  factor cycle — so both surface as incoherence; a concept with several heads surfaces as
  divergence and is never resolved by picking one.

The authority rule — only the architect writes the design — is skill routing's
(`trio-skill-routing`); this module neither knows nor checks who is writing.

Isolation (PLAN.md § Contract): imports only from `../../record-store/` (never
`immutability-gate.ts`), never from another capability directory or the view.

## Static

- `git show 9cc32431:docs/design/record-store.md` § The three domains (`design`), § The record
  model.
- `git show 9cc32431:packages/canon/src/skills/design/skill.ts` — `anchor`, `gloss`, `factors`,
  `closure`, `blast`, `denotes`.
- The landed `packages/runtime/src/record-store/` (from `record-store`), and its return's reported
  signs.

## Deps

`record-store`

## Outputs

- `packages/runtime/src/capabilities/design/design.ts` (new), plus any further new file in that
  directory other than `index.ts` and `dispatch.ts`, which are `domain-interface`'s
- `.changeset/design-domain.md`

## Accept

1. `pnpm --filter @cratylus/runtime typecheck` passes.
2. The return carries a smoke script and its verbatim output, run as
   `pnpm --filter @cratylus/canon exec tsx <absolute path>` against a temporary records root; a
   re-run reproduces the output. It shows: define `A`, define `B` factoring `A` →
   `closure(B) = {B, A}` and `blast(A) = {A, B}`; relabel `A` → `B` still resolves its factor to
   the same entity; retract `A` → incoherence names `B`'s factor; two amendments of one version of
   `B` → divergence reported, and a further amend refuses, naming reconciliation; reconcile `B` →
   settled; a factor cycle → incoherence.
3. `git grep -nE "from '\.\./(plan|note)/|from '\.\./\.\./view|immutability-gate" -- packages/runtime/src/capabilities/design`
   prints nothing.
4. Sole: the return names the one module computing `closure`, and
   `git grep -ln closure -- packages/runtime/src` lists only that module.
5. `.changeset/design-domain.md` names `@cratylus/runtime`.
