# t3 — land the notation, reconcile docs, resolve the plan-retirement residue

## Objective

Apply t1's formal-block notation to praxis.ts so the plan-set-dynamics tier is stated in notation and the
residual `-- plan-retirement …` prose becomes formal — driving praxis to full self-sufficiency
(`ALLOW_LIST → ∅`). Reconcile the surrounding docs (ENGINE / skill description) to the new tier.

## Inputs

- `[dep-fed] t1` — the exact praxis.ts notation delta + placement ruling. Apply it; do not re-design.
- `packages/agent-canon/src/skills/praxis.ts` — the target; the residual `-- plan-retirement …` line (L54)
  formalizes here.
- `ENGINE.md` — reconcile if the tier surfaces an ENGINE-level realization (per t1's placement ruling).
- `packages/agent-canon/test/formal-block-self-sufficiency.test.ts` — the gate + `ALLOW_LIST` (currently
  `{praxis}` for the R1 residual); once the residue formalizes, praxis reaches 0 findings → remove it.
- `packages/agent-canon/src/skills/formalize.ts` — the round-trip-equivalent-or-better accept-gate.

## Constraints

- **self-sufficient-formalism**: the added notation carries the load — no prose gloss on a law/def line.
- **cratylism / reuse-over-mint**: established signs; new anchors only as t1 cold-verified them.
- Round-trip equivalent-or-better: the plan-retirement meaning is fully preserved by the notation, then the
  `--` prose is deleted — nothing lost.
- Must agree with t2's mechanism (both realize t1's one design); if notation and mechanism can't agree, the
  design (t1) is at fault — route back, don't paper over.
- Green build/typecheck/test.

## Dependencies

t1 (needs the notation delta). Coordinates with t2 via the shared t1 design (no direct t2 dep).

## Outputs

- praxis.ts formal block carries the plan-set-dynamics notation; the `plan-retirement` residue is formal.
- `ALLOW_LIST` in the self-sufficiency test reduced (praxis removed → `∅`, or documented if a new residual
  legitimately appears).
- ENGINE / skill docs reconciled. `graphify update .` run.

## Acceptance (blind, falsifiable)

1. The self-sufficiency gate reports praxis at **0 findings** with praxis **off** the `ALLOW_LIST`
   (`ALLOW_LIST → ∅`, unless a new genuinely-admissible residual is documented).
2. The `plan-retirement` content is now formal notation, not a `--`/`—` gloss (grep confirms the prose gone).
3. The notation passes self-sufficient-formalism (no prose gloss on a law/def) and round-trips the original
   meaning.
4. typecheck + full agent-canon suite green.
   Falsifier: praxis still allow-listed; `plan-retirement` still prose; a prose gloss on a law/def; red suite.
