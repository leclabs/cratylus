# design-domain

**Wave 1.** Realizes `design`.

## Intent

The concept lattice C as a domain over the record store: every live concept with its anchor,
gloss and factors, computed from the design records at the moment of the read.

- A concept's payload is its anchor, gloss and factors. Factors are stored as entity references,
  so relabelling an anchor never breaks a reference; anchors are resolved to entities and back at
  the domain's boundary ("a payload names entities by anchor and the interface resolves them").
- A concept is live when its one head is a version, withdrawn when its one head is a retraction
  (the store's settled states); it is diverged when it has more than one head. `closure` and
  `blast` are the `design` skill's existing signs and mean what they mean there.
- Define (an entity's first version), amend (a supersession of the one current head — refused on a
  diverged concept, and the refusal names reconciliation), retract (a retraction of the one current
  head, which becomes the head), reconcile (the store's reconciliation, superseding every head,
  retraction heads included) and the lookups a trace needs (closure, blast, version history with
  reasons). Amending a withdrawn concept supersedes its retraction and reinstates it (`PLAN.md` N7).
  Every write names the current head; the domain never lets a caller name a record.
- A new version is always the same concept. A concept that becomes another is a retraction plus a
  definition; nothing here relates two concept entities as predecessor and successor.
- The domain hands the store its reference relation — a factor pointing at a withdrawn concept, a
  factor cycle — so both surface as incoherence; a diverged concept (two versions, or a version
  and a retraction, from merged branches) surfaces as divergence and is never resolved by picking
  one.

The authority rule — only the architect writes the design — is skill routing's
(`trio-skill-routing`); this module neither knows nor checks who is writing.

Isolation (PLAN.md § Contract): imports only from `../../record-store/` (never
`immutability-gate.ts`), never from another capability directory or the view.

## Static

- `git show 0c9da09c:docs/design/record-store.md` § The three domains (`design`), § The record
  model.
- `git show c501e002:packages/canon/src/skills/design/skill.ts` — `anchor`, `gloss`, `factors`,
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
   re-run reproduces the output. It shows:
   - define `A`, then define `B` factoring `A`: `closure(B) = {B, A}` and `blast(A) = {A, B}`;
   - relabel `A`: `B` still resolves its factor to the same entity;
   - each of these writes refuses on one branch: retract `A` while `B` factors on it; define a
     second live `B`; define with an empty gloss or reason; a factor naming a withdrawn concept; an
     amend closing a factor cycle;
   - retract `B`, then `A`: `A` reads withdrawn, and defining a new concept named `A` refuses (a
     withdrawn concept keeps its anchor); amend `A`, and it is reinstated;
   - two record sets written independently from one head of `B` (one amending, one retracting),
     unioned: divergence reported, a further amend refuses naming reconciliation, and reconciling
     `B` leaves it settled and live;
   - two record sets unioned where one retracted `A` and the other defined `C` factoring `A`, and two
     unioned sets that each defined a live `D`: incoherence reported for both, each resolved by an
     ordinary write.
3. `git grep -nE "from '\.\./(plan|note)/|from '\.\./\.\./view|immutability-gate" -- packages/runtime/src/capabilities/design`
   prints nothing.
4. Sole: the return names the one module computing `closure`, and
   `git grep -ln closure -- packages/runtime/src` lists only that module.
5. `.changeset/design-domain.md` names `@cratylus/runtime`.
