# Elevation

**Handoff spec.** Everything below is decided. The builder implements it; it does not re-derive it.

`elevation` ≜ the rung an agent works at, together with the acts that rung reserves to itself and the
acts it must hand down. It is the concept `architect` and `kino` are built around and the one thing
about them nothing declares, nothing projects, and no gate can score.

## 1. What is true today (census, 2026-09-25)

| fact                                                                                                             | site                                                                                     |
| ---------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| `role` is `{ axis: 'Persona', repertoire: 'open', arity: 'scalar' }`                                             | `packages/canon/src/manifest.ts:52`                                                      |
| `architect` is the bare token `` `architect` `` — no definiens                                                   | `packages/canon/src/dimensions/role/architect.ts:3`                                      |
| `review` is the bare token `` `review` `` — no definiens, composed by no agent                                   | `packages/canon/src/dimensions/role/review.ts:3`                                         |
| roles carrying a definiens already exist (`build`, `plan`, `curate`, `test`, `operate`, …)                       | same directory                                                                           |
| `kino` and `architect` both declare `skills: ['design','deliver']`, `role: architect`                            | `agents/kino.ts:45-46`, `agents/architect.ts:59-60`                                      |
| both also declare `planning-decomposition` in `capabilities`                                                     | `agents/kino.ts:96`, `agents/architect.ts:99`                                            |
| `software-engineering` is absent from both, deliberately, as the delegation boundary                             | `agents/architect.ts:94-95`, `agents/kino.ts:86-90`                                      |
| `deliver.composition = [design, plan]` — the `plan` cell's text reaches every agent composing `deliver`          | `skills/deliver/skill.ts:101`                                                            |
| skill cells deploy corpus-wide; `Agent.skills` projects as `autoloadSkills` and advertises rather than restricts | `packages/forge/src/project/index.ts:508-516`, `adapters/omp/render.ts:286-288`          |
| `deliver` declares `validate ⊨ self ⟨¬ delegable⟩`                                                               | `skills/deliver/skill.ts:64-65`                                                          |
| `deliver` declares `validate ⊨ artifact ⟨NEVER r⟩`                                                               | `skills/deliver/skill.ts:62-63`                                                          |
| no `reviewer` agent cell exists                                                                                  | `packages/canon/src/agents/` holds six: architect, implementer, kino, mav, nico, planner |
| the stance guard judges exactly one dimension — `autonomy` — by quoting `handoff ≜ …` verbatim                   | `targets/guardrail/stance-judge-prompt.md:212-215`                                       |
| enrollment is `<scope>/stance/manifest.json`; `gates` is keyed by owning cell and is already plural              | `adapters/omp/render.ts:197,434-480`; `targets/guardrail/stance-guardrail.sh:165-185`    |

## 2. The two defects

**D1 — elevation is declared only as an absence.** What keeps `architect` and `kino` at the conceptual
rung is the _omission_ of `software-engineering` from `capabilities` plus prose in `archetype`. An
omission is not scoreable: no rubric can quote it, no gate can cite it, and no reader of the projected
Target can tell a deliberate absence from a forgotten one. The delegation of _decomposition_ is not
even an absence — `planning-decomposition` is present, glossed in `kino.ts:89` as "the decomposition
that hands work out", while `deliver` transitively drags the `plan` cell's own text onto the same
surface. An agent holding a capability exercises it. Left as-is, `kino` designs, decomposes itself,
and dispatches implementers directly, with every declaration it carries endorsing that.

