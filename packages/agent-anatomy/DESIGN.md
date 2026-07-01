# agent-anatomy — design (first principles, industry-grounded)

> Reduce raw information to a canonical idea-graph, and **regenerate semantically-equivalent artifacts for any `(reader, harness)`** under a **round-trip guarantee** — the regenerated artifact reconstructs the source's load-bearing meaning.

The engineering is largely a solved problem under other names (MDE, lenses, SHACL, DITA); agent-anatomy **adopts** that stack ([[adopt-the-commons]]) and adds a narrow, named novelty (§2).

## 1. Adopt the commons — the mature stack

| agent-anatomy's piece                         | mature industry exemplar                                                                                         |
| --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------- |
| canonical idea-graph + **reflexive** schema   | **MDE**: MOF/Ecore metamodel (self-describing — conforms to itself); models conform to it. Equiv. **RDF/OWL**.   |
| schema validation; gap/dup/orphan detection   | **SHACL** (shapes validate, document, find redundancies/orphans/broken refs) = `verify.py`                       |
| templated regeneration of artifacts           | **Model-to-Text** (OMG MOF M2T; Acceleo/Xpand) + **single-source publishing / DITA / COPE**                      |
| "reconstruct the meaning" round-trip          | **bidirectional transformations / lenses**: `get/put`, laws GetPut `put(get s) s = s`, PutGet `get(put v s) = v` |
| front-matter as cache (`kind`, `delineation`) | **DB normalization + materialized views**                                                                        |

Adopt this stack; do not rebuild it.

## 2. The novelty (narrow, real)

1. **LLM-reduction intake to best-fit prior-anchors.** Standard graph construction is _extraction_ (entities + open predicates), tolerant of redundancy; agent-anatomy does _reduction_ to MECE exemplars whose identity is a **dense name carrying [[latent-priors]]** — a perfect anchor needs no description (the name _is_ the meaning; description is residual).
2. **The reader-prior projection axis.** MDE/DITA project to syntax; agent-anatomy adds an orthogonal transform parameter — the reader's prior-density ([[reader-prior-projection]]): delineation size = the reader-gap, → 0 for a reader who already holds the prior.
3. **One composition edge.** RDF admits open predicate sets; agent-anatomy constrains to a single relation (composition); projection = composition-with-context-nodes — an opinionated reduction.
4. **Prior-anchored frame** ([[latent-priors]]) — the _why_: the reader already holds the best word's meaning; maps formally to ontology/exemplar.

## 3. The model

### 3.1 Source — a typed idea-graph (≈ RDF / MDE model)

