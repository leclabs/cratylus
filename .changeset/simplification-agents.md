---
'@cratylus/canon': minor
'@cratylus/forge': minor
'@cratylus/schema': minor
---

Agents are judged in real use, and nothing refuses their acts for how they behave (decisions 0142, 0145).

- Canon: the `descend` and `past-objective` guards, `guarded()` and the plugin's `guards` dir are removed; the architect's elevation and stopping rule are plain values held by its own text. The `handoffs` factor is removed, so no agent is limited in whom it dispatches. Every role's evaluation is the one value `in-use` (its behaviour is evaluated in real use, by the operator working with it); `behavioral-examples`, `held-out`, `never-assertions` and `rubric` are removed. A persona that widens its reach is composed silently; one that weakens or removes a guardrail, or takes from a set other than its reach, is composed with a `CompositionWarning`. Malformed personas are still refused.
- Forge (omp): declarations carry `spawns: "*"` and the extension refuses no spawn. A dispatch or launch whose assignment misfits is shown the agent's form and warned, and goes ahead; the lead's and builder's cut-state checks and a dispatch from `eval` code are warnings. The readback gate, the guards and their in-process model judge (`completeSimple`) are removed, as is the forced `schemaMode: "strict"`; a session hook's worker is fired once and its stdout read as its verdict. Projection no longer closes a practice over dispatch, and the tree no longer reports `guards`. `HarnessAdapter.nativeAgents`, `ComposedGuard` and the live omp scenario runner (`createOmpAgentScenarioRunner`) are removed.
- Schema: `GuardCell`, `GuardJudge`, `Layout.guards` and `Agent.dispatches` are removed; `checkAssignment` reports its finding as `problem` (was `reason`).
