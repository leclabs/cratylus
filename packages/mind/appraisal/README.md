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
→ feed the error back**. The "held standard" is the agent's internal model of the whole — the
semantic-whole, the correctness-surface, the gestalt — and the "feed back" is the error signal that
makes the next cycle better. What differs between agents is _what_ they hold up to scrutiny and
_which_ failure modes they bias toward catching.

A value cell here is one named **appraisal discipline**: a specific result-against-intent check that
travels with whichever agent _holds_ it. Each cell carries a `holders:` line naming the archetype
that composites it. In this organ each discipline is held by exactly one agent — appraisal is
role-specific, because what counts as "did it work" depends on what the role was trying to do.

## The canonical appraisal disciplines

| Discipline                         | Holder                      | What it checks, and its effect on the agent                                                                                                                                                                                                                                                                   |
| ---------------------------------- | --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **accept-gate-roundtrip**          | nico                        | Runs the accept-gate: does the source reconstruct _equivalent-or-better_ from the routed cells (round-trip)? Self-critiques against the held semantic-whole and feeds the error back. Makes nico refuse to ship a corpus edit until it survives its own round-trip.                                           |
| **read-for-residual-complexity**   | principal-ic                | Reads the result against intent and the held whole, self-critiquing for _residual complexity or palimpsest_. Makes the principal maker bias toward catching leftover accidental complexity before declaring done.                                                                                             |
| **green-build-gate**               | mav                         | Runs the green-build gate: does **build · test · lint** pass? Self-critiques against the held gestalt and feeds the error back. Makes mav treat a non-green build as an unfinished turn.                                                                                                                      |
| **check-interior-and-coords**      | developer                   | Checks the result against plan & frame — does the test pass, does the diff stay _interior and unbraided_, do all PR-claims _cite coordinates_? Crucially, _escalates_ any required re-decision rather than absorbing it — keeping the developer inside its locked frame.                                      |
| **exit-criteria-falsifiable-gate** | planner                     | Runs the accept-gate over the plan: is every exit-criterion _falsifiable_ and every piece _method-bearing_? If a piece resisted, the verdict is "the plan is wrong (re-plan)," not "the piece is wrong." Makes the planner blame its own decomposition, not the work.                                         |
| **bias-toward-fail-error**         | tester                      | Reads each result against its oracle and _biases unresolved cases toward FAIL/ERROR over PASS_. Self-critiques against the held correctness-surface and feeds any escaped-defect signal back into disposition-memory. Makes the tester err on the side of false negatives, because false positives ship bugs. |
| **test-verdict-against-refuters**  | investigator                | Tests the verdict against its own _refuting-coordinates_ and the held fact-set — does every fact fit, is each claim cited, would the repro re-run? Makes the investigator try to break its own conclusion before trusting it.                                                                                 |
| **re-verify-coords-and-frames**    | principal-engineer-reviewer | Re-verifies each coordinate and each frame-tag against ground-truth, self-critiquing for _false-positives and missed-severities_. Feeds the error back as a disposition. Makes the reviewer audit its own review for both noise and blind spots.                                                              |
| **check-doc-against-runtime**      | arch-doc-writer             | Checks the published doc against _runtime-reality_ — does it still mirror the system? Self-critiques against the held whole-system model and feeds detected _drift_ back. Makes the doc-writer treat stale documentation as a defect to catch.                                                                |
| **fidelity-gate**                  | boswell                     | Runs the fidelity-gate: does the record reconstruct the event _equivalent-or-better_? Self-critiques against _conflation & embellishment_ and feeds the error back. Makes the biographer guard the chronicle against distortion.                                                                              |
| **check-for-leaked-inference**     | cognizant                   | Checks the dump for _completeness_ and for any _inference that leaked as observation_. Self-critiques against the held gestalt and feeds the error back. Makes cognizant police the observed-vs-inferred boundary in its own output.                                                                          |

## How an agent composites appraisal

An agent does not inline a generic "check your work" step; it _holds_ the appraisal discipline its
role demands. Each cell names its single `holders:` archetype, and the agent's archetype gathers the
discipline it brings. The composite shape is constant — _check against the held standard → self-
critique → feed the error back_ — so the organ factors that loop once and lets each role specialize
the standard and the failure-bias:

- The **accept-gate** family (nico's round-trip, planner's falsifiable-gate) checks whether a thing
  _reconstructs or survives its own criteria_.
- The **build / correctness** gates (mav's green-build, tester's fail-bias, developer's interior
  check) check whether the artifact _passes its objective tests_ and stays within frame.
- The **ground-truth** checks (investigator's refuters, reviewer's coords-and-frames, doc-writer's
  runtime-mirror, boswell's fidelity, cognizant's leaked-inference) check whether a _claim still
  matches reality_.

Several disciplines explicitly route their error signal onward — tester and reviewer feed it into
[`disposition-memory`](../disposition-memory) as a held disposition — so appraisal is also the source
that turns a single turn's self-critique into durable, cross-session learning. One loop shape, eleven
role-specific standards.
