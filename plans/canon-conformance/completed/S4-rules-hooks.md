# S4-rules-hooks

**canon-conformance** · **wave 1** · **Deps** ⊳`E1-acceptance-harness`, ⊳`E2-projection-boundary` · **Lane** Nico + Mav

## Inputs

- static: `packages/agent-anatomy/src/toolkit/{continuity,guardrail}/` (shell hooks) · repo `AGENTS.md`/`CLAUDE.md`
  - package `AGENTS.md` (scoped rules) · `MODEL.md`
- ⊳dep: `E1-acceptance-harness`, `E2-projection-boundary`

## Objective

Establish `rule` (activation `scope`) and `hook` (activation `event`) as first-class, **harness-agnostic SOURCE-fragment
kinds** (`.ts` cells) that `accept()`. Today's shell hooks + scoped `AGENTS.md` become **deploy TARGETS**, realized from
the source cell via `realize(activation, harness-adapter)` — the harness is orthogonal until deploy.

## Acceptance (falsifier)

- FAIL if a rule/hook's behavior is authored as a harness artifact (a shell script / hand-written `AGENTS.md`) rather
  than a source cell projected to it.
- FAIL if a rule/hook cell fails `accept()` (REFLEXIVE) or fails BLIND decode to its intent.
- FAIL if the projected target diverges from `realize(source)`.

## Gate

Source + adapter edits; push GATED (Operator).

## Return

The rule/hook source cells + their harness-target regeneration proof (source → `realize` → identical target).
