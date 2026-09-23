---
'@cratylus/forge': patch
---

A persona's overlay sets `personality: none` — the cell is the only voice

omp's default prompt renders a personality block chosen by the `personality` setting
(`default`, `friendly`, `pragmatic`, `none`). A composed persona already states its register
completely: `formality` carries the prose contract, `audience-adaptation` sets density against
the interlocutor, and `transparency` and `handoff` fix what a reply discloses and how it ends. A
preset rendered beside those is a second, uncoordinated statement of the same thing — two homes
for one concept, in the same prompt.

`none` rather than a better-fitting preset, because **omp runs every subagent with `none`
regardless**. Left at a preset, one definition means two different voices depending on whether it
was launched as a main session or dispatched as a subagent — the exact defect that the single
agent definition closes for identity and that the launcher's `autoloadSkills` rendering closes
for required reading. Closing it on the register axis too is what makes a persona sound the same
from either direction.

The setting lands in the generated `--config` overlay and not in the agent cell, because it is
genuinely a session setting rather than a dimension of the persona. Conflating the two is the
category error this change exists to correct.
