# Where enforcement belongs — the conceptual model, from three cold probes

Three independent probes, no project context, each licensed to answer "not a real distinction".
None took the exit. They converge, and together they say **the machinery this plan built is right and
was aimed at the wrong target twice over**.

---

## 1. `guardrails` is not the home of stance enforcement — it is a CATEGORY ERROR

A guardrail is an **out-of-band, task-invariant predicate with veto power, mounted at a boundary,
that the guarded reasoning cannot talk its way out of.** The persuasion test is definitional: _if
content flowing through the check can alter the check's own policy, it is an instruction, not a
guardrail._

Stance-drift enforcement fails that definition structurally:

- A guardrail is `P(artifact, policy)`. This is `P(trace, declaration)` — it needs the agent's own
  declaration as a first-class referent, plus a HISTORY.
- **The clean test: could you run this check on a shuffled sample of outputs with no knowledge of
  which agent produced them?** Toxicity, PII, injection — yes. Stance drift — no. A guardrail is not
  allowed to need that question answered.
- Drift is an AGGREGATE property of a trajectory. Guardrails are point-in-time.

Its real names: **persona drift** (Li et al., COLM 2024) and **role adherence** (DeepEval, Galileo)
— and note where the industry files those: **in the evals product, not the guardrails product.**
For the AUTHORITY case specifically: **least privilege / capability scoping**.

### The line that reframes this whole plan

> The correct fix for the authority case is usually **not a check at all but a narrower grant** — and
> the word "guardrail" actively hides that, because it suggests you should add a detector where you
> should have removed a capability. If "advises but does not execute" is enforced by not binding the
> write tools, **there is no drift to detect**.

Drift detection is a SYMPTOM of having made authority declarative-but-unenforced.

---

## 2. Enforcement binds to the VALUE it protects — a peer dimension is a category error

The dimensions are declared INDEPENDENT — a free product `A₁ × A₂ × … × Aₙ`, every point
well-formed. But enforcement for `A_k` is _parameterized by the value chosen in `A_k`_:
`enforce : (v : A_k) → Monitor`. **That is a dependent type.** Putting it in a peer dimension erases
the dependency, so the well-formed configurations become a **diagonal inside the product** — a graph
of a function masquerading as a free axis, where every off-diagonal point is a silent
misconfiguration the type admits.

Three detectors, all of which our current placement fails:

| detector            | question                                                    | our verdict                                                                                               |
| ------------------- | ----------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| free-variable       | can two agents differ here independently, both well-formed? | NO — it only makes sense in lockstep with `autonomy`                                                      |
| conditional-entropy | does knowing `autonomy` determine this column?              | YES ⇒ zero independent information; a copy, not a dimension                                               |
| **naming**          | try to name it honestly                                     | **"the-enforcement-for-autonomy=principal"** — the name must mention another coordinate ∴ not independent |

The naming test is the cratylism-native one and it convicts immediately.

### The sharpest discriminator, for future cases

> Look at what the candidate enforcement attribute's VALUES are. If they are `{off, warn, refuse}` —
> a **severity mode**, meaningful against any declaration — it is genuinely free and a peer column is
> correct. If they are `{authority-drift-monitor, tone-drift-monitor, …}` — a copy of the catalog —
> it is a value-property wearing a peer's clothes.
>
> **Severity may be a peer column; WHICH CONTRACT is enforced never can.**

### Skew is the failure, and the asymmetry matters

Peer placement admits two drifts, both invisible at authoring time. Value changes, monitor doesn't ⇒
the monitor fires confidently **against a stale contract** — refusing behaviour that is now correct,
_a wrong answer delivered with a right answer's force_. Monitor changes, value doesn't ⇒ silently
unprotected. This is the parallel-arrays bug class.

Prior art moved the same direction we must: Kubernetes **PodSecurityPolicy → Pod Security
Admission** put the level ON the namespace object; Java SecurityManager policy files (peer, keyed by
string) were deprecated; Rails `attr_accessible` (peer, declared far from use) drifted into CVEs and
became strong parameters **at the use site**.

### The factoring

- **binding** — "this value is guarded by M" — lives ON the value. Must, because it is the thing that
  must never skew.
- **mechanism** — the judge itself — lives in the substrate, REFERENCED by name, not copied.
  Genericity moves the code, never the binding.
- Two further placements worth knowing: **derived** (generate the monitor from the declared value —
  no column at all, nothing to skew) and **a law over the whole vector** (a class invariant, not a
  field invariant — the one case a value-binding genuinely cannot hold).

**Already verified: an `Autonomy` value carrying `events`/`command`/`workers` compiles today.** The
`Value<O> = Fragment<O> | Enforcing<O>` work applies to all 22 dimensions. The machinery is right;
it was pointed at `guardrails`.

---

