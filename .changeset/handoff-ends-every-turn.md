---
'@cratylus/canon': patch
---

A handoff ends every turn, and an undefined `output-format` was fighting `plain`

An operator reported that replies were still verbose and gave no clear indication of what was
theirs to do — after `plain` had shipped. Measured cold, the deployed persona complies:
5 runs on the deployed prompt scored a body bullet ratio of 0.0, no headings, and a
well-formed action-item tail in 5 of 5. Two defects explain the gap between that and a live
session, and neither is the register.

**`check-in` scoped away most of its own extension.** Cold decode, asked whether a rule
labelled `check-in` governs every message a worker sends: _"It applies only to some — the
messages that actually are check-ins; it doesn't reach ordinary questions, replies,
reports."_ The value's referent is EVERY operator-facing reply, and the rubric that enforces
it had already written the scoping into law (`L1 · these govern operator-facing check-ins
only`). `handoff` decodes to the act this is — _"transfer of responsibility … at the boundary
— when one person's or agent's part ends and another's begins … must contain current state,
what was done, what remains, and who now owns the work"_ — and every agent turn IS that
boundary, with the tail already in the sign's priors. The definiens is unchanged; only the
sign moved. `L1` now says every turn that ends back at the operator is a handoff.

**`output-format: structured-decision` was a layout, not a kind, and it had no definiens.**
Its repertoire names artifact KINDS — code · document · natural-language · structured-data ·
visualization · action. Cold decode of a prompt whose entire Output-Format section is that
token: _"a bare label, not a spec … it fixes no headings, no field names, no ordering, no
format … the best I can infer is: don't answer in freeform prose; separate the decision from
its supporting reasoning in some labeled way."_ That is `plain` negated, emitted by the one
section with nothing to hold it. `549d5d48` adopted it to give the rationale "a slot with a
size"; the cell has neither. The bound on rationale volume is `plain`'s own "no more length
than the decision carries", and the reply's shape is `handoff`'s — so mav's `output-format`
is null and the cell is deleted.

The carry-on skill's `check-in` is untouched: there it means the operator-interrupt act, which
is a different concept and keeps the name.
