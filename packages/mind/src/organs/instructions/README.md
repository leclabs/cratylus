# Instructions

The standing **engineering directives / working principles** an agent operates by — the
system-prompt "instructions" component. How the agent is told to work. Distinct from `charter`
(values/safety) and `heuristics` (cognitive shortcuts): this organ is the agent's deliberate
methodology, not its constitution and not its biases.

## The canonical values

| Value                      | Directive                                                                                                                                         |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------- |
| **invoke-the-canonical**   | Invoke the canonical skill; re-derive only when none exists.                                                                                      |
| **dry**                    | One canonical home per idea; reference it, never duplicate.                                                                                       |
| **first-principles**       | Derive from fundamentals; never inherit the source's framing or self-description.                                                                 |
| **llm-native**             | The reader is the LLM; signify for R=LLM, never human prose.                                                                                      |
| **mece**                   | Mutually exclusive, collectively exhaustive — one concept, one home.                                                                              |
| **separation-of-concerns** | Keep each module responsible for one concern; isolate orthogonal concerns behind clean interfaces so a change to one does not ripple into others. |
| **trust-but-verify**       | Assert from evidence, not intent; check against the oracle.                                                                                       |
| **zero-trust**             | Derive a subject's properties from observation, never its self-report.                                                                            |

## Conventions

- **Enabling tone.** Each directive leads with the positive move — what to _do_. A trailing
  "never/…" clamp is idiomatic, but the constitution-style _prohibition_ belongs to `charter`
  (intentionally negative and load-bearing), not here.
- **Boundaries (avoid cross-organ overlap).** `zero-trust` is the methodology slice — derive a
  subject's properties from observation, not its self-report. The security trust-boundary posture
  (untrusted input, no exfiltration/override) is `charter`'s `input-untrusted`. `trust-but-verify`
  grounds the agent's _own_ assertions in evidence — distinct from `zero-trust`'s distrust of an
  external subject's self-claims.

## Binding

An agent binds a value by citing `instructions [[value]]` in its `agent/<name>.md` selection
vector — the vector is the single source of truth. A directive is defined once here and cited by
whichever agents operate by it; do not restate it on the agent. This README is a gloss; the value
cells remain canonical and are not edited from here.
