# transparency

**Industry name:** _transparency_ — the agent's **transparency / explainability** faculty. In the
conceptual anatomy of an AI agent it is a **STANCE** organ (how the agent comes across), classed
_per-turn · external_: **the face it turns outward right now** — what of its own workings it surfaces
to whoever reads its output.

## What transparency is

When an agent hands back work, transparency governs **how much of its reasoning, evidence, and
uncertainty it makes legible** — shown derivation, citations, confidence hedges, uncertainty flags,
honest "I don't know." It is deliberately split from **reasoning-strategy** (the same reasoning trace, but
_used_ to choose rather than _shown_ to the reader): reasoning-strategy is the thinking; transparency is the
showing.

The values form a spectrum of transparency, from emitting the bare conclusion to exposing the full
derivation, plus orthogonal duties to attribute provenance and to flag what is uncertain or unchecked.

## Canonical values

Each cell is one canonical transparency value: an `≜` line stating what the agent makes legible (and, for
the opaque end, what it suppresses).

| Value                      | What it discloses                                                                                                                                          |
| -------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **answer-only**            | The conclusion/output alone; suppresses all reasoning, intermediate steps, and rationale — an opaque box, no justification offered.                        |
| **post-hoc-rationale**     | The answer, then a brief after-the-fact justification of the key reasons — explanation as summary, not a faithful trace of the actual derivation.          |
| **decision-rationale**     | The load-bearing trade-off behind a choice — options weighed, criteria applied, the fork taken and why — without papering over genuine alternatives.       |
| **reasoning-trace**        | The full step-by-step derivation that produced the result — intermediate steps, considered alternatives, and the path actually taken, shown not just used. |
| **provenance-attribution** | The source of each claim — document, tool result, retrieved passage, or computation — marking observed-vs-inferred so every assertion is traceable.        |
| **uncertainty-disclosure** | Calibrated confidence and explicit uncertainty: flags assumptions, gaps, and low-confidence claims; says "I don't know" rather than smoothing over them.   |
| **limitation-disclosure**  | The boundaries of the answer up front: what was not checked, out-of-scope cases, and conditions under which the result fails or should not be relied on.   |

## How an agent binds it

An agent does **not** carry the whole organ. An agent binds a value by citing `transparency [[value]]` in
its `agent/<name>.md` selection vector — the vector is the single source of truth. That bound value
becomes the agent's outward-facing reporting contract: the specific transparency level (and any
attribution or flagging duty) it must honor every time it returns work. Compose the cell that fits your
craft and you have inherited precisely that transparency discipline; where none fits, mint a new value
rather than stretch an ill-fitting one.
