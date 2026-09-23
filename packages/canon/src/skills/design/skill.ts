import type { Skill, SkillExpression } from '../../manifest.js';

// THE DURATIVE HALF. `plan` and `deliver` are per-effort and disposable; this cell
// is the one that persists, and that asymmetry is the whole point of the trio.
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
C      ≜ the concept lattice ⟨the project's durative record⟩
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
digest : ℘(C) → hash ⟨content address of a piece⟩
pin    : Piece ⇀ hash ⟨the digest a piece was DERIVED from · carried with it⟩
Phase  ≜ { live, superseded }
phase  : C → Phase
supersededBy : C ⇀ C
commit ≜ a VCS commit ⟨the append-only carrier · attribution ∧ order⟩
amends : commit × C → 𝔹
accepts : commit → 𝔹 ⟨the commit carries an acceptance @ deliver⟩
realizes : unit ⇀ anchor @ plan
yield  ≜ what execution established ∧ ¬ derivable from C @ deliver
self   ≜ the principal ⟨the design-holder · ¬ delegable⟩
author : C ⇀ self

∀ c : ∃! anchor(c) ∧ ∀ a ∈ dom(denotes) : ∃! denotes(a) ⟨one name ⇔ one concept⟩
∀ c : conform(anchor(c)) ∧ gloss(c) ≠ ∅
∀ c : closure(c) finite ⟨factors acyclic ∴ a lattice, ¬ a graph⟩
amend(C) ≜ supersede ⟨∄ overwrite ; a live c is NEVER edited in place⟩
    ⟨the protection is ¬ a rule about honesty : an editable lattice lets the agent
     adjust the concept its artifact failed, ∴ acceptance-against-C goes CIRCULAR
     with one extra step ∧ the loop manufactures its own evidence⟩
supersede(c, c') ⇒ phase(c) := superseded ∧ supersededBy(c) = c' ∧ c ∈ C
    ⟨residence, ¬ deletion : a reader of the CURRENT state sees the history without
     a VCS query ∴ the lattice is self-describing⟩
∀ k : amends(k, c) ⇒ ¬ accepts(k) ⟨THE separation · an amendment and an acceptance
    it bears on are two acts ; fused, the second witness collapses into the first⟩
∀ k : amends(k, c) ⇒ reason(k) ≠ ∅ ⟨attribution ∧ order are what make retroactive
    justification DETECTABLE : the amendment postdates the artifact it excuses⟩
blast(c) ≜ { d ∈ C | c ∈ closure(d) } ⟨DERIVED, ¬ guessed · what the normal form buys⟩
churn(primitive) high ⇒ conceptualization wrong ⟨primitives near-stable · composites move⟩
⋃ cut(C) = C ∧ ∀ s₁, s₂ ∈ cut(C) : s₁ ≠ s₂ ⇒ s₁ ∩ s₂ = ∅
∀ s ∈ cut(C) : ∀ c ∈ s : closure(c) ⊆ s ⟨a piece is CLOSED ∴ plannable alone⟩
cut ⊨ self ⟨the ASSIGNMENT of concepts to pieces is the design-holder's ; a planner
    receiving a piece may ¬ redraw it · a boundary it cannot plan is SURFACED⟩
∀ s ∈ cut(C) : pin(s) = digest(s) ⟨a piece carries the digest it was derived from ∴
    an amendment mid-flight surfaces as DRIFT, ¬ executes silently⟩
yield ≠ ∅ ⇒ amend(C) ⟨intake at INCEPTION ∧ live, never at retirement : an obligation
    standing between an agent and closing its work always loses · measured 0 of 25⟩
∀ c : ∄ unit ⟨realizes(unit) = anchor(c)⟩ ⇒ SURFACE ⟨a concept nothing builds is design agreed ∧
    unbuilt · the reverse orphan is plan's⟩
design ⊨ ¬ delegable ⟨a subagent starts blank ∧ a design authored by several
    fragments BY CONSTRUCTION⟩
design ≜ conceptualize(intent) → signify(·) → materialize(·) → C ⟨bind⟩ → cut(C)` as SkillExpression;

export const design: Skill = {
  name: 'design',
  description: `use this skill to build and hold a project's DURATIVE conceptual model — the one artifact that outlives every plan: each concept's anchor, gloss and factorization, amended only by append-only supersession, and cut into closed pieces a planner can take. Reach for it FIRST on any long-horizon effort, before any work is decomposed, and again whenever execution establishes something the model does not yet hold. It is what acceptance is judged against, so without it verification has no referent and degrades into re-reading the executor's own claim.`,
  formalBlock: FORMAL_BLOCK,
  composition: () => [],
};
