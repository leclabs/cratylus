# The message a hook speaks to an agent has no declared home

> Filed, not fixed — deferred out of C0 (`979fa021`) because it is a **model** change, not a
> test change. Surfaced by extending the density gate's reach and finding one family
> unreachable by anything but a proxy.

## Symptom

Four strings enter an agent's context every session, authored nowhere the model can see:

| worker                       | what it says to the agent                             |
| ---------------------------- | ----------------------------------------------------- |
| `resume-availability-notice` | that this agent has persistent memory, and how        |
| `memory-consolidation-nudge` | that a consolidation is owed — and, separately, that  |
|                              | the runtime could not answer, so the nudge is blind   |
| `praxis-advance-nudge`       | that `PLAN.md` may now be stale, and how to re-mirror |

Each lives as a `printf` body inside a shell worker. A hook cell declares its `residue`
(its σ\*-signified identity) and its `workers[].content` (byte-anchors for the committed
scripts). **The message it speaks has no field.**

## Why this is a model defect and not a test gap

`workers[].content` is **source code**, and code is not context — nothing loads a shell
script into a reader. The density gate deliberately does not score it: doing so would
convict the authorial _"we"_ of an ordinary code comment, and the gate's own source files
would fail first. That exclusion is correct and it is exactly what leaves the real ρ=LLM
surface — the emitted string — unreachable.

The only way to enumerate it today is to parse shell for `printf` arguments. **That is a
proxy, not the property**: satisfiable while the defect remains (a message assembled from
variables), and unsatisfiable where there is none (a `printf` that formats a path).

A missing distinction in the ground grows a second site in source. This is that shape: the
ground has no word for _what a hook says_, so it lives only where the saying happens.

## What the fix must establish

- The agent-facing message is a **declared field on the cell**, and the worker regenerates
  from it — the same relationship `workers[].content` already has with its committed script.
- Enumeration is then **by field**, never by parsing shell.
- The density gate reaches it with no new exclusion, and the C0 ratchet's KNOWN GAP note
  (`test/reader-density.test.ts`) retires with it.

## Prior measurement

All four strings were scored by hand at the 2026-08-04 sweep and **conform** — 20–46 words,
zero second-person, zero FPP, zero hedges. So this buys coverage, not debt. The reason to do
it is that the claim "the corpus conforms" must not depend on a hand-scored footnote.

## Acceptance

- A hook's agent-facing text is reachable from the cell without reading a `.sh` file.
- `allSurfaces()` enumerates it under a ρ=LLM class, and the reach assertion witnesses that
  class — so removing the enumeration fails the suite.
- Seeding human register into one such message convicts it, named.
- The KNOWN GAP paragraph on `REGISTER_RATCHET` is deleted, not reworded.