**D2 — `validate` is the elevation's own solvent.** `deliver` is right that `validate ⊨ artifact
⟨NEVER r⟩`: an acceptance that read only the return has accepted nothing. But reading artifacts is
reading files — paths, identifiers, call sites — and that is precisely the mechanical work
`architect.ts:53` says "displaces conceptual work". The skill as written obliges the design-holder to
descend into the substrate on every wave, and by wave three the design-holder is a code reviewer with
a lattice it no longer has the context to hold. The operator's instinct is correct: the acceptance
step needs a delegate. What is _not_ correct is delegating the acceptance.

## 3. The cut that resolves D2

`validate(unit) ⇔ spells ∧ covers ∧ sole` (`skills/deliver/skill.ts:59-61`) is two operations wearing
one name:

- **evidence** — reading the landed artifact and answering the three questions against citations.
  Mechanical, substrate-bound, high-token, and **delegable**.
- **judgment** — deciding whether the answers mean the design was met, whether an extra behaviour is
  a smuggled concept or a `yield` that must `amend(C)`, and whether the unit advances. Design-bound
  and **not delegable**, exactly as `validate ⊨ self` says.

So a third witness joins `verify ⊥ validate`. It returns **evidence, never a verdict**. The law
`validate ⊨ artifact ⟨NEVER r⟩` survives only if the witness's return _is_ artifact — verbatim excerpts
with `path:line`, not prose about them. A witness that summarizes has reintroduced `r` under a new
name and defeats the whole cell.

## 4. Decided calls — implement these, do not relitigate

1. **`role` acquires definientia; no new axis is minted.** A `delegation` dimension would fold the same
   concept twice: `role` already means what an agent is and therefore what it does and does not do.
   Roles with definientia already exist in the catalog, so this is precedent, not a new pattern.
2. **`planning-decomposition` comes off `kino` and `architect`.** It is the declaration that contradicts
   the rung. Both keep `system-design`, `research-investigation`, `review-critique`; `kino` keeps its two
   minted film capabilities.
3. **The elevation gate binds `subagent.dispatch.pre` and a tool-use-pre moment — never `turn.end`.**
   Descending the rung is a mid-turn act: dispatching an implementer where a planner belongs, or editing
   a file at all. Stop fires after the text and is structurally blind to it. This is the same blind spot
   `stance-guardrail-pre` was minted to close.
4. **The gate ships as its own cell with its own rubric at the neutral root.** One gate, one contract.
   `gates` in the stance manifest is keyed by owning cell precisely so a second guarded dimension is a
   second entry. Appending to the 27 kB stance rubric would force every autonomy judgment to carry role
   text it must ignore.
5. **The acceptance witness is an agent cell composing `review`, and it emits citations only.**

## 5. Units

Order matters only where stated. Each unit's acceptance criteria are mechanical.

### U1 · `role/architect` gains its definiens

Rewrite `packages/canon/src/dimensions/role/architect.ts` so the value states the rung, what it
reserves, and what it hands down. Shape (the builder signifies the final form; these are the concepts
that must appear):

```
architect ≜ conceptual-rung ⟨holds C · ¬ substrate⟩
  reserves ⟨author(C) · cut(C) · judge ⟨validate-as-decision⟩ · amend(C)⟩
  delegates ⟨decompose ↦ planner@plan · build ↦ implementer · acceptance-evidence ↦ witness@review⟩
  descent ≜ performing a delegated act itself ⟨defect · ¬ diligence⟩
```

**Acceptance.** `architect.ts` exports a `Role` whose text names all three delegated acts and the
descent clause; `pnpm typecheck` and the corpus `accept()` gate pass; the projected `kino` and
`architect` Targets carry the text verbatim in their Role section.

### U2 · `role/review` gains its definiens

`review` is composed by nothing today, so it is free to carry the witness's contract:

```
review ≜ artifact-witness ⟨reads what LANDED⟩
  emits ⟨citation ⟨path:line · VERBATIM⟩⟩ · ¬ verdict ⟨accept ∉ remit⟩
  answers ⟨spells · covers · sole⟩ @ deliver
  summary ⇒ defect ⟨a claim substituted for evidence⟩
```

**Acceptance.** As U1, plus: no existing agent's projection changes (nothing composes `review` yet).

### U3 · Capability correction

Remove `planningDecomposition_capabilities` from `agents/kino.ts` and `agents/architect.ts`, including
the import and the now-false comment fragment "the decomposition that hands work out" in `kino.ts:89`.

**Acceptance.** Neither projected Target lists planning-decomposition; `pnpm typecheck` clean; no
unused import.

### U4 · `deliver` names the witness

Amend the `deliver` formal block (`skills/deliver/skill.ts:23-95`). `validate ⊨ self` and
`validate ⊨ artifact ⟨NEVER r⟩` **stay verbatim** — they are the laws this unit protects. Add the
witness and its constraint, e.g.:

```
witness : unit ⇀ agent ⟨role = review⟩
evidence : unit × witness → ℘(citation) ⟨path:line · VERBATIM excerpt⟩
evidence ⊨ artifact ⟨a citation IS artifact ∴ ¬ r · a witness that SUMMARIZES has returned r
    under a new name ⇒ REFUSE⟩
