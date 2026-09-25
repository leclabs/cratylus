# pin

**Wave 1.** Realizes `pin`.

## Intent

A unit's reference to the concept version it realizes, taken automatically when the unit is
authored, and the two readings over it:

- **take** — the concept entity's one head at the moment of authoring, which must be a version;
  refuses a diverged concept, a withdrawn one (its head a retraction) or an unknown one, since
  there is no single version to pin;
- **drifted** — the pinned version is no longer a head: a later version or a retraction now names
  it;
- **suspect** — the concept's closure holds a divergence, or a version newer than the one current
  when the pin was taken (a closure member amended since).

Heads and divergence of design records come from the record store's generic fold over the design
domain. The closure is design-specific, so the caller supplies it through a port this module
declares structurally; `domain-interface` wires `design-domain`'s closure into it (PLAN.md
§ Contract — the lattice's `pin → design` edge is realized at that composition).

Isolation: imports only from `../../record-store/` (never `immutability-gate.ts`), never
`./plan.ts`, `./unit.ts`, another capability directory, the view or `runtime-config.ts`. The unit
stores the pin as an opaque value; `unit` does not import this module either.

## Static

- `git show 0c9da09c:docs/design/record-store.md` § The three domains (`pin`, `unit`), § The
  record model (`head`, `divergence`).
- `git show c501e002:packages/canon/src/skills/plan/skill.ts` — the piece-level
  `pin(s) ≠ digest(s) ⇒ REFUSE` law this per-unit pin replaces.
- The landed `packages/runtime/src/record-store/` and its return's reported signs.

## Deps

`record-store`

## Outputs

- `packages/runtime/src/capabilities/plan/pin.ts` (new)
- `.changeset/pin.md`

## Accept

1. `pnpm --filter @cratylus/runtime typecheck` passes.
2. The return carries a smoke script and its verbatim output, run as
   `pnpm --filter @cratylus/canon exec tsx <absolute path>` against a temporary records root, with
   concept records written directly through the store and a hand-written closure for the port; a
   re-run reproduces the output. With `B` factoring `A`, it shows:
   - a pin taken on `B`, then amend `B`: drifted;
   - a fresh pin on `B`, then amend `A`: suspect and not drifted;
   - diverge `A` (two record sets written independently from its head, unioned): still suspect and
     not drifted, and taking a new pin on `B` refuses (its closure is not settled), as does a pin on
     `A`;
   - reconcile `A`, then retract `B`: drifted and not suspect, although `A` changed since the pin
     (drifted and suspect are disjoint);
   - taking a pin on the withdrawn `B` refuses.
3. `git grep -nE "from '\./(plan|unit)|from '\.\./(design|note)/|from '\.\./\.\./(view|runtime-config)|immutability-gate" -- packages/runtime/src/capabilities/plan/pin.ts`
   prints nothing.
4. Sole: the return names the identifiers realizing take, drifted and suspect, and each is
   declared nowhere else under `packages/runtime/src` (`git grep -n`).
5. `.changeset/pin.md` names `@cratylus/runtime`.
