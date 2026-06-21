# competence

**Industry name:** _skills_ / _capabilities_ — an agent's consolidated **skill repertoire**.

In the conceptual anatomy (`docs/agent-conceptual-anatomy.md`), **Competence** is a _standing
drive_ under CONATUS, **persistent · internal**: the consolidated skills and know-how an agent
carries between turns — the repertoire of what it _can_ enact. Where the [`charter`](../charter)
organ says what an agent _may_ do and `telos` says what it _wants_, competence says what it is
actually _able_ to do. It is the durable craft an agent brings to the table, independent of any
single task.

A value cell in this organ is one named **competence** — a coherent bundle of mastered methods,
vocabularies, and disciplines that travels with whichever agents _hold_ it. Each cell carries a
`holders:` line naming the archetypes that composite it; one competence may be held by several
agents, and one agent composites several competences.

## The canonical competences

| Competence                        | What it is                                                                                                                                                                                                                                                                                                                                                                                        |
| --------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **broad-spectrum-making**         | Generalist making across solutions, systems, and software, design through implementation — decomplecting for simplicity, synthesizing whole designs via a pattern language, reasoning from pre/postcondition contracts, and deciding-and-shipping under commander's intent.                                                                                                                       |
| **e2e-delivery-toolchain**        | End-to-end software delivery (architecture → implementation → release) on this project's actual stacks — the koine config-IR/translator and episodic memory runtime — with fluency in the pnpm build/test/lint toolchain and Conventional-Commit discipline.                                                                                                                                      |
| **in-frame-implementation**       | Realizing a decided design as a diff _within_ a fixed architectural frame — authoring the change, unbraiding tangled concerns, integrating at composition hubs, writing the happy-path test, and opening a PR whose claims cite coordinates.                                                                                                                                                      |
| **tactical-decomposition**        | Breaking a goal into an ordered plan under a fixed frame — sizing units down to method-bearing granularity, writing a falsifiable exit criterion per phase, sharding along orthogonal concerns, and sequencing bulk-then-unit dispatch.                                                                                                                                                           |
| **praxis-sharded-planning**       | Authoring durable plans in the sharded-plan layout — task-state-as-folder, with `PLAN.md` mirroring the live state.                                                                                                                                                                                                                                                                               |
| **exemplify-pipeline**            | Running the exemplify pipeline (conceptualize → signify → materialize) to optimize context — stripping rot, bloat, and palimpsest, deriving canonical anchors, and materializing composable context modules.                                                                                                                                                                                      |
| **σ\*-signify**                   | Naming a concept — assigning each its injective, fittest, reader-relative anchor (σ\*\_R) so the name circumscribes it precisely, one name ⇔ one concept.                                                                                                                                                                                                                                         |
| **ontoclean**                     | OntoClean / formal-ontology analysis — reasoning over the identity, rigidity, unity, and dependency metaproperties to produce clean subsumption and MECE partitions.                                                                                                                                                                                                                              |
| **causal-tracing-falsification**  | Getting to the bottom of a defect — deterministic reproduction, tracing the causal chain to its structural origin, delineating the blast radius, differential diagnosis under falsification, and the evidence-citation / observed-vs-inferred discipline.                                                                                                                                         |
| **validity-analysis-oracles**     | Verifying a change — decomposing validity into dimensions, building golden-master/equivalence oracles, authoring structured failure reports (dimension · verdict · reproducing input · observed-vs-expected), regression and contract testing, and PASS/FAIL/ERROR triage.                                                                                                                        |
| **threat-modeling-frame-mapping** | Security and review across one bench — threat-modeling / data-flow analysis, severity triage on a unified ladder, mapping findings to CWE/OWASP/CAPEC frames, reviewing code, plan, architecture, and security together, and authoring coordinate-cited findings in a structured template.                                                                                                        |
| **c4-arc42-drift-repair**         | Architecture documentation — the C4 model and arc42 template, diagrams-as-code (Mermaid · PlantUML · Structurizr), recovering a codebase's true architecture by reading it, authoring ADRs, and detecting and repairing doc-vs-runtime drift.                                                                                                                                                     |
| **documentary-biography**         | Faithful chronicle from primary evidence — discriminating observed from inferred, citing coordinates (commit · file · turn), and running the memory-home rituals (dream consolidation, wake reconstitution).                                                                                                                                                                                      |
| **re-anchoring-introspection**    | Keeping an agent's working context true — the re-anchoring protocol (surface believed context → diff against canon → re-point divergences → persist out of band), observed-vs-inferred partitioning, diagnosing context pathologies as symptom-cause-fix triples, and introspecting the subagent lifecycle (inputs · instructions · tools · state · constraints · blind spots) at any loop point. |

## How an agent composites competence

An agent does not inline these skills; it _holds_ them. Each competence cell names its `holders:`,
and an agent's archetype gathers the set it brings. The repertoire is additive and shared:

- **nico** holds `exemplify-pipeline`, `sigma-signify`, `ontoclean`, and `praxis-sharded-planning`.
- **mav** holds `e2e-delivery-toolchain` and `praxis-sharded-planning`.
- **principal-ic** holds `broad-spectrum-making`.
- **developer** holds `in-frame-implementation`; **planner** holds `tactical-decomposition`.
- **investigator** (`causal-tracing-falsification`), **tester** (`validity-analysis-oracles`),
  **principal-engineer-reviewer** (`threat-modeling-frame-mapping`), **arch-doc-writer**
  (`c4-arc42-drift-repair`), **boswell** (`documentary-biography`), and **cognizant**
  (`re-anchoring-introspection`) each hold their specialty; investigator and boswell also hold
  `praxis-sharded-planning`.

The same competence reaching several agents (e.g. `praxis-sharded-planning` across nico, mav,
investigator, and boswell) is the point: competence is the _shared craft layer_, factored once and
composited wherever it is needed, rather than restated per agent.
