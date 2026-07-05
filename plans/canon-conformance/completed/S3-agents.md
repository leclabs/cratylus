# S3-agents

**canon-conformance** · **wave 1** · **Deps** ⊳`E1-acceptance-harness` · **Lane** Nico

## Inputs

- static: `packages/agent-anatomy/src/agents/` · `packages/agent-forge/src/anatomy/` (catalog · arity) · `MODEL.md`
- ⊳dep: `E1-acceptance-harness`

## Objective

Every agent composite is `COMPOSED`: `ir(a) = ⟨S_on⟩_{on∈dom catalog}` ∧ `∀on: S_on ⊆ catalog(on)` ∧
`|S_on| ∈ arity(on)` ∧ `∄ superfluous S_on`. Validate each agent's organ selection against catalog membership and
arity; flag any organ under/over-filled or carrying a superfluous value.

## Acceptance (falsifier)

- FAIL if any agent selects an organ-value `∉ catalog(on)`, or `|S_on| ∉ arity(on)`, or a superfluous value.
- FAIL if `accept(agent)` fails any `Universal` leg over the agent's concepts.

## Gate

In-remit; push GATED (Operator).

## Return

The `COMPOSED` report per agent (organ × arity conformance + superfluity check).
