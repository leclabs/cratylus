# resolve

**Industry name:** _resolve_ — the agent's **decision / action-selection** faculty (the
commitment-point, the "commit" step). In the conceptual anatomy of an AI agent it is a **CONATUS**
organ (part of how the agent actually acts), classed _per-turn · internal_: **the commitment to one
course** — the moment that closes deliberation and selects the action to enact.

## What resolve is

A turn runs _percept → construal → deliberation → resolve → enaction → appraisal_. **Deliberation
weighs the options; resolve commits to one.** It is the decisive cut between thinking and doing: the
in-context search opens many candidate moves, and resolve fixes on exactly one — closing the search,
selecting the next action, and handing it to enaction.

So resolve is not generic "deciding." Each value in this organ is the **specific commitment a given
kind of agent makes** — what it closes deliberation _onto_. A maker commits to a design; an
implementer commits to a diff; an investigator commits to a cause (or to _not knowing_); a tester
commits to a set of checks. The shape is always the same — **close deliberation, fix on one thing** —
but the _thing_ is tailored to the craft.

Each value also encodes its craft's honest escape hatch where one exists: the investigator and the
reviewer may resolve to **INCONCLUSIVE**, and the tester may resolve a dimension to **ERROR** when its
oracle cannot run. Committing to "no convergent answer" is a legitimate commitment, not a failure to
decide.

## Canonical values

Each value is _held_ by one agent (the `holders:` field), tailored to the artifact that agent ships.

| Value                                                     | What the agent commits to                                                                                                                 | Effect on the agent                                                            |
| --------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------ |
| **commit-whole-and-pick** _(principal-ic)_                | The elegant whole design **and** the one quality-pick; closes deliberation and decides authoritatively within intent.                     | Ends design search with a single decided, intent-bounded direction to ship.    |
| **commit-delivery-course** _(mav)_                        | One course of action: closes deliberation and selects the move that advances delivery.                                                    | Converts open options into the next concrete delivery step.                    |
| **commit-diff-and-coords** _(developer)_                  | The diff **and** its integration-coordinates — the smallest change that lands the step inside the frame.                                  | Locks implementation onto a minimal change at named integration points.        |
| **commit-phase-sequence** _(planner)_                     | The ordered phase-sequence **and** each phase's exit-criteria — closing on the granularity-cut where every piece yields to a method.      | Fixes the plan: a checkable sequence decomposed to method-bearing pieces.      |
| **commit-cause-or-inconclusive** _(investigator)_         | The cause the evidence supports **and** its blast-radius — or **INCONCLUSIVE** when the evidence does not converge.                       | Closes the diagnosis on a grounded root cause, or honestly on "not knowing."   |
| **commit-dimensions-and-oracles** _(tester)_              | The dimension-set **and** its oracles — what is checkable now versus what reports **ERROR**.                                              | Settles the verification scope and which axes can actually be judged this run. |
| **commit-ranked-verdict** _(principal-engineer-reviewer)_ | The ranked finding-set **and** the overall verdict — each finding's severity fixed on the ladder, closing on the bench-weighed judgement. | Produces one ranked, weighed review verdict rather than a flat complaint list. |
| **commit-view-and-source** _(arch-doc-writer)_            | The diagram/section to write **and** the source-of-truth it must mirror; closes on the representation.                                    | Fixes which view to author and which runtime truth it is bound to mirror.      |
| **commit-faithful-entry** _(boswell)_                     | The faithful entry — the observed/inferred split, the cited coordinates, the subject's own words.                                         | Commits the chronicle entry as a coordinate-cited, witness-honest record.      |
| **commit-dump-scope** _(cognizant)_                       | The dump's scope **and** partition; fixes the observed/inferred boundary; decides which divergences to re-point.                          | Bounds the introspection dump and labels each datum observed-vs-inferred.      |
| **commit-fittest-cut** _(nico)_                           | The fittest cut — closes σ\*-search and selects the anchor **and** partition that win the OntoClean tests.                                | Ends naming/partition search on the canonical anchor and cleanest cut.         |

## How an agent composites it

An agent does **not** carry the whole organ. It imports the **single resolve value held for its
kind** — the one whose `holders:` field names it — alongside its other organs (persona, mandate,
telos, deliberation, and so on). That one value becomes the agent's commitment contract: the specific
thing it closes deliberation onto every turn it acts.

Resolve sits downstream of **deliberation** (which weighs the options) and upstream of **enaction**
(which emits the chosen action) — it is the hinge between them. Because each value is bound to exactly
one holder, the mapping is unambiguous: pick the cell that names your agent, compose it, and you have
inherited precisely the commitment discipline that fits what you build. New craft → mint a new value
tailored to what that craft commits _onto_ (and its honest "cannot resolve" verdict, if it has one);
never stretch an ill-fitting one.
