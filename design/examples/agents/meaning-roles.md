# Examples · meaning roles

Context: agents. Concepts: drift, profile and enforcement-level. Decisions in force: 0116 and 0117,
with 0078, 0100 and 0106. Carried examples retain their numbers.
Companion examples: [workflow](../workflow/meaning-roles.md).

Structural examples execute handoffs or assert over the delivered declarations and recorded behavior.
Behavioral examples run the composed agents 5 times with their actual assignments: every assertion
holds in at least 4 runs, every never-assertion in all 5. A rubric's criteria each hold in at least 4
runs; its never-assertions hold in all 5.

Behavioral reply cases run with no guard judging replies: ordering, hand-back and recording before
reporting must hold in what the architect actually delivers, not in a replacement elicited by a refusal.

## Structural (execution and assertions over delivered output)

11. (drift) **Given** behavioral examples have shown an architect repeatedly handing its owned
    decisions back to the operator despite its fixed stance, **when** that value is delivered again,
    **then** its text states the value and its behavioral examples still assert the tell's absence;
    a guard judging replies never counts as holding the value, because those replies take effect as
    they are shown. Another prose reminder alone never counts as evidence that the value now holds.

## Structural (profile and reply enforcement)

25. (profile, enforcement-level) **Given** the architect's profile holds its decisive stance and
    bottom-line-up-front ordering as fixed values, **when** the profile is delivered to a harness
    that shows replies as they are written, **then** the architect's own text states those values,
    including no menu in place of a recommendation, no hand-back of an owned decision and recording
    an owned decision before reporting it. There is no guard judging replies to hold them. The
    absence of such a guard never removes the values from the declaration or lowers them from
    fixed, and a declaration alone never counts as evidence that behavior satisfies them.
26. (drift, enforcement-level) **Given** a recorded run in which the architect's first reply hands
    an owned meaning decision back to the operator, that reply is shown as written, and a later
    refusal elicits a second reply that settles the decision correctly, **when** the run is judged,
    **then** the first reply counts as delivered and the hand-back violates the never-assertion.
    The correction never erases that violation, and the first reply is never reported as drift
    held by a guard.
27. (drift, enforcement-level) **Given** a guard checks an attempted change before it takes effect
    and refuses it, **when** the recorded run is judged, **then** the refused attempt is reported as
    drift held by the guard, not as an effective change or a pass of the text alone. This never
    licenses treating a reply already shown to its reader as an attempt that did not take effect.
