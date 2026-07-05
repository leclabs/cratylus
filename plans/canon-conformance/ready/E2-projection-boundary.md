# E2-projection-boundary

**canon-conformance** · **wave 0** (root) · **Deps** none · **Lane** Mav

## Inputs (static)

- `packages/agent-forge/src/` (deploy · adapters) · `ENGINE.md` · `packages/agent-anatomy/src/organs/*/README.md`

## Objective

Make `boundary-projection ≜ {deploy, project-human}` the SOLE path to any `Target`/human-artifact — realizing the
thesis _"runtime context is a projection of canonical semantics, not its author."_ Implement
`project-human(c) = ⟨σ*_human(k) : k∈concepts(c)⟩`: deploy-owned, `¬hand-edit`, deterministic.

## Method (candidate)

- Implement `project-human` in agent-forge; wire into the deploy pipeline as a boundary projection.
- Ensure `realize : ActivationMode × harness-adapter → harness-mechanism` covers all five activation modes
  (`compose-only · identity · scope · trigger · event`) so `rule`/`hook` source projects to its harness artifact.

## Acceptance (falsifier)

- FAIL if any `Target`/human-view can be produced by hand rather than `deploy(c)` / `project-human(c)`.
- FAIL if `project-human(c)` is not a pure deterministic function of `source(c)`.
- FAIL if any deploy-owned artifact diverges from regeneration.

## Gate

Engine edits in-remit (Mav); push GATED (Operator).

## Return

`project-human` + a `realize` covering all activation modes + proof one organ's human-view regenerates byte-stable.
