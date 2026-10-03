# Dispatch: strict per-invocation return contract

The caller owns this invocation's schema and asks the delegate to return only a value conforming to it. Pin `unit` to the named unit when the request is unit-scoped. Role defaults do not own the contract. An ad-hoc request uses its own shape rather than a loop-result schema.

On omp, pass the schema as invocation-specific `outputSchema` with `schemaMode: "strict"` and consume parsed `structuredOutput.data`, including addressed fields such as `agent://<id>/<field>` where available. A native strict mismatch is a failed-dispatch returned to its dispatcher, never an automatic redispatch, design note, whole failure, semantic assay verdict, or lifecycle mutation.

On Claude Code native Agent calls, carry the caller's actual schema and conforming-return instruction in available call instructions. This is the highest-fidelity instruction projection, not machine-enforced structured transport; do not consume a nonconforming return as a route or verdict. Print-mode `--json-schema` does not establish Agent-tool enforcement. Per-call machine enforcement is available on omp, not Claude Code.

Loop result branches carry the receiving role's required facts: planner waiting includes blocked unit names and blockers, ready names ready units, and closed names the plan; implementer landed includes unit and commit, blocked includes unit and reason; assayer achieved includes unit and commit, not-achieved includes missing-part addresses; integrator whole includes unit and commit, red includes unit and failing check, and plan-close includes plan and release disposition.
