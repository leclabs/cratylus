# enaction

**Industry name:** _action_ / _act_ / _tool-call output_ — an agent's **emitted action**, the
single thing it actually puts into the world this turn.

In the conceptual anatomy (`docs/agent-conceptual-anatomy.md`), **Enaction** is the _per-turn act_
under the **per-turn · external** cell: after the turn's percept is taken up, construed, deliberated,
and resolved, enaction is the action _emitted_ — the tool call or token stream actually put into the
world. It is the only organ that leaves the agent and reaches reality; everything upstream is
internal preparation, everything downstream (appraisal) is reading the result. Where `competence`
says what an agent _can_ do and `resolve` is the commitment to one course, enaction is the doing
itself — the move made flesh as an artifact.

A value cell in this organ is one named **enaction signature** — the characteristic _shape of output_
an agent emits when it acts. It names the artifact form (diff, table, plan, finding, dump, chronicle,
review, answer) and the discipline that production obeys. Each cell carries a `holders:` line naming
the archetypes that composite it; a signature is the action an agent is built to ship.

A recurring discipline across the corpus is **R=LLM density** — emitting at the register fitted to a
machine reader (terse, coordinate-cited, no human-prose padding), the working register most of these
agents act in.

## The canonical enaction signatures

| Enaction                         | What it is                                                                                                                                                                                | Effect on the agent                                                                                                                      |
| -------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **emit-chronicle-entry**         | Emit the chronicle entry — the coordinate-cited record, or the dense answer — at R=LLM density.                                                                                           | The agent acts by laying down a faithful, citation-anchored record of what happened.                                                     |
| **emit-cited-finding**           | Emit the evidence-cited finding — repro-steps, causal chain to structural origin, blast radius, observed/inferred split, refuting coordinates — at R=LLM density; no remedy.              | The agent ships diagnosis, not repair: it reports what is happening, evidenced, and stops short of the fix.                              |
| **emit-context-dump**            | Emit the labeled context-dump — inputs, instructions, tools, state, constraints, blind-spots, each tagged observed\|inferred — at R=LLM density; re-point divergences to canonical homes. | The agent makes its own working context legible, and corrects drift by pointing each item back to its true source.                       |
| **emit-diff-test-pr**            | Emit the diff, run the happy-path test, and author the coordinate-citing PR.                                                                                                              | The agent ships a realized change as a reviewable unit: code + a passing test + a PR whose claims cite coordinates.                      |
| **emit-doc-edit**                | Emit the doc edit — updated C4/arc42 view, diagram source, or prose caption — pinned to its verified source-of-truth.                                                                     | The agent acts on the documentation, keeping every view pinned to the runtime it describes.                                              |
| **emit-fenced-review**           | Emit the structured fenced review at R=LLM density — verdict, severity-ranked findings (coordinate + frame-tag + concrete fix each), and the positive signal.                             | The agent delivers a weighed judgment: a verdict plus actionable, located findings and the good news too.                                |
| **emit-sharded-plan**            | Emit the plan as a sharded-plan-layout — ordered, file-level, granularity-aware phases each with its falsifiable exit-criterion — at R=LLM density.                                       | The agent's action _is_ the plan: an ordered, checkable decomposition rather than execution.                                             |
| **emit-verdict-table**           | Run the oracles and emit the per-dimension PASS/FAIL/ERROR table plus a structured failure-report for every FAIL — at R=LLM density.                                                      | The agent acts by adjudicating correctness across dimensions and reporting each failure structurally.                                    |
| **exemplify-pass\|dense-answer** | Emit the exemplify pass (routed cells + composites) or the dense answer — at R=LLM density.                                                                                               | The agent ships either an optimized corpus delta (cells routed to homes) or a direct dense answer.                                       |
| **ship-artifact-ink-delta**      | Ship the artifact — emit the diff/decision/dense-answer at the agent register — inking only the delta.                                                                                    | The agent ships the smallest sufficient change: it writes the difference, not the whole.                                                 |
| **ship-code-plan-build**         | Emit the action — code/plan/build edit, the tool call, or the dense answer — at R=LLM density.                                                                                            | The agent's broad delivery move: whatever the turn calls for — code, plan, build, tool call, or answer — emitted and put into the world. |

## How an agent composites enaction

An agent does not inline an output format; it _holds_ an enaction signature. Each cell names its
`holders:`, and an agent's archetype gathers the signature it ships:

- **boswell** holds `emit-chronicle-entry`; **investigator** holds `emit-cited-finding`;
  **cognizant** holds `emit-context-dump`.
- **developer** holds `emit-diff-test-pr`; **arch-doc-writer** holds `emit-doc-edit`;
  **planner** holds `emit-sharded-plan`.
- **principal-engineer-reviewer** holds `emit-fenced-review`; **tester** holds `emit-verdict-table`.
- **nico** holds `exemplify-pass-or-dense-answer`; **principal-ic** holds `ship-artifact-ink-delta`;
  **mav** holds `ship-code-plan-build`.

Enaction is where each agent's role becomes visible as a thing in the world: the specialists each
ship one characteristic artifact (a finding, a table, a plan, a review), while the principal genera
(`principal-ic`, `mav`) carry the broad-spectrum _ship-the-action_ signature that emits whatever the
turn demands. One agent, one signature — the move it was built to make.
