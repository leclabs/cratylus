# satisficing

**Industry name:** _satisficing_ — the agent's **decision / action-selection** faculty (the
commitment-point, the "commit" step). In the conceptual anatomy of an AI agent it is a **CONATUS**
organ (part of how the agent actually acts), classed _per-turn · internal_: **the commitment to one
course** — the moment that closes reasoning-strategy and selects the action to enact.

## What satisficing is

A turn runs _trigger → framing → reasoning-strategy → satisficing → output-format → self-evaluation_. **Reasoning-Strategy
weighs the options; satisficing commits to one.** It is the decisive cut between thinking and doing: the
in-context search opens many candidate moves, and satisficing fixes on exactly one — closing the search,
selecting the next action, and handing it to output-format.

So satisficing is not generic "deciding." Each value in this organ is the **specific commitment a given
kind of agent makes** — what it closes reasoning-strategy _onto_. A maker commits to a design; an
implementer commits to a diff; an investigator commits to a cause (or to _not knowing_); a tester
commits to a set of checks. The shape is always the same — **close reasoning-strategy, fix on one thing** —
but the _thing_ is tailored to the craft.

Each value also encodes its craft's honest escape hatch where one exists: the investigator and the
reviewer may resolve to **INCONCLUSIVE**, and the tester may resolve a dimension to **ERROR** when its
oracle cannot run. Committing to "no convergent answer" is a legitimate commitment, not a failure to
decide.

## Canonical values

Each value is _held_ by one agent, tailored to the artifact that agent ships. An agent binds a value
by citing it (`organ [[value]]`) in its `agent/<name>.md` selection vector — that vector is the source
of truth for who holds what.

| Value                             | What the agent commits to                                                                                                                 | Effect on the agent                                                            |
| --------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **commit-whole-and-pick**         | The elegant whole design **and** the one quality-pick; closes reasoning-strategy and decides authoritatively within intent.                     | Ends design search with a single decided, intent-bounded direction to ship.    |
| **commit-delivery-course**        | One course of action: closes reasoning-strategy and selects the move that advances delivery.                                                    | Converts open options into the next concrete delivery step.                    |
| **commit-diff-and-coords**        | The diff **and** its integration-coordinates — the smallest change that lands the step inside the frame.                                  | Locks implementation onto a minimal change at named integration points.        |
| **commit-phase-sequence**         | The ordered phase-sequence **and** each phase's exit-criteria — closing on the granularity-cut where every piece yields to a method.      | Fixes the plan: a checkable sequence decomposed to method-bearing pieces.      |
| **commit-cause-or-inconclusive**  | The cause the evidence supports **and** its blast-radius — or **INCONCLUSIVE** when the evidence does not converge.                       | Closes the diagnosis on a grounded root cause, or honestly on "not knowing."   |
| **commit-dimensions-and-oracles** | The dimension-set **and** its oracles — what is checkable now versus what reports **ERROR**.                                              | Settles the verification scope and which axes can actually be judged this run. |
| **commit-ranked-verdict**         | The ranked finding-set **and** the overall verdict — each finding's severity fixed on the ladder, closing on the bench-weighed judgement. | Produces one ranked, weighed review verdict rather than a flat complaint list. |
| **commit-view-and-source**        | The diagram/section to write **and** the source-of-truth it must mirror; closes on the representation.                                    | Fixes which view to author and which runtime truth it is bound to mirror.      |
| **commit-faithful-entry**         | The faithful entry — the observed/inferred split, the cited coordinates, the subject's own words.                                         | Commits the chronicle entry as a coordinate-cited, witness-honest record.      |
| **commit-dump-scope**             | The dump's scope **and** partition; fixes the observed/inferred boundary; decides which divergences to re-point.                          | Bounds the introspection dump and labels each datum observed-vs-inferred.      |
| **commit-fittest-cut**            | The fittest cut — closes σ\*-search and selects the anchor **and** partition that win the OntoClean tests.                                | Ends naming/partition search on the canonical anchor and cleanest cut.         |

## How an agent composites it

An agent does **not** carry the whole organ. It imports the **single satisficing value held for its
kind** — the one it cites in its `agent/<name>.md` selection vector (the source of truth for who holds
what) — alongside its other organs (persona, role, objective, reasoning-strategy, and so on). That one value
becomes the agent's commitment contract: the specific thing it closes reasoning-strategy onto every turn it
acts.

Satisficing sits downstream of **reasoning-strategy** (which weighs the options) and upstream of **output-format**
(which emits the chosen action) — it is the hinge between them. Because each value is bound to exactly
one holder, the mapping is unambiguous: cite the cell that fits your craft in your selection vector, compose it, and you have
inherited precisely the commitment discipline that fits what you build. New craft → mint a new value
tailored to what that craft commits _onto_ (and its honest "cannot resolve" verdict, if it has one);
never stretch an ill-fitting one.
