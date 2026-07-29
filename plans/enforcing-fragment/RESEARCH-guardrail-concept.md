# What a guardrail IS — and why stance-enforcement is not one

Cold probe, no project context, licensed to answer "not a real distinction". It did not take that
exit.

## The definition

> A guardrail is an **out-of-band, task-invariant predicate with veto power, mounted at a boundary
> of the agent, that the guarded reasoning cannot talk its way out of.**

Four load-bearing clauses: out-of-band (beside the model, not inside it) · task-invariant (its policy
does not change when the task changes) · veto power (a component that only SCORES is a detector, not
a guardrail) · non-bypassable.

**The persuasion test, definitional:** if content flowing through the check can alter the check's own
policy, it is not a guardrail — it is an instruction. _Everything you can jailbreak by argument was
never a guardrail._

**What it owns that nothing else owns:** the answer to "is this permitted?" computed WITHOUT
consulting the agent's intent. The planner owns what to do; the guardrail is the only component
obliged to answer while structurally deaf to intent.

Boundary-mounted, never intra-reasoning (NeMo's rail taxonomy is the best-factored published map:
input · dialog · retrieval · **execution** · output). The execution/action rail is the one that
matters for agents and is least served by a market that is overwhelmingly text-in/text-out — an
agent's damage is done through tool calls, not prose.

## Stance-drift enforcement is NOT a guardrail

Two structural breaks:

1. **The predicate is not evaluable on artifact + fixed policy.** A guardrail is `P(artifact,
policy)`. This is `P(trace, declaration)` — it needs the agent's own declaration as a first-class
   referent, and a HISTORY to compare against.

   **The clean test: could you run this check on a shuffled sample of outputs with no knowledge of
   which agent produced them?** Toxicity, PII, injection, grounding — yes. Declared-property drift —
   no. A guardrail is not allowed to need that question answered.

2. **The declaration is authored by the thing being checked.** Unless sealed out-of-band, the agent
   drifts by revising the standard rather than the behaviour. A content filter structurally cannot
   have this failure mode.

Third, softer: drift is an AGGREGATE property of a trajectory. Guardrails are point-in-time.

### The condition that decides it

> A declared-property monitor is a guardrail **iff the declaration is sealed out-of-band from the
> agent.** If the agent can revise its own declaration, you have built **an instruction with a
> compliance report**, not a guardrail.

## The industry's actual names

| case               | name                                                                                                                                                                                                           | where it lives                                                                                  |
| ------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| persona            | **persona drift** (Li, Liu, Saphra, Zhou & Rush, COLM 2024 — measures system-prompt adherence decay over multi-turn dialog); **role adherence** (DeepEval `RoleAdherenceMetric`, Galileo's agentic metric set) | **the EVALS product, not the guardrails product** — that placement is the industry's own answer |
| declared AUTHORITY | **least privilege / capability scoping**; **instruction hierarchy** (Wallace et al., OpenAI 2024); **confused deputy**                                                                                         | authorization, not guardrailing                                                                 |
| general            | **runtime verification / trace-property monitoring** (Bauer, Leucker, Schallhart); **conformance checking** (van der Aalst) — literally this question, decades old, in BPM                                     | —                                                                                               |

No settled single industry term for the general declared-property-vs-behaviour check (confidence
~0.7 — the claim most likely to be wrong). Candidate: **self-conformance monitoring**.

## The sharpest line, for our case

> The correct fix for the authority case is usually **not a check at all but a narrower grant** — and
> the word "guardrail" actively hides that, because it suggests you should add a detector where you
> should have removed a capability.

If "advises but does not execute" is enforced by not binding the write tools, **there is no drift to
detect**. Drift detection is a SYMPTOM of having made authority declarative-but-unenforced.

## The steelman, conceded in part

"Guardrail" may be POSITIONAL (mounted at a boundary, with veto) rather than SEMANTIC. Under that
reading a stateful persona monitor is just a guardrail. Evidence is strong: NeMo dialog rails
enforce "the bot stays in character" and ship under the word; Bedrock Automated Reasoning verifies
output against a declared policy document; injection guardrails are already stateful.

Conceded: in the loose sense, yes, and you will be understood. But it **discards exactly the
information that makes it hard** — that the spec is per-instance and self-authored (so it must be
sealed or the check is circular), that the predicate is over a trajectory (so you need trace
capture, not an I/O hook), and that the authority case wants a narrower grant rather than a detector.

**It may be IMPLEMENTED as a guardrail; the CONCEPT is conformance.**

## Neighbours and their distinguishing tests

| confused with         | test                                                                       |
| --------------------- | -------------------------------------------------------------------------- |
| alignment / RLHF      | separable from the weights?                                                |
| system prompt         | the persuasion test — anything in context is an instruction                |
| evals                 | does it run in the request path with authority to STOP it?                 |
| detector / classifier | does it DECIDE, or only DESCRIBE? guardrail = detector + policy + enforcer |
| authorization         | does the predicate depend on the principal's grants, or on the content?    |
| sandboxing            | the sandbox makes violation IMPOSSIBLE; the guardrail makes it DETECTED    |