- **Nodes**: atomic anchors (meaning = the name's latent-prior; irreducible) · composites (meaning = edges + **delta**) · context-nodes (`kind`, `subject`, `scope`, `reader`, `harness`).
- **Value-properties** (literals, not ideas): `name` (intrinsic) · `keypair`/`tools` (extrinsic).
- **One edge: composition** (flavors `embodies`/`invokes`/`references` = the constituent's kind; `is-a`/`serves`/`under` = composition with a context-node). Directional: down = composition, up = generation.

### 3.2 Schema — a reflexive metamodel (≈ MOF / OWL)

Kinds, relations, and context-types are **nodes**: the metamodel lives _in_ the graph (self-describing). `classification` is itself a kind — a well-founded fixpoint (MOF reflexivity, not a regress). `kind:` front-matter is the denormalized `is-a` edge (an O(1) materialized view); `name` is the source literal, while `kind` and `delineation` are derived caches.

### 3.3 Validation (≈ SHACL)

A _shape_ per kind (required edges, allowed constituent-kinds). `verify.py` checks schema-conformance, reference-integrity (no dangling/piped), MECE (no duplicate anchors), and the round-trip (§3.5).

### 3.4 Projection — regeneration by template (≈ M2T + DITA): the crux

`project(node | sub-graph, reader, harness, subject, scope) → artifact`, via a **template** keyed on `(kind, reader, harness)`, on two separable axes:

- **harness → form** — the M2T template: the syntactic shape (a `.md` agent def, a `SKILL.md`).
- **reader → density** — audience-adaptive: spell out only the prior-gap; a perfect-prior reader → minimal.

The pipeline realizes this as four pure stages — compose → decorate → render → place — translating through one canonical-superset IR ([[canonical-superset-ir]]); the concrete components are in `TOOLKIT.md`. Artifacts carry provenance ([[generated-artifact-provenance]]), regenerate without clobbering hand-edits ([[regenerate-without-clobbering]]), and never overwrite self-authored SELF ([[substance-over-accident]]).

### 3.5 The round-trip guarantee (≈ lens laws) — the requirement

- **intake = `put`** (raw → source-graph); **projection = `get`** (source-graph → artifact).
- **GetPut** — re-intaking a projection yields the same source: a generated artifact round-trips to its source equivalent-or-better (nothing added/lost on the floor).
- **PutGet** — projecting an intake recovers the input's meaning: a reader of that type reaches the same load-bearing verdict from the projection as from the source ([[decision-identity]]), over the [[lossless-floor]].

The lens laws are the formal statement; decision-identity is the acceptance test ([[self-application-is-mandatory]]).

### 3.6 Navigation projection — computed views (≈ graph analytics)

A second projection class ([[navigation-projection]]), orthogonal to §3.4's artifact regeneration: `navigate(graph) → index`. Community detection (Louvain), centrality (betweenness → hubs/god-nodes), and bridge/surprise detection emit a **navigable map** a reader uses to _find_ the right anchor — not a per-node artifact. These algorithms compute _over_ the graph; they are not _in_ it, and their topology describes the reconstruction, never the source `[[ ]]` graph ([[verify-at-the-source-not-the-projection]]).

## 4. Architecture

- **Store** — flat anchor-keyed cells (graph-in-files); a real graph store is adopted only when scale forces it ([[defer-the-package-boundary]]).
- **Validator** — `verify.py`: SHACL-style shapes + round-trip checker.
- **Projector** — the compose → decorate → render → place pipeline (`TOOLKIT.md`), parameterized on reader × harness, projecting `kind: agent` (→ `.claude/agents/<n>.md` + self-authored SELF/MEMORY/EPISODIC layers) and `kind: skill` (→ `.claude/skills/<n>/SKILL.md`). Default `(strong-llm, claude-code)`.
- **Glossary projector** — `glossary.py`: the second projection of the same source-graph (human reader / doc harness) → `GLOSSARY.md`, demonstrating single-source / multi-projection concretely.
- **Intake** (`put`) — `intake.py`: the deterministic scaffold (IDF-weighted lexical pre-filter + route/mint validation) around the irreducibly-semantic [[semantic-partition]] → [[anchor-routing]] call.

## 5. Adopt vs build

- **Adopt** (don't rebuild): the graph/metamodel model (RDF/MOF concepts), the lens-law round-trip discipline, M2T templating (Acceleo-style), SHACL-style validation, single-source/COPE projection.
- **Build** (the delta): the LLM-reduction intake; the reader-prior projection templates; the one-edge schema.
- **Don't**: stand up a heavyweight EMF/RDF stack prematurely ([[minimalism]]); keep the file-graph until scale forces the store.

---

### Sources

MDE / MOF / Acceleo M2T: [EMF survey](https://wiki.eclipse.org/images/d/dc/Report.external.bvs.pdf) · [MDE + formal proof](https://link.springer.com/article/10.1007/s11334-020-00366-3) · lenses / bx: [Three Approaches to Bidirectional Programming (Foster et al.)](https://www.cs.cornell.edu/~jnfoster/papers/ssgip-bidirectional.pdf) · [BX intro (Gibbons, Oxford)](https://www.cs.ox.ac.uk/projects/tlcbx/ssbx/intro.pdf) · [Complete Picture of Lens Laws](https://arxiv.org/pdf/1910.10421) · DITA / COPE: [What is DITA (MadCap)](https://www.madcapsoftware.com/products/ixia-ccms/what-is-dita/) · [Structured content](https://medium.com/@atharkharal/what-is-dita-xml-why-structured-content-is-the-future-of-documentation-95b238a7febb) · SHACL: [What is SHACL (Ontotext)](https://www.ontotext.com/knowledgehub/fundamentals/what-is-shacl/) · [Ontologies for technical docs](https://medium.com/@nc_mike/ontologies-and-knowledge-graphs-for-technical-documentation-297a91b52c15) · reader-adaptive generation: [Audience adaptation NLP validation](https://www.mdpi.com/2076-3417/15/12/6791) · [Context compression for personalized LLMs](https://arxiv.org/pdf/2602.07778)
