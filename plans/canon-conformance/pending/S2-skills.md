# S2-skills

**canon-conformance** · **wave 1** · **Deps** ⊳`E1-acceptance-harness` · **Lane** Nico

## Inputs

- static: `packages/agent-anatomy/src/skills/` (15 cells) · `MODEL.md`
- ⊳dep: `E1-acceptance-harness`

## Objective

Every skill cell `accept()`s. `formalBlock`s already exist — align each `delineation` + any prose region to σ\*/formal;
depalimpsest the 67 skill `[[ ]]` (a cross-reference inside the block is a bare formal symbol; the `Bindings` region
cites siblings by anchor); enforce `REFLEXIVE` — a skill must itself `accept()`.

## Acceptance (falsifier)

- FAIL if any skill's `core` fails BLIND decode to its `intent`.
- FAIL if a skill prose region is human-register (reader-density) or a `[[ ]]` remains inside a formal block.
- FAIL if a skill does not itself `accept()` (REFLEXIVE).

## Gate

SOURCE edits in-remit; push GATED (Operator).

## Return

Per-skill diffs + blind-oracle transcripts + the REFLEXIVE `accept()` result per skill.
