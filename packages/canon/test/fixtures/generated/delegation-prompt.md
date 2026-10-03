# Dispatch: strict per-invocation return contract

The caller requests the exact return contract for this invocation, with `outputSchema` and `schemaMode: "strict"`; the delegate returns only data conforming to that contract. For an invocation scoped to unit `strict-dispatch-returns`, the schema pins `unit` to that exact name. Consume the parsed `structuredOutput.data` object, including addressed fields such as `agent://<id>/<field>` where available, rather than prose or raw transport.

If the return does not conform, the harness reports a failed dispatch to the dispatcher. Do not create a design note, mark the whole failed, issue a semantic assay verdict, or automatically redispatch.

Planner loop results: waiting includes blocked unit names and blockers; ready names the ready units; closed names the plan. Implementer results: landed includes the unit and commit; blocked includes the unit and reason. Assayer results: achieved names the unit and commit; not-achieved includes missing-part addresses. Integrator results: whole names the unit and commit; red names the unit and failing check; plan-close names the plan and release disposition. Include branch-specific required facts only. An ad-hoc request outside the loop is not forced into these result branches.

On Claude, preserve this caller-owned intent at the highest available fidelity, but native Agent calls do not enforce omp's per-call schema mechanism. Print-mode `--json-schema` does not establish Agent-tool enforcement.
