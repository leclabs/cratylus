# The cold Agent Profile Schema — and what it says about our catalog

Obtained through the canonical harness (`toolkit/cold-oracle/cold-oracle.sh` isolation:
`CLAUDE_CONFIG_DIR` = credentials-only, scratch dir outside the repo, tool-less, prompt via stdin).
Two runs.

## Run 2 — the stable spine, asked bare

> name · description · metadata · instructions · model · tools · **permissions** · memory ·
> **triggers** · **constraints**

## Run 1 — the full schema, by block

| block                | fields                                                                                                                                                                             |
| -------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `metadata`           | id · name · version · description · owner · tags · **inherits** · timestamps                                                                                                       |
| `spec.persona`       | role · instructions · goals · **nonGoals** · tone · audience                                                                                                                       |
| `spec.model`         | provider · name · parameters(temperature, topP, maxOutputTokens, stop) · **fallback**                                                                                              |
| `spec.capabilities`  | `tools[]` — id · description · inputSchema · outputSchema · **permission: auto\|confirm\|deny** · **sideEffects: none\|reversible\|irreversible** — plus `modalities.input/output` |
| `spec.memory`        | shortTerm(strategy, windowSize) · longTerm(enabled, store, retention) · knowledgeSources                                                                                           |
| `spec.io`            | **inputSchema · outputSchema · responseFormat**                                                                                                                                    |
| `spec.guardrails`    | contentPolicies · allowedActions · deniedActions · **humanApproval{required, triggers}** · rateLimits · **escalation{onFailure, maxRetries}**                                      |
| `spec.orchestration` | mode(single-agent\|supervisor\|pipeline\|swarm) · subAgents[{ref, delegationCondition}] · handoffPolicy                                                                            |
| `spec.lifecycle`     | onStart · onMessage · onToolCall · onError · onComplete — **"references to executable actions, not inline code"**                                                                  |
| `spec.observability` | logging · tracing · metrics                                                                                                                                                        |
| `spec.deployment`    | runtime · scaling · secrets (references, never inline values)                                                                                                                      |

---

## What this settles

### 1. `guardrails`, cold, is PERMISSION + POLICY. Nothing else.

`contentPolicies · allowedActions · deniedActions · humanApproval · rateLimits · escalation`. There
is no slot for a steering value. **`honesty` and `helpfulness` are confirmed mis-filed** — they are
not expressible in the cold `guardrails` block at all. Nor is stance-drift detection, which
corroborates the independent finding that it is conformance, not guardrailing.

### 2. "Act without asking" is DECLARATIVE, per tool — the narrower grant, not a detector

The single sharpest result. The cold schema expresses authority as:

```
tools[].permission   : auto | confirm | deny
tools[].sideEffects  : none | reversible | irreversible
```

That is exactly the externally-grounded prescription — _"the correct fix for the authority case is
usually not a check at all but a narrower grant."_ Permission-seeking on an in-remit reversible call
is, in cold terms, a tool whose `permission` should be `auto` and whose `sideEffects` are
`reversible`. **Declared, not monitored.** No drift detector is required to express it.

This reframes the stance-guard: `stance-guardrail-pre` denying `AskUserQuestion` is a runtime
approximation of a grant that the profile should simply state.

### 3. Report SHAPE has a cold home, and it is `io.outputSchema` / `responseFormat`

Not a persona sentence. A **schema** — which is precisely the class of constraint that binds
(verifiable shape) rather than the class that does not (qualitative register). `check-in
⟨conclusion-first · owed ↦ recommendation-bearing-tail⟩` is an `outputSchema`, not an autonomy value.

### 4. Lifecycle hooks are agent-level and hold REFERENCES

`onStart · onMessage · onToolCall · onError · onComplete`, explicitly "references to executable
actions… not inline code". Relevant to enforcing-fragment: the cold model does NOT attach hooks to
individual persona traits. It keeps a hook table on the agent, pointing at named mechanisms.

**This is in tension with the earlier "enforcement binds to the value it protects" conclusion, which
was reached WARM.** Both can hold — binding on the value, mechanism referenced from a table — but
the tension is real and must be resolved cold before either is built on.

### 5. `humanApproval` and `escalation` live under guardrails, not autonomy

Cold puts `humanApproval{required, triggers}` and `escalation{onFailure, maxRetries}` inside
`guardrails`. Our `human-oversight` (currently a guardrails value) is therefore correctly filed, and
our `mission-command ⟨escalate ⇔ fork⟩` (currently autonomy) may not be.

### 6. `nonGoals` is a first-class field we lack

Every one of our agent descriptions carries a negative clause in prose — "judges and flags, never
authoring the fix", "it plans; it does not execute". Cold gives that a **field**. We express it only
as description text, where nothing can check it.

---

## What we carry that the cold schema does NOT

Absent from both runs: `formality` · `audience-adaptation` · `transparency` · `satisficing` ·
`framing` · `self-evaluation` · `heuristics` · `situation-awareness` · `learning` ·
`reasoning-strategy`.

Two readings, and they are not equivalent:

- **(a) We are over-dimensioned.** These are not specification-worthy; they are prose flavour that a
  cold reader does not reach for.
- **(b) Different artifact.** The cold APS is a DEPLOYMENT schema (runtime, scaling, secrets,
  providers); ours is a BEHAVIOURAL profile. The overlap is the intersection, not the whole of
  either.

(b) is likely — the cold schema carries `deployment`, `observability`, `orchestration` blocks we have
no dimension for, so the sets differ in both directions. But (a) cannot be dismissed: an earlier cold
ask for "the dimensions of a generic AI agent" also returned the standard perceive→reason→act loop
with none of the ten above. **Two independent cold framings omitted them.** That deserves its own
investigation rather than a comfortable answer.

## Method note

Every claim here came from the CANONICAL harness. Nothing in this file rests on a subagent probe —
those are warm by construction, as `cold-oracle.sh` has stated all along.
