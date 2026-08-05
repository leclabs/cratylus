# HookCell retires — the canon stops being a claude artifact

> Working handle, **not** an anchor. Reader = LLM.

**Cold-derived, not operator-decided.** The prior plan recorded "`HookCell` NARROWS rather than
retires (operator-decided)". That narrowing is falsified below. The design is discoverable from the
model's own concept space and from the grounding docs; asking was the error.

## The finding

`canon` is meant to be the GENERIC design and `forge` the harness projection. Today the
canon's governance cells are **claude artifacts**, and the consequence is measurable:

**`packages/canon/.render-ts-codex/` contains `agents`, `AGENTS.md`, `skills` — and no hooks
at all.** Every codex agent runs with zero stance guardrail, zero memory nudge, zero resume notice,
zero continuity. Not degraded — absent.

Four independent confirmations, each sufficient on its own:

| #   | fact                                                                                                                                                                                                               | where                                        |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | -------------------------------------------- |
| 1   | A canon cell hardcodes a claude path: ``command: `sh "$HOME/.claude/hooks/…"` ``                                                                                                                                   | `src/hooks/*.ts` (4 cells)                   |
| 2   | `HookCell` cites **"MODEL `Kind ∋ hook`, `activation: hook↦event`"**. MODEL says `Kind ≜ {fragment, agent, rule, skill}` and `ActivationMode ≜ {compose-only, identity, scope, trigger}`. **False on both counts** | `anatomy/hook-cell.ts:1` vs `MODEL.md:10,17` |
| 3   | Its own header claims "A hook is HARNESS-AGNOSTIC SOURCE" while declaring `command`/`timeout`/`targetPath` — self-refuting                                                                                         | `anatomy/hook-cell.ts:1-12`                  |
| 4   | The codex CLI **deletes canon's hooks dir**: `const { hooks: _codexHasNoHooks, ...codexPlugin }`, on the comment "Codex declares NO hook surface" — falsified this session by `b497840`                            | `toolkit/project-cli-codex.ts:33-39`         |

MODEL already assigns mechanism away from the cell: `mechanism : fragment × harness-adapter ⇀
harness-mechanism ⟨what deploy EMITS⟩`. `Enforcing` was corrected to obey this (`89a5ff7`);
`HookCell` was not, and kept `command` · `timeout` · `workers[].targetPath`.

## Target state

**`HookCell` retires.** It is a Kind MODEL does not have, holding mechanism MODEL assigns to the
adapter, hardcoding one harness's paths. Cells split by **what activates them** — MODEL's own
`ActivationMode` — never by what fires them:

| cell                         | activation   | becomes                                               |
| ---------------------------- | ------------ | ----------------------------------------------------- |
| `stance-guardrail`           | compose-only | `Enforcing` guardrail value, composed into nico · mav |
| `stance-guardrail-pre`       | compose-only | `Enforcing` guardrail value, composed into nico · mav |
| `memory-consolidation-nudge` | scope        | `rule` cell                                           |
| `resume-availability-notice` | scope        | `rule` cell                                           |
| `praxis-continuity`          | scope        | `rule` cell (git substrate)                           |

**The seam between canon and forge, stated once:**

- **canon owns the worker CONTENT** — what the mechanism DOES. Harness-agnostic behaviour.
- **forge owns the install PATH and the command shape** — where this harness puts it and how it
  invokes it. `~/.claude/hooks/<anchor>/…` is a claude FACE, derived by the claude adapter from
  ⟨anchor, worker filename⟩ — never authored in the canon.

A canon cell that names a path has already chosen a harness, and a being that has chosen a face
cannot have many.

## Shards

- **S5 — mechanism leaves the cell.** The adapter derives `command` from ⟨anchor, worker⟩; canon
  cells keep only `content` · `filename` · `executable`. Unblocks everything else.
- **S6 — `HookCell` → `rule` ∪ `Enforcing`.** The 3 scope-activated become `rule` cells; the 2
  compose-activated become guardrail dimension values on nico + mav. Subsumes the old S4.
- **S7 — codex stops being stripped.** Delete the `_codexHasNoHooks` elision; codex projects its
  own faces. The render gains hooks where it had none — the measurable proof.

## Completion criterion

`.render-ts-codex/` carries governance faces for every cell whose events codex can realize, and the
canon source contains no harness name, path, or command shape. Measured by reading the render, not
by the suite passing.
