# Two artifacts, not one — the altitude error under this whole plan

The operator's diagnosis, cold-confirmed: our schema and the schema a cold oracle returns for
"Agent Profile Schema" are **adjacent concepts at different altitudes**, and conflating them is what
sent this plan sideways.

## The cold oracle draws the line itself, unprompted

Asked where human-in / on / out-of-the-loop is declared, with no leading:

> **"policy artifact declares _which tier is required_; config/code artifact declares _how that tier
> is enforced_."**

- **Declaration artifacts** it names: risk/impact assessment (NIST AI RMF profile, EU AI Act
  conformity assessment), **system card / model card**, operational design document, runbook/SOP.
  "It's a **policy/governance document, not code** — the classification is a _statement of intent_
  about oversight."
- **Enforcement artifact**, named separately: "the actual enforcement mechanism (permission gates,
  approval workflows, guardrail configs)… the permission-mode setting (`settings.json`) is the
  technical artifact that enforces HITL-style approval."

## ∴ what each of our artifacts IS

|            | artifact              | answers                                   | ours                                               |
| ---------- | --------------------- | ----------------------------------------- | -------------------------------------------------- |
| **policy** | agent DECLARATION     | WHICH tier · WHAT stance · WHAT must hold | `agent-canon` — the dimension vector, the SOUL     |
| **config** | harness CONFIGURATION | HOW it is enforced on this substrate      | the projected `settings.json` / front-matter hooks |

The "Agent Profile Schema" the cold oracle first returned — `deployment.scaling`, `secrets`,
`model.provider`, `tools[].inputSchema` — is the **config** artifact. Our anatomy is the **policy**
artifact. They feel close because both describe one agent; they are not the same concept, and
neither reduces to the other.

## The error this plan was making

`enforcing-fragment` was moving ENFORCEMENT (a config concern) INTO the DECLARATION (the policy
artifact). Specifically, the last commit added `command`, `timeout`, `matcher` and `workers` to
`Enforcing` — putting shell scripts inside a policy statement.

The cold schema says the opposite, verbatim, about its lifecycle block:

> "values are **references to executable actions** (e.g. tool ids or webhook URIs), **not inline
> code** — the executing runtime resolves them, keeping the profile portable across engines."

## This RECONCILES the warm/cold tension I flagged

I had two findings that appeared to contradict:

- warm: "enforcement binds to the VALUE it protects" (a peer dimension is a dependent-type error)
- cold: "lifecycle hooks are AGENT-LEVEL and hold references"

Both hold, at their own altitude:

- **The BINDING is declarative and belongs on the value.** `autonomy: principal` states that this
  stance is enforced, on which lifecycle event, on which substrate. That is policy — WHICH tier.
  Skew between value and binding is the dependent-type error, and it is real.
- **The HOOK TABLE is configuration and belongs to the adapter.** `onStop → <command>` is generated
  per harness from the declaration. That is config — HOW enforced.

So `Enforcing` should carry the DECLARATION only — that this value is enforced, at which events, on
which substrate — and **reference** its mechanism by anchor. `command` / `workers` are harness
realization and belong with the adapter, exactly as the projection already emits worker bytes and the
claude adapter already generates front-matter hooks.

**Correction owed:** `Enforcing.command` / `.timeout` / `.matcher` / `.workers` are at the wrong
altitude and should become a mechanism REFERENCE.

## The operator's two questions, answered

**1. Where do I set human-on-the-loop?** In the DECLARATION — our `autonomy` dimension, which is
right where it is. It is a statement of intent, and the cold oracle agrees that is a policy artifact,
not config. Nothing to move.

**2. Where do I configure a stance lifecycle gate?** Split:

- _That_ the stance is gated → the declaration, bound to the autonomy value it protects.
- _How_ it is gated → the harness config: a **Stop hook**, which the cold oracle named as the real
  available mechanism, generated per-agent by the adapter.

**And the check itself has NO industry name.** Asked directly what such a turn-end role-consistency
check is called, the cold oracle refused to name one rather than fabricate:

> "I'm not aware of any such check… That's a pretty specific claim, and I'd be guessing/fabricating
> if I named something."

⊥ IS A RESULT. It corroborates the independent finding that there is no settled term for the general
declared-property-vs-behaviour check. **The concept is real and the language is short** — which is
the L1-passes / no-sign case, and means a signify pass is owed rather than a borrowed word.

## Method note

Every claim above came from the canonical `cold-oracle.sh` isolation. The refusal in the last quote
is load-bearing evidence, not a failed query.
