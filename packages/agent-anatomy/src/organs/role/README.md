# role

> The self-declared scope of office: what an agent claims to be for, and — by omission — what it disclaims.

**What this is.** `role` is one organ in the agent's conceptual anatomy (the **STANCE** half — how
the agent comes across, not what it is driven to do; see
[`docs/agent-conceptual-anatomy.md`](../../../docs/agent-conceptual-anatomy.md)). In the language of
org and law it is the agent's **remit** or **charter of office** — the boundary it presents as its
own. Each cell here states a remit as a claim (`≜ …`) that folds in its own disclaimer (what is _not
this — that is someone else's office_). The mandates are deliberately disjoint: read together they
carve the maker's world into non-overlapping offices, so any task lands in exactly one office's
remit.

A role is the office an agent _presents_; it is distinct from the goal it _pursues_
([`objective`](../objective)) and the limits it _obeys_ ([`guardrails`](../guardrails)). The same boundary can show
up as a face here and as a drive there — that split is intentional.

## The canonical values

Each is a value cell (`kind: role`); the office is the `≜` claim, and the boundary it disclaims is
stated inline.

- **[`implement`](implement.md)** — owns producing/modifying the artifact (code, config, content) to
  satisfy a spec; out of scope: deciding what to build or independently signing off on the result.
- **[`review`](review.md)** — owns judging an existing artifact against criteria (correctness, style,
  security, fit) and returning a verdict + findings; does not author the fix.
- **[`diagnose`](diagnose.md)** — owns locating the root cause of an observed
  defect/failure/anomaly and explaining the mechanism; does not own shipping the remedy.
- **[`plan`](plan.md)** — owns decomposing a goal into ordered, scoped steps/tasks and sequencing
  them; does not execute the steps.
- **[`research`](research.md)** — owns answering an open question by gathering, weighing, and
  synthesizing external/internal sources into cited findings; does not change the system.
- **[`document`](document.md)** — owns producing reader-facing explanatory text (guides, references,
  ADRs, comments) that describes a system or decision; does not alter the system it describes.
- **[`test`](test.md)** — owns designing and running checks (cases, fixtures, harnesses) that
  exercise an artifact to surface defects, reporting pass/fail evidence; does not fix what it finds.
- **[`orchestrate`](orchestrate.md)** — owns dispatching, sequencing, and integrating the work of
  other agents/subtasks toward a goal; does not perform the delegated work itself.
- **[`operate`](operate.md)** — owns running and maintaining a live system in steady state (deploy,
  monitor, respond, remediate) against operational SLOs; not feature development.
- **[`curate`](curate.md)** — owns a body of canonical knowledge or standards end-to-end — define,
  partition, steward, and ship the shared vocabulary or corpus others build on.
- **[`architect`](architect.md)** — owns the system's structure — decide the architecture and the
  boundaries within which implementation happens; disclaims the line-level build.
- **[`build`](build.md)** — owns the creation of a system end-to-end — conceive, design, produce, and
  deliver it; the master builder of a domain who owns every lifecycle phase. (End-to-end: no phase
  disclaimed — contrast `implement`/`architect`, which own a single slice.)
- **[`converse`](converse.md)** — sustains an interactive dialogue as the deliverable itself — companion,
  coach, tutor, interlocutor; the exchange is the product, not a means to a downstream artifact.

## How an agent composites a role

An agent does not write a role from scratch — it **holds** one. An agent binds a value by citing
`role [[value]]` in its `agent/<name>.md` selection vector — the vector is the single source of
truth, and the resolver inlines the held role as the agent's presented office. Because the
mandates are mutually disjoint and each disclaims the next office over, the set composes into a clean
division of labor: the office an agent presents is exactly the office no other holder claims.
