import type { Skill, SkillExpression } from '../../manifest.js';

// THE DURATIVE HALF. `plan` and `deliver` are per-effort; this cell is the one that
// persists across every effort, and that asymmetry is the whole point of the trio.
//
// It exists because the corpus could DO long-horizon work and could only THINK in
// single sittings: every conceptual cell (conceptualize · signify · materialize ·
// exemplify) is episodic — invoked on a source, emits a result, finishes — while the
// planning cell alone bound, elected and persisted across sessions. So a project's
// concepts were re-derived per session, per agent, forever. The superseded `praxis`
// measured exactly that against itself: sixteen retired plans, twenty-five laws
// established, zero surviving into any corpus.
//
// The second reason is verification. Acceptance keyed to a work-unit's own criteria
// is a CLOSED loop — the unit is graded against its own account of itself, so an
// executor that satisfies the letter passes while the system stays incoherent. A
// second, independent statement of what should exist is what makes validation an
// operation rather than a re-reading of the claim. That statement is this lattice.

const FORMAL_BLOCK = `anchor ≜ a concept's canonical sign @ signify
gloss  ≜ what a concept IS ⟨one line · reconstruction-grade⟩
C      ≜ the concept lattice ⟨the project's durative model⟩
c      ≜ a concept ⟨c ∈ C⟩
concept ≜ ⟨ anchor(c) , gloss(c) , factors(c) ⟩
factors : C → ℘(C) ⟨what c decomposes into⟩
primitive(c) ⇔ factors(c) = ∅ ⟨held by VALUE ⟨anchor · gloss⟩⟩
composite(c) ⇔ factors(c) ≠ ∅ ⟨held by REFERENCE ⟨anchor · factor-anchors⟩ @ materialize⟩
closure : C → ℘(C) ⟨closure(c) ≜ { c } ∪ ⋃ { closure(f) | f ∈ factors(c) }⟩
denotes : anchor ⇀ C
σ*      @ signify
conform @ signify
Piece  ≜ a cut piece ⟨what a planner is handed⟩
cut    : C → ℘(℘(C))
history(c) ≜ every version ∧ retraction of c, in order ⟨resident · ¬ deleted⟩
settled(c) ⇔ c has exactly one current version
live(c) ⇔ settled(c) ∧ that version ¬ a retraction
withdrawn(c) ⇔ settled(c) ∧ c retracted
diverged(c) ⇔ ¬settled(c) ⟨concurrent sessions wrote c differently ∧ merged · state, ¬ error⟩
incoherent(C) ⇔ a law below broken across concepts by a merge ∧ kept on each branch
yield  ≜ what execution established ∧ ¬ derivable from C @ deliver
self   ≜ the principal ⟨the architect · the design-holder · ¬ delegable⟩
author : C ⇀ self
show(C) ≜ \`scripts/design.mjs show [<concept>]\` ↦ C root to primitive ∨ one c in full
define(c) ≜ \`scripts/design.mjs define <anchor> --gloss <g> [--factors <anchor>]…\`
supersede(c) ≜ \`scripts/design.mjs amend <concept> [--anchor <a>] [--gloss <g>] [--factors <anchor>]…\` ⟨a new version of the SAME c · amending a withdrawn c reinstates it⟩
retract(c) ≜ \`scripts/design.mjs retract <concept>\` ⟨c withdrawn · no successor version⟩
reconcile(c) ≜ \`scripts/design.mjs reconcile <concept> [--anchor <a>] [--gloss <g>] [--factors <anchor>]…\` ⟨one version superseding every current version of c⟩
trace(c) ≜ \`scripts/design.mjs trace <concept>\` ↦ ⟨history(c), closure(c), blast(c)⟩ ⟨how c came to be · what it stands on · what stands on it⟩

∀ define ∨ supersede ∨ retract ∨ reconcile : \`--author <who> --reason <why> --cause <what caused it>\` ⟨a set-valued flag repeats, one member each⟩
∀ c : ∃! anchor(c) ∧ ∀ a ∈ dom(denotes) : ∃! denotes(a) ⟨one live concept per anchor⟩
withdrawn(c) ⇒ anchor(c) held until supersede(c) reinstates it
∀ c : conform(anchor(c)) ∧ gloss(c) ≠ ∅
∀ c : closure(c) finite ⟨factors acyclic ∴ a lattice, ¬ a graph⟩ ∧ ∀ f ∈ factors(c) : live(f)
∃ d : live(d) ∧ c ∈ factors(d) ⇒ ¬ retract(c) ⟨what live concepts factor on cannot be withdrawn⟩
amend(C) ≜ supersede ⟨∄ overwrite ; a live c is NEVER edited in place⟩
    ⟨the protection is ¬ a rule about honesty : an editable lattice lets the agent
     adjust the concept its artifact failed, ∴ acceptance-against-C goes CIRCULAR
     with one extra step ∧ the loop manufactures its own evidence⟩
supersede(c) ⇒ the prior version stays in history(c) ⟨residence, ¬ deletion : trace(c) reads
    the history without a VCS query ∴ the lattice is self-describing⟩
c becomes another concept ⇒ retract(c) ∧ define(c') ⟨¬ supersede : a new version is the SAME concept⟩
∀ define ∨ supersede ∨ retract ∨ reconcile : reason ≠ ∅ ⟨attribution ∧ order are what make
    retroactive justification DETECTABLE : the amendment postdates the artifact it excuses⟩
reconcile ⊨ amend(C) ∧ ¬ an acceptance ⟨THE separation · a reconciliation never shares a write
    with an acceptance it bears on ; fused, the second witness collapses into the first⟩
diverged(c) ⇒ reconcile(c) ⟨an ordinary write on c refuses⟩
incoherent(C) ⇒ repaired by ordinary writes, one at a time
reconcile ⊨ self ⟨reconciliation of the design is the architect's alone⟩
planner ∨ implementer ∨ assayer ⊨ diverged ∨ incoherent ⇒ report ∧ ¬ resolve
blast(c) ≜ { d ∈ C | c ∈ closure(d) } ⟨DERIVED, ¬ guessed · what the normal form buys⟩
churn(primitive) high ⇒ conceptualization wrong ⟨primitives near-stable · composites move⟩
⋃ cut(C) = C ∧ ∀ s₁, s₂ ∈ cut(C) : s₁ ≠ s₂ ⇒ s₁ ∩ s₂ = ∅
∀ s ∈ cut(C) : ∀ c ∈ s : closure(c) ⊆ s ⟨a piece is CLOSED ∴ plannable alone⟩
cut ⊨ self ⟨the ASSIGNMENT of concepts to pieces is the design-holder's ; a planner
    receiving a piece may ¬ redraw it · a boundary it cannot plan is SURFACED⟩
yield ≠ ∅ ⇒ amend(C) ⟨intake at INCEPTION ∧ live, never at retirement : an obligation
    standing between an agent and closing its work always loses · measured 0 of 25⟩
design ⊨ ¬ delegable ⟨a subagent starts blank ∧ a design authored by several
    fragments BY CONSTRUCTION⟩
design ≜ conceptualize(intent) → signify(·) → materialize(·) → define(c) ∨ supersede(c) → C → cut(C)` as SkillExpression;

export const design: Skill = {
  name: 'design',
  description: `use this skill to build and hold a project's DURATIVE conceptual model — the one artifact that outlives every plan: each concept's anchor, gloss and factorization, amended only by append-only supersession, and cut into closed pieces a planner can take. Its verbs show the design or one concept, define, amend, retract and reconcile a concept, and trace how one came to be, what it stands on and what stands on it. Reach for it FIRST on any long-horizon effort, before any work is decomposed, and again whenever execution establishes something the model does not yet hold. It is what acceptance is judged against, so without it verification has no referent and degrades into re-reading the executor's own claim.`,
  formalBlock: FORMAL_BLOCK,
  runtime: { capability: 'design' },
  composition: () => [],
};