validate(unit) reads evidence(unit, witness) ∨ artifact(unit) directly
    ⟨the READ is delegable · the VERDICT is ¬ delegable ∵ it is keyed to C, which the witness ∌⟩
```

and extend the closing line `deliver ≜ bind → dispatch(wave) → verify → validate → judge → …` so the
witness step appears in the sequence.

**Acceptance.** The block still parses as `SkillExpression`; `validate ⊨ self` and `NEVER r` are
byte-identical to their current text; the projected `deliver` SKILL.md contains the witness terms; the
header comment block (`skill.ts:6-21`) is extended to explain the read/verdict split rather than left
stating the old two-witness story.

### U5 · The witness agent cell

New `packages/canon/src/agents/<σ*>.ts`. **The builder names it** by cold decode over its contract —
it is not "reviewer" by default, and `reviewer` is already a harness built-in, so the name must not
collide. Vector constraints that are decided:

- `role: review` (U2).
- `capabilities`: substrate reading is its whole job, so `software-engineering` is **present** here —
  this is the agent that descends, so the principal does not.
- `objective` / `self-evaluation`: its output is citations; anything that rewards it for a conclusion
  is wrong.
- `autonomy`: **not** `principal-self`. It is dispatched, it answers, it returns.
- `guardrails`: `honesty` (required dimension).
- `skills`: `[]` — it reads files; it holds no lattice and runs no loop.
- `description`: must state that it returns evidence and never an accept/reject verdict, so a
  dispatching agent cannot mistake it for a judge.

**Acceptance.** `pnpm project` emits the agent for every harness; the projected description contains
the no-verdict clause; the agent appears in no gate's enrollment it should not.

### U6 · The elevation gate

New hook cell beside `stance-guardrail` / `stance-guardrail-pre`, following
`packages/canon/src/hooks/stance-guardrail-pre.ts` as the structural model — it is the proven pre-fire
shape and the only one that can see a mid-turn descent.

- `substrate: 'harness'`, `events: ['subagent.dispatch.pre', <tool-use-pre moment>]`.
- Its rubric is a **separate file** deployed to the vendor-neutral `.agents/` root, reached by the same
  derivation the existing workers use (`stance-guardrail.sh:87-100`).
- The rubric **quotes the `role` value verbatim**, exactly as the stance rubric quotes `handoff ≜ …`.
  It scores the declared contract, never an authored opinion about good behaviour.
- It BLOCKS: a dispatch to an implementer for a piece that was never decomposed by a planner; an edit
  or write to substrate by an agent whose role declares `delegates ⟨build⟩`; a dispatch whose prompt is
  the operator's literal words rather than a cut piece.
- It PASSES: dispatch to a planner; dispatch to the U5 witness; reading anything; writing design
  artifacts the role reserves.
- **Fail-open, evidence-checked, re-entry-capped** — inherit all three from the sibling. A block whose
  cited span is not literally in the payload is discarded (`stance-guardrail.sh:485-521`), and the
  reason is recorded there in full: a fabricated block is not a lesser error than a missed one.

**Acceptance.** `pnpm stance-guard:test` still passes; the new cell appears as its own entry under
`gates` in `kino`'s projected `stance/manifest.json` alongside the two existing ones; a fixture dispatch
of an undecomposed piece is denied and a dispatch to a planner is allowed, both proven against the
deployed artifact.

## 6. Do not

- Do **not** mint a `delegation` or `elevation` dimension. The concept's home is `role`.
- Do **not** let the witness emit accept/reject. It kills `validate ⊨ self` and the cell loses the
  second description that makes verification an operation at all (`skill.ts:9-12`).
- Do **not** bind the elevation gate to `turn.end`. It cannot see the act.
- Do **not** append to `stance-judge-prompt.md`.
- Do **not** try to enforce elevation by deleting capabilities alone. U3 is necessary and is not
  sufficient: an absence cannot be cited by a gate, which is defect D1.
- Do **not** remove `deliver` from `kino`. Judgment stays with the design-holder; only the read moves.
