# appraisal

**Organ (industry name):** _Appraisal_ / _self-evaluation_ / _reflection_ — the agent's
**result-against-intent check**, a CONATUS per-turn act (_per-turn · internal_) in the conceptual
anatomy (`docs/agent-conceptual-anatomy.md`).

**What it is.** Appraisal is the **reading of the result against intent**: did the work succeed,
self-critique it, and emit the error signal that feeds the next cycle. It is the closing beat of one
turn of doing — after the agent forms a [`construal`](../construal), [deliberates](../deliberation),
[`resolve`](../resolve)s, and [`enacts`](../enaction), appraisal looks back at what came out and
judges it. Where enaction _does_, appraisal _grades the doing_: it is the gate that decides whether
the result is good enough to stand, or whether the error it found must loop back into the next move
(and, when the lesson is durable, into [`disposition-memory`](../disposition-memory)).

Every appraisal in this organ shares one shape: **run a check against a held standard → self-critique
→ feed the error back**. What differs between methods is _what oracle decides the verdict_ — an
executable ground truth, a human, a second model, a vote across runs, a written spec, or the agent's
own re-reading.

A value cell here is one named **appraisal method**: a specific way to decide whether output is good
enough to stand. An agent binds a method by citing `appraisal [[value]]` in its `agent/<name>.md`
selection vector — that vector is the single source of truth for which method an agent carries. The
right method depends on the role: what counts as "did it work" depends on what the role was trying to
do.

## The canonical appraisal methods

| Method                         | What decides the verdict                                                                                                                                                                     |
| ------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **executable-test-oracle**     | Output run against an executable ground truth — unit/integration tests, type-checker, linter, compiler, schema validator, assertions — pass/fail decided by machine execution, not opinion.  |
| **acceptance-criteria-check**  | Output validated against an explicit, pre-stated spec (requirements list, definition-of-done, schema/format contract); pass iff every named criterion is satisfied.                          |
| **self-critique**              | Agent re-reads its own output against the held intent/standard, names defects, and revises in-place before declaring done — no external oracle, no second model; reflexive self-refine loop. |
| **llm-as-judge**               | A separate LLM call scores/grades the output against a rubric (correctness, quality, constraints), returning verdict + rationale; gate on the judge's score.                                 |
| **verifier-model**             | A dedicated checker model trained/specialized to detect a specific failure class (hallucination, unsafety, factuality, policy) emits a calibrated accept/reject signal.                      |
| **cross-validation-consensus** | Multiple independent samples/agents generated and reconciled by agreement (self-consistency vote, majority, debate, ensemble); confidence derives from convergence across runs.              |
| **human-review**               | Route the output to a person for approval before it stands; the agent gates on explicit human sign-off rather than any automated verdict.                                                    |

## How an agent composites appraisal

An agent does not inline a generic "check your work" step; it _holds_ the appraisal method its role
demands. An agent binds a method by citing `appraisal [[value]]` in its `agent/<name>.md` selection
vector — that vector is the source of truth. The composite shape is constant — _check against the held
standard → self-critique → feed the error back_ — so the organ factors that loop once and lets each
role specialize the oracle:

- The **machine-decided** methods (executable-test-oracle, acceptance-criteria-check,
  verifier-model) gate on an objective check.
- The **model-as-arbiter** methods (llm-as-judge, self-critique, cross-validation-consensus) gate on
  a model's judgment — a second model, the agent itself, or agreement across runs.
- **human-review** gates on a person — the final say no automated oracle can give.

An appraisal method that feeds its error signal onward turns a single turn's self-critique into
durable, cross-session learning via [`disposition-memory`](../disposition-memory). One loop shape,
many oracles.
