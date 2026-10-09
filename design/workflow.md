# Design · workflow context

The concepts of cratylus's **workflow** bounded context: the example-driven workflow cratylus ships.
Each concept is an anchor, a gloss saying what it is and why, and the concepts it is built from.
Concepts change only by supersession: a new version with its reason, recorded in this file's history.

## Context map

| Context      | Subject                                                                                       | Relation to workflow                                                                                                                            |
| ------------ | --------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **workflow** | the practice cratylus ships for building against a design                                     | this file                                                                                                                                       |
| **delivery** | getting the corpus onto a harness: projection to omp, install, uninstall, owned root, upgrade | the workflow's roles and skills are delivered by it; the workflow's behavioral examples run against agents as delivery installs them (contract) |
| **corpus**   | signs, dimensions, cells, the cold-decode oracle                                              | the workflow's roles and skills are cells of the corpus, and personas are a role plus the expertise of the contexts they hold (contract)        |

## Concepts

- **example-driven workflow** · agents produce work that realizes a meaning the operator and architect settled, judged against examples fixed before any build, within and across bounded contexts. · _built from:_ design, cut, illustration, build, judgment, whole check, release, proportionality, roles
- **roles** · the parties of the workflow and what each sees and changes; what a role can see, reach and change is enforced by the harness's own permissions and by the freeze rather than by instruction, and what a role decides is checked by examples of its behavior. · _built from:_ operator, meaning-holder, architect, illustrator, lead, builder, reviewer
- **architect** · the agent that turns the operator's intent into concepts, sorted by context, using known patterns and conventions; holds the design and every context it covers without merging their models; confirms examples with each meaning-holder and answers meaning questions; never sees the work. · _built from:_ design, illustration, meaning-holder
- **design** · every context's concepts factored down to primitives, with the context map that relates them: the north star work is accepted against. · _built from:_ concept, bounded context, context map, supersession, retirement
- **lead** · the agent that owns a cut's realization: divides its work into work packages, orders them by dependency, dispatches builders, runs judgment and the whole check, and settles every question of realization itself; it brings the architect only a meaning question or the cut's outcome, in concept terms, and never changes a concept or an example. · _built from:_ cut, work package, build, judgment, whole check
- **reviewer** · the agent that judges a cut once against the fixed rubric and the held-out results, and never builds. · _built from:_ judgment
- **builder** · the agent that owns one work package and changes only its outputs until their examples pass; it may read the rest of the work, but of the meaning it sees only its package's visible examples, and it never edits an example. · _built from:_ work package, build
- **illustrator** · the agent that writes a cut's examples cold from its concepts alone, so its examples double as the test that the concepts carry their meaning. · _built from:_ illustration
- **meaning question** · a question whose answer would change a concept or an example; only the architect settles it, and every other question about the work is settled by the lead. · _built from:_ concept, example
- **operator** · the person who states intent, holds or names each context's meaning-holder, and releases; asked nothing between approving the examples and release unless a meaning question needs them. · _built from:_ meaning-holder, release
- **meaning-holder** · the party who approves a context's examples; each context names its own, such as a product owner for a product and a creative for a film, so each meaning is confirmed by the authority it belongs to. · _built from:_ bounded context
- **proportionality** · the ceremony of a cut scales with its size and risk: a small cut is one work package with one builder and one review, so the method never costs more than the change. · _built from:_ work package
- **release** · the operator admits a cut's change to the project, the one act no agent performs. · _primitive_
- **whole check** · every suite of every affected context and every contract, run once per change; each failing run is followed by one round that fixes everything it revealed, then one more run, and rounds repeat until it holds, so the whole is shown to hold without ever re-running it once per fix. · _built from:_ contract
- **judgment** · once per cut, when the build is green: the held-out examples run, and one reviewer judges what cannot execute and whether the examples still express their concepts; a finding about the work returns to the builders as a failing case and is confirmed by re-running that case or by the reviewer re-judging that finding alone, while a finding that an example no longer expresses its concept goes to the architect as a meaning question, so acceptance is independent and the whole cut is judged once. · _built from:_ held-out example, example
- **build** · builders change their work packages until their visible examples pass, with failing cases as the only feedback, so each round can only come closer. · _built from:_ example, freeze, work package
- **work package** · the smallest part of a cut's work given to one builder: a set of outputs no other builder changes, its commit history included, with the examples of every concept those outputs serve, so no two builders can collide. · _built from:_ example
- **work** · what a cut produces, which its examples are checked against. · _primitive_
- **illustration** · turning a cut's concepts into examples before any build: a reader who did not write the concepts writes them cold, and flags every term in their wording that is neither a concept of the design nor plain industry usage; the context's meaning-holder confirms the examples and settles the flagged terms, and the examples are frozen with a share held out, so every meaning question is settled before work starts. · _built from:_ concept, example, held-out example, freeze
- **cut** · the concepts of one context realized together as one change, closed over what they depend on and sized to one reviewable change; intent that spans contexts becomes one cut per context, joined by contracts. · _built from:_ bounded context, contract
- **retirement** · a removal the design names, whose example is that the retired thing is absent from what the product delivers, so nothing is removed by guesswork and nothing retired survives. · _built from:_ example
- **context map** · the contexts of a design, which depends on which, and the contracts between them, so work that spans contexts has a stated place and nothing crosses a boundary unannounced. · _built from:_ bounded context, contract
- **contract** · examples a consuming context writes of what it needs from a context it depends on, run in both, so one context's change cannot silently break another's meaning. · _built from:_ example, bounded context
- **freeze** · once confirmed, a cut's examples and the checks that bind them cannot be changed by its builders, and tooling refuses it; an example is frozen only once its check has been seen to fail against the unbuilt work, so the criteria stay fixed while the work moves and no check that cannot fail is ever trusted. · _built from:_ example
- **held-out example** · an example withheld from builders and used only in judgment, so passing the visible examples while missing the concept is caught; it is withheld by where it is kept, outside anything a builder is given, and builders are never told that held-out examples exist, because a prohibition would announce them; when one fails they learn the concept and the shortfall but not the case, and a case revealed to fix it becomes visible and is replaced by a new held-out one. · _built from:_ example
- **example** · a concrete case of a concept, given a situation, when something happens, then what must hold; checked mechanically by execution, by assertion over delivered output or recorded agent behavior, or by scoring against a fixed rubric, so meaning becomes a description the work is measured against. · _built from:_ work
- **supersession** · a concept changes only by a new version carrying its reason, never in place and never while a build realizes it, so the target cannot be bent to fit the work. · _primitive_
- **bounded context** · a subject with its own model and vocabulary; every concept belongs to exactly one, so a word keeps one meaning wherever it is used. · _primitive_
- **concept** · what must hold and why, stated in its bounded context's own words; it names no implementation, so the work can be judged against it without the work defining it. · _primitive_

## Cuts

1. **example substrate:** example, held-out example, freeze. The example runner and the eval harness for omp agents. Built first, under ordinary test-driven development, because everything after it is judged through it.
2. **workflow roles and flow:** roles, illustration, build, judgment, whole check, judged by evals in that harness.
3. **delivery:** owned root, upgrade, install and uninstall at user scope (delivery context).
4. **personas:** mav, nico and kino restored on the new roles (corpus context); kino holds the platform and production contexts of a film-production consumer.
