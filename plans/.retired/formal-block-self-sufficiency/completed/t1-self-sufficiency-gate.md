# t1 — self-sufficiency gate (formal-block lint)

## Objective

A deterministic test/tool that scans every skill `formalBlock` in `packages/canon/src/skills/*.ts`
and flags every `--` annotation that carries a **law or a definition** (a violation of
`self-sufficient-formalism`), classifying each as **redundant** (delete) or **load-bearing** (formalize).
Emits the authoritative drain worklist and serves as the regression guard t2 drains to green.

## Inputs (static — exist at authoring)

- `packages/canon/src/skills/formalize.ts` — the canonical accept-gate: admissible prose = primitive
  by-value declaration gloss + β∪ι citations; `gloss(B) ≜ prose beyond β∪ι ; gloss≠∅ ⇒ ¬complete ⇒ ⊥`.
- `packages/canon/src/skills/signify.ts`, `probe.ts` — reference DRAINED blocks (must PASS the gate).
- `packages/canon/test/symbols.test.ts` — the existing per-symbol gate; mirror its scan/harness shape.
- `.scratchpad/signify-review-jul-22/{signify-symbolic-notation-handoff.md,signify-symbolic-notation-verdict.md}`
  — W1–W3 rules + the R2 redundancy-check-first lesson.

## Constraints

- Classifier must distinguish the two admissible prose forms (primitive gloss, β∪ι citation) from a
  law/def annotation. A `--` on a declaration line whose LHS is a **primitive** is admissible; a `--` on a
  law line or on a **defined** symbol (`≜`/`⇔`/`=` RHS present) is suspect.
- **Redundancy-check-first (R2):** before classifying a suspect as load-bearing (formalize), test whether
  its content is reconstructable from other notation in the SAME block ⇒ redundant (delete). Mis-forking
  here re-commits the review's own `dec` error.
- Deterministic, dependency-free, runs under the existing vitest harness. No network, no API.
- Rollout: the gate MAY start advisory (report worklist) with an allow-list of not-yet-drained blocks, so
  landing t1 does not red-CI the corpus before t2 runs — but the allow-list must shrink to ∅ at t2 close.

## Dependencies

none (wave 0).

## Outputs

- `packages/canon/test/formal-block-self-sufficiency.test.ts` (or a lint module + test) wired into
  `pnpm --filter @leclabs/canon test`.
- A printable worklist: per file, each flagged annotation + line + {redundant|load-bearing} verdict.

## Acceptance (blind, falsifiable)

1. `pnpm --filter @leclabs/canon test` runs the new gate green.
2. A fixture block containing `-- <a law>` on a definition line is **flagged**; a fixture block with only
   primitive glosses + β∪ι citations **passes**. (Falsifier: injected law-annotation not flagged ⇒ fail.)
3. The drained `signify.ts` σ\*-cluster and `probe.ts` experiment/coverage lines **pass** (no false positive
   on already-correct notation). (Falsifier: a drained reference block is flagged ⇒ over-broad.)
4. Redundant vs load-bearing fork is exercised by a fixture of each kind and classified correctly.
