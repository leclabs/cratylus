# plan-domain

**Wave 1.** Realizes `plan`.

## Intent

A plan as an entity of its own over the record store: "an entity naming the design it realizes and
its lifecycle: proposed, then bound, then closed. At most one plan is bound at a time, and a closed
plan stays readable forever; closing replaces retiring by deletion."

- A plan's payload is its name, the design it realizes, and its lifecycle state. "The design it
  realizes" is read as the concepts of the piece the plan realizes, referenced by entity and named
  by anchor at the boundary (`PLAN.md` finding N1).
- Propose writes a plan's first version; bind and close are supersessions moving it along its
  lifecycle; no move goes backwards, and a closed plan stays in the fold as a readable plan.
- **At most one bound.** Bind refuses while another plan is bound. After a merge two plans can both
  be bound (two branches each bound one); the domain reports that state and never resolves it by
  picking one, and bind refuses while it stands (`PLAN.md` finding N2).
- **The lifecycle vocabulary is received, never spelled.** The module takes the plan lifecycle as a
  parameter it declares structurally — the states in order, the one admitting at most one holder,
  the final one — and `domain-interface` supplies it from the runtime config (`lifecycle-configuration`).
- An owed ruling naming a plan blocks binding it: the module takes, as a parameter, the set of plans
  an owed ruling names (`notebook` recognises them; `domain-interface` composes).

Isolation (`PLAN.md` § Contract): imports only from `../../record-store/` (never
`immutability-gate.ts`), never `./unit.ts`, `./pin.ts`, another capability directory, the view or
`runtime-config.ts`.

## Static

- `git show 0c9da09c:docs/design/record-store.md` § The three domains (`plan`, `unit`, `notebook`),
  § How they are met (`domain interface`: bind, close), § Boundaries.
- `git show c501e002:packages/canon/src/skills/deliver/skill.ts` — `bound`, the WIP law this entity
  now carries.
- The landed `packages/runtime/src/record-store/` and its return's reported signs.

## Deps

`record-store`

## Outputs

- `packages/runtime/src/capabilities/plan/plan.ts` (new), plus any further new file in that
  directory other than `unit.ts`, `pin.ts` (their units') and `index.ts`, `dispatch.ts`
  (`domain-interface`'s)
- `.changeset/plan-domain.md`

## Accept

1. `pnpm --filter @cratylus/runtime typecheck` passes.
2. The return carries a smoke script and its verbatim output, run as
   `pnpm --filter @cratylus/canon exec tsx <absolute path>` against a temporary records root with a
   lifecycle vocabulary built from invented names (`s0`, `s1`, `s2`); a re-run reproduces the
   output. It shows:
   - `P` proposed, then bound;
   - binding `Q` while `P` is bound: `Q` bound and `P` returned to proposed;
   - `Q` closed, still listed as closed; binding or re-proposing a closed plan refuses;
   - two record sets in which different plans were each bound, unioned: the "more than one bound"
     incoherence is reported, and binding the one to keep resolves it, returning the other to
     proposed;
   - a plan named by an owed ruling refuses to bind.
3. `git grep -nE "'(proposed|bound|closed)'" -- packages/runtime/src` prints nothing.
4. `git grep -nE "from '\./(unit|pin)|from '\.\./(design|note)/|from '\.\./\.\./(view|runtime-config)|immutability-gate" -- packages/runtime/src/capabilities/plan/plan.ts`
   prints nothing.
5. Sole: the return names the one module that decides whether a plan may be bound, and
   `git grep -n <its identifier> -- packages/runtime/src` finds it declared only there.
6. `.changeset/plan-domain.md` names `@cratylus/runtime`.
