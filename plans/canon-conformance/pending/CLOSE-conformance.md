# CLOSE-conformance

**canon-conformance** · **wave 2** (the join) · **Deps** ⊳`E1`, ⊳`E2`, ⊳`S1`, ⊳`S2`, ⊳`S3`, ⊳`S4`, ⊳`S5` · **Lane** Nico + Mav

## Inputs

- ⊳dep: all wave-0 + wave-1 tasks (their returns)
- static: `packages/agent-anatomy/test/reader-density.test.ts` · `packages/agent-anatomy/test/reader-reach.test.ts`

## Objective

Confirm the done-definition holds corpus-wide: `∀c∈canon: accept(c)`; every `Target` + human-artifact is regenerated
(`REGENERABLE`, zero hand-edits); `reader-density` + `reader-reach` + the E1 `Universal` gate green; ratchets empty and
shrink-only enforced; the `remediation-fanout` reference retired.

## Acceptance (falsifier)

- FAIL if any cell fails `accept()`.
- FAIL if any `Target`/human-artifact is hand-edited (not `deploy`/`project-human` output).
- FAIL if any gate is red, or any ratchet pin remains.
- FAIL if any `[[ ]]`, prose definiens, bespoke/civic anchor, or rival source-of-truth survives.

## Gate

Final green; push GATED (Operator).

## Return

The full-corpus `accept()` report + green gates + confirmation the initiative retires (dir removed; git is the record).
