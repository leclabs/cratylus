# agent-anatomy — exemplar glossary

<!-- GENERATED from packages/agent-anatomy/ideas/ by toolkit/glossary.py (human-reader / doc-harness projection). Do not hand-edit; regenerate. -->

> 27 exemplars, one browsable index — a second projection of the same source-graph that `resolve.py` renders to agent defs. Single-source publishing: the projection is not the source.

## Structures

_relational arrangements — rosters, schemas, layouts._

- **memory** — An ambient person-agent's memory — the one home for the whole lifecycle (encode → dream → wake) and the model behind it: resident layers (SOUL commons-fixed; SELF, MEMORY, EPISODIC self-authored) plus outward homes (AGENTS.md, vault), where every memory is placed by two orthogonal axes — type/voice picks the organ, scope picks the instance — so one agent stays one person across fleet, user, and project.

## Agents

_composites — primitives bound to a maker role._

- **arch-doc-writer** — arch-doc-writer ≜ ⊕{organ ↦ value}
- **boswell** — boswell ≜ ⊕{organ ↦ value ∈ {organ}-catalog}
- **cognizant** — cognizant ≜ ⊕{organ ↦ value}
- **developer** — developer ≜ ⊕{organ ↦ value}
- **investigator** — investigator ≜ ⊕{organ ↦ value ∈ {organ}-catalog}
- **mav** — mav ≜ ⊕{organ ↦ value}
- **nico** — nico ≜ ⊕{organ ↦ value}
- **planner** — planner ≜ ⊕{organ ↦ value ∈ {organ}-catalog}
- **principal-engineer-reviewer** — principal-engineer-reviewer ≜ ⊕{organ ↦ value ∈ {organ}-catalog}
- **principal-ic** — principal-ic ≜ ⊕{organ ↦ value}
- **tester** — tester ≜ ⊕{organ ↦ value}

## Skills

_composite capabilities._

- **carry-on** — use this skill when the Operator utters the re-dispatch word — "weitermachen", "carry on", "proceed" — closing a check-in and returning you to execution; standing intent unchanged, execution authority re-affirmed, no fresh permission owed.
- **conceptualize** — use this skill to conceptualize a corpus — read a multi-modal source and resolve it to the reader's concept lattice (the closed distinction-sets `C_R`, which of them are primitive, each primitive's gloss, and each concept's candidate factorizations), deciding nothing about names or material form; stage 1 of exemplify, independently invocable.
- **create-agent** — author a custom agent as an organ-selection vector — pick each organ's value from the canonical catalog (closed enums + generalized open sets), compose the agent/<name>.md vector, then resolve → verify → deploy; knows the organ anatomy. Can interview a non-engineer in plain language (one question per organ, recommended default first) when a human is driving.
- **create-skill** — author a well-formed skill cell — kind:skill front-matter (delineation + trigger), a verb H1, the first-prose-≜ composition formula with a Bindings line, and a self-sufficient set-builder formal block (declarations-above / laws-below) at R=LLM density; embodies the composer conventions, the symbol-table discipline, and the verify gates so the cell passes on the first resolve.
- **dream** — use this skill to consolidate an agent's memory — distil the raw EPISODIC stream and route each item by two orthogonal axes (type/voice picks the organ, scope picks the instance): identity rises to SELF, durable knowledge to MEMORY, directives to the scoped AGENTS.md, networked reference to the vault, next-steps stay in EPISODIC, the rest is dropped; consumed raw is cleared; SOUL is never written.
- **elicit** — use this skill to elicit the operator's hidden intended concept — recover it by asking maximally-informative yes/no questions, each a distinction that bisects the live candidates by prior mass (binary-search / information-gain over the concept lattice), converging in the fewest questions; the active, query-driven counterpart to [[probe]] (which reads a signifier already given) — stop when one candidate survives or no question is worth its burden, then hand the recovered concept to [[signify]] to name.
- **exemplify** — optimize a context corpus into a canonical semantic factorization — compose produce → name → realize over the one concept-contract record, then gate on accept; emits the R3 routing manifest that catches the dropped idea.
- **formalize** — use this skill to convert prose — especially of a process or skill — into a self-sufficient set-builder block under self-sufficient-formalism: conceptualize the prose to its entities/operations/laws, signify each as a symbol (minting or boundary-binding to an anchor), and emit declarations-above / laws-below with no explanatory prose; accept only on round-trip equivalent-or-better.
- **handoff** — use this skill to prepare a session for handoff before /clear — bring the plan's record up to date (praxis sync) and consolidate memory (dream) while context is still hot; the persist half of the session boundary, invocable as /handoff.
- **introspect** — use this skill to introspect an agent's organ configuration — recover each organ's DEFINED value (its SOUL / organ-vector selection) and INDEPENDENTLY observe the runtime value actually in effect this session, compare organ-by-organ, and for every divergence name the cause (harness override · deploy drift · profile projection · transient elevation like carry-on · composer-dropped facet · unobservable); emits a per-organ def-vs-runtime table plus a summary of material divergences. Reach for it to self-audit configuration or to chase a definition↔runtime mismatch (the color/mark regression class).
- **materialize** — use this skill to realize a concept lattice as artifacts — select each concept's canonical factorization `F_R`, emit the bipartite normal form `CSF_R` (a primitive by value as ⟨anchor, gloss⟩, a composite by reference as ⟨anchor, factor-anchors⟩), then realize under an explicitly named strategy whose kind-consumption table ρ refuses loudly when unnamed; stage 3 of exemplify, independently invocable.
- **praxis** — Create and work durable, sharded plans (sharded-plan-layout dirs) — reached by planning intent, not a command grammar; task state is the folder a task-file sits in (pending/ready/active/completed), PLAN.md mirrors it, and `list` is the one explicit affordance.
- **probe** — use this skill to probe a signifier — read out the latent priors a word, phrase, or candidate name fires in the reader (`fired_R`, [[signify]]'s decoder `dec_R` generalized off its assigned anchors) and the concept they circumscribe; the forward, no-commit inverse of [[signify]], for discovering the concept latent in a name or experimenting with candidate anchors before committing — a keeper crystallizes through [[signify]].
- **signify** — use this skill to name a concept set — assign each concept its injective canonical anchor `α(c) = σ*_R(c)` (the reader-relative fittest sign, whose latent priors circumscribe exactly it; one name ⇔ one concept), then coalesce concepts that resolve to the same anchor; emits the shortlex order `≺` and the decoder `dec_R`; stage 2 of exemplify, independently invocable (every naming review is a bare /signify).
- **wake** — use this skill to reconstitute an agent at session start — run the WAKE sequence (dream → load → orient → resume) so it resumes as the same individual; the read-and-resume counterpart to /dream, invocable as /wake.