## 3. `check-in` is a THIRD property — neither authority nor output-format

|                | signature                                   | governs                      | codomain                     |
| -------------- | ------------------------------------------- | ---------------------------- | ---------------------------- |
| authority      | `Decision → {act, escalate}`                | the flow of CONTROL          | the world                    |
| **disclosure** | `TrajectoryState × Boundary → Maybe Report` | the flow of INFORMATION      | the principal's mental model |
| format         | `Content → Rendering`                       | neither — it is the ENCODING | —                            |

> **An escalation is a request for a decision. A report is a transfer of state.**

Independent variation proves it: all four quadrants are populated and separately desirable.

|                          | reports richly                         | reports rarely            |
| ------------------------ | -------------------------------------- | ------------------------- |
| **acts alone**           | senior engineer who ships, then briefs | black-box contractor      |
| **escalates constantly** | trainee                                | **the pathological cell** |

And the decisive asymmetry against format: **a format has no truth conditions; a report can be
false, and false by omission.** Nothing in a rendering function can be dishonest.

### Filing it under autonomy is the DANGEROUS error — and we made it

The configuration space collapses onto the diagonal: the only way to make the agent report more is
to make it ASK more; the only way to stop the asking is to hand it more autonomy.
**Autonomous-and-transparent — the configuration every competent operator actually wants — becomes
unreachable.**

Worse, an operator who finds check-ins interruptive dials them down and **silently loses authority
containment with the same knob**, because there is only one knob. A safety regression entering
disguised as a UX preference, surfacing late and misattributed.

**This is the observed failure, exactly.** Escalating constantly while reporting unreadably is the
bottom-right cell. With `check-in` filed under `autonomy`, "act alone AND report well" is not
expressible.

The right anchor is not "reporting" (that names the act and drifts toward format). It is closer to
**disclosure** — or, in older and better language, **accountability: the standing obligation to
render an account.** Note that `accountability` currently sits, mis-filed, in the `guardrails`
catalog.

---

## 4. Why the check-in line is IGNORED — mechanism, not defiance

> `bind ≈ trigger-crispness × verifiability × (1 − competing-prior-strength)`

The report-back instruction scores badly on **all three at once**:

- **Fuzzy trigger.** "At a natural boundary" is a state-classification the model must perform before
  compliance is even at stake. Operators read non-detection as defiance.
- **Unverifiable.** Post-training put enormous gradient on checkable constraints (JSON validity,
  "exactly three bullets"). Qualitative register — "lead with the decision", "be terse" — has no
  verifier and got no comparable gradient.
- **Competing prior.** The closing move of an assistant turn is the most heavily optimized surface in
  all of post-training; "summarize what I did, list what's next" is close to a basin. A persona line
  is overwriting the highest-density region of the policy.

Four aggravating mechanisms: **maximal temporal distance** (stated at position 0, evaluated at
position N of a long agentic trajectory); **no in-episode error signal** (a wrong path throws and
self-repairs — a badly shaped check-in just ends the turn); **harness collision**, where the winner
is recency × specificity, not operator-perceived authority; and **negation without a supplied
alternative**, where the prior fills the slot and the prior is a summary.

Critically: "shape" is not one class. _Verifiable_ shape (a schema, ≤5 bullets, ends with a named
header) is among the STRONGEST-binding instructions in the prompt. _Qualitative_ register is among
the weakest. **Converting the reporting rule from the second class to the first is the single
highest-leverage intervention available.**

> **Terminal recommendation: move turn-closure shape OUT of the persona vector and INTO the harness
> — a stop hook, an output schema, a structured return. Prompt text is the weakest available
> enforcement, and the report-back line is the weakest instruction in the weakest medium.**

---

## 5. What this means for the corpus

1. **`guardrails` keeps only real content constraints** — `harm-avoidance`, `input-untrusted`,
   `privacy`. These pass the shuffled-sample test and the persuasion test.
2. **Evictions, each to a named home:** `scope-of-authority` duplicates `autonomy.decision-authority`
   · `human-oversight` is an autonomy concern · `honesty`/`helpfulness` STEER (objective/values, not
   constraints) · **`accountability` is the disclosure anchor**, not a guardrail.
3. **Stance enforcement binds to `π_decision-authority(self) = principal`** — placement (b), already
   type-feasible. Not a `guardrails` value.
4. **Disclosure becomes its own dimension**, and `check-in` moves out of `autonomy` into it.
5. **The disclosure contract gets a VERIFIER, not a stronger sentence** — which is precisely the
   enforcing-fragment machinery, finally aimed at the property that needs it.
6. **Consider the narrower grant before the detector.** `stance-guardrail-pre` denying
   `AskUserQuestion` on an in-remit reversible call is already capability scoping, not drift
   detection — two different concepts currently fused under one anchor.
