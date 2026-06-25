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

A value cell in this organ is one named **output form** — the characteristic _shape_ an agent's act
takes when it lands. The set is carved by the form of the thing emitted, not by which agent emits it:
prose, code, a document, a structured payload, a bounded verdict, a visual, or a side effect. An
agent binds a value by citing `enaction [[value]]` in its `agent/<name>.md` selection vector — the
vector is the single source of truth.

## The canonical values

| Enaction                | What it is                                                                                                                                                                         |
| ----------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **natural-language**    | Free-form prose/conversational text for a human reader — explanations, answers, summaries, dialogue — with no enforced schema or machine contract.                                 |
| **code**                | Source in a programming/markup/query language (functions, scripts, SQL, config-as-code, patches/diffs) intended to be executed, compiled, or applied.                              |
| **document**            | Long-form composed artifact with sections/headings/citations (report, spec, README, article) — structured for human reading and persistence beyond one turn.                       |
| **structured-data**     | Machine-parseable payload conforming to a schema — JSON/YAML/XML/CSV/key-value — consumed by another program, not primarily read by a human.                                       |
| **structured-decision** | A bounded selection from a fixed option space — classification label, score, ranking, route, or yes/no verdict; terse adjudication rather than open generation.                    |
| **visualization**       | Visual/graphical artifact — chart, diagram, plot, table-as-figure, rendered image/UI mockup — encoding information spatially rather than in linear text.                           |
| **action**              | Side-effecting actuation in an external system (tool/API call, file write, command, message send, physical actuation) where the output is a state change, not a returned artifact. |

## How an agent composites enaction

An agent does not inline an output format; it _holds_ an enaction form. An agent binds a value by
citing `enaction [[value]]` in its `agent/<name>.md` selection vector — the vector is the single
source of truth. Enaction is where an agent's role becomes visible as a thing in the world: the form
it emits is the move it was built to make.
